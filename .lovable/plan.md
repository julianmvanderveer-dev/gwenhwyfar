

# Rol-tabbladen voor alle gebruikers met meerdere rollen

## Probleem
De tab-navigatie wordt momenteel alleen getoond als je `ep_adviseur` + `tekenaar/auditor` bent én géén `beheer` hebt. Omdat je `beheer` hebt, word je direct naar het beheer-dashboard gestuurd zonder tabbladen.

## Oplossing
De logica in `Inbox.tsx` aanpassen zodat iedereen met meerdere weergave-rollen tabbladen krijgt. De mogelijke tabbladen zijn:

- **Beheer** — het volledige beheerders-overzicht (zoeken, 3 groepen, toewijzing)
- **Auditor** of **Tekenaar** — het MedewerkerDashboard
- **EP-adviseur** — het AdviseurSectie-overzicht

Alleen tabbladen tonen waarvoor de gebruiker daadwerkelijk de rol heeft. Bij één weergave: geen tabbladen, direct dat dashboard tonen (huidige gedrag).

## Wijzigingen

### `src/pages/Inbox.tsx`
- De variabele `heeftMeerdereWeergaven` vervangen door een array van beschikbare weergaven (bijv. `[{ key: "beheer", label: "Beheer" }, { key: "medewerker", label: "Auditor" }, ...]`)
- Als de array >1 item heeft: `Tabs` + `TabsList` renderen met die items
- Beheer-inhoud (zoekbalk, 3 groepen, toewijzing) verplaatsen naar een `TabsContent value="beheer"`
- MedewerkerDashboard in `TabsContent value="medewerker"`
- AdviseurSectie in `TabsContent value="ep_adviseur"`
- Default tabblad = eerste item in de array
- De "Nieuw project"-knop alleen tonen in het beheer-tabblad

Geen andere bestanden hoeven aangepast te worden.

| Bestand | Wijziging |
|---|---|
| `src/pages/Inbox.tsx` | Dynamische rol-tabbladen ipv hardcoded conditie |

