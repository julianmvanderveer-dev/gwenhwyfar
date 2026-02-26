

# Aanpassingen

## 1. Adviseurs tabel bijwerken
De huidige 37 adviseurs hebben foutieve namen en nummers (1-37). Deze moeten vervangen worden door de 37 echte adviseurs met hun correcte nummers.

**Aanpak**: Alle bestaande rijen verwijderen en de correcte adviseurs invoegen via data-operaties. Let op: sommige nummers komen meerdere keren voor (bijv. 154 heeft 4 adviseurs, 37 heeft 3, etc.) — dat is correct per de opgave.

**NB**: Er staan twee entries voor nummer 123 "Anass Ben Haddou" en nummer 123 "Annas Ben Haddou" — dit lijkt een duplicaat/typfout. Beide worden ingevoerd zoals opgegeven.

## 2. Projectnaam veld aanpassen
In `ProjectAanmaken.tsx`: onder het Label "Projectnaam" een cursieve hint toevoegen: *"Bij oplevering en bestaande bouw postcode_huisnr"*

Eenvoudige `<p>` tag met `italic text-sm text-muted-foreground` onder het label.

