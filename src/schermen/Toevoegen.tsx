import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { ChevronDown, X, Zap } from "lucide-react";
import { db } from "@/lib/db";
import type { Snelknop, Transactie, TransactieType } from "@/lib/types";
import {
  categorieGebruik,
  uitgavenInMaandPerCategorie,
} from "@/lib/berekeningen";
import {
  centenNaarInvoer,
  datumNL,
  euro,
  invoerNaarCenten,
  naarIsoDatum,
} from "@/lib/formatteren";
import { Cijferblok } from "@/components/Cijferblok";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export default function Toevoegen() {
  const navigate = useNavigate();
  const [zoekparams] = useSearchParams();
  const bewerkId = zoekparams.get("id") ? Number(zoekparams.get("id")) : null;

  const categorieen = useLiveQuery(() =>
    db.categorieen.orderBy("volgorde").toArray()
  );
  const transacties = useLiveQuery(() => db.transacties.toArray());
  const spaardoelen = useLiveQuery(() => db.spaardoelen.toArray());
  const werkgevers = useLiveQuery(() => db.werkgevers.toArray());
  const snelknoppen = useLiveQuery(() =>
    db.snelknoppen.orderBy("gebruikt").reverse().limit(4).toArray()
  );

  const [type, setType] = useState<TransactieType>("uitgave");
  const [bedragStr, setBedragStr] = useState("");
  const [categorieId, setCategorieId] = useState<number | null>(null);
  const [spaardoelId, setSpaardoelId] = useState<number | null>(null);
  const [werkgeverId, setWerkgeverId] = useState<number | null>(null);
  const [urenStr, setUrenStr] = useState("");
  const [datum, setDatum] = useState(() => naarIsoDatum(new Date()));
  const [omschrijving, setOmschrijving] = useState("");
  const [onthoudSnelknop, setOnthoudSnelknop] = useState(false);
  const [meerOpen, setMeerOpen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const origineel = useRef<Transactie | null>(null);

  // In bewerkmodus de bestaande transactie inladen
  useEffect(() => {
    if (bewerkId === null) return;
    void db.transacties.get(bewerkId).then((t) => {
      if (!t) return;
      origineel.current = t;
      setType(t.type);
      setBedragStr(centenNaarInvoer(t.bedrag));
      setCategorieId(t.categorieId ?? null);
      setSpaardoelId(t.spaardoelId ?? null);
      setWerkgeverId(t.werkgeverId ?? null);
      setUrenStr(t.uren !== undefined ? String(t.uren).replace(".", ",") : "");
      setDatum(t.datum);
      setOmschrijving(t.omschrijving ?? "");
      if (t.omschrijving) setMeerOpen(true);
    });
  }, [bewerkId]);

  const zichtbareCategorieen = useMemo(() => {
    if (!categorieen) return [];
    const gebruik = categorieGebruik(transacties ?? []);
    return categorieen
      .filter((c) => !c.verborgen)
      .sort(
        (a, b) =>
          (gebruik.get(b.id ?? -1) ?? 0) - (gebruik.get(a.id ?? -1) ?? 0) ||
          a.volgorde - b.volgorde
      );
  }, [categorieen, transacties]);

  const spaarCategorie = useMemo(
    () => categorieen?.find((c) => c.naam === "Sparen"),
    [categorieen]
  );
  const isSparenGekozen =
    categorieId !== null && categorieId === spaarCategorie?.id;

  // Uren × uurloon vult het bedrag automatisch voor (blijft aanpasbaar)
  function vulLoonIn(nieuweUrenStr: string, nieuweWerkgeverId: number | null) {
    const uren = Number.parseFloat(nieuweUrenStr.replace(",", "."));
    const werkgever = werkgevers?.find((w) => w.id === nieuweWerkgeverId);
    if (Number.isFinite(uren) && uren > 0 && werkgever) {
      setBedragStr(centenNaarInvoer(Math.round(uren * werkgever.uurloon)));
    }
  }

  function tikCijfer(cijfer: string) {
    setBedragStr((huidig) => {
      const kommaIndex = huidig.indexOf(",");
      if (kommaIndex !== -1 && huidig.length - kommaIndex > 2) return huidig;
      if (kommaIndex === -1 && huidig.replace(/^0+/, "").length >= 6) return huidig;
      if (huidig === "0") return cijfer;
      return huidig + cijfer;
    });
  }

  function tikKomma() {
    setBedragStr((huidig) => {
      if (huidig.includes(",")) return huidig;
      return huidig === "" ? "0," : huidig + ",";
    });
  }

  function tikWissen() {
    setBedragStr((huidig) => huidig.slice(0, -1));
  }

  const bedragCenten = invoerNaarCenten(bedragStr);
  const kanOpslaan =
    bedragCenten !== null &&
    bedragCenten > 0 &&
    (type === "inkomst" || categorieId !== null) &&
    !bezig;

  async function slaOp() {
    if (bedragCenten === null || bedragCenten <= 0 || bezig) return;
    setBezig(true);

    const uren = Number.parseFloat(urenStr.replace(",", "."));
    const transactie: Transactie = {
      type,
      bedrag: bedragCenten,
      datum,
      categorieId: type === "uitgave" ? (categorieId ?? undefined) : undefined,
      spaardoelId:
        type === "uitgave" && isSparenGekozen && spaardoelId !== null
          ? spaardoelId
          : undefined,
      werkgeverId:
        type === "inkomst" && werkgeverId !== null ? werkgeverId : undefined,
      uren:
        type === "inkomst" && Number.isFinite(uren) && uren > 0
          ? uren
          : undefined,
      omschrijving: omschrijving.trim() || undefined,
      aangemaakt: origineel.current?.aangemaakt ?? Date.now(),
    };

    let id: number;
    const vorige = origineel.current;
    if (vorige?.id !== undefined) {
      id = vorige.id;
      await db.transacties.put({ ...transactie, id });
    } else {
      id = (await db.transacties.add(transactie)) as number;
    }

    if (onthoudSnelknop && type === "uitgave" && categorieId !== null) {
      const categorie = categorieen?.find((c) => c.id === categorieId);
      const knop: Omit<Snelknop, "id"> = {
        naam: omschrijving.trim() || categorie?.naam || "Snelknop",
        bedrag: bedragCenten,
        categorieId,
        gebruikt: 0,
      };
      await db.snelknoppen.add(knop);
    }

    toonBevestiging(transactie, id, vorige);
    navigate("/");
  }

  function toonBevestiging(
    transactie: Transactie,
    id: number,
    vorige: Transactie | null
  ) {
    const categorie = categorieen?.find((c) => c.id === transactie.categorieId);
    let melding = "Opgeslagen";
    if (transactie.type === "inkomst") {
      melding = `Inkomst van ${euro(transactie.bedrag)} opgeslagen`;
    } else if (categorie && categorie.budget > 0) {
      const [jaar, maand] = transactie.datum.split("-").map(Number);
      const eerder = uitgavenInMaandPerCategorie(
        (transacties ?? []).filter((t) => t.id !== id),
        jaar,
        maand,
        categorie.id ?? -1
      );
      const rest = categorie.budget - eerder - transactie.bedrag;
      melding =
        rest >= 0
          ? `Nog ${euro(rest)} over voor ${categorie.naam}`
          : `${categorie.naam} zit ${euro(-rest)} boven budget deze maand`;
    } else if (categorie) {
      melding = `${euro(transactie.bedrag)} opgeslagen in ${categorie.naam}`;
    }

    toast.success(melding, {
      duration: 5000,
      action: {
        label: "Ongedaan maken",
        onClick: () => {
          if (vorige) void db.transacties.put(vorige);
          else void db.transacties.delete(id);
        },
      },
    });
  }

  async function gebruikSnelknop(knop: Snelknop) {
    if (bezig) return;
    setBezig(true);
    const transactie: Transactie = {
      type: "uitgave",
      bedrag: knop.bedrag,
      datum: naarIsoDatum(new Date()),
      categorieId: knop.categorieId,
      omschrijving: knop.naam,
      aangemaakt: Date.now(),
    };
    const id = (await db.transacties.add(transactie)) as number;
    if (knop.id !== undefined) {
      await db.snelknoppen.update(knop.id, { gebruikt: knop.gebruikt + 1 });
    }
    toonBevestiging(transactie, id, null);
    navigate("/");
  }

  async function verwijder() {
    const vorige = origineel.current;
    if (vorige?.id === undefined) return;
    await db.transacties.delete(vorige.id);
    toast.success("Transactie verwijderd", {
      duration: 5000,
      action: {
        label: "Ongedaan maken",
        onClick: () => void db.transacties.put(vorige),
      },
    });
    navigate("/");
  }

  const vandaag = naarIsoDatum(new Date());

  return (
    <div className="flex min-h-dvh flex-col px-4 pb-4 pt-3">
      <header className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Sluiten"
          onClick={() => navigate(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="flex rounded-full bg-secondary p-1">
          {(["uitgave", "inkomst"] as const).map((keuze) => (
            <button
              key={keuze}
              type="button"
              onClick={() => setType(keuze)}
              className={cn(
                "min-h-9 rounded-full px-4 text-sm font-medium capitalize text-muted-foreground transition-colors",
                type === keuze && "bg-card text-foreground shadow-sm"
              )}
            >
              {keuze}
            </button>
          ))}
        </div>
        <div className="w-11" />
      </header>

      <div className="bedrag py-3 text-center">
        <span
          className={cn(
            "text-5xl font-semibold tracking-tight",
            bedragStr === "" && "text-muted-foreground/50"
          )}
        >
          € {bedragStr === "" ? "0,00" : bedragStr}
        </span>
      </div>

      {type === "uitgave" && (snelknoppen?.length ?? 0) > 0 && bewerkId === null && (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {snelknoppen?.map((knop) => (
            <button
              key={knop.id}
              type="button"
              onClick={() => void gebruikSnelknop(knop)}
              className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border bg-card px-4 text-sm font-medium"
            >
              <Zap className="h-3.5 w-3.5 text-primary" />
              {knop.naam} {euro(knop.bedrag)}
            </button>
          ))}
        </div>
      )}

      {type === "uitgave" ? (
        <div className="mb-3 grid grid-cols-3 gap-2">
          {zichtbareCategorieen.map((categorie) => (
            <button
              key={categorie.id}
              type="button"
              onClick={() => setCategorieId(categorie.id ?? null)}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-xl border bg-card px-1 py-2 transition-colors",
                categorieId === categorie.id &&
                  "border-primary bg-accent text-accent-foreground"
              )}
            >
              <span className="text-xl">{categorie.emoji}</span>
              <span className="w-full truncate text-center text-xs font-medium">
                {categorie.naam}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mb-3 space-y-3">
          <div>
            <Label className="mb-1.5 block text-sm">Werkgever</Label>
            <div className="flex gap-2">
              {werkgevers?.map((werkgever) => (
                <button
                  key={werkgever.id}
                  type="button"
                  onClick={() => {
                    const nieuwId = werkgever.id ?? null;
                    setWerkgeverId(nieuwId);
                    vulLoonIn(urenStr, nieuwId);
                  }}
                  className={cn(
                    "min-h-11 flex-1 rounded-xl border bg-card px-3 text-sm font-medium",
                    werkgeverId === werkgever.id &&
                      "border-primary bg-accent text-accent-foreground"
                  )}
                >
                  {werkgever.naam}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="uren" className="mb-1.5 block text-sm">
              Uren gewerkt
            </Label>
            <Input
              id="uren"
              inputMode="decimal"
              placeholder="bijv. 4,5"
              value={urenStr}
              onChange={(e) => {
                setUrenStr(e.target.value);
                vulLoonIn(e.target.value, werkgeverId);
              }}
              className="h-11"
            />
          </div>
        </div>
      )}

      {isSparenGekozen && (
        <div className="mb-3">
          <Label className="mb-1.5 block text-sm">Voor welk spaardoel?</Label>
          {(spaardoelen?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nog geen spaardoelen. Maak er een aan op het tabblad Doelen.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {spaardoelen?.map((doel) => (
                <button
                  key={doel.id}
                  type="button"
                  onClick={() =>
                    setSpaardoelId((huidig) =>
                      huidig === doel.id ? null : (doel.id ?? null)
                    )
                  }
                  className={cn(
                    "min-h-11 rounded-full border bg-card px-4 text-sm font-medium",
                    spaardoelId === doel.id &&
                      "border-primary bg-accent text-accent-foreground"
                  )}
                >
                  {doel.emoji} {doel.naam}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Collapsible open={meerOpen} onOpenChange={setMeerOpen} className="mb-3">
        <CollapsibleTrigger className="flex min-h-11 w-full items-center justify-between text-sm text-muted-foreground">
          <span>
            {datum === vandaag ? "Vandaag" : datumNL(datum)}
            {omschrijving.trim() !== "" && ` · ${omschrijving.trim()}`}
          </span>
          <span className="flex items-center gap-1">
            Meer
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", meerOpen && "rotate-180")}
            />
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div>
            <Label htmlFor="datum" className="mb-1.5 block text-sm">
              Datum
            </Label>
            <Input
              id="datum"
              type="date"
              value={datum}
              max={vandaag}
              onChange={(e) => e.target.value && setDatum(e.target.value)}
              className="h-11"
            />
          </div>
          <div>
            <Label htmlFor="omschrijving" className="mb-1.5 block text-sm">
              Omschrijving (niet verplicht)
            </Label>
            <Input
              id="omschrijving"
              placeholder="bijv. broodje bij de bakker"
              value={omschrijving}
              onChange={(e) => setOmschrijving(e.target.value)}
              className="h-11"
            />
          </div>
          {type === "uitgave" && bewerkId === null && (
            <div className="flex items-center justify-between">
              <Label htmlFor="snelknop" className="text-sm">
                Onthoud als snelknop
              </Label>
              <Switch
                id="snelknop"
                checked={onthoudSnelknop}
                onCheckedChange={setOnthoudSnelknop}
              />
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <div className="mt-auto space-y-3">
        <Cijferblok onCijfer={tikCijfer} onKomma={tikKomma} onWissen={tikWissen} />
        <Button
          className="h-14 w-full text-lg font-semibold"
          disabled={!kanOpslaan}
          onClick={() => void slaOp()}
        >
          Opslaan
        </Button>
        {bewerkId !== null && (
          <Button
            variant="ghost"
            className="h-11 w-full text-destructive"
            onClick={() => void verwijder()}
          >
            Verwijderen
          </Button>
        )}
      </div>
    </div>
  );
}
