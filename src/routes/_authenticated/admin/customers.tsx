import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatMYR, formatDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  head: () => ({ meta: [
    {"title": "Customer Management \u2014 CyberTown Tech"},
    {"name": "description", "content": "Manage CyberTown Tech customers."},
    {"property": "og:title", "content": "Customer Management \u2014 CyberTown Tech"},
    {"property": "og:description", "content": "Manage CyberTown Tech customers."},
    {"property": "og:type", "content": "website"},
    {"name": "twitter:card", "content": "summary"},
  ] }),
  component: AdminCustomers,
});

function AdminCustomers() {
  const qc = useQueryClient();
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: orders } = await supabase.from("orders").select("user_id,amount,status");
      const byUser = new Map<string, { count: number; total: number }>();
      (orders ?? []).forEach((o) => {
        const e = byUser.get(o.user_id ?? "") ?? { count: 0, total: 0 };
        e.count++; if (o.status === "paid") e.total += Number(o.amount);
        byUser.set(o.user_id ?? "", e);
      });
      return (profiles ?? []).map((p) => ({ ...p, ...(byUser.get(p.id) ?? { count: 0, total: 0 }) }));
    },
  });

  async function toggleBan(id: string, ban: boolean) {
    const { error } = await supabase.from("profiles").update({ is_banned: ban }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(ban ? "User banned" : "User unbanned"); qc.invalidateQueries({ queryKey: ["admin-customers"] }); }
  }

  return (
    <div>
      <h1 className="text-3xl font-display font-semibold tracking-tight mb-6">Customers</h1>
      <div className="rounded-xl bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-stone">
            <tr><th className="text-left p-3">Email</th><th className="text-left p-3">Name</th><th className="text-left p-3">Orders</th><th className="text-left p-3">Total spent</th><th className="text-left p-3">Joined</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading…</td></tr>}
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3 truncate max-w-[220px]">{c.email}{c.is_banned && <span className="ml-2 text-xs text-destructive">banned</span>}</td>
                <td className="p-3">{c.full_name ?? "—"}</td>
                <td className="p-3">{c.count}</td>
                <td className="p-3 font-mono">{formatMYR(c.total)}</td>
                <td className="p-3 text-muted-foreground">{formatDate(c.created_at)}</td>
                <td className="p-3 text-right">
                  <button onClick={() => toggleBan(c.id, !c.is_banned)} className="text-xs text-stone hover:text-cream">{c.is_banned ? "Unban" : "Ban"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
