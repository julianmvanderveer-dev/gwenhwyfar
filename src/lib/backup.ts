/**
 * Back-up en herstel: exporteren naar JSON (volledig herstelbaar) en naar
 * CSV voor Excel. Zonder back-up is één gewiste browsercache fataal.
 */

import { db } from "./db";
import type {
  Categorie,
  Instellingen,
  Snelknop,
  Spaardoel,
  Transactie,
  Werkgever,
} from "./types";
import { centenNaarInvoer, datumNL } from "./formatteren";

export interface BackupBestand {
  app: "centje";
  versie: 1;
  geexporteerd: string;
  categorieen: Categorie[];
  transacties: Transactie[];
  spaardoelen: Spaardoel[];
  werkgevers: Werkgever[];
  snelknoppen: Snelknop[];
  instellingen: Instellingen[];
}

export async function maakBackup(): Promise<BackupBestand> {
  return {
    app: "centje",
    versie: 1,
    geexporteerd: new Date().toISOString(),
    categorieen: await db.categorieen.toArray(),
    transacties: await db.transacties.toArray(),
    spaardoelen: await db.spaardoelen.toArray(),
    werkgevers: await db.werkgevers.toArray(),
    snelknoppen: await db.snelknoppen.toArray(),
    instellingen: await db.instellingen.toArray(),
  };
}

export function isGeldigeBackup(gegevens: unknown): gegevens is BackupBestand {
  if (typeof gegevens !== "object" || gegevens === null) return false;
  const b = gegevens as Record<string, unknown>;
  return (
    b.app === "centje" &&
    b.versie === 1 &&
    Array.isArray(b.categorieen) &&
    Array.isArray(b.transacties) &&
    Array.isArray(b.spaardoelen) &&
    Array.isArray(b.werkgevers) &&
    Array.isArray(b.snelknoppen) &&
    Array.isArray(b.instellingen)
  );
}

/** Vervangt alle data in de database door de inhoud van de back-up. */
export async function herstelBackup(backup: BackupBestand): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.categorieen,
      db.transacties,
      db.spaardoelen,
      db.werkgevers,
      db.snelknoppen,
      db.instellingen,
    ],
    async () => {
      await Promise.all([
        db.categorieen.clear(),
        db.transacties.clear(),
        db.spaardoelen.clear(),
        db.werkgevers.clear(),
        db.snelknoppen.clear(),
        db.instellingen.clear(),
      ]);
      await db.categorieen.bulkPut(backup.categorieen);
      await db.transacties.bulkPut(backup.transacties);
      await db.spaardoelen.bulkPut(backup.spaardoelen);
      await db.werkgevers.bulkPut(backup.werkgevers);
      await db.snelknoppen.bulkPut(backup.snelknoppen);
      await db.instellingen.bulkPut(backup.instellingen);
    }
  );
}

/**
 * CSV voor Excel: puntkomma als scheidingsteken en komma als decimaalteken,
 * zoals de Nederlandse Excel verwacht, met BOM zodat emoji's goed openen.
 */
export async function maakCsv(): Promise<string> {
  const [transacties, categorieen, werkgevers, spaardoelen] = await Promise.all([
    db.transacties.orderBy("datum").toArray(),
    db.categorieen.toArray(),
    db.werkgevers.toArray(),
    db.spaardoelen.toArray(),
  ]);

  const kop = [
    "Datum",
    "Type",
    "Bedrag",
    "Categorie",
    "Omschrijving",
    "Werkgever",
    "Uren",
    "Spaardoel",
  ];
  const regels = transacties.map((t) => {
    const categorie = categorieen.find((c) => c.id === t.categorieId);
    const werkgever = werkgevers.find((w) => w.id === t.werkgeverId);
    const doel = spaardoelen.find((d) => d.id === t.spaardoelId);
    return [
      datumNL(t.datum),
      t.type,
      centenNaarInvoer(t.bedrag),
      categorie?.naam ?? "",
      t.omschrijving ?? "",
      werkgever?.naam ?? "",
      t.uren !== undefined ? String(t.uren).replace(".", ",") : "",
      doel?.naam ?? "",
    ].map(csvVeld);
  });

  return (
    "\uFEFF" + [kop, ...regels].map((regel) => regel.join(";")).join("\r\n")
  );
}

function csvVeld(waarde: string): string {
  if (/[";\r\n]/.test(waarde)) {
    return `"${waarde.replace(/"/g, '""')}"`;
  }
  return waarde;
}

export function downloadBestand(
  inhoud: string,
  bestandsnaam: string,
  type: string
): void {
  const blob = new Blob([inhoud], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = bestandsnaam;
  a.click();
  URL.revokeObjectURL(url);
}
