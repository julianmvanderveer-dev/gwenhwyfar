

## Probleem: Vinkje doet niets bij medewerker toevoegen

### Oorzaak

Regel 169 in `Beheer.tsx`:
```typescript
if (!memberForm.naam.trim() || !memberForm.email.trim() || !memberForm.password) return;
```

Als naam of wachtwoord niet is ingevuld, doet de functie een **stille `return`** zonder enige foutmelding. Uit de sessie-replay blijkt dat je waarschijnlijk niet alle velden hebt ingevuld (naam en/of wachtwoord ontbreken), waardoor er niets gebeurt.

Daarnaast staat het wachtwoordveld in de "Actief"-kolom, wat verwarrend is -- het is makkelijk te missen.

### Oplossing

1. **Validatie met foutmelding** -- Vervang de stille `return` door een toast die aangeeft welke velden ontbreken:
   ```typescript
   const addMember = async () => {
     if (!memberForm.naam.trim()) {
       toast({ title: "Naam is verplicht", variant: "destructive" });
       return;
     }
     if (!memberForm.email.trim()) {
       toast({ title: "E-mail is verplicht", variant: "destructive" });
       return;
     }
     if (!memberForm.password) {
       toast({ title: "Wachtwoord is verplicht", variant: "destructive" });
       return;
     }
     // ... rest van de functie
   ```

2. **Wachtwoordveld duidelijker labelen** -- Voeg een placeholder-label "Wachtwoord" toe boven of in het invoerveld zodat het niet over het hoofd wordt gezien. Het veld staat momenteel verstopt in de "Actief"-kolom van de tabel.

### Betrokken bestanden
- `src/pages/Beheer.tsx` -- regels 168-169: validatie met feedback

