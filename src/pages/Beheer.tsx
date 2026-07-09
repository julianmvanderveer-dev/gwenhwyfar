import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { downloadCsv } from "@/lib/csv";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { Download, Plus, Pencil, Check, X, Trash2, Settings, Users, Eye, EyeOff, ArrowRightLeft, RotateCcw, MessageSquare, Upload, Image, Mail, Send, FileDown } from "lucide-react";
import ProjectenExport from "@/components/projecten/ProjectenExport";
import BulkPdfExport from "@/components/projecten/BulkPdfExport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type Profile = Tables<"profiles">;
type Adviseur = Tables<"adviseurs">;

const ALL_ROLES: Enums<"app_role">[] = ["beheer", "tekenaar", "auditor", "ep_adviseur"];
const PROJECT_ROLES: Enums<"app_role">[] = ["beheer", "tekenaar", "auditor"];
const EP_ROLES: Enums<"app_role">[] = ["ep_adviseur"];
const AUDIT_CATEGORIEEN: Enums<"audit_categorie">[] = ["EPW-B", "EPW-D", "EPU-B", "EPU-D", "MWA-B", "MWA-U"];

const ROLE_PRIORITY: Record<string, number> = { beheer: 1, tekenaar: 2, auditor: 3 };

const ROLE_LABELS: Record<Enums<"app_role">, string> = {
  beheer: "Beheer",
  tekenaar: "Tekenaar",
  auditor: "Auditor",
  ep_adviseur: "EP-adviseur",
};

type ToewijzingProject = Tables<"projects"> & {
  adviseurs: { naam: string } | null;
  toegewezen_profiel: { naam: string } | null;
};

