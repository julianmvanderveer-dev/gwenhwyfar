# Adviseurs kunnen hun audits en opmerkingen altijd terugzien

## Oorzaak (vastgesteld)
Project 26Q0610 Zeestraat Volendam app 3 heeft 5 afwijkingen. Alle 5 zijn door de auditor afgehandeld ("reactie goedgekeurd"). Het afwijkingenoverzicht van de adviseur verbergt afgehandelde punten na 7 dagen. Daarom ziet Joost ze niet meer. Het project zelf staat nog op "wacht op herafmelding".

## Aanpak
1. **Afgehandelde afwijkingen niet meer laten verdwijnen.** Het statusfilter van de adviseur krijgt "Afgehandeld" en "Alles". Standaard staan de openstaande punten bovenaan. De afgehandelde punten blijven via het filter altijd te vinden, ook als ze ouder zijn dan 7 dagen.
2. **Nieuw blok "Mijn audits" (archief)** op het tabblad Projecten van de adviseur. Hierin staan al zijn eigen audits, ook afgeronde en gesloten audits. Per audit zie je de projectnaam, het auditjaar, de status en het aantal afwijkingen, met een knop "Audit inzien". Er komt een zoekveld en een auditjaarfilter bij. Dit vervangt de huidige simpele lijst "Mijn projecten".
3. **Alleen lezen.** Op een afgehandelde audit ziet de adviseur de opmerkingen, zijn eigen reacties en het oordeel van de auditor. Hij kan daar niets meer wijzigen. Adviseurs zien nog steeds alleen hun eigen audits.

## Technische details
- `src/pages/Inbox.tsx`: haal het 7-dagenfilter weg. Laad ook de status `gesloten`. Haal voor de archieflijst ook `status`, `auditjaar` en `datum_aangemaakt` op.
- `src/components/dashboard/AdviseurSectie.tsx`: voeg statusopties toe ("Afgehandeld"/"Alles") met als standaard "Openstaand". Vervang "Mijn projecten" door de archieflijst met zoeken en jaarfilter. Gebruik daarvoor `src/lib/auditjaar.ts`.
- Controleren: geeft de projectpagina een adviseur alleen-lezen toegang tot de afwijkingen bij de status afgerond/gesloten? De beveiligingsregels laten hem zijn eigen projecten en zichtbare afwijkingen al lezen. Gebeurt dat niet, dan pas ik alleen de weergave aan.
