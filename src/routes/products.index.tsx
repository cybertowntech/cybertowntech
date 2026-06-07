import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Package } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import { formatMYR } from "@/lib/format";
import { listActiveProducts } from "@/lib/products.functions";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "Products — CyberTown Tech" },
      { name: "description", content: "Browse digital goods and web development services from CyberTown Tech Malaysia." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [type, setType] = useState<string>("all");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => listActiveProducts(),
  });

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean) as string[]);
    return ["all", ...Array.from(set)];
  }, [products]);

  const filtered = products.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat !== "all" && p.category !== cat) return false;
    if (type !== "all" && p.type !== type) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs tracking-[0.3em] text-stone uppercase mb-3">Catalog</p>
          <h1 className="text-4xl md:text-6xl font-display font-semibold tracking-tight">All Products</h1>
          <p className="mt-3 text-muted-foreground">Digital goods, license keys & web services — delivered instantly.</p>
        </motion.div>

        <div className="mt-10 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="w-full h-12 pl-11 pr-4 rounded-lg bg-card border border-border focus:border-stone outline-none text-sm" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "digital", "service"].map((t) => (
              <button key={t} onClick={() => setType(t)} className={`px-4 h-10 rounded-full text-xs uppercase tracking-wider border transition ${type === t ? "bg-cream text-obsidian border-cream" : "border-border text-ash hover:border-stone"}`}>{t}</button>
            ))}
          </div>
        </div>

        {categories.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {categories.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`shrink-0 px-3 h-8 rounded-full text-xs border transition ${cat === c ? "bg-stone/20 border-stone text-cream" : "border-border text-ash hover:border-stone/60"}`}>{c}</button>
            ))}
          </div>
        )}

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-2xl bg-card border border-border animate-pulse" />
          ))}
          {!isLoading && filtered.length === 0 && (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 text-stone" />
              No products found.
            </div>
          )}
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link to="/products/$id" params={{ id: p.id }} className="block group rounded-2xl bg-card border border-border hover:border-stone/60 transition overflow-hidden">
                <div className="aspect-[4/3] bg-gradient-to-br from-charcoal to-obsidian relative overflow-hidden">
                  {p.thumbnail_url ? (
                    <img src={p.thumbnail_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-12 h-12 text-stone/40" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-2 py-1 rounded text-[10px] uppercase tracking-wider bg-obsidian/70 backdrop-blur text-stone">{p.type}</div>
                </div>
                <div className="p-5">
                  {p.category && <div className="text-[10px] uppercase tracking-widest text-stone mb-2">{p.category}</div>}
                  <h3 className="font-medium text-cream">{p.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-stone font-mono">{formatMYR(p.base_price)}</span>
                    <span className="text-xs text-cream group-hover:translate-x-1 transition">View →</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
