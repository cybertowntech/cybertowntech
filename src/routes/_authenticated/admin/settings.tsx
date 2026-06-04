import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const qc = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("*");
      const map: Record<string, any> = {};
      (data ?? []).forEach((s) => { map[s.key] = s.value; });
      return map;
    },
  });

  const [store, setStore] = useState({ name: "", contact_email: "", logo_url: "" });
  const [tp, setTp] = useState({ user_secret_key: "", category_code: "", sandbox: true });

  useEffect(() => {
    if (settings?.store) setStore({ name: settings.store.name ?? "", contact_email: settings.store.contact_email ?? "", logo_url: settings.store.logo_url ?? "" });
    if (settings?.toyyibpay) setTp({ user_secret_key: settings.toyyibpay.user_secret_key ?? "", category_code: settings.toyyibpay.category_code ?? "", sandbox: settings.toyyibpay.sandbox !== false });
  }, [settings]);

  async function save(key: string, value: any) {
    const { error } = await supabase.from("settings").upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) toast.error(error.message); else { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["settings"] }); }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-3xl font-display font-semibold tracking-tight">Settings</h1>

      <section className="p-6 rounded-xl bg-card border border-border">
        <h2 className="text-lg font-medium mb-4">Store</h2>
        <div className="space-y-3">
          <Field label="Store name"><input value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} className={inputCls} /></Field>
          <Field label="Contact email"><input value={store.contact_email} onChange={(e) => setStore({ ...store, contact_email: e.target.value })} className={inputCls} /></Field>
          <Field label="Logo URL"><input value={store.logo_url} onChange={(e) => setStore({ ...store, logo_url: e.target.value })} className={inputCls} /></Field>
          <button onClick={() => save("store", store)} className="px-5 h-10 rounded-lg bg-cream text-obsidian font-medium hover:bg-ash">Save store</button>
        </div>
      </section>

      <section className="p-6 rounded-xl bg-card border border-border">
        <h2 className="text-lg font-medium mb-1">ToyyibPay credentials</h2>
        <p className="text-xs text-muted-foreground mb-4">Get these from your ToyyibPay dashboard → Profile → User Secret Key, and a Category Code.</p>
        <div className="space-y-3">
          <Field label="User Secret Key"><input type="password" value={tp.user_secret_key} onChange={(e) => setTp({ ...tp, user_secret_key: e.target.value })} className={inputCls} /></Field>
          <Field label="Category Code"><input value={tp.category_code} onChange={(e) => setTp({ ...tp, category_code: e.target.value })} className={inputCls} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={tp.sandbox} onChange={(e) => setTp({ ...tp, sandbox: e.target.checked })} /> Use sandbox (dev.toyyibpay.com)</label>
          <button onClick={() => save("toyyibpay", tp)} className="px-5 h-10 rounded-lg bg-cream text-obsidian font-medium hover:bg-ash">Save credentials</button>
        </div>
        <div className="mt-4 p-3 rounded bg-obsidian text-xs text-muted-foreground">
          Webhook URL for ToyyibPay: <code className="text-stone break-all">{typeof window !== "undefined" ? window.location.origin : ""}/api/public/toyyibpay-callback</code>
        </div>
      </section>
    </div>
  );
}
const inputCls = "w-full h-10 px-3 rounded-lg bg-obsidian border border-border outline-none focus:border-stone text-sm";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs uppercase tracking-widest text-stone mb-1.5 block">{label}</label>{children}</div>;
}
