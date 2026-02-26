

# Adviseur-inbox en reactieflow

## Probleem
De `adviseurs` tabel is losgekoppeld van auth-gebruikers. De RLS-policies op `projects` en `findings` vergelijken `adviseur_id = auth.uid()`, maar `adviseur_id` verwijst nu naar `adviseurs.id` (niet naar auth users). Dit moet gerepareerd worden.

## Stap 1: Database

**Data-operatie**: Jean Martinez invoegen in `adviseurs` (nummer: 999, email: julianmvanderveer@gmail.com).

**Migratie**: 
- Kolom `user_id` (uuid, nullable) toevoegen aan `adviseurs` — koppelt een auth-gebruiker aan een adviseurrecord
- RLS-policies op `projects`, `findings`, en `messages` updaten: vervang `adviseur_id = auth.uid()` door een join via `adviseurs` tabel (`WHERE adviseurs.id = projects.adviseur_id AND adviseurs.user_id = auth.uid()`)

## Stap 2: Inbox aanpassen voor adviseurs

In `Inbox.tsx`: wanneer de gebruiker de rol `adviseur` heeft:
- Opzoeken welke `adviseurs`-record bij de ingelogde user hoort (via `user_id`)
- Alle projecten laden waar `adviseur_id` = die adviseur, met status `reactie_open`
- Per project een tabblad tonen met de openstaande findings (`status = 'open'`, `zichtbaar_voor_adviseur = true`)
- Elke finding toont: controlepunt, beoordeling, type afwijking, deadline
- Link naar `/finding/:id/reactie` per finding om te reageren

## Stap 3: FindingReactie verbeteren

De pagina `/finding/:id/reactie` werkt al grotendeels:
- Adviseur typt een reactie (tekst) → wordt als message opgeslagen
- Finding status gaat naar `reactie_ontvangen`
- Kleine verbetering: na het verzenden van de laatste reactie op alle findings, een "Alles ingediend" melding tonen

## Stap 4: Koppeling auth-user → adviseur

Bij het inloggen/registreren met het e-mailadres van een adviseur: automatisch de `user_id` vullen op het bijbehorende adviseurs-record. Dit kan in `useAuth` of via een database trigger op `profiles` die checkt of het e-mail overeenkomt met een adviseur.

---

## Technische details

### RLS-fix voorbeeld (projects select):
```sql
-- Oude check: adviseur_id = auth.uid()
-- Nieuwe check:
EXISTS (
  SELECT 1 FROM adviseurs
  WHERE adviseurs.id = projects.adviseur_id
  AND adviseurs.user_id = auth.uid()
)
```

### Database trigger voor auto-koppeling:
```sql
CREATE FUNCTION link_user_to_adviseur()
RETURNS trigger AS $$
BEGIN
  UPDATE adviseurs SET user_id = NEW.id
  WHERE email = NEW.email AND user_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
AFTER INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION link_user_to_adviseur();
```

