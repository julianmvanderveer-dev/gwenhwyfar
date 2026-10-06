# Oudere afgeronde audits inzien bij Beheer → Projecten

Bij het tabblad Projecten (beheerweergave) worden nu alleen projecten geladen die níét de status "gesloten" hebben. Oudere, definitief gearchiveerde audits (zoals 1561DD_5d Heiligeweg) zijn daardoor onvindbaar in het overzicht.

## Aanpak

- De projectenquery in de inbox/beheerweergave laadt voortaan óók projecten met status "gesloten".
- De groep "Afgerond" toont daarmee zowel afgeronde als gesloten projecten, gesorteerd op archiveringsdatum (nieuwste eerst). De bestaande kolom met archiefdatum blijft dat onderscheid zichtbaar maken.
- Om de lijst overzichtelijk te houden krijgt de groep "Afgerond" een zoekveld (op projectnaam en adviseur) en een jaarfilter, vergelijkbaar met het bestaande overzicht "Mijn afgeronde audits" op het auditordashboard.
- Alleen zichtbaar in de beheerweergave; auditors en tekenaars behouden hun huidige overzichten.

## Technische details

- `src/pages/Inbox.tsx`: verwijder de `.neq("status", "gesloten")` uit de projectenquery (alleen effectief voor beheerders; de Afgerond-groep wordt alleen in de beheerweergave getoond).
- De auditor-bepaling voor afgeronde projecten (regel ~79-110) filtert nu op `status === "afgerond"`; uitbreiden naar ook `gesloten`, zodat de kolom "Auditor" ook bij oudere audits gevuld wordt.
- `src/components/projecten/FaseTabel.tsx` of de Afgerond-sectie in `Inbox.tsx`: zoekveld + jaarfilter toevoegen voor de Afgerond-groep.
- RLS: beheerders mogen alle projecten al lezen; geen policy-wijziging nodig.
