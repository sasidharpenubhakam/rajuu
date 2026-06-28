
-- 1) Remove hardcoded admin backdoor from handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email));

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

-- 2) Lock down direct INSERTs on orders/order_items - all writes must go through place_order RPC
DROP POLICY IF EXISTS "orders own insert" ON public.orders;
DROP POLICY IF EXISTS "order_items insert" ON public.order_items;

-- 3) place_order RPC: server-side price + coupon validation, atomic used_count increment
CREATE OR REPLACE FUNCTION public.place_order(
  _shipping_address jsonb,
  _coupon_code text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _subtotal numeric := 0;
  _discount numeric := 0;
  _total numeric := 0;
  _order_id uuid;
  _coupon record;
  _has_items boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Make sure cart is non-empty
  SELECT EXISTS(SELECT 1 FROM public.cart_items WHERE user_id = _uid) INTO _has_items;
  IF NOT _has_items THEN RAISE EXCEPTION 'Cart is empty'; END IF;

  -- Authoritative subtotal from current product prices
  SELECT COALESCE(SUM(p.price * ci.quantity), 0) INTO _subtotal
  FROM public.cart_items ci
  JOIN public.products p ON p.id = ci.product_id
  WHERE ci.user_id = _uid AND p.is_active = true;

  IF _subtotal <= 0 THEN RAISE EXCEPTION 'Invalid cart total'; END IF;

  -- Validate + atomically lock coupon
  IF _coupon_code IS NOT NULL AND length(_coupon_code) > 0 THEN
    SELECT * INTO _coupon FROM public.coupons
    WHERE code = _coupon_code AND is_active = true
    FOR UPDATE;

    IF _coupon.id IS NULL THEN RAISE EXCEPTION 'Invalid coupon'; END IF;
    IF _coupon.valid_until IS NOT NULL AND _coupon.valid_until < now() THEN
      RAISE EXCEPTION 'Coupon expired';
    END IF;
    IF _coupon.valid_from > now() THEN RAISE EXCEPTION 'Coupon not yet valid'; END IF;
    IF _subtotal < COALESCE(_coupon.min_order_value, 0) THEN
      RAISE EXCEPTION 'Order does not meet minimum value for coupon';
    END IF;
    IF _coupon.usage_limit IS NOT NULL AND _coupon.used_count >= _coupon.usage_limit THEN
      RAISE EXCEPTION 'Coupon usage limit reached';
    END IF;

    IF _coupon.discount_type = 'percent' THEN
      _discount := (_subtotal * _coupon.discount_value) / 100;
    ELSE
      _discount := _coupon.discount_value;
    END IF;
    IF _coupon.max_discount IS NOT NULL THEN
      _discount := LEAST(_discount, _coupon.max_discount);
    END IF;
    _discount := ROUND(_discount);

    UPDATE public.coupons SET used_count = used_count + 1 WHERE id = _coupon.id;
  END IF;

  _total := GREATEST(0, _subtotal - _discount);

  INSERT INTO public.orders (user_id, subtotal, discount, shipping, total, coupon_code,
    shipping_address, payment_method, payment_status, status)
  VALUES (_uid, _subtotal, _discount, 0, _total, _coupon_code,
    _shipping_address, 'mock', 'paid', 'confirmed')
  RETURNING id INTO _order_id;

  INSERT INTO public.order_items (order_id, product_id, product_name, product_image,
    size, color, quantity, price, status)
  SELECT _order_id, p.id, p.name, COALESCE(p.images[1], NULL),
    ci.size, ci.color, ci.quantity, p.price, 'confirmed'
  FROM public.cart_items ci
  JOIN public.products p ON p.id = ci.product_id
  WHERE ci.user_id = _uid AND p.is_active = true;

  DELETE FROM public.cart_items WHERE user_id = _uid;

  RETURN _order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.place_order(jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, text) TO authenticated;
