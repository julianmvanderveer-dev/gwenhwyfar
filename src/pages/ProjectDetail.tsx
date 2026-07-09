import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { addDays } from "date-fns";
import FindingToelichting from "@/components/FindingToelichting";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { statusBadge, beoordelingBadge } from "@/lib/badges";
import { ArrowLeft, CheckCircle2, ClipboardCheck, ChevronLeft, ChevronRight, Download, Upload, Loader2, FileText, FolderOpen, Pencil, Check, X, Trash2 } from "lucide-react";
import { generateAuditReport } from "@/lib/generateAuditReport";
import AandachtspuntenAdviseur from "@/components/projecten/AandachtspuntenAdviseur";
import BeheerStandVanZaken from "@/components/projecten/BeheerStandVanZaken";
import BatchVersturen from "@/components/projecten/BatchVersturen";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useProjectRole } from "@/hooks/useProjectRole";

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
  const { settings: appSettings } = useAppSettings();
  const [project, setProject] = useState<Project | null>(null);
  const { isAdviseurVanProject } = useProjectRole(id);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [ep2Start, setEp2Start] = useState<string>("");
  const [ep2Eind, setEp2Eind] = useState<string>("");
  const [ep2Beoordeling, setEp2Beoordeling] = useState<string>("");
  const [ep2ManualOverride, setEp2ManualOverride] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");

  // EP2 statuswijziging na afronden
  type Ep2HistoryEntry = {
    id: string;
    oude_status: string | null;
    nieuwe_status: string;
    reden: string;
    changed_by_naam: string | null;
    created_at: string;
  };
  const [ep2History, setEp2History] = useState<Ep2HistoryEntry[]>([]);
  const [ep2DialogOpen, setEp2DialogOpen] = useState(false);
  const [ep2PendingStatus, setEp2PendingStatus] = useState<string>("");
  const [ep2Reden, setEp2Reden] = useState("");
  const [ep2Bezig, setEp2Bezig] = useState(false);

  // Dropbox link inline edit
  const [editingDropbox, setEditingDropbox] = useState(false);
  const [dropboxDraft, setDropboxDraft] = useState("");

  // Beheer: handmatige statuswijziging
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [verwijderOpen, setVerwijderOpen] = useState(false);
  const [verwijderBezig, setVerwijderBezig] = useState(false);
  const [statusBezig, setStatusBezig] = useState(false);

  // Uitdraai state
  const [uitdraai, setUitdraai] = useState<Uitdraai | null>(null);
  const [uitdraaiUploading, setUitdraaiUploading] = useState(false);
  const [localUitdraaiData, setLocalUitdraaiData] = useState<Record<string, string>>({});
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const uitdraaiDataRef = useRef<Record<string, string>>({});
  const pendingUitdraaiSaves = useRef<Record<string, string>>({});

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

  const loadEp2History = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from("ep2_status_history" as any)
      .select("id, oude_status, nieuwe_status, reden, changed_by_naam, created_at")
      .eq("project_id", id)
      .order("created_at", { ascending: false });
    setEp2History(((data as unknown) as Ep2HistoryEntry[]) ?? []);
  }, [id]);

  useEffect(() => {
    void loadEp2History();
  }, [loadEp2History]);

  useEffect(() => {
    if (uitdraai?.extracted_data) {
      setLocalUitdraaiData(uitdraai.extracted_data);
      uitdraaiDataRef.current = uitdraai.extracted_data;
    }
  }, [uitdraai]);

  // Realtime subscription for uitdraai status
  useEffect(() => {
    if (!uitdraai || uitdraai.status !== "extracting") return;

    const channel = supabase
      .channel(`project_uitdraai_${uitdraai.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "project_uitdraai",
          filter: `id=eq.${uitdraai.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated.status !== "extracting") {
            setUitdraai(updated);
            if (updated.status === "klaar") {
              toast({ title: "Uitdraai verwerkt", description: "De AI-extractie is voltooid." });
            } else if (updated.status === "fout") {
              toast({ title: "Fout bij extractie", description: "De AI kon het document niet verwerken.", variant: "destructive" });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [uitdraai?.id, uitdraai?.status]);

  const loadProject = async () => {
    const { data } = await supabase.from("projects").select("*").eq("id", id!).single();
    setProject(data);
    return data;
  };

  const autoSetStatus = async (currentStatus: string) => {
    if ((hasRole("tekenaar") || hasRole("auditor")) && currentStatus === "nog_niet_begonnen") {
      const { data: proj } = await supabase.from("projects").select("toewijzing, toegewezen_aan").eq("id", id!).single();
      if (proj?.toewijzing === "pool" && !proj.toegewezen_aan) {
        if (isAdviseurVanProject) {
          toast({ title: "Je kunt dit project niet oppakken", description: "Je bent zelf EP-adviseur van dit project. Een andere auditor moet het oppakken.", variant: "destructive" });
          navigate("/inbox");
          return;
        }
        const { data: claimed } = await supabase.rpc("claim_project", { _project_id: id!, _user_id: user!.id });
        if (!claimed) {
          toast({ title: "Project niet beschikbaar", description: "Dit project is al door iemand anders opgepakt of je bent zelf EP-adviseur van dit project.", variant: "destructive" });
          navigate("/inbox");
          return;
        }
      }
      await supabase.from("projects").update({ status: "deel1_bezig" as any }).eq("id", id!);
      loadProject();
    } else if (hasRole("auditor") && currentStatus === "deel1_afgerond") {
      const { data: proj } = await supabase.from("projects").select("toewijzing, toegewezen_aan").eq("id", id!).single();
      if (proj?.toewijzing === "pool" && !proj.toegewezen_aan) {
        if (isAdviseurVanProject) {
          toast({ title: "Je kunt dit project niet oppakken", description: "Je bent zelf EP-adviseur van dit project. Een andere auditor moet het oppakken.", variant: "destructive" });
          navigate("/inbox");
          return;
        }
        const { data: claimed } = await supabase.rpc("claim_project", { _project_id: id!, _user_id: user!.id });
        if (!claimed) {
          toast({ title: "Project niet beschikbaar", description: "Dit project is al door iemand anders opgepakt of je bent zelf EP-adviseur van dit project.", variant: "destructive" });
          navigate("/inbox");
          return;
        }
      }
      await supabase.from("projects").update({ status: "deel2_bezig" as any }).eq("id", id!);
      loadProject();
    }
    else if (hasRole("auditor") && (currentStatus === "wacht_op_reactie" || currentStatus === "deel2_bezig")) {
      const { data: proj } = await supabase.from("projects").select("toewijzing, toegewezen_aan").eq("id", id!).single();
      if (proj?.toewijzing === "pool" && !proj.toegewezen_aan) {
        if (isAdviseurVanProject) {
          toast({ title: "Je kunt dit project niet oppakken", description: "Je bent zelf EP-adviseur van dit project. Een andere auditor moet het oppakken.", variant: "destructive" });
          navigate("/inbox");
          return;
        }
        const { data: claimed } = await supabase.rpc("claim_project", { _project_id: id!, _user_id: user!.id });
        if (!claimed) {
          toast({ title: "Project niet beschikbaar", description: "Dit project is al door iemand anders opgepakt of je bent zelf EP-adviseur van dit project.", variant: "destructive" });
          navigate("/inbox");
          return;
        }
        loadProject();
      }
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

  const flushUitdraaiSave = useCallback(async () => {
    if (!uitdraai) return;
    // Cancel any pending timers; we save the latest snapshot now.
    Object.values(debounceTimers.current).forEach((t) => clearTimeout(t));
    debounceTimers.current = {};
    if (Object.keys(pendingUitdraaiSaves.current).length === 0) return;
    pendingUitdraaiSaves.current = {};
    await supabase
      .from("project_uitdraai")
      .update({ extracted_data: uitdraaiDataRef.current } as any)
      .eq("id", uitdraai.id);
  }, [uitdraai]);

  const handleUitdraaiEdit = useCallback((code: string, value: string) => {
    // Always update the ref synchronously so saves never use a stale snapshot.
    uitdraaiDataRef.current = { ...uitdraaiDataRef.current, [code]: value };
    pendingUitdraaiSaves.current[code] = value;
    setLocalUitdraaiData(uitdraaiDataRef.current);

    if (debounceTimers.current[code]) clearTimeout(debounceTimers.current[code]);
    debounceTimers.current[code] = setTimeout(() => {
      delete debounceTimers.current[code];
      void flushUitdraaiSave();
    }, 500);
  }, [flushUitdraaiSave]);

  // Flush pending uitdraai writes when leaving the page.
  useEffect(() => {
    return () => {
      void flushUitdraaiSave();
    };
  }, [flushUitdraaiSave]);

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
    // Bepaal eigenaar o.b.v. huidige projectfase, zodat een gebruiker met
    // beide rollen correct gelabeld wordt afhankelijk van deel 1 of deel 2.
    const isDeel2Fase = project?.status === "deel1_afgerond" || project?.status === "deel2_bezig";
    const eigenaarLabel = isDeel2Fase && hasRole("auditor") ? "auditor" : (hasRole("tekenaar") ? "tekenaar" : "auditor");
    if (beoordeling === "niet_goed") {
      update.eigenaar_beoordeling = eigenaarLabel;
      update.toegewezen_beoordelaar = user!.id;
    } else if (beoordeling === "opmerking") {
      update.eigenaar_beoordeling = eigenaarLabel;
      update.toegewezen_beoordelaar = user!.id;
    }
    // Status afleiden: 'goed' sluit het controlepunt af, andere beoordelingen
    // zetten het terug op 'open'. Alleen toepassen als het controlepunt nog
    // niet in de adviseur-cyclus zit (zichtbaar_voor_adviseur = false).
    const huidig = findings.find((f) => f.id === findingId);
    if (!huidig || !huidig.zichtbaar_voor_adviseur) {
      if (beoordeling === "goed") {
        update.status = "gesloten";
      } else if (beoordeling !== "nvt") {
        update.status = "open";
      }
    }
    await supabase.from("findings").update(update).eq("id", findingId);
    loadFindings();
  };

  // Plaats systeembericht in de berichtenhistorie bij een correctie van een
  // al-verstuurde bevinding zodat de EP-adviseur en de audit-trail dit zien.
  const logCorrectie = async (findingId: string, beschrijving: string) => {
    if (!user) return;
    const isDeel2Fase = project?.status === "deel1_afgerond" || project?.status === "deel2_bezig";
    const rolLabel = isDeel2Fase && hasRole("auditor") ? "auditor" : (hasRole("tekenaar") ? "tekenaar" : "auditor");
    await supabase.from("messages").insert({
      finding_id: findingId,
      afzender_id: user.id,
      bericht: `[Correctie door ${rolLabel}] ${beschrijving}`,
    } as any);
  };

  const handleBeoordeling = async (row: MergedRow, beoordeling: string) => {
    try {
      const fId = row.finding?.id ?? (await ensureFinding(row));
      const wasCorrectie = !!row.finding && row.finding.zichtbaar_voor_adviseur && row.finding.status === "open";
      const oudeBeoordeling = row.finding?.beoordeling ?? null;
      if (!beoordeling) {
        const huidig = row.finding;
        const wisUpdate: any = { beoordeling: null, type_afwijking: null };
        if (huidig && !huidig.zichtbaar_voor_adviseur) {
          wisUpdate.status = "open";
        }
        await supabase.from("findings").update(wisUpdate).eq("id", fId);
        loadFindings();
      } else {
        await updateBeoordeling(fId, beoordeling as Enums<"beoordeling_type">);
      }
      if (wasCorrectie && oudeBeoordeling !== (beoordeling || null)) {
        const labels: Record<string, string> = { goed: "Goed", niet_goed: "Niet goed", opmerking: "Opmerking", nvt: "N.V.T." };
        const oud = oudeBeoordeling ? (labels[oudeBeoordeling] ?? oudeBeoordeling) : "—";
        const nieuw = beoordeling ? (labels[beoordeling] ?? beoordeling) : "—";
        await logCorrectie(fId, `Beoordeling gewijzigd van "${oud}" naar "${nieuw}".`);
      }
    } catch {
      // error already toasted
    }
  };

  const updateAfwijkingType = async (findingId: string, type: Enums<"afwijking_type">) => {
    const huidig = findings.find((f) => f.id === findingId);
    const wasCorrectie = !!huidig && huidig.zichtbaar_voor_adviseur && huidig.status === "open";
    const oud = huidig?.type_afwijking ?? null;
    await supabase.from("findings").update({ type_afwijking: type }).eq("id", findingId);
    if (wasCorrectie && oud !== type) {
      const labels: Record<string, string> = { kritiek: "Kritiek", niet_kritiek: "Niet kritiek" };
      await logCorrectie(findingId, `Type afwijking gewijzigd van "${oud ? (labels[oud] ?? oud) : "—"}" naar "${labels[type] ?? type}".`);
    }
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
      .select("id, onderdeel, deel, beoordeling, zichtbaar_voor_adviseur")
      .eq("project_id", id!)
      .eq("onderdeel", onderdeel);
    const eligible = (currentFindings ?? []).filter(
      (f) => canEditFindingByDeel(f.deel) && f.beoordeling !== "goed" && f.beoordeling !== "nvt",
    );
    if (eligible.length === 0) return;
    // Niet-zichtbare bevindingen mogen direct op 'gesloten'; bevindingen die al
    // naar de adviseur zijn gegaan houden hun bestaande status.
    const idsAfsluiten = eligible
      .filter((f) => !(f as any).zichtbaar_voor_adviseur)
      .map((f) => f.id);
    const idsAlleenBeoordeling = eligible
      .filter((f) => (f as any).zichtbaar_voor_adviseur)
      .map((f) => f.id);
    if (idsAfsluiten.length > 0) {
      await supabase
        .from("findings")
        .update({ beoordeling: "goed" as any, status: "gesloten" as any })
        .in("id", idsAfsluiten);
    }
    if (idsAlleenBeoordeling.length > 0) {
      await supabase
        .from("findings")
        .update({ beoordeling: "goed" as any })
        .in("id", idsAlleenBeoordeling);
    }
    toast({ title: "Alles goedgekeurd", description: `${eligible.length} post(en) op goed gezet.` });
    loadFindings();
  };

  const deel1Afronden = async () => {
    await supabase.from("projects").update({
      status: "deel1_afgerond" as any,
      toegewezen_aan: null,
      toegewezen_op: null,
      toewijzing: "pool",
    }).eq("id", id!);
    toast({ title: "Deel 1 afgerond", description: "Project is vrijgegeven naar de auditor-pool" });
    loadProject();
  };

  const auditAfronden = async () => {
    if (!hasRole("auditor") || isAdviseurVanProject) {
      toast({ title: "Geen toegang", description: "Alleen een auditor kan de audit afronden.", variant: "destructive" });
      return;
    }
    if (!project?.adviseur_id) {
      toast({ title: "Geen EP-adviseur", description: "Aan deze audit is geen EP-adviseur gekoppeld. Vul deze eerst in.", variant: "destructive" });
      return;
    }
    const { data: adv } = await supabase
      .from("adviseurs")
      .select("email")
      .eq("id", project.adviseur_id)
      .maybeSingle();
    if (!adv?.email) {
      toast({ title: "EP-adviseur heeft geen e-mailadres", description: "Vul eerst een e-mailadres in bij Beheer → Adviseurs voordat je de audit afrondt.", variant: "destructive" });
      return;
    }
    const now = new Date();
    const nietGoedFindings = findings.filter(f => f.beoordeling === "niet_goed");
    const opmerkingFindings = findings.filter(f => f.beoordeling === "opmerking");
    const reactieDeadline = addDays(now, 14).toISOString();

    const nietGoedIds = nietGoedFindings.map(f => f.id);

    await Promise.all([
      nietGoedIds.length > 0 && supabase.from("findings").update({
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
        reactie_deadline: reactieDeadline,
        reminder_pre_sent: false,
        reminder_overdue_1w_sent: false,
        reminder_overdue_2w_sent: false,
        reminder_overdue_3w_sent: false,
      }).eq("id", id!);
      toast({ title: "Audit afgerond", description: "Status naar 'Wacht op reactie'. Reactietermijn: 2 weken." });
    } else {
      await supabase.from("projects").update({
        status: "afgerond" as any,
        gearchiveerd_op: new Date().toISOString(),
      }).eq("id", id!);
      toast({ title: "Audit afgerond", description: "Geen afwijkingen, status naar 'Afgerond'" });
    }

    supabase.functions.invoke("notify-adviseur", {
      body: {
        type: hasNietGoed ? "audit_afgerond" : "audit_volledig_afgerond",
        project_id: id,
      },
    }).then(({ error }) => {
      if (error) console.error("Notificatie fout:", error);
    });

    loadProject();
    loadFindings();
  };

  const saveEp2Field = useCallback(
    async (field: "ep2_startwaarde" | "ep2_eindwaarde" | "ep2_beoordeling", value: string) => {
      if (!id) return;
      const update: any = {};
      if (field === "ep2_beoordeling") {
        update.ep2_beoordeling = value || null;
      } else {
        update[field] = value ? parseFloat(value) : null;
      }
      await supabase.from("projects").update(update).eq("id", id);
    },
    [id]
  );

  // EP2 berekeningen
  const startVal = parseFloat(ep2Start);
  const eindVal = parseFloat(ep2Eind);
  const afwijkingAbs = !isNaN(startVal) && !isNaN(eindVal) ? eindVal - startVal : null;
  const afwijkingPct = afwijkingAbs !== null && startVal !== 0 ? (afwijkingAbs / startVal) * 100 : null;

  // Auto EP2-beoordeling berekening
  const autoEp2 = useMemo(() => {
    const nietGoedCount = findings.filter((f) => f.beoordeling === "niet_goed").length;
    const nietGoedRelevantCount = findings.filter(
      (f) => f.beoordeling === "niet_goed" && !(f as any).afwijking_kleiner_1pct
    ).length;
    const alleGoed = findings.length === 0 || findings.every(
      (f) => f.beoordeling === "goed" || f.beoordeling === "opmerking" || !f.beoordeling
    );

    let result = "goed";

    // KT-criteria
    if (afwijkingAbs !== null && eindVal > 125 && afwijkingPct !== null && Math.abs(afwijkingPct) > 8) {
      result = "kt";
    } else if (afwijkingAbs !== null && eindVal <= 125 && Math.abs(afwijkingAbs) > 10) {
      result = "kt";
    }
    if (nietGoedRelevantCount > 4) {
      result = "kt";
    } else if (!alleGoed && result !== "kt") {
      result = "nkt";
    }

    return result;
  }, [findings, afwijkingAbs, afwijkingPct, eindVal]);

  const autoEp2Reden = useMemo(() => {
    const nietGoedCount = findings.filter((f) => f.beoordeling === "niet_goed").length;
    const nietGoedRelevantCount = findings.filter(
      (f) => f.beoordeling === "niet_goed" && !(f as any).afwijking_kleiner_1pct
    ).length;
    if (autoEp2 === "kt") {
      const reasons: string[] = [];
      if (afwijkingAbs !== null && eindVal > 125 && afwijkingPct !== null && Math.abs(afwijkingPct) > 8) {
        reasons.push(`afwijking ${Math.abs(afwijkingPct).toFixed(1)}% bij EP2 > 125`);
      }
      if (afwijkingAbs !== null && eindVal <= 125 && Math.abs(afwijkingAbs) > 10) {
        reasons.push(`afwijking ${Math.abs(afwijkingAbs).toFixed(1)} kWh/m² bij EP2 ≤ 125`);
      }
      if (nietGoedRelevantCount > 4) {
        reasons.push(`${nietGoedRelevantCount} afwijkingen ≥ 1% (> 4)`);
      }
      return `Automatisch: KT — ${reasons.join("; ")}`;
    }
    if (autoEp2 === "nkt") {
      return `Automatisch: NKT — ${nietGoedCount} fout(en)`;
    }
    return "Automatisch: GOED — geen afwijkingen";
  }, [autoEp2, findings, afwijkingAbs, afwijkingPct, eindVal]);

  // Auto-fill EP2 beoordeling tenzij handmatig overschreven
  useEffect(() => {
    // Zodra project afgerond/gesloten is, nooit meer overschrijven met auto-berekening.
    if (project && (project.status === "afgerond" || project.status === "gesloten")) return;
    if (!ep2ManualOverride) {
      setEp2Beoordeling((prev) => {
        if (prev !== autoEp2 && project) {
          void saveEp2Field("ep2_beoordeling", autoEp2);
        }
        return autoEp2;
      });
    }
  }, [autoEp2, ep2ManualOverride, project, saveEp2Field]);

  if (!project) return <div className="p-6 text-muted-foreground">Laden...</div>;

  // Build merged rows per onderdeel
  const tabNum = (s: string) => {
    const m = s.match(/\d+/);
    return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER;
  };
  // Sort tabs numerically by the leading number in the code (e.g. 1a, 1b, 2a, ..., 10a),
  // grouping same base number together. Fall back to onderdeel-based ordering.
  const minCodeByOnderdeel = new Map<string, string>();
  for (const t of templates) {
    const cur = minCodeByOnderdeel.get(t.onderdeel);
    if (cur === undefined || t.code.localeCompare(cur, undefined, { numeric: true }) < 0) {
      minCodeByOnderdeel.set(t.onderdeel, t.code);
    }
  }
  const onderdelen = [...new Set(templates.map((t) => t.onderdeel))].sort((a, b) => {
    const ca = minCodeByOnderdeel.get(a) ?? a;
    const cb = minCodeByOnderdeel.get(b) ?? b;
    const na = tabNum(ca);
    const nb = tabNum(cb);
    if (na !== nb) return na - nb;
    return ca.localeCompare(cb, undefined, { numeric: true });
  });
  const allTabs = [...onderdelen, "__ep2__"];

  // Functiescheiding: ben je EP-adviseur van dit project, dan kun je geen
  // tekenaar-/auditor-bewerkingen uitvoeren op dit project.
  const canDeel2 = hasRole("auditor") && !isAdviseurVanProject && (project.status === "deel1_afgerond" || project.status === "deel2_bezig");
  const canDeel1 = (hasRole("tekenaar") || hasRole("auditor")) && !isAdviseurVanProject &&
    (project.status === "nog_niet_begonnen" || project.status === "deel1_bezig" || project.status === "deel1_afgerond");

  // Na afronden mag de auditor de EP2-status nog corrigeren (met verplichte reden + audit-trail).
  const isProjectAfgerond = project.status === "afgerond" || project.status === "gesloten" || project.status === "wacht_op_reactie";
  const canEditEp2Post = hasRole("auditor") && !isAdviseurVanProject && isProjectAfgerond;

  const handleEp2Change = (newValue: string) => {
    if (canEditEp2Post) {
      // Na afronden: dialog met verplichte reden.
      setEp2PendingStatus(newValue);
      setEp2Reden("");
      setEp2DialogOpen(true);
      return;
    }
    // Tijdens deel 2: direct opslaan zoals voorheen.
    setEp2Beoordeling(newValue);
    setEp2ManualOverride(true);
    void saveEp2Field("ep2_beoordeling", newValue);
  };

  const bevestigEp2Wijziging = async () => {
    if (!id || !user || !ep2PendingStatus) return;
    if (ep2Reden.trim().length < 5) {
      toast({ title: "Toelichting vereist", description: "Geef minimaal 5 tekens toelichting.", variant: "destructive" });
      return;
    }
    setEp2Bezig(true);
    const oldValue = ep2Beoordeling || project.ep2_beoordeling || null;
    const { error: updErr } = await supabase
      .from("projects")
      .update({ ep2_beoordeling: ep2PendingStatus })
      .eq("id", id);
    if (updErr) {
      toast({ title: "Opslaan mislukt", description: updErr.message, variant: "destructive" });
      setEp2Bezig(false);
      return;
    }
    const { data: prof } = await supabase.from("profiles").select("naam").eq("id", user.id).maybeSingle();
    const { error: histErr } = await supabase.from("ep2_status_history" as any).insert({
      project_id: id,
      changed_by: user.id,
      changed_by_naam: prof?.naam ?? null,
      oude_status: oldValue,
      nieuwe_status: ep2PendingStatus,
      reden: ep2Reden.trim(),
    } as any);
    if (histErr) {
      toast({ title: "Audit-trail opslaan mislukt", description: histErr.message, variant: "destructive" });
      setEp2Bezig(false);
      return;
    }
    setEp2Beoordeling(ep2PendingStatus);
    setEp2ManualOverride(true);
    setEp2DialogOpen(false);
    setEp2Bezig(false);
    setEp2PendingStatus("");
    setEp2Reden("");
    await loadProject();
    await loadEp2History();
    toast({ title: "EP2-status bijgewerkt", description: "Wijziging en toelichting zijn vastgelegd." });
  };

  const canEditFindingByDeel = (deel: number) => {
    if (canDeel1 && deel === 1) return true;
    if (canDeel2) return true;
    return false;
  };

  // Correctiemodus: zolang adviseur nog niet heeft gereageerd mogen tekenaar (deel 1)
  // of auditor (deel 2) een al-verstuurde bevinding nog corrigeren.
  const canCorrectFinding = (f: Finding) => {
    if (!f.zichtbaar_voor_adviseur) return false;
    if (f.status !== "open") return false;
    if (f.deel === 1 && (hasRole("tekenaar") || hasRole("auditor"))) return true;
    if (f.deel === 2 && hasRole("auditor")) return true;
    return false;
  };

  const canEditFinding = (f: Finding) => canEditFindingByDeel(f.deel) || canCorrectFinding(f);
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

  const beheerStatusOpties = [
    "nog_niet_begonnen",
    "deel1_bezig",
    "deel1_afgerond",
    "deel2_bezig",
    "wacht_op_reactie",
    "afgerond",
    "gesloten",
  ] as const;

  const wijzigStatus = async (nieuw: string) => {
    if (!project) return;
    setStatusBezig(true);
    const oud = project.status;
    const patch: Record<string, any> = { status: nieuw };
    if ((oud === "afgerond" || oud === "gesloten") && nieuw !== "afgerond" && nieuw !== "gesloten") {
      patch.gearchiveerd_op = null;
    }
    const { error } = await supabase.from("projects").update(patch as any).eq("id", project.id);
    if (error) {
      toast({ title: "Statuswijziging mislukt", description: error.message, variant: "destructive" });
      setStatusBezig(false);
      setPendingStatus(null);
      return;
    }
    if (project.toegewezen_aan && project.toegewezen_aan !== user?.id) {
      await supabase.from("notificaties").insert({
        user_id: project.toegewezen_aan,
        bericht: `Status van project "${project.projectnaam}" is door beheer gewijzigd van "${statusLabel[oud] ?? oud}" naar "${statusLabel[nieuw] ?? nieuw}".`,
      });
    }
    toast({ title: "Status gewijzigd", description: `${statusLabel[oud] ?? oud} → ${statusLabel[nieuw] ?? nieuw}` });
    setStatusBezig(false);
    setPendingStatus(null);
    loadProject();
  };

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
            {(project as any).is_omgevingsvergunning && (
              <>
                {" · "}
                <span className="inline-flex items-center rounded-full bg-accent/15 text-accent px-1.5 py-0.5 text-[10px] font-semibold align-middle">
                  Omgevingsvergunning
                </span>
              </>
            )}
            {isAdviseurVanProject && (
              <>
                {" · "}
                <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 text-[10px] font-semibold align-middle" title="Functiescheiding: je kunt op dit project geen auditor-acties uitvoeren">
                  Jouw rol: EP-adviseur
                </span>
              </>
            )}
          </p>
          {/* Dropbox-link dossier */}
          <div className="mt-1 flex items-center gap-2 text-xs">
            {editingDropbox && (hasRole("beheer") || hasRole("tekenaar") || hasRole("auditor")) ? (
              <>
                <input
                  type="url"
                  autoFocus
                  placeholder="https://www.dropbox.com/..."
                  value={dropboxDraft}
                  onChange={(e) => setDropboxDraft(e.target.value)}
                  className="flex h-7 w-72 rounded-md border border-input bg-background px-2 py-1 text-xs"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={async () => {
                    const value = dropboxDraft.trim() || null;
                    await supabase.from("projects").update({ dropbox_link: value } as any).eq("id", id!);
                    setProject({ ...(project as any), dropbox_link: value } as any);
                    setEditingDropbox(false);
                  }}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => setEditingDropbox(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (project as any).dropbox_link ? (
              <>
                <a
                  href={(project as any).dropbox_link}
                  target="_top"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  Dossier op Dropbox
                </a>
                {(hasRole("beheer") || hasRole("tekenaar") || hasRole("auditor")) && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => {
                      setDropboxDraft((project as any).dropbox_link ?? "");
                      setEditingDropbox(true);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </>
            ) : (
              (hasRole("beheer") || hasRole("tekenaar") || hasRole("auditor")) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-muted-foreground"
                  onClick={() => {
                    setDropboxDraft("");
                    setEditingDropbox(true);
                  }}
                >
                  <FolderOpen className="h-3.5 w-3.5 mr-1" />
                  Dropbox-link toevoegen
                </Button>
              )
            )}
          </div>
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
                  let adviseurNummer: number | undefined;
                  let adviseurUserId: string | undefined;
                  if (project.adviseur_id) {
                    const { data } = await supabase
                      .from("adviseurs")
                      .select("naam, nummer, user_id")
                      .eq("id", project.adviseur_id)
                      .maybeSingle();
                    adviseurNaam = data?.naam;
                    adviseurNummer = data?.nummer ?? undefined;
                    adviseurUserId = data?.user_id ?? undefined;
                  }
                  const findingIds = findings.map((f) => f.id);
                  let messages: { finding_id: string; afzender_id: string; bericht: string }[] = [];
                  if (findingIds.length > 0) {
                    const { data: msgs } = await supabase
                      .from("messages")
                      .select("finding_id, afzender_id, bericht")
                      .in("finding_id", findingIds);
                    messages = msgs ?? [];
                  }
                  generateAuditReport({
                    project,
                    findings,
                    adviseurNaam,
                    adviseurNummer,
                    adviseurUserId,
                    messages,
                    logoUrl: appSettings.org_logo_url || undefined,
                    templates,
                    uitdraaiData: hasUitdraaiData ? localUitdraaiData : undefined,
                    ep2History,
                  });
                }}
              >
                <Download className="h-4 w-4" />
                Download rapport
              </Button>
            )}
          {statusBadge(project.status)}
          {hasRole("beheer") && (
            <Select
              value={project.status}
              onValueChange={(v) => {
                if (v !== project.status) setPendingStatus(v);
              }}
            >
              <SelectTrigger className="h-8 w-[210px] text-xs" title="Statuswijziging — gebruik met beleid">
                <SelectValue placeholder="Wijzig status" />
              </SelectTrigger>
              <SelectContent>
                {beheerStatusOpties.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {statusLabel[s] ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {(hasRole("beheer") || hasRole("auditor") || hasRole("tekenaar")) && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setVerwijderOpen(true)}
              title="Project volledig verwijderen"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Verwijderen
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={verwijderOpen} onOpenChange={(o) => { if (!o && !verwijderBezig) setVerwijderOpen(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Project volledig verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je <strong>"{project.projectnaam}"</strong> volledig wilt verwijderen?
              <br />
              Alle bevindingen, reacties, uitdraai en rapportages worden definitief verwijderd. Deze actie kan niet ongedaan gemaakt worden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={verwijderBezig}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              disabled={verwijderBezig}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault();
                setVerwijderBezig(true);
                const { error } = await supabase.from("projects").delete().eq("id", project.id);
                setVerwijderBezig(false);
                if (error) {
                  toast({ title: "Verwijderen mislukt", description: error.message, variant: "destructive" });
                  return;
                }
                setVerwijderOpen(false);
                toast({ title: "Project verwijderd" });
                navigate("/inbox");
              }}
            >
              {verwijderBezig ? "Bezig…" : "Definitief verwijderen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pendingStatus} onOpenChange={(o) => { if (!o && !statusBezig) setPendingStatus(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Projectstatus wijzigen?</AlertDialogTitle>
            <AlertDialogDescription>
              Je wijzigt de fase van <strong>{statusLabel[project.status] ?? project.status}</strong> naar{" "}
              <strong>{pendingStatus ? (statusLabel[pendingStatus] ?? pendingStatus) : ""}</strong>.
              <br />
              Dit verandert alleen de fase — niet de toewijzing of bevindingen. Gebruik met beleid.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusBezig}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              disabled={statusBezig}
              onClick={(e) => {
                e.preventDefault();
                if (pendingStatus) wijzigStatus(pendingStatus);
              }}
            >
              {statusBezig ? "Bezig…" : "Wijzigen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Aandachtspunten adviseur */}
      {project.adviseur_id && (hasRole("beheer") || hasRole("tekenaar") || hasRole("auditor")) && (
        <AandachtspuntenAdviseur adviseurId={project.adviseur_id} projectId={project.id} />
      )}

      {/* Stand van zaken (alleen beheer) */}
      {hasRole("beheer") && (
        <BeheerStandVanZaken project={project} findings={findings} />
      )}

      {/* Batch versturen reacties / beoordelingen */}
      <BatchVersturen
        project={project}
        findings={findings}
        onSent={() => {
          loadProject();
          loadFindings();
        }}
      />

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
      <Tabs
        value={activeTab || onderdelen[0] || "__ep2__"}
        onValueChange={(v) => {
          // Flush pending auto-saves before switching tabs so nothing is lost.
          void flushUitdraaiSave();
          setActiveTab(v);
        }}
      >
        <TabsList className="flex-wrap h-auto gap-1">
          {onderdelen.map((o) => {
            const nietGoed = findings.filter(
              (f) => f.onderdeel === o && f.beoordeling === "niet_goed"
            );
            const klein = nietGoed.filter((f) => (f as any).afwijking_kleiner_1pct).length;
            const groot = nietGoed.length - klein;
            const heeftFouten = nietGoed.length > 0;
            return (
              <TabsTrigger
                key={o}
                value={o}
                className={
                  "text-xs gap-1.5 border data-[state=active]:shadow-sm " +
                  (heeftFouten
                    ? "bg-destructive/10 text-destructive border-destructive/30 data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
                    : "bg-accent/10 text-accent border-accent/30 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground")
                }
              >
                <span>{o}</span>
                {heeftFouten && (
                  <span
                    className="inline-flex items-center rounded-full bg-background/80 text-foreground px-1.5 py-0.5 text-[10px] font-semibold leading-none"
                    title={`Afwijkingen <1% / ≥1%`}
                  >
                    {klein}/{groot}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
          <TabsTrigger value="__ep2__" className="text-xs">EP2 Beoordeling</TabsTrigger>
        </TabsList>

        {onderdelen.map((o) => {
          const rows = getMergedRows(o);
          const adviseurHeeftActie =
            hasRole("ep_adviseur") &&
            rows.some((r) => r.finding?.zichtbaar_voor_adviseur && r.finding?.status === "open");
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
              {adviseurHeeftActie && (
                <div className="border border-accent/40 bg-accent/10 text-sm text-foreground rounded-md px-3 py-2">
                  Klik op <span className="font-semibold text-accent">Reageren</span> bij een bevinding om uw reactie in te vullen.
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
                        const inCorrectie = !!f && canCorrectFinding(f);
                        const editableNow = editable || inCorrectie;
                        const uitdraaiValue = localUitdraaiData[row.code] ?? "";
                        const colSpan = hasUitdraaiData ? 6 : 5;
                        return (
                          <React.Fragment key={row.id}>
                            <tr className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${i % 2 !== 0 ? 'bg-muted/20' : ''} ${hasRole("ep_adviseur") && f?.zichtbaar_voor_adviseur && f?.status === "open" ? 'ring-1 ring-inset ring-accent/40 bg-accent/5' : ''}`}>
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
                                {editableNow ? (
                                  <select
                                    className="border border-input rounded-md px-2 py-1 text-sm bg-background"
                                    value={f?.beoordeling ?? ""}
                                    onChange={(e) => handleBeoordeling(row, e.target.value)}
                                  >
                                    <option value="">—</option>
                                    <option value="goed">Goed</option>
                                    <option value="niet_goed">Niet goed</option>
                                    <option value="opmerking">Opmerking</option>
                                    <option value="nvt">N.V.T.</option>
                                  </select>
                                ) : (
                                  f?.beoordeling ? beoordelingBadge(f.beoordeling) : <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-xs">
                                <div className="flex items-center gap-1.5">
                                  {f ? statusBadge(f.status) : <span className="text-muted-foreground">—</span>}
                                  {hasRole("ep_adviseur") && f?.zichtbaar_voor_adviseur && f?.status === "open" && (
                                    <Link
                                      to={`/finding/${f.id}/reactie`}
                                      className="inline-flex items-center rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-2 py-0.5 text-[10px] font-semibold shadow-sm"
                                    >
                                      {(f as any).concept_reactie ? "Wijzigen" : "Reageren"}
                                    </Link>
                                  )}
                                  {f && (f as any).concept_reactie && (
                                    <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-1.5 py-0.5 text-[10px] font-semibold" title="Concept-reactie EP-adviseur opgeslagen, nog niet verstuurd.">
                                      Concept reactie
                                    </span>
                                  )}
                                  {f && (f as any).concept_beoordeling && (
                                    <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[10px] font-semibold" title="Concept-beoordeling auditor opgeslagen, nog niet verstuurd.">
                                      Concept beoordeling
                                    </span>
                                  )}
                                  {inCorrectie && (
                                    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[10px] font-semibold" title="Bevinding is al naar EP-adviseur verstuurd. Correcties worden gelogd.">
                                      Correctie
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {f && ((editableNow && (f.beoordeling === "niet_goed" || f.beoordeling === "opmerking")) || f.toelichting) && (
                              <tr className="border-b bg-muted/30">
                                <td colSpan={colSpan} className="px-4 pb-2 pt-1">
                                  <FindingToelichting
                                    findingId={f.id}
                                    initialValue={f.toelichting}
                                    editable={editableNow}
                                    logCorrectie={inCorrectie}
                                  />
                                  {editableNow && f.beoordeling === "niet_goed" && (
                                    <div className="flex flex-wrap items-center gap-4 mt-2">
                                      <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
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
                                              if (inCorrectie) {
                                                await logCorrectie(f.id, `Upload-vereist gewijzigd naar "${checked ? "ja" : "nee"}".`);
                                              }
                                            }
                                          }}
                                        />
                                        Upload vereist voor EP-adviseur
                                      </label>
                                      <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
                                        <Checkbox
                                          checked={(f as any).afwijking_kleiner_1pct ?? false}
                                          onCheckedChange={async (checked) => {
                                            const { error } = await supabase
                                              .from("findings")
                                              .update({ afwijking_kleiner_1pct: !!checked } as any)
                                              .eq("id", f.id);
                                            if (error) {
                                              toast({ title: "Fout", description: "Kon drempelwaarde niet opslaan", variant: "destructive" });
                                            } else {
                                              setFindings((prev) =>
                                                prev.map((fin) => fin.id === f.id ? { ...fin, afwijking_kleiner_1pct: !!checked } as any : fin)
                                              );
                                              if (inCorrectie) {
                                                await logCorrectie(f.id, `Afwijking <1% gewijzigd naar "${checked ? "ja" : "nee"}".`);
                                              }
                                            }
                                          }}
                                        />
                                        Afwijking &lt; 1%
                                      </label>
                                    </div>
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
                onBlur={(e) => saveEp2Field("ep2_startwaarde", e.target.value)}
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
                onBlur={(e) => saveEp2Field("ep2_eindwaarde", e.target.value)}
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
              <label className="text-sm font-medium">
                Beoordeling
                {ep2ManualOverride && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">(handmatig)</span>
                )}
              </label>
              <select
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={ep2Beoordeling}
                onChange={(e) => handleEp2Change(e.target.value)}
                disabled={!canDeel2 && !canEditEp2Post}
              >
                <option value="">— Selecteer —</option>
                <option value="goed">GOED</option>
                <option value="nkt">NKT</option>
                <option value="kt">KT</option>
              </select>
              <p className="text-xs text-muted-foreground">{autoEp2Reden}</p>
              {ep2ManualOverride && !isProjectAfgerond && (
                <button
                  type="button"
                  className="text-xs text-primary underline"
                  onClick={() => {
                    setEp2ManualOverride(false);
                    setEp2Beoordeling(autoEp2);
                  }}
                >
                  Automatische waarde herstellen
                </button>
              )}
              {canEditEp2Post && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  Deze audit is afgerond. Een statuswijziging vraagt om een verplichte toelichting en wordt vastgelegd in de audit-trail hieronder.
                </p>
              )}
            </div>

            {(canDeel1 || canDeel2) && (
              <p className="text-xs text-muted-foreground">Wijzigingen worden automatisch opgeslagen.</p>
            )}
          </div>

          {ep2History.length > 0 && (
            <div className="border rounded-lg shadow-sm bg-card p-6 space-y-3 max-w-2xl">
              <h3 className="text-sm font-semibold tracking-tight">Wijzigingsgeschiedenis EP2-status</h3>
              <ul className="space-y-3">
                {ep2History.map((h) => (
                  <li key={h.id} className="border-l-2 border-primary/40 pl-3 text-sm">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{new Date(h.created_at).toLocaleString("nl-NL")}</span>
                      <span>—</span>
                      <span>{h.changed_by_naam ?? "Onbekend"}</span>
                    </div>
                    <div className="mt-1">
                      <span className="font-medium">{(h.oude_status ?? "—").toUpperCase()}</span>
                      <span className="mx-2 text-muted-foreground">→</span>
                      <span className="font-medium">{h.nieuwe_status.toUpperCase()}</span>
                    </div>
                    <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{h.reden}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between">
            {currentIndex > 0 ? (
              <Button variant="outline" size="sm" onClick={() => goTo(-1)} className="gap-1">
                <ChevronLeft className="h-4 w-4" /> Vorige
              </Button>
            ) : <div />}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={ep2DialogOpen} onOpenChange={(o) => { if (!ep2Bezig) setEp2DialogOpen(o); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>EP2-status wijzigen naar {ep2PendingStatus.toUpperCase()}</AlertDialogTitle>
            <AlertDialogDescription>
              Deze audit is al afgerond. Leg hieronder vast waarom de status wordt gewijzigd (bijv. welke afwijkingen blijvend zijn en welke EP2-waarde dit oplevert). Deze toelichting is verplicht en wordt permanent bewaard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <textarea
            className="w-full border border-input rounded-md p-2 text-sm min-h-[120px] bg-background"
            placeholder="Motivatie voor de statuswijziging..."
            value={ep2Reden}
            onChange={(e) => setEp2Reden(e.target.value)}
            disabled={ep2Bezig}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={ep2Bezig}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void bevestigEp2Wijziging(); }}
              disabled={ep2Bezig || ep2Reden.trim().length < 5}
            >
              {ep2Bezig ? "Bezig..." : "Bevestigen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
