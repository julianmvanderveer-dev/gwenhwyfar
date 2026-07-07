import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { FileDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAppSettings } from "@/hooks/useAppSettings";
import { buildAuditReportHtml } from "@/lib/generateAuditReport";
import { renderReportToPdfBlob } from "@/lib/renderReportToPdf";
import { toast } from "@/hooks/use-toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";

type StatusFilter = "afgerond" | "alle";

const STATUS_MAP: Record<StatusFilter, string[] | null> = {
  afgerond: ["afgerond", "gesloten"],
  alle: null,
};

function sanitize(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "_").trim() || "project";
}

export default function BulkPdfExport() {
  const { settings } = useAppSettings() as any;
  const logoUrl: string | undefined = settings?.org_logo_url || undefined;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("afgerond");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, current: "" });

  const start = async () => {
    setBusy(true);
    setProgress({ done: 0, total: 0, current: "Projecten ophalen…" });
    try {
      // 1. Projecten
      let projectsQuery = supabase.from("projects").select("*").order("datum_aangemaakt", { ascending: false });
      const statuses = STATUS_MAP[statusFilter];
      if (statuses) projectsQuery = projectsQuery.in("status", statuses as any);
      const { data: projects, error: projErr } = await projectsQuery;
      if (projErr) throw projErr;
      if (!projects || projects.length === 0) {
        toast({ title: "Geen projecten gevonden voor deze selectie" });
        setBusy(false);
        return;
      }

      setProgress({ done: 0, total: projects.length, current: "Bijbehorende data ophalen…" });

      // 2. Adviseurs (alle gebruikte)
      const adviseurIds = [...new Set(projects.map((p) => p.adviseur_id).filter(Boolean))] as string[];
      const advMap = new Map<string, { naam: string; nummer: number | null; user_id: string | null }>();
      if (adviseurIds.length > 0) {
        const { data: advs } = await supabase
          .from("adviseurs")
          .select("id, naam, nummer, user_id")
          .in("id", adviseurIds);
        (advs ?? []).forEach((a: any) => advMap.set(a.id, { naam: a.naam, nummer: a.nummer, user_id: a.user_id }));
      }

      // 3. Templates per audit_categorie (cache)
      const templateCache = new Map<string, any[]>();
      const cats = [...new Set(projects.map((p) => p.audit_categorie).filter(Boolean))] as string[];
      for (const cat of cats) {
        const { data: tpls } = await supabase
          .from("checklist_templates")
          .select("code, onderdeel, controlepunt, deel")
          .eq("audit_categorie", cat as any)
          .order("code");
        templateCache.set(cat, tpls ?? []);
      }

      // 4. Genereer PDFs (sequentieel om browser niet vast te zetten)
      const zip = new JSZip();
      const fouten: string[] = [];
      let done = 0;

      for (const project of projects) {
        done++;
        setProgress({ done, total: projects.length, current: project.projectnaam });

        try {
          const templates = templateCache.get(project.audit_categorie) ?? [];
          if (templates.length === 0) {
            fouten.push(`${project.projectnaam} — geen checklist-templates voor ${project.audit_categorie}`);
            continue;
          }

          const { data: findings } = await supabase
            .from("findings")
            .select("*")
            .eq("project_id", project.id);

          const findingIds = (findings ?? []).map((f) => f.id);
          let messages: { finding_id: string; afzender_id: string; bericht: string }[] = [];
          if (findingIds.length > 0) {
            const { data: msgs } = await supabase
              .from("messages")
              .select("finding_id, afzender_id, bericht")
              .in("finding_id", findingIds);
            messages = (msgs ?? []) as any;
          }

          const { data: uitdraai } = await supabase
            .from("project_uitdraai")
            .select("extracted_data, status")
            .eq("project_id", project.id)
            .maybeSingle();
          const uitdraaiData =
            uitdraai?.status === "klaar" && uitdraai.extracted_data
              ? (uitdraai.extracted_data as Record<string, string>)
              : undefined;

          const adv = project.adviseur_id ? advMap.get(project.adviseur_id) : undefined;

          const { html } = buildAuditReportHtml({
            project: project as any,
            findings: (findings ?? []) as any,
            adviseurNaam: adv?.naam,
            adviseurNummer: adv?.nummer ?? undefined,
            adviseurUserId: adv?.user_id ?? undefined,
            messages,
            logoUrl,
            templates,
            uitdraaiData,
          });

          const blob = await renderReportToPdfBlob(html);
          const nrStr = adv?.nummer != null ? String(adv.nummer).padStart(3, "0") : "";
          const cat = (project.audit_categorie ?? "").replace(/-/g, "");
          const parts = [nrStr, adv?.naam ?? "", project.projectnaam, cat]
            .map((s) => (s ?? "").toString().trim())
            .filter(Boolean);
          const filename = `${sanitize(parts.join(" "))}.pdf`;
          zip.file(filename, blob);
        } catch (e: any) {
          console.error("Fout bij", project.projectnaam, e);
          fouten.push(`${project.projectnaam} — ${e?.message ?? "onbekende fout"}`);
        }
      }

      if (fouten.length > 0) {
        zip.file("_fouten.txt", fouten.join("\n"));
      }

      setProgress({ done: projects.length, total: projects.length, current: "ZIP samenstellen…" });
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const stamp = new Date().toISOString().slice(0, 10);
      saveAs(zipBlob, `auditrapporten-${statusFilter}-${stamp}.zip`);

      toast({
        title: `${projects.length - fouten.length} rapport(en) gedownload`,
        description: fouten.length > 0 ? `${fouten.length} project(en) overgeslagen — zie _fouten.txt in de ZIP.` : undefined,
      });
    } catch (e: any) {
      toast({ title: "Bulk-export mislukt", description: e?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <FileDown className="h-4 w-4" />
          Auditrapporten als PDF (bulk)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <p className="text-xs text-muted-foreground">
          Genereert per project een PDF-rapport (zelfde inhoud als de "Download rapport"-knop op de projectpagina)
          en bundelt alles in één ZIP. Dit gebeurt in de browser — houd dit tabblad open tot de download klaar is.
          Reken op circa 1–3 seconden per rapport.
        </p>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)} disabled={busy}>
            <SelectTrigger className="h-8 text-xs w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="afgerond">Alleen afgeronde projecten</SelectItem>
              <SelectItem value="alle">Alle projecten</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={start} disabled={busy} className="h-8 text-xs">
            {busy ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <FileDown className="h-3.5 w-3.5 mr-1" />}
            {busy ? "Bezig…" : "Alle auditrapporten downloaden (ZIP)"}
          </Button>
        </div>
        {busy && progress.total > 0 && (
          <div className="space-y-1">
            <Progress value={pct} className="h-2" />
            <p className="text-xs text-muted-foreground truncate">
              PDF {progress.done} van {progress.total} — {progress.current}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}