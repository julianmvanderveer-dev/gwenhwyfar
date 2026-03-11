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


  const createSignedUrl = async (path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from("finding-documents").createSignedUrl(path, 3600);
    if (error) return null;
    return data?.signedUrl ?? null;
  };

  const accepteren = async () => {
    if (!user || !finding) return;
    setLoading(true);
    try {
      const [msgResult, updateResult] = await Promise.all([
        supabase.from("messages").insert({
          finding_id: id!,
          afzender_id: user.id,
          bericht: "Afwijking geaccepteerd",
        }),
        supabase.from("findings").update({ status: "reactie_ontvangen" }).eq("id", id!),
      ]);
      if (msgResult.error) throw msgResult.error;
      if (updateResult.error) throw updateResult.error;

      await checkRemainingFindings();
      setBericht("");
      loadMessages();
      loadFinding();
    } catch (err: any) {
      toast({ title: "Fout bij accepteren", description: err.message, variant: "destructive" });
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
        if (!bijlagePad) return; // upload failed, toast already shown
      }

      const [msgResult, updateResult] = await Promise.all([
        supabase.from("messages").insert({
          finding_id: id!,
          afzender_id: user.id,
          bericht: bericht.trim(),
          bijlage_pad: bijlagePad,
        }),
        supabase.from("findings").update({ status: "reactie_ontvangen" }).eq("id", id!),
      ]);
      if (msgResult.error) throw msgResult.error;
      if (updateResult.error) throw updateResult.error;

      await checkRemainingFindings();
      setBericht("");
      setBestand(null);
      setModus("keuze");
      loadMessages();
      loadFinding();
    } catch (err: any) {
      toast({ title: "Fout bij verzenden reactie", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const checkRemainingFindings = async () => {
    if (!finding) return;
    const { data: remaining } = await supabase
      .from("findings")
      .select("id")
      .eq("project_id", finding.project_id)
      .eq("status", "open")
      .eq("zichtbaar_voor_adviseur", true)
      .neq("id", id!);

    if (!remaining || remaining.length === 0) {
      toast({
        title: "Alles ingediend!",
        description: "Alle findings voor dit project zijn beantwoord.",
      });
    } else {
      toast({ title: "Reactie verzonden", description: `Nog ${remaining.length} finding(s) open.` });
    }
  };

  const handleDownload = async (path: string) => {
    const url = await createSignedUrl(path);
    if (url) window.open(url, "_blank");
  };

  if (!finding) return <div className="p-4">Laden...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Finding — Reactie</h1>

      <div className="border rounded p-3 mb-4 text-sm space-y-1">
        <p><strong>Onderdeel:</strong> {finding.onderdeel}</p>
        <p><strong>Controlepunt:</strong> {finding.controlepunt}</p>
        <p><strong>Beoordeling:</strong> {finding.beoordeling}</p>
        <p><strong>Type afwijking:</strong> {finding.type_afwijking ?? "—"}</p>
        <p><strong>Deadline:</strong> {finding.deadline ? new Date(finding.deadline).toLocaleDateString("nl-NL") : "—"}</p>
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
          {modus === "keuze" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Kies je reactie op deze afwijking:</p>
              <div className="flex gap-2">
                <Button onClick={accepteren} disabled={loading} className="gap-1">
                  <Check className="h-4 w-4" /> Accepteren
                </Button>
                <Button variant="outline" onClick={() => setModus("niet_akkoord")} disabled={loading} className="gap-1">
                  <X className="h-4 w-4" /> Niet akkoord
                </Button>
              </div>
            </div>
          )}

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
                <Button onClick={nietAkkoord} disabled={loading || !bericht.trim()}>
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
