

# BengCert Logo corrigeren — twee vinkjes

## Probleem
Het huidige logo tekent drie overlappende parallelogrammen. Het echte logo op bengcert.nl toont **twee groene vinkjes** naast elkaar, gevolgd door de tekst "bengcert" in navy.

## Oplossing

### `src/components/BengCertLogo.tsx`
- De drie `<polygon>` elementen vervangen door twee vinkje-paden (`<path>`)
- Elk vinkje is een klassieke checkmark-vorm (korte lijn links-omlaag, langere lijn rechts-omhoog)
- Eerste vinkje iets naar links, tweede iets naar rechts overlappend
- Kleur: groen (#5AAF2D) voor beide vinkjes, met het linker vinkje iets donkerder of met een lichte geel-groene tint
- Tekst "bengcert" blijft hetzelfde, navy (#28235D) voor dark variant, wit voor light variant

| Bestand | Wijziging |
|---|---|
| `src/components/BengCertLogo.tsx` | Drie balkjes → twee vinkjes als `<path>` elementen |

