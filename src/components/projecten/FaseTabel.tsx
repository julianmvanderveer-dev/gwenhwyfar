import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { faseConfig, type FaseKey } from "./faseConfig";

interface FaseTabelProps {
  fase: FaseKey;
  faseIndex: number;
  projecten: Array<{
    id: string;
    projectnaam: string;
    audit_categorie: string;
    audit_soort: string;
    prioriteit: boolean;
    toelatingsaudit: boolean;
    datum_aangemaakt: string;
    reactie_deadline: string | null;
    status: string;
    adviseurs?: { naam: string } | null;
    toewijzing?: string;
    toegewezen_aan?: string | null;
    toegewezen_profiel?: { naam: string } | null;
  }>;
  canDelete: boolean;
  onDelete: (id: string) => void;
  defaultOpen?: boolean;
  showToewijzing?: boolean;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("nl-NL");
}

export default function FaseTabel({ fase, faseIndex, projecten, canDelete, onDelete, defaultOpen = true, showToewijzing = false }: FaseTabelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const config = faseConfig[fase];
  const Icon = config.icon;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-3 px-4 py-3 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer text-left group">
          <span className="text-muted-foreground group-hover:text-foreground transition-colors">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
          <Icon className={`h-5 w-5 ${config.accentClass}`} />
          <span className="font-semibold text-sm">
            {faseIndex + 1}. {config.titel}
          </span>
          <Badge
            variant={projecten.length > 0 ? "default" : "secondary"}
            className="ml-auto text-xs"
          >
            {projecten.length}
          </Badge>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {projecten.length === 0 ? (
          <p className="text-sm text-muted-foreground italic px-4 py-3">Geen projecten in deze fase.</p>
        ) : (
          <div className="border rounded-b-lg overflow-hidden shadow-sm -mt-1">
            <table className="w-full text-sm">
              <thead>
               <tr className="bg-secondary/60 border-b">
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Project</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Categorie</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Soort</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Adviseur</th>
                  {showToewijzing && (
                    <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Toegewezen aan</th>
                  )}
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Aangemaakt</th>
                  {fase === "wacht_op_reactie_ep" && (
                    <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Deadline</th>
                  )}
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-24">Labels</th>
                  {canDelete && <th className="w-10" />}
                </tr>
              </thead>
              <tbody>
                {projecten.map((p, i) => (
                  <tr key={p.id} className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                    <td className="px-4 py-2.5">
                      <Link to={`/project/${p.id}`} className="font-medium text-accent hover:underline">
                        {p.projectnaam}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.audit_categorie}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.audit_soort}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.adviseurs?.naam ?? "—"}</td>
                    {showToewijzing && (
                      <td className="px-4 py-2.5">
                        {p.toegewezen_aan ? (
                          <span className="text-foreground">{p.toegewezen_profiel?.naam ?? "Onbekend"}</span>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">Pool</Badge>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-muted-foreground">{formatDate(p.datum_aangemaakt)}</td>
                    {fase === "wacht_op_reactie_ep" && (
                      <td className="px-4 py-2.5">
                        {p.reactie_deadline ? (
                          <span className="text-destructive font-medium">{formatDate(p.reactie_deadline)}</span>
                        ) : "—"}
                      </td>
                    )}
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1 flex-wrap">
                        {p.prioriteit && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Prio</Badge>
                        )}
                        {p.toelatingsaudit && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Toelating</Badge>
                        )}
                      </div>
                    </td>
                    {canDelete && (
                      <td className="px-2 py-2.5">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Project verwijderen?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Weet je zeker dat je "{p.projectnaam}" wilt verwijderen? Alle bijbehorende findings worden ook verwijderd.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuleren</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(p.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Verwijderen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
