import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { formatMYR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: Analytics,
});

function Analytics() {
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("daily");
  const { data } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const { data: orders } = await supabase.from("orders").select("amount,status,created_at,product_id,products(name)").eq("status", "paid");
      return orders ?? [];
    },
  });

  const chartData = useMemo(() => {
    if (!data) return [];
    const buckets = new Map<string, number>();
    data.forEach((o: any) => {
      const d = new Date(o.created_at);
      let key = "";
      if (range === "daily") key = d.toISOString().slice(0, 10);
      else if (range === "weekly") { const onejan = new Date(d.getFullYear(), 0, 1); const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7); key = `${d.getFullYear()}-W${week}`; }
      else key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets.set(key, (buckets.get(key) ?? 0) + Number(o.amount));
    });
    return Array.from(buckets.entries()).sort().map(([date, revenue]) => ({ date, revenue }));
  }, [data, range]);

  const top = useMemo(() => {
    if (!data) return [];
    const m = new Map<string, { name: string; total: number; count: number }>();
    data.forEach((o: any) => {
      const k = o.product_id ?? "";
      const e = m.get(k) ?? { name: o.products?.name ?? "Unknown", total: 0, count: 0 };
      e.total += Number(o.amount); e.count += 1;
      m.set(k, e);
    });
    return Array.from(m.values()).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [data]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display font-semibold tracking-tight">Analytics</h1>
        <div className="flex gap-1 p-1 bg-card border border-border rounded-lg">
          {(["daily", "weekly", "monthly"] as const).map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`px-3 h-8 rounded text-xs uppercase tracking-wider ${range === r ? "bg-cream text-obsidian" : "text-ash"}`}>{r}</button>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-xl bg-card border border-border">
        <h2 className="text-sm uppercase tracking-widest text-stone mb-4">Revenue</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#B0A89F" stopOpacity={0.5} /><stop offset="100%" stopColor="#B0A89F" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="#333" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#888" tick={{ fontSize: 11 }} />
              <YAxis stroke="#888" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid #333", borderRadius: 8 }} formatter={(v: number) => formatMYR(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#F2EDE8" fill="url(#g)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 p-6 rounded-xl bg-card border border-border">
        <h2 className="text-sm uppercase tracking-widest text-stone mb-4">Top selling products</h2>
        <div className="space-y-2">
          {top.map((p) => (
            <div key={p.name} className="flex items-center justify-between p-3 rounded bg-obsidian">
              <span>{p.name}</span>
              <div className="text-right"><div className="font-mono text-cream">{formatMYR(p.total)}</div><div className="text-xs text-muted-foreground">{p.count} sale{p.count > 1 ? "s" : ""}</div></div>
            </div>
          ))}
          {top.length === 0 && <p className="text-muted-foreground text-sm">No sales yet.</p>}
        </div>
      </div>
    </div>
  );
}
