

## Plan: Volledige audit inzichtelijk voor EP-adviseur (read-only)

### Probleem

EP-adviseurs kunnen momenteel alleen findings zien waar `zichtbaar_voor_adviseur = true`. Ze kunnen niet de volledige audit (alle controlepunten + beoordelingen) inzien.

### Oplossing

**1. Database: RLS-policy op `findings` aanpassen**

De huidige SELECT-policy voor EP-adviseurs filtert op `zichtbaar_voor_adviseur = true`. Dit aanpassen zodat EP-adviseurs **alle** findings van hun eigen projecten kunnen lezen (niet alleen zichtbare):

```sql
-- Verwijder de bestaande SELECT policy en maak een nieuwe
-- EP-adviseur mag ALLE findings van eigen projecten LEZEN
-- maar mag alleen findings met zichtbaar_voor_adviseur = true UPDATEN (ongewijzigd)
```

Concreet: in de SELECT-policy de `AND (zichtbaar_voor_adviseur = true)` conditie verwijderen voor EP-adviseurs.

**2. Frontend: `src/pages/ProjectDetail.tsx`**

De pagina toont al de volledige checklist met tabs en read-only weergave wanneer `canEditAny = false`. Geen grote wijzigingen nodig, maar:

- Verwijder de check die EP-adviseurs mogelijk beperkt in het zien van tabs/onderdelen
- Zorg dat de EP-adviseur alle tabs kan zien inclusief EP2-beoordeling (read-only)
- Markeer findings die `zichtbaar_voor_adviseur = true` zijn (= bevindingen waarop reactie verwacht wordt) visueel, zodat de adviseur het verschil ziet tussen "ter info" en "actie vereist"

**3. Visueel onderscheid in de tabel**

Voor EP-adviseurs: findings met `zichtbaar_voor_adviseur = true` en status "open" krijgen een accent-kleur of icoon om aan te geven dat hierop gereageerd moet worden. Overige rijen zijn gewoon leesbaar maar zonder actie-indicatie.

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| Database migration | RLS SELECT-policy `findings`: verwijder `zichtbaar_voor_adviseur` filter voor EP-adviseur |
| `src/pages/ProjectDetail.tsx` | Visueel markeren van actionable findings voor EP-adviseur |

