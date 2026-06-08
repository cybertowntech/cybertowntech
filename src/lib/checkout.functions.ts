import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CheckoutInput = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable(),
});

const CartCheckoutInput = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().nullable(),
  })).min(1).max(50),
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
      const { count } = await supabaseAdmin
        .from("license_keys").select("*", { count: "exact", head: true })
        .eq("product_id", product.id).eq("status", "available");
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

export const createCartCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CartCheckoutInput.parse(input))
  .handler(async ({ data, context }): Promise<{ url?: string; orderIds?: string[]; error?: string }> => {
    const { userId, claims } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Validate + price each item server-side
    type Line = { product: any; variant: any | null; amount: number };
    const lines: Line[] = [];
    const digitalCounts = new Map<string, number>(); // productId -> needed

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
        digitalCounts.set(product.id, (digitalCounts.get(product.id) ?? 0) + 1);
      }
      lines.push({ product, variant, amount });
    }

    // Stock check for digital products
    for (const [productId, needed] of digitalCounts) {
      const { count } = await supabaseAdmin
        .from("license_keys").select("*", { count: "exact", head: true })
        .eq("product_id", productId).eq("status", "available");
      if (!count || count < needed) {
        const name = lines.find((l) => l.product.id === productId)?.product.name ?? "Item";
        return { error: `Not enough stock for ${name}` };
      }
    }

    const total = lines.reduce((s, l) => s + l.amount, 0);
    if (total <= 0) return { error: "Cart total must be greater than zero" };

    const { email, name, phone } = await getBuyerInfo(userId, claims);
    if (!email) return { error: "Your account has no email. Please update your profile." };

    // Create one order row per item, sharing toyyibpay_bill_code later
    const insertRows = lines.map((l) => ({
      user_id: userId,
      product_id: l.product.id,
      variant_id: l.variant?.id ?? null,
      amount: l.amount,
      status: "pending" as const,
      customer_email: email,
      customer_name: name,
      customer_phone: phone,
    }));
    const { data: orders, error: oErr } = await supabaseAdmin
      .from("orders").insert(insertRows).select("*");
    if (oErr || !orders || orders.length === 0) return { error: oErr?.message ?? "Failed to create orders" };

    const cfg = await getToyyibConfig();
    if (!cfg.userSecretKey || !cfg.categoryCode) {
      return { error: "Payment is not configured. Please contact support." };
    }
    const origin = getOrigin();
    const base = cfg.sandbox ? "https://dev.toyyibpay.com" : "https://toyyibpay.com";
    const primary = orders[0];
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
