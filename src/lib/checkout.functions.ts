import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CheckoutInput = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable(),
});

const GuestInfo = z.object({
  email: z.string().email().max(160),
  name: z.string().min(1).max(80),
  phone: z.string().min(8).max(20),
});

const CartCheckoutInput = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().nullable(),
  })).min(1).max(50),
  voucherCode: z.string().min(1).max(64).optional().nullable(),
  guest: GuestInfo.optional().nullable(),
});

function getOrigin() {
  const req = getRequest();
  const url = new URL(req?.url ?? "http://localhost");
  const headerOrigin = req?.headers.get("origin") || req?.headers.get("referer");
  let origin = `${url.protocol}//${url.host}`;
  if (headerOrigin) {
    try { origin = new URL(headerOrigin).origin; } catch {}
  }
  return origin;
}

async function getToyyibConfig() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: settings } = await supabaseAdmin
    .from("settings").select("value").eq("key", "toyyibpay").maybeSingle();
  const tp = (settings?.value as any) ?? {};
  return {
    userSecretKey: String(tp.user_secret_key ?? "").trim(),
    categoryCode: String(tp.category_code ?? "").trim(),
    sandbox: tp.sandbox === true,
  };
}

async function getBuyerInfo(userId: string, claims: any) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const claimEmail = String((claims as any)?.email ?? "").trim();
  const { data: profile } = await supabaseAdmin
    .from("profiles").select("full_name,phone,email").eq("id", userId).maybeSingle();
  const email = claimEmail || (profile?.email ?? "").trim();
  const name = (profile?.full_name?.trim() || (email.split("@")[0] || "Customer")).slice(0, 50);
  const rawPhone = (profile?.phone ?? "").replace(/\D/g, "");
  const phone = rawPhone.length >= 9 ? rawPhone : "60123456789";
  return { email, name, phone };
}

