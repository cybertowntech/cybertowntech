import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ProductDetailInput = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional().nullable(),
});

const BUCKET_MARKER = "/product-thumbnails/";
async function signThumb<T extends { thumbnail_url: string | null }>(admin: any, rows: T[]): Promise<T[]> {
  const paths = rows.map((r) => {
    const u = r.thumbnail_url;
    if (!u || !u.includes(BUCKET_MARKER)) return null;
    return decodeURIComponent(u.split(BUCKET_MARKER)[1]!.split("?")[0]!);
  });
  const wanted = paths.filter((x): x is string => !!x);
  if (!wanted.length) return rows;
  const { data } = await admin.storage.from("product-thumbnails").createSignedUrls(wanted, 60 * 60 * 24 * 7);
  const map = new Map<string, string>();
  for (const d of data ?? []) if (d.path && d.signedUrl) map.set(d.path, d.signedUrl);
  return rows.map((r, i) => (paths[i] && map.has(paths[i]!) ? { ...r, thumbnail_url: map.get(paths[i]!)! } : r));
}

export const listActiveProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id,name,description,category,thumbnail_url,type,base_price,status,created_at")
    .eq("status", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return signThumb(supabaseAdmin, data ?? []);
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

    let kq = supabaseAdmin
      .from("license_keys")
      .select("id", { count: "exact", head: true })
      .eq("product_id", data.productId)
      .eq("status", "available");
    kq = data.variantId ? kq.eq("variant_id", data.variantId) : kq.is("variant_id", null);
    const { count } = await kq;

    const selectedVariant = data.variantId ? (variants ?? []).find((v) => v.id === data.variantId) ?? null : null;
    const [signedProduct] = await signThumb(supabaseAdmin, [product]);
    return { product: signedProduct!, variants: variants ?? [], availableKeys: count ?? 0, selectedVariant };
  });
