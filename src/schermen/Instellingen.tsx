import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import type { Categorie, Werkgever } from "@/lib/types";
import {
  downloadBestand,
  herstelBackup,
  isGeldigeBackup,
  maakBackup,
  maakCsv,
} from "@/lib/backup";
import { heeftDemodata, vulDemodata, wisDemodata } from "@/lib/demodata";
import {
  centenNaarInvoer,
  euro,
  invoerNaarCenten,
  naarIsoDatum,
} from "@/lib/formatteren";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export default function Instellingen() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const instellingen = useLiveQuery(() => db.instellingen.toCollection().first());
  const categorieen = useLiveQuery(() => db.categorieen.orderBy("volgorde").toArray());
  const werkgevers = useLiveQuery(() => db.werkgevers.toArray());
  const snelknoppen = useLiveQuery(() => db.snelknoppen.toArray());
  const demodataAanwezig = useLiveQuery(() => heeftDemodata());

  const [beginsaldoStr, setBeginsaldoStr] = useState<string | null>(null);
  const [bewerkCategorie, setBewerkCategorie] = useState<Categorie | null>(null);
  const [nieuweCategorie, setNieuweCategorie] = useState(false);
  const [bewerkWerkgever, setBewerkWerkgever] = useState<Werkgever | null>(null);
  const [nieuweWerkgever, setNieuweWerkgever] = useState(false);
  const [herstelBevestiging, setHerstelBevestiging] = useState<(() => void) | null>(null);
  const importInput = useRef<HTMLInputElement>(null);

  const getoondBeginsaldo =
    beginsaldoStr ??
    (instellingen && instellingen.beginsaldo !== 0
      ? centenNaarInvoer(instellingen.beginsaldo)
      : "");

  async function bewaarBeginsaldo(invoer: string) {
    setBeginsaldoStr(invoer);
    if (instellingen?.id === undefined) return;
    const negatief = invoer.trim().startsWith("-");
    const centen = invoerNaarCenten(invoer.trim().replace(/^-/, ""));
    if (invoer.trim() === "") {
      await db.instellingen.update(instellingen.id, { beginsaldo: 0 });
    } else if (centen !== null) {
      await db.instellingen.update(instellingen.id, {
        beginsaldo: negatief ? -centen : centen,
      });
    }
  }

  async function exporteerJson() {
    const backup = await maakBackup();
    downloadBestand(
      JSON.stringify(backup, null, 2),
      `centje-backup-${naarIsoDatum(new Date())}.json`,
      "application/json"
    );
    toast.success("Back-up gedownload. Bewaar het bestand op een veilige plek.");
  }

  async function exporteerCsv() {
    downloadBestand(
      await maakCsv(),
      `centje-transacties-${naarIsoDatum(new Date())}.csv`,
      "text/csv;charset=utf-8"
    );
    toast.success("CSV gedownload — te openen in Excel.");
  }

  function kiesImportBestand() {
    importInput.current?.click();
  }

  async function verwerkImport(bestand: File) {
    let geparsed: unknown;
    try {
      geparsed = JSON.parse(await bestand.text());
    } catch {
      toast.error("Dit bestand is geen geldige Centje-back-up.");
      return;
    }
    if (!isGeldigeBackup(geparsed)) {
      toast.error("Dit bestand is geen geldige Centje-back-up.");
      return;
    }
    const backup = geparsed;
    setHerstelBevestiging(() => () => {
      void herstelBackup(backup).then(() => {
        const thema = backup.instellingen[0]?.thema;
        if (thema) {
          setTheme(
            thema === "licht" ? "light" : thema === "donker" ? "dark" : "system"
          );
        }
        toast.success("Back-up hersteld. Al je gegevens staan er weer.");
      });
    });
  }

  return (
    <div className="space-y-4 px-4 pt-4">
      <header className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Terug"
          onClick={() => navigate(-1)}
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">Instellingen</h1>
      </header>

      <Card>
        <CardContent className="space-y-4 pt-4">
          <div>
            <Label htmlFor="beginsaldo" className="mb-1.5 block text-sm">
              Beginsaldo (€)
            </Label>
            <Input
              id="beginsaldo"
              inputMode="decimal"
              placeholder="0,00"
              value={getoondBeginsaldo}
              onChange={(e) => void bewaarBeginsaldo(e.target.value)}
              className="bedrag h-11"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Wat er op je rekening stond toen je met Centje begon.
            </p>
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">
              Waarschuwing bij {instellingen?.waarschuwingsdrempel ?? 90}% van het
              budget
            </Label>
            <Slider
              value={[instellingen?.waarschuwingsdrempel ?? 90]}
              min={50}
              max={100}
              step={5}
              onValueChange={([waarde]) => {
                if (instellingen?.id !== undefined) {
                  void db.instellingen.update(instellingen.id, {
                    waarschuwingsdrempel: waarde,
                  });
                }
              }}
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">Thema</Label>
            <Select
              value={theme ?? "system"}
              onValueChange={(waarde) => {
                setTheme(waarde);
                if (instellingen?.id !== undefined) {
                  void db.instellingen.update(instellingen.id, {
                    thema:
                      waarde === "light"
                        ? "licht"
                        : waarde === "dark"
                          ? "donker"
                          : "systeem",
                  });
                }
              }}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">Zelfde als telefoon</SelectItem>
                <SelectItem value="light">Licht</SelectItem>
                <SelectItem value="dark">Donker</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Categorieën</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1"
            onClick={() => setNieuweCategorie(true)}
          >
            <Plus className="h-4 w-4" /> Nieuw
          </Button>
        </div>
        <Card>
          <CardContent className="divide-y p-0">
            {categorieen?.map((categorie) => (
              <div key={categorie.id} className="flex items-center gap-2 px-4 py-2">
                <span
                  className={`min-w-0 flex-1 truncate text-sm ${
                    categorie.verborgen ? "text-muted-foreground line-through" : ""
                  }`}
                >
                  {categorie.emoji} {categorie.naam}
                </span>
                {categorie.budget > 0 && (
                  <span className="bedrag text-xs text-muted-foreground">
                    {euro(categorie.budget)}/mnd
                  </span>
                )}
                <button
                  type="button"
                  aria-label={`${categorie.naam} bewerken`}
                  onClick={() => setBewerkCategorie(categorie)}
                  className="flex h-11 w-11 items-center justify-center text-muted-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Werkgevers en uurloon
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1"
            onClick={() => setNieuweWerkgever(true)}
          >
            <Plus className="h-4 w-4" /> Nieuw
          </Button>
        </div>
        <Card>
          <CardContent className="divide-y p-0">
            {werkgevers?.map((werkgever) => (
              <div key={werkgever.id} className="flex items-center gap-2 px-4 py-2">
                <span className="min-w-0 flex-1 truncate text-sm">{werkgever.naam}</span>
                <span className="bedrag text-xs text-muted-foreground">
                  {euro(werkgever.uurloon)}/uur
                </span>
                <button
                  type="button"
                  aria-label={`${werkgever.naam} bewerken`}
                  onClick={() => setBewerkWerkgever(werkgever)}
                  className="flex h-11 w-11 items-center justify-center text-muted-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {(snelknoppen?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
            Snelknoppen
          </h2>
          <Card>
            <CardContent className="divide-y p-0">
              {snelknoppen?.map((knop) => (
                <div key={knop.id} className="flex items-center gap-2 px-4 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {knop.naam} · {euro(knop.bedrag)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Snelknop ${knop.naam} verwijderen`}
                    onClick={() => {
                      if (knop.id !== undefined) void db.snelknoppen.delete(knop.id);
                    }}
                    className="flex h-11 w-11 items-center justify-center text-muted-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          Back-up en herstel
        </h2>
        <Card>
          <CardContent className="space-y-2 pt-4">
            <p className="text-xs text-muted-foreground">
              Al je gegevens staan alleen op dit toestel. Maak regelmatig een
              back-up, dan ben je niets kwijt als de browsergegevens worden
              gewist.
            </p>
            <Button className="h-11 w-full" onClick={() => void exporteerJson()}>
              Back-up maken (JSON)
            </Button>
            <Button
              variant="secondary"
              className="h-11 w-full"
              onClick={kiesImportBestand}
            >
              Back-up terugzetten
            </Button>
            <Button
              variant="secondary"
              className="h-11 w-full"
              onClick={() => void exporteerCsv()}
            >
              Exporteren naar Excel (CSV)
            </Button>
            <input
              ref={importInput}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const bestand = e.target.files?.[0];
                if (bestand) void verwerkImport(bestand);
                e.target.value = "";
              }}
            />
          </CardContent>
        </Card>
      </section>

      <section className="pb-6">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Demodata</h2>
        <Card>
          <CardContent className="space-y-2 pt-4">
            {demodataAanwezig ? (
              <Button
                variant="secondary"
                className="h-11 w-full"
                onClick={() =>
                  void wisDemodata().then(() => toast.success("Demodata gewist."))
                }
              >
                Demodata wissen
              </Button>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Vul de app met voorbeeldgegevens om alle schermen in actie te
                  zien. Wissen kan altijd, jouw eigen gegevens blijven staan.
                </p>
                <Button
                  variant="secondary"
                  className="h-11 w-full"
                  onClick={() =>
                    void vulDemodata().then(() =>
                      toast.success("Demodata toegevoegd. Kijk maar rond!")
                    )
                  }
                >
                  Demodata toevoegen
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <CategorieDialog
        open={nieuweCategorie || bewerkCategorie !== null}
        categorie={bewerkCategorie}
        volgendeVolgorde={(categorieen?.length ?? 0)}
        onSluit={() => {
          setNieuweCategorie(false);
          setBewerkCategorie(null);
        }}
      />
      <WerkgeverDialog
        open={nieuweWerkgever || bewerkWerkgever !== null}
        werkgever={bewerkWerkgever}
        onSluit={() => {
          setNieuweWerkgever(false);
          setBewerkWerkgever(null);
        }}
      />

      <AlertDialog
        open={herstelBevestiging !== null}
        onOpenChange={(open) => !open && setHerstelBevestiging(null)}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Back-up terugzetten?</AlertDialogTitle>
            <AlertDialogDescription>
              Dit vervangt álle huidige gegevens in de app door de inhoud van de
              back-up. Dit kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Annuleren</AlertDialogCancel>
            <AlertDialogAction
              className="h-11"
              onClick={() => {
                herstelBevestiging?.();
                setHerstelBevestiging(null);
              }}
            >
              Terugzetten
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CategorieDialog({
  open,
  categorie,
  volgendeVolgorde,
  onSluit,
}: {
  open: boolean;
  categorie: Categorie | null;
  volgendeVolgorde: number;
  onSluit: () => void;
}) {
  const [naam, setNaam] = useState("");
  const [emoji, setEmoji] = useState("");
  const [verborgen, setVerborgen] = useState(false);
  const [geladenVoor, setGeladenVoor] = useState<number | null | undefined>(undefined);

  if (open && geladenVoor !== (categorie?.id ?? null)) {
    setGeladenVoor(categorie?.id ?? null);
    setNaam(categorie?.naam ?? "");
    setEmoji(categorie?.emoji ?? "");
    setVerborgen(categorie?.verborgen ?? false);
  }
  if (!open && geladenVoor !== undefined) setGeladenVoor(undefined);

  const geldig = naam.trim() !== "";

  async function bewaar() {
    if (!geldig) return;
    if (categorie?.id !== undefined) {
      await db.categorieen.update(categorie.id, {
        naam: naam.trim(),
        emoji: emoji.trim() || "📦",
        verborgen,
      });
    } else {
      await db.categorieen.add({
        naam: naam.trim(),
        emoji: emoji.trim() || "📦",
        budget: 0,
        verborgen: false,
        volgorde: volgendeVolgorde,
      });
    }
    onSluit();
  }

  async function verwijderCategorie() {
    if (categorie?.id === undefined) return;
    const gekoppeld = await db.transacties
      .where("categorieId")
      .equals(categorie.id)
      .count();
    if (gekoppeld > 0) {
      // Nooit hard verwijderen als er transacties aan hangen — verbergen kan wel
      await db.categorieen.update(categorie.id, { verborgen: true });
      toast(
        `Er hangen ${gekoppeld} transacties aan ${categorie.naam}, dus de categorie is verborgen in plaats van verwijderd.`
      );
    } else {
      await db.categorieen.delete(categorie.id);
    }
    onSluit();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onSluit()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {categorie ? "Categorie bewerken" : "Nieuwe categorie"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="w-16">
              <Label htmlFor="cat-emoji" className="mb-1.5 block text-sm">
                Emoji
              </Label>
              <Input
                id="cat-emoji"
                value={emoji}
                placeholder="📦"
                onChange={(e) => setEmoji(e.target.value)}
                className="h-11 text-center"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="cat-naam" className="mb-1.5 block text-sm">
                Naam
              </Label>
              <Input
                id="cat-naam"
                value={naam}
                placeholder="bijv. Gamen"
                onChange={(e) => setNaam(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          {categorie && (
            <div className="flex items-center justify-between">
              <Label htmlFor="cat-verborgen" className="flex items-center gap-2 text-sm">
                {verborgen ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                Verbergen in lijsten
              </Label>
              <Switch
                id="cat-verborgen"
                checked={verborgen}
                onCheckedChange={setVerborgen}
              />
            </div>
          )}
          <Button className="h-12 w-full" disabled={!geldig} onClick={() => void bewaar()}>
            Opslaan
          </Button>
          {categorie && (
            <Button
              variant="ghost"
              className="h-11 w-full text-destructive"
              onClick={() => void verwijderCategorie()}
            >
              Verwijderen
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WerkgeverDialog({
  open,
  werkgever,
  onSluit,
}: {
  open: boolean;
  werkgever: Werkgever | null;
  onSluit: () => void;
}) {
  const [naam, setNaam] = useState("");
  const [uurloonStr, setUurloonStr] = useState("");
  const [geladenVoor, setGeladenVoor] = useState<number | null | undefined>(undefined);

  if (open && geladenVoor !== (werkgever?.id ?? null)) {
    setGeladenVoor(werkgever?.id ?? null);
    setNaam(werkgever?.naam ?? "");
    setUurloonStr(werkgever ? centenNaarInvoer(werkgever.uurloon) : "");
  }
  if (!open && geladenVoor !== undefined) setGeladenVoor(undefined);

  const uurloon = invoerNaarCenten(uurloonStr);
  const geldig = naam.trim() !== "" && uurloon !== null && uurloon > 0;

  async function bewaar() {
    if (!geldig || uurloon === null) return;
    if (werkgever?.id !== undefined) {
      await db.werkgevers.update(werkgever.id, { naam: naam.trim(), uurloon });
    } else {
      await db.werkgevers.add({ naam: naam.trim(), uurloon });
    }
    onSluit();
  }

  async function verwijderWerkgever() {
    if (werkgever?.id === undefined) return;
    const gekoppeld = await db.transacties
      .where("werkgeverId")
      .equals(werkgever.id)
      .count();
    if (gekoppeld > 0) {
      toast.error(
        `Er hangen ${gekoppeld} inkomsten aan ${werkgever.naam}; deze werkgever kan niet worden verwijderd.`
      );
      return;
    }
    await db.werkgevers.delete(werkgever.id);
    onSluit();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onSluit()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {werkgever ? "Werkgever bewerken" : "Nieuwe werkgever"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="wg-naam" className="mb-1.5 block text-sm">
              Naam
            </Label>
            <Input
              id="wg-naam"
              value={naam}
              placeholder="bijv. McDonald's"
              onChange={(e) => setNaam(e.target.value)}
              className="h-11"
            />
          </div>
          <div>
            <Label htmlFor="wg-uurloon" className="mb-1.5 block text-sm">
              Uurloon (€)
            </Label>
            <Input
              id="wg-uurloon"
              inputMode="decimal"
              value={uurloonStr}
              placeholder="bijv. 7,00"
              onChange={(e) => setUurloonStr(e.target.value)}
              className="bedrag h-11"
            />
          </div>
          <Button className="h-12 w-full" disabled={!geldig} onClick={() => void bewaar()}>
            Opslaan
          </Button>
          {werkgever && (
            <Button
              variant="ghost"
              className="h-11 w-full text-destructive"
              onClick={() => void verwijderWerkgever()}
            >
              Verwijderen
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
