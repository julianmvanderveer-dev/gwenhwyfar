import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import type { Tables, Enums } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export default function ProjectAanmaken() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [projectnaam, setProjectnaam] = useState("");
  const [adviseurId, setAdviseurId] = useState("");
  const [auditType, setAuditType] = useState<Enums<"audit_type">>("intern");
  const [prioriteit, setPrioriteit] = useState(false);
  const [adviseurs, setAdviseurs] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("*").eq("actief", true).then(({ data }) => {
      setAdviseurs(data ?? []);
    });
  }, []);

  if (!hasRole("planner") && !hasRole("beheer")) {
    return <div className="p-4">Geen toegang.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("projects").insert({
      projectnaam,
      adviseur_id: adviseurId || null,
      audit_type: auditType,
      prioriteit,
      aangemaakt_door: user.id,
    });
    if (error) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Project aangemaakt" });
      navigate("/inbox");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Nieuw project</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Projectnaam</Label>
          <Input required value={projectnaam} onChange={(e) => setProjectnaam(e.target.value)} />
        </div>
        <div>
          <Label>Adviseur</Label>
          <select className="border rounded px-2 py-1 w-full text-sm" value={adviseurId} onChange={(e) => setAdviseurId(e.target.value)}>
            <option value="">— Geen —</option>
            {adviseurs.map((a) => (
              <option key={a.id} value={a.id}>{a.naam} ({a.email})</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Audit type</Label>
          <select className="border rounded px-2 py-1 w-full text-sm" value={auditType} onChange={(e) => setAuditType(e.target.value as any)}>
            <option value="intern">Intern</option>
            <option value="extern">Extern</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={prioriteit} onChange={(e) => setPrioriteit(e.target.checked)} />
          <Label>Prioriteit</Label>
        </div>
        <Button type="submit" disabled={loading}>Aanmaken</Button>
      </form>
    </div>
  );
}
