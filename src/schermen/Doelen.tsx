import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { db } from "@/lib/db";
import type { Spaardoel } from "@/lib/types";
import {
  doelPercentage,
  gespaardVoorDoel,
  heleMaandenTot,
  nodigPerMaand,
} from "@/lib/berekeningen";
import {
  centenNaarInvoer,
  datumNL,
  euro,
  invoerNaarCenten,
  naarIsoDatum,
} from "@/lib/formatteren";
import { VoortgangsBalk } from "@/components/VoortgangsBalk";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Doelen() {
  const doelen = useLiveQuery(() => db.spaardoelen.toArray());
  const transacties = useLiveQuery(() => db.transacties.toArray());
  const [bewerkDoel, setBewerkDoel] = useState<Spaardoel | null>(null);
  const [nieuwOpen, setNieuwOpen] = useState(false);
  const [inlegDoel, setInlegDoel] = useState<Spaardoel | null>(null);

  const vandaag = naarIsoDatum(new Date());

  return (
    <div className="space-y-4 px-4 pt-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Doelen</h1>
        <Button
          size="sm"
          className="h-11 gap-1.5 rounded-full px-4"
          onClick={() => setNieuwOpen(true)}
        >
          <Plus className="h-4 w-4" /> Nieuw doel
        </Button>
      </header>

      {(doelen?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="pt-5 text-center text-sm text-muted-foreground">
            Nog geen spaardoelen. Maak een doel aan — bijvoorbeeld voor een
            scooter, rijlessen of een festival — en zie hier hoeveel je per
            maand moet sparen om het te halen.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 pb-4">
          {doelen?.map((doel) => {
            const gespaard = gespaardVoorDoel(doel, transacties ?? []);
            const percentage = doelPercentage(gespaard, doel.streefbedrag);
            const rest = Math.max(0, doel.streefbedrag - gespaard);
            const maanden = doel.streefdatum
              ? heleMaandenTot(vandaag, doel.streefdatum)
              : null;
            const perMaand =
              doel.streefdatum !== undefined
                ? nodigPerMaand(doel.streefbedrag, gespaard, maanden ?? 0)
                : null;
            const gehaald = rest === 0;
            const datumVerstreken =
              doel.streefdatum !== undefined && doel.streefdatum < vandaag && !gehaald;

            return (
              <Card key={doel.id}>
                <CardContent className="pt-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {doel.emoji} {doel.naam}
                    </span>
                    <button
                      type="button"
                      aria-label={`${doel.naam} bewerken`}
                      onClick={() => setBewerkDoel(doel)}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                  <VoortgangsBalk percentage={percentage} vasteKleur="bg-primary" />
                  <div className="bedrag mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>
                      {euro(gespaard)} van {euro(doel.streefbedrag)} ({percentage}%)
                    </span>
                    {!gehaald && <span>nog {euro(rest)} nodig</span>}
                  </div>

                  {gehaald ? (
                    <p className="mt-2 text-sm font-medium text-succes">
                      Gehaald — goed gedaan! 🎉
                    </p>
                  ) : datumVerstreken ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      De streefdatum ({datumNL(doel.streefdatum ?? "")}) is voorbij —
                      geen zorgen, elke inleg brengt je dichterbij. Er is nog{" "}
                      {euro(rest)} te gaan.
                    </p>
                  ) : perMaand !== null ? (
                    <p className="bedrag mt-2 text-sm text-muted-foreground">
                      Spaar {euro(perMaand)} per maand om{" "}
                      {datumNL(doel.streefdatum ?? "")} te halen.
                    </p>
                  ) : null}

                  {!gehaald && (
                    <Button
                      variant="secondary"
                      className="mt-3 h-11 w-full"
                      onClick={() => setInlegDoel(doel)}
                    >
                      Inleg boeken
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <DoelDialog
        open={nieuwOpen || bewerkDoel !== null}
        doel={bewerkDoel}
        onSluit={() => {
          setNieuwOpen(false);
          setBewerkDoel(null);
        }}
      />
      <InlegDialog doel={inlegDoel} onSluit={() => setInlegDoel(null)} />
    </div>
  );
}

function DoelDialog({
  open,
  doel,
  onSluit,
}: {
  open: boolean;
  doel: Spaardoel | null;
  onSluit: () => void;
}) {
  const [naam, setNaam] = useState("");
  const [emoji, setEmoji] = useState("");
  const [streefStr, setStreefStr] = useState("");
  const [startStr, setStartStr] = useState("");
  const [streefdatum, setStreefdatum] = useState("");
  const [geladenVoor, setGeladenVoor] = useState<number | null | undefined>(undefined);

  // Velden vullen zodra er een (ander) doel wordt geopend
  if (open && geladenVoor !== (doel?.id ?? null)) {
    setGeladenVoor(doel?.id ?? null);
    setNaam(doel?.naam ?? "");
    setEmoji(doel?.emoji ?? "");
    setStreefStr(doel ? centenNaarInvoer(doel.streefbedrag) : "");
    setStartStr(doel && doel.startbedrag > 0 ? centenNaarInvoer(doel.startbedrag) : "");
    setStreefdatum(doel?.streefdatum ?? "");
  }
  if (!open && geladenVoor !== undefined) setGeladenVoor(undefined);

  const streefbedrag = invoerNaarCenten(streefStr);
  const startbedrag = startStr.trim() === "" ? 0 : invoerNaarCenten(startStr);
  const geldig =
    naam.trim() !== "" && streefbedrag !== null && streefbedrag > 0 && startbedrag !== null;

  async function bewaar() {
    if (!geldig || streefbedrag === null || startbedrag === null) return;
    const gegevens = {
      naam: naam.trim(),
      emoji: emoji.trim() || "🎯",
      streefbedrag,
      startbedrag,
      streefdatum: streefdatum || undefined,
      behaald: false,
    };
    if (doel?.id !== undefined) {
      await db.spaardoelen.update(doel.id, gegevens);
    } else {
      await db.spaardoelen.add(gegevens);
    }
    onSluit();
  }

  async function verwijderDoel() {
    if (doel?.id === undefined) return;
    const gekoppeld = await db.transacties
      .where("spaardoelId")
      .equals(doel.id)
      .count();
    if (gekoppeld > 0) {
      toast.error(
        "Er zijn al inleg-transacties voor dit doel. Verwijder die eerst, of laat het doel staan."
      );
      return;
    }
    await db.spaardoelen.delete(doel.id);
    onSluit();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onSluit()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{doel ? "Doel bewerken" : "Nieuw spaardoel"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="w-16">
              <Label htmlFor="doel-emoji" className="mb-1.5 block text-sm">
                Emoji
              </Label>
              <Input
                id="doel-emoji"
                value={emoji}
                placeholder="🎯"
                onChange={(e) => setEmoji(e.target.value)}
                className="h-11 text-center"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="doel-naam" className="mb-1.5 block text-sm">
                Naam
              </Label>
              <Input
                id="doel-naam"
                value={naam}
                placeholder="bijv. Scooter"
                onChange={(e) => setNaam(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="doel-streef" className="mb-1.5 block text-sm">
              Streefbedrag (€)
            </Label>
            <Input
              id="doel-streef"
              inputMode="decimal"
              value={streefStr}
              placeholder="bijv. 1500,00"
              onChange={(e) => setStreefStr(e.target.value)}
              className="bedrag h-11"
            />
          </div>
          <div>
            <Label htmlFor="doel-start" className="mb-1.5 block text-sm">
              Al gespaard buiten de app (€, niet verplicht)
            </Label>
            <Input
              id="doel-start"
              inputMode="decimal"
              value={startStr}
              placeholder="0,00"
              onChange={(e) => setStartStr(e.target.value)}
              className="bedrag h-11"
            />
          </div>
          <div>
            <Label htmlFor="doel-datum" className="mb-1.5 block text-sm">
              Streefdatum (niet verplicht)
            </Label>
            <Input
              id="doel-datum"
              type="date"
              value={streefdatum}
              onChange={(e) => setStreefdatum(e.target.value)}
              className="h-11"
            />
          </div>
          <Button className="h-12 w-full" disabled={!geldig} onClick={() => void bewaar()}>
            Opslaan
          </Button>
          {doel && (
            <Button
              variant="ghost"
              className="h-11 w-full text-destructive"
              onClick={() => void verwijderDoel()}
            >
              Doel verwijderen
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InlegDialog({
  doel,
  onSluit,
}: {
  doel: Spaardoel | null;
  onSluit: () => void;
}) {
  const transacties = useLiveQuery(() => db.transacties.toArray());
  const categorieen = useLiveQuery(() => db.categorieen.toArray());
  const [bedragStr, setBedragStr] = useState("");
  const [voorDoel, setVoorDoel] = useState<number | null>(null);

  const vandaag = naarIsoDatum(new Date());

  // Bedrag voorvullen met wat er per maand nodig is
  if (doel && voorDoel !== doel.id) {
    setVoorDoel(doel.id ?? null);
    const gespaard = gespaardVoorDoel(doel, transacties ?? []);
    const maanden = doel.streefdatum ? heleMaandenTot(vandaag, doel.streefdatum) : 0;
    const perMaand = nodigPerMaand(doel.streefbedrag, gespaard, maanden);
    setBedragStr(perMaand > 0 ? centenNaarInvoer(perMaand) : "");
  }
  if (!doel && voorDoel !== null) setVoorDoel(null);

  const bedrag = invoerNaarCenten(bedragStr);

  async function boek() {
    if (!doel || bedrag === null || bedrag <= 0) return;
    const spaarCategorie = categorieen?.find((c) => c.naam === "Sparen");
    const transactie = {
      type: "uitgave" as const,
      bedrag,
      datum: vandaag,
      categorieId: spaarCategorie?.id,
      spaardoelId: doel.id,
      omschrijving: `Inleg ${doel.naam}`,
      aangemaakt: Date.now(),
    };
    const id = (await db.transacties.add(transactie)) as number;
    const gespaard = gespaardVoorDoel(doel, [
      ...(transacties ?? []),
      { ...transactie, id },
    ]);
    const rest = Math.max(0, doel.streefbedrag - gespaard);
    toast.success(
      rest === 0
        ? `${doel.naam} is gehaald — goed gedaan! 🎉`
        : `Inleg geboekt — nog ${euro(rest)} te gaan voor ${doel.naam}`,
      {
        duration: 5000,
        action: {
          label: "Ongedaan maken",
          onClick: () => void db.transacties.delete(id),
        },
      }
    );
    onSluit();
  }

  return (
    <Dialog open={doel !== null} onOpenChange={(o) => !o && onSluit()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Inleg voor {doel?.emoji} {doel?.naam}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="inleg-bedrag" className="mb-1.5 block text-sm">
              Bedrag (€)
            </Label>
            <Input
              id="inleg-bedrag"
              inputMode="decimal"
              value={bedragStr}
              placeholder="0,00"
              onChange={(e) => setBedragStr(e.target.value)}
              className="bedrag h-11"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Dit wordt een uitgave in de categorie Sparen, gekoppeld aan dit doel.
          </p>
          <Button
            className="h-12 w-full"
            disabled={bedrag === null || bedrag <= 0}
            onClick={() => void boek()}
          >
            Inleg boeken
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
