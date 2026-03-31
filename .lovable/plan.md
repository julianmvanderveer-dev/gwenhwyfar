

## Plan: Tabbladen voor gebruikers met meerdere rollen

### Probleem
Gebruikers zoals Frank die zowel `ep_adviseur` als `auditor` zijn, zien beide secties onder elkaar — onoverzichtelijk.

### Oplossing
Wanneer een gebruiker meerdere relevante rollen heeft, toon tabbladen om te wisselen tussen weergaven. Eén rol actief = geen tabs, gewoon directe weergave.

### Wijzigingen

**`src/pages/Inbox.tsx`**:

1. Detecteer of de gebruiker meerdere weergaven heeft (combinatie van `ep_adviseur` + `tekenaar`/`auditor`).

2. Als ja: wrap de EP-adviseur sectie en het MedewerkerDashboard in een `<Tabs>` component met:
   - Tab "EP-adviseur" → bestaande EP-adviseur afwijkingen sectie
   - Tab "Auditor" (of "Tekenaar", afhankelijk van rol) → bestaand MedewerkerDashboard

3. Als nee (slechts één relevante rol): toon direct zonder tabs (huidige gedrag behouden).

4. Beheerders (`beheer`) worden niet beïnvloed — hun sectie blijft apart.

### Technisch detail

```text
// Pseudo-logica
const heeftMeerdereWeergaven = hasRole("ep_adviseur") && isMedewerker;

if (heeftMeerdereWeergaven) {
  <Tabs defaultValue="ep_adviseur">
    <TabsList>
      <TabsTrigger value="ep_adviseur">EP-adviseur</TabsTrigger>
      <TabsTrigger value="medewerker">{hasRole("auditor") ? "Auditor" : "Tekenaar"}</TabsTrigger>
    </TabsList>
    <TabsContent value="ep_adviseur">...EP-adviseur sectie...</TabsContent>
    <TabsContent value="medewerker"><MedewerkerDashboard /></TabsContent>
  </Tabs>
} else {
  // Bestaand gedrag: toon alleen de relevante sectie
}
```

Geen nieuwe bestanden nodig — alleen `src/pages/Inbox.tsx` wordt aangepast.

