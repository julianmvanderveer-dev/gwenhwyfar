import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { History, Paperclip } from "lucide-react";

type Msg = { id: string; afzender_id: string; bericht: string; datum: string; bijlage_pad: string | null };

const isAuditorBesluit = (b: string) =>
  b.startsWith("[Goedgekeurd]") || b.startsWith("[Niet akkoord") || b.startsWith("[Afwijking vervallen]");

const besluitLabel = (b: string) => {
  if (b.includes("Afwijking vervallen")) return "Afwijking vervalt";
  if (b.startsWith("[Goedgekeurd]")) return "Goedgekeurd";
  if (b.startsWith("[Niet akkoord")) return "Niet akkoord — heropend";
  return null;
};

export default function FindingHistorie({ findingId, titel }: { findingId: string; titel?: string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [namen, setNamen] = useState<Record<string, string>>({});
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, afzender_id, bericht, datum, bijlage_pad")
        .eq("finding_id", findingId)
        .order("datum", { ascending: true });
      const m = (data ?? []) as Msg[];
      setMsgs(m);
      const ids = [...new Set(m.map((x) => x.afzender_id))];
      if (ids.length) {
        const { data: p } = await supabase.from("profiles").select("id, naam").in("id", ids);
        setNamen(Object.fromEntries((p ?? []).map((x: any) => [x.id, x.naam])));
      }
      const u: Record<string, string> = {};
      for (const x of m) {
        if (!x.bijlage_pad) continue;
        for (const path of x.bijlage_pad.split(",").map((s) => s.trim()).filter(Boolean)) {
          const { data: s } = await supabase.storage.from("finding-documents").createSignedUrl(path, 3600);
          if (s?.signedUrl) u[path] = s.signedUrl;
        }
      }
      setUrls(u);
    })();
  }, [open, findingId]);

  // Rondes: een ronde eindigt bij elk auditorbesluit.
  const rondes: Msg[][] = [];
  let cur: Msg[] = [];
  for (const m of msgs) {
    cur.push(m);
    if (isAuditorBesluit(m.bericht)) { rondes.push(cur); cur = []; }
  }
  if (cur.length) rondes.push(cur);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full border border-input px-2 py-0.5 text-[10px] font-semibold text-muted-foreground hover:bg-muted"
        title="Reactiehistorie bekijken"
      >
        <History className="h-3 w-3" /> Historie
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reactiehistorie{titel ? ` — ${titel}` : ""}</DialogTitle>
          </DialogHeader>
          {rondes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen reacties op deze bevinding.</p>
          ) : (
            <div className="space-y-5">
              {rondes.map((r, i) => (
                <div key={i}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Ronde {i + 1}</div>
                  <ol className="space-y-2 border-l-2 border-border pl-4">
                    {r.map((m) => {
                      const label = besluitLabel(m.bericht);
                      return (
                        <li key={m.id} className="text-sm">
                          <div className="text-xs text-muted-foreground">
                            {namen[m.afzender_id] ?? "Onbekend"} · {new Date(m.datum).toLocaleString("nl-NL")}
                            {label && <span className="ml-2 rounded bg-primary/10 text-primary px-1.5 py-0.5 font-semibold">{label}</span>}
                          </div>
                          <div className="whitespace-pre-wrap">{m.bericht}</div>
                          {m.bijlage_pad && (
                            <div className="mt-1 flex flex-wrap gap-2">
                              {m.bijlage_pad.split(",").map((s) => s.trim()).filter(Boolean).map((p) =>
                                urls[p] && /\.(png|jpe?g|gif|webp)$/i.test(p) ? (
                                  <a key={p} href={urls[p]} target="_blank" rel="noreferrer">
                                    <img src={urls[p]} alt="bijlage" className="h-20 rounded border" />
                                  </a>
                                ) : (
                                  <a key={p} href={urls[p]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary underline">
                                    <Paperclip className="h-3 w-3" /> {p.split("/").pop()}
                                  </a>
                                ),
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
