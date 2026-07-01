import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatMYR, formatDate } from "@/lib/format";
import { useDashboardEmail } from "@/hooks/useDashboardEmail";
import { getMyDashboard } from "@/lib/dashboard.functions";

export const Route = createFileRoute("/dashboard/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const { email } = useDashboardEmail();
  const { data, isLoading } = useQuery({
    queryKey: ["dash-orders", email],
    enabled: !!email,
    queryFn: () => getMyDashboard({ data: { email: email! } }),
  });
  const orders = data?.orders ?? [];

  return (
    <div>
      <h2 className="text-2xl font-display font-semibold">Order History</h2>
      <div className="mt-6 rounded-2xl bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-stone">
            <tr><th className="text-left p-4">Order</th><th className="text-left p-4">Product</th><th className="text-left p-4">Amount</th><th className="text-left p-4">Status</th><th className="text-left p-4">Date</th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading…</td></tr>}
            {!isLoading && orders.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No orders yet</td></tr>}
            {orders.map((o: any) => (
              <tr key={o.id} className="border-t border-border">
                <td className="p-4 font-mono text-xs text-stone">{o.id.slice(0, 8)}</td>
                <td className="p-4">{o.products?.name}{o.product_variants?.name && <span className="text-muted-foreground"> · {o.product_variants.name}</span>}</td>
                <td className="p-4 font-mono">{formatMYR(o.amount)}</td>
                <td className="p-4"><StatusBadge s={o.status} /></td>
                <td className="p-4 text-muted-foreground">{formatDate(o.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    paid: "bg-green-500/15 text-green-300 border-green-500/30",
    pending: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    failed: "bg-red-500/15 text-red-300 border-red-500/30",
    refunded: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  };
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${map[s] ?? "border-border text-muted-foreground"}`}>{s}</span>;
}
