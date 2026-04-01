

## Algehele test-checklist voor de applicatie

Hieronder een uitgebreide prompt die je kunt gebruiken om alle functionaliteit end-to-end te verifiëren.

---

### Test-prompt

**Test de volgende flows per rol:**

**1. Beheerder (beheer)**
- Log in als beheerder
- Maak een nieuw project aan met alle velden ingevuld
- Wijs een EP-adviseur, tekenaar en auditor toe
- Open het project en controleer dat alle checklist-onderdelen (tabs) zichtbaar zijn
- Voeg een finding toe en controleer type-afwijking badge
- Hertoewijzen van een beoordelaar via FindingBeoordeling
- Open Beheer-pagina en Checklist-beheer — controleer dat beide navigatielinks werken
- Controleer dat "Aandachtspunten bij deze adviseur" zichtbaar is op projectdetail
- Exporteer een audit-rapport en verifieer dat het downloadt
- Controleer notificatiebel

**2. Auditor**
- Log in als auditor
- Open inbox — controleer dat toegewezen projecten zichtbaar zijn
- Open een project, controleer dat Deel 1 én Deel 2 van de checklist bewerkbaar zijn
- Beoordeel een finding met status "reactie_ontvangen": test Akkoord en Niet-akkoord flows
- Test "Doorzetten naar tekenaar" functionaliteit
- Controleer dat "Aandachtspunten bij deze adviseur" zichtbaar is
- Controleer spraakherkenning (microfoon) bij opmerkingenveld
- Verifieer dat EP2-beoordeling correct automatisch berekend wordt

**3. Tekenaar**
- Log in als tekenaar
- Open inbox — controleer dashboard en projectenlijst
- Open een project en controleer dat Deel 1 checklist bewerkbaar is
- Controleer dat "Aandachtspunten bij deze adviseur" zichtbaar is
- Controleer dat achtergrondkleur groen is (bg-green-50)

**4. EP-adviseur**
- Log in als EP-adviseur
- Controleer dat het afwijkingen-overzicht zichtbaar is met filters (project + status)
- Controleer dat projectnamen in de tabel **klikbaar** zijn en navigeren naar projectdetail
- Controleer dat "Mijn projecten" sectie zichtbaar is onderaan met alle toegewezen projecten
- Open een project via de link — controleer dat de projectdetailpagina laadt zonder errors
- Controleer dat "Aandachtspunten bij deze adviseur" **NIET** zichtbaar is
- Open een finding met status "open" en dien een reactie in (met optioneel bestand)
- Controleer dat achtergrondkleur geel is (bg-yellow-50)
- Controleer dat de "Reageren" link werkt en naar FindingReactie navigeert

**5. Algemeen (alle rollen)**
- Controleer dat uitloggen werkt en redirect naar /login
- Controleer dat onbekende routes naar NotFound-pagina leiden
- Controleer dat wachtwoord-reset flow werkt via /reset-password
- Controleer responsive weergave op mobiel (< 768px)
- Controleer dat er geen console-errors zijn op elke pagina

