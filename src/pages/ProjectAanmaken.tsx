import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import type { Enums } from "@/integrations/supabase/types";
import { EPW_D_CHECKLIST } from "@/data/epwd-checklist";

type Adviseur = { id: string; nummer: number; naam: string; email: string | null; actief: boolean };

export default function ProjectAanmaken() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [projectnaam, setProjectnaam] = useState("");
  const [adviseurId, setAdviseurId] = useState("");
  const [auditCategorie, setAuditCategorie] = useState<Enums<"audit_categorie">>("EPW-B");
  const [auditSoort, setAuditSoort] = useState<Enums<"audit_soort">>("dossieraudit");
  const [toelatingsaudit, setToelatingsaudit] = useState(false);
  const [prioriteit, setPrioriteit] = useState(false);
  const [adviseurs, setAdviseurs] = useState<Adviseur[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("adviseurs").select("*").eq("actief", true).order("nummer").then(({ data }) => {
      setAdviseurs((data as Adviseur[]) ?? []);
    });
  }, []);

  if (!hasRole("beheer")) {
    return <div className="p-4">Geen toegang.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { data: project, error } = await supabase.from("projects").insert({
      projectnaam,
      adviseur_id: adviseurId || null,
      audit_categorie: auditCategorie,
      audit_soort: auditSoort,
      toelatingsaudit,
      prioriteit,
      aangemaakt_door: user.id,
    }).select("id").single();

    if (error || !project) {
      toast({ title: "Fout", description: error?.message ?? "Onbekende fout", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Auto-insert checklist findings for EPW-D
    if (auditCategorie === "EPW-D") {
      const findingsToInsert = EPW_D_CHECKLIST.map((item) => ({
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
        <Button type="submit" disabled={loading}>Aanmaken</Button>
      </form>
    </div>
  );
}
