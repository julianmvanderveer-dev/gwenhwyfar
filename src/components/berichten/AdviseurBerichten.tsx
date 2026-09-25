import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Paperclip, Pin } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { soortLabel, formatEvenement } from "./berichtSoorten";

type Bericht = Tables<"adviseur_berichten">;

async function eigenAdviseurId(userId: string) {
  const { data } = await supabase.from("adviseurs").select("id").eq("user_id", userId).maybeSingle();
  return data?.id ?? null;
}

// Alleen algemene berichten en berichten gericht aan de eigen adviseur
function voorMij<T extends { adviseur_id: string | null }>(lijst: T[], adviseurId: string | null) {
  return lijst.filter((x) => !x.adviseur_id || x.adviseur_id === adviseurId);
}

export function useOngelezenBerichten() {
  const { user } = useAuth();
  const [aantal, setAantal] = useState(0);
  const laad = async () => {
    if (!user) return;
    const [{ data: b }, { data: g }, adviseurId] = await Promise.all([
      supabase.from("adviseur_berichten").select("id, adviseur_id").eq("actief", true),
      supabase.from("adviseur_berichten_gelezen").select("bericht_id").eq("user_id", user.id),
      eigenAdviseurId(user.id),
    ]);
    const gelezen = new Set((g ?? []).map((x) => x.bericht_id));
    setAantal(voorMij(b ?? [], adviseurId).filter((x) => !gelezen.has(x.id)).length);
  };
  useEffect(() => { laad(); }, [user?.id]);
  return { aantal, reset: () => setAantal(0) };
}

export default function AdviseurBerichten({ onGelezen }: { onGelezen?: () => void }) {
  const { user } = useAuth();
  const [berichten, setBerichten] = useState<Bericht[]>([]);
  const [ongelezen, setOngelezen] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: b }, { data: g }, adviseurId] = await Promise.all([
        supabase.from("adviseur_berichten").select("*").eq("actief", true)
          .order("vastgepind", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("adviseur_berichten_gelezen").select("bericht_id").eq("user_id", user.id),
        eigenAdviseurId(user.id),
      ]);
      const lijst = voorMij(b ?? [], adviseurId);
      const gelezen = new Set((g ?? []).map((x) => x.bericht_id));
      const nieuw = lijst.filter((x) => !gelezen.has(x.id)).map((x) => x.id);
      setBerichten(lijst);
      setOngelezen(new Set(nieuw));
      setLoading(false);
      if (nieuw.length) {
        await supabase.from("adviseur_berichten_gelezen").upsert(nieuw.map((id) => ({ bericht_id: id, user_id: user.id })), { onConflict: "bericht_id,user_id", ignoreDuplicates: true });
        onGelezen?.();
      }
    })();
  }, [user?.id]);


  const openBijlage = async (pad: string) => {
    const { data } = await supabase.storage.from("adviseur-berichten").createSignedUrl(pad, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laden…</p>;
  if (!berichten.length)
    return <div className="border rounded-lg p-8 bg-card text-center text-sm text-muted-foreground">Er zijn nog geen berichten van BengCert.</div>;

  return (
    <div className="space-y-3 max-w-3xl">
      {berichten.map((b) => (
        <article key={b.id} className={`border rounded-lg p-4 bg-card shadow-sm ${b.vastgepind ? "border-accent" : ""}`}>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {b.vastgepind && <Pin className="h-3.5 w-3.5 text-accent" />}
            <Badge variant="secondary">{soortLabel(b.soort)}</Badge>
            {b.adviseur_id && <Badge className="bg-primary text-primary-foreground">Alleen voor u</Badge>}
            {ongelezen.has(b.id) && <Badge className="bg-accent text-accent-foreground">Nieuw</Badge>}
            <span className="ml-auto text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString("nl-NL")}</span>
          </div>
          <h3 className="font-semibold text-base">{b.titel}</h3>
          {(b.evenement_datum || b.evenement_locatie) && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <CalendarDays className="h-4 w-4" /> {formatEvenement(b.evenement_datum, b.evenement_locatie)}
            </p>
          )}
          {b.inhoud && <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed [text-indent:0]">{b.inhoud}</p>}
          {b.bijlage_pad && (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => openBijlage(b.bijlage_pad!)}>
              <Paperclip className="h-4 w-4 mr-1" /> {b.bijlage_naam ?? "Bijlage"}
            </Button>
          )}
        </article>
      ))}
    </div>
  );
}
