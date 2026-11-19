import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";
import { Download, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/keys")({
  head: () => ({ meta: [
    {"title": "License Inventory \u2014 CyberTown Tech"},
    {"name": "description", "content": "Manage CyberTown Tech license inventory."},
    {"property": "og:title", "content": "License Inventory \u2014 CyberTown Tech"},
    {"property": "og:description", "content": "Manage CyberTown Tech license inventory."},
    {"property": "og:type", "content": "website"},
    {"name": "twitter:card", "content": "summary"},
  ] }),
  component: AdminKeys,
});

function AdminKeys() {
  const qc = useQueryClient();
  const [productId, setProductId] = useState<string>("all");
  const [variantId, setVariantId] = useState<string>("base");
  const [add, setAdd] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products-min"],
    queryFn: async () => (await supabase.from("products").select("id,name").eq("type", "digital").order("name")).data ?? [],
  });

  const { data: variants = [] } = useQuery({
    queryKey: ["admin-variants", productId],
    enabled: productId !== "all",
    queryFn: async () => (await supabase.from("product_variants").select("id,name,price").eq("product_id", productId).order("price")).data ?? [],
  });

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ["admin-keys", productId, variantId],
    queryFn: async () => {
      let q = supabase.from("license_keys").select("*,products(name),product_variants(name)").order("created_at", { ascending: false });
      if (productId !== "all") q = q.eq("product_id", productId);
      if (productId !== "all" && variantId !== "base" && variantId !== "all") q = q.eq("variant_id", variantId);
      if (productId !== "all" && variantId === "base") q = q.is("variant_id", null);
      const { data } = await q;
      const userIds = Array.from(new Set((data ?? []).map((k: any) => k.assigned_to).filter(Boolean)));
      let emailMap: Record<string, string> = {};
      if (userIds.length) {
        const { data: profs } = await supabase.from("profiles").select("id,email").in("id", userIds);
        emailMap = Object.fromEntries((profs ?? []).map((p) => [p.id, p.email]));
      }
      return (data ?? []).map((k: any) => ({ ...k, assigned_email: k.assigned_to ? emailMap[k.assigned_to] : null }));
    },
  });

  async function appendKeys() {
    if (productId === "all") { toast.error("Select a product first"); return; }
    const lines = add.split("\n").map(s => s.trim()).filter(Boolean);
    if (!lines.length) return;
    const targetVariantId = variantId === "base" || variantId === "all" ? null : variantId;
    const { error } = await supabase.from("license_keys").insert(
      lines.map(k => ({ product_id: productId, variant_id: targetVariantId, key_value: k, status: "available" as const }))
    );
    if (error) toast.error(error.message); else { toast.success(`${lines.length} keys added`); setAdd(""); qc.invalidateQueries({ queryKey: ["admin-keys"] }); }
  }

  function exportCsv() {
    const rows = [["key", "status", "product", "variant", "assigned_to", "assigned_at"]];
    keys.forEach((k: any) => rows.push([k.key_value, k.status, k.products?.name ?? "", k.product_variants?.name ?? "", k.assigned_email ?? "", k.assigned_at ?? ""]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "license_keys.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteKey(id: string, status: string) {
    const msg = status === "used"
      ? "This key has already been sold to a customer. Delete anyway?"
      : "Delete this key?";
    if (!confirm(msg)) return;
    const { error } = await supabase.from("license_keys").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Key deleted"); qc.invalidateQueries({ queryKey: ["admin-keys"] }); }
  }


  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h1 className="text-3xl font-display font-semibold tracking-tight">License Keys</h1>
        <button onClick={exportCsv} className="inline-flex items-center gap-2 px-4 h-10 rounded-lg border border-border hover:border-stone"><Download className="w-4 h-4" /> Export CSV</button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={productId} onChange={(e) => { setProductId(e.target.value); setVariantId("all"); }} className="h-10 px-3 rounded-lg bg-card border border-border text-sm">
          <option value="all">All products</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {productId !== "all" && (
          <select value={variantId} onChange={(e) => setVariantId(e.target.value)} className="h-10 px-3 rounded-lg bg-card border border-border text-sm">
            <option value="all">All variants</option>
            <option value="base">Base (no variant)</option>
            {variants.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        )}
      </div>

      {productId !== "all" && (
        <div className="mb-6 p-4 rounded-xl bg-card border border-border">
          <div className="text-xs uppercase tracking-widest text-stone mb-2">
            Append keys (one per line) → {variantId === "base" ? "Base product" : variantId === "all" ? "Pick a variant first" : (variants as any[]).find((v: any) => v.id === variantId)?.name ?? "—"}
          </div>
          <textarea rows={3} value={add} onChange={(e) => setAdd(e.target.value)} placeholder="NEW-KEY-001" className="w-full p-3 rounded bg-obsidian border border-border font-mono text-xs outline-none focus:border-stone" />
          <button onClick={appendKeys} disabled={variantId === "all"} className="mt-2 inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-cream text-obsidian text-sm font-medium hover:bg-ash disabled:opacity-50"><Plus className="w-4 h-4" /> Add to inventory</button>
        </div>
      )}

      <div className="rounded-xl bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-stone">
            <tr><th className="text-left p-3">Key</th><th className="text-left p-3">Product</th><th className="text-left p-3">Variant</th><th className="text-left p-3">Status</th><th className="text-left p-3">Assigned to</th><th className="text-left p-3">When</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading…</td></tr>}
            {keys.map((k: any) => (
              <tr key={k.id} className="border-t border-border">
                <td className="p-3 font-mono text-xs text-stone truncate max-w-[200px]">{k.key_value}</td>
                <td className="p-3">{k.products?.name}</td>
                <td className="p-3 text-muted-foreground">{k.product_variants?.name ?? "—"}</td>
                <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full border border-border">{k.status}</span></td>
                <td className="p-3 text-muted-foreground truncate max-w-[180px]">{k.assigned_email ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{k.assigned_at ? formatDate(k.assigned_at) : "—"}</td>
                <td className="p-3 text-right">
                  <button onClick={() => deleteKey(k.id, k.status)} className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
                </td>
              </tr>
            ))}

          </tbody>
        </table>
      </div>
    </div>
  );
}
