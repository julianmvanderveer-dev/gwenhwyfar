## Doel

Bij **Beheer → Projectteam** moet je een persoon volledig kunnen verwijderen. De huidige prullenbak-knop verwijdert alleen het profiel en de rollen, maar laat het onderliggende inlogaccount bestaan. Daardoor kun je hetzelfde e‑mailadres later niet opnieuw uitnodigen, en blijft de persoon "spookachtig" bestaan.

## Wat er nu gebeurt

In `src/pages/Beheer.tsx` (`deleteProfile`) wordt alleen:
- `user_roles` verwijderd voor de gebruiker
- `profiles` verwijderd

Het auth-account (`auth.users`) blijft staan en kan niet vanuit de client worden verwijderd (vereist service‑role).

## Wijzigingen

### 1. Edge function uitbreiden
`supabase/functions/create-team-member/index.ts` krijgt een extra `action: "delete_user"`:
- Input: `{ action: "delete_user", user_id }`
- Controleert dat de aanroeper zelf `beheer` heeft en niet zichzelf verwijdert
- Controleert of de gebruiker nog gekoppeld is aan zaken die verwijdering blokkeren:
  - `projects.toegewezen_aan = user_id` (actieve toewijzing) → blokkeren met duidelijke melding ("eerst hertoewijzen of terug naar pool")
  - `findings.toegewezen_beoordelaar = user_id` → idem
  - `adviseurs.user_id = user_id` → koppeling losmaken (`user_id = null`) zodat de EP‑adviseur blijft bestaan
  - `projects.aangemaakt_door`, `messages.afzender_id`, `feedback.user_id`, `project_uitdraai.uploaded_by`, `externe_rapportages.geimporteerd_door`, `notificaties.user_id`: NIET blokkerend — historische data blijft, FK is nullable/los, of records worden meegenomen volgens onderstaande regels
- Verwijdert in deze volgorde (service‑role):
  1. `user_roles`, `user_audit_categorieen`, `notificaties` voor deze user
  2. `adviseurs.user_id` op `null` zetten
  3. `profiles` rij
  4. `auth.admin.deleteUser(user_id)`

### 2. Frontend (`src/pages/Beheer.tsx`)
- `deleteProfile` aanpassen zodat het de edge function aanroept met `action: "delete_user"` in plaats van directe DB‑deletes.
- Bevestigingsdialoog vervangen door `AlertDialog` (consistent met `FaseTabel`), tekst: *"Weet je zeker dat je {naam} volledig wilt verwijderen? Inlogaccount, rollen en audit‑categorieën worden gewist. Eventuele EP‑adviseur‑koppeling wordt losgemaakt; historische audits/berichten blijven bestaan."*
- Foutmeldingen van de edge function (bv. "nog toegewezen aan project X") tonen via toast.
- Na succes: profielenlijst opnieuw laden.

### 3. Geen DB‑migratie nodig
Alle benodigde tabellen bestaan; we doen alleen data‑mutaties via service‑role in de edge function.

## Veiligheidsregels
- Alleen `beheer` mag deze actie uitvoeren (server‑side check via JWT + `has_role`).
- Eigen account verwijderen blijft geblokkeerd (knop al `disabled`, plus server‑check).
- Laatste actieve `beheer`‑gebruiker mag niet verwijderd worden (extra check in edge function, conform bestaande memory "Beheer Beperkingen").

## Openstaande vraag
De prullenbak‑knop staat er al — klopt het dat je hem wel ziet maar dat "verwijderen" niet helemaal het gewenste effect heeft (account blijft bestaan, e‑mail niet opnieuw uitnodigbaar)? Of zie je de knop überhaupt niet? Bij dat laatste kijk ik eerst naar zichtbaarheids‑/rol‑issues vóór bovenstaande uitbreiding.