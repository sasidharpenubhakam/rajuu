
-- 1) USER ROLES: admin-only writes
CREATE POLICY "user_roles admin insert" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles admin update" ON public.user_roles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles admin delete" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2) ORDERS: admin-only updates
DROP POLICY IF EXISTS "orders update" ON public.orders;
CREATE POLICY "orders admin update" ON public.orders
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) ORDER ITEMS: admin-only updates; user cancellation via SECURITY DEFINER fn
DROP POLICY IF EXISTS "order_items update" ON public.order_items;
CREATE POLICY "order_items admin update" ON public.order_items
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.cancel_my_order_item(_item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner uuid;
  _status order_item_status;
BEGIN
  SELECT o.user_id, oi.status INTO _owner, _status
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE oi.id = _item_id;

  IF _owner IS NULL THEN RAISE EXCEPTION 'Order item not found'; END IF;
  IF _owner <> auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _status IN ('shipped','delivered','cancelled') THEN
    RAISE EXCEPTION 'Item can no longer be cancelled';
  END IF;

  UPDATE public.order_items SET status = 'cancelled' WHERE id = _item_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_my_order_item(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_my_order_item(uuid) TO authenticated;

-- 4) COUPONS: restrict base table read; expose safe view
DROP POLICY IF EXISTS "coupons read active" ON public.coupons;
CREATE POLICY "coupons admin read" ON public.coupons
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.coupons_public
WITH (security_invoker = on) AS
SELECT id, code, description, discount_type, discount_value,
       min_order_value, max_discount, valid_from, valid_until, is_active
FROM public.coupons
WHERE is_active = true
  AND (valid_from IS NULL OR valid_from <= now())
  AND (valid_until IS NULL OR valid_until >= now());

GRANT SELECT ON public.coupons_public TO anon, authenticated;

-- 5) STORAGE: restrict listing on product-images (public reads via URL still work)
DROP POLICY IF EXISTS "product-images list" ON storage.objects;
DROP POLICY IF EXISTS "Public can list product-images" ON storage.objects;

CREATE POLICY "product-images public read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'product-images'
    AND (auth.role() = 'authenticated' AND public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "product-images admin write" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
