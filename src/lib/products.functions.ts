import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ProductDetailInput = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
});

export const listActiveProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id,name,description,category,thumbnail_url,type,base_price,status,created_at")
    .eq("status", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export const getProductDetail = createServerFn({ method: "GET" })
  .inputValidator((input) => ProductDetailInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", data.productId)
      .eq("status", true)
      .maybeSingle();
    if (productError) throw productError;
    if (!product) return { product: null, variants: [], availableKeys: 0, selectedVariant: null };

    const { data: variants, error: variantsError } = await supabaseAdmin
      .from("product_variants")
      .select("*")
      .eq("product_id", data.productId)
      .order("price");
    if (variantsError) throw variantsError;

    const { count } = await supabaseAdmin
      .from("license_keys")
      .select("id", { count: "exact", head: true })
      .eq("product_id", data.productId)
      .eq("status", "available");

    const selectedVariant = data.variantId ? (variants ?? []).find((v) => v.id === data.variantId) ?? null : null;
    return { product, variants: variants ?? [], availableKeys: count ?? 0, selectedVariant };
  });