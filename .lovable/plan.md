
## Fix: Uitloggen knop onzichtbaar

### Probleem
De "Uitloggen" knop gebruikt `variant="outline"` met witte tekst (`text-white`), maar de outline variant heeft een lichte achtergrond (`bg-background`) waardoor de witte tekst niet zichtbaar is.

### Oplossing
Pas de className aan om de achtergrond transparant te maken (passend bij de donkere navigatiebalk) zodat de witte tekst wel zichtbaar is:

**Wijziging in `src/components/AppLayout.tsx` (regel 51-58):**
- Voeg `bg-transparent` toe om de lichte achtergrond van de outline variant te overschrijven
- Behoud de bestaande border en hover states

Code wijziging:
```tsx
<Button
  variant="outline"
  size="sm"
  onClick={handleSignOut}
  className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white"
>
  Uitloggen
</Button>
```
