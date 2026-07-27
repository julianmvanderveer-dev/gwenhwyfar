import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Settings } from "lucide-react";
import { db } from "@/lib/db";
import type { Transactie } from "@/lib/types";
import {
  doelPercentage,
  gespaardVoorDoel,
  inkomstenInMaand,
  percentageGebruikt,
  saldo,
  uitgavenInMaand,
  uitgavenInMaandPerCategorie,
  vrijBesteedbaar,
} from "@/lib/berekeningen";
import { datumKort, euro, naarIsoDatum } from "@/lib/formatteren";
import { VoortgangsBalk } from "@/components/VoortgangsBalk";
import { Card, CardContent } from "@/components/ui/card";

export default function Vandaag() {
  const navigate = useNavigate();
  const categorieen = useLiveQuery(() => db.categorieen.toArray());
  const transacties = useLiveQuery(() => db.transacties.toArray());
  const spaardoelen = useLiveQuery(() => db.spaardoelen.toArray());
  const instellingen = useLiveQuery(() => db.instellingen.toCollection().first());

  const nu = new Date();
  const jaar = nu.getFullYear();
  const maand = nu.getMonth() + 1;
  const vandaagIso = naarIsoDatum(nu);

  const cijfers = useMemo(() => {
    const ts = transacties ?? [];
    const cats = categorieen ?? [];
    const uitgavenMaand = uitgavenInMaand(ts, jaar, maand);
    return {
      vrij: vrijBesteedbaar(cats, uitgavenMaand),
      saldo: saldo(instellingen?.beginsaldo ?? 0, ts),
      inkomstenMaand: inkomstenInMaand(ts, jaar, maand),
      uitgavenMaand,
      heeftBudgetten: cats.some((c) => !c.verborgen && c.budget > 0),
    };
  }, [transacties, categorieen, instellingen, jaar, maand]);

  const budgetRegels = useMemo(() => {
    const ts = transacties ?? [];
    return (categorieen ?? [])
      .filter((c) => !c.verborgen && c.budget > 0)
      .map((c) => {
        const uitgegeven = uitgavenInMaandPerCategorie(ts, jaar, maand, c.id ?? -1);
        return { categorie: c, uitgegeven, percentage: percentageGebruikt(uitgegeven, c.budget) };
      })
      .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0));
  }, [categorieen, transacties, jaar, maand]);

  const laatsteTransacties = useMemo(() => {
    return [...(transacties ?? [])]
      .sort((a, b) => b.datum.localeCompare(a.datum) || b.aangemaakt - a.aangemaakt)
      .slice(0, 5);
  }, [transacties]);

  const drempel = instellingen?.waarschuwingsdrempel ?? 90;
  const geladen = transacties !== undefined && categorieen !== undefined;
  const binnenBudget = cijfers.vrij >= 0;

  return (
    <div className="space-y-4 px-4 pt-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Vandaag</h1>
          <p className="text-sm text-muted-foreground">{datumKort(vandaagIso)}</p>
        </div>
        <Link
          to="/instellingen"
          aria-label="Instellingen"
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </header>

      <Card>
        <CardContent className="pt-5 text-center">
          <p className="text-sm text-muted-foreground">Vrij besteedbaar deze maand</p>
          <p
            className={`bedrag mt-1 text-4xl font-bold tracking-tight ${
              binnenBudget ? "" : "text-destructive"
            }`}
          >
            {euro(cijfers.vrij)}
          </p>
          {cijfers.heeftBudgetten ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {binnenBudget
                ? "Mooi bezig deze maand"
                : "Volgende maand een nieuwe start"}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Stel budgetten in op het tabblad Budget, dan zie je hier wat je nog
              kunt uitgeven.
            </p>
          )}
          <div className="bedrag mt-4 grid grid-cols-3 gap-2 border-t pt-3">
            <Kerncijfer label="Saldo" waarde={euro(cijfers.saldo)} />
            <Kerncijfer label="Inkomsten" waarde={euro(cijfers.inkomstenMaand)} />
            <Kerncijfer label="Uitgaven" waarde={euro(cijfers.uitgavenMaand)} />
          </div>
        </CardContent>
      </Card>

      {budgetRegels.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
            Budgetten
          </h2>
          <Card>
            <CardContent className="space-y-3 pt-4">
              {budgetRegels.map(({ categorie, uitgegeven, percentage }) => (
                <div key={categorie.id}>
                  <div className="mb-1 flex items-baseline justify-between text-sm">
                    <span className="font-medium">
                      {categorie.emoji} {categorie.naam}
                    </span>
                    <span className="bedrag text-muted-foreground">
                      {euro(uitgegeven)} van {euro(categorie.budget)}
                    </span>
                  </div>
                  <VoortgangsBalk percentage={percentage} drempel={drempel} />
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {(spaardoelen?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
            Spaardoelen
          </h2>
          <Card>
            <CardContent className="space-y-3 pt-4">
              {spaardoelen?.map((doel) => {
                const gespaard = gespaardVoorDoel(doel, transacties ?? []);
                const percentage = doelPercentage(gespaard, doel.streefbedrag);
                return (
                  <div key={doel.id}>
                    <div className="mb-1 flex items-baseline justify-between text-sm">
                      <span className="font-medium">
                        {doel.emoji} {doel.naam}
                      </span>
                      <span className="bedrag text-muted-foreground">
                        {percentage}%
                      </span>
                    </div>
                    <VoortgangsBalk percentage={percentage} vasteKleur="bg-primary" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      )}

      <section className="pb-4">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          Laatste transacties
        </h2>
        {geladen && laatsteTransacties.length === 0 ? (
          <Card>
            <CardContent className="pt-5 text-center text-sm text-muted-foreground">
              Nog geen transacties. Tik op de grote plusknop om je eerste uitgave
              of inkomst vast te leggen.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="divide-y p-0">
              {laatsteTransacties.map((t) => (
                <TransactieRegel
                  key={t.id}
                  transactie={t}
                  onTik={() => navigate(`/toevoegen?id=${t.id}`)}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function Kerncijfer({ label, waarde }: { label: string; waarde: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold">{waarde}</p>
    </div>
  );
}

function TransactieRegel({
  transactie,
  onTik,
}: {
  transactie: Transactie;
  onTik: () => void;
}) {
  const categorieen = useLiveQuery(() => db.categorieen.toArray());
  const categorie = categorieen?.find((c) => c.id === transactie.categorieId);
  const isInkomst = transactie.type === "inkomst";

  return (
    <button
      type="button"
      onClick={onTik}
      className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left"
    >
      <span className="text-xl">{isInkomst ? "💶" : (categorie?.emoji ?? "📦")}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {transactie.omschrijving ||
            (isInkomst ? "Inkomst" : (categorie?.naam ?? "Uitgave"))}
        </span>
        <span className="block text-xs text-muted-foreground">
          {datumKort(transactie.datum)}
        </span>
      </span>
      <span
        className={`bedrag text-sm font-semibold ${
          isInkomst ? "text-succes" : ""
        }`}
      >
        {isInkomst ? "+" : "−"} {euro(transactie.bedrag)}
      </span>
    </button>
  );
}
