import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Paperclip, Download, ChevronDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Bijlage = { id: string; bijlage_pad: string; datum: string; controlepunt: string; onderdeel: string };

/** Alle bijlagen die bij reacties op bevindingen zijn aangeleverd, centraal op één plek. */
export default function AuditBijlagen({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<Bijlage[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, bijlage_pad, datum, findings!inner(project_id, controlepunt, onderdeel)")
        .eq("findings.project_id", projectId)
        .not("bijlage_pad", "is", null)
        .order("datum", { ascending: false });
      setItems(
        (data ?? []).map((m: any) => ({
          id: m.id,
          bijlage_pad: m.bijlage_pad,
          datum: m.datum,
          controlepunt: m.findings?.controlepunt ?? "",
          onderdeel: m.findings?.onderdeel ?? "",
        })),
      );
    })();
  }, [projectId]);

  if (items.length === 0) return null;

  const download = async (path: string) => {
    const { data, error } = await supabase.storage.from("finding-documents").createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) {
      toast({ title: "Download mislukt", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <Collapsible className="border rounded-lg bg-card p-4 shadow-sm">
      <CollapsibleTrigger className="flex w-full items-center justify-between font-semibold">
        <span className="flex items-center gap-2">
          <Paperclip className="h-4 w-4" /> Bijlagen audit ({items.length})
        </span>
        <ChevronDown className="h-4 w-4" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className="text-xs text-muted-foreground mt-2">
          Bestanden die bij reacties zijn aangeleverd. Ze blijven bewaard bij deze audit; handmatig toevoegen aan het dossier is niet nodig.
        </p>
        <ul className="mt-2 divide-y text-sm">
          {items.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 py-2">
              <div>
                <div className="font-medium">{b.controlepunt}</div>
                <div className="text-xs text-muted-foreground">
                  {b.onderdeel} · {new Date(b.datum).toLocaleString("nl-NL")}
                </div>
              </div>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => download(b.bijlage_pad)}>
                <Download className="h-3.5 w-3.5" /> Downloaden
              </Button>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
