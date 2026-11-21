import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Loader2, Package, ShieldCheck } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import { createCheckout } from "@/lib/checkout.functions";
import { formatMYR } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getProductDetail } from "@/lib/products.functions";
import { ProductImage } from "@/components/ProductImage";

export const Route = createFileRoute("/checkout")({
  validateSearch: (s: Record<string, unknown>): { productId: string; variantId?: string } => ({
    productId: typeof s.productId === "string" ? s.productId : "",
    variantId: typeof s.variantId === "string" && s.variantId ? s.variantId : undefined,
  }),
  head: () => ({ meta: [
    {"title": "Checkout \u2014 CyberTown Tech"},
    {"name": "description", "content": "Complete your CyberTown Tech purchase with ToyyibPay."},
    {"property": "og:title", "content": "Checkout \u2014 CyberTown Tech"},
    {"property": "og:description", "content": "Complete your CyberTown Tech purchase with ToyyibPay."},
    {"property": "og:type", "content": "website"},
    {"name": "twitter:card", "content": "summary"},
  ] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { productId, variantId } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  const currentPath = useMemo(() => {
    const params = new URLSearchParams({ productId });
    if (variantId) params.set("variantId", variantId);
    return `/checkout?${params.toString()}`;
  }, [productId, variantId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["checkout-product", productId, variantId ?? null],
    enabled: !!productId,
    queryFn: async () => {
      const detail = await getProductDetail({ data: { productId, variantId: variantId ?? null } });
      if (!detail.product) throw new Error("Product not found");
      if (variantId && !detail.selectedVariant) throw new Error("Variant not found");
      return { product: detail.product, variant: detail.selectedVariant, availableKeys: detail.availableKeys };
    },
  });

  const amount = Number(data?.variant?.price ?? data?.product?.base_price ?? 0);
  const outOfStock = data?.product?.type === "digital" && (data?.availableKeys ?? 0) === 0;

  async function payNow() {
    if (!productId) {
      navigate({ to: "/products" });
      return;
    }
    if (!user) {
      navigate({ to: "/auth", search: { redirect: currentPath } });
      return;
    }
    if (outOfStock) {
      toast.error("This product is out of stock");
      return;
    }
    setBusy(true);
    try {
      const res = await createCheckout({ data: { productId, variantId: variantId ?? null } });
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      throw new Error(res.error ?? "Checkout failed");
    } catch (e: any) {
      console.error("Checkout failed:", e);
      toast.error(e?.message ?? "Checkout failed");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        <Link to="/products" className="inline-flex items-center gap-2 text-sm text-ash hover:text-cream transition mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to products
        </Link>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs tracking-[0.3em] text-stone uppercase mb-3">Checkout</p>
          <h1 className="text-4xl md:text-5xl font-display font-semibold tracking-tight">Secure payment</h1>
          <p className="mt-3 text-muted-foreground">Review your order and continue to ToyyibPay.</p>
        </motion.div>

        {(isLoading || loading) && (
          <div className="mt-12 flex items-center gap-3 text-stone">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading checkout…
          </div>
        )}

        {!isLoading && !loading && (error || !productId) && (
          <div className="mt-12 rounded-2xl border border-border bg-card p-8 text-center">
            <Package className="w-12 h-12 mx-auto text-stone mb-4" />
            <p className="text-muted-foreground">{error instanceof Error ? error.message : "Choose a product before checkout."}</p>
            <Link to="/products" className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-cream px-5 text-sm font-medium text-obsidian hover:bg-ash transition">
              Browse products
            </Link>
          </div>
        )}

        {data?.product && !error && (
          <div className="mt-10 grid lg:grid-cols-[1fr_360px] gap-6">
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex gap-5">
                <div className="w-24 h-24 shrink-0 rounded-lg bg-gradient-to-br from-charcoal to-obsidian overflow-hidden flex items-center justify-center">
                  <ProductImage src={data.product.thumbnail_url} alt={data.product.name} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-widest text-stone">{data.product.type}</div>
                  <h2 className="mt-1 text-xl font-display font-semibold text-cream">{data.product.name}</h2>
                  {data.variant && <p className="mt-1 text-sm text-muted-foreground">{data.variant.name}</p>}
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{data.product.description}</p>
                </div>
              </div>
            </section>

            <aside className="h-fit rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-semibold">Order summary</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Item</span>
                  <span className="text-right text-cream">{data.product.name}</span>
                </div>
                {data.variant && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Variant</span>
                    <span className="text-right">{data.variant.name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-display text-3xl font-semibold text-cream">{formatMYR(amount)}</span>
                </div>
              </div>

              {!user && !loading ? (
                <Link to="/auth" search={{ redirect: currentPath }} className="mt-6 h-12 w-full rounded-lg bg-cream text-obsidian font-medium hover:bg-ash transition flex items-center justify-center gap-2">
                  Sign in to pay
                </Link>
              ) : outOfStock ? (
                <p className="mt-5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">Out of stock</p>
              ) : (
                <button onClick={payNow} disabled={busy || !user} className="mt-6 h-12 w-full rounded-lg bg-cream text-obsidian font-medium hover:bg-ash transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  Pay with ToyyibPay
                </button>
              )}
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-stone" /> Secure ToyyibPay checkout
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}