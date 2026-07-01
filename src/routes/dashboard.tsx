import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import SiteNav from "@/components/SiteNav";
import { LayoutDashboard, ShoppingBag, Key, Mail } from "lucide-react";
import { useDashboardEmail } from "@/hooks/useDashboardEmail";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CyberTown Tech" },
      { name: "description", content: "View your orders and license keys." },
    ],
  }),
  component: DashboardLayout,
});

function DashboardLayout() {
  const loc = useLocation();
  const { email, loading, setGuestEmail } = useDashboardEmail();
  const [input, setInput] = useState("");

  const items = [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
    { to: "/dashboard/keys", label: "License Keys", icon: Key },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        {!email && !loading ? (
          <div className="max-w-md mx-auto mt-20 p-8 rounded-2xl bg-card border border-border">
            <Mail className="w-8 h-8 text-stone mb-4" />
            <h1 className="text-2xl font-display font-semibold">Access your dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter the email you used at checkout to see your orders and license keys.
            </p>
            <form
              onSubmit={(e) => { e.preventDefault(); if (input.trim()) setGuestEmail(input.trim()); }}
              className="mt-5 space-y-3"
            >
              <input
                type="email" required value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 px-3 rounded-lg bg-obsidian border border-border focus:border-stone outline-none text-sm"
              />
              <button type="submit" className="w-full h-11 rounded-lg bg-cream text-obsidian font-medium hover:bg-ash transition">
                Continue
              </button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Have an account? <Link to="/auth" className="text-cream hover:underline">Sign in</Link>
            </p>
          </div>
        ) : (
          <>
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
          </>
        )}
      </main>
    </div>
  );
}
