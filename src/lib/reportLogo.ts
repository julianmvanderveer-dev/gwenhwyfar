/**
 * Het BengCert-logo als inline SVG voor PDF-uitdraaien.
 * Inline (geen externe URL) zodat het altijd meeprint.
 */
function chevron(dy: number, fill: string) {
  return `<path d="M6,${40 + dy} L44,${78 + dy} L112,${12 + dy}" fill="none" stroke="${fill}" stroke-width="24" stroke-linecap="butt" stroke-linejoin="miter"/>`;
}

const GRADIENTS = `
  <defs>
    <linearGradient id="rbc-blue" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#2B2C6B"/><stop offset="100%" stop-color="#1C6FB8"/>
    </linearGradient>
    <linearGradient id="rbc-green" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#43A82F"/><stop offset="100%" stop-color="#5CB431"/>
    </linearGradient>
    <linearGradient id="rbc-yellow" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#F4A62A"/><stop offset="100%" stop-color="#FBE60F"/>
    </linearGradient>
  </defs>`;

/** Staand logo (vinkje boven de naam) — klein, voor rechtsboven op een PDF. */
export function bengcertLogoSvg(height = 48): string {
  const width = Math.round((height * 430) / 330);
  return `<svg width="${width}" height="${height}" viewBox="0 0 430 330" xmlns="http://www.w3.org/2000/svg" style="display:block;">
  ${GRADIENTS}
  <g transform="translate(107,0) scale(1.8)">
    ${chevron(32, "url(#rbc-blue)")}
    ${chevron(16, "url(#rbc-green)")}
    ${chevron(0, "url(#rbc-yellow)")}
  </g>
  <text x="215" y="322" text-anchor="middle" font-family="'Poppins', Helvetica, Arial, sans-serif" font-weight="700" font-size="86" fill="#28235D" letter-spacing="-1">bengcert</text>
</svg>`;
}

/** Logo-HTML voor een rapportheader: eigen logo uit Beheer krijgt voorrang. */
export function reportLogoHtml(logoUrl?: string, height = 48): string {
  if (logoUrl) {
    const safe = logoUrl.replace(/"/g, "&quot;");
    return `<img src="${safe}" alt="Logo" style="height:${height}px;width:auto;display:block;" />`;
  }
  return bengcertLogoSvg(height);
}
