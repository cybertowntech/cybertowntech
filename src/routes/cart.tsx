import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShoppingCart, Trash2, Package, ArrowRight, CreditCard, Loader2, ShieldCheck, Tag, X, Check, Gift } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import SiteNav from "@/components/SiteNav";
import { useCart } from "@/context/CartContext";
import { formatMYR } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { createCartCheckout } from "@/lib/checkout.functions";
import { validateVoucher } from "@/lib/vouchers.functions";
import { setStoredGuestEmail } from "@/hooks/useDashboardEmail";


export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [
    {"title": "Cart \u2014 CyberTown Tech"},
    {"name": "description", "content": "Review your CyberTown Tech items and checkout total."},
    {"property": "og:title", "content": "Cart \u2014 CyberTown Tech"},
    {"property": "og:description", "content": "Review your CyberTown Tech items and checkout total."},
    {"property": "og:type", "content": "website"},
    {"name": "twitter:card", "content": "summary"},
  ] }),
  component: CartPage,
});

function CartPage() {
  const { items, remove, count } = useCart();
  const { user, loading } = useAuth();
  
  const [busy, setBusy] = useState(false);

  // Voucher
  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [voucherBusy, setVoucherBusy] = useState(false);

  // Guest details
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [showGuestForm, setShowGuestForm] = useState(false);

  const subtotal = items.reduce((s, i) => s + Number(i.price), 0);
  const discount = voucher?.discount ?? 0;
  const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

  async function applyVoucher() {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;
    setVoucherBusy(true);
    try {
      const res = await validateVoucher({ data: { code, subtotal } });
      if (res.ok) {
        setVoucher({ code: res.code, discount: res.discount });
        toast.success(`Voucher applied: −${formatMYR(res.discount)}`);
      } else {
        setVoucher(null);
        toast.error(res.error);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Could not validate voucher");
    } finally { setVoucherBusy(false); }
  }

  function removeVoucher() {
    setVoucher(null); setVoucherInput("");
  }

  async function payAll() {
    if (items.length === 0) return;

    // Guest path
    const guest = !user
      ? { email: guestEmail.trim(), name: guestName.trim(), phone: guestPhone.trim() }
      : null;
    if (!user) {
      if (!showGuestForm) { setShowGuestForm(true); return; }
      if (!guest!.email || !guest!.name || guest!.phone.length < 8) {
        toast.error("Please complete your details to continue as guest");
        return;
      }
    }

    setBusy(true);
    try {
      const res = await createCartCheckout({
        data: {
          items: items.map((i) => ({ productId: i.productId, variantId: i.variantId })),
          voucherCode: voucher?.code ?? null,
          guest,
        },
      });
      if (res.url) {
        // Persist guest email so the dashboard remembers them.
        if (guest?.email) setStoredGuestEmail(guest.email);
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
          <div className="mt-10 grid lg:grid-cols-[1fr_380px] gap-6">
            <div className="space-y-3">
              {items.map((i) => {
                const key = i.productId + ":" + (i.variantId ?? "");
                return (
                  <div key={key} className="flex gap-4 p-4 rounded-2xl bg-card border border-border">
                    <div className="w-20 h-20 shrink-0 rounded-lg bg-gradient-to-br from-charcoal to-obsidian overflow-hidden flex items-center justify-center">
                      {i.thumbnail_url ? <img src={i.thumbnail_url} alt={i.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <Package className="w-8 h-8 text-stone/40" />}
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
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatMYR(subtotal)}</span>
                </div>
                {voucher && (
                  <div className="flex justify-between text-stone">
                    <span className="inline-flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> {voucher.code}</span>
                    <span className="font-mono">−{formatMYR(discount)}</span>
                  </div>
                )}
              </div>

              {/* Voucher input */}
              <div className="mt-4">
                {voucher ? (
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-obsidian border border-stone/40">
                    <span className="text-xs text-stone inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Voucher applied</span>
                    <button onClick={removeVoucher} className="h-7 w-7 inline-flex items-center justify-center rounded text-ash hover:text-cream"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={voucherInput}
                      onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                      placeholder="Voucher code"
                      className="flex-1 h-10 px-3 rounded-lg bg-obsidian border border-border focus:border-stone outline-none text-sm uppercase tracking-wider"
                    />
                    <button
                      onClick={applyVoucher}
                      disabled={voucherBusy || !voucherInput.trim()}
                      className="px-4 h-10 rounded-lg border border-border hover:border-stone text-sm transition disabled:opacity-50"
                    >
                      {voucherBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-2xl font-display font-semibold text-cream">{formatMYR(total)}</span>
              </div>

              {/* Guest details */}
              {!user && !loading && showGuestForm && (
                <div className="mt-5 space-y-2">
                  <p className="text-xs text-muted-foreground">We'll create your dashboard with this email so you can always find your purchases.</p>
                  <input value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} type="email" required placeholder="Email address" className="w-full h-10 px-3 rounded-lg bg-obsidian border border-border focus:border-stone outline-none text-sm" />
                  <input value={guestName} onChange={(e) => setGuestName(e.target.value)} required placeholder="Full name" className="w-full h-10 px-3 rounded-lg bg-obsidian border border-border focus:border-stone outline-none text-sm" />
                  <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value.replace(/[^\d+]/g, ""))} required placeholder="Phone (e.g. 60123456789)" className="w-full h-10 px-3 rounded-lg bg-obsidian border border-border focus:border-stone outline-none text-sm" />
                </div>
              )}

              <button
                onClick={payAll}
                disabled={busy || loading}
                className="mt-6 h-12 w-full rounded-lg bg-cream text-obsidian font-medium hover:bg-ash transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : total <= 0 ? <Gift className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                {total <= 0
                  ? (user || showGuestForm ? "Claim for free" : "Continue to checkout")
                  : (user || showGuestForm ? `Pay ${formatMYR(total)} with ToyyibPay` : "Continue to payment")}
              </button>


              {!user && !loading && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/auth" search={{ redirect: "/cart" }} className="text-cream hover:underline">Sign in</Link>
                </p>
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
