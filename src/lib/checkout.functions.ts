import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CheckoutInput = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable(),
});

export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CheckoutInput.parse(input))
  .handler(async ({ data, context }): Promise<{ url?: string; orderId?: string; error?: string }> => {
    const { supabase, userId, claims } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: product, error: pErr } = await supabase
      .from("products").select("*").eq("id", data.productId).maybeSingle();
    if (pErr || !product) return { error: "Product not found" };

    let amount = Number(product.base_price);
    let variantName: string | null = null;
    if (data.variantId) {
      const { data: variant } = await supabase
        .from("product_variants").select("*").eq("id", data.variantId).maybeSingle();
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

    const claimEmail = String((claims as any).email ?? "").trim();
    const { data: profile } = await supabaseAdmin
      .from("profiles").select("full_name,phone,email").eq("id", userId).maybeSingle();

    const email = claimEmail || (profile?.email ?? "").trim();
    if (!email) return { error: "Your account has no email. Please update your profile." };

    const name = (profile?.full_name?.trim() || email.split("@")[0] || "Customer").slice(0, 50);
    const rawPhone = (profile?.phone ?? "").replace(/\D/g, "");
    const phone = rawPhone.length >= 9 ? rawPhone : "60123456789";

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

    const { data: settings } = await supabaseAdmin
      .from("settings").select("value").eq("key", "toyyibpay").maybeSingle();
    const tp = (settings?.value as any) ?? {};
    const userSecretKey: string = (tp.user_secret_key ?? "").trim();
    const categoryCode: string = (tp.category_code ?? "").trim();
    const sandbox: boolean = tp.sandbox === true;

    const req = getRequest();
    const url = new URL(req?.url ?? "http://localhost");
    const headerOrigin = req?.headers.get("origin") || req?.headers.get("referer");
    let origin = `${url.protocol}//${url.host}`;
    if (headerOrigin) {
      try { origin = new URL(headerOrigin).origin; } catch {}
    }

    if (!userSecretKey || !categoryCode) {
      console.error("[checkout] ToyyibPay not configured");
      return { error: "Payment is not configured. Please contact support." };
    }

    const base = sandbox ? "https://dev.toyyibpay.com" : "https://toyyibpay.com";

    const form = new URLSearchParams({
      userSecretKey,
      categoryCode,
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

    console.log("[checkout] Creating ToyyibPay bill", { base, orderId: order.id, amount, email });

    let txt = "";
    try {
      const resp = await fetch(`${base}/index.php/api/createBill`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
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
