// @ts-ignore - html2pdf.js has no bundled types
import html2pdf from "html2pdf.js";

/**
 * Rendert een volledige HTML-string (zoals uit buildAuditReportHtml) naar een
 * PDF-blob (A4 landscape). Werkt volledig client-side via html2pdf.js.
 */
export async function renderReportToPdfBlob(html: string): Promise<Blob> {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const inner = bodyMatch ? bodyMatch[1] : html;

  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-10000px;top:0;width:297mm;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;";
  container.innerHTML = inner;
  document.body.appendChild(container);

  try {
    const blob: Blob = await (html2pdf as any)()
      .from(container)
      .set({
        margin: [10, 8, 10, 8],
        filename: "report.pdf",
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .outputPdf("blob");
    return blob;
  } finally {
    container.remove();
  }
}