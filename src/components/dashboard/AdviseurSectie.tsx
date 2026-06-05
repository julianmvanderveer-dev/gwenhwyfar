import { Link } from "react-router-dom";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { afwijkingBadge } from "@/lib/badges";
import type { Tables } from "@/integrations/supabase/types";
import BatchVersturenCompact from "@/components/projecten/BatchVersturenCompact";

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
  adviseurProjecten?: { id: string; projectnaam: string }[];
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
}: AdviseurSectieProps) {
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
            <SelectItem value="alle">Alle statussen</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="reactie_ontvangen">Reactie ingediend</SelectItem>
            <SelectItem value="reactie_goedgekeurd">Reactie goedgekeurd</SelectItem>
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
                  <BatchVersturenCompact projectId={g.projectId} navigateOnSent={false} />
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
      {/* Projectenlijst */}
      {adviseurProjecten.length > 0 && (
        <div className="mt-6 bg-card rounded-lg border shadow-sm p-4">
          <h2 className="font-semibold mb-3 text-sm">Mijn projecten</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {adviseurProjecten.map((p) => (
              <Link
                key={p.id}
                to={`/project/${p.id}`}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent/10 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 text-accent shrink-0" />
                <span className="truncate font-medium">{p.projectnaam}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
