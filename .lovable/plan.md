

# Toelichtingsveld alleen tonen bij afwijkingen

## Wijziging
In `src/pages/ProjectDetail.tsx` regel 184 de conditie aanpassen zodat het toelichtingsveld alleen verschijnt wanneer:
- De beoordeling "niet_goed" of "interne_alert" is **en** de gebruiker mag bewerken, **of**
- Er al een toelichting is ingevuld (read-only weergave)

**Huidige conditie:**
```
canEditFinding(f) || (f as any).toelichting
```

**Nieuwe conditie:**
```
((canEditFinding(f) && (f.beoordeling === "niet_goed" || f.beoordeling === "interne_alert")) || (f as any).toelichting)
```

Eén regel wijzigen, geen andere bestanden betrokken.

