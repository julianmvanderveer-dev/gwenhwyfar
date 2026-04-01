import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Mic, MicOff } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Forward } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Finding = Tables<"findings">;
type Message = Tables<"messages">;

export default function FindingBeoordeling() {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [finding, setFinding] = useState<Finding | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [opmerking, setOpmerking] = useState("");
  const [uploadVereist, setUploadVereist] = useState(false);
  const [tekenaars, setTekenaars] = useState<{ id: string; naam: string }[]>([]);
  const [selectedTekenaar, setSelectedTekenaar] = useState("");

  const handleSpeech = useCallback((transcript: string) => {
    setOpmerking((prev) => (prev ? prev + " " + transcript : transcript));
  }, []);
  const { listening, toggle, supported } = useSpeechRecognition(handleSpeech);

  useEffect(() => {
    if (!id) return;
    loadFinding();
    loadMessages();
    if (hasRole("beheer")) loadMedewerkers();
  }, [id]);

  const loadMedewerkers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("id, naam").eq("actief", true);
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const relevantUsers = (profiles ?? []).filter((p) =>
      (roles ?? []).some((r) => r.user_id === p.id && (r.role === "tekenaar" || r.role === "auditor"))
    );
    setMedewerkers(relevantUsers);
  };

  const hertoewijzen = async (nieuweUserId: string) => {
    await supabase.from("findings").update({ toegewezen_beoordelaar: nieuweUserId } as any).eq("id", id!);
    toast({ title: "Beoordelaar hertoegewezen" });
    loadFinding();
  };

  const loadFinding = async () => {
    const { data } = await supabase.from("findings").select("*").eq("id", id!).single();
    setFinding(data);
  };

  const loadMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("finding_id", id!)
      .order("datum");
    setMessages(data ?? []);
  };

  const akkoord = async () => {
    setLoading(true);
    await supabase.from("findings").update({ status: "reactie_goedgekeurd" as any, goedgekeurd_op: new Date().toISOString() } as any).eq("id", id!);
    toast({ title: "Reactie goedgekeurd", description: "De reactie van de EP-adviseur is goedgekeurd." });
    loadFinding();
    setLoading(false);
  };

  const nietAkkoord = async () => {
    setLoading(true);
    await supabase.from("findings").update({ status: "open" as any, upload_vereist: uploadVereist }).eq("id", id!);
    toast({ title: "Niet akkoord", description: "Finding opnieuw geopend voor de adviseur" });

    // Notify EP-adviseur via e-mail
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

  if (!finding) return <div className="p-4">Laden...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Finding — Beoordeling</h1>

      <div className="border rounded p-3 mb-4 text-sm space-y-1">
        <p><strong>Onderdeel:</strong> {finding.onderdeel}</p>
        <p><strong>Controlepunt:</strong> {finding.controlepunt}</p>
        <p><strong>Beoordeling:</strong> {finding.beoordeling}</p>
        <p><strong>Type afwijking:</strong> {finding.type_afwijking ?? "—"}</p>
        <p><strong>Deadline:</strong> {finding.deadline ? new Date(finding.deadline).toLocaleDateString("nl-NL") : "—"}</p>
        <p><strong>Status:</strong> {finding.status}</p>
      </div>

      {hasRole("beheer") && medewerkers.length > 0 && (
        <div className="border rounded p-3 mb-4">
          <label className="text-sm font-medium mb-1 block">Beoordelaar hertoewijzen</label>
          <Select
            value={(finding as any).toegewezen_beoordelaar ?? ""}
            onValueChange={hertoewijzen}
          >
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

      <div className="mb-4">
        <h2 className="font-semibold mb-2">Berichtenthread</h2>
        {messages.length > 0 ? (
          <div className="space-y-2">
            {messages.map((m) => (
              <div key={m.id} className="border rounded p-2 text-sm">
                <p className="text-muted-foreground text-xs">{new Date(m.datum).toLocaleString("nl-NL")}</p>
                <p>{m.bericht}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nog geen berichten.</p>
        )}
      </div>

      {finding.status === "reactie_ontvangen" && (
        <div className="space-y-3">
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
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Checkbox
              id="uploadVereist"
              checked={uploadVereist}
              onCheckedChange={(v) => setUploadVereist(v === true)}
            />
            <label htmlFor="uploadVereist" className="text-sm cursor-pointer">
              Eis dat EP-adviseur extra documentatie uploadt
            </label>
          </div>
          <div className="flex gap-2">
            <Button onClick={akkoord} disabled={loading}>Akkoord</Button>
            <Button variant="outline" onClick={nietAkkoord} disabled={loading}>Niet akkoord</Button>
          </div>
        </div>
      )}

      <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>
        Terug
      </Button>
    </div>
  );
}
