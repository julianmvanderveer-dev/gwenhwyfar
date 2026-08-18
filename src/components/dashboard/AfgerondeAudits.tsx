import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Archive, ChevronRight, ExternalLink, Search } from "lucide-react";

interface AfgerondProject {
  id: string;
  projectnaam: string;
  audit_categorie: string;
  audit_soort: string;
  status: string;
  ep2_beoordeling: string | null;
  gearchiveerd_op: string | null;
  datum_aangemaakt: string;
  dropbox_link: string | null;
  adviseurs: { naam: string } | null;
}

export default function AfgerondeAudits() {
  const [projecten, setProjecten] = useState<AfgerondProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoek, setZoek] = useState("");
  const [jaar, setJaar] = useState("alle");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, projectnaam, audit_categorie, audit_soort, status, ep2_beoordeling, gearchiveerd_op, datum_aangemaakt, dropbox_link, adviseurs(naam)")
        .in("status", ["afgerond", "gesloten"] as any)
        .order("gearchiveerd_op", { ascending: false, nullsFirst: false });
      setProjecten((data as any as AfgerondProject[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const jaren = useMemo(() => {
    const set = new Set<string>();
    projecten.forEach((p) => {
      const d = p.gearchiveerd_op ?? p.datum_aangemaakt;
      if (d) set.add(new Date(d).getFullYear().toString());
    });
    return Array.from(set).sort().reverse();
  }, [projecten]);

  const gefilterd = useMemo(() => {
    const needle = zoek.trim().toLowerCase();
    return projecten.filter((p) => {
      if (jaar !== "alle") {
        const d = p.gearchiveerd_op ?? p.datum_aangemaakt;
        if (!d || new Date(d).getFullYear().toString() !== jaar) return false;
      }
      if (needle) {
        const hay = [p.projectnaam, p.adviseurs?.naam].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [projecten, zoek, jaar]);

  if (loading || projecten.length === 0) return null;

  return (
    <Collapsible>
      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        <CollapsibleTrigger asChild>
          <button type="button" className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors group">
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
            <Archive className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <span className="font-semibold text-sm">Mijn afgeronde audits</span>
              <div className="text-xs text-muted-foreground mt-0.5">Audits die jij hebt uitgevoerd of beoordeeld</div>
            </div>
            <Badge variant="secondary" className="text-xs">{projecten.length}</Badge>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t">
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-muted/20">
              <div className="relative max-w-xs flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek op project of adviseur..."
                  value={zoek}
                  onChange={(e) => setZoek(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Select value={jaar} onValueChange={setJaar}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Jaar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle jaren</SelectItem>
                  {jaren.map((j) => (
                    <SelectItem key={j} value={j}>{j}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground ml-auto">{gefilterd.length} audits</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/40 border-y">
                  <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Project</th>
                  <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">EP-adviseur</th>
                  <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Categorie</th>
                  <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Soort</th>
                  <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">EP2</th>
                  <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Afgerond</th>
                  <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Dossier</th>
                  <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Actie</th>
                </tr>
              </thead>
              <tbody>
                {gefilterd.map((p, i) => (
                  <tr key={p.id} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-card" : "bg-background"}`}>
                    <td className="px-4 py-2.5 font-medium">{p.projectnaam}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.adviseurs?.naam ?? "—"}</td>
                    <td className="px-4 py-2.5"><Badge variant="secondary" className="text-xs">{p.audit_categorie}</Badge></td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {p.audit_soort === "projectaudit" ? "Projectaudit" : "Dossieraudit"}
                    </td>
                    <td className="px-4 py-2.5">
                      {p.ep2_beoordeling ? <Badge variant="outline" className="text-xs">{p.ep2_beoordeling}</Badge> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                      {p.gearchiveerd_op ? new Date(p.gearchiveerd_op).toLocaleDateString("nl-NL") : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {p.dropbox_link ? (
                        <a href={p.dropbox_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-xs">
                          Openen <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <Link to={`/project/${p.id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs">Bekijken</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {gefilterd.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-muted-foreground">Geen audits gevonden.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
