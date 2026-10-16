// Centrale foutentelling en EP2-eindoordeel.
// Een bevinding telt als fout wanneer de beoordeling "niet_goed" is én de
// afwijking niet kleiner dan 1% is. Vervallen afwijkingen staan op "goed"
// en tellen daardoor vanzelf niet mee.
type F = { beoordeling?: string | null; afwijking_kleiner_1pct?: boolean | null };

export function isFout(f: F): boolean {
  return f.beoordeling === "niet_goed" && !f.afwijking_kleiner_1pct;
}

export function telFouten(findings: F[]): number {
  return findings.filter(isFout).length;
}

export function berekenEp2(
  start: number | null | undefined,
  eind: number | null | undefined,
  findings: F[],
  dossierIncompleet = false,
): "goed" | "nkt" | "kt" {
  const fouten = telFouten(findings);
  let kt = dossierIncompleet || fouten > 4;
  if (start != null && eind != null && !isNaN(start) && !isNaN(eind)) {
    const abs = eind - start;
    const pct = start !== 0 ? (abs / start) * 100 : 0;
    if ((eind > 125 && Math.abs(pct) > 8) || (eind <= 125 && Math.abs(abs) > 10)) kt = true;
  }
  if (kt) return "kt";
  return fouten > 0 ? "nkt" : "goed";
}
