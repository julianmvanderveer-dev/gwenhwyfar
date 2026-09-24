# Nieuw tabblad "Berichten" voor EP-adviseurs

## Wat de adviseur ziet
- Naast **Projecten** en **Overzicht** een derde tab **Berichten** (met teller van ongelezen berichten).
- Lijst van berichten, nieuwste bovenaan. Vastgepinde berichten (bijv. aankomende BengCert-dag) staan altijd bovenaan.
- Per bericht: soort (Intervisie, BengCert-dag, Algemeen, Persoonlijk), titel, tekst, datum, eventueel datum/locatie van het evenement en een bijlage (PDF/afbeelding).
- Persoonlijke berichten krijgen een eigen label "Alleen voor u".
- Een bericht wordt als gelezen gemarkeerd zodra de adviseur het tabblad opent.

## Wat beheer kan
- In **Instellingen** een nieuwe tab **Berichten aan adviseurs**:
  - Nieuw bericht plaatsen: soort, titel, tekst, optioneel evenementdatum, bijlage, vastpinnen.
  - Ontvanger: **alle adviseurs** of **één specifieke adviseur** (keuzelijst).
  - Optioneel vinkje "Ook per mail versturen".
  - Bestaande berichten bewerken, verbergen of verwijderen; zien hoeveel adviseurs het gelezen hebben.
- Alleen beheer kan berichten plaatsen; adviseurs zien alleen algemene berichten en hun eigen persoonlijke berichten.

## Technische details
- Tabel `adviseur_berichten` (id, soort, titel, inhoud, evenement_datum, bijlage_pad, vastgepind, adviseur_id nullable = alle, actief, aangemaakt_door, created_at) + `adviseur_berichten_gelezen` (bericht_id, user_id, gelezen_op). GRANTs + RLS: beheer volledig; ep_adviseur SELECT waar `adviseur_id is null` of gekoppeld aan eigen adviseur-record.
- Bijlagen in nieuwe private bucket `adviseur-berichten`, signed URLs (1 uur).
- Mail optioneel via nieuw sjabloon `bericht-van-bengcert` in send-transactional-email.
- Frontend: `AdviseurBerichten.tsx` in Inbox (adviseurtabs), `BerichtenBeheer.tsx` in Beheer.
