import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Mic, MicOff, Upload, FileText, Download, Check, X } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

import type { Tables } from "@/integrations/supabase/types";

type Finding = Tables<"findings">;
type Message = Tables<"messages">;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function FindingReactie() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [finding, setFinding] = useState<Finding | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [bericht, setBericht] = useState("");
  const [loading, setLoading] = useState(false);
  const [modus, setModus] = useState<"keuze" | "niet_akkoord">("keuze");
  const [bestand, setBestand] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSpeech = useCallback((transcript: string) => {
    setBericht((prev) => (prev ? prev + " " + transcript : transcript));
  }, []);
  const { listening, toggle, supported } = useSpeechRecognition(handleSpeech);

  useEffect(() => {
    if (!id) return;
    loadFinding();
    loadMessages();
  }, [id]);

  const loadFinding = async () => {
    const { data, error } = await supabase.from("findings").select("*").eq("id", id!).maybeSingle();
    if (error) {
      toast({ title: "Fout bij laden finding", description: error.message, variant: "destructive" });
      return;
    }
    if (!data) {
      toast({ title: "Finding niet gevonden", variant: "destructive" });
      return;
    }
    setFinding(data);
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("finding_id", id!)
      .order("datum");
    if (error) {
      toast({ title: "Fout bij laden berichten", description: error.message, variant: "destructive" });
      return;
    }
    setMessages(data ?? []);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "Bestand te groot", description: "Maximaal 10 MB toegestaan.", variant: "destructive" });
      return;
    }
    setBestand(file);
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!bestand || !id) return null;
    const ext = bestand.name.split(".").pop();
    const path = `${id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("finding-documents").upload(path, bestand);
    if (error) {
      toast({ title: "Upload mislukt", description: error.message, variant: "destructive" });
      return null;
    }
    return path;
  };

  const handleDownload = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("finding-documents")
      .createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) {
      toast({ title: "Download mislukt", description: "Kan geen downloadlink aanmaken.", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const accepteren = async () => {
    if (!user || !finding) return;
    setLoading(true);
    try {
      const concept = {
        type: "akkoord",
        bericht: "Afwijking geaccepteerd",
        opgeslagen_op: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("findings")
        .update({ concept_reactie: concept as any })
        .eq("id", id!);
      if (error) throw error;
      toast({
        title: "Concept opgeslagen",
        description: "Verstuur al je reacties in één keer via het projectoverzicht.",
      });
      loadFinding();
    } catch (err: any) {
      toast({ title: "Fout bij opslaan", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const nietAkkoord = async () => {
    if (!bericht.trim() || !user || !finding) return;
    setLoading(true);
    try {
      let bijlagePad: string | null = null;
      if (bestand) {
        bijlagePad = await uploadFile();
        if (!bijlagePad) return;
      }

      const concept = {
        type: "niet_akkoord",
        bericht: bericht.trim(),
        bijlage_pad: bijlagePad,
        opgeslagen_op: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("findings")
        .update({ concept_reactie: concept as any })
        .eq("id", id!);
      if (error) throw error;
      toast({
        title: "Concept opgeslagen",
        description: "Verstuur al je reacties in één keer via het projectoverzicht.",
      });
      setBericht("");
      setBestand(null);
      setModus("keuze");
      loadFinding();
    } catch (err: any) {
      toast({ title: "Fout bij opslaan reactie", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!finding) return <div className="p-4">Laden...</div>;
  const concept = (finding as any).concept_reactie as
    | { type: string; bericht?: string; bijlage_pad?: string | null; opgeslagen_op: string }
    | null;
  const hasConcept = !!concept;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Finding — Reactie</h1>

      <div className="border rounded p-3 mb-4 text-sm space-y-1">
        <p><strong>Onderdeel:</strong> {finding.onderdeel}</p>
        <p><strong>Controlepunt:</strong> {finding.controlepunt}</p>
        <p><strong>Beoordeling:</strong> {finding.beoordeling}</p>
        <p><strong>Type afwijking:</strong> {finding.type_afwijking ?? "—"}</p>
        <p><strong>Status:</strong> {finding.status}</p>
        {finding.toelichting && <p><strong>Toelichting:</strong> {finding.toelichting}</p>}
      </div>

      {messages.length > 0 && (
        <div className="mb-4">
          <h2 className="font-semibold mb-2">Berichten</h2>
          <div className="space-y-2">
            {messages.map((m) => (
              <div key={m.id} className="border rounded p-2 text-sm">
                <p className="text-muted-foreground text-xs">{new Date(m.datum).toLocaleString("nl-NL")}</p>
                <p>{m.bericht}</p>
                {m.bijlage_pad && (
                  <button
                    onClick={() => handleDownload(m.bijlage_pad!)}
                    className="flex items-center gap-1 mt-1 text-xs text-accent hover:underline"
                  >
                    <Download className="h-3 w-3" />
                    Bijlage downloaden
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {finding.status !== "gesloten" && finding.status !== "reactie_ontvangen" && (
        <div>
          {hasConcept && (
            <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded p-3 mb-3 text-sm">
              <p className="font-medium">Concept-reactie opgeslagen</p>
              <p className="text-xs mt-1">
                {concept!.type === "akkoord" ? "Afwijking geaccepteerd" : "Niet akkoord"} —
                opgeslagen op {new Date(concept!.opgeslagen_op).toLocaleString("nl-NL")}.
                Ga naar het projectoverzicht om alle reacties in één keer te versturen. Je kunt deze
                reactie hieronder nog wijzigen tot dat moment.
              </p>
            </div>
          )}
          {(finding as any).upload_vereist && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded p-3 mb-3 text-sm">
              ⚠️ De beoordelaar vereist dat je een document uploadt bij je reactie.
            </div>
          )}

          {modus === "keuze" && (() => {
            const isAkkoord = concept?.type === "akkoord";
            const isNietAkkoord = concept?.type === "niet_akkoord";
            return (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {hasConcept ? "Wijzig je concept-reactie of laat zoals hij is:" : "Kies je reactie op deze afwijking:"}
                </p>
                <div className="flex gap-2">
                  {!(finding as any).upload_vereist && (
                    <Button
                      onClick={accepteren}
                      disabled={loading || isAkkoord}
                      variant={isAkkoord ? "secondary" : "default"}
                      className="gap-1"
                    >
                      <Check className="h-4 w-4" /> {isAkkoord ? "Geaccepteerd (concept)" : "Accepteren"}
                    </Button>
                  )}
                  <Button
                    variant={isNietAkkoord ? "secondary" : "outline"}
                    onClick={() => setModus("niet_akkoord")}
                    disabled={loading}
                    className="gap-1"
                  >
                    <X className="h-4 w-4" /> {isNietAkkoord ? "Wijzig: niet akkoord" : "Niet akkoord"}
                  </Button>
                </div>
                {hasConcept && finding.project_id && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-blue-700 underline"
                    onClick={() => navigate(`/project/${finding.project_id}`)}
                  >
                    Naar projectoverzicht om alles te versturen →
                  </Button>
                )}
              </div>
            );
          })()}

          {modus === "niet_akkoord" && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Reactie (verplicht)</p>
              <div className="flex items-start gap-1">
                <Textarea
                  value={bericht}
                  onChange={(e) => setBericht(e.target.value)}
                  placeholder="Geef je reactie waarom je niet akkoord gaat..."
                />
                {supported && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={`shrink-0 ${listening ? "text-red-500 animate-pulse" : ""}`}
                    onClick={toggle}
                    title={listening ? "Stop opname" : "Spraak invoer"}
                  >
                    {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                )}
              </div>

              {/* File upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1"
                >
                  <Upload className="h-4 w-4" /> Document bijvoegen
                </Button>
                <span className="text-xs text-muted-foreground ml-2">Max 10 MB</span>
                {bestand && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    {bestand.name}
                    <button onClick={() => setBestand(null)} className="text-destructive ml-1 hover:underline text-xs">
                      Verwijder
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={nietAkkoord} disabled={loading || !bericht.trim() || ((finding as any).upload_vereist && !bestand)}>
                  Reactie verzenden
                </Button>
                <Button variant="ghost" onClick={() => { setModus("keuze"); setBericht(""); setBestand(null); }}>
                  Annuleren
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {finding.status === "reactie_ontvangen" && (
        <p className="text-sm text-muted-foreground">Je reactie is ingediend en wordt beoordeeld.</p>
      )}

      <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>
        Terug
      </Button>
    </div>
  );
}
