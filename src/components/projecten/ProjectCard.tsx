import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProjectCardProps {
  project: {
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
  };
  canDelete: boolean;
  onDelete: (id: string) => void;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("nl-NL");
}

export default function ProjectCard({ project, canDelete, onDelete }: ProjectCardProps) {
  const p = project;

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/project/${p.id}`} className="font-semibold text-sm text-primary hover:underline leading-tight">
            {p.projectnaam}
          </Link>
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Project verwijderen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Weet je zeker dat je "{p.projectnaam}" wilt verwijderen?
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
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>{p.audit_categorie} · {p.audit_soort}</p>
          <p>Adviseur: {p.adviseurs?.naam ?? "—"}</p>
          <p>Aangemaakt: {formatDate(p.datum_aangemaakt)}</p>
          {p.status === "wacht_op_reactie" && p.reactie_deadline && (
            <p className="text-destructive font-medium">
              Deadline: {formatDate(p.reactie_deadline)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {p.prioriteit && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Prioriteit</Badge>
          )}
          {p.toelatingsaudit && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Toelatingsaudit</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
