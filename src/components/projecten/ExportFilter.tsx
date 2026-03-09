import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, CalendarDays } from "lucide-react";
import { downloadCsv } from "@/lib/csv";
import { toast } from "@/hooks/use-toast";

interface ExportFilterProps {
  projects: Array<{
    projectnaam: string;
    status: string;
    audit_categorie: string;
    audit_soort: string;
    prioriteit: boolean;
    toelatingsaudit: boolean;
    datum_aangemaakt: string;
    reactie_deadline: string | null;
    adviseurs?: { naam: string } | null;
  }>;
}

export default function ExportFilter({ projects }: ExportFilterProps) {
  const [jaarFilter, setJaarFilter] = useState("alle");
  const [vanDatum, setVanDatum] = useState("");
  const [totDatum, setTotDatum] = useState("");

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const exportProjecten = useMemo(() => {
    return projects.filter((p) => {
      const d = new Date(p.datum_aangemaakt);
      if (jaarFilter !== "alle" && String(d.getFullYear()) !== jaarFilter) return false;
      if (vanDatum && d < new Date(vanDatum)) return false;
      if (totDatum && d > new Date(totDatum)) return false;
      return true;
    });
  }, [projects, jaarFilter, vanDatum, totDatum]);

  const handleDownload = () => {
    const rows = exportProjecten.map((p) => ({
      Projectnaam: p.projectnaam,
      Status: p.status,
      Categorie: p.audit_categorie,
      Soort: p.audit_soort,
      Prioriteit: p.prioriteit ? "Ja" : "Nee",
      Toelatingsaudit: p.toelatingsaudit ? "Ja" : "Nee",
      Adviseur: p.adviseurs?.naam ?? "",
      "Datum aangemaakt": new Date(p.datum_aangemaakt).toLocaleDateString("nl-NL"),
      Deadline: p.reactie_deadline ? new Date(p.reactie_deadline).toLocaleDateString("nl-NL") : "",
    }));
    const label = jaarFilter === "alle" ? "selectie" : jaarFilter;
    downloadCsv(rows, `audit-export-${label}.csv`);
    toast({ title: `${rows.length} project(en) geëxporteerd` });
  };

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4" />
          Export
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Select value={jaarFilter} onValueChange={setJaarFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Jaar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle jaren</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={vanDatum}
            onChange={(e) => setVanDatum(e.target.value)}
            placeholder="Van"
            className="h-8 text-xs"
          />
          <Input
            type="date"
            value={totDatum}
            onChange={(e) => setTotDatum(e.target.value)}
            placeholder="Tot"
            className="h-8 text-xs"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{exportProjecten.length} project(en)</span>
          <Button size="sm" variant="outline" onClick={handleDownload} className="h-7 text-xs">
            <Download className="h-3.5 w-3.5 mr-1" />
            Download CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