export default function Beheer() {
  const { hasRole, user } = useAuth();
  const [profiles, setProfiles] = useState<(Profile & { roles: Enums<"app_role">[]; auditCategorieen: Enums<"audit_categorie">[] })[]>([]);
  const [adviseurs, setAdviseurs] = useState<Adviseur[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nummer: 0, naam: "", email: "" });
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({ nummer: 0, naam: "", email: "" });

  // Team member add state
  const [addingMember, setAddingMember] = useState(false);
  const [memberForm, setMemberForm] = useState({ naam: "", email: "", password: "", roles: [] as Enums<"app_role">[], auditCategorieen: [] as Enums<"audit_categorie">[] });
  const [showPassword, setShowPassword] = useState(false);
  const [submittingMember, setSubmittingMember] = useState(false);
  const [inviteMode, setInviteMode] = useState(true);

  // Toewijzingen state
  const [toewijzingProjecten, setToewijzingProjecten] = useState<ToewijzingProject[]>([]);
  const [toewijsbarePersonen, setToewijsbarePersonen] = useState<{ id: string; naam: string; roles: string[]; auditCategorieen: string[] }[]>([]);
  const [hertoewijzingProjectId, setHertoewijzingProjectId] = useState<string | null>(null);
  const [hertoewijzingAan, setHertoewijzingAan] = useState("");

  // Unconfirmed users state
  const [unconfirmedIds, setUnconfirmedIds] = useState<Set<string>>(new Set());
  const [resendingInvite, setResendingInvite] = useState<string | null>(null);
  const [sendingPlatformInvite, setSendingPlatformInvite] = useState<string | null>(null);

  // Losse platform-uitnodiging sectie
  const [losseUitnodiging, setLosseUitnodiging] = useState({ naam: "", email: "" });
  const [submittingLosseUitnodiging, setSubmittingLosseUitnodiging] = useState(false);

  // Feedback state
  const [feedbackItems, setFeedbackItems] = useState<any[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [openFeedback, setOpenFeedback] = useState<any | null>(null);

  useEffect(() => {
    loadUsers();
    loadAdviseurs();
    loadToewijzingen();
    loadFeedback();
    loadUnconfirmedUsers();
  }, []);

  const loadFeedback = async () => {
    setFeedbackLoading(true);
    const { data } = await supabase
      .from("feedback" as any)
      .select("*")
      .order("created_at", { ascending: false });
    // Enrich with profile names
    const items = (data ?? []) as any[];
    const userIds = [...new Set(items.map((f: any) => f.user_id))];
    let nameMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, naam, email").in("id", userIds);
      nameMap = new Map((profiles ?? []).map((p) => [p.id, `${p.naam} (${p.email})`]));
    }
    setFeedbackItems(items.map((f: any) => ({ ...f, gebruiker: nameMap.get(f.user_id) ?? f.user_id })));
    setFeedbackLoading(false);
  };

  const deleteFeedback = async (id: string) => {
    await supabase.from("feedback" as any).delete().eq("id", id);
    loadFeedback();
  };

  const loadUsers = async () => {
    const { data: profileData } = await supabase.from("profiles").select("*").order("naam");
    const { data: roleData } = await supabase.from("user_roles").select("*");
    const { data: catData } = await supabase.from("user_audit_categorieen").select("*");
    const combined = (profileData ?? []).map((p) => ({
      ...p,
      roles: (roleData ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
      auditCategorieen: (catData ?? []).filter((c) => c.user_id === p.id).map((c) => c.audit_categorie),
    }));
    // Sort by role priority: Beheer → Tekenaar → Auditor → geen rol, then alphabetically
    combined.sort((a, b) => {
      const prioA = Math.min(...a.roles.map((r) => ROLE_PRIORITY[r] ?? 99), 99);
      const prioB = Math.min(...b.roles.map((r) => ROLE_PRIORITY[r] ?? 99), 99);
      return prioA - prioB || a.naam.localeCompare(b.naam);
    });
    setProfiles(combined);
  };

  const loadUnconfirmedUsers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("create-team-member", {
        body: { action: "list_unconfirmed" },
      });
      if (!error && data?.unconfirmed_ids) {
        setUnconfirmedIds(new Set(data.unconfirmed_ids));
      }
    } catch {}
  };

  const resendInvite = async (profileId: string, email: string, naam: string) => {
    setResendingInvite(profileId);
    try {
      const { data, error } = await supabase.functions.invoke("create-team-member", {
        body: { resend_invite: true, email, naam },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: `Uitnodiging opnieuw verstuurd naar ${email}` });
    } catch (err: any) {
      toast({ title: "Fout bij versturen uitnodiging", description: err.message, variant: "destructive" });
    } finally {
      setResendingInvite(null);
    }
  };

  const sendPlatformInvite = async (key: string, email: string, naam: string) => {
    setSendingPlatformInvite(key);
    try {
      // Stap 1: maak (indien nodig) het auth-account aan met standaardwachtwoord
      const { data: accData, error: accErr } = await supabase.functions.invoke("create-team-member", {
        body: { action: "create_adviseur_account", email, naam },
      });
      if (accErr) throw accErr;
      if (accData?.error) throw new Error(accData.error);
      const bestaatAl = !!accData?.exists;

      // Stap 2: stuur uitnodigingsmail met juiste instructies
      const { data, error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "platform-uitnodiging",
          recipientEmail: email,
          templateData: { naam, bestaatAl },
          cc: "julian@borgch.nl",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: bestaatAl
          ? `Uitnodiging verstuurd naar ${email} (account bestond al)`
          : `Account aangemaakt en uitnodiging verstuurd naar ${email}`,
      });
    } catch (err: any) {
      toast({ title: "Fout bij versturen platform-uitnodiging", description: err.message, variant: "destructive" });
    } finally {
      setSendingPlatformInvite(null);
    }
  };

  const sendLossePlatformInvite = async () => {
    if (!losseUitnodiging.naam.trim() || !losseUitnodiging.email.trim()) {
      toast({ title: "Naam en e-mail zijn verplicht", variant: "destructive" });
      return;
    }
    setSubmittingLosseUitnodiging(true);
    try {
      await sendPlatformInvite("losse", losseUitnodiging.email.trim(), losseUitnodiging.naam.trim());
      setLosseUitnodiging({ naam: "", email: "" });
    } finally {
      setSubmittingLosseUitnodiging(false);
    }
  };

  const loadAdviseurs = async () => {
    const { data } = await supabase.from("adviseurs").select("*").order("nummer");
    setAdviseurs(data ?? []);
  };

  const loadToewijzingen = async () => {
    const { data: projectData } = await supabase
      .from("projects")
      .select("*, adviseurs(naam)")
      .neq("status", "gesloten")
      .order("datum_aangemaakt", { ascending: false });

    const projects = (projectData ?? []) as ToewijzingProject[];

    // Load profile names for toegewezen_aan
    const userIds = [...new Set(projects.filter(p => p.toegewezen_aan).map(p => p.toegewezen_aan!))];
    let profielMap = new Map<string, { naam: string }>();
    if (userIds.length > 0) {
      const { data: profielData } = await supabase.from("profiles").select("id, naam").in("id", userIds);
      profielMap = new Map((profielData ?? []).map(p => [p.id, { naam: p.naam }]));
    }

    setToewijzingProjecten(projects.map(p => ({
      ...p,
      toegewezen_profiel: p.toegewezen_aan ? profielMap.get(p.toegewezen_aan) ?? null : null,
    })));

    // Load toewijsbare personen
    const { data: allProfiles } = await supabase.from("profiles").select("id, naam").eq("actief", true);
    const { data: allRoles } = await supabase.from("user_roles").select("user_id, role");
    const { data: allCats } = await supabase.from("user_audit_categorieen").select("user_id, audit_categorie");
    const personen = (allProfiles ?? []).map(p => ({
      ...p,
      roles: (allRoles ?? []).filter(r => r.user_id === p.id).map(r => r.role),
      auditCategorieen: (allCats ?? []).filter(c => c.user_id === p.id).map(c => c.audit_categorie),
    })).filter(p => p.roles.includes("tekenaar") || p.roles.includes("auditor"));
    setToewijsbarePersonen(personen);
  };

  const hertoewijzen = async (projectId: string, nieuweUserId: string) => {
    const project = toewijzingProjecten.find(p => p.id === projectId);
    if (!project) return;

    const oudeUserId = project.toegewezen_aan;

    await supabase.from("projects").update({
      toegewezen_aan: nieuweUserId,
      toegewezen_op: new Date().toISOString(),
      toewijzing: "specifiek" as any,
    }).eq("id", projectId);

    // Notificaties
    const notificaties = [];
    if (oudeUserId && oudeUserId !== nieuweUserId) {
      notificaties.push({
        user_id: oudeUserId,
        bericht: `Project "${project.projectnaam}" is aan je ontnomen en hertoegewezen.`,
      });
    }
    notificaties.push({
      user_id: nieuweUserId,
      bericht: `Project "${project.projectnaam}" is aan je toegewezen.`,
    });
    await supabase.from("notificaties").insert(notificaties);

    toast({ title: "Project hertoegewezen" });
    setHertoewijzingProjectId(null);
    setHertoewijzingAan("");
    loadToewijzingen();
  };

  const terugNaarPool = async (projectId: string) => {
    const project = toewijzingProjecten.find(p => p.id === projectId);
    if (!project) return;

    const oudeUserId = project.toegewezen_aan;

    await supabase.from("projects").update({
      toegewezen_aan: null,
      toegewezen_op: null,
      toewijzing: "pool" as any,
    }).eq("id", projectId);

    if (oudeUserId) {
      await supabase.from("notificaties").insert({
        user_id: oudeUserId,
        bericht: `Project "${project.projectnaam}" is aan je ontnomen en teruggeplaatst in de pool.`,
      });
    }

    toast({ title: "Project teruggeplaatst in pool" });
    loadToewijzingen();
  };

  const toggleRole = async (userId: string, role: Enums<"app_role">, hasIt: boolean) => {
    try {
      if (hasIt) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      }
      loadUsers();
      toast({ title: hasIt ? "Rol verwijderd" : "Rol toegevoegd" });
    } catch (err: any) {
      toast({ title: "Fout bij rolwijziging", description: err.message, variant: "destructive" });
    }
  };

  const toggleAuditCategorie = async (userId: string, cat: Enums<"audit_categorie">, hasIt: boolean) => {
    try {
      if (hasIt) {
        const { error } = await supabase.from("user_audit_categorieen").delete().eq("user_id", userId).eq("audit_categorie", cat as any);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_audit_categorieen").insert({ user_id: userId, audit_categorie: cat } as any);
        if (error) throw error;
      }
      loadUsers();
    } catch (err: any) {
      toast({ title: "Fout bij categoriewijziging", description: err.message, variant: "destructive" });
    }
  };

  const toggleActief = async (userId: string, currentActief: boolean) => {
    const { error } = await supabase.from("profiles").update({ actief: !currentActief }).eq("id", userId);
    if (error) {
      toast({ title: "Fout bij statuswijziging", description: error.message, variant: "destructive" });
      return;
    }
    loadUsers();
  };

  // Adviseur CRUD
  const toggleAdviseurActief = async (id: string, currentActief: boolean) => {
    const { error } = await supabase.from("adviseurs").update({ actief: !currentActief }).eq("id", id);
    if (error) {
      toast({ title: "Fout bij statuswijziging", description: error.message, variant: "destructive" });
      return;
    }
    loadAdviseurs();
  };

  const startEdit = (a: Adviseur) => {
    setEditingId(a.id);
    setEditForm({ nummer: a.nummer, naam: a.naam, email: a.email ?? "" });
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.naam.trim()) return;
    const { error } = await supabase.from("adviseurs").update({
      nummer: editForm.nummer,
      naam: editForm.naam.trim(),
      email: editForm.email.trim() || null,
    }).eq("id", editingId);
    if (error) {
      toast({ title: "Fout bij opslaan", description: error.message, variant: "destructive" });
      return;
    }
    setEditingId(null);
    loadAdviseurs();
    toast({ title: "Adviseur bijgewerkt" });
  };

  const addAdviseur = async () => {
    if (!addForm.naam.trim() || !addForm.nummer) return;
    const { error } = await supabase.from("adviseurs").insert({
      nummer: addForm.nummer,
      naam: addForm.naam.trim(),
      email: addForm.email.trim() || null,
    });
    if (error) {
      toast({ title: "Fout bij toevoegen", description: error.message, variant: "destructive" });
      return;
    }
    setAdding(false);
    setAddForm({ nummer: 0, naam: "", email: "" });
    loadAdviseurs();
    toast({ title: "Adviseur toegevoegd" });
  };

  const deleteAdviseur = async (id: string, naam: string) => {
    if (!confirm(`Weet je zeker dat je "${naam}" wilt verwijderen?`)) return;
    const { error } = await supabase.from("adviseurs").delete().eq("id", id);
    if (error) {
      toast({ title: "Fout bij verwijderen", description: error.message, variant: "destructive" });
      return;
    }
    loadAdviseurs();
    toast({ title: "Adviseur verwijderd" });
  };

  const deleteProfile = async (userId: string, naam: string) => {
    if (!confirm(`Weet je zeker dat je "${naam}" volledig wilt verwijderen?\n\nInlogaccount, rollen en audit-categorieën worden gewist. Een eventuele EP-adviseur-koppeling wordt losgemaakt; historische audits en berichten blijven bestaan.`)) return;
    try {
      const { data, error } = await supabase.functions.invoke("create-team-member", {
        body: { action: "delete_user", user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      loadUsers();
      toast({ title: "Medewerker verwijderd" });
    } catch (err: any) {
      toast({ title: "Fout bij verwijderen", description: err.message, variant: "destructive" });
    }
  };

  const addMember = async () => {
    if (!memberForm.naam.trim()) {
      toast({ title: "Naam is verplicht", variant: "destructive" });
      return;
    }
    if (!memberForm.email.trim()) {
      toast({ title: "E-mail is verplicht", variant: "destructive" });
      return;
    }
    if (!inviteMode && !memberForm.password) {
      toast({ title: "Wachtwoord is verplicht", variant: "destructive" });
      return;
    }
    setSubmittingMember(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-team-member", {
        body: {
          naam: memberForm.naam.trim(),
          email: memberForm.email.trim(),
          ...(inviteMode ? { invite: true } : { password: memberForm.password }),
          roles: memberForm.roles,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      // Save audit categories for the new user
      if (data?.user_id && memberForm.auditCategorieen.length > 0) {
        await supabase.from("user_audit_categorieen").insert(
          memberForm.auditCategorieen.map((cat) => ({ user_id: data.user_id, audit_categorie: cat })) as any
        );
      }
      setAddingMember(false);
      setMemberForm({ naam: "", email: "", password: "", roles: [], auditCategorieen: [] });
      setShowPassword(false);
      loadUsers();
      toast({ title: data?.invited ? `Uitnodiging verstuurd naar ${memberForm.email.trim()}` : "Medewerker toegevoegd" });
    } catch (err: any) {
      toast({ title: "Fout bij toevoegen", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingMember(false);
    }
  };

  const isProjectteamLid = (p: { roles: Enums<"app_role">[] }) =>
    PROJECT_ROLES.some((r) => p.roles.includes(r));

  const exportGebruikers = () => {
    const rows = profiles.filter(isProjectteamLid).map((p) => {
      const row: Record<string, string> = { Naam: p.naam, "E-mail": p.email, Actief: p.actief ? "Ja" : "Nee" };
      PROJECT_ROLES.forEach((r) => { row[ROLE_LABELS[r]] = p.roles.includes(r) ? "Ja" : "Nee"; });
      return row;
    });
    downloadCsv(rows, "Projectteam.csv");
    toast({ title: "Projectteam geëxporteerd" });
  };

  const exportAdviseurs = () => {
    const rows = adviseurs.map((a) => ({
      Nummer: String(a.nummer).padStart(3, '0'), Naam: a.naam, "E-mail": a.email ?? "", Actief: a.actief ? "Ja" : "Nee",
    }));
    downloadCsv(rows, "EP-adviseurs.csv");
    toast({ title: "EP-adviseurs geëxporteerd" });
  };

  if (!hasRole("beheer")) {
    return <div className="p-4">Geen toegang.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
          <Settings className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Beheer</h1>
          <p className="text-xs text-muted-foreground">Team- en adviseurbeheer</p>
        </div>
      </div>

      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Projectteam
          </TabsTrigger>
          <TabsTrigger value="adviseurs" className="gap-1.5">
            EP-adviseurs
          </TabsTrigger>
          <TabsTrigger value="toewijzingen" className="gap-1.5">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Toewijzingen
          </TabsTrigger>
          <TabsTrigger value="exports" className="gap-1.5">
            <FileDown className="h-3.5 w-3.5" />
            Exports
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Feedback
            {feedbackItems.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{feedbackItems.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="instellingen" className="gap-1.5">
            <Image className="h-3.5 w-3.5" />
            Instellingen
          </TabsTrigger>
        </TabsList>

        {/* TAB: Projectteam */}
        <TabsContent value="team" className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setAddingMember(true)} disabled={addingMember} className="shadow-sm">
              <Plus className="h-4 w-4 mr-1" /> Medewerker toevoegen
            </Button>
            <Button variant="outline" size="sm" onClick={exportGebruikers} className="shadow-sm">
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>

          {/* Losse platform-uitnodiging sturen */}
          <div className="border rounded-lg p-4 bg-card shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold">Platform-uitnodiging sturen</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Stuur een vriendelijke welkomstmail met uitleg hoe iemand een account kan aanmaken via "Wachtwoord vergeten". Julian ontvangt automatisch een CC.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[160px]">
                <Label className="text-xs">Naam</Label>
                <Input
                  value={losseUitnodiging.naam}
                  onChange={(e) => setLosseUitnodiging({ ...losseUitnodiging, naam: e.target.value })}
                  placeholder="Bijv. Rob Harbers"
                  className="h-8"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs">E-mailadres</Label>
                <Input
                  type="email"
                  value={losseUitnodiging.email}
                  onChange={(e) => setLosseUitnodiging({ ...losseUitnodiging, email: e.target.value })}
                  placeholder="naam@voorbeeld.nl"
                  className="h-8"
                />
              </div>
              <Button
                size="sm"
                onClick={sendLossePlatformInvite}
                disabled={submittingLosseUitnodiging}
              >
                <Send className="h-3.5 w-3.5 mr-1" /> Versturen
              </Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden shadow-sm bg-card">
            <table className="w-full text-sm">
              <thead>
                {/* Group headers */}
                 <tr className="border-b bg-secondary/60">
                   <th colSpan={2} />
                   <th colSpan={3} className="text-center px-2 py-2 text-xs font-bold uppercase tracking-wider text-accent border-l border-r">
                     Projectrollen
                   </th>
                   <th colSpan={6} className="text-center px-2 py-2 text-xs font-bold uppercase tracking-wider text-accent border-r">
                     Checklistbevoegdheden
                   </th>
                   <th className="text-center px-2 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Wachtwoord</th>
                   <th />
                 </tr>
                {/* Column headers */}
                <tr className="border-b bg-secondary/40">
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Naam</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">E-mail</th>
                  {PROJECT_ROLES.map((r) => (
                    <th key={r} className={`text-center px-3 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground ${r === "beheer" ? "border-l" : ""} ${r === "auditor" ? "border-r" : ""}`}>
                      {ROLE_LABELS[r]}
                    </th>
                  ))}
                  {AUDIT_CATEGORIEEN.map((cat, ci) => (
                    <th key={cat} className={`text-center px-2 py-2.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground ${ci === AUDIT_CATEGORIEEN.length - 1 ? "border-r" : ""}`}>
                      {cat}
                    </th>
                  ))}
                   <th className="text-center px-3 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-16">Actief</th>
                   <th className="text-center px-3 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-32">Acties</th>
                </tr>
              </thead>
              <tbody>
                {addingMember && (
                  <tr className="border-b bg-primary/5">
                    <td className="px-4 py-2.5">
                      <Input value={memberForm.naam} onChange={(e) => setMemberForm({ ...memberForm, naam: e.target.value })} placeholder="Naam" className="h-8" />
                    </td>
                    <td className="px-4 py-2.5">
                      <Input type="email" value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} placeholder="E-mail" className="h-8" />
                    </td>
                    {PROJECT_ROLES.map((role) => (
                      <td key={role} className={`text-center px-3 py-2.5 ${role === "beheer" ? "border-l" : ""} ${role === "auditor" ? "border-r" : ""}`}>
                        <Checkbox
                          checked={memberForm.roles.includes(role)}
                          onCheckedChange={(checked) => {
                            setMemberForm({
                              ...memberForm,
                              roles: checked ? [...memberForm.roles, role] : memberForm.roles.filter((r) => r !== role),
                            });
                          }}
                          className="mx-auto"
                        />
                      </td>
                    ))}
                    {AUDIT_CATEGORIEEN.map((cat, ci) => {
                      const hasTekenaarOrAuditor = memberForm.roles.includes("tekenaar") || memberForm.roles.includes("auditor");
                      return (
                        <td key={cat} className={`text-center px-2 py-2.5 ${ci === AUDIT_CATEGORIEEN.length - 1 ? "border-r" : ""}`}>
                          {hasTekenaarOrAuditor ? (
                            <Checkbox
                              checked={memberForm.auditCategorieen.includes(cat)}
                              onCheckedChange={(checked) => {
                                setMemberForm({
                                  ...memberForm,
                                  auditCategorieen: checked
                                    ? [...memberForm.auditCategorieen, cat]
                                    : memberForm.auditCategorieen.filter((c) => c !== cat),
                                });
                              }}
                              className="mx-auto"
                            />
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5">
                      {inviteMode ? (
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] whitespace-nowrap">Uitnodiging</Badge>
                          <button type="button" onClick={() => setInviteMode(false)} className="text-[10px] text-muted-foreground underline whitespace-nowrap">Wachtwoord instellen</button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              value={memberForm.password}
                              onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })}
                              placeholder="Wachtwoord"
                              className="h-8 pr-8"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                          <button type="button" onClick={() => { setInviteMode(true); setMemberForm({ ...memberForm, password: "" }); }} className="text-[10px] text-muted-foreground underline">Uitnodiging versturen</button>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={addMember} disabled={submittingMember} title={inviteMode ? "Uitnodigen" : "Toevoegen"}><Check className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setAddingMember(false); setMemberForm({ naam: "", email: "", password: "", roles: [], auditCategorieen: [] }); setShowPassword(false); setInviteMode(true); }}><X className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                )}
                {profiles.filter(isProjectteamLid).map((p, i) => (
                  <tr key={p.id} className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    <td className="px-4 py-2.5 font-medium">
                      <div className="flex items-center gap-2">
                        <span>{p.naam}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive hover:bg-destructive/10 shrink-0"
                          disabled={p.id === user?.id}
                          aria-label="Verwijderen"
                          title={p.id === user?.id ? "Je kunt je eigen account niet verwijderen" : `${p.naam} verwijderen`}
                          onClick={() => deleteProfile(p.id, p.naam)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.email}</td>
                    {PROJECT_ROLES.map((role) => {
                      const has = p.roles.includes(role);
                      const isSelfBeheer = role === "beheer" && p.id === user?.id;
                      return (
                        <td key={role} className={`text-center px-3 py-2.5 ${role === "beheer" ? "border-l" : ""} ${role === "auditor" ? "border-r" : ""}`}>
                          <Checkbox
                            checked={has}
                            disabled={isSelfBeheer}
                            title={isSelfBeheer ? "Je kunt je eigen beheer-rol niet verwijderen" : undefined}
                            onCheckedChange={() => toggleRole(p.id, role, has)}
                            className="mx-auto"
                          />
                        </td>
                      );
                    })}
                    {AUDIT_CATEGORIEEN.map((cat, ci) => {
                      const hasCat = p.auditCategorieen.includes(cat);
                      const isRelevant = p.roles.includes("tekenaar") || p.roles.includes("auditor");
                      return (
                        <td key={cat} className={`text-center px-2 py-2.5 ${ci === AUDIT_CATEGORIEEN.length - 1 ? "border-r" : ""}`}>
                          {isRelevant ? (
                            <Checkbox
                              checked={hasCat}
                              onCheckedChange={() => toggleAuditCategorie(p.id, cat, hasCat)}
                              className="mx-auto"
                            />
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                      );
                    })}
                     <td className="text-center px-3 py-2.5">
                       <button
                         onClick={() => toggleActief(p.id, p.actief)}
                         className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.actief ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}
                       >
                         {p.actief ? "Ja" : "Nee"}
                       </button>
                     </td>
                     <td className="text-center px-3 py-2.5">
                       <div className="flex gap-1 justify-center whitespace-nowrap">
                         <Button
                           size="icon"
                           variant="ghost"
                           className="h-7 w-7 text-accent"
                           disabled={sendingPlatformInvite === p.id}
                           title="Platform-uitnodiging (opnieuw) sturen — maakt account aan met standaardwachtwoord, of stuurt bij bestaand account de juiste inloginstructies"
                           onClick={() => sendPlatformInvite(p.id, p.email, p.naam)}
                         >
                           <Send className="h-4 w-4" />
                         </Button>
                         {unconfirmedIds.has(p.id) && (
                           <Button
                             size="icon"
                             variant="ghost"
                             className="h-7 w-7 text-primary"
                             disabled={resendingInvite === p.id}
                             title="Auth-uitnodiging opnieuw versturen (magic link)"
                             onClick={() => resendInvite(p.id, p.email, p.naam)}
                           >
                             <Mail className="h-4 w-4" />
                           </Button>
                         )}
                         <Button
                           size="icon"
                           variant="ghost"
                           className="h-7 w-7 text-destructive hover:bg-destructive/10 border border-destructive/30"
                           disabled={p.id === user?.id}
                           aria-label="Verwijderen"
                           title={p.id === user?.id ? "Je kunt je eigen account niet verwijderen" : "Verwijderen"}
                           onClick={() => deleteProfile(p.id, p.naam)}
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* TAB: EP-adviseurs */}
        <TabsContent value="adviseurs" className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setAdding(true)} disabled={adding} className="shadow-sm">
              <Plus className="h-4 w-4 mr-1" /> Adviseur toevoegen
            </Button>
            <Button variant="outline" size="sm" onClick={exportAdviseurs} className="shadow-sm">
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden shadow-sm bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/60">
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Nummer</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Naam</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">E-mail</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actief</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {adding && (
                  <tr className="border-b bg-primary/5">
                    <td className="px-4 py-2.5">
                      <Input type="number" value={addForm.nummer || ""} onChange={(e) => setAddForm({ ...addForm, nummer: Number(e.target.value) })} placeholder="Nr" className="h-8 w-20" />
                    </td>
                    <td className="px-4 py-2.5">
                      <Input value={addForm.naam} onChange={(e) => setAddForm({ ...addForm, naam: e.target.value })} placeholder="Naam" className="h-8" />
                    </td>
                    <td className="px-4 py-2.5">
                      <Input value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} placeholder="E-mail" className="h-8" />
                    </td>
                    <td className="px-4 py-2.5 text-center">—</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={addAdviseur}><Check className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setAdding(false); setAddForm({ nummer: 0, naam: "", email: "" }); }}><X className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                )}
                {adviseurs.map((a, i) => (
                  <tr key={a.id} className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    {editingId === a.id ? (
                      <>
                        <td className="px-4 py-2.5">
                          <Input type="number" value={editForm.nummer || ""} onChange={(e) => setEditForm({ ...editForm, nummer: Number(e.target.value) })} className="h-8 w-20" />
                        </td>
                        <td className="px-4 py-2.5">
                          <Input value={editForm.naam} onChange={(e) => setEditForm({ ...editForm, naam: e.target.value })} className="h-8" />
                        </td>
                        <td className="px-4 py-2.5">
                          <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="h-8" />
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button onClick={() => toggleAdviseurActief(a.id, a.actief)} className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.actief ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                            {a.actief ? "Ja" : "Nee"}
                          </button>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}><Check className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2.5 text-muted-foreground">{String(a.nummer).padStart(3, '0')}</td>
                        <td className="px-4 py-2.5 font-medium">{a.naam}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{a.email ?? "—"}</td>
                        <td className="px-4 py-2.5 text-center">
                          <button onClick={() => toggleAdviseurActief(a.id, a.actief)} className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.actief ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                            {a.actief ? "Ja" : "Nee"}
                          </button>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-accent"
                              disabled={!a.email || sendingPlatformInvite === a.id}
                              title={a.email ? "Platform-uitnodiging (opnieuw) sturen — bij bestaand account worden de juiste inloginstructies meegestuurd" : "Geen e-mailadres bekend"}
                              onClick={() => a.email && sendPlatformInvite(a.id, a.email, a.naam)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(a)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteAdviseur(a.id, a.naam)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* TAB: Toewijzingen */}
        <TabsContent value="toewijzingen" className="space-y-4">
          <div className="border rounded-lg overflow-hidden shadow-sm bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/60">
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Project</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Toegewezen aan</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Toegewezen op</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-56">Acties</th>
                </tr>
              </thead>
              <tbody>
                {toewijzingProjecten.map((p, i) => (
                  <tr key={p.id} className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    <td className="px-4 py-2.5 font-medium">{p.projectnaam}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.status}</td>
                    <td className="px-4 py-2.5">
                      {p.toewijzing === "specifiek" ? (
                        <Badge variant="secondary" className="text-[10px]">Specifiek</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Pool</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {p.toegewezen_aan ? (
                        <span>{p.toegewezen_profiel?.naam ?? "Onbekend"}</span>
                      ) : (
                        <span className="text-muted-foreground italic">Wacht in pool</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">
                      {p.toegewezen_op ? new Date(p.toegewezen_op).toLocaleString("nl-NL") : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {hertoewijzingProjectId === p.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            className="border rounded px-2 py-1 text-xs flex-1"
                            value={hertoewijzingAan}
                            onChange={(e) => setHertoewijzingAan(e.target.value)}
                          >
                            {(() => {
                              const isTekenaarFase = ["nog_niet_begonnen", "deel1_bezig"].includes(p.status);
                              const isAuditorFase = ["deel1_afgerond", "deel2_bezig"].includes(p.status);
                              const gefilterd = toewijsbarePersonen.filter(pp => {
                                if (isTekenaarFase && !pp.roles.includes("tekenaar")) return false;
                                if (isAuditorFase && !pp.roles.includes("auditor")) return false;
                                // Filter by audit category
                                if (pp.auditCategorieen && pp.auditCategorieen.length > 0) {
                                  if (!pp.auditCategorieen.includes(p.audit_categorie)) return false;
                                } else if (pp.auditCategorieen && pp.auditCategorieen.length === 0) {
                                  return false;
                                }
                                return true;
                              });
                              return (
                                <>
                                  <option value="">— Selecteer {isTekenaarFase ? "tekenaar" : isAuditorFase ? "auditor" : "persoon"} —</option>
                                  {gefilterd.map((pp) => (
                                    <option key={pp.id} value={pp.id}>{pp.naam} ({pp.roles.filter(r => r !== "beheer").join(", ")})</option>
                                  ))}
                                </>
                              );
                            })()}
                          </select>
                          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={!hertoewijzingAan} onClick={() => hertoewijzen(p.id, hertoewijzingAan)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setHertoewijzingProjectId(null); setHertoewijzingAan(""); }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setHertoewijzingProjectId(p.id)}>
                            <ArrowRightLeft className="h-3 w-3" /> Hertoewijzen
                          </Button>
                          {p.toegewezen_aan && (
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => terugNaarPool(p.id)}>
                              <RotateCcw className="h-3 w-3" /> Pool
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {toewijzingProjecten.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Geen actieve projecten.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="exports" className="space-y-4">
          <ProjectenExport />
          <BulkPdfExport />
        </TabsContent>

        {/* TAB: Feedback */}
        <TabsContent value="feedback" className="space-y-4">
          <div className="border rounded-lg overflow-hidden shadow-sm bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/40">
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Datum</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Gebruiker</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Pagina</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Bericht</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {feedbackLoading ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Laden...</td></tr>
                ) : feedbackItems.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Nog geen feedback ontvangen.</td></tr>
                 ) : feedbackItems.map((f: any) => (
                   <tr
                     key={f.id}
                     className="border-b hover:bg-muted/50 cursor-pointer"
                     onClick={() => setOpenFeedback(f)}
                     title="Klik om volledige bericht te bekijken"
                   >
                     <td className="px-4 py-2.5 whitespace-nowrap align-top">{new Date(f.created_at).toLocaleString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                     <td className="px-4 py-2.5 text-xs align-top">{f.gebruiker}</td>
                     <td className="px-4 py-2.5 font-mono text-xs align-top">{f.pagina}</td>
                     <td className="px-4 py-2.5 align-top">
                      <Badge variant={f.type === "probleem" ? "destructive" : f.type === "tip" ? "default" : "secondary"}>
                        {f.type === "probleem" ? "🐛 Probleem" : f.type === "tip" ? "💡 Tip" : "💬 Opmerking"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 align-top whitespace-pre-wrap break-words">{f.bericht}</td>
                    <td className="px-2 py-2.5 align-top">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); deleteFeedback(f.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Dialog open={!!openFeedback} onOpenChange={(o) => !o && setOpenFeedback(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {openFeedback?.type === "probleem" ? "🐛 Probleem" : openFeedback?.type === "tip" ? "💡 Tip" : "💬 Opmerking"}
                </DialogTitle>
                <DialogDescription>
                  {openFeedback && (
                    <>
                      Van <strong>{openFeedback.gebruiker}</strong> op{" "}
                      {new Date(openFeedback.created_at).toLocaleString("nl-NL")} —
                      pagina <span className="font-mono">{openFeedback.pagina}</span>
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="whitespace-pre-wrap break-words text-sm bg-muted/40 rounded p-3 max-h-[60vh] overflow-y-auto">
                {openFeedback?.bericht}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* TAB: Instellingen */}
        <TabsContent value="instellingen" className="space-y-4">
          <InstellingenTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InstellingenTab() {
  const { settings, updateSetting, refresh } = useAppSettings();
  const [orgNaam, setOrgNaam] = useState(settings.org_naam);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOrgNaam(settings.org_naam);
  }, [settings.org_naam]);

  const saveNaam = async () => {
    if (!orgNaam.trim()) return;
    setSaving(true);
    try {
      await updateSetting("org_naam", orgNaam.trim());
      toast({ title: "Organisatienaam opgeslagen" });
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Alleen afbeeldingen toegestaan", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `logo.${ext}`;
      // Remove old logo
      await supabase.storage.from("branding").remove([path]);
      const { error: upErr } = await supabase.storage.from("branding").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("branding").getPublicUrl(path);
      const url = urlData.publicUrl + "?t=" + Date.now();
      await updateSetting("org_logo_url", url);
      toast({ title: "Logo geüpload" });
    } catch (err: any) {
      toast({ title: "Fout bij uploaden", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeLogo = async () => {
    try {
      await updateSetting("org_logo_url", "");
      toast({ title: "Logo verwijderd" });
    } catch (err: any) {
      toast({ title: "Fout", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="border rounded-lg p-6 bg-card shadow-sm space-y-4">
        <h3 className="font-semibold text-sm">Organisatienaam</h3>
        <div className="flex gap-2">
          <Input
            value={orgNaam}
            onChange={(e) => setOrgNaam(e.target.value)}
            placeholder="Organisatienaam"
            className="flex-1"
          />
          <Button onClick={saveNaam} disabled={saving} size="sm">
            {saving ? "Opslaan..." : "Opslaan"}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg p-6 bg-card shadow-sm space-y-4">
        <h3 className="font-semibold text-sm">Logo</h3>
        {settings.org_logo_url && (
          <div className="flex items-center gap-4">
            <img src={settings.org_logo_url} alt="Logo" className="h-12 object-contain border rounded p-1" />
            <Button variant="outline" size="sm" onClick={removeLogo}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Verwijderen
            </Button>
          </div>
        )}
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={uploadLogo}
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload className="h-3.5 w-3.5 mr-1" />
            {uploading ? "Uploaden..." : settings.org_logo_url ? "Ander logo uploaden" : "Logo uploaden"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">PNG, JPG, SVG of WebP. Aanbevolen: transparante achtergrond.</p>
        </div>
      </div>
    </div>
  );
}
