import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, CheckCircle2 } from "lucide-react";
import { auditjaarVanDatum } from "@/lib/auditjaar";

const ALLE = "alle";

interface Rij {
  onderdeel: string;
  controlepunt: string;
  aantal: number;
  totaal_afwijkingen: number;
  aantal_projecten: number;
  gemiddeld_bij_anderen?: number | null;
}

interface Props {
  jaar?: string | null;
  showJaarFilter?: boolean;
}

export default function MijnFoutenTop({ jaar: jaarProp, showJaarFilter = true }: Props = {}) {
  const [rows, setRows] = useState<Rij[]>([]);
  const [jaren, setJaren] = useState<string[]>([]);
  const [eigenJaar, setEigenJaar] = useState<string>(ALLE);
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(true);

  const jaar = showJaarFilter ? eigenJaar : jaarProp ?? ALLE;

  useEffect(() => {
    if (!showJaarFilter) return;
    (async () => {
      const { data } = await supabase.from("projects").select("auditjaar, datum_aangemaakt");
      const set = new Set<string>();
      (data ?? []).forEach((p: any) => {
        const j = p.auditjaar ?? (p.datum_aangemaakt ? auditjaarVanDatum(p.datum_aangemaakt) : null);
        if (j) set.add(j);
      });
      setJaren(Array.from(set).sort().reverse());
    })();
  }, [showJaarFilter]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase.rpc("get_mijn_fouten_top", {
        _auditjaar: jaar === ALLE ? null : jaar,
        _limit: limit,
      });
      if (!active) return;
      setRows((data ?? []) as unknown as Rij[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [jaar, limit]);

  const totaal = rows[0]?.totaal_afwijkingen ?? 0;
  const projecten = rows[0]?.aantal_projecten ?? 0;

  return (
    <div className="bg-card rounded-lg border shadow-sm p-4">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Mijn meest voorkomende aandachtspunten
        </h2>
        <div className="ml-auto flex items-center gap-2">
          <Select value={jaar} onValueChange={setJaar}>
            <SelectTrigger className="w-[170px] h-8 text-xs">
              <SelectValue placeholder="Alle auditjaren" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALLE}>Alle auditjaren</SelectItem>
              {jaren.map((j) => (
                <SelectItem key={j} value={j}>
                  {j}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => setLimit((l) => (l === 5 ? 10 : 5))}
          >
            {limit === 5 ? "Toon top 10" : "Toon top 5"}
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Laden…</p>
      ) : rows.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Geen blijvende afwijkingen in deze periode. Goed bezig!
        </div>
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Onderdeel
                </th>
                <th className="text-left py-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Controlepunt
                </th>
                <th className="text-right py-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Aantal
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-1.5 text-muted-foreground">{r.onderdeel}</td>
                  <td className="py-1.5">{r.controlepunt}</td>
                  <td className="py-1.5 text-right font-semibold">{r.aantal}×</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted-foreground">
            In totaal {totaal} blijvende afwijking{totaal === 1 ? "" : "en"} over {projecten} audit
            {projecten === 1 ? "" : "s"}.
          </p>
        </>
      )}
    </div>
  );
}
