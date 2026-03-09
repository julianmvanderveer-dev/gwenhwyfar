

## Plan: EP-adviseurs nummering aanpassen

### Wijzigingen in `src/pages/Beheer.tsx`

1. **Sortering**: De query `supabase.from("adviseurs").select("*").order("naam")` wijzigen naar `.order("nummer")` zodat adviseurs op nummer gesorteerd worden (laag → hoog).

2. **Nummerweergave**: Overal waar `a.nummer` wordt getoond, formatteren met `String(a.nummer).padStart(3, '0')` zodat 1 → "001", 13 → "013", etc.

3. **CSV export**: Dezelfde padStart-formatting toepassen in `exportAdviseurs`.

Geen database-wijzigingen nodig.

