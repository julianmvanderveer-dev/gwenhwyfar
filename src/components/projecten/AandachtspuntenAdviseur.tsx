import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Aandachtspunt {
  controlepunt: string;
  onderdeel: string;
  aantal: number;
}

interface Props {
  adviseurId: string;
  projectId: string;
}

export default function AandachtspuntenAdviseur({ adviseurId, projectId }: Props) {
  const [data, setData] = useState<Aandachtspunt[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!adviseurId || !projectId) return;
    supabase
      .rpc("get_adviseur_aandachtspunten", {
        _adviseur_id: adviseurId,
        _exclude_project_id: projectId,
      })
      .then(({ data: rows }) => {
        if (rows && rows.length > 0) {
          setData(rows as Aandachtspunt[]);
        }
      });
  }, [adviseurId, projectId]);

  if (data.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-lg bg-card shadow-sm">
        <CollapsibleTrigger className="flex items-center gap-2 w-full px-4 py-3 text-sm font-semibold hover:bg-muted/50 transition-colors rounded-lg">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          <span>Aandachtspunten bij deze adviseur</span>
          <span className="ml-1 text-xs text-muted-foreground font-normal">
            ({data.length} meest voorkomende afwijkingen)
          </span>
          {open ? (
            <ChevronUp className="h-4 w-4 ml-auto text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Onderdeel</th>
                  <th className="text-left py-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Controlepunt</th>
                  <th className="text-right py-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Aantal</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1.5 text-muted-foreground">{row.onderdeel}</td>
                    <td className="py-1.5">{row.controlepunt}</td>
                    <td className="py-1.5 text-right font-semibold">{row.aantal}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
