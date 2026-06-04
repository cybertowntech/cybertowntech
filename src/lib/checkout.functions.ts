import { createServerFn } from "@tanstack/react-start";
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

    const email = String(claims.email ?? "");
    const { data: profile } = await supabaseAdmin
      .from("profiles").select("full_name,phone").eq("id", userId).maybeSingle();

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders").insert({
        user_id: userId,
        product_id: product.id,
        variant_id: data.variantId,
        amount,
        status: "pending",
        customer_email: email,
        customer_name: profile?.full_name ?? email.split("@")[0],
        customer_phone: profile?.phone ?? null,
      }).select("*").single();
    if (oErr || !order) return { error: oErr?.message ?? "Failed to create order" };

    const { data: settings } = await supabaseAdmin
      .from("settings").select("value").eq("key", "toyyibpay").maybeSingle();
    const tp = (settings?.value as any) ?? {};
    const userSecretKey: string = tp.user_secret_key ?? "";
    const categoryCode: string = tp.category_code ?? "";
    const sandbox: boolean = tp.sandbox !== false;

    if (!userSecretKey || !categoryCode) {
      // No payment gateway configured — return a dev fallback that marks order pending and goes to thank-you
      const origin = process.env.SITE_URL || "";
      return { url: `${origin}/thank-you?order=${order.id}&unpaid=1`, orderId: order.id };
    }

    const base = sandbox ? "https://dev.toyyibpay.com" : "https://toyyibpay.com";
    const origin = process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

    const form = new URLSearchParams({
      userSecretKey,
      categoryCode,
      billName: product.name.slice(0, 30),
      billDescription: `${product.name}${variantName ? ` — ${variantName}` : ""}`.slice(0, 100),
      billPriceSetting: "1",
      billPayorInfo: "1",
      billAmount: String(Math.round(amount * 100)),
      billReturnUrl: `${origin}/thank-you?order=${order.id}`,
      billCallbackUrl: `${origin}/api/public/toyyibpay-callback`,
      billExternalReferenceNo: order.id,
      billTo: order.customer_name ?? "Customer",
      billEmail: email,
      billPhone: order.customer_phone ?? "0000000000",
    });

    const resp = await fetch(`${base}/index.php/api/createBill`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const txt = await resp.text();
    let billCode: string | null = null;
    try {
      const json = JSON.parse(txt);
      if (Array.isArray(json) && json[0]?.BillCode) billCode = json[0].BillCode;
    } catch {}
    if (!billCode) return { error: "ToyyibPay error: " + txt.slice(0, 200) };

    await supabaseAdmin.from("orders").update({ toyyibpay_bill_code: billCode }).eq("id", order.id);
    return { url: `${base}/${billCode}`, orderId: order.id };
  });
