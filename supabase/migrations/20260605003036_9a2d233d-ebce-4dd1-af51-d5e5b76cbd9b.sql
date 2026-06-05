-- Explicit deny policies on user_roles for non-admins (defense in depth)
CREATE POLICY "Only admins insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));