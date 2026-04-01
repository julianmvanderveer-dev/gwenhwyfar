import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { addMonths } from "date-fns";
import FindingToelichting from "@/components/FindingToelichting";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { statusBadge, beoordelingBadge, afwijkingBadge } from "@/lib/badges";
import { ArrowLeft, CheckCircle2, ClipboardCheck, ChevronLeft, ChevronRight, Download, Upload, Loader2, FileText } from "lucide-react";
import { generateAuditReport } from "@/lib/generateAuditReport";
import AandachtspuntenAdviseur from "@/components/projecten/AandachtspuntenAdviseur";

type Project = Tables<"projects">;
type Finding = Tables<"findings">;
type Template = { id: string; code: string; onderdeel: string; controlepunt: string; deel: number };

// A merged row: template + optional existing finding
type MergedRow = Template & { finding?: Finding };

type Uitdraai = {
  id: string;
  project_id: string;
  bestandsnaam: string;
  bestand_pad: string | null;
  status: string;
  extracted_data: Record<string, string> | null;
  uploaded_by: string | null;
  created_at: string;
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [ep2Start, setEp2Start] = useState<string>("");
  const [ep2Eind, setEp2Eind] = useState<string>("");
  const [ep2Beoordeling, setEp2Beoordeling] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("");

  // Uitdraai state
  const [uitdraai, setUitdraai] = useState<Uitdraai | null>(null);
  const [uitdraaiUploading, setUitdraaiUploading] = useState(false);
  const [localUitdraaiData, setLocalUitdraaiData] = useState<Record<string, string>>({});
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!id) return;
    loadProject().then((p) => {
      if (p) {
        autoSetStatus(p.status);
        loadTemplates(p.audit_categorie);
      }
    });
    loadFindings();
    loadUitdraai();
  }, [id]);

  useEffect(() => {
    if (project) {
      setEp2Start(project.ep2_startwaarde?.toString() ?? "");
      setEp2Eind(project.ep2_eindwaarde?.toString() ?? "");
      setEp2Beoordeling(project.ep2_beoordeling ?? "");
    }
  }, [project]);

  useEffect(() => {
    if (uitdraai?.extracted_data) {
      setLocalUitdraaiData(uitdraai.extracted_data);
    }
  }, [uitdraai]);

  // Poll for uitdraai status when extracting
  useEffect(() => {
    if (!uitdraai || uitdraai.status !== "extracting") return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("project_uitdraai")
        .select("*")
        .eq("id", uitdraai.id)
        .single();
      if (data && (data as any).status !== "extracting") {
        setUitdraai(data as any);
        clearInterval(interval);
        if ((data as any).status === "klaar") {
          toast({ title: "Uitdraai verwerkt", description: "De AI-extractie is voltooid." });
        } else if ((data as any).status === "fout") {
          toast({ title: "Fout bij extractie", description: "De AI kon het document niet verwerken.", variant: "destructive" });
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [uitdraai?.id, uitdraai?.status]);

  const loadProject = async () => {
    const { data } = await supabase.from("projects").select("*").eq("id", id!).single();
    setProject(data);
    return data;
  };

  const autoSetStatus = async (currentStatus: string) => {
    if (hasRole("tekenaar") && currentStatus === "nog_niet_begonnen") {
      const { data: proj } = await supabase.from("projects").select("toewijzing, toegewezen_aan").eq("id", id!).single();
      if (proj?.toewijzing === "pool" && !proj.toegewezen_aan) {
        const { data: claimed } = await supabase.rpc("claim_project", { _project_id: id!, _user_id: user!.id });
        if (!claimed) {
          toast({ title: "Project niet beschikbaar", description: "Dit project is al door iemand anders opgepakt.", variant: "destructive" });
          navigate("/inbox");
          return;
        }
      }
      await supabase.from("projects").update({ status: "deel1_bezig" as any }).eq("id", id!);
      loadProject();
    } else if (hasRole("auditor") && currentStatus === "deel1_afgerond") {
      const { data: proj } = await supabase.from("projects").select("toewijzing, toegewezen_aan").eq("id", id!).single();
      if (proj?.toewijzing === "pool" && !proj.toegewezen_aan) {
        const { data: claimed } = await supabase.rpc("claim_project", { _project_id: id!, _user_id: user!.id });
        if (!claimed) {
          toast({ title: "Project niet beschikbaar", description: "Dit project is al door iemand anders opgepakt.", variant: "destructive" });
          navigate("/inbox");
          return;
        }
      }
      await supabase.from("projects").update({ status: "deel2_bezig" as any }).eq("id", id!);
      loadProject();
    }
  };

  const loadTemplates = async (categorie: string) => {
    const { data } = await supabase
      .from("checklist_templates")
      .select("id, code, onderdeel, controlepunt, deel")
      .eq("audit_categorie", categorie as any)
      .order("onderdeel")
      .order("code");
    setTemplates((data as Template[]) ?? []);
  };

  const loadFindings = async () => {
    const { data } = await supabase
      .from("findings")
      .select("*")
      .eq("project_id", id!)
      .order("created_at");
    setFindings((data as Finding[]) ?? []);
  };

  const loadUitdraai = async () => {
    const { data } = await supabase
      .from("project_uitdraai")
      .select("*")
      .eq("project_id", id!)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setUitdraai(data as Uitdraai | null);
  };

  const handleUitdraaiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !user) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Ongeldig bestandstype", description: "Upload een PDF of afbeelding (JPG, PNG, WebP).", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Bestand te groot", description: "Maximaal 20MB.", variant: "destructive" });
      return;
    }

    setUitdraaiUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "pdf";
      const storagePath = `${id}/${Date.now()}.${ext}`;

      // Upload to storage
      const { error: uploadErr } = await supabase.storage
        .from("project-documents")
        .upload(storagePath, file);
      if (uploadErr) throw uploadErr;

      // Create record
      const { data: record, error: recErr } = await supabase
        .from("project_uitdraai")
        .insert({
          project_id: id,
          bestandsnaam: file.name,
          bestand_pad: storagePath,
          status: "uploading",
          uploaded_by: user.id,
        } as any)
        .select("*")
        .single();
      if (recErr) throw recErr;

      setUitdraai(record as any);

      // Trigger edge function
      const { error: fnErr } = await supabase.functions.invoke("extract-uitdraai", {
        body: {
          project_id: id,
          bestand_pad: storagePath,
          uitdraai_id: (record as any).id,
        },
      });
      if (fnErr) {
        console.error("Extract function error:", fnErr);
        toast({ title: "Fout bij verwerking", description: "De AI-extractie kon niet worden gestart.", variant: "destructive" });
      } else {
        // Reload to get updated status
        loadUitdraai();
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({ title: "Upload mislukt", description: err.message ?? "Onbekende fout", variant: "destructive" });
    } finally {
      setUitdraaiUploading(false);
      e.target.value = "";
    }
  };

  const handleUitdraaiEdit = useCallback((code: string, value: string) => {
    setLocalUitdraaiData((prev) => ({ ...prev, [code]: value }));

    // Debounce save
    if (debounceTimers.current[code]) clearTimeout(debounceTimers.current[code]);
    debounceTimers.current[code] = setTimeout(async () => {
      if (!uitdraai) return;
      const newData = { ...localUitdraaiData, [code]: value };
      await supabase
        .from("project_uitdraai")
        .update({ extracted_data: newData } as any)
        .eq("id", uitdraai.id);
    }, 800);
  }, [uitdraai, localUitdraaiData]);

  // Create a finding on-the-fly when a user sets a beoordeling on a template row without an existing finding
  const ensureFinding = async (template: Template): Promise<string> => {
    const existing = findings.find(
      (f) => f.onderdeel === template.onderdeel && f.controlepunt === template.controlepunt && f.deel === template.deel
    );
    if (existing) return existing.id;

    const { data, error } = await supabase
      .from("findings")
      .insert({
        project_id: id!,
        onderdeel: template.onderdeel,
        controlepunt: template.controlepunt,
        deel: template.deel,
      })
      .select("id")
      .single();
    if (error) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
      throw error;
    }
    return data!.id;
  };

  const updateBeoordeling = async (findingId: string, beoordeling: Enums<"beoordeling_type">) => {
    const update: any = { beoordeling };
    if (beoordeling === "niet_goed") {
      update.eigenaar_beoordeling = hasRole("tekenaar") ? "tekenaar" : "auditor";
      update.toegewezen_beoordelaar = user!.id;
    } else if (beoordeling === "opmerking") {
      update.eigenaar_beoordeling = hasRole("tekenaar") ? "tekenaar" : "auditor";
      update.toegewezen_beoordelaar = user!.id;
    }
    await supabase.from("findings").update(update).eq("id", findingId);
    loadFindings();
  };

  const handleBeoordeling = async (row: MergedRow, beoordeling: string) => {
    try {
      const fId = row.finding?.id ?? (await ensureFinding(row));
      if (!beoordeling) {
        await supabase.from("findings").update({ beoordeling: null, type_afwijking: null } as any).eq("id", fId);
        loadFindings();
      } else {
        await updateBeoordeling(fId, beoordeling as Enums<"beoordeling_type">);
      }
    } catch {
      // error already toasted
    }
  };

  const updateAfwijkingType = async (findingId: string, type: Enums<"afwijking_type">) => {
    await supabase.from("findings").update({ type_afwijking: type }).eq("id", findingId);
    loadFindings();
  };

  const allesGoedkeuren = async (onderdeel: string) => {
    const onderdeelTemplates = templates.filter((t) => t.onderdeel === onderdeel);
    for (const t of onderdeelTemplates) {
      const existing = findings.find(
        (f) => f.onderdeel === t.onderdeel && f.controlepunt === t.controlepunt && f.deel === t.deel
      );
      if (!existing && canEditTemplate(t)) {
        await ensureFinding(t);
      }
    }
    await loadFindings();
    const { data: currentFindings } = await supabase
      .from("findings")
      .select("id, onderdeel, deel, beoordeling")
      .eq("project_id", id!)
      .eq("onderdeel", onderdeel);
    const ids = (currentFindings ?? [])
      .filter((f) => canEditFindingByDeel(f.deel) && f.beoordeling !== "goed")
      .map((f) => f.id);
    if (ids.length === 0) return;
    await supabase.from("findings").update({ beoordeling: "goed" as any }).in("id", ids);
    toast({ title: "Alles goedgekeurd", description: `${ids.length} post(en) op goed gezet.` });
    loadFindings();
  };

  const deel1Afronden = async () => {
    await supabase.from("projects").update({ status: "deel1_afgerond" as any }).eq("id", id!);
    toast({ title: "Deel 1 afgerond", description: "Status gewijzigd naar 'Deel 1 afgerond'" });
    loadProject();
  };

  const auditAfronden = async () => {
    if (!hasRole("auditor")) {
      toast({ title: "Geen toegang", description: "Alleen een auditor kan de audit afronden.", variant: "destructive" });
      return;
    }
    const now = new Date();
    const nietGoedFindings = findings.filter(f => f.beoordeling === "niet_goed");
    const opmerkingFindings = findings.filter(f => f.beoordeling === "opmerking");
    const deadline3m = addMonths(now, 3).toISOString();

    const nietGoedIds = nietGoedFindings.map(f => f.id);

    await Promise.all([
      nietGoedIds.length > 0 && supabase.from("findings").update({
        deadline: deadline3m,
        zichtbaar_voor_adviseur: true,
        status: "open" as any,
      }).in("id", nietGoedIds),
      opmerkingFindings.length > 0 && supabase.from("findings").update({
        zichtbaar_voor_adviseur: true,
      }).in("id", opmerkingFindings.map(f => f.id)),
    ].filter(Boolean));

    // Punt 1: zet toegewezen_beoordelaar naar auditor voor alle zichtbare findings
    const alleZichtbareIds = [...nietGoedIds, ...opmerkingFindings.map(f => f.id)];
    if (alleZichtbareIds.length > 0) {
      await supabase.from("findings").update({ toegewezen_beoordelaar: user!.id }).in("id", alleZichtbareIds);
    }

    const hasNietGoed = nietGoedFindings.length > 0;

    if (hasNietGoed) {
      await supabase.from("projects").update({
        status: "wacht_op_reactie" as any,
        reactie_deadline: deadline3m,
      }).eq("id", id!);
      toast({ title: "Audit afgerond", description: "Status naar 'Wacht op reactie', deadline berekend" });
    } else {
      await supabase.from("projects").update({
        status: "afgerond" as any,
        gearchiveerd_op: new Date().toISOString(),
      }).eq("id", id!);
      toast({ title: "Audit afgerond", description: "Geen afwijkingen, status naar 'Afgerond'" });
    }

    supabase.functions.invoke("notify-adviseur", {
      body: { type: "audit_afgerond", project_id: id },
    }).then(({ error }) => {
      if (error) console.error("Notificatie fout:", error);
    });

    loadProject();
    loadFindings();
  };

  const saveEp2 = async () => {
    const update: any = {
      ep2_startwaarde: ep2Start ? parseFloat(ep2Start) : null,
      ep2_eindwaarde: ep2Eind ? parseFloat(ep2Eind) : null,
      ep2_beoordeling: ep2Beoordeling || null,
    };
    await supabase.from("projects").update(update).eq("id", id!);
    toast({ title: "EP2 opgeslagen" });
    loadProject();
  };

  if (!project) return <div className="p-6 text-muted-foreground">Laden...</div>;

  // Build merged rows per onderdeel
  const onderdelen = [...new Set(templates.map((t) => t.onderdeel))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
  const allTabs = [...onderdelen, "__ep2__"];

  const canDeel1 = hasRole("tekenaar") && (project.status === "nog_niet_begonnen" || project.status === "deel1_bezig");
  const canDeel2 = hasRole("auditor") && (project.status === "deel1_afgerond" || project.status === "deel2_bezig");

  const canEditFindingByDeel = (deel: number) => {
    if (canDeel1 && deel === 1) return true;
    if (canDeel2) return true;  // auditor mag alles
    return false;
  };

  const canEditFinding = (f: Finding) => canEditFindingByDeel(f.deel);
  const canEditTemplate = (t: Template) => canEditFindingByDeel(t.deel);
  const canEditAny = canDeel1 || canDeel2;

  const getMergedRows = (onderdeel: string): MergedRow[] => {
    const onderdeelTemplates = templates
      .filter((t) => t.onderdeel === onderdeel)
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    return onderdeelTemplates.map((t) => {
      const finding = findings.find(
        (f) => f.onderdeel === t.onderdeel && f.controlepunt === t.controlepunt && f.deel === t.deel
      );
      return { ...t, finding };
    });
  };

  const currentIndex = allTabs.indexOf(activeTab);
  const goTo = (dir: -1 | 1) => {
    const next = allTabs[currentIndex + dir];
    if (next) setActiveTab(next);
  };

  const statusLabel: Record<string, string> = {
    nog_niet_begonnen: "Nog niet begonnen",
    deel1_bezig: "Deel 1 bezig",
    deel1_afgerond: "Deel 1 afgerond",
    deel2_bezig: "Deel 2 bezig",
    afgerond: "Afgerond",
    wacht_op_reactie: "Reactie EP-adviseur gevraagd",
    gesloten: "Gesloten",
  };

  // EP2 berekeningen
  const startVal = parseFloat(ep2Start);
  const eindVal = parseFloat(ep2Eind);
  const afwijkingAbs = !isNaN(startVal) && !isNaN(eindVal) ? eindVal - startVal : null;
  const afwijkingPct = afwijkingAbs !== null && startVal !== 0 ? (afwijkingAbs / startVal) * 100 : null;

  const hasUitdraaiData = uitdraai?.status === "klaar" && uitdraai.extracted_data && Object.keys(uitdraai.extracted_data).length > 0;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <ClipboardCheck className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight truncate">{project.projectnaam}</h1>
          <p className="text-xs text-muted-foreground">
            {project.audit_categorie} · {project.audit_soort}
            {project.toelatingsaudit && " · Toelatingsaudit"}
            {project.prioriteit && " · Prioriteit"}
          </p>
        </div>
        <div className="ml-auto shrink-0 flex items-center gap-2">
          {(hasRole("beheer") || hasRole("ep_adviseur")) &&
            ["afgerond", "gesloten", "wacht_op_reactie"].includes(project.status) && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={async () => {
                  let adviseurNaam: string | undefined;
                  if (project.adviseur_id) {
                    const { data } = await supabase
                      .from("adviseurs")
                      .select("naam")
                      .eq("id", project.adviseur_id)
                      .single();
                    adviseurNaam = data?.naam;
                  }
                  generateAuditReport({
                    project,
                    findings,
                    adviseurNaam,
                    templates,
                    uitdraaiData: hasUitdraaiData ? localUitdraaiData : undefined,
                  });
                }}
              >
                <Download className="h-4 w-4" />
                Download rapport
              </Button>
            )}
          {statusBadge(project.status)}
        </div>
      </div>

      {/* Aandachtspunten adviseur */}
      {project.adviseur_id && (
        <AandachtspuntenAdviseur adviseurId={project.adviseur_id} projectId={project.id} />
      )}

      {/* Uitdraai upload */}
      {canEditAny && (
        <div className="border rounded-lg bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-semibold">Projectuitdraai</h3>
                <p className="text-xs text-muted-foreground">
                  {uitdraai
                    ? uitdraai.status === "klaar"
                      ? `${uitdraai.bestandsnaam} — verwerkt`
                      : uitdraai.status === "extracting"
                      ? "AI leest document uit..."
                      : uitdraai.status === "fout"
                      ? `${uitdraai.bestandsnaam} — fout bij verwerking`
                      : "Bezig met uploaden..."
                    : "Upload een uitdraai om waarden automatisch te laten invullen"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {uitdraai?.status === "extracting" && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              <label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={handleUitdraaiUpload}
                  disabled={uitdraaiUploading || uitdraai?.status === "extracting"}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 cursor-pointer"
                  asChild
                  disabled={uitdraaiUploading || uitdraai?.status === "extracting"}
                >
                  <span>
                    {uitdraaiUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {uitdraai ? "Nieuw bestand" : "Upload"}
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Read-only uitdraai info for EP-adviseur */}
      {!canEditAny && uitdraai?.status === "klaar" && (
        <div className="border rounded-lg bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-semibold">Projectuitdraai</h3>
              <p className="text-xs text-muted-foreground">{uitdraai.bestandsnaam} — verwerkt</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab || onderdelen[0] || "__ep2__"} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          {onderdelen.map((o) => (
            <TabsTrigger key={o} value={o} className="text-xs">{o}</TabsTrigger>
          ))}
          <TabsTrigger value="__ep2__" className="text-xs">EP2 Beoordeling</TabsTrigger>
        </TabsList>

        {onderdelen.map((o) => {
          const rows = getMergedRows(o);
          return (
            <TabsContent key={o} value={o} className="space-y-3">
              {canEditAny && rows.length > 0 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    className="shadow-sm gap-1.5"
                    onClick={() => allesGoedkeuren(o)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Alles goedkeuren
                  </Button>
                </div>
              )}
              <div className="border rounded-lg overflow-hidden shadow-sm bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-secondary/60">
                        <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Code</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Controlepunt</th>
                        {hasUitdraaiData && (
                          <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground min-w-[160px]">Uitdraai</th>
                        )}
                        <th className="text-center px-3 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-16">Deel</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Beoordeling</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => {
                        const f = row.finding;
                        const editable = canEditTemplate(row);
                        const uitdraaiValue = localUitdraaiData[row.code] ?? "";
                        const colSpan = hasUitdraaiData ? 6 : 5;
                        return (
                          <React.Fragment key={row.id}>
                            <tr className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${i % 2 !== 0 ? 'bg-muted/20' : ''}`}>
                              <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{row.code}</td>
                              <td className="px-4 py-2.5 font-medium">{row.controlepunt}</td>
                              {hasUitdraaiData && (
                                <td className="px-3 py-2.5">
                                  {canEditAny ? (
                                    <Input
                                      className="h-7 text-xs bg-muted/30"
                                      value={uitdraaiValue}
                                      onChange={(e) => handleUitdraaiEdit(row.code, e.target.value)}
                                      placeholder="—"
                                    />
                                  ) : (
                                    <span className="text-xs text-muted-foreground">{uitdraaiValue || "—"}</span>
                                  )}
                                </td>
                              )}
                              <td className="px-3 py-2.5 text-center">
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${row.deel === 1 ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
                                  {row.deel}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                {editable ? (
                                  <select
                                    className="border border-input rounded-md px-2 py-1 text-sm bg-background"
                                    value={f?.beoordeling ?? ""}
                                    onChange={(e) => handleBeoordeling(row, e.target.value)}
                                  >
                                    <option value="">—</option>
                                    <option value="goed">Goed</option>
                                    <option value="niet_goed">Niet goed</option>
                                    <option value="opmerking">Opmerking</option>
                                  </select>
                                ) : (
                                  f?.beoordeling ? beoordelingBadge(f.beoordeling) : <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-xs">
                                {f ? statusBadge(f.status) : <span className="text-muted-foreground">—</span>}
                              </td>
                            </tr>
                            {f && ((editable && (f.beoordeling === "niet_goed" || f.beoordeling === "opmerking")) || f.toelichting) && (
                              <tr className="border-b bg-muted/30">
                                <td colSpan={colSpan} className="px-4 pb-2 pt-1">
                                  <FindingToelichting
                                    findingId={f.id}
                                    initialValue={f.toelichting}
                                    editable={editable}
                                  />
                                  {editable && f.beoordeling === "niet_goed" && (
                                    <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs text-muted-foreground">
                                      <Checkbox
                                        checked={f.upload_vereist}
                                        onCheckedChange={async (checked) => {
                                          const { error } = await supabase
                                            .from("findings")
                                            .update({ upload_vereist: !!checked })
                                            .eq("id", f.id);
                                          if (error) {
                                            toast({ title: "Fout", description: "Kon upload-eis niet opslaan", variant: "destructive" });
                                          } else {
                                            setFindings((prev) =>
                                              prev.map((fin) => fin.id === f.id ? { ...fin, upload_vereist: !!checked } : fin)
                                            );
                                          }
                                        }}
                                      />
                                      Upload vereist voor EP-adviseur
                                    </label>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Navigation */}
              <div className="flex justify-between">
                {allTabs.indexOf(o) > 0 ? (
                  <Button variant="outline" size="sm" onClick={() => goTo(-1)} className="gap-1">
                    <ChevronLeft className="h-4 w-4" /> Vorige
                  </Button>
                ) : <div />}
                {allTabs.indexOf(o) < allTabs.length - 1 && (
                  <Button variant="outline" size="sm" onClick={() => goTo(1)} className="gap-1">
                    Volgende <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TabsContent>
          );
        })}

        {/* EP2 Tab */}
        <TabsContent value="__ep2__" className="space-y-4">
          <div className="border rounded-lg shadow-sm bg-card p-6 space-y-5 max-w-lg">
            <h2 className="text-lg font-semibold tracking-tight">EP2 Beoordeling</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium">Startwaarde EP2 (kWh/m²)</label>
              <Input
                type="number"
                step="0.01"
                value={ep2Start}
                onChange={(e) => setEp2Start(e.target.value)}
                disabled={!(canDeel1 || canDeel2)}
                placeholder="bijv. 125.50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Eindwaarde EP2 (kWh/m²)</label>
              <Input
                type="number"
                step="0.01"
                value={ep2Eind}
                onChange={(e) => setEp2Eind(e.target.value)}
                disabled={!canDeel2}
                placeholder="bijv. 130.00"
              />
            </div>

            {afwijkingAbs !== null && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg text-sm">
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Afwijking absoluut</span>
                  <p className="font-semibold mt-0.5">{afwijkingAbs.toFixed(2)} kWh/m²</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Afwijking %</span>
                  <p className="font-semibold mt-0.5">{afwijkingPct !== null ? afwijkingPct.toFixed(1) + "%" : "—"}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Beoordeling</label>
              <select
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={ep2Beoordeling}
                onChange={(e) => setEp2Beoordeling(e.target.value)}
                disabled={!canDeel2}
              >
                <option value="">— Selecteer —</option>
                <option value="goed">GOED</option>
                <option value="niet_goed">NIET GOED</option>
              </select>
            </div>

            {(canDeel1 || canDeel2) && (
              <Button onClick={saveEp2} size="sm" className="shadow-sm">
                EP2 opslaan
              </Button>
            )}
          </div>
          <div className="flex justify-between">
            {currentIndex > 0 ? (
              <Button variant="outline" size="sm" onClick={() => goTo(-1)} className="gap-1">
                <ChevronLeft className="h-4 w-4" /> Vorige
              </Button>
            ) : <div />}
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer actions */}
      {(canDeel1 || canDeel2) && (
        <div className="border rounded-lg bg-card p-4 flex items-center gap-3 shadow-sm">
          {canDeel1 && (
            <Button onClick={deel1Afronden} className="shadow-sm">Deel 1 afronden</Button>
          )}
          {canDeel2 && (
            <Button onClick={auditAfronden} className="shadow-sm">Audit afronden</Button>
          )}
        </div>
      )}
    </div>
  );
}
