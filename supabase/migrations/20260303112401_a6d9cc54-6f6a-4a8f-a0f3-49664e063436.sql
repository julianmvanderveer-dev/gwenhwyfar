
-- Drop the overly permissive SELECT policy
DROP POLICY "Anyone can view profiles" ON public.profiles;

-- Users can see their own profile
CREATE POLICY "Users see own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Beheer can see all profiles (for admin management)
CREATE POLICY "Beheer sees all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (has_role('beheer'::app_role));

-- Beheer can update any profile (for toggling actief status)
CREATE POLICY "Beheer updates profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (has_role('beheer'::app_role));
