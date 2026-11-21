import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatMYR } from "@/lib/format";
import { Plus, Edit, Trash2, X, Search, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/products")({
  head: () => ({ meta: [
    {"title": "Product Management \u2014 CyberTown Tech"},
    {"name": "description", "content": "Manage CyberTown Tech products and variants."},
    {"property": "og:title", "content": "Product Management \u2014 CyberTown Tech"},
    {"property": "og:description", "content": "Manage CyberTown Tech products and variants."},
    {"property": "og:type", "content": "website"},
    {"name": "twitter:card", "content": "summary"},
  ] }),
  component: AdminProducts,
});

type Product = {
  id: string; name: string; description: string | null; category: string | null;
  thumbnail_url: string | null; type: "digital" | "service"; base_price: number; status: boolean; notes: string | null;
};

function AdminProducts() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*,license_keys(id,status)").order("created_at", { ascending: false });
      return (data ?? []) as any[];
    },
  });

  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  async function remove(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-products"] }); }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-display font-semibold tracking-tight">Products</h1>
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-cream text-obsidian font-medium hover:bg-ash"><Plus className="w-4 h-4" /> New product</button>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="w-full sm:w-80 h-10 pl-10 pr-3 rounded-lg bg-card border border-border outline-none focus:border-stone text-sm" />
      </div>
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-stone">
            <tr><th className="text-left p-3">Name</th><th className="text-left p-3">Type</th><th className="text-left p-3">Price</th><th className="text-left p-3">Keys</th><th className="text-left p-3">Status</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading…</td></tr>}
            {!isLoading && filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No products</td></tr>}
            {filtered.map((p) => {
              const available = (p.license_keys ?? []).filter((k: any) => k.status === "available").length;
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3"><div className="font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{p.category}</div></td>
                  <td className="p-3"><span className="text-xs uppercase tracking-wider text-stone">{p.type}</span></td>
                  <td className="p-3 font-mono">{formatMYR(p.base_price)}</td>
                  <td className="p-3">{p.type === "digital" ? <span className={available < 5 ? "text-yellow-400" : "text-stone"}>{available}</span> : "—"}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full border ${p.status ? "border-green-500/30 text-green-300" : "border-border text-muted-foreground"}`}>{p.status ? "active" : "inactive"}</span></td>
                  <td className="p-3 text-right">
                    <button onClick={() => setEditing(p)} className="p-2 hover:bg-muted rounded"><Edit className="w-4 h-4 text-stone" /></button>
                    <button onClick={() => remove(p.id)} className="p-2 hover:bg-muted rounded"><Trash2 className="w-4 h-4 text-destructive" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <ProductFormModal initial={editing} onClose={() => { setEditing(null); setCreating(false); }} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-products"] })} />
      )}
    </div>
  );
}

function ProductFormModal({ initial, onClose, onSaved }: { initial: Product | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "",
    thumbnail_url: initial?.thumbnail_url ?? "",
    type: (initial?.type ?? "digital") as "digital" | "service",
    base_price: initial?.base_price ?? 0,
    status: initial?.status ?? true,
    notes: initial?.notes ?? "",
  });
  const [keysText, setKeysText] = useState("");
  const [variants, setVariants] = useState<{ id?: string; name: string; price: number }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initial?.id) {
      supabase.from("product_variants").select("*").eq("product_id", initial.id).then(({ data }) => setVariants((data ?? []).map(v => ({ id: v.id, name: v.name, price: Number(v.price) }))));
    }
  }, [initial?.id]);

  async function save() {
    setBusy(true);
    try {
      let productId = initial?.id;
      if (productId) {
        const { error } = await supabase.from("products").update(f).eq("id", productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products").insert(f).select("id").single();
        if (error) throw error;
        productId = data.id;
      }
      // variants
      if (productId) {
        const existing = initial?.id ? (await supabase.from("product_variants").select("id").eq("product_id", productId)).data ?? [] : [];
        const keepIds = new Set(variants.filter(v => v.id).map(v => v.id!));
        for (const ex of existing) if (!keepIds.has(ex.id)) await supabase.from("product_variants").delete().eq("id", ex.id);
        for (const v of variants) {
          if (v.id) await supabase.from("product_variants").update({ name: v.name, price: v.price }).eq("id", v.id);
          else await supabase.from("product_variants").insert({ product_id: productId, name: v.name, price: v.price });
        }
      }
      // keys
      if (productId && f.type === "digital" && keysText.trim()) {
        const lines = keysText.split("\n").map(s => s.trim()).filter(Boolean);
        if (lines.length) {
          await supabase.from("license_keys").insert(lines.map(k => ({ product_id: productId!, key_value: k, status: "available" as const })));
        }
      }
      toast.success(initial ? "Updated" : "Created");
      onSaved(); onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 my-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium">{initial ? "Edit product" : "New product"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
          <Field label="Name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} /></Field>
          <Field label="Description"><textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={inputCls} /></Field>
          <Field label="Category"><input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className={inputCls} /></Field>
          <Field label="Thumbnail"><ThumbnailUploader value={f.thumbnail_url} onChange={(url) => setF({ ...f, thumbnail_url: url })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as any })} className={inputCls}>
                <option value="digital">Digital</option><option value="service">Service</option>
              </select>
            </Field>
            <Field label="Base price (MYR)"><input type="number" step="0.01" value={f.base_price} onChange={(e) => setF({ ...f, base_price: Number(e.target.value) })} className={inputCls} /></Field>
          </div>
          <Field label="Variants">
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="flex gap-2">
                  <input value={v.name} onChange={(e) => setVariants(variants.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Name" className={inputCls} />
                  <input type="number" step="0.01" value={v.price} onChange={(e) => setVariants(variants.map((x, j) => j === i ? { ...x, price: Number(e.target.value) } : x))} placeholder="Price" className={`${inputCls} w-32`} />
                  <button onClick={() => setVariants(variants.filter((_, j) => j !== i))} className="px-2 hover:bg-muted rounded"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <button onClick={() => setVariants([...variants, { name: "", price: 0 }])} className="text-xs text-stone hover:text-cream">+ Add variant</button>
            </div>
          </Field>
          {f.type === "digital" && (
            <Field label="License keys (one per line — appended to inventory)">
              <textarea rows={5} value={keysText} onChange={(e) => setKeysText(e.target.value)} placeholder="LICENSE-001&#10;LICENSE-002" className={`${inputCls} font-mono text-xs`} />
              <p className="text-xs text-muted-foreground mt-1">{keysText.split("\n").filter(s => s.trim()).length} keys ready to add</p>
            </Field>
          )}
          <Field label="Notes (sent with each license)"><textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={inputCls} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.status} onChange={(e) => setF({ ...f, status: e.target.checked })} /> Active</label>
        </div>
        <div className="mt-5 flex justify-end gap-2 pt-4 border-t border-border">
          <button onClick={onClose} className="px-4 h-10 rounded-lg border border-border">Cancel</button>
          <button onClick={save} disabled={busy} className="px-5 h-10 rounded-lg bg-cream text-obsidian font-medium hover:bg-ash disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full h-10 px-3 rounded-lg bg-obsidian border border-border outline-none focus:border-stone text-sm";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs uppercase tracking-widest text-stone mb-1.5 block">{label}</label>{children}</div>;
}

function ThumbnailUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(value);
  useEffect(() => {
    const m = "/product-thumbnails/";
    if (!value || !value.includes(m)) { setPreview(value); return; }
    const path = decodeURIComponent(value.split(m)[1]!.split("?")[0]!);
    supabase.storage.from("product-thumbnails").createSignedUrl(path, 3600).then(({ data }) => setPreview(data?.signedUrl ?? value));
  }, [value]);

  async function upload(file: File) {
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-thumbnails").upload(path, file, { cacheControl: "31536000", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("product-thumbnails").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Uploaded");
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-20 h-20 rounded-lg bg-obsidian border border-border overflow-hidden flex items-center justify-center shrink-0">
        {preview ? <img src={preview} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-stone/50" />}
      </div>
      <div className="flex-1 space-y-2">
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-border text-xs hover:bg-muted disabled:opacity-50">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {busy ? "Uploading…" : value ? "Replace image" : "Upload image"}
        </button>
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="…or paste image URL" className={`${inputCls} text-xs`} />
      </div>
    </div>
  );
}
