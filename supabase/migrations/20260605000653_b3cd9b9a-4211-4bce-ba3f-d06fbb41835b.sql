
CREATE POLICY "Public read product thumbnails"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-thumbnails');

CREATE POLICY "Admins upload thumbnails"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-thumbnails' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins update thumbnails"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-thumbnails' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins delete thumbnails"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-thumbnails' AND public.is_admin(auth.uid()));