export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CheckoutInput.parse(input))
  .handler(async ({ data, context }): Promise<{ url?: string; orderId?: string; error?: string }> => {
    const { userId, claims } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: product, error: pErr } = await supabaseAdmin
      .from("products").select("*").eq("id", data.productId).eq("status", true).maybeSingle();
    if (pErr || !product) return { error: "Product not found" };

    let amount = Number(product.base_price);
    let variantName: string | null = null;
    if (data.variantId) {
      const { data: variant } = await supabaseAdmin
        .from("product_variants").select("*").eq("id", data.variantId).eq("product_id", product.id).maybeSingle();
      if (!variant) return { error: "Variant not found" };
      amount = Number(variant.price);
      variantName = variant.name;
    }

    if (product.type === "digital") {
      let q = supabaseAdmin
        .from("license_keys").select("*", { count: "exact", head: true })
        .eq("product_id", product.id).eq("status", "available");
      q = data.variantId ? q.eq("variant_id", data.variantId) : q.is("variant_id", null);
      const { count } = await q;
      if (!count || count < 1) return { error: "Out of stock" };
    }

    const { email, name, phone } = await getBuyerInfo(userId, claims);
    if (!email) return { error: "Your account has no email. Please update your profile." };

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders").insert({
        user_id: userId,
        product_id: product.id,
        variant_id: data.variantId,
        amount,
        status: "pending",
        customer_email: email,
        customer_name: name,
        customer_phone: phone,
      }).select("*").single();
    if (oErr || !order) return { error: oErr?.message ?? "Failed to create order" };

    const cfg = await getToyyibConfig();
    if (!cfg.userSecretKey || !cfg.categoryCode) {
      return { error: "Payment is not configured. Please contact support." };
    }
    const origin = getOrigin();
    const base = cfg.sandbox ? "https://dev.toyyibpay.com" : "https://toyyibpay.com";

    const form = new URLSearchParams({
      userSecretKey: cfg.userSecretKey,
      categoryCode: cfg.categoryCode,
      billName: product.name.slice(0, 30),
      billDescription: `${product.name}${variantName ? ` - ${variantName}` : ""}`.slice(0, 100),
      billPriceSetting: "1",
      billPayorInfo: "1",
      billAmount: String(Math.round(amount * 100)),
      billReturnUrl: `${origin}/thank-you?order=${order.id}`,
      billCallbackUrl: `${origin}/api/public/toyyibpay-callback`,
      billExternalReferenceNo: order.id,
      billTo: name,
      billEmail: email,
      billPhone: phone,
    });

    let txt = "";
    try {
      const resp = await fetch(`${base}/index.php/api/createBill`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json, text/plain, */*",
          "User-Agent": "CyberTownTech/1.0",
        },
        body: form.toString(),
      });
      txt = await resp.text();
    } catch (e: any) {
      console.error("[checkout] ToyyibPay fetch failed", e?.message);
      return { error: "Could not reach payment gateway. Try again." };
    }

    let billCode: string | null = null;
    try {
      const json = JSON.parse(txt);
      if (Array.isArray(json) && json[0]?.BillCode) billCode = json[0].BillCode;
    } catch {}
    if (!billCode) {
      console.error("[checkout] ToyyibPay error response:", txt);
      return { error: "Payment gateway error: " + txt.replace(/\s+/g, " ").slice(0, 200) };
    }

    await supabaseAdmin.from("orders").update({ toyyibpay_bill_code: billCode }).eq("id", order.id);
    return { url: `${base}/${billCode}`, orderId: order.id };
  });

// Guest-friendly multi-item checkout. If the request is authenticated, the
// attachSupabaseAuth middleware sets the bearer header automatically — we
// resolve the user from it inside the handler.
export const createCartCheckout = createServerFn({ method: "POST" })
  .inputValidator((input) => CartCheckoutInput.parse(input))
  .handler(async ({ data }): Promise<{ url?: string; orderIds?: string[]; error?: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Try to resolve current user from bearer (optional — guests allowed)
    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
      const req = getRequest();
      const auth = req?.headers.get("authorization") ?? "";
      const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : null;
      if (token) {
        const { data: u } = await supabaseAdmin.auth.getUser(token);
        if (u?.user) {
          userId = u.user.id;
          userEmail = u.user.email ?? null;
        }
      }
    } catch {}

    // Validate + price each item server-side
    type Line = { product: any; variant: any | null; amount: number };
    const lines: Line[] = [];
    type StockKey = string;
    const stockNeed = new Map<StockKey, { productId: string; variantId: string | null; needed: number; name: string }>();
    const stockKey = (p: string, v: string | null) => `${p}::${v ?? ""}`;

    for (const it of data.items) {
      const { data: product } = await supabaseAdmin
        .from("products").select("*").eq("id", it.productId).eq("status", true).maybeSingle();
      if (!product) return { error: `Product unavailable` };
      let amount = Number(product.base_price);
      let variant: any = null;
      if (it.variantId) {
        const { data: v } = await supabaseAdmin
          .from("product_variants").select("*").eq("id", it.variantId).eq("product_id", product.id).maybeSingle();
        if (!v) return { error: "Variant not found" };
        variant = v;
        amount = Number(v.price);
      }
      if (product.type === "digital") {
        const k = stockKey(product.id, it.variantId);
        const cur = stockNeed.get(k);
        if (cur) cur.needed += 1;
        else stockNeed.set(k, { productId: product.id, variantId: it.variantId, needed: 1, name: product.name + (variant ? ` (${variant.name})` : "") });
      }
      lines.push({ product, variant, amount });
    }

    // Stock check per (product, variant)
    for (const { productId, variantId, needed, name } of stockNeed.values()) {
      let q = supabaseAdmin
        .from("license_keys").select("*", { count: "exact", head: true })
        .eq("product_id", productId).eq("status", "available");
      q = variantId ? q.eq("variant_id", variantId) : q.is("variant_id", null);
      const { count } = await q;
      if (!count || count < needed) return { error: `Not enough stock for ${name}` };
    }

    const subtotal = lines.reduce((s, l) => s + l.amount, 0);
    if (subtotal <= 0) return { error: "Cart total must be greater than zero" };

    // Voucher
    let discount = 0;
    let voucherCode: string | null = null;
    if (data.voucherCode) {
      const code = data.voucherCode.trim().toUpperCase();
      const { data: v } = await supabaseAdmin
        .from("vouchers").select("*").eq("code", code).maybeSingle();
      if (!v) return { error: "Voucher not found" };
      if (!v.active) return { error: "Voucher inactive" };
      if (v.expires_at && new Date(v.expires_at) < new Date()) return { error: "Voucher expired" };
      if (v.max_uses !== null && v.uses >= v.max_uses) return { error: "Voucher fully redeemed" };
      discount = v.discount_type === "percent"
        ? subtotal * (Number(v.discount_value) / 100)
        : Number(v.discount_value);
      discount = Math.min(discount, subtotal);
      discount = Math.round(discount * 100) / 100;
      voucherCode = v.code;
    }
    const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);


    // Buyer info
    let email = "", name = "", phone = "60123456789";
    if (userId) {
      const buyer = await getBuyerInfo(userId, { email: userEmail });
      email = buyer.email; name = buyer.name; phone = buyer.phone;
    }
    if (data.guest) {
      email = data.guest.email.trim();
      name = data.guest.name.trim().slice(0, 50);
      phone = data.guest.phone.replace(/\D/g, "") || phone;
    }
    if (!email) return { error: "Email is required to check out" };

    // Spread the discount proportionally across line items so each order row sums to `total`
    const perItemDiscount = lines.map((l) => (subtotal > 0 ? (l.amount / subtotal) * discount : 0));
    const insertRows = lines.map((l, idx) => {
      const d = Math.round(perItemDiscount[idx] * 100) / 100;
      return {
        user_id: userId,
        product_id: l.product.id,
        variant_id: l.variant?.id ?? null,
        amount: Math.max(0, Math.round((l.amount - d) * 100) / 100),
        status: "pending" as const,
        customer_email: email,
        customer_name: name,
        customer_phone: phone,
        voucher_code: voucherCode,
        discount_amount: d,
      };
    });

    const { data: orders, error: oErr } = await supabaseAdmin
      .from("orders").insert(insertRows).select("*");
    if (oErr || !orders || orders.length === 0) return { error: oErr?.message ?? "Failed to create orders" };

    const primary = orders[0];
    const emailParam = encodeURIComponent(email);

    // ---------- Free checkout path (total = RM0). Skip ToyyibPay entirely,
    // fulfill immediately, and go straight to the thank-you page. ----------
    if (total <= 0) {
      for (const order of orders) {
        await supabaseAdmin.from("orders").update({
          status: "paid",
          paid_at: new Date().toISOString(),
        }).eq("id", order.id);

        // Assign a license key for digital products
        const { data: product } = await supabaseAdmin
          .from("products").select("type").eq("id", order.product_id!).maybeSingle();
        if (product?.type === "digital") {
          let kq = supabaseAdmin
            .from("license_keys").select("id")
            .eq("product_id", order.product_id!).eq("status", "available");
          kq = order.variant_id ? kq.eq("variant_id", order.variant_id) : kq.is("variant_id", null);
          const { data: keys } = await kq.limit(1);
          const keyId = keys?.[0]?.id;
          if (keyId) {
            await supabaseAdmin.from("license_keys").update({
              status: "used",
              order_id: order.id,
              assigned_to: userId,
              assigned_at: new Date().toISOString(),
            }).eq("id", keyId);
          }
        }
      }
      if (voucherCode) {
        const { data: vRow } = await supabaseAdmin
          .from("vouchers").select("uses").eq("code", voucherCode).maybeSingle();
        if (vRow) {
          await supabaseAdmin.from("vouchers")
            .update({ uses: (vRow.uses ?? 0) + orders.length })
            .eq("code", voucherCode);
        }
      }
      return {
        url: `/thank-you?order=${primary.id}&email=${emailParam}&free=1`,
        orderIds: orders.map((o) => o.id),
      };
    }


    const cfg = await getToyyibConfig();
    if (!cfg.userSecretKey || !cfg.categoryCode) {
      return { error: "Payment is not configured. Please contact support." };
    }
    const origin = getOrigin();
    const base = cfg.sandbox ? "https://dev.toyyibpay.com" : "https://toyyibpay.com";
    const externalRef = orders.map((o) => o.id).join(",").slice(0, 250);

    const billName = (lines.length === 1 ? lines[0].product.name : `Cart (${lines.length} items)`).slice(0, 30);
    const billDesc = lines.map((l) => l.product.name).join(", ").slice(0, 100);

    const form = new URLSearchParams({
      userSecretKey: cfg.userSecretKey,
      categoryCode: cfg.categoryCode,
      billName,
      billDescription: billDesc,
      billPriceSetting: "1",
      billPayorInfo: "1",
      billAmount: String(Math.round(total * 100)),
      billReturnUrl: `${origin}/thank-you?order=${primary.id}`,
      billCallbackUrl: `${origin}/api/public/toyyibpay-callback`,
      billExternalReferenceNo: externalRef,
      billTo: name || email.split("@")[0],
      billEmail: email,
      billPhone: phone,
    });

    let txt = "";
    try {
      const resp = await fetch(`${base}/index.php/api/createBill`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json, text/plain, */*",
          "User-Agent": "CyberTownTech/1.0",
        },
        body: form.toString(),
      });
      txt = await resp.text();
    } catch (e: any) {
      console.error("[cart-checkout] ToyyibPay fetch failed", e?.message);
      return { error: "Could not reach payment gateway. Try again." };
    }

    let billCode: string | null = null;
    try {
      const json = JSON.parse(txt);
      if (Array.isArray(json) && json[0]?.BillCode) billCode = json[0].BillCode;
    } catch {}
    if (!billCode) {
      console.error("[cart-checkout] ToyyibPay error response:", txt);
      return { error: "Payment gateway error: " + txt.replace(/\s+/g, " ").slice(0, 200) };
    }

    await supabaseAdmin.from("orders").update({ toyyibpay_bill_code: billCode })
      .in("id", orders.map((o) => o.id));

    return { url: `${base}/${billCode}`, orderIds: orders.map((o) => o.id) };
  });
