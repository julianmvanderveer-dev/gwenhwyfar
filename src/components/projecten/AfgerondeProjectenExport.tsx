import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, CalendarDays } from "lucide-react";
import { downloadCsv } from "@/lib/csv";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AfgerondProject {
  projectnaam: string;
  status: string;
  audit_categorie: string;
  audit_soort: string;
  prioriteit: boolean;
  toelatingsaudit: boolean;
  datum_aangemaakt: string;
  gearchiveerd_op: string | null;
  adviseurs?: { naam: string | null; email: string | null } | null;
}

export default function AfgerondeProjectenExport() {
  const [projects, setProjects] = useState<AfgerondProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [jaarFilter, setJaarFilter] = useState("alle");
  const [vanDatum, setVanDatum] = useState("");
  const [totDatum, setTotDatum] = useState("");

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          "projectnaam, status, audit_categorie, audit_soort, prioriteit, toelatingsaudit, datum_aangemaakt, gearchiveerd_op, adviseurs:adviseur_id(naam, email)"
        )
        .in("status", ["afgerond", "gesloten"])
        .order("gearchiveerd_op", { ascending: false });
      if (error) {
        toast({ title: "Laden mislukt", description: error.message, variant: "destructive" });
      } else {
        setProjects((data ?? []) as any);
      }
      setLoading(false);
    })();
  }, []);

  const gefilterd = useMemo(() => {
    return projects.filter((p) => {
      const ref = p.gearchiveerd_op ? new Date(p.gearchiveerd_op) : null;
      if (!ref) return jaarFilter === "alle" && !vanDatum && !totDatum;
      if (jaarFilter !== "alle" && String(ref.getFullYear()) !== jaarFilter) return false;
      if (vanDatum && ref < new Date(vanDatum)) return false;
      if (totDatum && ref > new Date(totDatum + "T23:59:59")) return false;
      return true;
    });
  }, [projects, jaarFilter, vanDatum, totDatum]);

  const handleDownload = () => {
    const rows = gefilterd.map((p) => ({
      Projectnaam: p.projectnaam,
      Status: p.status,
      Categorie: p.audit_categorie,
      Soort: p.audit_soort,
      Prioriteit: p.prioriteit ? "Ja" : "Nee",
      Toelatingsaudit: p.toelatingsaudit ? "Ja" : "Nee",
      "EP-adviseur": p.adviseurs?.naam ?? "",
      "E-mail adviseur": p.adviseurs?.email ?? "",
      "Datum aangemaakt": new Date(p.datum_aangemaakt).toLocaleDateString("nl-NL"),
      "Afgerond op": p.gearchiveerd_op ? new Date(p.gearchiveerd_op).toLocaleDateString("nl-NL") : "",
    }));
    const label = jaarFilter === "alle" ? "selectie" : jaarFilter;
    downloadCsv(rows, `afgeronde-projecten-${label}.csv`);
    toast({ title: `${rows.length} afgerond(e) project(en) geëxporteerd` });
  };

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4" />
          Afgeronde projecten exporteren
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <p className="text-xs text-muted-foreground">
          Exporteer alle afgeronde audits naar CSV. Filter optioneel op afrondingsjaar of -datum.
        </p>
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
            placeholder="Van (afgerond op)"
            className="h-8 text-xs"
          />
          <Input
            type="date"
            value={totDatum}
            onChange={(e) => setTotDatum(e.target.value)}
            placeholder="Tot (afgerond op)"
            className="h-8 text-xs"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {loading ? "Laden…" : `${gefilterd.length} afgerond(e) project(en)`}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            disabled={loading || gefilterd.length === 0}
            className="h-7 text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Download CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}