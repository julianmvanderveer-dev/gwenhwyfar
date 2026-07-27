/**
 * Formatteren van bedragen en datums volgens de Nederlandse notatie.
 * Bedragen zijn intern altijd in centen.
 */

const euroFormatter = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 1250 → "€ 12,50" */
export function euro(centen: number): string {
  if (!Number.isFinite(centen)) return euroFormatter.format(0);
  return euroFormatter.format(centen / 100);
}

/** 1250 → "12,50" (zonder euroteken, voor invoervelden) */
export function centenNaarInvoer(centen: number): string {
  return (centen / 100).toFixed(2).replace(".", ",");
}

/**
 * "12,50" of "12.50" of "12" → 1250 centen.
 * Geeft null terug bij ongeldige invoer.
 */
export function invoerNaarCenten(invoer: string): number | null {
  const schoon = invoer.trim().replace(/\s/g, "").replace(",", ".");
  if (schoon === "" || schoon === ".") return null;
  if (!/^\d*\.?\d{0,2}$/.test(schoon)) return null;
  const waarde = Number.parseFloat(schoon);
  if (!Number.isFinite(waarde)) return null;
  return Math.round(waarde * 100);
}

/** "2026-07-27" → "27-07-2026" */
export function datumNL(isoDatum: string): string {
  const [jaar, maand, dag] = isoDatum.split("-");
  return `${dag}-${maand}-${jaar}`;
}

/** Date → "jjjj-mm-dd" in lokale tijd */
export function naarIsoDatum(datum: Date): string {
  const jaar = datum.getFullYear();
  const maand = String(datum.getMonth() + 1).padStart(2, "0");
  const dag = String(datum.getDate()).padStart(2, "0");
  return `${jaar}-${maand}-${dag}`;
}

export const MAANDNAMEN = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
] as const;

/** (2026, 7) → "juli 2026" (maand is 1-12) */
export function maandLabel(jaar: number, maand: number): string {
  return `${MAANDNAMEN[maand - 1]} ${jaar}`;
}

/** "2026-07-27" → "27 juli" */
export function datumKort(isoDatum: string): string {
  const [, maand, dag] = isoDatum.split("-");
  return `${Number.parseInt(dag, 10)} ${MAANDNAMEN[Number.parseInt(maand, 10) - 1]}`;
}
