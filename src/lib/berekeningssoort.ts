/**
 * Bepaalt het label voor de soort berekening van een audit.
 * Alleen-lezen helper: leidt de waarde af uit bestaande projectdata
 * (audit_categorie en is_omgevingsvergunning). Geen nieuwe velden of logica.
 *
 * - EPW-B / EPU-B  → "Bestaande bouw"
 * - EPW-D / EPU-D  → "Omgevingsvergunning" of "Oplevering" o.b.v. is_omgevingsvergunning
 * - D-variant zonder afleidbare waarde → "Soort berekening onbekend"
 * - Overige categorieën (MWA) → null (geen regel tonen)
 */
export function berekeningssoortLabel(
  auditCategorie: string | null | undefined,
  isOmgevingsvergunning: boolean | null | undefined
): string | null {
  if (auditCategorie === "EPW-B" || auditCategorie === "EPU-B") {
    return "Bestaande bouw";
  }
  if (auditCategorie === "EPW-D" || auditCategorie === "EPU-D") {
    if (isOmgevingsvergunning === true) return "Omgevingsvergunning";
    if (isOmgevingsvergunning === false) return "Oplevering";
    return "Soort berekening onbekend";
  }
  return null;
}
