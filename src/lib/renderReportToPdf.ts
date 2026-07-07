// @ts-ignore - html2pdf.js has no bundled types
import html2pdf from "html2pdf.js";

/**
 * Rendert een volledige HTML-string (zoals uit buildAuditReportHtml) naar een
 * PDF-blob (A4 landscape). Werkt volledig client-side via html2pdf.js.
 */
export async function renderReportToPdfBlob(html: string): Promise<Blob> {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const inner = bodyMatch ? bodyMatch[1] : html;

  // Binnen viewport plaatsen (onzichtbaar) zodat html2canvas correcte
  // afmetingen krijgt — negatieve offsets geven soms 0x0 rects.
  const container = document.createElement("div");
  container.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    "width:297mm",
    "padding:0",
    "margin:0",
    "background:#ffffff",
    "color:#1f2937",
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
    "opacity:0",
    "pointer-events:none",
    "z-index:-1",
  ].join(";");
  container.innerHTML = inner;
  document.body.appendChild(container);

  try {
    // Laat browser layout + fonts settelen voordat html2canvas afvuurt.
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await new Promise((r) => setTimeout(r, 50));

    const opts = {
      margin: [10, 8, 10, 8],
      filename: "report.pdf",
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: 1200,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" as const },
      pagebreak: { mode: ["css", "legacy"] },
    };

    // Betrouwbare chain: bouw via toPdf(), wacht op de worker, en pak dan
    // de blob via .output('blob'). .outputPdf('blob') op de ketting geeft
    // in sommige versies undefined terug.
    const worker: any = (html2pdf as any)().set(opts).from(container).toPdf();
    await worker;
    const blob: Blob = await worker.output("blob");
    return blob;
  } finally {
    container.remove();
  }
}