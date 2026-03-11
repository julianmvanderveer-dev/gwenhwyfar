

## Plan: ProjectDetail.tsx optimalisaties doorvoeren

Twee verbeteringen uit de Claude Code review:

### 1. `autoSetStatus` — extra DB-call elimineren
De huidige versie doet een aparte `select("status")` query. De verbeterde versie accepteert `currentStatus` als parameter en gebruikt de status die `loadProject()` al heeft opgehaald.

**Regel 34-41**: `loadProject().then()` callback aanpassen om `p.status` door te geven:
```typescript
loadProject().then((p) => {
  if (p) {
    autoSetStatus(p.status);
    loadTemplates(p.audit_categorie);
  }
});
```

**Regel 57-67**: `autoSetStatus` herschrijven met parameter:
```typescript
const autoSetStatus = async (currentStatus: string) => {
  if (hasRole("tekenaar") && currentStatus === "nog_niet_begonnen") { ... }
  else if (hasRole("auditor") && currentStatus === "deel1_afgerond") { ... }
};
```

### 2. `auditAfronden` — batch-updates met Promise.all
De huidige versie loopt één-voor-één door findings. De verbeterde versie groepeert per type (kritiek/niet-kritiek/opmerking) en doet drie batch-updates via `Promise.all`.

**Regel 178-220**: Vervangen door geoptimaliseerde versie die `Promise.all` gebruikt met `.in("id", ids)` queries.

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/ProjectDetail.tsx` | `autoSetStatus` parameter + `auditAfronden` batch-optimalisatie |

