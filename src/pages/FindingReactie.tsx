import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Finding = Tables<"findings">;
type Message = Tables<"messages">;

export default function FindingReactie() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [finding, setFinding] = useState<Finding | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [bericht, setBericht] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadFinding();
    loadMessages();
  }, [id]);

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

  const verzendReactie = async () => {
    if (!bericht.trim() || !user || !finding) return;
    setLoading(true);

    await supabase.from("messages").insert({
      finding_id: id!,
      afzender_id: user.id,
      bericht: bericht.trim(),
    });
    await supabase.from("findings").update({ status: "reactie_ontvangen" as any }).eq("id", id!);

    // Check if all open findings for this project are now answered
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
        description: "Alle findings voor dit project zijn beantwoord. De reacties worden beoordeeld.",
      });
    } else {
      toast({ title: "Reactie verzonden", description: `Nog ${remaining.length} finding(s) open.` });
    }

    setBericht("");
    loadMessages();
    loadFinding();
    setLoading(false);
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
      </div>

      {messages.length > 0 && (
        <div className="mb-4">
          <h2 className="font-semibold mb-2">Berichten</h2>
          <div className="space-y-2">
            {messages.map((m) => (
              <div key={m.id} className="border rounded p-2 text-sm">
                <p className="text-muted-foreground text-xs">{new Date(m.datum).toLocaleString("nl-NL")}</p>
                <p>{m.bericht}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {finding.status !== "gesloten" && finding.status !== "reactie_ontvangen" && (
        <div>
          <Textarea
            value={bericht}
            onChange={(e) => setBericht(e.target.value)}
            placeholder="Typ je reactie..."
            className="mb-2"
          />
          <Button onClick={verzendReactie} disabled={loading || !bericht.trim()}>
            Reactie verzenden
          </Button>
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
