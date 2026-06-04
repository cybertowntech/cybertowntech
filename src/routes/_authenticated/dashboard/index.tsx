import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatMYR } from "@/lib/format";
import { ShoppingBag, Key, DollarSign } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: Overview,
});

function Overview() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["dash-overview", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [orders, keys] = await Promise.all([
        supabase.from("orders").select("amount,status").eq("user_id", user!.id),
        supabase.from("license_keys").select("id").eq("assigned_to", user!.id),
      ]);
      const paid = (orders.data ?? []).filter(o => o.status === "paid");
      const total = paid.reduce((s, o) => s + Number(o.amount), 0);
      return { orderCount: orders.data?.length ?? 0, keyCount: keys.data?.length ?? 0, total };
    },
  });
  const stats = [
    { l: "Total spent", v: formatMYR(data?.total ?? 0), i: DollarSign },
    { l: "Orders", v: String(data?.orderCount ?? 0), i: ShoppingBag },
    { l: "License keys", v: String(data?.keyCount ?? 0), i: Key },
  ];
  return (
    <div>
      <h1 className="text-3xl font-display font-semibold tracking-tight">Welcome back</h1>
      <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.l} className="p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{s.l}</p>
              <s.i className="w-4 h-4 text-stone" />
            </div>
            <p className="mt-3 text-3xl font-display font-semibold text-cream">{s.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
