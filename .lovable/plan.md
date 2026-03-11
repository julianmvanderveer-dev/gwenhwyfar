

## Plan: .env toevoegen aan .gitignore

De `.gitignore` mist regels voor `.env` bestanden. Dit is een standaard security best practice.

### Wijziging

**`.gitignore`** — Na de `*.local` regel het volgende blok toevoegen:

```
# Environment variables — nooit committen
.env
.env.*
!.env.example
```

Geen impact op compatibiliteit — het `.env` bestand wordt al automatisch gegenereerd door Lovable Cloud en hoort niet in version control.

