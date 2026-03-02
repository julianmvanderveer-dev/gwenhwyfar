

# Toelichtingsveld altijd tonen (niet alleen bij afwijkingen)

## Probleem
Het toelichtingsveld + spraakknop wordt momenteel alleen getoond wanneer de beoordeling "niet_goed" of "interne_alert" is (regel 184 in `ProjectDetail.tsx`). Bij findings zonder beoordeling of met beoordeling "goed" is het veld onzichtbaar. Dit geldt voor beide checklists.

## Oplossing
De conditie op regel 184 aanpassen zodat het toelichtingsveld altijd zichtbaar is wanneer de gebruiker de finding mag bewerken, of wanneer er al een toelichting is ingevuld — ongeacht de beoordeling.

### Wijziging in `src/pages/ProjectDetail.tsx`
**Huidige conditie (regel 184):**
```
(canEditFinding(f) || (f as any).toelichting) && (f.beoordeling === "niet_goed" || f.beoordeling === "interne_alert")
```

**Nieuwe conditie:**
```
canEditFinding(f) || (f as any).toelichting
```

Dit toont het tekstvak + microfoon bij elke finding die bewerkbaar is, of waar al een toelichting staat.

### Bonus-fix: React key-waarschuwing
De `<>` fragment rond de twee `<tr>` elementen in de `.map()` mist een key. Wijzigen naar `<React.Fragment key={f.id}>` om de console-warning op te lossen.

