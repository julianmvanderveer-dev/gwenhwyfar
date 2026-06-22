import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, CalendarDays } from "lucide-react";
import { downloadCsv } from "@/lib/csv";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Project {
  projectnaam: string;
  status: string;
  audit_categorie: string;
  audit_soort: string;
  prioriteit: boolean;
  toelatingsaudit: boolean;
  datum_aangemaakt: string;
  reactie_deadline: string | null;
  gearchiveerd_op: string | null;
  adviseurs?: { naam: string | null; email: string | null } | null;
}

type DatumVeld = "datum_aangemaakt" | "reactie_deadline" | "gearchiveerd_op";

interface Groep {
  key: string;
  label: string;
  statussen: string[];
  datumVeld: DatumVeld;
  extraKolom?: "reactie_deadline";
}

const STATUS_LABELS: Record<string, string> = {
  nog_niet_begonnen: "Nog niet begonnen",
  deel1_bezig: "Deel 1 bezig",
  deel1_afgerond: "Deel 1 afgerond",
  deel2_bezig: "Deel 2 bezig",
  wacht_op_reactie: "Reactie EP-adviseur gevraagd",
  afgerond: "Afgerond",
  gesloten: "Gesloten",
};

const GROEPEN: Groep[] = [
  { key: "nog-te-starten", label: "Nog te starten", statussen: ["nog_niet_begonnen"], datumVeld: "datum_aangemaakt" },
  { key: "deel1-bezig", label: "Deel 1 bezig", statussen: ["deel1_bezig"], datumVeld: "datum_aangemaakt" },
  { key: "deel1-afgerond", label: "Deel 1 afgerond", statussen: ["deel1_afgerond"], datumVeld: "datum_aangemaakt" },
  { key: "deel2-bezig", label: "Deel 2 bezig", statussen: ["deel2_bezig"], datumVeld: "datum_aangemaakt" },
  {
    key: "wacht-op-reactie",
    label: "Wacht op reactie EP-adviseur",
    statussen: ["wacht_op_reactie"],
    datumVeld: "reactie_deadline",
    extraKolom: "reactie_deadline",
  },
  { key: "afgerond", label: "Afgerond", statussen: ["afgerond", "gesloten"], datumVeld: "gearchiveerd_op" },
];

function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("nl-NL") : "";
}

export default function ProjectenExport() {
  const [projects, setProjects] = useState<Project[]>([]);
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
          "projectnaam, status, audit_categorie, audit_soort, prioriteit, toelatingsaudit, datum_aangemaakt, reactie_deadline, gearchiveerd_op, adviseurs:adviseur_id(naam, email)"
        )
        .order("datum_aangemaakt", { ascending: false });
      if (error) {
        toast({ title: "Laden mislukt", description: error.message, variant: "destructive" });
      } else {
        setProjects((data ?? []) as any);
      }
      setLoading(false);
    })();
  }, []);

  const filterByDatum = (p: Project, veld: DatumVeld) => {
    const raw = p[veld];
    const ref = raw ? new Date(raw) : null;
    if (!ref) return jaarFilter === "alle" && !vanDatum && !totDatum;
    if (jaarFilter !== "alle" && String(ref.getFullYear()) !== jaarFilter) return false;
    if (vanDatum && ref < new Date(vanDatum)) return false;
    if (totDatum && ref > new Date(totDatum + "T23:59:59")) return false;
    return true;
  };

  const perGroep = useMemo(() => {
    return GROEPEN.map((g) => {
      const items = projects.filter((p) => g.statussen.includes(p.status) && filterByDatum(p, g.datumVeld));
      return { groep: g, items };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, jaarFilter, vanDatum, totDatum]);

  const handleDownload = (g: Groep, items: Project[]) => {
    const rows = items.map((p) => {
      const base: Record<string, string> = {
        Projectnaam: p.projectnaam,
        Status: STATUS_LABELS[p.status] ?? p.status,
        Categorie: p.audit_categorie,
        Soort: p.audit_soort,
        Prioriteit: p.prioriteit ? "Ja" : "Nee",
        Toelatingsaudit: p.toelatingsaudit ? "Ja" : "Nee",
        "EP-adviseur": p.adviseurs?.naam ?? "",
        "E-mail adviseur": p.adviseurs?.email ?? "",
        "Datum aangemaakt": formatDate(p.datum_aangemaakt),
        "Afgerond op": formatDate(p.gearchiveerd_op),
      };
      if (g.extraKolom === "reactie_deadline") {
        base["Reactie-deadline"] = formatDate(p.reactie_deadline);
      }
      return base;
    });
    const label = jaarFilter === "alle" && !vanDatum && !totDatum ? "alle" : jaarFilter !== "alle" ? jaarFilter : "selectie";
    downloadCsv(rows, `projecten-${g.key}-${label}.csv`);
    toast({ title: `${rows.length} project(en) geëxporteerd (${g.label})` });
  };

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4" />
          Projecten exporteren
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <p className="text-xs text-muted-foreground">
          Download een CSV per projectfase. Filters gelden voor alle groepen (jaar/datum wordt per groep
          toegepast op het relevante datumveld).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Select value={jaarFilter} onValueChange={setJaarFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Jaar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle jaren</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={vanDatum}
            onChange={(e) => setVanDatum(e.target.value)}
            className="h-8 text-xs"
          />
          <Input
            type="date"
            value={totDatum}
            onChange={(e) => setTotDatum(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="divide-y rounded-md border">
          {perGroep.map(({ groep, items }) => (
            <div key={groep.key} className="flex items-center justify-between px-3 py-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{groep.label}</span>
                <span className="text-xs text-muted-foreground">
                  {loading ? "Laden…" : `${items.length} project(en)`}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(groep, items)}
                disabled={loading || items.length === 0}
                className="h-7 text-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Download CSV
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}