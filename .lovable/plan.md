

# Fix: nieuwe subcodes sorteren na toevoegen

## Probleem
Nieuwe rijen worden met `setItems((prev) => [...prev, data])` achteraan de array geplaatst. De tabel sorteert niet opnieuw, waardoor de nieuwe subcode onderaan de gefilterde lijst verschijnt in plaats van op de juiste positie (bijv. na 5i).

## Oplossing in `src/pages/ChecklistBeheer.tsx`

Na het toevoegen van een nieuw item, de volledige items-array sorteren op code:

```typescript
setItems((prev) => [...prev, data as TemplateRow].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })));
```

Dezelfde sortering ook toepassen na het initieel laden van de data in de `useEffect`.

Dit is een eenregelige wijziging op twee plekken in hetzelfde bestand.

