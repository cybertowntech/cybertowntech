DROP POLICY IF EXISTS "Public read product thumbnails" ON storage.objects;
CREATE POLICY "Admins read product thumbnails" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'product-thumbnails' AND public.is_admin(auth.uid()));