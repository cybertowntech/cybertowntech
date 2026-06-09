import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ToyyibPay webhook. status_id: 1=success, 2=pending, 3=fail
// For cart checkouts, billExternalReferenceNo contains comma-separated order ids
// and all related orders share the same toyyibpay_bill_code.
export const Route = createFileRoute("/api/public/toyyibpay-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: Record<string, string> = {};
        try {
          const text = await request.text();
          const params = new URLSearchParams(text);
          params.forEach((v, k) => { payload[k] = v; });
          if (!Object.keys(payload).length) {
            try { payload = JSON.parse(text); } catch {}
          }
        } catch {}
        const orderIdRaw = payload.order_id || payload.billExternalReferenceNo || "";
        const statusId = String(payload.status_id ?? "");
        const billCode = payload.billcode || payload.billCode || null;

        const idSet = new Set<string>(
          orderIdRaw.split(",").map((s) => s.trim()).filter(Boolean),
        );
        if (billCode) {
          const { data: linked } = await supabaseAdmin
            .from("orders").select("id").eq("toyyibpay_bill_code", billCode);
          linked?.forEach((o) => idSet.add(o.id));
        }
        if (idSet.size === 0) return new Response("missing order_id", { status: 400 });

        const { data: orders } = await supabaseAdmin
          .from("orders").select("*").in("id", Array.from(idSet));
        if (!orders || orders.length === 0) return new Response("orders not found", { status: 404 });

        if (statusId === "1") {
          for (const order of orders) {
            if (order.status === "paid") continue;

            // Ensure the customer has an auth account so their dashboard
            // persists across browser clears.
            let assignedTo = order.user_id;
            if (!assignedTo && order.customer_email) {
              assignedTo = await ensureUserId(order.customer_email, order.customer_name);
            }

            await supabaseAdmin.from("orders").update({
              status: "paid",
              paid_at: new Date().toISOString(),
              toyyibpay_ref: payload.refno ?? null,
              toyyibpay_bill_code: billCode ?? order.toyyibpay_bill_code,
              user_id: assignedTo ?? order.user_id,
            }).eq("id", order.id);

            if (!order.product_id) continue;
            const { data: product } = await supabaseAdmin
              .from("products").select("type").eq("id", order.product_id).maybeSingle();
            if (product?.type === "digital") {
              let kq = supabaseAdmin
                .from("license_keys").select("id")
                .eq("product_id", order.product_id).eq("status", "available");
              kq = order.variant_id ? kq.eq("variant_id", order.variant_id) : kq.is("variant_id", null);
              const { data: keys } = await kq.limit(1);
              const keyId = keys?.[0]?.id;
              if (keyId) {
                await supabaseAdmin.from("license_keys").update({
                  status: "used",
                  order_id: order.id,
                  assigned_to: assignedTo,
                  assigned_at: new Date().toISOString(),
                }).eq("id", keyId);
              }
            }

            // Increment voucher usage
            if (order.voucher_code) {
              await supabaseAdmin.rpc("increment_voucher_use", { _code: order.voucher_code }).catch(() => {});
            }
          }
        } else if (statusId === "3") {
          await supabaseAdmin.from("orders").update({ status: "failed" })
            .in("id", orders.map((o) => o.id));
        }
        return new Response("ok", { status: 200 });
      },
      GET: async () => new Response("ok"),
    },
  },
});

async function ensureUserId(email: string, name: string | null): Promise<string | null> {
  try {
    // Try existing user via profiles (cheapest lookup)
    const { data: existing } = await supabaseAdmin
      .from("profiles").select("id").eq("email", email).maybeSingle();
    if (existing?.id) return existing.id;

    // Create a passwordless user account. They can later sign in via magic
    // link / password reset using this same email.
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: name ?? undefined },
    });
    if (error || !created.user) {
      console.error("[callback] createUser failed", error?.message);
      return null;
    }
    const uid = created.user.id;
    await supabaseAdmin.from("profiles").upsert({
      id: uid, email, full_name: name ?? email.split("@")[0],
    }, { onConflict: "id" });
    await supabaseAdmin.from("user_roles").upsert({
      user_id: uid, role: "user" as const,
    }, { onConflict: "user_id,role" });
    return uid;
  } catch (e: any) {
    console.error("[callback] ensureUserId failed", e?.message);
    return null;
  }
}
