import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShoppingCart, Trash2, Package, ArrowRight, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";
import { useCart } from "@/context/CartContext";
import { formatMYR } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { createCartCheckout } from "@/lib/checkout.functions";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart — CyberTown Tech" },
      { name: "description", content: "Review your items and check out securely." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, remove, count } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const total = items.reduce((s, i) => s + Number(i.price), 0);

  async function payAll() {
    if (items.length === 0) return;
    if (!user) {
      navigate({ to: "/auth", search: { redirect: "/cart" } });
      return;
    }
    setBusy(true);
    try {
      const res = await createCartCheckout({
        data: { items: items.map((i) => ({ productId: i.productId, variantId: i.variantId })) },
      });
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      throw new Error(res.error ?? "Checkout failed");
    } catch (e: any) {
      console.error("Cart checkout failed:", e);
      toast.error(e?.message ?? "Checkout failed");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs tracking-[0.3em] text-stone uppercase mb-3">Cart</p>
          <h1 className="text-4xl md:text-5xl font-display font-semibold tracking-tight">Your Cart</h1>
          <p className="mt-3 text-muted-foreground">{count} item{count === 1 ? "" : "s"}</p>
        </motion.div>

        {count === 0 ? (
          <div className="mt-16 text-center py-20 rounded-2xl bg-card border border-border">
            <ShoppingCart className="w-12 h-12 mx-auto text-stone mb-4" />
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Link to="/products" className="mt-6 inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-cream text-obsidian font-medium hover:bg-ash transition">
              Browse products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid lg:grid-cols-[1fr_360px] gap-6">
            <div className="space-y-3">
              {items.map((i) => {
                const key = i.productId + ":" + (i.variantId ?? "");
                return (
                  <div key={key} className="flex gap-4 p-4 rounded-2xl bg-card border border-border">
                    <div className="w-20 h-20 shrink-0 rounded-lg bg-gradient-to-br from-charcoal to-obsidian overflow-hidden flex items-center justify-center">
                      {i.thumbnail_url ? <img src={i.thumbnail_url} alt={i.name} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-stone/40" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase tracking-widest text-stone">{i.type}</div>
                      <h3 className="font-medium text-cream truncate">{i.name}</h3>
                      {i.variantName && <p className="text-xs text-muted-foreground">{i.variantName}</p>}
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="font-mono text-stone">{formatMYR(i.price)}</span>
                        <button onClick={() => remove(i.productId, i.variantId)} className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border hover:border-destructive hover:text-destructive transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="h-fit p-6 rounded-2xl bg-card border border-border">
              <h2 className="font-display text-lg font-semibold">Summary</h2>
              <div className="mt-4 space-y-2 text-sm">
                {items.map((i) => (
                  <div key={i.productId + ":" + (i.variantId ?? "")} className="flex justify-between text-muted-foreground">
                    <span className="truncate pr-2">{i.name}</span>
                    <span className="font-mono shrink-0">{formatMYR(i.price)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-2xl font-display font-semibold text-cream">{formatMYR(total)}</span>
              </div>

              {!user && !loading ? (
                <Link to="/auth" search={{ redirect: "/cart" }} className="mt-6 h-12 w-full rounded-lg bg-cream text-obsidian font-medium hover:bg-ash transition flex items-center justify-center gap-2">
                  Sign in to pay
                </Link>
              ) : (
                <button onClick={payAll} disabled={busy || loading} className="mt-6 h-12 w-full rounded-lg bg-cream text-obsidian font-medium hover:bg-ash transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  Pay {formatMYR(total)} with ToyyibPay
                </button>
              )}
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-stone" /> One secure payment for all items
              </div>
              <Link to="/products" className="mt-4 block text-center text-sm text-ash hover:text-cream transition">Continue shopping →</Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
