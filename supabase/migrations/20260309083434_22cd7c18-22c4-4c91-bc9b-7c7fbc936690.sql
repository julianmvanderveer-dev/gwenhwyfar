CREATE OR REPLACE FUNCTION public.link_user_to_adviseur()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.adviseurs SET user_id = NEW.id
  WHERE email = NEW.email AND user_id IS NULL;

  -- Auto-assign ep_adviseur role if linked
  IF EXISTS (SELECT 1 FROM public.adviseurs WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'ep_adviseur')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;