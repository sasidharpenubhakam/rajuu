
-- Drop legacy permissive storage policy left from initial setup
DROP POLICY IF EXISTS "product images public read" ON storage.objects;
DROP POLICY IF EXISTS "product images admin write" ON storage.objects;
DROP POLICY IF EXISTS "product images admin update" ON storage.objects;
DROP POLICY IF EXISTS "product images admin delete" ON storage.objects;

-- Restrict SECURITY DEFINER function execution
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
