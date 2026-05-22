## Doel
EP-adviseurs (geregistreerde accounts via `link_user_to_adviseur`) verschijnen nu ook in tab **Projectteam** van /beheer. Dat moet niet — Projectteam is alleen voor intern personeel.

**Regel**: een gebruiker hoort alleen in *Projectteam* thuis als zijn e-mailadres eindigt op `@borgch.nl`. Anders mag het profiel alleen in de tab *EP-adviseurs* zichtbaar zijn (via de `adviseurs`-tabel).

## Wijziging
**`src/pages/Beheer.tsx` — `loadUsers()` (regel 104-120)**

Filter de geladen `profiles` op `email` (case-insensitive) zodat alleen rijen met domein `@borgch.nl` overblijven:

```ts
const teamProfiles = (profileData ?? []).filter(
  (p) => p.email?.toLowerCase().endsWith("@borgch.nl"),
);
```

De rest (mapping van `roles` + `auditCategorieen`, sortering) blijft ongewijzigd, maar werkt op deze gefilterde lijst.

## Bewust niet wijzigen
- **`link_user_to_adviseur` trigger / `handle_new_user`**: blijven werken zoals nu. Een EP-adviseur die zich registreert krijgt nog steeds een profiel + rol `ep_adviseur` — alleen wordt dat profiel in de Beheer-UI uitgefilterd uit Projectteam. Hij blijft normaal werken (RLS, login, dashboard) en blijft zichtbaar in tab *EP-adviseurs* via de `adviseurs`-tabel.
- **`adviseurs`-tabel & EP-adviseurs-tab**: hier verandert niets. Iemand met `@borgch.nl` mag wel in beide lijsten staan (bv. interne tester met dubbele rol).
- **CSV-export Projectteam**: gebruikt dezelfde `profiles`-state, dus exporteert automatisch de gefilterde lijst.
- **Bestaande Projectteam-acties** (rol toekennen, activeren, verwijderen): blijven werken, alleen niet meer toepasbaar op EP-adviseur-accounts via deze UI — dat is gewenst gedrag.

## Geen DB-migratie nodig
Pure UI-filter; geen schema- of policy-wijziging.

## Open vraag
Wil je ook dat bestaande EP-adviseur-profielen (zonder `@borgch.nl`) die per ongeluk al een extra interne rol hebben gekregen (bv. `auditor`) een waarschuwing tonen of automatisch worden opgeschoond? Standaard doe ik daar niets aan — alleen het verbergen uit de lijst.