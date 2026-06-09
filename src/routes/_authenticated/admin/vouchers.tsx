import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatMYR } from "@/lib/format";
import { Plus, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/vouchers")({
  component: AdminVouchers,
});

function AdminVouchers() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("10");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ["admin-vouchers"],
    queryFn: async () => (await supabase.from("vouchers").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  async function createVoucher() {
    const c = code.trim().toUpperCase();
    const v = Number(discountValue);
    if (!c || !v || v <= 0) { toast.error("Enter a code and a positive discount"); return; }
    const { error } = await supabase.from("vouchers").insert({
      code: c,
      discount_type: discountType,
      discount_value: v,
      max_uses: maxUses ? Number(maxUses) : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      active: true,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Voucher created");
    setCode(""); setDiscountValue("10"); setMaxUses(""); setExpiresAt("");
    qc.invalidateQueries({ queryKey: ["admin-vouchers"] });
  }

  async function toggleActive(id: string, active: boolean) {
    const { error } = await supabase.from("vouchers").update({ active: !active }).eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-vouchers"] });
  }

  async function deleteVoucher(id: string) {
    if (!confirm("Delete this voucher?")) return;
    const { error } = await supabase.from("vouchers").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-vouchers"] });
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Tag className="w-6 h-6 text-stone" />
        <h1 className="text-3xl font-display font-semibold tracking-tight">Vouchers</h1>
      </div>

      <div className="p-5 rounded-xl bg-card border border-border mb-8">
        <div className="text-xs uppercase tracking-widest text-stone mb-3">Create voucher</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CODE (e.g. CYBER10)" className="h-10 px-3 rounded-lg bg-obsidian border border-border text-sm uppercase tracking-wider" />
          <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)} className="h-10 px-3 rounded-lg bg-obsidian border border-border text-sm">
            <option value="percent">Percent (%)</option>
            <option value="fixed">Fixed (MYR)</option>
          </select>
          <input value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} type="number" min="0" step="0.01" placeholder="Value" className="h-10 px-3 rounded-lg bg-obsidian border border-border text-sm" />
          <input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} type="number" min="0" placeholder="Max uses (optional)" className="h-10 px-3 rounded-lg bg-obsidian border border-border text-sm" />
          <input value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} type="date" placeholder="Expires" className="h-10 px-3 rounded-lg bg-obsidian border border-border text-sm" />
        </div>
        <button onClick={createVoucher} className="mt-3 inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-cream text-obsidian text-sm font-medium hover:bg-ash">
          <Plus className="w-4 h-4" /> Add voucher
        </button>
      </div>

      <div className="rounded-xl bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-stone">
            <tr>
              <th className="text-left p-3">Code</th>
              <th className="text-left p-3">Discount</th>
              <th className="text-left p-3">Uses</th>
              <th className="text-left p-3">Expires</th>
              <th className="text-left p-3">Active</th>
              <th className="text-right p-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading…</td></tr>}
            {!isLoading && vouchers.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No vouchers yet</td></tr>}
            {vouchers.map((v: any) => (
              <tr key={v.id} className="border-t border-border">
                <td className="p-3 font-mono text-cream">{v.code}</td>
                <td className="p-3">{v.discount_type === "percent" ? `${v.discount_value}%` : formatMYR(Number(v.discount_value))}</td>
                <td className="p-3 text-muted-foreground">{v.uses}{v.max_uses ? ` / ${v.max_uses}` : ""}</td>
                <td className="p-3 text-muted-foreground">{v.expires_at ? formatDate(v.expires_at) : "—"}</td>
                <td className="p-3">
                  <button onClick={() => toggleActive(v.id, v.active)} className={`text-xs px-2 py-0.5 rounded-full border ${v.active ? "border-stone text-cream" : "border-border text-muted-foreground"}`}>
                    {v.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => deleteVoucher(v.id)} className="h-8 w-8 inline-flex items-center justify-center rounded text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
