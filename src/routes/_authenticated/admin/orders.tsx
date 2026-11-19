import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatMYR, formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import { X, Ban, Trash2 } from "lucide-react";


export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => ({ meta: [
    {"title": "Order Management \u2014 CyberTown Tech"},
    {"name": "description", "content": "Manage CyberTown Tech customer orders."},
    {"property": "og:title", "content": "Order Management \u2014 CyberTown Tech"},
    {"property": "og:description", "content": "Manage CyberTown Tech customer orders."},
    {"property": "og:type", "content": "website"},
    {"name": "twitter:card", "content": "summary"},
  ] }),
  component: AdminOrders,
});

function AdminOrders() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("all");
  const [selected, setSelected] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders", status],
    queryFn: async () => {
      let q = supabase.from("orders").select("*,products(name),product_variants(name)").order("created_at", { ascending: false });
      if (status !== "all") q = q.eq("status", status as any);
      const { data } = await q;
      return data ?? [];
    },
  });

  const { data: detail } = useQuery({
    queryKey: ["order-detail", selected],
    enabled: !!selected,
    queryFn: async () => {
      const { data: order } = await supabase.from("orders").select("*,products(name,notes)").eq("id", selected!).maybeSingle();
      const { data: keys } = await supabase.from("license_keys").select("key_value").eq("order_id", selected!);
      return { order, keys: keys ?? [] };
    },
  });

  async function markPaid(id: string) {
    if (!confirm("Mark this order as paid? This will also assign a license key if applicable.")) return;
    const { data: order } = await supabase.from("orders").select("*,products(type)").eq("id", id).maybeSingle();
    if (!order) return;
    await supabase.from("orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    if ((order as any).products?.type === "digital") {
      const { data: key } = await supabase.from("license_keys").select("id").eq("product_id", order.product_id!).eq("status", "available").limit(1).maybeSingle();
      if (key) await supabase.from("license_keys").update({ status: "used", order_id: id, assigned_to: order.user_id, assigned_at: new Date().toISOString() }).eq("id", key.id);
    }
    toast.success("Marked as paid");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  }

  // Free assigned license keys back to the pool.
  async function releaseKeysForOrder(orderId: string) {
    await supabase.from("license_keys").update({
      status: "available",
      order_id: null,
      assigned_to: null,
      assigned_at: null,
    }).eq("order_id", orderId);
  }

  async function rejectOrder(id: string) {
    if (!confirm("Reject this order? The assigned license key (if any) will be returned to inventory.")) return;
    await releaseKeysForOrder(id);
    const { error } = await supabase.from("orders").update({ status: "refunded" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Order rejected");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    setSelected(null);
  }

  async function deleteOrder(id: string) {
    if (!confirm("Permanently delete this order? Any assigned license key will be returned to inventory. This cannot be undone.")) return;
    await releaseKeysForOrder(id);
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Order deleted");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    setSelected(null);
  }


  return (
    <div>
      <h1 className="text-3xl font-display font-semibold tracking-tight mb-6">Orders</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "pending", "paid", "failed", "refunded"].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`px-4 h-9 rounded-full text-xs uppercase tracking-wider border transition ${status === s ? "bg-cream text-obsidian border-cream" : "border-border text-ash hover:border-stone"}`}>{s}</button>
        ))}
      </div>
      <div className="rounded-xl bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-stone">
            <tr><th className="text-left p-3">Order</th><th className="text-left p-3">Customer</th><th className="text-left p-3">Product</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Status</th><th className="text-left p-3">Date</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading…</td></tr>}
            {orders.map((o: any) => (
              <tr key={o.id} className="border-t border-border hover:bg-muted/20">
                <td className="p-3 font-mono text-xs text-stone">{o.id.slice(0, 8)}</td>
                <td className="p-3 truncate max-w-[180px]">{o.customer_email}</td>
                <td className="p-3">{o.products?.name}{o.product_variants?.name && <span className="text-muted-foreground"> · {o.product_variants.name}</span>}</td>
                <td className="p-3 font-mono">{formatMYR(o.amount)}</td>
                <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full border border-border">{o.status}</span></td>
                <td className="p-3 text-muted-foreground">{formatDateTime(o.created_at)}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  {o.status === "pending" && <button onClick={() => markPaid(o.id)} className="text-xs text-stone hover:text-cream mr-3">Mark paid</button>}
                  {o.status !== "refunded" && <button onClick={() => rejectOrder(o.id)} className="text-xs text-yellow-400 hover:text-yellow-300 mr-3 inline-flex items-center gap-1"><Ban className="w-3 h-3" />Reject</button>}
                  <button onClick={() => deleteOrder(o.id)} className="text-xs text-red-400 hover:text-red-300 mr-3 inline-flex items-center gap-1"><Trash2 className="w-3 h-3" />Delete</button>
                  <button onClick={() => setSelected(o.id)} className="text-xs text-stone hover:text-cream">View</button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && detail?.order && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium">Order details</h2>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-muted rounded"><X className="w-4 h-4" /></button>
            </div>
            <dl className="space-y-2 text-sm">
              <Row k="Order ID" v={<code className="text-stone">{detail.order.id}</code>} />
              <Row k="Customer" v={`${detail.order.customer_name} · ${detail.order.customer_email}`} />
              <Row k="Phone" v={detail.order.customer_phone ?? "—"} />
              <Row k="Product" v={(detail.order as any).products?.name} />
              <Row k="Amount" v={formatMYR(detail.order.amount)} />
              <Row k="Status" v={detail.order.status} />
              <Row k="Payment ref" v={detail.order.toyyibpay_ref ?? "—"} />
              <Row k="Bill code" v={detail.order.toyyibpay_bill_code ?? "—"} />
            </dl>
            {detail.keys.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-xs uppercase tracking-widest text-stone mb-2">Assigned keys</div>
                {detail.keys.map((k, i) => <code key={i} className="block font-mono text-xs bg-obsidian p-2 rounded mb-1 break-all">{k.key_value}</code>)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{k}</dt><dd className="text-right">{v}</dd></div>;
}
