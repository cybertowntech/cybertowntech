import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import SiteNav from "@/components/SiteNav";
import { LayoutDashboard, Package, ShoppingBag, Users, BarChart3, Settings, Key, Tag } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
    if (!role) throw redirect({ to: "/dashboard" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const loc = useLocation();
  const items = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/products", label: "Products", icon: Package },
    { to: "/admin/keys", label: "License Keys", icon: Key },
    { to: "/admin/vouchers", label: "Vouchers", icon: Tag },
    { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { to: "/admin/customers", label: "Customers", icon: Users },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="pt-16 flex">
        <aside className="hidden lg:block w-60 border-r border-border min-h-[calc(100vh-4rem)] p-4 sticky top-16">
          <div className="text-xs uppercase tracking-widest text-stone px-3 mb-3">Admin</div>
          <nav className="space-y-1">
            {items.map((it) => {
              const active = loc.pathname === it.to;
              return (
                <Link key={it.to} to={it.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${active ? "bg-cream text-obsidian font-medium" : "text-ash hover:bg-muted hover:text-cream"}`}>
                  <it.icon className="w-4 h-4" /> {it.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 p-6 lg:p-10 max-w-6xl">
          <div className="lg:hidden flex gap-1 overflow-x-auto pb-3 mb-6 border-b border-border">
            {items.map((it) => {
              const active = loc.pathname === it.to;
              return (
                <Link key={it.to} to={it.to} className={`shrink-0 px-3 h-9 rounded-md text-xs whitespace-nowrap ${active ? "bg-cream text-obsidian" : "text-ash"}`}>{it.label}</Link>
              );
            })}
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
