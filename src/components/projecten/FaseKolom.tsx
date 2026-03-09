import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { faseConfig, type FaseKey } from "./faseConfig";
import ProjectCard from "./ProjectCard";

interface FaseKolomProps {
  fase: FaseKey;
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
  }>;
  canDelete: boolean;
  onDelete: (id: string) => void;
}

export default function FaseKolom({ fase, projecten, canDelete, onDelete }: FaseKolomProps) {
  const config = faseConfig[fase];
  const Icon = config.icon;

  return (
    <Card className={`${config.borderClass} ${config.bgClass}`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Icon className="h-4 w-4 text-muted-foreground" />
            {config.titel}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">{projecten.length}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{config.omschrijving}</p>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        {projecten.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Geen projecten.</p>
        ) : (
          projecten.map((p) => (
            <ProjectCard key={p.id} project={p} canDelete={canDelete} onDelete={onDelete} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
