import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Mic, MicOff, Forward, Download } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import AudioVisualizer from "@/components/AudioVisualizer";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";

type Finding = Tables<"findings">;
type Message = Tables<"messages">;

type AdviseurContext = {
  naam: string | null;
  user_id: string | null;
};

const formatValue = (value: string | null) => value?.replace(/_/g, " ") ?? "—";

export default function FindingBeoordeling() {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [finding, setFinding] = useState<Finding | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [opmerking, setOpmerking] = useState("");
  const [uploadVereist, setUploadVereist] = useState(false);
  const [medewerkers, setMedewerkers] = useState<{ id: string; naam: string }[]>([]);
  const [tekenaars, setTekenaars] = useState<{ id: string; naam: string }[]>([]);
  const [selectedTekenaar, setSelectedTekenaar] = useState("");
  const [adviseurContext, setAdviseurContext] = useState<AdviseurContext | null>(null);

  const handleSpeech = useCallback((transcript: string) => {
    setOpmerking((prev) => (prev ? prev + " " + transcript : transcript));
  }, []);
  const { listening, toggle, supported, analyserNode, interimText } = useSpeechRecognition(handleSpeech);

  const isAuditor = hasRole("auditor");
  const isBeheer = hasRole("beheer");

  useEffect(() => {
    if (!id) return;
    loadFinding();
    loadMessages();
    if (isBeheer) loadMedewerkers();
    if (isAuditor) loadTekenaars();
  }, [id, isBeheer, isAuditor]);

  const loadMedewerkers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("id, naam").eq("actief", true);
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const relevantUsers = (profiles ?? []).filter((p) =>
      (roles ?? []).some((r) => r.user_id === p.id && (r.role === "tekenaar" || r.role === "auditor"))
    );
    setMedewerkers(relevantUsers);
  };

  const loadTekenaars = async () => {
    const { data: profiles } = await supabase.from("profiles").select("id, naam").eq("actief", true);
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const tekenaarUsers = (profiles ?? []).filter((p) =>
      (roles ?? []).some((r) => r.user_id === p.id && r.role === "tekenaar")
    );
    setTekenaars(tekenaarUsers);
  };

  const hertoewijzen = async (nieuweUserId: string) => {
    await supabase.from("findings").update({ toegewezen_beoordelaar: nieuweUserId }).eq("id", id!);
    toast({ title: "Beoordelaar hertoegewezen" });
    loadFinding();
  };

  const doorzettenNaarTekenaar = async () => {
    if (!selectedTekenaar || !finding) return;
    setLoading(true);
    await supabase.from("findings").update({
      toegewezen_beoordelaar: selectedTekenaar,
    }).eq("id", id!);

    await supabase.from("notificaties").insert({
      user_id: selectedTekenaar,
      bericht: `Een bevinding is naar jou doorgezet: ${finding.controlepunt} (${finding.onderdeel})`,
    });

    toast({ title: "Doorgezet naar tekenaar", description: "De bevinding is toegewezen aan de geselecteerde tekenaar." });
    loadFinding();
    setSelectedTekenaar("");
    setLoading(false);
  };

  const loadFinding = async () => {
    const { data, error } = await supabase.from("findings").select("*").eq("id", id!).maybeSingle();
    if (error) {
      toast({ title: "Fout bij laden bevinding", description: error.message, variant: "destructive" });
      return;
    }
    if (!data) {
      toast({ title: "Bevinding niet gevonden", variant: "destructive" });
      return;
    }

    setFinding(data);
    const { data: project } = await supabase
      .from("projects")
      .select("adviseurs(naam, user_id)")
      .eq("id", data.project_id)
      .maybeSingle();
    const adviseur = (project as any)?.adviseurs;
    setAdviseurContext({ naam: adviseur?.naam ?? null, user_id: adviseur?.user_id ?? null });
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("finding_id", id!)
      .order("datum", { ascending: true });
    if (error) {
      toast({ title: "Fout bij laden communicatie", description: error.message, variant: "destructive" });
      return;
    }
    setMessages(data ?? []);
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

  const akkoord = async () => {
    setLoading(true);
    await supabase.from("findings").update({ status: "reactie_goedgekeurd", goedgekeurd_op: new Date().toISOString() }).eq("id", id!);
    toast({ title: "Reactie goedgekeurd", description: "De reactie van de EP-adviseur is goedgekeurd." });
    loadFinding();
    setLoading(false);
  };

  const nietAkkoord = async () => {
    setLoading(true);
    await supabase.from("findings").update({ status: "open", upload_vereist: uploadVereist }).eq("id", id!);
    toast({ title: "Niet akkoord", description: "Bevinding opnieuw geopend voor de adviseur" });

    if (finding) {
      supabase.functions.invoke("notify-adviseur", {
        body: { type: "niet_akkoord", project_id: finding.project_id, finding_id: id },
      }).then(({ error }) => {
        if (error) console.error("Notificatie fout:", error);
      });
    }

    loadFinding();
    setLoading(false);
  };

  const getAfzenderLabel = (message: Message) => {
    if (adviseurContext?.user_id && message.afzender_id === adviseurContext.user_id) {
      return adviseurContext.naam ? `EP-adviseur — ${adviseurContext.naam}` : "EP-adviseur";
    }
    return "Interne medewerker";
  };

  if (!finding) return <div className="p-4">Laden...</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold">Bevinding beoordelen</h1>

      <section className="border rounded-lg bg-card p-4 text-sm space-y-3 shadow-sm">
        <div>
          <h2 className="font-semibold text-base">Originele bevinding</h2>
          <p className="text-muted-foreground text-xs">Context waarop de reactie wordt beoordeeld.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <p><strong>Onderdeel:</strong> {finding.onderdeel}</p>
          <p><strong>Controlepunt:</strong> {finding.controlepunt}</p>
          <p><strong>Beoordeling:</strong> {formatValue(finding.beoordeling)}</p>
          <p><strong>Type afwijking:</strong> {formatValue(finding.type_afwijking)}</p>
          <p><strong>Deadline:</strong> {finding.deadline ? new Date(finding.deadline).toLocaleDateString("nl-NL") : "—"}</p>
          <p><strong>Status:</strong> {formatValue(finding.status)}</p>
        </div>
        {finding.toelichting && (
          <div className="border-t pt-3">
            <p className="font-medium mb-1">Originele toelichting</p>
            <p className="whitespace-pre-wrap text-muted-foreground">{finding.toelichting}</p>
          </div>
        )}
      </section>

      {isBeheer && medewerkers.length > 0 && (
        <div className="border rounded-lg bg-card p-3">
          <label className="text-sm font-medium mb-1 block">Beoordelaar hertoewijzen</label>
          <Select value={finding.toegewezen_beoordelaar ?? ""} onValueChange={hertoewijzen}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Selecteer medewerker" />
            </SelectTrigger>
            <SelectContent>
              {medewerkers.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.naam}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isAuditor && tekenaars.length > 0 && (
        <div className="border rounded-lg bg-card p-3">
          <label className="text-sm font-medium mb-1 block">Doorzetten naar tekenaar</label>
          <div className="flex items-center gap-2">
            <Select value={selectedTekenaar} onValueChange={setSelectedTekenaar}>
              <SelectTrigger className="h-9 text-sm flex-1">
                <SelectValue placeholder="Selecteer tekenaar" />
              </SelectTrigger>
              <SelectContent>
                {tekenaars.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.naam}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" disabled={!selectedTekenaar || loading} onClick={doorzettenNaarTekenaar} className="gap-1.5 shrink-0">
              <Forward className="h-4 w-4" />
              Doorzetten
            </Button>
          </div>
        </div>
      )}

      <section className="border rounded-lg bg-card p-4 shadow-sm">
        <h2 className="font-semibold mb-1">Communicatie over deze bevinding</h2>
        <p className="text-muted-foreground text-xs mb-3">Alle reacties en bijlagen in chronologische volgorde.</p>
        {messages.length > 0 ? (
          <div className="space-y-2">
            {messages.map((m) => (
              <div key={m.id} className="border rounded p-3 text-sm bg-background">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="font-medium">{getAfzenderLabel(m)}</p>
                  <p className="text-muted-foreground text-xs whitespace-nowrap">{new Date(m.datum).toLocaleString("nl-NL")}</p>
                </div>
                <p className="whitespace-pre-wrap">{m.bericht}</p>
                {m.bijlage_pad && (
                  <Button variant="link" size="sm" className="h-auto p-0 mt-2 gap-1 text-accent" onClick={() => handleDownload(m.bijlage_pad!)}>
                    <Download className="h-3.5 w-3.5" />
                    Bijlage downloaden
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nog geen communicatie.</p>
        )}
      </section>

      {finding.status === "reactie_ontvangen" && (
        <section className="border rounded-lg bg-card p-4 shadow-sm space-y-3">
          <div>
            <h2 className="font-semibold">Beoordeling door Auditor</h2>
            <p className="text-muted-foreground text-xs">Beoordeel hieronder de reactie en communicatie van de EP-adviseur.</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Opmerking (optioneel)</label>
            <div className="flex items-start gap-1">
              <Textarea
                value={opmerking}
                onChange={(e) => setOpmerking(e.target.value)}
                placeholder="Eventuele opmerking bij je beoordeling..."
                rows={2}
                className="text-sm"
              />
              {supported && (
                <div className="flex items-center gap-1 shrink-0">
                  <AudioVisualizer analyserNode={analyserNode} active={listening} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={`shrink-0 ${listening ? "text-destructive animate-pulse" : ""}`}
                    onClick={toggle}
                    title={listening ? "Stop opname" : "Spraak invoer"}
                  >
                    {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
            {listening && interimText && (
              <p className="text-xs text-muted-foreground italic">{interimText}…</p>
            )}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Checkbox id="uploadVereist" checked={uploadVereist} onCheckedChange={(v) => setUploadVereist(v === true)} />
            <label htmlFor="uploadVereist" className="text-sm cursor-pointer">
              Eis dat EP-adviseur extra documentatie uploadt
            </label>
          </div>
          <div className="flex gap-2">
            <Button onClick={akkoord} disabled={loading}>Akkoord</Button>
            <Button variant="outline" onClick={nietAkkoord} disabled={loading}>Niet akkoord</Button>
          </div>
        </section>
      )}

      <Button variant="ghost" onClick={() => navigate(-1)}>
        Terug
      </Button>
    </div>
  );
}
