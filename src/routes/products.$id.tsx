import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Package, ShieldCheck, Zap, ShoppingCart } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import { formatMYR } from "@/lib/format";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { getProductDetail } from "@/lib/products.functions";

export const Route = createFileRoute("/products/$id")({
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [variantId, setVariantId] = useState<string | "base">("base");

  const { data, isLoading } = useQuery({
    queryKey: ["product", id, variantId],
    queryFn: () => getProductDetail({ data: { productId: id, variantId: variantId === "base" ? null : variantId } }),
  });

  useEffect(() => {
    if (data?.variants?.length && variantId === "base") setVariantId(data.variants[0].id);
  }, [data?.variants, variantId]);

  const product = data?.product;
  const variants = data?.variants ?? [];
  const currentPrice = variantId === "base" ? Number(product?.base_price ?? 0) : Number(variants.find((v) => v.id === variantId)?.price ?? 0);
  const outOfStock = product?.type === "digital" && (data?.availableKeys ?? 0) === 0;

  function addItemToCart() {
    if (!product) return;
    const v = variants.find((x) => x.id === variantId);
    add({
      productId: product.id,
      variantId: variantId === "base" ? null : variantId,
      name: product.name,
      variantName: v?.name ?? null,
      price: currentPrice,
      thumbnail_url: product.thumbnail_url,
      type: product.type,
    });
  }

  function handleBuy() {
    if (!product) return;
    addItemToCart();
    navigate({ to: "/cart" });
  }

  function handleAddToCart() {
    if (!product) return;
    addItemToCart();
    toast.success("Added to cart");
  }


  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-stone" /></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Product not found</div>;

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        <Link to="/products" className="inline-flex items-center gap-2 text-sm text-ash hover:text-cream transition mb-8">
          <ArrowLeft className="w-4 h-4" /> All products
        </Link>
        <div className="grid md:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="aspect-square rounded-2xl bg-card border border-border overflow-hidden relative">
            {product.thumbnail_url ? (
              <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-charcoal to-obsidian">
                <Package className="w-20 h-20 text-stone/30" />
              </div>
            )}
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider bg-obsidian/70 backdrop-blur text-stone">{product.type}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            {product.category && <p className="text-xs tracking-[0.3em] text-stone uppercase mb-3">{product.category}</p>}
            <h1 className="text-4xl font-display font-semibold tracking-tight">{product.name}</h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">{product.description}</p>

            {variants.length > 0 && (
              <div className="mt-8">
                <label className="text-xs uppercase tracking-widest text-stone">Choose a variant</label>
                <div className="mt-3 grid gap-2">
                  {variants.map((v) => (
                    <button key={v.id} onClick={() => setVariantId(v.id)} className={`flex items-center justify-between px-4 h-12 rounded-lg border transition ${variantId === v.id ? "border-cream bg-cream/5" : "border-border hover:border-stone"}`}>
                      <span className="text-sm">{v.name}</span>
                      <span className="font-mono text-stone">{formatMYR(v.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex items-baseline gap-3">
              <span className="text-4xl font-display font-semibold text-cream">{formatMYR(currentPrice)}</span>
              <span className="text-xs text-muted-foreground">MYR · incl. tax</span>
            </div>

            {product.type === "digital" && (
              <p className={`mt-3 text-xs ${outOfStock ? "text-destructive" : "text-stone"}`}>
                {outOfStock ? "Out of stock" : `${data?.availableKeys} license${data?.availableKeys === 1 ? "" : "s"} available`}
              </p>
            )}

            <div className="mt-8 grid sm:grid-cols-2 gap-3">
              <button onClick={handleBuy} disabled={outOfStock} className="h-12 rounded-lg bg-cream text-obsidian font-medium hover:bg-ash transition disabled:opacity-50 flex items-center justify-center gap-2">
                {outOfStock ? "Out of stock" : "Buy Now"}
              </button>
              {!outOfStock && (
                <button onClick={handleAddToCart} className="h-12 rounded-lg border border-border hover:border-stone text-cream font-medium transition flex items-center justify-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Add to Cart
                </button>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <div className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-stone" /> Secure ToyyibPay</div>
              <div className="inline-flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-stone" /> Instant delivery</div>
            </div>

            {product.notes && (
              <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border text-sm">
                <div className="text-xs uppercase tracking-widest text-stone mb-2">Notes</div>
                <p className="text-ash whitespace-pre-wrap">{product.notes}</p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
