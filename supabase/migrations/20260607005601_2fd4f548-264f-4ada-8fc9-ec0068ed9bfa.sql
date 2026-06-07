GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT SELECT (id, product_id, status) ON public.license_keys TO anon;

DROP POLICY IF EXISTS "Public can count available license stock" ON public.license_keys;
CREATE POLICY "Public can count available license stock"
  ON public.license_keys
  FOR SELECT
  TO anon
  USING (status = 'available');