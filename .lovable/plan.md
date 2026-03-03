

# Wachtwoord-reset functionaliteit toevoegen

## Probleem
Er is geen "Wachtwoord vergeten" optie op het inlogscherm, en geen pagina om een nieuw wachtwoord in te stellen.

## Aanpak

### 1. Login-pagina uitbreiden (`src/pages/Login.tsx`)
- Derde modus toevoegen: "wachtwoord vergeten"
- Toont alleen een e-mailveld + knop die `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })` aanroept
- Link "Wachtwoord vergeten?" onder het inlogformulier

### 2. Nieuwe pagina `/reset-password` (`src/pages/ResetPassword.tsx`)
- Controleert of er een `type=recovery` token in de URL hash zit
- Toont formulier met nieuw wachtwoord + bevestiging
- Roept `supabase.auth.updateUser({ password })` aan
- Na succes: doorsturen naar `/inbox`

### 3. Route toevoegen (`src/App.tsx`)
- Publieke route `/reset-password` toevoegen (niet achter `ProtectedRoute`)

