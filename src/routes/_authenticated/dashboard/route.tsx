import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import SiteNav from "@/components/SiteNav";
import { LayoutDashboard, ShoppingBag, Key } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const loc = useLocation();
  const items = [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
    { to: "/dashboard/keys", label: "License Keys", icon: Key },
  ] as const;
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        <div className="flex gap-2 border-b border-border mb-8 overflow-x-auto">
          {items.map((it) => {
            const active = loc.pathname === it.to;
            return (
              <Link key={it.to} to={it.to} className={`shrink-0 inline-flex items-center gap-2 px-4 h-11 -mb-px border-b-2 text-sm transition ${active ? "border-cream text-cream" : "border-transparent text-ash hover:text-cream"}`}>
                <it.icon className="w-4 h-4" /> {it.label}
              </Link>
            );
          })}
        </div>
        <Outlet />
      </main>
    </div>
  );
}
