import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Finding = Tables<"findings">;
type Message = Tables<"messages">;

export default function FindingBeoordeling() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [finding, setFinding] = useState<Finding | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
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

  const akkoord = async () => {
    setLoading(true);
    await supabase.from("findings").update({ status: "gesloten" as any }).eq("id", id!);
    toast({ title: "Finding gesloten", description: "Beoordeling: akkoord" });
    loadFinding();
    setLoading(false);
  };

  const nietAkkoord = async () => {
    setLoading(true);
    await supabase.from("findings").update({ status: "open" as any }).eq("id", id!);
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
        <div className="flex gap-2">
          <Button onClick={akkoord} disabled={loading}>Akkoord</Button>
          <Button variant="outline" onClick={nietAkkoord} disabled={loading}>Niet akkoord</Button>
        </div>
      )}

      <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>
        Terug
      </Button>
    </div>
  );
}
