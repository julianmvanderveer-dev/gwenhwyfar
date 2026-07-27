/**
 * Alle rekenregels van Centje als losse, pure functies.
 * Bedragen zijn overal in centen (integers). Er wordt nooit gedeeld door nul
 * en er komt nooit NaN of Infinity uit een functie.
 */

import type { Categorie, Spaardoel, Transactie } from "./types";

/** Filtert op jaar en maand (maand 1-12) op basis van de ISO-datum. */
export function inMaand(t: Transactie, jaar: number, maand: number): boolean {
  const prefix = `${jaar}-${String(maand).padStart(2, "0")}`;
  return t.datum.startsWith(prefix);
}

export function inJaar(t: Transactie, jaar: number): boolean {
  return t.datum.startsWith(`${jaar}-`);
}

export function somBedragen(transacties: Transactie[]): number {
  return transacties.reduce((som, t) => som + t.bedrag, 0);
}

/** Saldo = beginsaldo + alle inkomsten − alle uitgaven. */
export function saldo(beginsaldo: number, transacties: Transactie[]): number {
  return transacties.reduce(
    (s, t) => (t.type === "inkomst" ? s + t.bedrag : s - t.bedrag),
    beginsaldo
  );
}

export function inkomstenInMaand(
  transacties: Transactie[],
  jaar: number,
  maand: number
): number {
  return somBedragen(
    transacties.filter((t) => t.type === "inkomst" && inMaand(t, jaar, maand))
  );
}

export function uitgavenInMaand(
  transacties: Transactie[],
  jaar: number,
  maand: number
): number {
  return somBedragen(
    transacties.filter((t) => t.type === "uitgave" && inMaand(t, jaar, maand))
  );
}

export function uitgavenInMaandPerCategorie(
  transacties: Transactie[],
  jaar: number,
  maand: number,
  categorieId: number
): number {
  return somBedragen(
    transacties.filter(
      (t) =>
        t.type === "uitgave" &&
        t.categorieId === categorieId &&
        inMaand(t, jaar, maand)
    )
  );
}

/**
 * Sparen telt als uitgave (het geld verlaat de betaalrekening), maar telt wél
 * mee in het spaardoel en in het totale vermogen. Een transactie is sparen als
 * hij aan een spaardoel hangt of in de categorie Sparen valt.
 */
export function isSparen(
  t: Transactie,
  spaarCategorieId: number | undefined
): boolean {
  return (
    t.type === "uitgave" &&
    (t.spaardoelId !== undefined ||
      (spaarCategorieId !== undefined && t.categorieId === spaarCategorieId))
  );
}

export function gespaardInJaar(
  transacties: Transactie[],
  jaar: number,
  spaarCategorieId: number | undefined
): number {
  return somBedragen(
    transacties.filter((t) => isSparen(t, spaarCategorieId) && inJaar(t, jaar))
  );
}

/** Al gespaard voor een doel = startbedrag + alle inleg (over alle jaren). */
export function gespaardVoorDoel(
  doel: Spaardoel,
  transacties: Transactie[]
): number {
  return (
    doel.startbedrag +
    somBedragen(
      transacties.filter(
        (t) => t.type === "uitgave" && t.spaardoelId === doel.id
      )
    )
  );
}

/** Totaal vermogen = saldo + startbedragen van de doelen + gespaard dit jaar. */
export function totaalVermogen(
  huidigSaldo: number,
  doelen: Spaardoel[],
  gespaardDitJaar: number
): number {
  const startbedragen = doelen.reduce((som, d) => som + d.startbedrag, 0);
  return huidigSaldo + startbedragen + gespaardDitJaar;
}

/** Vrij besteedbaar deze maand = som van alle maandbudgetten − uitgaven deze maand. */
export function vrijBesteedbaar(
  categorieen: Categorie[],
  uitgavenDezeMaand: number
): number {
  const totaalBudget = categorieen
    .filter((c) => !c.verborgen)
    .reduce((som, c) => som + c.budget, 0);
  return totaalBudget - uitgavenDezeMaand;
}

/**
 * Percentage gebruikt = uitgegeven ÷ maandbudget, als geheel getal (0-∞ afgekapt
 * op een groot maximum). Bij budget 0 komt er null uit: toon dan een streepje.
 */
export function percentageGebruikt(
  uitgegeven: number,
  budget: number
): number | null {
  if (budget <= 0) return null;
  return Math.round((uitgegeven / budget) * 100);
}

/** Prognose einde maand = uitgegeven ÷ dagen verstreken × dagen in de maand. */
export function prognoseEindeMaand(
  uitgegeven: number,
  dagenVerstreken: number,
  dagenInMaand: number
): number {
  if (dagenVerstreken <= 0) return uitgegeven;
  return Math.round((uitgegeven / dagenVerstreken) * dagenInMaand);
}

/**
 * Spaarratio = totaal gespaard dit jaar ÷ totale inkomsten dit jaar, als
 * fractie (0,25 = 25%). Bij inkomsten 0 komt er null uit: toon een streepje.
 */
