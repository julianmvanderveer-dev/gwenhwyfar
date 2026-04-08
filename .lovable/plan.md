

# Logo en organisatienaam aanpasbaar maken

## Aanpak

Een nieuwe tabel `app_settings` aanmaken met key-value pairs voor organisatienaam en logo-URL. In het Beheer-scherm een sectie toevoegen waar beheerders deze kunnen aanpassen. Het logo kan als afbeelding geüpload worden via Supabase Storage.

## Wijzigingen

### 1. Database: `app_settings` tabel + Storage bucket

```sql
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Iedereen mag lezen (nodig voor logo op loginpagina)
CREATE POLICY "Iedereen kan settings lezen" ON public.app_settings FOR SELECT USING (true);
-- Alleen beheerders mogen wijzigen
CREATE POLICY "Beheer kan settings wijzigen" ON public.app_settings FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'beheer')) 
  WITH CHECK (public.has_role(auth.uid(), 'beheer'));

-- Standaardwaarden
INSERT INTO public.app_settings (key, value) VALUES 
  ('org_naam', 'bengcert'),
  ('org_logo_url', '');

-- Storage bucket voor logo uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('branding', 'branding', true);
CREATE POLICY "Beheer kan uploaden" ON storage.objects FOR ALL TO authenticated 
  USING (bucket_id = 'branding' AND public.has_role(auth.uid(), 'beheer'));
CREATE POLICY "Publiek lezen branding" ON storage.objects FOR SELECT USING (bucket_id = 'branding');
```

### 2. `src/hooks/useAppSettings.ts` — Nieuwe hook

- Haalt `org_naam` en `org_logo_url` op uit `app_settings`
- Cached in React context zodat het niet per component opnieuw geladen wordt
- Biedt een `updateSetting(key, value)` functie

### 3. `src/components/AppLogo.tsx` — Nieuw component

- Als `org_logo_url` is ingesteld: toon `<img>` met die URL
- Anders: toon de bestaande `BengCertLogo` SVG maar met de aangepaste `org_naam` als tekst
- Props: `variant`, `size` (zelfde interface als huidige logo)

### 4. `src/components/AppLayout.tsx` en `src/pages/Login.tsx`

- `BengCertLogo` vervangen door `AppLogo`

### 5. `src/pages/Beheer.tsx` — Instellingen-sectie toevoegen

- Nieuw tab "Instellingen" in het beheer-scherm
- Velden:
  - **Organisatienaam**: tekstveld
  - **Logo**: bestand-upload (accepteert PNG/SVG/JPG) + preview
- Upload gaat naar de `branding` storage bucket
- Na opslaan wordt `app_settings` bijgewerkt

| Bestand | Wijziging |
|---|---|
| Database migratie | `app_settings` tabel + `branding` storage bucket |
| `src/hooks/useAppSettings.ts` | Nieuw: settings ophalen en updaten |
| `src/components/AppLogo.tsx` | Nieuw: dynamisch logo component |
| `src/components/AppLayout.tsx` | `BengCertLogo` → `AppLogo` |
| `src/pages/Login.tsx` | `BengCertLogo` → `AppLogo` |
| `src/pages/Beheer.tsx` | Nieuw tab "Instellingen" met logo-upload en naam |

