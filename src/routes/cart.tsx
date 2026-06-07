import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShoppingCart, Trash2, Package, ArrowRight } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import { useCart } from "@/context/CartContext";
import { formatMYR } from "@/lib/format";

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
  const total = items.reduce((s, i) => s + Number(i.price), 0);

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
                        <div className="flex items-center gap-2">
                          <Link to="/checkout" search={{ productId: i.productId, variantId: i.variantId ?? undefined }} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-cream text-obsidian text-sm font-medium hover:bg-ash transition">
                            Checkout
                          </Link>
                          <button onClick={() => remove(i.productId, i.variantId)} className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border hover:border-destructive hover:text-destructive transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
              <p className="mt-4 text-xs text-muted-foreground">
                Each item is checked out separately via ToyyibPay. Click <strong>Checkout</strong> next to an item to pay for it.
              </p>
              <Link to="/products" className="mt-4 block text-center text-sm text-ash hover:text-cream transition">Continue shopping →</Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
