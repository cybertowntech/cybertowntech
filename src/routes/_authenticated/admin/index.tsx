import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatMYR, formatDateTime } from "@/lib/format";
import { DollarSign, ShoppingBag, Users, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const today = new Date(); today.setHours(0,0,0,0);
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
      const [orders, customers, recent, lowStock] = await Promise.all([
        supabase.from("orders").select("amount,status,created_at").eq("status", "paid"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id,amount,status,created_at,customer_email,products(name)").order("created_at", { ascending: false }).limit(8),
        supabase.from("products").select("id,name,license_keys(id,status)").eq("type", "digital"),
      ]);
      const paid = orders.data ?? [];
      const totalRevenue = paid.reduce((s, o) => s + Number(o.amount), 0);
      const monthRevenue = paid.filter(o => new Date(o.created_at) >= monthStart).reduce((s, o) => s + Number(o.amount), 0);
      const todayOrders = paid.filter(o => new Date(o.created_at) >= today).length;
      const low = (lowStock.data ?? []).map((p: any) => ({
        id: p.id, name: p.name, available: (p.license_keys ?? []).filter((k: any) => k.status === "available").length,
      })).filter(p => p.available < 5);
      return { totalRevenue, monthRevenue, todayOrders, customers: customers.count ?? 0, recent: recent.data ?? [], lowStock: low };
    },
  });

  const stats = [
    { l: "Total revenue", v: formatMYR(data?.totalRevenue ?? 0), i: DollarSign },
    { l: "This month", v: formatMYR(data?.monthRevenue ?? 0), i: DollarSign },
    { l: "Orders today", v: String(data?.todayOrders ?? 0), i: ShoppingBag },
    { l: "Customers", v: String(data?.customers ?? 0), i: Users },
  ];
  return (
    <div>
      <h1 className="text-3xl font-display font-semibold tracking-tight">Admin Overview</h1>
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.l} className="p-5 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between"><p className="text-xs uppercase tracking-wider text-stone">{s.l}</p><s.i className="w-4 h-4 text-stone" /></div>
            <p className="mt-2 text-2xl font-display font-semibold text-cream">{s.v}</p>
          </div>
        ))}
      </div>

      {(data?.lowStock?.length ?? 0) > 0 && (
        <div className="mt-8 p-5 rounded-xl bg-yellow-500/5 border border-yellow-500/30">
          <div className="flex items-center gap-2 text-yellow-300"><AlertTriangle className="w-4 h-4" /><h3 className="font-medium">Low stock alerts</h3></div>
          <ul className="mt-3 text-sm space-y-1">
            {data!.lowStock.map((p) => <li key={p.id} className="flex justify-between"><span>{p.name}</span><span className="font-mono text-yellow-300/80">{p.available} left</span></li>)}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-medium mb-3">Recent orders</h2>
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-stone"><tr><th className="text-left p-3">Customer</th><th className="text-left p-3">Product</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Status</th><th className="text-left p-3">When</th></tr></thead>
            <tbody>
              {(data?.recent ?? []).map((o: any) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="p-3 truncate max-w-[180px]">{o.customer_email}</td>
                  <td className="p-3">{o.products?.name}</td>
                  <td className="p-3 font-mono">{formatMYR(o.amount)}</td>
                  <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full border border-border">{o.status}</span></td>
                  <td className="p-3 text-muted-foreground">{formatDateTime(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
