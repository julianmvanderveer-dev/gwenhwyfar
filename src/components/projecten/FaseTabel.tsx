import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Trash2, ArrowRightLeft, RotateCcw, Check, X } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { faseConfig, type FaseKey } from "./faseConfig";

export interface ToewijsbarePersoon {
  id: string;
  naam: string;
  roles: string[];
  auditCategorieen?: string[];
}

export interface ProjectRow {
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
  _fase?: FaseKey;
}

interface FaseTabelProps {
  fase: FaseKey;
  faseIndex: number;
  projecten: ProjectRow[];
  canDelete: boolean;
  onDelete: (id: string) => void;
  defaultOpen?: boolean;
  showToewijzing?: boolean;
  showSubstatus?: boolean;
  toewijsbarePersonen?: ToewijsbarePersoon[];
  onReassign?: (projectId: string, userId: string) => void;
  onReturnToPool?: (projectId: string) => void;
  titel?: string;
  icon?: typeof import("lucide-react").FolderKanban;
  accentClass?: string;
  badge?: number;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("nl-NL");
}

export default function FaseTabel({
  fase, faseIndex, projecten, canDelete, onDelete, defaultOpen = true,
  showToewijzing = false, showSubstatus = false, toewijsbarePersonen, onReassign, onReturnToPool,
  titel, icon, accentClass, badge,
}: FaseTabelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [hertoewijzingId, setHertoewijzingId] = useState<string | null>(null);
  const [hertoewijzingAan, setHertoewijzingAan] = useState("");
  const config = faseConfig[fase];
  const Icon = icon ?? config.icon;
  const displayTitel = titel ?? config.titel;
  const displayAccent = accentClass ?? config.accentClass;
  const displayBadge = badge ?? projecten.length;

  const canReassign = showToewijzing && toewijsbarePersonen && onReassign && onReturnToPool;

  const getFilteredPersonen = (project: { status: string; audit_categorie: string }) => {
    if (!toewijsbarePersonen) return [];
    const isTekenaarFase = ["nog_niet_begonnen", "deel1_bezig"].includes(project.status);
    const isAuditorFase = ["deel1_afgerond", "deel2_bezig"].includes(project.status);
    return toewijsbarePersonen.filter(pp => {
      if (isTekenaarFase && !pp.roles.includes("tekenaar")) return false;
      if (isAuditorFase && !pp.roles.includes("auditor")) return false;
      // Filter by audit category permissions
      if (pp.auditCategorieen && pp.auditCategorieen.length > 0) {
        if (!pp.auditCategorieen.includes(project.audit_categorie)) return false;
      } else if (pp.auditCategorieen && pp.auditCategorieen.length === 0) {
        // No categories assigned = no permissions
        return false;
      }
      return true;
    });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-3 px-4 py-3 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer text-left group">
          <span className="text-muted-foreground group-hover:text-foreground transition-colors">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
          <Icon className={`h-5 w-5 ${displayAccent}`} />
          <span className="font-semibold text-sm">
            {faseIndex + 1}. {displayTitel}
          </span>
          <Badge
            variant={displayBadge > 0 ? "default" : "secondary"}
            className="ml-auto text-xs"
          >
            {displayBadge}
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
                  {canReassign && <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-56">Toewijzing</th>}
                  {canDelete && <th className="w-10" />}
                </tr>
              </thead>
              <tbody>
                {projecten.map((p, i) => {
                  const isEditing = hertoewijzingId === p.id;
                  const gefilterd = getFilteredPersonen(p);
                  const isTekenaarFase = ["nog_niet_begonnen", "deel1_bezig"].includes(p.status);
                  const isAuditorFase = ["deel1_afgerond", "deel2_bezig"].includes(p.status);

                  return (
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
                      {canReassign && (
                        <td className="px-4 py-2.5">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <select
                                className="border rounded px-2 py-1 text-xs flex-1 bg-background"
                                value={hertoewijzingAan}
                                onChange={(e) => setHertoewijzingAan(e.target.value)}
                              >
                                <option value="">— {isTekenaarFase ? "Tekenaar" : isAuditorFase ? "Auditor" : "Persoon"} —</option>
                                {gefilterd.map((pp) => (
                                  <option key={pp.id} value={pp.id}>{pp.naam} ({pp.roles.filter(r => r !== "beheer").join(", ")})</option>
                                ))}
                              </select>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                disabled={!hertoewijzingAan}
                                onClick={() => {
                                  onReassign!(p.id, hertoewijzingAan);
                                  setHertoewijzingId(null);
                                  setHertoewijzingAan("");
                                }}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => { setHertoewijzingId(null); setHertoewijzingAan(""); }}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => setHertoewijzingId(p.id)}
                              >
                                <ArrowRightLeft className="h-3 w-3" /> Hertoewijzen
                              </Button>
                              {p.toegewezen_aan && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs gap-1"
                                  onClick={() => onReturnToPool!(p.id)}
                                >
                                  <RotateCcw className="h-3 w-3" /> Pool
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                      )}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
