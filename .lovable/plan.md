# Afgeronde audits inzien voor de auditor

Een auditor kan straks al zijn eigen afgeronde audits terugvinden: zowel projecten die aan hem toegewezen waren als projecten waarvan hij bevindingen heeft beoordeeld (ook als het project later aan iemand anders is toegewezen). Volledige historie, met zoeken en filteren, en de bestaande correctiemogelijkheden blijven werken.

## Toegang uitbreiden

De huidige toegangsregel laat een auditor alleen projecten zien die nu aan hem toegewezen zijn of die vrij in de pool liggen. Afgeronde projecten die zijn hertoegewezen of vrijgegeven verdwijnen daardoor uit beeld.

- Nieuwe hulpfunctie in de database die bepaalt of de ingelogde gebruiker beoordelaar was van minstens één bevinding van een project.
- De leesregel op projecten wordt uitgebreid: een auditor of tekenaar mag een project ook lezen als hij beoordelaar was van een bevinding daarvan.
- De bewerkregel wordt op dezelfde manier uitgebreid, zodat een correctie op een afgeronde audit (EP2-waarde, KT/NKT) mogelijk blijft. Bewerken van lopende, aan iemand anders toegewezen projecten verandert niet.
- De regel voor EP-adviseurs blijft ongewijzigd; functiescheiding blijft gelden (wie EP-adviseur van het project is, kan daar geen auditoracties doen).

## Nieuw overzicht "Mijn afgeronde audits"

Een extra, ingeklapte sectie onderaan het auditordashboard:

- Toont projecten met status afgerond of gesloten waar de gebruiker toegewezen was of bevindingen van beoordeeld heeft.
- Volledige historie, gesorteerd op afrondingsdatum (nieuwste eerst).
- Kolommen: projectnaam, EP-adviseur, categorie, soort audit, EP2-beoordeling, datum afgerond, dossierlink (Dropbox) en een knop om het project te openen.
- Filters: zoekveld op projectnaam/adviseur en een jaarfilter.
- Klikken opent de bestaande projectpagina; die is voor afgeronde projecten al read-only met de bestaande correctieopties voor EP2 en KT/NKT, inclusief verplichte toelichting en vastlegging in de wijzigingshistorie.

## Technische details

- Migratie: `security definer` functie `is_beoordelaar_van_project(_project_id uuid)` op basis van `findings.toegewezen_beoordelaar = auth.uid()`; herschrijven van de SELECT- en UPDATE-policy op `projects` met deze functie erbij.
- Nieuw component `src/components/dashboard/AfgerondeAudits.tsx`, ingevoegd in `src/components/dashboard/MedewerkerDashboard.tsx`. Query: projecten met status `afgerond`/`gesloten` (RLS filtert al op eigenaarschap), aangevuld met adviseursnaam.
- `loadProjecten` in het auditordashboard blijft afgeronde projecten uitsluiten uit de actieve lijst; die komen alleen in de nieuwe sectie.
