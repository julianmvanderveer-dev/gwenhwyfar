## Doel

"Aandachtspunten bij deze adviseur" mag alleen **terechte afwijkingen** tonen — net als het auditrapport. Inhoudelijk weerlegde bevindingen (status afgesloten, géén "Afwijking geaccepteerd"-bericht van de adviseur) moeten worden uitgesloten.

## Wijziging

**Database functie** `public.get_adviseur_aandachtspunten` herschrijven zodat een bevinding alleen meetelt als:

- de bevinding nog **open** is (status niet `reactie_goedgekeurd` en niet `gesloten`), **of**
- de bevinding is afgesloten **én** de gekoppelde adviseur heeft op die bevinding het bericht `"Afwijking geaccepteerd"` gestuurd.

```sql
CREATE OR REPLACE FUNCTION public.get_adviseur_aandachtspunten(
  _adviseur_id uuid,
  _exclude_project_id uuid
)
RETURNS TABLE(controlepunt text, onderdeel text, aantal bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT f.controlepunt, f.onderdeel, COUNT(*) as aantal
  FROM public.findings f
  JOIN public.projects p ON p.id = f.project_id
  WHERE p.adviseur_id = _adviseur_id
    AND p.id != _exclude_project_id
    AND f.beoordeling = 'niet_goed'
    AND (
      f.status NOT IN ('reactie_goedgekeurd', 'gesloten')
      OR EXISTS (
        SELECT 1
        FROM public.messages m
        JOIN public.adviseurs a ON a.user_id = m.afzender_id
        WHERE m.finding_id = f.id
          AND a.id = _adviseur_id
          AND TRIM(m.bericht) = 'Afwijking geaccepteerd'
      )
    )
  GROUP BY f.controlepunt, f.onderdeel
  ORDER BY aantal DESC
  LIMIT 5
$$;
```

## Geen frontend-wijzigingen

`AandachtspuntenAdviseur.tsx` blijft ongewijzigd — dezelfde RPC-aanroep, alleen schonere data.

## Resultaat

De top-5 aandachtspunten in de projectheader is voortaan consistent met de "Afwijkingen"-sectie van het auditrapport: alleen open + door adviseur geaccepteerde "niet goed"-bevindingen tellen mee.
