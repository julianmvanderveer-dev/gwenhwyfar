import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet, RotateCcw } from "lucide-react";
import { downloadCsv } from "@/lib/csv";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { auditjaarVanDatum } from "@/lib/auditjaar";

interface Rij {
  id: string;
  projectnaam: string;
  status: string;
  audit_categorie: string;
  audit_soort: string;
  auditjaar: string | null;
  prioriteit: boolean;
  toelatingsaudit: boolean;
  is_omgevingsvergunning: boolean;
  ep2_startwaarde: number | null;
  ep2_eindwaarde: number | null;
  ep2_beoordeling: string | null;
  datum_aangemaakt: string;
  reactie_deadline: string | null;
  gearchiveerd_op: string | null;
  dropbox_link: string | null;
  adviseur_id: string | null;
  toegewezen_aan: string | null;
  adviseurs?: { nummer: number | null; naam: string | null; email: string | null } | null;
}

const STATUS_LABELS: Record<string, string> = {
  nog_niet_begonnen: "Nog niet begonnen",
  deel1_bezig: "Deel 1 bezig",
  deel1_afgerond: "Deel 1 afgerond",
  deel2_bezig: "Deel 2 bezig",
  wacht_op_reactie: "Reactie EP-adviseur gevraagd",
  wacht_op_herafmelding: "Wacht op nieuwe afmelding",
  afgerond: "Afgerond",
  gesloten: "Gesloten",
};

const CATEGORIEEN = ["EPW-B", "EPW-D", "EPU-B", "EPU-D", "MWA-B", "MWA-U"];

