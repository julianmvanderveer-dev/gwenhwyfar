import type { Tables } from "@/integrations/supabase/types";

type Project = Tables<"projects">;
type Finding = Tables<"findings">;

interface ReportData {
  project: Project;
  findings: Finding[];
  adviseurNaam?: string;
  adviseurNummer?: number;
  adviseurUserId?: string;
  messages?: { finding_id: string; afzender_id: string; bericht: string }[];
  logoUrl?: string;
  templates: { code: string; onderdeel: string; controlepunt: string; deel: number }[];
  uitdraaiData?: Record<string, string>;
  ep2History?: {
    id: string;
    oude_status: string | null;
    nieuwe_status: string;
    reden: string;
    changed_by_naam: string | null;
    created_at: string;
  }[];
}

const beoordelingLabel: Record<string, string> = {
  goed: "Goed",
  niet_goed: "Niet goed",
  opmerking: "Opmerking",
  nvt: "N.V.T.",
};


const statusLabel: Record<string, string> = {
  open: "Open",
  reactie_ontvangen: "Reactie ontvangen",
  gesloten: "Gesloten",
  reactie_goedgekeurd: "Reactie goedgekeurd",
};

const projectStatusLabel: Record<string, string> = {
  nog_niet_begonnen: "Nog niet begonnen",
  deel1_bezig: "Deel 1 bezig",
  deel1_afgerond: "Deel 1 afgerond",
  deel2_bezig: "Deel 2 bezig",
  afgerond: "Afgerond",
  wacht_op_reactie: "Wacht op reactie",
  gesloten: "Gesloten",
};

const BENGCERT_LOGO_SVG = `
<svg width="140" height="40" viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6,18 L14,26 L30,8" fill="none" stroke="#4a9e24" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M14,18 L22,26 L38,8" fill="none" stroke="#5AAF2D" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="46" y="27" font-family="'Poppins', system-ui, -apple-system, sans-serif" font-weight="700" font-size="18" fill="#28235D" letter-spacing="0.5">bengcert</text>
</svg>`.trim();

const ep2Label = (v: string | null | undefined): string => {
  if (!v) return "—";
  const map: Record<string, string> = { goed: "GOED", nkt: "NKT", kt: "KT" };
  return map[v] ?? v.toUpperCase();
};

