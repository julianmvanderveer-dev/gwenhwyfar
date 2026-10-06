# Historische EP2-beoordelingen controleren en herstellen

## Inventarisatie (uitgevoerd)
Ik heb alle afgeronde audits en audits die wachten op een reactie of herafmelding nagerekend. Daarbij gebruik ik dezelfde regels als het platform nu hanteert: actuele "Niet goed"-bevindingen (vervallen afwijkingen tellen niet mee), KT bij meer dan 4 relevante fouten of een te grote EP2-afwijking.

Bij 9 van de ruim 50 projecten wijkt de opgeslagen beoordeling af van de nieuwe berekening:

| Project | Staat nu | Berekend | Opmerking |
|---|---|---|---|
| 250.082 Vervierstraat 05_w276 | KT | NKT | Afwijking vervallen, KT is blijven staan. Wacht nog op herafmelding |
| 15370 Pijperstraat BNR 6 | NKT | GOED | Geen fouten over |
| Statenlaan 20a, Rijen | NKT | GOED | Geen fouten over |
| 6417VG20 | NKT | GOED | Geen fouten over, wel eerder handmatig gewijzigd |
| 3319HK_15 | GOED | NKT | 1 fout (kleiner dan 1%), handmatig gewijzigd |
| 6417VG2 | GOED | NKT | 1 fout over |
| 1561DD_5d Heiligeweg | GOED | KT | EP2 daalt van 113,37 naar 95,41 (meer dan 10 punten) |
| W26.077 De Bleek app 25 | NKT | KT | 5 relevante fouten, eindwaarde ontbreekt, handmatig gewijzigd |
| W26.105 Veenendaal | NKT | KT | 5 relevante fouten, eindwaarde ontbreekt, handmatig gewijzigd |

Alleen bij Vervierstraat 05_w276 is de afwijking echt door een vervallen fout ontstaan. De andere verschillen zijn eerder ontstaan, door handmatige keuzes of door oudere rekenregels.

## Voorstel
1. **Automatisch herstellen** als er geen handmatige keuze van de auditor in de historie staat: Vervierstraat 05_w276, Pijperstraat, Statenlaan en 6417VG2.
   - Vervierstraat 05_w276 wordt NKT. De herafmelding is dan niet meer verplicht en de audit gaat naar "Afgerond".
2. **Laten staan** als de auditor bewust heeft gekozen (er staat een handmatige wijziging in de historie): 6417VG20, 3319HK_15, W26.077 en W26.105. Deze projecten worden niet aangepast.
3. **1561DD_5d Heiligeweg** (zou KT worden door de EP2-daling): niet automatisch aanpassen, want dan krijgt een afgeronde audit alsnog een herafmelding. Ik leg deze aan u voor.
4. Bij elke aanpassing komt een regel in de wijzigingsgeschiedenis van het project: "Historische correctie: herberekend naar actuele fouten".

## Technisch
- Eenmalige data-update op `projects.ep2_beoordeling` (en voor 05_w276 `status` naar `afgerond` en `gearchiveerd_op`), plus inserts in `ep2_status_history`.
- Er worden geen e-mails verstuurd en er verandert niets aan de code.
