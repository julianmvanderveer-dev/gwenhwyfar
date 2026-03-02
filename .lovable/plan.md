

# EPW-D nummering en namen afstemmen op EPW-B

## Vergelijking en wijzigingen in `src/data/epwd-checklist.ts`

Overal waar EPW-D en EPW-B dezelfde controlepunten delen, wordt de EPW-D tekst aangepast naar de EPW-B-stijl. Items die alleen in EPW-D bestaan (2a, 2c, 2f, 2g) blijven ongewijzigd.

### Sectie 1 - Dossier
| Code | EPW-D nu | EPW-B (bron) |
|------|----------|--------------|
| 1d | "9500/W aanwezig" | "Opdrachtbevestiging aanwezig met daarin voorwaarden BRL 9500-W_15-04-2024 aanwezig" |
| 1e | "Formulier G/H of BENG-certificaat in het dossier?" | "Formulier G/H (of BengCert-variant) in het dossier?" |
| 1f | "BENG-uitvoeringsplan aanwezig" | "BENG-uitgangspunten volledig in dossier" |

### Sectie 2 - Bouwkundige uitgangspunten
| Code | EPW-D nu | EPW-B (bron) |
|------|----------|--------------|
| 2b | "Rc waarde gevel \| vloer \| dak" | "Rc-waarde gevel \| vloer \| dak" |
| 2d | "U waarde kozijn \| deur \| paneel" | "U-waarde kozijn \| deur \| paneel" |
| 2e | "Onderbouwing U waarde in dossier" | "Onderbouwing U-waarde in dossier" |

### Sectie 3 - Algemene kenmerken
| Code | EPW-D nu | EPW-B (bron) |
|------|----------|--------------|
| 3c | "Klopt de gebruiksoppervlakte GO" | "Klopt de Gebruiksoppervlak GO" |

### Sectie 4 - Check geometrie
| Code | EPW-D nu | EPW-B (bron) |
|------|----------|--------------|
| 4b | "Binnenklimaat juist" | "Bij infiltratie: is gebouwhoogte correct ingevuld" |
| 4f | "Kruipruimtevloerisolatie juist ingevuld (0p)" | "Kruipruimtevloerisolatie juist ingevuld (= 0,0)" |
| 4k | "Oppervlakte ramen correct berekend" | "Oppervlakte deur(en) correct berekend" |
| 4l | "Oppervlakte panelen correct berekend" | "Oppervlakte ramen correct berekend" |
| 4m | "Zonwering correct ingevoerd" | "Oppervlakte panelen correct berekend" |
| 4n | "(ZS) belemmeringen meegenomen" | "(zij-) belemmeringen meegenomen" |

EPW-B heeft 14 items in sectie 4 (4a-4n) met "Oppervlakte deur(en)" als 4k ertussen. EPW-D mist dit item en heeft "Zonwering correct ingevoerd" (4m) die EPW-B niet heeft. Om de nummering te matchen wordt 4k-4n herschikt conform EPW-B.

### Sectie 5 - Check installaties
| Code | EPW-D nu | EPW-B (bron) |
|------|----------|--------------|
| 5e | "(ZI) belemmering zonnepanelen correct (<15 graden = ZUID)" | "(zij-)belemmering zonnepanelen correct (<15 grad.=ZUID)" |
| 5g | "Ventilatiesysteem correct ingevoerd" | "Tapwatersysteem correct ingevoerd" |
| 5h | "Koelsysteem correct ingevoerd" | "Koelsysteem correct ingevoerd" (ongewijzigd) |
| 5i | "Warm tapwatersysteem correct ingevoerd" | "Ventilatiesysteem correct ingevoerd" |

Volgorde 5f-5i wordt: Verwarming → Tapwater → Koeling → Ventilatie (conform EPW-B).

### Samenvatting
Alleen `src/data/epwd-checklist.ts` wordt aangepast. Geen database- of componentwijzigingen nodig (bestaande projecten in de database worden niet geraakt).

