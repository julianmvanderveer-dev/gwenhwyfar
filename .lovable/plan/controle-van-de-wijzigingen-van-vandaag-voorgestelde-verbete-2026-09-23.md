# Controle van de wijzigingen van vandaag + voorgestelde verbeteringen

Ik heb ingelogd als beheerder door de app gelopen: Projecten met de vier nieuwe tabbladen, Instellingen met de vier resterende tabbladen, de exports en de foutenanalyse. Er zijn geen crashes of blokkerende fouten: alle tabbladen laden, de toewijzingslijst vult zich, de export toont 94 projecten met werkende filters en de foutenanalyse werkt. Wel vond ik zes punten die ik graag opruim.

## 1. Toewijzingen toont ruwe, verwarrende teksten

In de toewijzingslijst staat de status als technische code ("wacht_op_reactie", "deel1_bezig") in plaats van gewone taal, terwijl de rest van de app inmiddels nette statuslabels gebruikt. Ook staat bij projecten die duidelijk aan iemand zijn toegewezen toch het label "Pool".

Voorstel: dezelfde statuslabels als in het projectenoverzicht, en de kolom "Type" toont "Toegewezen" zodra er een behandelaar staat, en anders "Wacht in pool".

## 2. Geen zoekveld en afgeronde projecten ertussen

De lijst bevat alle projecten inclusief afgeronde, zonder zoekfunctie — bij 29 regels scroll je veel, en op een afgerond project staat toch een knop "Hertoewijzen".

Voorstel: zoekveld op projectnaam/behandelaar, en een schakelaar "Afgeronde projecten tonen" die standaard uit staat. Bij afgeronde projecten geen hertoewijs-knoppen.

## 3. Gekozen tabblad wordt niet onthouden

Open je vanuit Exports een project of klik je bovenin op "Projecten", dan kom je altijd terug op Overzicht.

Voorstel: het gekozen tabblad in het webadres zetten (bijvoorbeeld .../inbox?tab=exports), zodat terugkeren en delen van een link op hetzelfde tabblad uitkomt.

## 4. Verwarrende tabnaam binnen Instellingen

Binnen de pagina Instellingen heet een tabblad opnieuw "Instellingen" (dat is de plek voor logo en organisatienaam) — dezelfde verwarring die we eerder bij Beheer hebben weggehaald.

Voorstel: dit tabblad hernoemen naar "Huisstijl & logo".

## 5. Twee exportblokken die op elkaar lijken

Onder Exports staan drie blokken onder elkaar zonder uitleg over het verschil: alle projecten, exports per fase en de bulk-PDF.

Voorstel: korte kopregel boven de blokken die in één zin aangeeft wanneer je welke gebruikt, en een duidelijke scheiding tussen de drie.

## 6. Technische waarschuwing in de foutenanalyse

De foutenanalyse veroorzaakt een waarschuwing in de ontwikkelaarsconsole (een label dat een verwijzing krijgt die het niet kan verwerken). Zichtbaar is er niets mis, maar het is ruis die echte fouten kan verbergen.

Voorstel: het labelonderdeel technisch corrigeren zodat de waarschuwing verdwijnt.

## Wat niet hoeft te veranderen

- De afrondknop na invullen van de EP2-velden, het bewaren van toelichtingen tussen tabbladen, het plakken van schermafbeeldingen en de vaste kolombreedtes in de PDF zijn in de code aanwezig en werken zoals afgesproken.
- De oude beperkte exportknop onderaan het projectenoverzicht is verwijderd en nergens anders meer in gebruik.

## Technische details

- `src/components/projecten/ToewijzingenBeheer.tsx`: `statusBadge` uit `src/lib/badges.tsx` gebruiken voor de statuskolom; type-kolom afleiden van `toegewezen_aan` in plaats van alleen `toewijzing`; lokale zoekstate + `toonAfgerond`-schakelaar (filter op `status !== "afgerond"` en `gearchiveerd_op`), acties verbergen bij afgeronde projecten.
- `src/pages/Inbox.tsx`: tabwaarde koppelen aan `useSearchParams` (`tab` = overzicht | toewijzingen | exports | foutenanalyse) met `value`/`onValueChange` op de `Tabs` van de beheerweergave.
- `src/pages/Beheer.tsx`: label van `TabsTrigger value="instellingen"` wijzigen naar "Huisstijl & logo" (waarde/route ongewijzigd).
- Exports-tab in `Inbox.tsx`: introtekst boven `AlleProjectenExport` / `ProjectenExport` / `BulkPdfExport`.
- `src/components/ui/badge.tsx`: `Badge` omzetten naar `React.forwardRef` zodat `asChild`-gebruik in `FoutenAnalyse` geen React-waarschuwing meer geeft.
