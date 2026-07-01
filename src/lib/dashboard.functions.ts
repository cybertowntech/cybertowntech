import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Public dashboard lookup by email. Any visitor can look up their orders and
// license keys using the email they used at checkout.
export const getMyDashboard = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ email: z.string().email().max(160) }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim();

    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id,amount,status,created_at,voucher_code,discount_amount,customer_email,products(name,notes),product_variants(name)")
      .ilike("customer_email", email)
      .order("created_at", { ascending: false });

    const orderIds = (orders ?? []).map((o: any) => o.id);
    let keys: any[] = [];
    if (orderIds.length) {
      const { data: k } = await supabaseAdmin
        .from("license_keys")
        .select("id,key_value,assigned_at,order_id,products(name,notes)")
        .in("order_id", orderIds);
      keys = k ?? [];
    }
    const paidOrders = (orders ?? []).filter((o: any) => o.status === "paid");
    const total = paidOrders.reduce((s: number, o: any) => s + Number(o.amount), 0);
    return {
      orders: orders ?? [],
      keys,
      total,
      orderCount: (orders ?? []).length,
      keyCount: keys.length,
    };
  });
