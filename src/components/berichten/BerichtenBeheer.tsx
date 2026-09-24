import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Eye, EyeOff, Pencil, Pin, Plus, Trash2, X } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { BERICHT_SOORTEN, soortLabel, formatEvenement } from "./berichtSoorten";

type Bericht = Tables<"adviseur_berichten">;
type Form = { id?: string; soort: string; titel: string; inhoud: string; evenement_datum: string; evenement_locatie: string; vastgepind: boolean; adviseur_id: string; mailen: boolean; bijlage_pad: string | null; bijlage_naam: string | null };
const leeg: Form = { soort: "algemeen", titel: "", inhoud: "", evenement_datum: "", evenement_locatie: "", vastgepind: false, adviseur_id: "alle", mailen: false, bijlage_pad: null, bijlage_naam: null };

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function BerichtenBeheer() {
  const { user } = useAuth();
  const [berichten, setBerichten] = useState<Bericht[]>([]);
  const [adviseurs, setAdviseurs] = useState<{ id: string; naam: string; nummer: number }[]>([]);
  const [gelezen, setGelezen] = useState<Record<string, number>>({});
  const [form, setForm] = useState<Form | null>(null);
  const [bestand, setBestand] = useState<File | null>(null);
  const [bezig, setBezig] = useState(false);

  const laad = async () => {
    const [{ data: b }, { data: a }, { data: g }] = await Promise.all([
      supabase.from("adviseur_berichten").select("*").order("vastgepind", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("adviseurs").select("id, naam, nummer").eq("actief", true).order("naam"),
      supabase.from("adviseur_berichten_gelezen").select("bericht_id"),
    ]);
    setBerichten(b ?? []);
    setAdviseurs(a ?? []);
    const t: Record<string, number> = {};
    (g ?? []).forEach((x) => { t[x.bericht_id] = (t[x.bericht_id] ?? 0) + 1; });
    setGelezen(t);
  };
  useEffect(() => { laad(); }, []);

  const adviseurNaam = (id: string | null) => adviseurs.find((a) => a.id === id)?.naam ?? "adviseur";

  const opslaan = async () => {
    if (!form || !form.titel.trim()) { toast.error("Vul een titel in"); return; }
    setBezig(true);
    try {
      let bijlage_pad = form.bijlage_pad, bijlage_naam = form.bijlage_naam;
      if (bestand) {
        const pad = `${crypto.randomUUID()}-${bestand.name.replace(/[^\w.\-]/g, "_")}`;
        const { error } = await supabase.storage.from("adviseur-berichten").upload(pad, bestand);
        if (error) throw error;
        bijlage_pad = pad; bijlage_naam = bestand.name;
      }
      const rij = {
        soort: form.soort, titel: form.titel.trim(), inhoud: form.inhoud,
        evenement_datum: form.evenement_datum ? new Date(form.evenement_datum).toISOString() : null,
        evenement_locatie: form.evenement_locatie || null,
        vastgepind: form.vastgepind,
        adviseur_id: form.adviseur_id === "alle" ? null : form.adviseur_id,
        bijlage_pad, bijlage_naam,
      };
      let id = form.id;
      if (id) {
        const { error } = await supabase.from("adviseur_berichten").update(rij).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("adviseur_berichten").insert({ ...rij, aangemaakt_door: user?.id }).select("id").maybeSingle();
        if (error) throw error;
        id = data?.id;
      }
      if (form.mailen && id) {
        const { data, error } = await supabase.functions.invoke("notify-adviseur-bericht", { body: { bericht_id: id } });
        if (error) toast.error("Bericht opgeslagen, maar mail versturen mislukte");
        else toast.success(`Bericht opgeslagen en gemaild naar ${data?.verzonden ?? 0} adviseur(s)`);
      } else toast.success("Bericht opgeslagen");
      setForm(null); setBestand(null); laad();
    } catch (e: any) {
      toast.error(e.message ?? "Opslaan mislukt");
    } finally { setBezig(false); }
  };

  const wisselZichtbaar = async (b: Bericht) => {
    await supabase.from("adviseur_berichten").update({ actief: !b.actief }).eq("id", b.id);
    laad();
  };
  const verwijder = async (b: Bericht) => {
    if (!confirm(`Bericht "${b.titel}" definitief verwijderen?`)) return;
    if (b.bijlage_pad) await supabase.storage.from("adviseur-berichten").remove([b.bijlage_pad]);
    await supabase.from("adviseur_berichten").delete().eq("id", b.id);
    laad();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Berichten verschijnen bij EP-adviseurs in het tabblad "Berichten". Kies "Alle adviseurs" voor aankondigingen of één adviseur voor een persoonlijke opmerking.</p>
        {!form && <Button size="sm" variant="outline" onClick={() => setForm({ ...leeg })}><Plus className="h-4 w-4 mr-1" /> Nieuw bericht</Button>}
      </div>

      {form && (
        <div className="border rounded-lg p-4 bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{form.id ? "Bericht bewerken" : "Nieuw bericht"}</h2>
            <Button size="icon" variant="ghost" onClick={() => { setForm(null); setBestand(null); }}><X className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Soort</Label>
              <Select value={form.soort} onValueChange={(v) => setForm({ ...form, soort: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{BERICHT_SOORTEN.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Ontvanger</Label>
              <Select value={form.adviseur_id} onValueChange={(v) => setForm({ ...form, adviseur_id: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle adviseurs</SelectItem>
                  {adviseurs.map((a) => <SelectItem key={a.id} value={a.id}>{String(a.nummer).padStart(3, "0")} – {a.naam}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Titel</Label>
            <Input value={form.titel} onChange={(e) => setForm({ ...form, titel: e.target.value })} placeholder="Bijv. Intervisiebijeenkomst november" />
          </div>
          <div>
            <Label className="text-xs">Bericht</Label>
            <Textarea rows={5} value={form.inhoud} onChange={(e) => setForm({ ...form, inhoud: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Datum en tijd (optioneel)</Label>
              <Input type="datetime-local" value={form.evenement_datum} onChange={(e) => setForm({ ...form, evenement_datum: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Locatie (optioneel)</Label>
              <Input value={form.evenement_locatie} onChange={(e) => setForm({ ...form, evenement_locatie: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Bijlage (optioneel)</Label>
            {form.bijlage_naam && !bestand && (
              <div className="flex items-center gap-2 text-sm">{form.bijlage_naam}
                <Button size="sm" variant="ghost" onClick={() => setForm({ ...form, bijlage_pad: null, bijlage_naam: null })}>Verwijderen</Button>
              </div>
            )}
            <Input type="file" accept=".pdf,image/*,.doc,.docx,.xlsx" onChange={(e) => setBestand(e.target.files?.[0] ?? null)} />
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.vastgepind} onCheckedChange={(v) => setForm({ ...form, vastgepind: !!v })} /> Bovenaan vastpinnen</label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.mailen} onCheckedChange={(v) => setForm({ ...form, mailen: !!v })} /> Ook per mail versturen</label>
          </div>
          <div className="flex justify-end">
            <Button onClick={opslaan} disabled={bezig}>{bezig ? "Bezig…" : form.id ? "Opslaan" : "Plaatsen"}</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {berichten.length === 0 && <p className="text-sm text-muted-foreground">Nog geen berichten geplaatst.</p>}
        {berichten.map((b) => (
          <div key={b.id} className={`border rounded-lg p-3 bg-card flex items-start gap-3 ${b.actief ? "" : "opacity-60"}`}>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {b.vastgepind && <Pin className="h-3.5 w-3.5 text-accent" />}
                <Badge variant="secondary">{soortLabel(b.soort)}</Badge>
                <Badge variant="outline">{b.adviseur_id ? `Alleen ${adviseurNaam(b.adviseur_id)}` : "Alle adviseurs"}</Badge>
                {!b.actief && <Badge variant="outline">Verborgen</Badge>}
                <span className="font-medium text-sm">{b.titel}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Geplaatst {new Date(b.created_at).toLocaleDateString("nl-NL")} · {gelezen[b.id] ?? 0}× gelezen
                {(b.evenement_datum || b.evenement_locatie) && ` · ${formatEvenement(b.evenement_datum, b.evenement_locatie)}`}
              </p>
            </div>
            <Button size="icon" variant="ghost" title="Bewerken" onClick={() => setForm({
              id: b.id, soort: b.soort, titel: b.titel, inhoud: b.inhoud, evenement_datum: toLocalInput(b.evenement_datum),
              evenement_locatie: b.evenement_locatie ?? "", vastgepind: b.vastgepind, adviseur_id: b.adviseur_id ?? "alle",
              mailen: false, bijlage_pad: b.bijlage_pad, bijlage_naam: b.bijlage_naam,
            })}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" title={b.actief ? "Verbergen" : "Tonen"} onClick={() => wisselZichtbaar(b)}>
              {b.actief ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" title="Verwijderen" onClick={() => verwijder(b)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
