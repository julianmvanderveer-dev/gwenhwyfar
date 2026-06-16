## EP-adviseur kan op projectpagina niet reageren

Wanneer een EP-adviseur via de mail "Auditrapport klaar voor uw reactie" naar `/project/:id` komt, ziet hij/zij wel de rijen met status "open" en het kleine badge **Actie**, maar er staat geen knop of link om daadwerkelijk te reageren. Reageren kan op dit moment alleen via Inbox → tab "EP-adviseur" → kolom "Acties" → link **Reageren**.

### Oplossing in `src/pages/ProjectDetail.tsx`

- In de statuskolom (rond regel 1046-1067) voor EP-adviseur de stille "Actie"-badge vervangen door een echte link naar `/finding/${f.id}/reactie`:
  - Tekst: **"Reageren"** (of **"Wijzigen"** als `concept_reactie` al ingevuld is).
  - Styling: accent-kleur, onderstreept of als kleine knop, zodat het direct opvalt.
  - Gebruik `<Link>` uit `react-router-dom`.
- Boven de tabel een korte instructiebanner tonen voor EP-adviseurs zodra er minstens één rij is met `zichtbaar_voor_adviseur && status === "open"`, bv. *"Klik op 'Reageren' bij een bevinding om uw reactie in te vullen."*

### Niet wijzigen

- Mailtemplate "audit-afgerond" (recent al aangepast en correct).
- Afzender/Reply-To van de mails (bewust overgeslagen).
- RLS / rolverdeling — EP-adviseur blijft elders read-only.