export function buildAuditReportHtml({ project, findings, adviseurNaam, adviseurNummer, adviseurUserId, messages, logoUrl, templates, uitdraaiData, ep2History }: ReportData): { html: string; documentTitle: string } {
  const hasUitdraai = uitdraaiData && Object.keys(uitdraaiData).length > 0;
  const colCount = hasUitdraai ? 6 : 5;

  // Detectie: heeft adviseur deze afwijking expliciet geaccepteerd?
  const isAcceptedByAdviseur = (findingId: string): boolean => {
    if (!adviseurUserId || !messages) return false;
    return messages.some(
      (m) =>
        m.finding_id === findingId &&
        m.afzender_id === adviseurUserId &&
        (m.bericht ?? "").trim() === "Afwijking geaccepteerd",
    );
  };
  const isAfgesloten = (f: Finding) =>
    f.status === "reactie_goedgekeurd" || f.status === "gesloten";

  // Build merged rows: all templates with their findings
  const mergedRows = templates.map((t) => {
    const finding = findings.find(
      (f) => f.onderdeel === t.onderdeel && f.controlepunt === t.controlepunt && f.deel === t.deel
    );
    return { ...t, finding };
  });

  // Group by onderdeel
  const onderdelen = [...new Set(templates.map((t) => t.onderdeel))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  // Summary counts
  const beoordeeld = findings.filter((f) => f.beoordeling);
  const goedCount = beoordeeld.filter((f) => f.beoordeling === "goed").length;
  const opmerkingCount = beoordeeld.filter((f) => f.beoordeling === "opmerking").length;
  const nietGoedAll = beoordeeld.filter((f) => f.beoordeling === "niet_goed");
  // Weerlegd = afgesloten EN niet expliciet door adviseur geaccepteerd (= adviseur kreeg inhoudelijk gelijk)
  const weerlegdCount = nietGoedAll.filter(
    (f) => isAfgesloten(f) && !isAcceptedByAdviseur(f.id),
  ).length;
  // Geaccepteerd = afgesloten EN adviseur erkent fout → blijft tellen als afwijking
  const geaccepteerdCount = nietGoedAll.filter(
    (f) => isAfgesloten(f) && isAcceptedByAdviseur(f.id),
  ).length;
  const openCount = nietGoedAll.length - weerlegdCount - geaccepteerdCount;
  const afwijkingCount = openCount + geaccepteerdCount;

  // EP2
  const ep2Start = project.ep2_startwaarde;
  const ep2Eind = project.ep2_eindwaarde;
  const afwijkingAbs = ep2Start != null && ep2Eind != null ? ep2Eind - ep2Start : null;
  const afwijkingPct = afwijkingAbs != null && ep2Start !== 0 ? (afwijkingAbs / ep2Start!) * 100 : null;

  const datum = new Date().toLocaleDateString("nl-NL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const aanmaakDatum = new Date(project.datum_aangemaakt).toLocaleDateString("nl-NL");

  // Bestandsnaam / titel: "1{nr} {adviseur} {projectnaam}"
  const nrStr = adviseurNummer != null ? `1${String(adviseurNummer).padStart(3, "0")}` : "";
  const titleParts = [nrStr, adviseurNaam ?? "", project.projectnaam]
    .map((s) => (s ?? "").toString().trim())
    .filter(Boolean);
  const documentTitle = titleParts.join(" ");

  // Afwijkingen = openstaand + geaccepteerd (blijven als fout staan)
  const afwijkingen = findings
    .filter(
      (f) =>
        f.beoordeling === "niet_goed" &&
        f.zichtbaar_voor_adviseur === true &&
        (!isAfgesloten(f) || isAcceptedByAdviseur(f.id)),
    )
    .sort((a, b) =>
      (a.onderdeel || "").localeCompare(b.onderdeel || "", undefined, { numeric: true }) ||
      (a.controlepunt || "").localeCompare(b.controlepunt || "", undefined, { numeric: true }),
    );

  const afwijkingRows = afwijkingen
    .map((f, i) => {
      const tpl = templates.find(
        (t) => t.onderdeel === f.onderdeel && t.controlepunt === f.controlepunt && t.deel === f.deel,
      );
      const code = tpl?.code ?? "—";
      const accepted = isAcceptedByAdviseur(f.id);
      const afhandeling = accepted
        ? `<span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;background:#fde8d4;color:#9a3412;">Geaccepteerd door adviseur</span>`
        : `<span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;background:#fee2e2;color:#b91c1c;">Open</span>`;
      return `
        <tr style="${i % 2 !== 0 ? "background:#fff5f5;" : ""}">
          <td style="padding:6px 10px;border-bottom:1px solid #fecaca;font-family:monospace;font-size:11px;color:#7f1d1d;">${escapeHtml(code)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #fecaca;font-size:12px;color:#1f2937;">${escapeHtml(f.onderdeel)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #fecaca;font-size:12px;color:#1f2937;">${escapeHtml(f.controlepunt)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #fecaca;font-size:12px;color:#374151;">${f.toelichting ? escapeHtml(f.toelichting) : "—"}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #fecaca;font-size:12px;color:#374151;">${afhandeling}</td>
        </tr>`;
    })
    .join("");

  const subLabel = afwijkingen.length > 0
    ? `Bevindingen die niet inhoudelijk zijn weerlegd${geaccepteerdCount > 0 ? ` — waarvan ${openCount} open en ${geaccepteerdCount} geaccepteerd door adviseur` : ""}.`
    : "";

  const openstaandeBlok = afwijkingen.length > 0
    ? `
    <div style="border:1px solid #b91c1c;border-radius:6px;background:#fef2f2;padding:12px 14px;margin-bottom:20px;page-break-inside:avoid;">
      <h2 style="margin:0 0 6px;font-size:14px;font-weight:700;color:#b91c1c;">
        Afwijkingen (${afwijkingen.length})
      </h2>
      <p style="margin:0 0 10px;font-size:12px;color:#7f1d1d;">${subLabel}</p>
      <table style="width:100%;border-collapse:collapse;font-size:12px;background:#fff;">
        <thead>
          <tr style="background:#1B2A4A;color:#fff;">
            <th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;width:80px;">Code</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Onderdeel</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Controlepunt</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Toelichting</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;width:180px;">Afhandeling</th>
          </tr>
        </thead>
        <tbody>${afwijkingRows}</tbody>
      </table>
    </div>`
    : `
    <div style="border:1px solid #7AB929;border-radius:6px;background:#f3faea;padding:10px 14px;margin-bottom:20px;color:#3d6b0f;font-size:13px;font-weight:600;">
      Geen afwijkingen — alle 'niet goed'-bevindingen zijn inhoudelijk weerlegd.
    </div>`;

  const logoHtml = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="BengCert" style="height:40px;width:auto;display:block;" />`
    : BENGCERT_LOGO_SVG;

  const uitdraaiHeader = hasUitdraai
    ? `<th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Uitdraai</th>`
    : "";

  const onderdeelSections = onderdelen
    .map((onderdeel) => {
      const rows = mergedRows.filter((r) => r.onderdeel === onderdeel);
      const rowsHtml = rows
        .map(
          (r, i) => {
            const uitdraaiCell = hasUitdraai
              ? `<td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151;">${escapeHtml(uitdraaiData![r.code] || "—")}</td>`
              : "";

            return `
        <tr style="${i % 2 !== 0 ? "background:#f8f9fa;" : ""}">
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:11px;color:#6b7280;">${r.code}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${r.controlepunt}</td>
          ${uitdraaiCell}
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center;">${r.deel}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">
            ${r.finding?.beoordeling ? `<span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;${
              r.finding.beoordeling === "goed"
                ? "background:#d1fae5;color:#047857;"
                : r.finding.beoordeling === "niet_goed"
                ? "background:#fee2e2;color:#b91c1c;"
                : "background:#dbeafe;color:#1d4ed8;"
            }">${beoordelingLabel[r.finding.beoordeling] ?? r.finding.beoordeling}</span>` : "—"}
          </td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;">
            ${r.finding ? (statusLabel[r.finding.status] ?? r.finding.status) : "—"}
          </td>
        </tr>
        ${r.finding?.toelichting ? `<tr style="background:#f9fafb;"><td colspan="${colCount}" style="padding:4px 10px 8px 30px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151;"><span style="color:#6b7280;font-weight:500;">Toelichting:</span> ${escapeHtml(r.finding.toelichting)}</td></tr>` : ""}
      `;
          }
        )
        .join("");

      return `
      <h3 style="margin:20px 0 6px;font-size:13px;font-weight:600;color:#1B2A4A;border-bottom:1px solid #1B2A4A;padding-bottom:4px;">${onderdeel}</h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:14px;">
        <thead>
          <tr style="background:#1B2A4A;color:#fff;">
            <th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Code</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Controlepunt</th>
            ${uitdraaiHeader}
            <th style="padding:8px 10px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;width:50px;">Deel</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Beoordeling</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Status</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(documentTitle)}</title>
  <style>
    @page { margin: 15mm 12mm; size: A4 landscape; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; margin: 0; padding: 20px; }
    @media print { body { padding: 0; } }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
    h1, h2, h3 { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  </style>
</head>
<body>
  <!-- Header -->
  <table style="width:100%;border-collapse:collapse;border-bottom:2px solid #1B2A4A;margin-bottom:20px;">
    <tr>
      <td style="padding:0 0 14px 0;vertical-align:middle;width:160px;">${logoHtml}</td>
      <td style="padding:0 0 14px 16px;vertical-align:middle;">
        <h1 style="margin:0;font-size:20px;color:#1B2A4A;font-weight:700;">Auditrapport</h1>
        <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${escapeHtml(project.projectnaam)}</p>
      </td>
      <td style="padding:0 0 14px 0;vertical-align:middle;text-align:right;font-size:12px;color:#6b7280;white-space:nowrap;">
        Rapportdatum: <strong style="color:#1f2937;">${datum}</strong>
      </td>
    </tr>
  </table>

  ${openstaandeBlok}

  <!-- Project info -->
  <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px;">
    <tr>
      <td style="width:50%;vertical-align:top;padding-right:16px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:3px 12px 3px 0;color:#6b7280;font-weight:500;width:120px;">Categorie</td><td style="padding:3px 0;font-weight:600;">${project.audit_categorie}</td></tr>
          <tr><td style="padding:3px 12px 3px 0;color:#6b7280;font-weight:500;">Soort</td><td style="padding:3px 0;font-weight:600;">${project.audit_soort === "dossieraudit" ? "Dossieraudit" : "Projectaudit"}</td></tr>
          <tr><td style="padding:3px 12px 3px 0;color:#6b7280;font-weight:500;">Toelatingsaudit</td><td style="padding:3px 0;font-weight:600;">${project.toelatingsaudit ? "Ja" : "Nee"}</td></tr>
          <tr><td style="padding:3px 12px 3px 0;color:#6b7280;font-weight:500;">Prioriteit</td><td style="padding:3px 0;font-weight:600;">${project.prioriteit ? "Ja" : "Nee"}</td></tr>
        </table>
      </td>
      <td style="width:50%;vertical-align:top;padding-left:16px;border-left:1px solid #e5e7eb;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:3px 12px 3px 0;color:#6b7280;font-weight:500;width:120px;">EP-adviseur</td><td style="padding:3px 0;font-weight:600;">${adviseurNaam ? escapeHtml(adviseurNaam) : "—"}</td></tr>
          <tr><td style="padding:3px 12px 3px 0;color:#6b7280;font-weight:500;">Status</td><td style="padding:3px 0;font-weight:600;">${projectStatusLabel[project.status] ?? project.status}</td></tr>
          <tr><td style="padding:3px 12px 3px 0;color:#6b7280;font-weight:500;">Aangemaakt</td><td style="padding:3px 0;font-weight:600;">${aanmaakDatum}</td></tr>
        </table>
      </td>
    </tr>
  </table>

  ${(ep2Start != null || ep2Eind != null) ? `
  <!-- EP2 Beoordeling -->
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px 14px;margin-bottom:20px;">
    <h2 style="margin:0 0 10px;font-size:13px;font-weight:600;color:#1B2A4A;">EP2 Beoordeling</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <tr>
        <td style="width:25%;padding:4px 8px;"><div style="color:#6b7280;">Startwaarde</div><strong>${ep2Start ?? "—"} kWh/m²</strong></td>
        <td style="width:25%;padding:4px 8px;"><div style="color:#6b7280;">Eindwaarde</div><strong>${ep2Eind ?? "—"} kWh/m²</strong></td>
        <td style="width:25%;padding:4px 8px;"><div style="color:#6b7280;">Afwijking</div><strong>${afwijkingAbs != null ? afwijkingAbs.toFixed(2) + " kWh/m²" : "—"}${afwijkingPct != null ? ` (${afwijkingPct.toFixed(1)}%)` : ""}</strong></td>
        <td style="width:25%;padding:4px 8px;"><div style="color:#6b7280;">Beoordeling</div><strong>${ep2Label(project.ep2_beoordeling)}</strong></td>
      </tr>
    </table>
  </div>
  ` : ""}

  ${ep2History && ep2History.length > 0 ? `
  <div style="border:1px solid #e5e7eb;border-radius:6px;background:#fff;padding:12px 14px;margin-bottom:20px;">
    <h2 style="margin:0 0 10px;font-size:13px;font-weight:600;color:#1B2A4A;">Wijzigingsgeschiedenis EP2-status</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr style="background:#1B2A4A;color:#fff;">
          <th style="padding:6px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;width:130px;">Datum</th>
          <th style="padding:6px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;width:150px;">Door</th>
          <th style="padding:6px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;width:110px;">Wijziging</th>
          <th style="padding:6px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Toelichting</th>
        </tr>
      </thead>
      <tbody>
        ${ep2History.map((h, i) => `
          <tr style="${i % 2 !== 0 ? "background:#f8f9fa;" : ""}">
            <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#374151;">${new Date(h.created_at).toLocaleString("nl-NL")}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151;">${escapeHtml(h.changed_by_naam ?? "—")}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#1f2937;font-weight:600;">${escapeHtml(ep2Label(h.oude_status))} → ${escapeHtml(ep2Label(h.nieuwe_status))}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151;">${escapeHtml(h.reden)}</td>
          </tr>`).join("")}
      </tbody>
    </table>
  </div>
  ` : ""}

  <!-- Samenvatting -->
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px 14px;margin-bottom:20px;">
    <h2 style="margin:0 0 10px;font-size:13px;font-weight:600;color:#1B2A4A;">Samenvatting</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:center;">
      <tr>
        <td style="width:25%;padding:4px;">
          <div style="background:#f3faea;border:1px solid #d6ebb5;border-radius:6px;padding:10px 8px;">
            <div style="font-size:20px;font-weight:700;color:#3d6b0f;line-height:1.1;">${goedCount}</div>
            <div style="color:#3d6b0f;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">Goed</div>
          </div>
        </td>
        <td style="width:25%;padding:4px;">
          <div style="background:${afwijkingCount > 0 ? "#fef2f2" : "#f9fafb"};border:1px solid ${afwijkingCount > 0 ? "#fecaca" : "#e5e7eb"};border-radius:6px;padding:10px 8px;">
            <div style="font-size:20px;font-weight:700;color:${afwijkingCount > 0 ? "#b91c1c" : "#9ca3af"};line-height:1.1;">${afwijkingCount}</div>
            <div style="color:${afwijkingCount > 0 ? "#b91c1c" : "#6b7280"};font-size:10px;text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">Afwijking</div>
          </div>
        </td>
        <td style="width:25%;padding:4px;">
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:10px 8px;">
            <div style="font-size:20px;font-weight:700;color:#4b5563;line-height:1.1;">${weerlegdCount}</div>
            <div style="color:#6b7280;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">Weerlegd</div>
          </div>
        </td>
        <td style="width:25%;padding:4px;">
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:10px 8px;">
            <div style="font-size:20px;font-weight:700;color:#1B2A4A;line-height:1.1;">${opmerkingCount}</div>
            <div style="color:#1B2A4A;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;">Opmerkingen</div>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Bevindingen per onderdeel -->
  <h2 style="font-size:14px;font-weight:600;color:#1B2A4A;margin:0 0 6px;">Bevindingen</h2>
  ${onderdeelSections}

  <!-- Footer -->
  <div style="margin-top:28px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center;">
    Gegenereerd op ${datum}
  </div>
</body>
</html>`;

  return { html, documentTitle };
}

export function generateAuditReport(data: ReportData) {
  const { html } = buildAuditReportHtml(data);
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
