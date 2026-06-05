import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, ExternalLink } from "lucide-react";
import { afwijkingBadge } from "@/lib/badges";
import type { Tables } from "@/integrations/supabase/types";

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

      {filteredAdviseurFindings.length === 0 ? (
        <p className="text-muted-foreground text-sm">Geen afwijkingen gevonden.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/60 border-b">
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Projectnaam</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Controlepunt</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Type afwijking</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Reactie</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Document</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actie</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdviseurFindings.map((f, i) => (
                <tr key={f.id} className={`border-b last:border-0 ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                  <td className="px-4 py-2.5 font-medium">
                    <Link to={`/project/${f.project_id}`} className="text-accent hover:underline">
                      {f.projectnaam}
                    </Link>
                  </td>
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
