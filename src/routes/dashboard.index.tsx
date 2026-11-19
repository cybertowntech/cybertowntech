import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Key, DollarSign, LogOut } from "lucide-react";
import { formatMYR } from "@/lib/format";
import { useDashboardEmail } from "@/hooks/useDashboardEmail";
import { getMyDashboard } from "@/lib/dashboard.functions";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [
    {"title": "Customer Overview \u2014 CyberTown Tech"},
    {"name": "description", "content": "View your CyberTown Tech purchases and dashboard."},
    {"property": "og:title", "content": "Customer Overview \u2014 CyberTown Tech"},
    {"property": "og:description", "content": "View your CyberTown Tech purchases and dashboard."},
    {"property": "og:type", "content": "website"},
    {"name": "twitter:card", "content": "summary"},
  ] }),
  component: Overview,
});

function Overview() {
  const { email, isAuthed, setGuestEmail } = useDashboardEmail();
  const { data } = useQuery({
    queryKey: ["dash-overview", email],
    enabled: !!email,
    queryFn: () => getMyDashboard({ data: { email: email! } }),
  });

  const stats = [
    { l: "Total spent", v: formatMYR(data?.total ?? 0), i: DollarSign },
    { l: "Orders", v: String(data?.orderCount ?? 0), i: ShoppingBag },
    { l: "License keys", v: String(data?.keyCount ?? 0), i: Key },
  ];
  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">{email}</p>
        </div>
        {!isAuthed && (
          <button
            onClick={() => setGuestEmail(null)}
            className="inline-flex items-center gap-2 px-3 h-9 rounded-md border border-border text-xs text-ash hover:text-cream hover:border-stone transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Switch email
          </button>
        )}
      </div>
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
