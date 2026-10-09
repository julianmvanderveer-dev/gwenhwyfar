import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProjectRole } from "@/hooks/useProjectRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Upload, Download, Loader2, Trash2, Paperclip } from "lucide-react";

type Doc = {
  id: string;
  bestandsnaam: string;
  bestand_pad: string;
  omschrijving: string | null;
  created_at: string;
  geupload_door: string | null;
  profiles?: { naam: string } | null;
};

const ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp";

export default function ExtraDocumenten({ projectId, projectnaam }: { projectId: string; projectnaam?: string }) {
  const { user, roles } = useAuth() as any;
  const { isAdviseurVanProject } = useProjectRole(projectId);
  const isIntern = (roles ?? []).some((r: string) => ["beheer", "auditor", "tekenaar"].includes(r));
  const isBeheer = (roles ?? []).includes("beheer");
  const magUploaden = isAdviseurVanProject || isIntern;
  const [docs, setDocs] = useState<Doc[]>([]);
  const [omschrijving, setOmschrijving] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("project_documenten" as any)
      .select("*, profiles:geupload_door(naam)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    setDocs(((data as unknown) as Doc[]) ?? []);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Bestand te groot", description: "Maximaal 20 MB.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
      const pad = `${projectId}/extra/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("project-documents").upload(pad, file);
      if (upErr) throw upErr;
      const { error } = await supabase.from("project_documenten" as any).insert({
        project_id: projectId,
        bestandsnaam: file.name,
        bestand_pad: pad,
        omschrijving: omschrijving.trim() || null,
        geupload_door: user.id,
      } as any);
      if (error) throw error;

      if (isAdviseurVanProject) {
        const { data: p } = await supabase.from("projects").select("toegewezen_aan").eq("id", projectId).maybeSingle();
        if (p?.toegewezen_aan && p.toegewezen_aan !== user.id) {
          await supabase.from("notificaties").insert({
            user_id: p.toegewezen_aan,
            bericht: `EP-adviseur heeft een extra document geüpload bij project ${projectnaam ?? ""}`.trim(),
          });
        }
        supabase.functions
          .invoke("notify-auditor", { body: { type: "extra_document", project_id: projectId, bestandsnaam: file.name } })
          .then(({ error: mErr }) => mErr && console.error("Notificatie extra document fout:", mErr));
      }

      setOmschrijving("");
      toast({ title: "Document geüpload" });
      await load();
    } catch (err: any) {
      toast({ title: "Upload mislukt", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const download = async (pad: string) => {
    const { data, error } = await supabase.storage.from("project-documents").createSignedUrl(pad, 3600);
    if (error || !data?.signedUrl) {
      toast({ title: "Download mislukt", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const verwijder = async (d: Doc) => {
    if (!confirm(`"${d.bestandsnaam}" verwijderen?`)) return;
    await supabase.storage.from("project-documents").remove([d.bestand_pad]);
    const { error } = await supabase.from("project_documenten" as any).delete().eq("id", d.id);
    if (error) toast({ title: "Verwijderen mislukt", description: error.message, variant: "destructive" });
    await load();
  };

  return (
    <div className="border rounded-lg shadow-sm bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-accent" />
        <h2 className="text-lg font-semibold tracking-tight">Extra documenten</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Aanvullende stukken bij deze audit, los van een auditpunt. Documenten blijven altijd zichtbaar voor de EP-adviseur en de auditor.
      </p>

      {magUploaden && (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Omschrijving (optioneel)"
            value={omschrijving}
            onChange={(e) => setOmschrijving(e.target.value)}
            className="max-w-sm h-9 text-sm"
          />
          <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={upload} />
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Document uploaden
          </Button>
        </div>
      )}

      {docs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nog geen extra documenten.</p>
      ) : (
        <ul className="divide-y border rounded-md text-sm">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{d.bestandsnaam}</p>
                <p className="text-xs text-muted-foreground">
                  {d.omschrijving ? `${d.omschrijving} · ` : ""}
                  {d.profiles?.naam ?? "Onbekend"} · {new Date(d.created_at).toLocaleDateString("nl-NL")}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => download(d.bestand_pad)} className="text-accent hover:underline text-xs flex items-center gap-1">
                  <Download className="h-3 w-3" /> Download
                </button>
                {isBeheer && (
                  <button onClick={() => verwijder(d)} className="text-destructive text-xs" title="Verwijderen">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
