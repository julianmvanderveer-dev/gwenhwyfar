UPDATE public.adviseurs SET user_id = '498a1983-4b17-4e84-b78f-27f99835a1f5' WHERE email = 'julian@borgch.nl' AND user_id IS NULL;

INSERT INTO public.user_roles (user_id, role) VALUES ('498a1983-4b17-4e84-b78f-27f99835a1f5', 'ep_adviseur') ON CONFLICT (user_id, role) DO NOTHING;