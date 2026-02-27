

# E-mailnotificaties naar EP-adviseur

## Wat wordt gebouwd
Een backend-functie die e-mails stuurt naar de EP-adviseur op twee momenten:

1. **Audit afgerond** — wanneer de auditor op "Audit afronden" klikt, krijgt de gekoppelde EP-adviseur een e-mail dat er findings klaarstaan voor reactie.
2. **Beoordeling "niet akkoord"** — wanneer tekenaar/auditor een reactie afwijst en de finding heropent, krijgt de EP-adviseur een e-mail dat er actie nodig is.

## Vereiste: e-mailservice
Voor het versturen van notificatie-e-mails (geen auth-e-mails) is een externe e-mailservice nodig. De opties:

- **Resend** — eenvoudig, goedkoop, goed API. Vereist een API-key en een geverifieerd domein (of gratis met `onboarding@resend.dev` voor testen).

## Implementatiestappen

### 1. Resend API-key toevoegen
Een secret `RESEND_API_KEY` configureren zodat de backend-functie e-mails kan versturen.

### 2. Edge function `notify-adviseur` aanmaken
- Accepteert `type` ("audit_afgerond" of "niet_akkoord"), `project_id`, en optioneel `finding_id`
- Zoekt de gekoppelde adviseur op via `projects.adviseur_id → adviseurs.email`
- Stuurt een e-mail via Resend met relevante informatie (projectnaam, deadline, link naar finding)

### 3. Frontend: aanroep na "Audit afronden"
Na het succesvol afronden van de audit in `ProjectDetail.tsx`, de edge function aanroepen met type `audit_afgerond`.

### 4. Frontend: aanroep na "Niet akkoord"
In `FindingBeoordeling.tsx`, na het klikken op "Niet akkoord", de edge function aanroepen met type `niet_akkoord`.

### 5. Testen
- Log in als auditor, rond een audit af → controleer of de EP-adviseur een e-mail ontvangt
- Log in als tekenaar/auditor, keur een reactie af → controleer of de EP-adviseur een e-mail ontvangt

## Benodigde actie van jou
Voordat ik kan beginnen: heb je al een **Resend-account**? Zo niet, kun je er gratis een aanmaken op [resend.com](https://resend.com). Voor testen hoef je geen eigen domein te verifiëren — Resend biedt een test-afzender.

