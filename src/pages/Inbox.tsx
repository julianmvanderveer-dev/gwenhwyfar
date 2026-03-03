import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Plus } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { toast as uiToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { beoordelingBadge, afwijkingBadge, statusBadge } from "@/lib/badges";
import { downloadCsv } from "@/lib/csv";

type Project = Tables<"projects"> & { adviseurs: { naam: string } | null };
type Finding = Tables<"findings">;

export default function Inbox() {
  const { user, roles, hasRole } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [findings, setFindings] = useState<(Finding & { project_naam?: string })[]>([]);
  const [adviseurProjects, setAdviseurProjects] = useState<(Tables<"projects"> & { findings: Finding[] })[]>([]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, roles]);

  const loadData = async () => {
    if (hasRole("ep_adviseur")) await loadAdviseurData();
    if (hasRole("tekenaar") || hasRole("auditor") || hasRole("beheer")) await loadInternalData();
  };

  const loadInternalData = async () => {
    const { data: projectData } = await supabase
      .from("projects")
      .select("*, adviseurs(naam)")
      .neq("status", "gesloten")
      .order("datum_aangemaakt", { ascending: false });
    setProjects((projectData as Project[]) ?? []);

    if (hasRole("tekenaar") || hasRole("auditor")) {
      const eigenaar = hasRole("tekenaar") ? "tekenaar" : "auditor";
      const { data: findingData } = await supabase
        .from("findings")
        .select("*")
        .eq("eigenaar_beoordeling", eigenaar as any)
        .eq("status", "reactie_ontvangen");
      setFindings(findingData ?? []);
    }
  };

  const loadAdviseurData = async () => {
    const { data: adviseurRecord } = await supabase
      .from("adviseurs")
      .select("id")
      .eq("user_id", user!.id)
      .single();

    if (!adviseurRecord) {
      setAdviseurProjects([]);
      return;
    }

    const { data: projectData } = await supabase
      .from("projects")
      .select("*")
      .eq("adviseur_id", adviseurRecord.id)
      .neq("status", "gesloten")
      .order("datum_aangemaakt", { ascending: false });

    if (!projectData || projectData.length === 0) {
      setAdviseurProjects([]);
      return;
    }

    const projectIds = projectData.map((p) => p.id);
    const { data: findingData } = await supabase
      .from("findings")
      .select("*")
      .in("project_id", projectIds)
      .neq("status", "gesloten")
      .eq("zichtbaar_voor_adviseur", true)
      .order("created_at");

    const grouped = projectData.map((p) => ({
      ...p,
      findings: (findingData ?? []).filter((f) => f.project_id === p.id),
    }));

    setAdviseurProjects(grouped);
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      toast.error("Verwijderen mislukt: " + error.message);
    } else {
      toast.success("Project verwijderd");
      loadData();
    }
  };

  const exportProjecten = () => {
    const rows = projects.map((p) => ({
      Projectnaam: p.projectnaam, Status: p.status, Categorie: p.audit_categorie,
      Soort: p.audit_soort, Prioriteit: p.prioriteit ? "Ja" : "Nee",
      Adviseur: p.adviseurs?.naam ?? "", "Datum aangemaakt": new Date(p.datum_aangemaakt).toLocaleDateString("nl-NL"),
    }));
    downloadCsv(rows, "Projecten.csv");
    uiToast({ title: "Projecten geëxporteerd" });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Projecten</h1>
      <p className="text-sm mb-4 text-muted-foreground">Rollen: {roles.join(", ") || "geen"}</p>

      {/* EP-adviseur section */}
      {hasRole("ep_adviseur") && (
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Openstaande audits (EP-adviseur)</h2>
          {adviseurProjects.length === 0 ? (
            <p className="text-muted-foreground text-sm">Geen openstaande audits.</p>
          ) : (
            <Tabs defaultValue={adviseurProjects[0]?.id}>
              <TabsList className="flex-wrap h-auto">
                {adviseurProjects.map((p) => (
                  <TabsTrigger key={p.id} value={p.id}>
                    {p.projectnaam}
                    {p.findings.length > 0 && (
                      <Badge variant="destructive" className="ml-2 text-xs">{p.findings.length}</Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              {adviseurProjects.map((p) => (
                <TabsContent key={p.id} value={p.id}>
                  {p.findings.length === 0 ? (
                    <p className="text-muted-foreground text-sm mt-2">Alle findings zijn beantwoord.</p>
                  ) : (
                    <table className="w-full text-sm border mt-2">
                      <thead>
                        <tr className="border-b bg-muted">
                          <th className="text-left p-2">Controlepunt</th>
                          <th className="text-left p-2">Beoordeling</th>
                          <th className="text-left p-2">Type afwijking</th>
                          <th className="text-left p-2">Deadline</th>
                          <th className="text-left p-2">Actie</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.findings.map((f) => (
                          <tr key={f.id} className="border-b">
                            <td className="p-2">{f.controlepunt}</td>
                            <td className="p-2">{beoordelingBadge(f.beoordeling) ?? "—"}</td>
                            <td className="p-2">{afwijkingBadge(f.type_afwijking)}</td>
                            <td className="p-2">
                              {f.deadline ? new Date(f.deadline).toLocaleDateString("nl-NL") : "—"}
                            </td>
                            <td className="p-2">
                              <Link to={`/finding/${f.id}/reactie`} className="underline text-primary">
                                Reageren
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      )}

      {/* Internal roles: projects and findings */}
      {(hasRole("tekenaar") || hasRole("auditor") || hasRole("beheer")) && (
        <>
          {projects.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">Projecten</h2>
                <div className="flex gap-2">
                  {hasRole("beheer") && (
                    <Link to="/project/nieuw">
                      <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nieuw project</Button>
                    </Link>
                  )}
                  {hasRole("beheer") && (
                    <Button variant="outline" size="sm" onClick={exportProjecten}>
                      <Download className="h-4 w-4 mr-1" /> Export CSV
                    </Button>
                  )}
                </div>
              </div>
              <table className="w-full text-sm border">
                <thead>
                  <tr className="border-b bg-muted">
                    <th className="text-left p-2">Project</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Categorie</th>
                    <th className="text-left p-2">Soort</th>
                    <th className="text-left p-2">Adviseur</th>
                    <th className="text-left p-2">Prioriteit</th>
                    <th className="text-left p-2">Datum</th>
                    {hasRole("beheer") && <th className="text-left p-2 w-16"></th>}
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-2 font-medium">
                        <Link to={`/project/${p.id}`} className="underline text-primary">
                          {p.projectnaam}
                        </Link>
                      </td>
                      <td className="p-2">{statusBadge(p.status)}</td>
                      <td className="p-2">{p.audit_categorie}</td>
                      <td className="p-2">{p.audit_soort}</td>
                      <td className="p-2">{p.adviseurs?.naam ?? "—"}</td>
                      <td className="p-2">{p.prioriteit ? "Ja" : "Nee"}</td>
                      <td className="p-2">{new Date(p.datum_aangemaakt).toLocaleDateString("nl-NL")}</td>
                      {hasRole("beheer") && (
                        <td className="p-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Project verwijderen?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Weet je zeker dat je "{p.projectnaam}" wilt verwijderen? Alle bijbehorende findings en berichten worden ook verwijderd.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteProject(p.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Verwijderen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {findings.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold mb-2">Findings te beoordelen</h2>
              <table className="w-full text-sm border">
                <thead>
                  <tr className="border-b bg-muted">
                    <th className="text-left p-2">Onderdeel</th>
                    <th className="text-left p-2">Controlepunt</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actie</th>
                  </tr>
                </thead>
                <tbody>
                  {findings.map((f) => (
                    <tr key={f.id} className="border-b">
                      <td className="p-2">{f.onderdeel}</td>
                      <td className="p-2">{f.controlepunt}</td>
                      <td className="p-2">{f.status}</td>
                      <td className="p-2">
                        <Link to={`/finding/${f.id}/beoordeling`} className="underline text-primary">
                          Beoordelen
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {projects.length === 0 && findings.length === 0 && adviseurProjects.length === 0 && (
        <p className="text-muted-foreground">Geen openstaande items.</p>
      )}
    </div>
  );
}
