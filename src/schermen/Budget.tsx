import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import type { Categorie } from "@/lib/types";
import {
  percentageGebruikt,
  prognoseEindeMaand,
  uitgavenInMaandPerCategorie,
} from "@/lib/berekeningen";
import {
  centenNaarInvoer,
  euro,
  invoerNaarCenten,
  maandLabel,
} from "@/lib/formatteren";
import { VoortgangsBalk } from "@/components/VoortgangsBalk";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export default function Budget() {
  const nu = new Date();
  const [jaar, setJaar] = useState(nu.getFullYear());
  const [maand, setMaand] = useState(nu.getMonth() + 1);
  const [openId, setOpenId] = useState<number | null>(null);

  const categorieen = useLiveQuery(() => db.categorieen.orderBy("volgorde").toArray());
  const transacties = useLiveQuery(() => db.transacties.toArray());
  const instellingen = useLiveQuery(() => db.instellingen.toCollection().first());

  const isHuidigeMaand =
    jaar === nu.getFullYear() && maand === nu.getMonth() + 1;
  const dagenInMaand = new Date(jaar, maand, 0).getDate();
  const isVerledenMaand =
    jaar < nu.getFullYear() || (jaar === nu.getFullYear() && maand < nu.getMonth() + 1);
  const dagenVerstreken = isHuidigeMaand
    ? nu.getDate()
    : isVerledenMaand
      ? dagenInMaand
      : 0;

  const regels = useMemo(() => {
    const ts = transacties ?? [];
    return (categorieen ?? [])
      .filter((c) => !c.verborgen)
      .map((categorie) => {
        const uitgegeven = uitgavenInMaandPerCategorie(ts, jaar, maand, categorie.id ?? -1);
        return {
          categorie,
          uitgegeven,
          restant: categorie.budget - uitgegeven,
          percentage: percentageGebruikt(uitgegeven, categorie.budget),
          prognose: prognoseEindeMaand(uitgegeven, dagenVerstreken, dagenInMaand),
        };
      });
  }, [categorieen, transacties, jaar, maand, dagenVerstreken, dagenInMaand]);

  const totaalBudget = regels.reduce((som, r) => som + r.categorie.budget, 0);
  const totaalUitgegeven = regels.reduce((som, r) => som + r.uitgegeven, 0);
  const drempel = instellingen?.waarschuwingsdrempel ?? 90;

  function vorigeMaand() {
    if (maand === 1) {
      setMaand(12);
      setJaar(jaar - 1);
    } else {
      setMaand(maand - 1);
    }
  }

  function volgendeMaand() {
    if (maand === 12) {
      setMaand(1);
      setJaar(jaar + 1);
    } else {
      setMaand(maand + 1);
    }
  }

  return (
    <div className="space-y-4 px-4 pt-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Budget</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Vorige maand"
            onClick={vorigeMaand}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-32 text-center text-sm font-medium">
            {maandLabel(jaar, maand)}
          </span>
          <button
            type="button"
            aria-label="Volgende maand"
            onClick={volgendeMaand}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </header>

      <Card>
        <CardContent className="bedrag grid grid-cols-3 gap-2 pt-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className="mt-0.5 text-sm font-semibold">{euro(totaalBudget)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Uitgegeven</p>
            <p className="mt-0.5 text-sm font-semibold">{euro(totaalUitgegeven)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Restant</p>
            <p
              className={cn(
                "mt-0.5 text-sm font-semibold",
                totaalBudget - totaalUitgegeven < 0 && "text-destructive"
              )}
            >
              {euro(totaalBudget - totaalUitgegeven)}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2 pb-4">
        {regels.map((regel) => (
          <BudgetRegel
            key={regel.categorie.id}
            regel={regel}
            drempel={drempel}
            toonPrognose={isHuidigeMaand}
            open={openId === regel.categorie.id}
            onToggle={() =>
              setOpenId(openId === regel.categorie.id ? null : (regel.categorie.id ?? null))
            }
          />
        ))}
      </div>
    </div>
  );
}

interface Regel {
  categorie: Categorie;
  uitgegeven: number;
  restant: number;
  percentage: number | null;
  prognose: number;
}

function BudgetRegel({
  regel,
  drempel,
  toonPrognose,
  open,
  onToggle,
}: {
  regel: Regel;
  drempel: number;
  toonPrognose: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const { categorie, uitgegeven, restant, percentage, prognose } = regel;
  const [invoer, setInvoer] = useState(() =>
    categorie.budget > 0 ? centenNaarInvoer(categorie.budget) : ""
  );

  async function bewaarBudget(centen: number) {
    if (categorie.id === undefined) return;
    await db.categorieen.update(categorie.id, { budget: centen });
  }

  return (
    <Card>
      <CardContent className="p-0">
        <button type="button" onClick={onToggle} className="w-full px-4 py-3 text-left">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-sm font-medium">
              {categorie.emoji} {categorie.naam}
            </span>
            <span className="bedrag text-sm text-muted-foreground">
              {percentage === null ? "—" : `${percentage}%`}
            </span>
          </div>
          <VoortgangsBalk percentage={percentage} drempel={drempel} />
          <div className="bedrag mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{euro(uitgegeven)} uitgegeven</span>
            {categorie.budget > 0 ? (
              <span className={cn(restant < 0 && "font-medium text-destructive")}>
                {restant >= 0 ? `${euro(restant)} over` : `${euro(-restant)} eroverheen`}
              </span>
            ) : (
              <span>geen budget</span>
            )}
          </div>
          {toonPrognose && categorie.budget > 0 && uitgegeven > 0 && (
            <p className="bedrag mt-1 text-xs text-muted-foreground">
              Prognose einde maand: {euro(prognose)}
            </p>
          )}
        </button>
        {open && (
          <div className="space-y-3 border-t px-4 py-3">
            <div className="flex items-center gap-3">
              <Slider
                value={[Math.min(categorie.budget, 50000)]}
                min={0}
                max={50000}
                step={500}
                onValueChange={([waarde]) => {
                  setInvoer(waarde === 0 ? "" : centenNaarInvoer(waarde));
                  void bewaarBudget(waarde);
                }}
                className="flex-1"
              />
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">€</span>
                <Input
                  inputMode="decimal"
                  placeholder="0,00"
                  value={invoer}
                  onChange={(e) => {
                    setInvoer(e.target.value);
                    const centen = invoerNaarCenten(e.target.value);
                    if (centen !== null) void bewaarBudget(centen);
                    if (e.target.value.trim() === "") void bewaarBudget(0);
                  }}
                  className="bedrag h-11 w-24 text-right"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Dit maandbudget geldt voor elke maand.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
