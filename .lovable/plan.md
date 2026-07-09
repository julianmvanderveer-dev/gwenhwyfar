## Probleem

Op `/finding/:id/reactie` gebruikt de "Terug"-knop `navigate(-1)`. Voor een EP-adviseur die via het dashboard klikt op "Reageren", is de vorige route `/inbox` (het hoofdmenu) — niet het projectoverzicht met de andere afwijkingen.

## Wijziging

In `src/pages/FindingReactie.tsx` (regel 617): laat "Terug" voor een EP-adviseur direct naar het projectoverzicht navigeren, zodat de andere afwijkingen zichtbaar blijven.

```ts
<Button
  variant="ghost"
  onClick={() =>
    finding.project_id
      ? navigate(`/project/${finding.project_id}`)
      : navigate(-1)
  }
>
  Terug
</Button>
```

Omdat "Terug" nu hetzelfde doet als de bestaande knop "Audit inzien", verwijder ik die tweede knop om dubbelop te voorkomen.