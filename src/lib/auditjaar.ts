// Auditjaar bij BengCert: loopt van 1 juli t/m 30 juni.
// Weergave: "2025-2026".

export function auditjaarVanDatum(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const jaar = d.getFullYear();
  const startJaar = d.getMonth() >= 6 ? jaar : jaar - 1; // maand 6 = juli
  return `${startJaar}-${startJaar + 1}`;
}

export function huidigAuditjaar(date: Date = new Date()): string {
  return auditjaarVanDatum(date);
}

/** Vorige, huidige en volgende auditjaar — flexibel kunnen kiezen. */
export function auditjaarOpties(date: Date = new Date()): string[] {
  const huidig = huidigAuditjaar(date);
  const start = parseInt(huidig.slice(0, 4), 10);
  return [start - 1, start, start + 1].map((s) => `${s}-${s + 1}`);
}

/** Opties inclusief eventueel al bestaande waarden (bijv. oudere auditjaren in de data). */
export function auditjaarOptiesMet(extra: (string | null | undefined)[], date: Date = new Date()): string[] {
  const set = new Set<string>(auditjaarOpties(date));
  extra.forEach((e) => {
    if (e) set.add(e);
  });
  return Array.from(set).sort().reverse();
}
