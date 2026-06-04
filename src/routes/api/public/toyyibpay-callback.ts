import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ToyyibPay webhook. They POST form-encoded with billcode, order_id (external ref), status_id, etc.
// status_id: 1=success, 2=pending, 3=fail
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
        const orderId = payload.order_id || payload.billExternalReferenceNo;
        const statusId = String(payload.status_id ?? "");
        const billCode = payload.billcode || payload.billCode || null;
        if (!orderId) return new Response("missing order_id", { status: 400 });

        const { data: order } = await supabaseAdmin.from("orders").select("*").eq("id", orderId).maybeSingle();
        if (!order) return new Response("order not found", { status: 404 });
        if (order.status === "paid") return new Response("ok", { status: 200 });

        if (statusId === "1") {
          // mark paid + assign keys for digital products
          await supabaseAdmin.from("orders").update({
            status: "paid",
            paid_at: new Date().toISOString(),
            toyyibpay_ref: payload.refno ?? null,
            toyyibpay_bill_code: billCode ?? order.toyyibpay_bill_code,
          }).eq("id", order.id);

          const { data: product } = await supabaseAdmin.from("products").select("type").eq("id", order.product_id!).maybeSingle();
          if (product?.type === "digital") {
            const { data: keys } = await supabaseAdmin
              .from("license_keys").select("id")
              .eq("product_id", order.product_id!).eq("status", "available").limit(1);
            const keyId = keys?.[0]?.id;
            if (keyId) {
              await supabaseAdmin.from("license_keys").update({
                status: "used",
                order_id: order.id,
                assigned_to: order.user_id,
                assigned_at: new Date().toISOString(),
              }).eq("id", keyId);
            }
          }
        } else if (statusId === "3") {
          await supabaseAdmin.from("orders").update({ status: "failed" }).eq("id", order.id);
        }
        return new Response("ok", { status: 200 });
      },
      GET: async () => new Response("ok"),
    },
  },
});
