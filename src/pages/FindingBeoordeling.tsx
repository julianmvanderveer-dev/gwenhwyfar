import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Mic, MicOff, Forward, Download, CheckCircle2, AlertTriangle, ChevronDown } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import AudioVisualizer from "@/components/AudioVisualizer";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Tables } from "@/integrations/supabase/types";
import BatchVersturenCompact from "@/components/projecten/BatchVersturenCompact";

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
  const [autoClosed, setAutoClosed] = useState(false);
  const [modus, setModus] = useState<"keuze" | "niet_akkoord">("keuze");
  const [andereActiesOpen, setAndereActiesOpen] = useState(false);

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

  const adviseurHeeftGeaccepteerd = () => {
    if (!adviseurContext?.user_id) return false;
    return messages.some(
      (m) => m.afzender_id === adviseurContext.user_id && m.bericht.trim() === "Afwijking geaccepteerd"
    );
  };

  const vereistAuditorActie = () => {
    if (!finding) return false;
    return finding.upload_vereist === true || finding.type_afwijking === "kritiek";
  };

  // Auto-concept: als adviseur akkoord ging en geen auditoractie nodig is, vul automatisch
  // een akkoord-concept zodat het in de batch meegenomen wordt door de auditor.
  useEffect(() => {
    if (!finding || !adviseurContext) return;
    if (finding.status !== "reactie_ontvangen") return;
    if (!adviseurHeeftGeaccepteerd()) return;
    if (vereistAuditorActie()) return;
    if ((finding as any).concept_beoordeling) return;

    (async () => {
      const concept = {
        type: "akkoord",
        toelichting: "Automatisch akkoord — adviseur accepteerde afwijking, geen kritieke punten.",
        opgeslagen_op: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("findings")
        .update({ concept_beoordeling: concept as any })
        .eq("id", id!);
      if (!error) {
        setAutoClosed(true);
        loadFinding();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finding?.id, finding?.status, messages.length, adviseurContext?.user_id]);

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
    const concept = {
      type: "akkoord",
      opgeslagen_op: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("findings")
      .update({ concept_beoordeling: concept as any })
      .eq("id", id!);
    if (error) {
      toast({ title: "Fout bij opslaan", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Concept opgeslagen",
        description: "Verstuur al je beoordelingen in één keer via het projectoverzicht.",
      });
      loadFinding();
    }
    setLoading(false);
  };

  const nietAkkoord = async () => {
    setLoading(true);
    const concept = {
      type: "niet_akkoord",
      toelichting: opmerking.trim() || null,
      upload_vereist: uploadVereist,
      opgeslagen_op: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("findings")
      .update({ concept_beoordeling: concept as any })
      .eq("id", id!);
    if (error) {
      toast({ title: "Fout bij opslaan", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Concept opgeslagen",
        description: "Verstuur al je beoordelingen in één keer via het projectoverzicht.",
      });
      loadFinding();
      setModus("keuze");
      setOpmerking("");
      setUploadVereist(false);
    }
    setLoading(false);
  };

  const getAfzenderLabel = (message: Message) => {
    if (adviseurContext?.user_id && message.afzender_id === adviseurContext.user_id) {
      return adviseurContext.naam ? `EP-adviseur — ${adviseurContext.naam}` : "EP-adviseur";
    }
    return "Interne medewerker";
  };

  if (!finding) return <div className="p-4">Laden...</div>;

  const adviseurAkkoord = adviseurHeeftGeaccepteerd();
  const auditorActieNodig = vereistAuditorActie();
  const showBeoordeling = finding.status === "reactie_ontvangen";
  const isAfgesloten = finding.status === "reactie_goedgekeurd";

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
          <p><strong>Status:</strong> {formatValue(finding.status)}</p>
        </div>
        {finding.toelichting && (
          <div className="border-t pt-3">
            <p className="font-medium mb-1">Originele toelichting</p>
            <p className="whitespace-pre-wrap text-muted-foreground">{finding.toelichting}</p>
          </div>
        )}
      </section>

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

      {isAfgesloten && adviseurAkkoord && (
        <section className="border border-green-200 rounded-lg bg-green-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-700 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-green-900">Afwijking geaccepteerd door EP-adviseur</p>
              <p className="text-green-800 mt-1">
                {autoClosed
                  ? "De adviseur ging akkoord met de afwijking. Omdat het geen kritieke bevinding is en er geen documentatie vereist was, is deze automatisch afgesloten — geen verdere actie nodig."
                  : "Deze bevinding is afgesloten."}
              </p>
            </div>
          </div>
        </section>
      )}

      {showBeoordeling && adviseurAkkoord && auditorActieNodig && (
        <section className="border border-yellow-200 rounded-lg bg-yellow-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-700 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-900">Beoordeling blijft nodig</p>
              <p className="text-yellow-800 mt-1">
                De EP-adviseur heeft de afwijking geaccepteerd, maar deze is{" "}
                {finding.type_afwijking === "kritiek" && finding.upload_vereist
                  ? "kritiek én er was documentatie vereist"
                  : finding.type_afwijking === "kritiek"
                  ? "kritiek (KT)"
                  : "documentatie-plichtig"}
                . Beoordeel hieronder of je akkoord gaat.
              </p>
            </div>
          </div>
        </section>
      )}

      {showBeoordeling && (
        <section className="border rounded-lg bg-card p-4 shadow-sm space-y-3">
          <div>
            <h2 className="font-semibold">Beoordeling door Auditor</h2>
            <p className="text-muted-foreground text-xs">Beoordeel de reactie van de EP-adviseur.</p>
          </div>
          {(finding as any).concept_beoordeling && (
            <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-700 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">
                  Concept opgeslagen —{" "}
                  {((finding as any).concept_beoordeling as any).type === "akkoord"
                    ? "Goedgekeurd"
                    : "Niet akkoord (heropenen voor adviseur)"}
                </p>
                <p className="mt-1 text-xs">
                  Nog niet verstuurd. Ga naar het projectoverzicht om alle beoordelingen in één keer te
                  versturen, of pas hieronder je keuze aan.
                </p>
                {finding.project_id && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 mt-1 text-emerald-900 underline"
                    onClick={() => navigate(`/project/${finding.project_id}`)}
                  >
                    Naar projectoverzicht →
                  </Button>
                )}
              </div>
            </div>
          )}

          {modus === "keuze" && (() => {
            const concept = (finding as any).concept_beoordeling as { type: string } | null;
            const isAkkoord = concept?.type === "akkoord";
            const isNietAkkoord = concept?.type === "niet_akkoord";
            return (
              <div className="flex gap-2">
                <Button
                  onClick={akkoord}
                  disabled={loading || isAkkoord}
                  variant={isAkkoord ? "secondary" : "default"}
                  className="gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isAkkoord ? "Goedgekeurd (concept)" : "Reactie goedkeuren"}
                </Button>
                <Button
                  variant={isNietAkkoord ? "secondary" : "outline"}
                  onClick={() => setModus("niet_akkoord")}
                  disabled={loading}
                >
                  {isNietAkkoord ? "Wijzig: niet akkoord" : "Niet akkoord"}
                </Button>
              </div>
            );
          })()}

          {modus === "niet_akkoord" && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Toelichting (optioneel)</label>
                <div className="flex items-start gap-1">
                  <Textarea
                    value={opmerking}
                    onChange={(e) => setOpmerking(e.target.value)}
                    placeholder="Leg uit waarom je niet akkoord gaat..."
                    rows={3}
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
              <div className="flex items-center gap-2">
                <Checkbox id="uploadVereist" checked={uploadVereist} onCheckedChange={(v) => setUploadVereist(v === true)} />
                <label htmlFor="uploadVereist" className="text-sm cursor-pointer">
                  Eis dat EP-adviseur extra documentatie uploadt
                </label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={nietAkkoord} disabled={loading}>
                  Bevinding heropenen voor adviseur
                </Button>
                <Button variant="ghost" onClick={() => { setModus("keuze"); setOpmerking(""); setUploadVereist(false); }}>
                  Annuleren
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {(isBeheer || isAuditor) && (
        <Collapsible open={andereActiesOpen} onOpenChange={setAndereActiesOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <ChevronDown className={`h-4 w-4 transition-transform ${andereActiesOpen ? "rotate-180" : ""}`} />
              Andere acties
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-2">
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
          </CollapsibleContent>
        </Collapsible>
      )}

      {finding.project_id && (
        <BatchVersturenCompact projectId={finding.project_id} />
      )}

      <Button variant="ghost" onClick={() => navigate("/inbox", { state: { view: "medewerker", tab: "findings" } })}>
        Terug
      </Button>
    </div>
  );
}
