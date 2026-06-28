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

  -- Hardcoded super-admin: always grant admin to this email
  IF NEW.email = 'sathyabhaama@admin.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Admin-callable RPC to grant admin by email
CREATE OR REPLACE FUNCTION public.grant_admin_by_email(_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') AND
     (SELECT email FROM auth.users WHERE id = auth.uid()) <> 'sathyabhaama@admin.com' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT id INTO _uid FROM auth.users WHERE email = _email;
  IF _uid IS NULL THEN RAISE EXCEPTION 'User not found: %', _email; END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'admin') ON CONFLICT DO NOTHING;
  RETURN _uid;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_admin_by_email(_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _email = 'sathyabhaama@admin.com' THEN
    RAISE EXCEPTION 'Cannot revoke the super-admin';
  END IF;

  SELECT id INTO _uid FROM auth.users WHERE email = _email;
  IF _uid IS NULL THEN RAISE EXCEPTION 'User not found: %', _email; END IF;

  DELETE FROM public.user_roles WHERE user_id = _uid AND role = 'admin';
  RETURN _uid;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.grant_admin_by_email(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_admin_by_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grant_admin_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_admin_by_email(text) TO authenticated;

-- Ensure existing user gets admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'sathyabhaama@admin.com'
ON CONFLICT (user_id, role) DO NOTHING;