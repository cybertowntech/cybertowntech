import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ValidateInput = z.object({
  code: z.string().min(1).max(64),
  subtotal: z.number().min(0),
});

export type VoucherValidation =
  | { ok: true; code: string; discount: number; discount_type: "percent" | "fixed"; discount_value: number }
  | { ok: false; error: string };

export const validateVoucher = createServerFn({ method: "POST" })
  .inputValidator((input) => ValidateInput.parse(input))
  .handler(async ({ data }): Promise<VoucherValidation> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.code.trim().toUpperCase();
    const { data: v } = await supabaseAdmin
      .from("vouchers").select("*").eq("code", code).maybeSingle();
    if (!v) return { ok: false, error: "Voucher not found" };
    if (!v.active) return { ok: false, error: "Voucher is inactive" };
    if (v.expires_at && new Date(v.expires_at) < new Date()) return { ok: false, error: "Voucher expired" };
    if (v.max_uses !== null && v.uses >= v.max_uses) return { ok: false, error: "Voucher fully redeemed" };

    let discount = 0;
    if (v.discount_type === "percent") {
      discount = data.subtotal * (Number(v.discount_value) / 100);
    } else {
      discount = Number(v.discount_value);
    }
    discount = Math.min(discount, data.subtotal);
    discount = Math.round(discount * 100) / 100;

    return {
      ok: true,
      code: v.code,
      discount,
      discount_type: v.discount_type as "percent" | "fixed",
      discount_value: Number(v.discount_value),
    };
  });
