import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/format";
import { Copy, Key as KeyIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/keys")({
  component: KeysPage,
});

function KeysPage() {
  const { user } = useAuth();
  const { data: keys = [], isLoading } = useQuery({
    queryKey: ["my-keys", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const email = user!.email ?? "";
      // Find orders owned OR matched by email, then load keys for those orders
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .or(`user_id.eq.${user!.id},customer_email.eq.${email}`);
      const orderIds = (orders ?? []).map((o) => o.id);
      const { data: directKeys } = await supabase
        .from("license_keys")
        .select("id,key_value,assigned_at,products(name,notes)")
        .eq("assigned_to", user!.id);
      let extraKeys: any[] = [];
      if (orderIds.length) {
        const { data } = await supabase
          .from("license_keys")
          .select("id,key_value,assigned_at,products(name,notes)")
          .in("order_id", orderIds);
        extraKeys = data ?? [];
      }
      const map = new Map<string, any>();
      [...(directKeys ?? []), ...extraKeys].forEach((k) => map.set(k.id, k));
      return Array.from(map.values()).sort((a, b) =>
        (b.assigned_at ?? "").localeCompare(a.assigned_at ?? "")
      );
    },
  });

  return (
    <div>
      <h2 className="text-2xl font-display font-semibold">Your License Keys</h2>
      <p className="text-sm text-muted-foreground mt-1">All keys assigned to your account.</p>
      <div className="mt-6 space-y-3">
        {isLoading && <div className="text-muted-foreground p-8 text-center">Loading…</div>}
        {!isLoading && keys.length === 0 && (
          <div className="p-12 text-center bg-card border border-border rounded-2xl text-muted-foreground">
            <KeyIcon className="w-10 h-10 mx-auto mb-3 text-stone/50" />
            No license keys yet. Make a purchase to see your keys here.
          </div>
        )}
        {keys.map((k: any) => (
          <div key={k.id} className="p-5 rounded-2xl bg-card border border-border">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="font-medium text-cream">{k.products?.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Assigned {k.assigned_at && formatDate(k.assigned_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-obsidian rounded-lg p-3 border border-border">
              <code className="flex-1 font-mono text-sm text-stone break-all">{k.key_value}</code>
              <button onClick={() => { navigator.clipboard.writeText(k.key_value); toast.success("Copied"); }} className="p-2 rounded hover:bg-muted">
                <Copy className="w-4 h-4 text-stone" />
              </button>
            </div>
            {k.products?.notes && <p className="mt-3 text-xs text-muted-foreground whitespace-pre-wrap">{k.products.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
