import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { db } from "@/lib/db";
import {
  gemiddeldeUitgavenPerMaand,
  gespaardInJaar,
  inJaar,
  inkomstenPerMaand,
  perWerkgever,
  somBedragen,
  spaarratio,
  topUitgaven,
  uitgavenPerCategorie,
} from "@/lib/berekeningen";
import { datumNL, euro } from "@/lib/formatteren";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MAANDLETTERS = ["j", "f", "m", "a", "m", "j", "j", "a", "s", "o", "n", "d"];

export default function Overzicht() {
  const nu = new Date();
  const [jaar, setJaar] = useState(nu.getFullYear());

  const transacties = useLiveQuery(() => db.transacties.toArray());
  const categorieen = useLiveQuery(() => db.categorieen.toArray());
  const werkgevers = useLiveQuery(() => db.werkgevers.toArray());

  const cijfers = useMemo(() => {
    const ts = transacties ?? [];
    const jaarTransacties = ts.filter((t) => inJaar(t, jaar));
    const inkomsten = somBedragen(jaarTransacties.filter((t) => t.type === "inkomst"));
    const uitgaven = somBedragen(jaarTransacties.filter((t) => t.type === "uitgave"));
    const spaarCategorieId = (categorieen ?? []).find((c) => c.naam === "Sparen")?.id;
    const gespaard = gespaardInJaar(ts, jaar, spaarCategorieId);
    const verstrekenMaanden =
      jaar < nu.getFullYear() ? 12 : jaar > nu.getFullYear() ? 0 : nu.getMonth() + 1;

    return {
      inkomsten,
      uitgaven,
      netto: inkomsten - uitgaven,
      ratio: spaarratio(gespaard, inkomsten),
      gemiddeld: gemiddeldeUitgavenPerMaand(uitgaven, verstrekenMaanden),
      perMaand: inkomstenPerMaand(ts, jaar).map((bedrag, i) => ({
        maand: MAANDLETTERS[i],
        bedrag: bedrag / 100,
      })),
      perCategorie: uitgavenPerCategorie(ts, jaar),
      top5: topUitgaven(jaarTransacties, 5),
      werkgeverTotalen: perWerkgever(jaarTransacties),
      heeftData: jaarTransacties.length > 0,
    };
  }, [transacties, categorieen, jaar, nu]);

  const maxCategorie = cijfers.perCategorie[0]?.bedrag ?? 0;

  return (
    <div className="space-y-4 px-4 pt-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Overzicht</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Vorig jaar"
            onClick={() => setJaar(jaar - 1)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-16 text-center text-sm font-medium">{jaar}</span>
          <button
            type="button"
            aria-label="Volgend jaar"
            onClick={() => setJaar(jaar + 1)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </header>

      {!cijfers.heeftData ? (
        <Card>
          <CardContent className="pt-5 text-center text-sm text-muted-foreground">
            Nog geen transacties in {jaar}. Zodra je uitgaven en inkomsten
            vastlegt, zie je hier je jaaroverzicht met grafieken.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="bedrag grid grid-cols-2 gap-x-2 gap-y-3 pt-4">
              <Jaarcijfer label="Totale inkomsten" waarde={euro(cijfers.inkomsten)} />
              <Jaarcijfer label="Totale uitgaven" waarde={euro(cijfers.uitgaven)} />
              <Jaarcijfer
                label="Netto resultaat"
                waarde={euro(cijfers.netto)}
                accent={cijfers.netto >= 0 ? "positief" : "negatief"}
              />
              <Jaarcijfer
                label="Spaarratio"
                waarde={
                  cijfers.ratio === null ? "—" : `${Math.round(cijfers.ratio * 100)}%`
                }
              />
              <Jaarcijfer
                label="Gemiddelde uitgaven per maand"
                waarde={euro(cijfers.gemiddeld)}
              />
            </CardContent>
          </Card>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Inkomsten per maand
            </h2>
            <Card>
              <CardContent className="pl-0 pr-3 pt-4">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={cijfers.perMaand} margin={{ top: 4, left: 4 }}>
                    <CartesianGrid
                      vertical={false}
                      stroke="hsl(var(--border))"
                      strokeDasharray="2 4"
                    />
                    <XAxis
                      dataKey="maand"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      width={44}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(w: number) => `€${Math.round(w)}`}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted))" }}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "hsl(var(--foreground))",
                      }}
                      formatter={(w) => [euro(Math.round(Number(w) * 100)), "Inkomsten"]}
                      labelFormatter={() => ""}
                    />
                    <Bar
                      dataKey="bedrag"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </section>

          {cijfers.perCategorie.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                Uitgaven per categorie
              </h2>
              <Card>
                <CardContent className="space-y-3 pt-4">
                  {cijfers.perCategorie.map(({ categorieId, bedrag }) => {
                    const categorie = categorieen?.find((c) => c.id === categorieId);
                    return (
                      <div key={categorieId ?? "geen"}>
                        <div className="mb-1 flex items-baseline justify-between text-sm">
                          <span className="font-medium">
                            {categorie
                              ? `${categorie.emoji} ${categorie.naam}`
                              : "📦 Zonder categorie"}
                          </span>
                          <span className="bedrag text-muted-foreground">
                            {euro(bedrag)}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${maxCategorie > 0 ? Math.max(2, (bedrag / maxCategorie) * 100) : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </section>
          )}

          {cijfers.top5.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                Top 5 grootste uitgaven
              </h2>
              <Card>
                <CardContent className="divide-y p-0">
                  {cijfers.top5.map((t) => {
                    const categorie = categorieen?.find((c) => c.id === t.categorieId);
                    return (
                      <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="text-xl">{categorie?.emoji ?? "📦"}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {t.omschrijving || categorie?.naam || "Uitgave"}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {datumNL(t.datum)}
                          </span>
                        </span>
                        <span className="bedrag text-sm font-semibold">
                          {euro(t.bedrag)}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </section>
          )}

          {cijfers.werkgeverTotalen.length > 0 && (
            <section className="pb-4">
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                Per werkgever
              </h2>
              <Card>
                <CardContent className="divide-y p-0">
                  {cijfers.werkgeverTotalen.map((totaal) => {
                    const werkgever = werkgevers?.find(
                      (w) => w.id === totaal.werkgeverId
                    );
                    return (
                      <div
                        key={totaal.werkgeverId}
                        className="flex items-center justify-between px-4 py-2.5"
                      >
                        <span className="text-sm font-medium">
                          {werkgever?.naam ?? "Onbekende werkgever"}
                        </span>
                        <span className="bedrag text-sm text-muted-foreground">
                          {totaal.uren > 0 &&
                            `${String(totaal.uren).replace(".", ",")} uur · `}
                          <span className="font-semibold text-foreground">
                            {euro(totaal.bedrag)}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Jaarcijfer({
  label,
  waarde,
  accent,
}: {
  label: string;
  waarde: string;
  accent?: "positief" | "negatief";
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-base font-semibold",
          accent === "positief" && "text-succes",
          accent === "negatief" && "text-destructive"
        )}
      >
        {waarde}
      </p>
    </div>
  );
}
