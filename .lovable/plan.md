

## Plan: Beheer projectoverzicht herstructureren naar 3 groepen

### Huidige situatie
De beheer-weergave toont 7 afzonderlijke fase-tabellen (nieuw, deel1_bezig, wacht_op_deel2, deel2_bezig, wacht_op_reactie_ep, afgerond, reactie_ontvangen) met een tellerstrip. Dit is onoverzichtelijk.

### Nieuwe structuur

Drie collapsible groepen:

```text
1. Nieuw          → projecten met status "nog_niet_begonnen" (huidige fase "nieuw")
2. Bezig          → alle tussenliggende statussen (deel1_bezig t/m reactie_ontvangen)
3. Afgerond       → status "afgerond", max 14 dagen zichtbaar
```

**Groep "Bezig"** toont één tabel met alle projecten, maar met:
- Een extra kolom **"Substatus"** die de specifieke fase toont (Deel 1 bezig, Wacht op deel 2, Deel 2 bezig, Reactie EP-adviseur gevraagd, Reactie ontvangen)
- Een **dropdown-filter** boven de tabel om op substatus te filteren

De tellerstrip wordt vereenvoudigd naar 3 tellers (Nieuw / Bezig / Afgerond).

### Wijzigingen

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/Inbox.tsx` | Beheer-sectie: vervang 7 FaseTabel-loops door 3 groepen. Groep "Bezig" krijgt een substatus-filter dropdown en toont een gecombineerde tabel met substatus-kolom. Tellerstrip naar 3 items. |
| `src/components/projecten/FaseTabel.tsx` | Optioneel: substatuskolom toevoegen (of inline in Inbox.tsx oplossen met een aangepaste tabel voor "Bezig") |
| `src/components/projecten/faseConfig.ts` | Groepering toevoegen: mapping van fases naar hoofdgroep (nieuw/bezig/afgerond) |

### Details groep "Bezig"

De substatus-filter boven de tabel biedt opties:
- Alle
- Deel 1 bezig
- Wacht op deel 2
- Deel 2 bezig
- Reactie EP-adviseur gevraagd
- Reactie ontvangen

Elke rij in de "Bezig"-tabel toont een gekleurd badge met de substatus, zodat in één oogopslag duidelijk is waar elk project staat.

