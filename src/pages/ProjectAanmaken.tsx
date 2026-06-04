import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { statusBadge } from "@/lib/badges";
import type { Enums } from "@/integrations/supabase/types";
import { EPW_D_CHECKLIST } from "@/data/epwd-checklist";
import { EPW_B_CHECKLIST } from "@/data/epwb-checklist";
import { EPU_B_CHECKLIST } from "@/data/epub-checklist";
import { EPU_D_CHECKLIST } from "@/data/epud-checklist";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

type Adviseur = { id: string; nummer: number; naam: string; email: string | null; actief: boolean };
type ToewijsbaarPersoon = { id: string; naam: string; email: string; roles: Enums<"app_role">[]; auditCategorieen: Enums<"audit_categorie">[] };
type AdviseurProject = { projectnaam: string; audit_categorie: string; audit_soort: string; status: string; datum_aangemaakt: string };

export default function ProjectAanmaken() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [projectnaam, setProjectnaam] = useState("");
  const [adviseurId, setAdviseurId] = useState("");
  const [auditCategorie, setAuditCategorie] = useState<Enums<"audit_categorie">>("EPW-B");
  const [auditSoort, setAuditSoort] = useState<Enums<"audit_soort">>("dossieraudit");
  const [toelatingsaudit, setToelatingsaudit] = useState(false);
  const [prioriteit, setPrioriteit] = useState(false);
  const [isOmgevingsvergunning, setIsOmgevingsvergunning] = useState(false);
  const [adviseurs, setAdviseurs] = useState<Adviseur[]>([]);
  const [loading, setLoading] = useState(false);

  // Toewijzing state
  const [toewijzing, setToewijzing] = useState<"pool" | "specifiek">("pool");
  const [toegewezenAan, setToegewezenAan] = useState("");
  const [toewijsbarePersonen, setToewijsbarePersonen] = useState<ToewijsbaarPersoon[]>([]);
  const [adviseurProjecten, setAdviseurProjecten] = useState<AdviseurProject[]>([]);

  useEffect(() => {
    supabase.from("adviseurs").select("*").eq("actief", true).order("nummer").then(({ data }) => {
      setAdviseurs((data as Adviseur[]) ?? []);
    });
    loadToewijsbarePersonen();
  }, []);

  // Laad projecten van geselecteerde adviseur (afgelopen jaar)
  useEffect(() => {
    if (!adviseurId) {
      setAdviseurProjecten([]);
      return;
    }
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    supabase
      .from("projects")
      .select("projectnaam, audit_categorie, audit_soort, status, datum_aangemaakt")
      .eq("adviseur_id", adviseurId)
      .gte("datum_aangemaakt", oneYearAgo.toISOString())
      .order("datum_aangemaakt", { ascending: false })
      .then(({ data }) => {
        setAdviseurProjecten((data as AdviseurProject[]) ?? []);
      });
  }, [adviseurId]);

  const loadToewijsbarePersonen = async () => {
    const { data: profiles } = await supabase.from("profiles").select("id, naam, email").eq("actief", true);
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const { data: cats } = await supabase.from("user_audit_categorieen").select("user_id, audit_categorie");
    if (!profiles || !roles) return;

    const personen: ToewijsbaarPersoon[] = profiles.map((p) => ({
      ...p,
      roles: roles.filter((r) => r.user_id === p.id).map((r) => r.role),
      auditCategorieen: (cats ?? []).filter((c) => c.user_id === p.id).map((c) => c.audit_categorie),
    })).filter((p) => p.roles.includes("tekenaar"));

    setToewijsbarePersonen(personen);
  };

  const isBeheer = hasRole("beheer");
  const magAanmaken = isBeheer || hasRole("tekenaar") || hasRole("auditor");

  if (!magAanmaken) {
    return <div className="p-4">Geen toegang.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const insertData: any = {
      projectnaam,
      adviseur_id: adviseurId || null,
      audit_categorie: auditCategorie,
      audit_soort: auditSoort,
      toelatingsaudit,
      prioriteit,
      is_omgevingsvergunning: isOmgevingsvergunning,
      aangemaakt_door: user.id,
      toewijzing,
    };

    if (!isBeheer) {
      // Tekenaar/auditor: altijd in de pool plaatsen (geen self-assign)
      insertData.toewijzing = "pool";
      insertData.toegewezen_aan = null;
    } else if (toewijzing === "specifiek" && toegewezenAan) {
      insertData.toegewezen_aan = toegewezenAan;
      insertData.toegewezen_op = new Date().toISOString();
    }

    const { data: project, error } = await supabase.from("projects").insert(insertData).select("id").single();

    if (error || !project) {
      toast({ title: "Fout", description: error?.message ?? "Onbekende fout", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Auto-insert checklist findings from DB templates (fallback to hardcoded)
    if (["EPW-B", "EPW-D", "EPU-B", "EPU-D"].includes(auditCategorie)) {
      const { data: templates } = await supabase
        .from("checklist_templates")
        .select("code, onderdeel, controlepunt, deel")
        .eq("audit_categorie", auditCategorie)
        .order("code");

      const fallbackMap: Record<string, typeof EPW_B_CHECKLIST> = {
        "EPW-B": EPW_B_CHECKLIST,
        "EPW-D": EPW_D_CHECKLIST,
        "EPU-B": EPU_B_CHECKLIST,
        "EPU-D": EPU_D_CHECKLIST,
      };
      const checklist = templates && templates.length > 0
        ? templates
        : fallbackMap[auditCategorie] ?? EPW_B_CHECKLIST;

      const findingsToInsert = checklist.map((item) => ({
        project_id: project.id,
        onderdeel: item.onderdeel,
        controlepunt: `${item.code}. ${item.controlepunt}`,
        deel: item.deel,
      }));

      const { error: findingsError } = await supabase.from("findings").insert(findingsToInsert as any);
      if (findingsError) {
        toast({ title: "Waarschuwing", description: "Project aangemaakt maar checklist kon niet worden ingevuld: " + findingsError.message, variant: "destructive" });
      }
    }

    // Notificatie bij specifieke toewijzing
    if (toewijzing === "specifiek" && toegewezenAan) {
      await supabase.from("notificaties").insert({
        user_id: toegewezenAan,
        bericht: `Project "${projectnaam}" is aan je toegewezen.`,
      });
    }

    toast({ title: "Project aangemaakt" });
    navigate("/inbox");
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Nieuw project</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Projectnaam <span className="italic font-normal text-sm text-muted-foreground">Bij oplevering en bestaande bouw postcode_huisnr</span></Label>
          <Input required value={projectnaam} onChange={(e) => setProjectnaam(e.target.value)} />
        </div>
        <div>
          <Label>Adviseur</Label>
          <select className="border rounded px-2 py-1 w-full text-sm" value={adviseurId} onChange={(e) => setAdviseurId(e.target.value)}>
            <option value="">— Geen —</option>
            {adviseurs.map((a) => (
              <option key={a.id} value={a.id}>{a.naam} ({a.nummer})</option>
            ))}
          </select>
        </div>
        {/* Audit-overzicht adviseur */}
        {adviseurId && (
          <div className={`border rounded-lg p-3 text-sm ${adviseurProjecten.length > 0 ? "bg-yellow-50 border-yellow-300" : "bg-muted/30"}`}>
            <p className="font-semibold mb-2">
              Audits afgelopen jaar voor {adviseurs.find((a) => a.id === adviseurId)?.naam ?? "adviseur"}
            </p>
            {adviseurProjecten.length === 0 ? (
              <p className="text-muted-foreground">Geen audits gevonden in het afgelopen jaar.</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1 pr-2">Project</th>
                      <th className="text-left py-1 pr-2">Cat.</th>
                      <th className="text-left py-1 pr-2">Soort</th>
                      <th className="text-left py-1 pr-2">Status</th>
                      <th className="text-left py-1">Datum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adviseurProjecten.map((p, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1 pr-2">{p.projectnaam}</td>
                        <td className="py-1 pr-2">{p.audit_categorie}</td>
                        <td className="py-1 pr-2">{p.audit_soort === "dossieraudit" ? "Dossier" : "Project"}</td>
                        <td className="py-1 pr-2">{statusBadge(p.status)}</td>
                        <td className="py-1">{format(new Date(p.datum_aangemaakt), "d MMM yyyy", { locale: nl })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        <div>
          <Label>Audit categorie</Label>
          <select className="border rounded px-2 py-1 w-full text-sm" value={auditCategorie} onChange={(e) => setAuditCategorie(e.target.value as any)}>
            <option value="EPW-B">EPW-B</option>
            <option value="EPW-D">EPW-D</option>
            <option value="EPU-B">EPU-B</option>
            <option value="EPU-D">EPU-D</option>
            <option value="MWA-B">MWA-B</option>
            <option value="MWA-U">MWA-U</option>
          </select>
        </div>
        <div>
          <Label>Audit soort</Label>
          <select className="border rounded px-2 py-1 w-full text-sm" value={auditSoort} onChange={(e) => setAuditSoort(e.target.value as any)}>
            <option value="dossieraudit">Dossieraudit</option>
            <option value="projectaudit">Projectaudit</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="toelatingsaudit" checked={toelatingsaudit} onCheckedChange={(v) => setToelatingsaudit(v === true)} />
          <Label htmlFor="toelatingsaudit">Toelatingsaudit</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="prioriteit" checked={prioriteit} onCheckedChange={(v) => setPrioriteit(v === true)} />
          <Label htmlFor="prioriteit">Prioriteit</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="omgevingsvergunning"
            checked={isOmgevingsvergunning}
            onCheckedChange={(v) => setIsOmgevingsvergunning(v === true)}
          />
          <Label htmlFor="omgevingsvergunning">Omgevingsvergunning</Label>
        </div>

        {/* Toewijzing — alleen voor beheer */}
        {isBeheer && (
          <div className="space-y-3 border rounded-lg p-4 bg-card">
            <Label className="font-semibold">Toewijzing</Label>
            <RadioGroup value={toewijzing} onValueChange={(v) => { setToewijzing(v as any); setToegewezenAan(""); }}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="pool" id="pool" />
                <Label htmlFor="pool" className="font-normal">Algemene pool — zichtbaar voor alle tekenaars</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="specifiek" id="specifiek" />
                <Label htmlFor="specifiek" className="font-normal">Specifieke toewijzing — alleen zichtbaar voor gekozen persoon</Label>
              </div>
            </RadioGroup>

            {toewijzing === "specifiek" && (
              <div>
                <Label>Toewijzen aan tekenaar</Label>
                <select
                  className="border rounded px-2 py-1 w-full text-sm"
                  value={toegewezenAan}
                  onChange={(e) => setToegewezenAan(e.target.value)}
                  required
                >
                  <option value="">— Selecteer persoon —</option>
                  {toewijsbarePersonen
                    .filter((p) => p.auditCategorieen.length === 0 || p.auditCategorieen.includes(auditCategorie))
                    .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.naam} ({p.roles.filter(r => r !== "beheer").join(", ")})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <Button type="submit" disabled={loading}>Aanmaken</Button>
      </form>
    </div>
  );
}
