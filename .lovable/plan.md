

## Verduidelijking projectlijst voor tekenaar/auditor

### Huidige situatie
De filter op regel 125-127 toont projecten als `toegewezen_aan === user.id` OF `pool && geen eigenaar`. Dit betekent dat projecten met status `wacht_op_reactie` die aan de gebruiker zijn toegewezen correct blijven staan — dat werkt al goed.

Het probleem zit in de **categorisering**: projecten die ooit geclaimd/toegewezen zijn en nu in `wacht_op_reactie` staan, moeten onder "Aan mij toegewezen" vallen (niet in pool). Pool moet alleen projecten tonen die door Beheer zijn aangemaakt en in de pool geplaatst, nog niet geclaimd.

### Analyse
De huidige split-logica in het "Mijn projecten" tabblad:
- **Aan mij toegewezen**: `p.toegewezen_aan === user.id`
- **Pool**: `p.toewijzing === 'pool' && !p.toegewezen_aan`

Dit is feitelijk al correct: een project met `wacht_op_reactie` dat aan de gebruiker is toegewezen heeft `toegewezen_aan = user.id`, dus het valt onder "Aan mij toegewezen". Pool toont alleen niet-geclaimde projecten.

**Maar**: de huidige query filtert `neq("status", "afgerond")` — projecten met `wacht_op_reactie` worden niet uitgefilterd, dus die blijven staan. Dit klopt.

Het enige wat ontbreekt: projecten met `wacht_op_reactie` staan bij de tekenaar als "Reactie gevraagd" — dat is correct gedrag.

### Conclusie
De logica werkt al zoals gewenst. Er is geen codewijziging nodig. De pool toont alleen niet-geclaimde projecten, en toegewezen projecten (inclusief `wacht_op_reactie`) blijven onder "Aan mij toegewezen" staan.

Wil je dat ik iets specifieks verifieer door in te loggen als tekenaar, of is er een scenario dat je ziet dat niet klopt?