export function spaarratio(
  gespaardDitJaar: number,
  inkomstenDitJaar: number
): number | null {
  if (inkomstenDitJaar <= 0) return null;
  return gespaardDitJaar / inkomstenDitJaar;
}

/** Gemiddelde uitgaven per maand = totale uitgaven ÷ aantal verstreken maanden. */
export function gemiddeldeUitgavenPerMaand(
  totaleUitgaven: number,
  verstrekenMaanden: number
): number {
  if (verstrekenMaanden <= 0) return 0;
  return Math.round(totaleUitgaven / verstrekenMaanden);
}

/**
 * Aantal hele maanden tussen vandaag en de streefdatum (beide ISO-strings).
 * Een streefdatum vandaag of in het verleden geeft 0.
 */
export function heleMaandenTot(vandaag: string, streefdatum: string): number {
  const [vj, vm, vd] = vandaag.split("-").map(Number);
  const [sj, sm, sd] = streefdatum.split("-").map(Number);
  let maanden = (sj - vj) * 12 + (sm - vm);
  if (sd < vd) maanden -= 1;
  return Math.max(0, maanden);
}

/**
 * Nodig per maand voor een doel = (streefbedrag − al gespaard) ÷ aantal hele
 * maanden tot de streefdatum. Is de datum verstreken (0 maanden), dan komt het
 * volledige restbedrag eruit. Een gehaald doel geeft 0.
 */
export function nodigPerMaand(
  streefbedrag: number,
  alGespaard: number,
  heleMaanden: number
): number {
  const rest = Math.max(0, streefbedrag - alGespaard);
  if (rest === 0) return 0;
  if (heleMaanden <= 0) return rest;
  return Math.ceil(rest / heleMaanden);
}

/** Percentage bereikt van een spaardoel (0-100, afgekapt op 100). */
export function doelPercentage(
  alGespaard: number,
  streefbedrag: number
): number {
  if (streefbedrag <= 0) return 0;
  return Math.min(100, Math.round((alGespaard / streefbedrag) * 100));
}

export interface TopUitgave {
  transactie: Transactie;
}

/** De n grootste uitgaven, van groot naar klein. */
export function topUitgaven(
  transacties: Transactie[],
  n: number
): Transactie[] {
  return transacties
    .filter((t) => t.type === "uitgave")
    .sort((a, b) => b.bedrag - a.bedrag)
    .slice(0, n);
}

export interface WerkgeverTotaal {
  werkgeverId: number;
  bedrag: number;
  uren: number;
}

/** Per werkgever het totaal aan geld en uren (alleen inkomsten). */
export function perWerkgever(transacties: Transactie[]): WerkgeverTotaal[] {
  const totalen = new Map<number, WerkgeverTotaal>();
  for (const t of transacties) {
    if (t.type !== "inkomst" || t.werkgeverId === undefined) continue;
    const bestaand = totalen.get(t.werkgeverId) ?? {
      werkgeverId: t.werkgeverId,
      bedrag: 0,
      uren: 0,
    };
    bestaand.bedrag += t.bedrag;
    bestaand.uren += t.uren ?? 0;
    totalen.set(t.werkgeverId, bestaand);
  }
  return [...totalen.values()].sort((a, b) => b.bedrag - a.bedrag);
}

/** Telt per categorie hoe vaak hij is gebruikt, voor "meest gebruikt bovenaan". */
export function categorieGebruik(
  transacties: Transactie[]
): Map<number, number> {
  const telling = new Map<number, number>();
  for (const t of transacties) {
    if (t.categorieId === undefined) continue;
    telling.set(t.categorieId, (telling.get(t.categorieId) ?? 0) + 1);
  }
  return telling;
}

/** Inkomsten per maand van een jaar, als array van 12 bedragen (index 0 = januari). */
export function inkomstenPerMaand(
  transacties: Transactie[],
  jaar: number
): number[] {
  const maanden = new Array<number>(12).fill(0);
  for (const t of transacties) {
    if (t.type !== "inkomst" || !inJaar(t, jaar)) continue;
    const maand = Number.parseInt(t.datum.slice(5, 7), 10);
    if (maand >= 1 && maand <= 12) maanden[maand - 1] += t.bedrag;
  }
  return maanden;
}

/** Uitgaven per categorie in een jaar, van groot naar klein. */
export function uitgavenPerCategorie(
  transacties: Transactie[],
  jaar: number
): { categorieId: number | undefined; bedrag: number }[] {
  const totalen = new Map<number | undefined, number>();
  for (const t of transacties) {
    if (t.type !== "uitgave" || !inJaar(t, jaar)) continue;
    totalen.set(t.categorieId, (totalen.get(t.categorieId) ?? 0) + t.bedrag);
  }
  return [...totalen.entries()]
    .map(([categorieId, bedrag]) => ({ categorieId, bedrag }))
    .sort((a, b) => b.bedrag - a.bedrag);
}
