import { Link } from "react-router-dom";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { afwijkingBadge } from "@/lib/badges";
import type { Tables } from "@/integrations/supabase/types";
import BatchVersturenCompact from "@/components/projecten/BatchVersturenCompact";
import { Input } from "@/components/ui/input";
import { auditjaarVanDatum } from "@/lib/auditjaar";

type Finding = Tables<"findings"> & { projectnaam?: string; laatste_reactie?: string; laatste_bijlage?: string | null };

interface AdviseurSectieProps {
  filteredAdviseurFindings: Finding[];
  adviseurFilterProject: string;
  setAdviseurFilterProject: (v: string) => void;
  adviseurFilterStatus: string;
  setAdviseurFilterStatus: (v: string) => void;
  adviseurProjectNames: (string | undefined)[];
  adviseurStatusBadge: (status: string, hasConcept?: boolean) => React.ReactNode;
  handleDownload: (path: string) => void;
  adviseurProjecten?: AdviseurProject[];
  onAdviseurDataChanged?: () => void;
  alleFindings?: Finding[];
}

type AdviseurProject = { id: string; projectnaam: string; status?: string; auditjaar?: string | null; datum_aangemaakt?: string };

const statusLabel: Record<string, string> = {
  nog_niet_begonnen: "Nog niet begonnen",
  geselecteerd: "Geselecteerd",
  deel1_bezig: "Deel 1 bezig",
  deel1_afgerond: "Deel 1 afgerond",
  wacht_op_deel2: "Wacht op deel 2",
  deel2_bezig: "Deel 2 bezig",
  wacht_op_reactie: "Wacht op reactie",
  reactie_open: "Reactie open",
  wacht_op_herafmelding: "Wacht op herafmelding",
  afgerond: "Afgerond",
  gesloten: "Afgerond (archief)",
};

