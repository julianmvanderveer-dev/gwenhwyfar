import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Download, Info } from "lucide-react";

const STORAGE_KEY = "bengaudit_overzicht_melding_gezien";
// Zichtbaar tot 23 november 2026 (2 maanden vanaf invoering)
const TOON_TOT = new Date("2026-11-23T23:59:59");

export default function NieuwOverzichtMelding() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (new Date() > TOON_TOT) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // localStorage niet beschikbaar; toon melding alsnog niet blokkerend
    }
    setOpen(true);
  }, []);

  const sluiten = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // negeren
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) sluiten(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Nieuw: uw persoonlijke Overzicht
          </DialogTitle>
          <DialogDescription>
            Er is een nieuw scherm beschikbaar voor EP-adviseurs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p>
            Naast het tabblad <strong>Projecten</strong> vindt u nu ook het tabblad{" "}
            <strong>Overzicht</strong>. Daar ziet u in één oogopslag:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <BarChart3 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>Uw kerncijfers per auditjaar (aantal audits en afwijkingen).</span>
            </li>
            <li className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>Uw top 5 (of top 10) meest voorkomende afwijkingen, plus een anonieme benchmark: hoe scoort u ten opzichte van andere adviseurs?</span>
            </li>
            <li className="flex items-start gap-2">
              <Download className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>De mogelijkheid om al uw afwijkingen (inclusief de toelichting van de auditor) te downloaden als CSV-bestand.</span>
            </li>
          </ul>
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Let op: in het Overzicht worden alleen afwijkingen meegeteld van{" "}
              <strong>afgeronde audits</strong>. Audits die nog lopen, tellen dus nog niet mee.
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={sluiten}>Begrepen, sluiten</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
