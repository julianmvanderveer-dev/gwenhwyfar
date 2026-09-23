import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { auditjaarVanDatum } from "@/lib/auditjaar";
import MijnFoutenTop from "./MijnFoutenTop";
import { BarChart3, Info } from "lucide-react";

const ALLE = "alle";

interface Bench {
  mijn_projecten: number;
  mijn_afwijkingen: number;
  mijn_gem_per_project: number;
  mijn_pct_schoon: number;
  bench_gem_per_project: number | null;
  bench_pct_schoon: number | null;
  bench_top25_gem_per_project: number | null;
  mijn_percentiel: number | null;
  aantal_adviseurs: number;
}

function Kaart({ label, waarde, sub }: { label: string; waarde: string; sub?: string }) {
  return (
    <div className="bg-card rounded-lg border shadow-sm p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="text-2xl font-bold mt-1">{waarde}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function Balk({
  label,
  mijn,
  gem,
  top25,
  suffix = "",
}: {
  label: string;
  mijn: number;
  gem: number;
  top25: number | null;
  suffix?: string;
}) {
  const max = Math.max(mijn, gem, top25 ?? 0, 0.001) * 1.15;
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          jij {mijn}
          {suffix} · gemiddelde {gem}
          {suffix}
          {top25 !== null ? ` · beste 25% ${top25}${suffix}` : ""}
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-primary rounded-full" style={{ width: pct(mijn) }} />
        <div className="absolute inset-y-0 w-0.5 bg-foreground/60" style={{ left: pct(gem) }} />
        {top25 !== null && (
          <div className="absolute inset-y-0 w-0.5 bg-accent" style={{ left: pct(top25) }} />
        )}
      </div>
    </div>
  );
}

export default function AdviseurOverzicht() {
  const [jaren, setJaren] = useState<string[]>([]);
  const [jaar, setJaar] = useState<string>(ALLE);
  const [bench, setBench] = useState<Bench | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("projects").select("auditjaar, datum_aangemaakt");
      const set = new Set<string>();
      (data ?? []).forEach((p: any) => {
        const j = p.auditjaar ?? (p.datum_aangemaakt ? auditjaarVanDatum(p.datum_aangemaakt) : null);
        if (j) set.add(j);
      });
      setJaren(Array.from(set).sort().reverse());
    })();
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase.rpc("get_mijn_benchmark", {
        _auditjaar: jaar === ALLE ? null : jaar,
      });
      if (!active) return;
      const rij = Array.isArray(data) ? (data[0] as unknown as Bench) : null;
      setBench(rij ?? null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [jaar]);

  const heeftBenchmark = !!bench && bench.bench_gem_per_project !== null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Mijn resultaten
        </h2>
        <div className="ml-auto">
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
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Laden…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kaart label="Geauditeerde projecten" waarde={String(bench?.mijn_projecten ?? 0)} />
            <Kaart label="Blijvende afwijkingen" waarde={String(bench?.mijn_afwijkingen ?? 0)} />
            <Kaart
              label="Gemiddeld per project"
              waarde={String(bench?.mijn_gem_per_project ?? 0)}
              sub={
                heeftBenchmark ? `gemiddelde alle adviseurs: ${bench!.bench_gem_per_project}` : undefined
              }
            />
            <Kaart
              label="Audits zonder afwijking"
              waarde={`${bench?.mijn_pct_schoon ?? 0}%`}
              sub={heeftBenchmark ? `gemiddelde alle adviseurs: ${bench!.bench_pct_schoon}%` : undefined}
            />
          </div>

          <div className="bg-card rounded-lg border shadow-sm p-4 space-y-4">
            <h3 className="font-semibold text-sm">Benchmark (anoniem)</h3>
            {heeftBenchmark ? (
              <>
                {bench!.mijn_percentiel !== null && (
                  <p className="text-sm">
                    Je scoort beter dan <span className="font-semibold">{bench!.mijn_percentiel}%</span> van
                    de adviseurs in deze periode.
                  </p>
                )}
                <Balk
                  label="Gemiddeld aantal afwijkingen per project"
                  mijn={Number(bench!.mijn_gem_per_project)}
                  gem={Number(bench!.bench_gem_per_project)}
                  top25={bench!.bench_top25_gem_per_project !== null ? Number(bench!.bench_top25_gem_per_project) : null}
                />
                <Balk
                  label="Percentage audits zonder afwijking"
                  mijn={Number(bench!.mijn_pct_schoon)}
                  gem={Number(bench!.bench_pct_schoon)}
                  top25={null}
                  suffix="%"
                />
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  Vergelijking op basis van {bench!.aantal_adviseurs} adviseurs. Volledig anoniem: er worden
                  geen namen of individuele resultaten van andere adviseurs getoond.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Te weinig gegevens voor een betrouwbare vergelijking in deze periode.
              </p>
            )}
          </div>
        </>
      )}

      <MijnFoutenTop jaar={jaar === ALLE ? null : jaar} showJaarFilter={false} />
    </div>
  );
}
