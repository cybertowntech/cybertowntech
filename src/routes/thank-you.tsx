import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, ArrowRight, Clock, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SiteNav from "@/components/SiteNav";
import { formatMYR } from "@/lib/format";
import { setStoredGuestEmail } from "@/hooks/useDashboardEmail";

export const Route = createFileRoute("/thank-you")({
  validateSearch: (s: Record<string, unknown>) => ({
    order: (s.order as string) ?? "",
    unpaid: s.unpaid === "1" || s.unpaid === 1,
    email: (s.email as string) ?? "",
    free: s.free === "1" || s.free === 1,
  }),
  component: ThankYou,
});

function ThankYou() {
  const { order: orderId, unpaid, email, free } = Route.useSearch();

  // Persist the customer email locally so their guest dashboard works after
  // browser clears / cross-device visits.
  useEffect(() => {
    if (email) setStoredGuestEmail(decodeURIComponent(email));
  }, [email]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["order-summary", orderId],
    enabled: !!orderId,
    refetchInterval: (q) => (q.state.data as any)?.order?.status === "paid" ? false : 3000,
    queryFn: async () => {
      const { data: order } = await supabase.from("orders").select("*,products(name,notes)").eq("id", orderId).maybeSingle();
      const { data: keys } = await supabase.from("license_keys").select("key_value").eq("order_id", orderId);
      return { order, keys: keys ?? [] };
    },
  });

  useEffect(() => { if (orderId) refetch(); }, [orderId, refetch]);
  const isPaid = data?.order?.status === "paid";

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="max-w-2xl mx-auto px-6 pt-32 pb-20">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          {isPaid ? (
            <CheckCircle2 className="w-20 h-20 mx-auto text-green-400 mb-6" />
          ) : (
            <Clock className="w-20 h-20 mx-auto text-stone mb-6" />
          )}
          <h1 className="text-4xl font-display font-semibold tracking-tight">
            {isPaid ? (free ? "Order confirmed!" : "Thank you!") : unpaid ? "Order pending payment" : "Processing your order…"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {isPaid
              ? "Your order is confirmed. License keys are shown below."
              : "We're waiting for confirmation from the payment gateway."}
          </p>
        </motion.div>

        {/* Processing note */}
        {!isPaid && (
          <div className="mt-8 p-4 rounded-2xl bg-muted/30 border border-border flex gap-3">
            <Info className="w-5 h-5 text-stone shrink-0 mt-0.5" />
            <div className="text-sm text-ash">
              <p className="text-cream font-medium">Please check your dashboard after 5–60 minutes.</p>
              <p className="mt-1 text-muted-foreground">
                Payments can take a few minutes to reflect. Your license keys will appear in your dashboard
                automatically once payment is confirmed — no action needed from you.
              </p>
            </div>
          </div>
        )}

        {isLoading && <div className="mt-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-stone" /></div>}

        {data?.order && (
          <div className="mt-8 p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono text-stone">{data.order.id.slice(0, 8)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Product</span>
              <span>{data.order.products?.name}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-mono">{formatMYR(data.order.amount)}</span>
            </div>

            {data.keys.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="text-xs uppercase tracking-widest text-stone mb-3">License Key(s)</div>
                <div className="space-y-2">
                  {data.keys.map((k, i) => (
                    <code key={i} className="block font-mono text-sm bg-obsidian p-3 rounded border border-border break-all">{k.key_value}</code>
                  ))}
                </div>
              </div>
            )}
            {data.order.products?.notes && (
              <div className="mt-4 p-4 rounded bg-muted/30 text-xs text-ash whitespace-pre-wrap">{data.order.products.notes}</div>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-center gap-3 flex-wrap">
          <Link to="/dashboard" className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-cream text-obsidian font-medium hover:bg-ash transition">
            Go to dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/products" className="inline-flex items-center gap-2 px-5 h-11 rounded-lg border border-border hover:border-stone transition">
            Keep shopping
          </Link>
        </div>
      </main>
    </div>
  );
}
