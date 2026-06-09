
-- 1. License keys per variant
ALTER TABLE public.license_keys ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_license_keys_variant_status ON public.license_keys(product_id, variant_id, status);

-- 2. Vouchers
DO $$ BEGIN
  CREATE TYPE voucher_discount_type AS ENUM ('percent','fixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type voucher_discount_type NOT NULL,
  discount_value numeric(10,2) NOT NULL CHECK (discount_value > 0),
  max_uses integer,
  uses integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vouchers TO authenticated;
GRANT ALL ON public.vouchers TO service_role;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage vouchers" ON public.vouchers;
CREATE POLICY "Admins manage vouchers" ON public.vouchers
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 3. Orders: voucher + discount columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS voucher_code text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) NOT NULL DEFAULT 0;

-- 4. Allow customers to view orders made under their email (guest orders linked to email)
DROP POLICY IF EXISTS "Users view orders by email" ON public.orders;
CREATE POLICY "Users view orders by email" ON public.orders
  FOR SELECT TO authenticated
  USING (customer_email = (auth.jwt() ->> 'email'));

-- 5. Allow customers to view license keys for orders with matching email
DROP POLICY IF EXISTS "Users view keys via email-matched orders" ON public.license_keys;
CREATE POLICY "Users view keys via email-matched orders" ON public.license_keys
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = license_keys.order_id
        AND o.customer_email = (auth.jwt() ->> 'email')
    )
  );

-- 6. Fix security: drop publicly readable policy on license_keys
DROP POLICY IF EXISTS "Public can count available license stock" ON public.license_keys;
