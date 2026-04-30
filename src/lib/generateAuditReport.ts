import type { Tables } from "@/integrations/supabase/types";

type Project = Tables<"projects">;
type Finding = Tables<"findings">;

interface ReportData {
  project: Project;
  findings: Finding[];
  adviseurNaam?: string;
  adviseurNummer?: number;
  logoUrl?: string;
  templates: { code: string; onderdeel: string; controlepunt: string; deel: number }[];
  uitdraaiData?: Record<string, string>;
}

const beoordelingLabel: Record<string, string> = {
  goed: "Goed",
  niet_goed: "Niet goed",
  opmerking: "Opmerking",
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

export function generateAuditReport({ project, findings, adviseurNaam, adviseurNummer, logoUrl, templates, uitdraaiData }: ReportData) {
  const hasUitdraai = uitdraaiData && Object.keys(uitdraaiData).length > 0;
  const colCount = hasUitdraai ? 6 : 5;

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
  const nietGoedCount = beoordeeld.filter((f) => f.beoordeling === "niet_goed").length;
  const opmerkingCount = beoordeeld.filter((f) => f.beoordeling === "opmerking").length;

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

  // Bestandsnaam / titel: "{nr} {adviseur} {projectnaam} {categorie}"
  const nrStr = adviseurNummer != null ? String(adviseurNummer).padStart(3, "0") : "";
  const titleParts = [nrStr, adviseurNaam ?? "", project.projectnaam, project.audit_categorie]
    .map((s) => (s ?? "").toString().trim())
    .filter(Boolean);
  const documentTitle = titleParts.join(" ");

  // Openstaande afwijkingen (niet afdoende weerlegd)
  const openstaande = findings
    .filter(
      (f) =>
        f.beoordeling === "niet_goed" &&
        f.zichtbaar_voor_adviseur === true &&
        f.status !== "reactie_goedgekeurd" &&
        f.status !== "gesloten",
    )
    .sort((a, b) =>
      (a.onderdeel || "").localeCompare(b.onderdeel || "", undefined, { numeric: true }) ||
      (a.controlepunt || "").localeCompare(b.controlepunt || "", undefined, { numeric: true }),
    );

  const openstaandeRows = openstaande
    .map((f, i) => {
      const tpl = templates.find(
        (t) => t.onderdeel === f.onderdeel && t.controlepunt === f.controlepunt && t.deel === f.deel,
      );
      const code = tpl?.code ?? "—";
      return `
        <tr style="${i % 2 !== 0 ? "background:#fff5f5;" : ""}">
          <td style="padding:6px 10px;border-bottom:1px solid #fecaca;font-family:monospace;font-size:11px;color:#7f1d1d;">${escapeHtml(code)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #fecaca;font-size:12px;color:#1f2937;">${escapeHtml(f.onderdeel)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #fecaca;font-size:12px;color:#1f2937;">${escapeHtml(f.controlepunt)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #fecaca;font-size:12px;color:#374151;">${f.toelichting ? escapeHtml(f.toelichting) : "—"}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #fecaca;font-size:12px;color:#374151;">${statusLabel[f.status] ?? f.status}</td>
        </tr>`;
    })
    .join("");

  const openstaandeBlok = openstaande.length > 0
    ? `
    <div style="border:2px solid #b91c1c;border-radius:8px;background:#fef2f2;padding:14px 16px;margin-bottom:24px;page-break-inside:avoid;">
      <h2 style="margin:0 0 8px;font-size:15px;font-weight:700;color:#b91c1c;display:flex;align-items:center;gap:8px;">
        <span style="display:inline-block;background:#b91c1c;color:#fff;border-radius:9999px;font-size:11px;padding:2px 8px;">${openstaande.length}</span>
        Openstaande afwijkingen
      </h2>
      <p style="margin:0 0 10px;font-size:12px;color:#7f1d1d;">Bevindingen die niet afdoende zijn weerlegd.</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff;border-radius:6px;overflow:hidden;">
        <thead>
          <tr style="background:#b91c1c;color:#fff;">
            <th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;width:80px;">Code</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Onderdeel</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Controlepunt</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Toelichting</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;width:140px;">Status</th>
          </tr>
        </thead>
        <tbody>${openstaandeRows}</tbody>
      </table>
    </div>`
    : `
    <div style="border:2px solid #047857;border-radius:8px;background:#ecfdf5;padding:12px 16px;margin-bottom:24px;color:#065f46;font-size:13px;font-weight:600;">
      ✓ Geen openstaande afwijkingen — alle bevindingen zijn afdoende weerlegd of goedgekeurd.
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
        ${r.finding?.toelichting ? `<tr style="background:#f3f4f6;"><td colspan="${colCount}" style="padding:4px 10px 8px 30px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151;font-style:italic;">📝 ${escapeHtml(r.finding.toelichting)}</td></tr>` : ""}
      `;
          }
        )
        .join("");

      return `
      <h3 style="margin:24px 0 8px;font-size:14px;font-weight:600;color:#1f2937;border-bottom:2px solid #0e4a8a;padding-bottom:4px;">${onderdeel}</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
        <thead>
          <tr style="background:#0e4a8a;color:#fff;">
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
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #0e4a8a;padding-bottom:16px;margin-bottom:24px;gap:24px;">
    <div style="display:flex;align-items:center;gap:16px;">
      <div style="flex-shrink:0;">${logoHtml}</div>
      <div>
        <h1 style="margin:0;font-size:22px;color:#0e4a8a;font-weight:700;">Auditrapport</h1>
        <p style="margin:4px 0 0;font-size:14px;color:#6b7280;">${escapeHtml(project.projectnaam)}</p>
      </div>
    </div>
    <div style="text-align:right;font-size:12px;color:#6b7280;">
      <div>Rapportdatum: <strong>${datum}</strong></div>
    </div>
  </div>

  ${openstaandeBlok}

  <!-- Project info -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
    <table style="font-size:13px;border-collapse:collapse;">
      <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-weight:500;">Categorie</td><td style="padding:4px 0;font-weight:600;">${project.audit_categorie}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-weight:500;">Soort</td><td style="padding:4px 0;font-weight:600;">${project.audit_soort === "dossieraudit" ? "Dossieraudit" : "Projectaudit"}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-weight:500;">Toelatingsaudit</td><td style="padding:4px 0;font-weight:600;">${project.toelatingsaudit ? "Ja" : "Nee"}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-weight:500;">Prioriteit</td><td style="padding:4px 0;font-weight:600;">${project.prioriteit ? "Ja" : "Nee"}</td></tr>
    </table>
    <table style="font-size:13px;border-collapse:collapse;">
      <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-weight:500;">EP-adviseur</td><td style="padding:4px 0;font-weight:600;">${adviseurNaam ? escapeHtml(adviseurNaam) : "—"}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-weight:500;">Status</td><td style="padding:4px 0;font-weight:600;">${projectStatusLabel[project.status] ?? project.status}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-weight:500;">Aangemaakt</td><td style="padding:4px 0;font-weight:600;">${aanmaakDatum}</td></tr>
    </table>
  </div>

  ${(ep2Start != null || ep2Eind != null) ? `
  <!-- EP2 Beoordeling -->
  <div style="background:#f0f4ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin-bottom:24px;">
    <h2 style="margin:0 0 12px;font-size:15px;font-weight:600;color:#0e4a8a;">EP2 Beoordeling</h2>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;font-size:13px;">
      <div><span style="color:#6b7280;">Startwaarde</span><br><strong>${ep2Start ?? "—"} kWh/m²</strong></div>
      <div><span style="color:#6b7280;">Eindwaarde</span><br><strong>${ep2Eind ?? "—"} kWh/m²</strong></div>
      <div><span style="color:#6b7280;">Afwijking</span><br><strong>${afwijkingAbs != null ? afwijkingAbs.toFixed(2) + " kWh/m²" : "—"}${afwijkingPct != null ? ` (${afwijkingPct.toFixed(1)}%)` : ""}</strong></div>
      <div><span style="color:#6b7280;">Beoordeling</span><br><strong>${project.ep2_beoordeling ? (project.ep2_beoordeling === "goed" ? "Goed" : "Niet goed") : "—"}</strong></div>
    </div>
  </div>
  ` : ""}

  <!-- Samenvatting -->
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:24px;">
    <h2 style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1f2937;">Samenvatting</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center;font-size:13px;">
      <div style="background:#d1fae5;border-radius:6px;padding:10px;">
        <div style="font-size:22px;font-weight:700;color:#047857;">${goedCount}</div>
        <div style="color:#047857;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Goed</div>
      </div>
      <div style="background:#fee2e2;border-radius:6px;padding:10px;">
        <div style="font-size:22px;font-weight:700;color:#b91c1c;">${nietGoedCount}</div>
        <div style="color:#b91c1c;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Niet goed</div>
      </div>
      <div style="background:#dbeafe;border-radius:6px;padding:10px;">
        <div style="font-size:22px;font-weight:700;color:#1d4ed8;">${opmerkingCount}</div>
        <div style="color:#1d4ed8;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Opmerkingen</div>
      </div>
    </div>
  </div>

  <!-- Bevindingen per onderdeel -->
  <h2 style="font-size:16px;font-weight:600;color:#1f2937;margin-bottom:4px;">Bevindingen</h2>
  ${onderdeelSections}

  <!-- Footer -->
  <div style="margin-top:32px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center;">
    Gegenereerd op ${datum}
  </div>
</body>
</html>`;

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
