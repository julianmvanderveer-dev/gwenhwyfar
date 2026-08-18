import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProjectRole } from "@/hooks/useProjectRole";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Upload, Download, Loader2, CheckCircle2, XCircle, FileUp } from "lucide-react";

type Herafmelding = {
  id: string;
  project_id: string;
  bestandsnaam: string;
  bestand_pad: string | null;
  toelichting: string | null;
  status: string;
  afkeur_reden: string | null;
  beoordeeld_op: string | null;
  created_at: string;
};

type Props = {
  projectId: string;
  projectStatus: string;
  onChanged?: () => void;
};

export default function Herafmelding({ projectId, projectStatus, onChanged }: Props) {
  const { user } = useAuth();
  const { isAdviseurVanProject, magAuditorActiesDoen } = useProjectRole(projectId);
  const [items, setItems] = useState<Herafmelding[]>([]);
  const [busy, setBusy] = useState(false);
  const [toelichting, setToelichting] = useState("");
  const [afkeurReden, setAfkeurReden] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("herafmeldingen")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    setItems((data as unknown as Herafmelding[]) ?? []);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const actueel = items[0];
  const relevant = projectStatus === "wacht_op_herafmelding" || items.length > 0;
  if (!relevant) return null;

  const wachtOpUpload =
    projectStatus === "wacht_op_herafmelding" &&
    (!actueel || actueel.status === "afgekeurd");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Alleen PDF", description: "Upload het nieuwe label als PDF-bestand.", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Bestand te groot", description: "Maximaal 20MB.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const pad = `${projectId}/herafmelding-${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage.from("project-documents").upload(pad, file);
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("herafmeldingen").insert({
        project_id: projectId,
        bestandsnaam: file.name,
        bestand_pad: pad,
        toelichting: toelichting.trim() || null,
        status: "ingediend",
        ingediend_door: user.id,
      } as any);
      if (insErr) throw insErr;

      setToelichting("");
      toast({ title: "Nieuw label ingediend", description: "De auditor beoordeelt uw herafmelding." });
      await load();
      onChanged?.();
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

  const beoordeel = async (goedgekeurd: boolean) => {
    if (!actueel || !user) return;
    if (!goedgekeurd && !afkeurReden.trim()) {
      toast({ title: "Reden verplicht", description: "Geef aan waarom de herafmelding wordt afgekeurd.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase
        .from("herafmeldingen")
        .update({
          status: goedgekeurd ? "goedgekeurd" : "afgekeurd",
          afkeur_reden: goedgekeurd ? null : afkeurReden.trim(),
          beoordeeld_door: user.id,
          beoordeeld_op: new Date().toISOString(),
        } as any)
        .eq("id", actueel.id);
      if (error) throw error;

      if (goedgekeurd) {
        await supabase
          .from("projects")
          .update({ status: "afgerond" as any, gearchiveerd_op: new Date().toISOString() })
          .eq("id", projectId);
      }

      supabase.functions
        .invoke("notify-adviseur", {
          body: {
            type: "herafmelding_beoordeeld",
            project_id: projectId,
            extra: { goedgekeurd, reden: goedgekeurd ? null : afkeurReden.trim() },
          },
        })
        .then(({ error: fnErr }) => {
          if (fnErr) console.error("Notificatie herafmelding fout:", fnErr);
        });

      setAfkeurReden("");
      toast({
        title: goedgekeurd ? "Herafmelding goedgekeurd" : "Herafmelding afgekeurd",
        description: goedgekeurd
          ? "De audit is afgerond."
          : "De EP-adviseur kan een nieuw bewijs aanleveren.",
      });
      await load();
      onChanged?.();
    } catch (err: any) {
      toast({ title: "Beoordelen mislukt", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border rounded-lg bg-card p-4 space-y-4 shadow-sm">
      <div className="flex items-center gap-2">
        <FileUp className="h-4 w-4 text-destructive" />
        <div>
          <h2 className="font-semibold">Nieuwe afmelding (kritieke tekortkoming)</h2>
          <p className="text-xs text-muted-foreground">
            De audit blijft kritiek (KT). Het project moet opnieuw worden afgemeld; het nieuwe label
            wordt hier als PDF aangeleverd en door de auditor beoordeeld.
          </p>
        </div>
      </div>

      {items.length > 0 && (
        <ul className="space-y-2 text-sm">
          {items.map((it) => (
            <li key={it.id} className="border rounded-md p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{it.bestandsnaam}</span>
                <span className="text-xs">
                  {it.status === "goedgekeurd" && <span className="text-green-700">Goedgekeurd</span>}
                  {it.status === "afgekeurd" && <span className="text-destructive">Afgekeurd</span>}
                  {it.status === "ingediend" && <span className="text-amber-700">Wacht op beoordeling</span>}
                </span>
              </div>
              {it.toelichting && <p className="text-muted-foreground">{it.toelichting}</p>}
              {it.afkeur_reden && <p className="text-destructive">Reden afkeuring: {it.afkeur_reden}</p>}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{new Date(it.created_at).toLocaleDateString("nl-NL")}</span>
                {it.bestand_pad && (
                  <button className="inline-flex items-center gap-1 underline" onClick={() => download(it.bestand_pad!)}>
                    <Download className="h-3 w-3" /> Downloaden
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {isAdviseurVanProject && wachtOpUpload && (
        <div className="space-y-2">
          <Textarea
            placeholder="Toelichting (optioneel)"
            value={toelichting}
            onChange={(e) => setToelichting(e.target.value)}
            rows={2}
          />
          <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
          <Button onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Nieuw label (PDF) uploaden
          </Button>
        </div>
      )}

      {magAuditorActiesDoen && actueel?.status === "ingediend" && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-sm font-medium">Beoordeel de nieuwe afmelding</p>
          <Textarea
            placeholder="Reden bij afkeuren"
            value={afkeurReden}
            onChange={(e) => setAfkeurReden(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <Button onClick={() => beoordeel(true)} disabled={busy}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Goedkeuren en audit sluiten
            </Button>
            <Button variant="destructive" onClick={() => beoordeel(false)} disabled={busy}>
              <XCircle className="h-4 w-4 mr-2" /> Afkeuren
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