function MijnAudits({ projecten, findings }: { projecten: AdviseurProject[]; findings: Finding[] }) {
  const [zoek, setZoek] = useState("");
  const [jaar, setJaar] = useState("alle");
  const jaarVan = (p: AdviseurProject) => p.auditjaar || (p.datum_aangemaakt ? auditjaarVanDatum(p.datum_aangemaakt) : "");
  const jaren = Array.from(new Set(projecten.map(jaarVan).filter(Boolean))).sort().reverse();
  const telling = new Map<string, number>();
  findings.forEach((f) => telling.set(f.project_id, (telling.get(f.project_id) ?? 0) + 1));
  const lijst = projecten.filter(
    (p) => p.projectnaam.toLowerCase().includes(zoek.toLowerCase()) && (jaar === "alle" || jaarVan(p) === jaar),
  );
  return (
    <div className="mt-6 bg-card rounded-lg border shadow-sm p-4">
      <h2 className="font-semibold mb-1 text-sm">Mijn audits</h2>
      <p className="text-xs text-muted-foreground mb-3">Al uw audits, ook afgeronde. Klik op een audit om de opmerkingen terug te lezen.</p>
      <div className="flex flex-wrap gap-3 mb-3">
        <Input placeholder="Zoek op projectnaam" value={zoek} onChange={(e) => setZoek(e.target.value)} className="w-[240px] h-9 text-sm" />
        <Select value={jaar} onValueChange={setJaar}>
          <SelectTrigger className="w-[180px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle auditjaren</SelectItem>
            {jaren.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {lijst.length === 0 ? (
        <p className="text-muted-foreground text-sm">Geen audits gevonden.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/40 border-b">
              {["Project", "Auditjaar", "Status", "Afwijkingen", ""].map((h) => (
                <th key={h} className="text-left px-3 py-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lijst.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="px-3 py-2 font-medium">{p.projectnaam}</td>
                <td className="px-3 py-2">{jaarVan(p) || "—"}</td>
                <td className="px-3 py-2">{statusLabel[p.status ?? ""] ?? p.status ?? "—"}</td>
                <td className="px-3 py-2">{telling.get(p.id) ?? 0}</td>
                <td className="px-3 py-2">
                  <Link to={`/project/${p.id}`} className="text-xs text-accent hover:underline flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> Audit inzien
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function AdviseurSectie({
  filteredAdviseurFindings,
  adviseurFilterProject,
  setAdviseurFilterProject,
  adviseurFilterStatus,
  setAdviseurFilterStatus,
  adviseurProjectNames,
  adviseurStatusBadge,
  handleDownload,
  adviseurProjecten = [],
  onAdviseurDataChanged,
  alleFindings,
}: AdviseurSectieProps) {
  const filteredAlleFindings = alleFindings ?? filteredAdviseurFindings;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  // Groepeer findings per project
  const groups = new Map<string, { projectId: string; projectnaam: string; items: Finding[] }>();
  for (const f of filteredAdviseurFindings) {
    const pid = f.project_id as string;
    if (!pid) continue;
    if (!groups.has(pid)) {
      groups.set(pid, { projectId: pid, projectnaam: f.projectnaam ?? "—", items: [] });
    }
    groups.get(pid)!.items.push(f);
  }
  const projectGroups = Array.from(groups.values()).sort((a, b) =>
    a.projectnaam.localeCompare(b.projectnaam),
  );

  return (
    <div className="bg-card rounded-lg border shadow-sm p-4">
      <h2 className="font-semibold mb-3 text-sm">Afwijkingen overzicht (EP-adviseur)</h2>

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={adviseurFilterProject} onValueChange={setAdviseurFilterProject}>
          <SelectTrigger className="w-[200px] h-9 text-sm">
            <SelectValue placeholder="Alle projecten" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle projecten</SelectItem>
            {adviseurProjectNames.map((name) => (
              <SelectItem key={name} value={name!}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={adviseurFilterStatus} onValueChange={setAdviseurFilterStatus}>
          <SelectTrigger className="w-[200px] h-9 text-sm">
            <SelectValue placeholder="Alle statussen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openstaand">Openstaand</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="reactie_ontvangen">Reactie ingediend</SelectItem>
            <SelectItem value="afgehandeld">Afgehandeld</SelectItem>
            <SelectItem value="alle">Alles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {projectGroups.length === 0 ? (
        <p className="text-muted-foreground text-sm">Geen afwijkingen gevonden.</p>
      ) : (
        <div className="space-y-3">
          {projectGroups.map((g) => {
            const open = !!expanded[g.projectId];
            const openCount = g.items.filter((f) => f.status === "open" && !(f as any).concept_reactie).length;
            const conceptCount = g.items.filter((f) => f.status === "open" && !!(f as any).concept_reactie).length;
            const ingediendCount = g.items.filter((f) => f.status === "reactie_ontvangen").length;
            const goedCount = g.items.filter((f) => f.status === "reactie_goedgekeurd").length;
            return (
              <div key={g.projectId} className="border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-secondary/60">
                  <button
                    type="button"
                    onClick={() => toggle(g.projectId)}
                    className="flex items-center gap-2 text-left flex-1 min-w-0"
                  >
                    {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                    <span className="font-semibold truncate">{g.projectnaam}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {g.items.length} afwijking{g.items.length === 1 ? "" : "en"}
                      {openCount > 0 && ` · ${openCount} open`}
                      {conceptCount > 0 && ` · ${conceptCount} concept`}
                      {ingediendCount > 0 && ` · ${ingediendCount} ingediend`}
                      {goedCount > 0 && ` · ${goedCount} goedgekeurd`}
                    </span>
                  </button>
                  <Link
                    to={`/project/${g.projectId}`}
                    className="text-xs text-accent hover:underline shrink-0 flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" /> Audit inzien
                  </Link>
                </div>

                <div className="px-4 py-3 border-t bg-card">
                  <BatchVersturenCompact
                    projectId={g.projectId}
                    navigateOnSent={false}
                    onSent={onAdviseurDataChanged}
                  />
                </div>

                {open && (
                  <div className="overflow-x-auto border-t">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-secondary/40 border-b">
                          <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Controlepunt</th>
                          <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Type afwijking</th>
                          <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                          <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Reactie</th>
                          <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Document</th>
                          <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actie</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.items.map((f, i) => (
                          <tr key={f.id} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-card" : "bg-background"}`}>
                            <td className="px-4 py-2.5">{f.controlepunt}</td>
                            <td className="px-4 py-2.5">{afwijkingBadge(f.type_afwijking)}</td>
                            <td className="px-4 py-2.5">{adviseurStatusBadge(f.status, !!(f as any).concept_reactie)}</td>
                            <td className="px-4 py-2.5 max-w-[200px] truncate" title={f.laatste_reactie ?? ""}>
                              {f.laatste_reactie || "—"}
                            </td>
                            <td className="px-4 py-2.5">
                              {f.laatste_bijlage ? (
                                <button onClick={() => handleDownload(f.laatste_bijlage!)} className="text-accent hover:underline text-xs flex items-center gap-1">
                                  <Download className="h-3 w-3" /> Download
                                </button>
                              ) : "—"}
                            </td>
                            <td className="px-4 py-2.5">
                              {f.status === "open" ? (
                                <Link to={`/finding/${f.id}/reactie`} className="text-accent hover:underline font-medium text-sm">
                                  {(f as any).concept_reactie ? "Wijzigen" : "Reageren"}
                                </Link>
                              ) : f.status === "reactie_goedgekeurd" ? (
                                <Badge variant="secondary" className="text-xs">Goedgekeurd</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Ingediend</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {adviseurProjecten.length > 0 && (
        <MijnAudits projecten={adviseurProjecten} findings={filteredAlleFindings} />
      )}
    </div>
  );
}
