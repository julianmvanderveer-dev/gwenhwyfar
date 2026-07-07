// @ts-ignore - html2pdf.js has no bundled types
import html2pdf from "html2pdf.js";

/**
 * Rendert een volledige HTML-string (zoals uit buildAuditReportHtml) naar een
 * PDF-blob (A4 landscape). Werkt volledig client-side via html2pdf.js.
 */
export async function renderReportToPdfBlob(html: string): Promise<Blob> {
  // Render in een eigen iframe. De losse project-download opent ook een echt
  // documentvenster; html2canvas heeft zo een zichtbare viewport/documentflow,
  // terwijl de iframe zelf voor de gebruiker verborgen blijft. Een gewone div
  // met opacity/visibility/transform/offscreen-positioning levert lege canvas-
  // beelden op omdat html2canvas die styling meeneemt.
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    "width:1200px",
    "height:1600px",
    "border:0",
    "opacity:0",
    "pointer-events:none",
    "z-index:-1",
  ].join(";");
  document.body.appendChild(frame);

  try {
    const frameDoc = frame.contentDocument;
    const frameWin = frame.contentWindow;
    if (!frameDoc || !frameWin) {
      throw new Error("PDF-rendering mislukt: rapportvenster kon niet worden aangemaakt");
    }

    frameDoc.open();
    frameDoc.write(html);
    frameDoc.close();

    // Laat browser layout + fonts settelen voordat html2canvas afvuurt.
    await new Promise((resolve) => {
      if (frameDoc.readyState === "complete") resolve(null);
      else frame.addEventListener("load", () => resolve(null), { once: true });
    });
    await frameDoc.fonts?.ready.catch(() => undefined);
    await new Promise((r) => frameWin.requestAnimationFrame(() => r(null)));
    await new Promise((r) => setTimeout(r, 100));

    const target = frameDoc.body;
    const height = Math.max(
      target.scrollHeight,
      frameDoc.documentElement.scrollHeight,
      800,
    );
    frame.style.height = `${height + 80}px`;

    if (!target.getBoundingClientRect().width || !height) {
      throw new Error("PDF-rendering mislukt: rapport heeft geen renderbare afmetingen");
    }

    const opts = {
      margin: [10, 8, 10, 8],
      filename: "report.pdf",
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: 1200,
        windowHeight: height + 80,
        scrollX: 0,
        scrollY: 0,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" as const },
      pagebreak: { mode: ["css", "legacy"] },
    };

    // Betrouwbare chain: bouw via toPdf(), wacht op de worker, en pak dan
    // de blob via .output('blob'). .outputPdf('blob') op de ketting geeft
    // in sommige versies undefined terug.
    const worker: any = (html2pdf as any)().set(opts).from(target).toPdf();
    await worker;
    const blob: Blob = await worker.output("blob");
    return blob;
  } finally {
    frame.remove();
  }
}