function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("nl-NL") : "";
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AlleProjectenExport() {
  const [projects, setProjects] = useState<Rij[]>([]);
  const [profielen, setProfielen] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  const [jaar, setJaar] = useState("alle");
  const [categorie, setCategorie] = useState("alle");
  const [adviseur, setAdviseur] = useState("alle");
  const [status, setStatus] = useState("alle");
  const [vanDatum, setVanDatum] = useState("");
  const [totDatum, setTotDatum] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data, error }, { data: profs }] = await Promise.all([
        supabase
          .from("projects")
          .select(
            "id, projectnaam, status, audit_categorie, audit_soort, auditjaar, prioriteit, toelatingsaudit, is_omgevingsvergunning, ep2_startwaarde, ep2_eindwaarde, ep2_beoordeling, datum_aangemaakt, reactie_deadline, gearchiveerd_op, dropbox_link, adviseur_id, toegewezen_aan, deel1_uitgevoerd_door, adviseurs:adviseur_id(nummer, naam, email)"
          )
          .order("datum_aangemaakt", { ascending: false }),
        supabase.from("profiles").select("id, naam"),
      ]);
      if (error) {
        toast({ title: "Laden mislukt", description: error.message, variant: "destructive" });
      } else {
        setProjects((data ?? []) as any);
      }
      setProfielen(new Map((profs ?? []).map((p: any) => [p.id, p.naam])));
      setLoading(false);
    })();
  }, []);

  const jaarVan = (p: Rij) => p.auditjaar ?? auditjaarVanDatum(p.datum_aangemaakt);

  const auditjaren = useMemo(
    () => Array.from(new Set(projects.map(jaarVan))).sort().reverse(),
    [projects]
  );

  const adviseurOpties = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => {
      if (p.adviseur_id && p.adviseurs?.naam) {
        const nr = p.adviseurs.nummer != null ? String(p.adviseurs.nummer).padStart(3, "0") + " – " : "";
        map.set(p.adviseur_id, nr + p.adviseurs.naam);
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [projects]);

  const statusOpties = useMemo(
    () => Array.from(new Set(projects.map((p) => p.status))).sort(),
    [projects]
  );

  const gefilterd = useMemo(() => {
    return projects.filter((p) => {
      if (jaar !== "alle" && jaarVan(p) !== jaar) return false;
      if (categorie !== "alle" && p.audit_categorie !== categorie) return false;
      if (adviseur !== "alle" && p.adviseur_id !== adviseur) return false;
      if (status !== "alle" && p.status !== status) return false;
      const d = new Date(p.datum_aangemaakt);
      if (vanDatum && d < new Date(vanDatum)) return false;
      if (totDatum && d > new Date(totDatum + "T23:59:59")) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, jaar, categorie, adviseur, status, vanDatum, totDatum]);

  const resetFilters = () => {
    setJaar("alle");
    setCategorie("alle");
    setAdviseur("alle");
    setStatus("alle");
    setVanDatum("");
    setTotDatum("");
  };

  const handleDownload = () => {
    const rows = gefilterd.map((p) => ({
      Projectnaam: p.projectnaam,
      Status: STATUS_LABELS[p.status] ?? p.status,
      Categorie: p.audit_categorie,
      Soort: p.audit_soort,
      Auditjaar: jaarVan(p),
      Adviseurnummer: p.adviseurs?.nummer != null ? String(p.adviseurs.nummer).padStart(3, "0") : "",
      "EP-adviseur": p.adviseurs?.naam ?? "",
      "E-mail adviseur": p.adviseurs?.email ?? "",
      Behandelaar: p.toegewezen_aan ? profielen.get(p.toegewezen_aan) ?? "" : "",
      "Deel 1 uitgevoerd door": (p as any).deel1_uitgevoerd_door ? profielen.get((p as any).deel1_uitgevoerd_door) ?? "" : "",

      Prioriteit: p.prioriteit ? "Ja" : "Nee",
      Toelatingsaudit: p.toelatingsaudit ? "Ja" : "Nee",
      Omgevingsvergunning: p.is_omgevingsvergunning ? "Ja" : "Nee",
      "EP2 startwaarde": p.ep2_startwaarde != null ? String(p.ep2_startwaarde).replace(".", ",") : "",
      "EP2 eindwaarde": p.ep2_eindwaarde != null ? String(p.ep2_eindwaarde).replace(".", ",") : "",
      "EP2 beoordeling": p.ep2_beoordeling ? p.ep2_beoordeling.toUpperCase() : "",
      "Datum aangemaakt": formatDate(p.datum_aangemaakt),
      "Reactie-deadline": formatDate(p.reactie_deadline),
      "Afgerond op": formatDate(p.gearchiveerd_op),
      Dossier: p.dropbox_link ?? "",
    }));
    if (rows.length === 0) {
      toast({ title: "Geen projecten in deze selectie", variant: "destructive" });
      return;
    }
    const delen = [
      "projecten",
      jaar !== "alle" ? jaar : "alle",
      categorie !== "alle" ? slug(categorie) : "",
      status !== "alle" ? slug(STATUS_LABELS[status] ?? status) : "",
    ].filter(Boolean);
    downloadCsv(rows, `${delen.join("-")}.csv`);
    toast({ title: `${rows.length} project(en) geëxporteerd` });
  };

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <FileSpreadsheet className="h-4 w-4" />
          Alle projecten exporteren
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <p className="text-xs text-muted-foreground">
          Eén CSV met alle projecten, ongeacht de fase. Combineer de filters naar wens.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Auditjaar</Label>
            <Select value={jaar} onValueChange={setJaar}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle auditjaren</SelectItem>
                {auditjaren.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Audittype</Label>
            <Select value={categorie} onValueChange={setCategorie}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle typen</SelectItem>
                {CATEGORIEEN.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">EP-adviseur</Label>
            <Select value={adviseur} onValueChange={setAdviseur}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="alle">Alle adviseurs</SelectItem>
                {adviseurOpties.map(([id, label]) => (
                  <SelectItem key={id} value={id}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle statussen</SelectItem>
                {statusOpties.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Aangemaakt vanaf</Label>
            <Input type="date" value={vanDatum} onChange={(e) => setVanDatum(e.target.value)} className="h-8 text-xs" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Aangemaakt tot en met</Label>
            <Input type="date" value={totDatum} onChange={(e) => setTotDatum(e.target.value)} className="h-8 text-xs" />
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">
            {loading ? "Laden…" : `${gefilterd.length} project(en) geselecteerd`}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={resetFilters} className="h-7 text-xs">
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Filters wissen
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={loading || gefilterd.length === 0} className="h-7 text-xs">
              <Download className="h-3.5 w-3.5 mr-1" />
              Download CSV
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
