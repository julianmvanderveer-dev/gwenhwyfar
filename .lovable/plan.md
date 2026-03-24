

## Plan: Projectuitdraai upload met bewerkbare AI-extractie

### Overzicht
Upload een projectuitdraai (PDF/afbeelding) bij een project. AI extraheert per checklistcode de relevante waarde. De geëxtraheerde tekst is **bewerkbaar** per controlepunt, zichtbaar voor EP-adviseurs, en opgenomen in het auditrapport.

### Stappen

#### 1. Database: tabel `project_uitdraai`
```sql
CREATE TABLE public.project_uitdraai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  bestandsnaam text NOT NULL,
  bestand_pad text,
  status text NOT NULL DEFAULT 'uploading',
  extracted_data jsonb DEFAULT '{}',
  uploaded_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
```
RLS: beheer/tekenaar/auditor mogen CRUD. EP-adviseur mag lezen.

#### 2. Storage bucket: `project-documents`
Private bucket voor ge-uploade uitdraai-bestanden.

#### 3. Edge function: `extract-uitdraai`
- Ontvangt `project_id` en `bestand_pad`
- Haalt checklist-templates op voor de audit-categorie
- Downloadt bestand via signed URL, stuurt als base64 naar Lovable AI (Gemini 2.5 Pro)
- Prompt vraagt per checklistcode de relevante waarde te extraheren
- Slaat resultaat op als JSON in `extracted_data`

#### 4. Frontend: upload + bewerkbare uitdraai-kolom
In `ProjectDetail.tsx`:
- Uploadknop boven de tabs
- Status-indicator ("AI leest document uit...")
- Nieuwe kolom **"Uitdraai"** in de checklisttabel
- Tekst is bewerkbaar via een `<Input>` veld voor tekenaar/auditor
- Wijzigingen worden per veld opgeslagen naar `extracted_data` JSONB (debounced)
- EP-adviseur ziet de tekst als alleen-lezen

#### 5. Auditrapport: uitdraai-kolom
In `generateAuditReport.ts`: extra kolom "Uitdraai" met de waarde per controlepunt.

### Wijzigingen

| Bestand | Wijziging |
|---------|-----------|
| Database migratie | Tabel `project_uitdraai`, bucket, RLS |
| `supabase/functions/extract-uitdraai/index.ts` | AI-extractie edge function |
| `src/pages/ProjectDetail.tsx` | Upload-component, bewerkbare "Uitdraai" kolom, data laden/opslaan |
| `src/lib/generateAuditReport.ts` | Extra kolom "Uitdraai" in rapport |

### Impact op huidige weergave
- Extra kolom "Uitdraai" in de checklisttabel (alleen gevuld als er een uitdraai is geüpload)
- Uploadknop boven de tabs
- Extra kolom in het PDF-rapport

