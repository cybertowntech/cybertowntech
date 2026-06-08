import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ToyyibPay webhook. They POST form-encoded with billcode, order_id (external ref), status_id, etc.
// status_id: 1=success, 2=pending, 3=fail
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

        // Collect all order ids: from external ref + any sharing the bill_code
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
            await supabaseAdmin.from("orders").update({
              status: "paid",
              paid_at: new Date().toISOString(),
              toyyibpay_ref: payload.refno ?? null,
              toyyibpay_bill_code: billCode ?? order.toyyibpay_bill_code,
            }).eq("id", order.id);

            if (!order.product_id) continue;
            const { data: product } = await supabaseAdmin
              .from("products").select("type").eq("id", order.product_id).maybeSingle();
            if (product?.type === "digital") {
              const { data: keys } = await supabaseAdmin
                .from("license_keys").select("id")
                .eq("product_id", order.product_id).eq("status", "available").limit(1);
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
