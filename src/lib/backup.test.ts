import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db, seedDatabase } from "./db";
import { herstelBackup, isGeldigeBackup, maakBackup, maakCsv } from "./backup";

async function wisAlles() {
  await Promise.all(db.tables.map((tabel) => tabel.clear()));
}

beforeEach(async () => {
  await wisAlles();
});

describe("back-up en herstel", () => {
  it("geeft na exporteren en importeren exact dezelfde data terug", async () => {
    await seedDatabase();
    const categorie = await db.categorieen.toCollection().first();
    const doelId = (await db.spaardoelen.add({
      naam: "Scooter",
      emoji: "🛵",
      streefbedrag: 120000,
      startbedrag: 20000,
      streefdatum: "2027-07-01",
      behaald: false,
    })) as number;
    await db.transacties.bulkAdd([
      {
        type: "uitgave",
        bedrag: 1250,
        datum: "2026-07-27",
        categorieId: categorie?.id,
        omschrijving: "Broodje, met; puntkomma en \"aanhalingstekens\"",
        aangemaakt: 1,
      },
      {
        type: "inkomst",
        bedrag: 11200,
        datum: "2026-07-24",
        werkgeverId: 1,
        uren: 16,
        aangemaakt: 2,
      },
      {
        type: "uitgave",
        bedrag: 7500,
        datum: "2026-07-26",
        spaardoelId: doelId,
        aangemaakt: 3,
      },
    ]);
    await db.snelknoppen.add({
      naam: "Broodje",
      bedrag: 450,
      categorieId: categorie?.id ?? 1,
      gebruikt: 3,
    });

    const backup = await maakBackup();
    const totaalVoor = {
      categorieen: await db.categorieen.toArray(),
      transacties: await db.transacties.toArray(),
      spaardoelen: await db.spaardoelen.toArray(),
      werkgevers: await db.werkgevers.toArray(),
      snelknoppen: await db.snelknoppen.toArray(),
      instellingen: await db.instellingen.toArray(),
    };

    // Simuleer een gewiste browser: alles leeg, daarna herstellen
    await wisAlles();
    expect(await db.transacties.count()).toBe(0);

    // Via JSON-tekst, precies zoals het exportbestand werkt
    const geparsed: unknown = JSON.parse(JSON.stringify(backup));
    expect(isGeldigeBackup(geparsed)).toBe(true);
    if (!isGeldigeBackup(geparsed)) return;
    await herstelBackup(geparsed);

    expect(await db.categorieen.toArray()).toEqual(totaalVoor.categorieen);
    expect(await db.transacties.toArray()).toEqual(totaalVoor.transacties);
    expect(await db.spaardoelen.toArray()).toEqual(totaalVoor.spaardoelen);
    expect(await db.werkgevers.toArray()).toEqual(totaalVoor.werkgevers);
    expect(await db.snelknoppen.toArray()).toEqual(totaalVoor.snelknoppen);
    expect(await db.instellingen.toArray()).toEqual(totaalVoor.instellingen);
  });

  it("keurt onherkenbare bestanden af", () => {
    expect(isGeldigeBackup(null)).toBe(false);
    expect(isGeldigeBackup({})).toBe(false);
    expect(isGeldigeBackup({ app: "iets-anders", versie: 1 })).toBe(false);
  });
});

describe("CSV-export", () => {
  it("gebruikt puntkomma's, decimale komma's en ontsnapt bijzondere tekens", async () => {
    await seedDatabase();
    const categorie = await db.categorieen.toCollection().first();
    await db.transacties.add({
      type: "uitgave",
      bedrag: 1250,
      datum: "2026-07-27",
      categorieId: categorie?.id,
      omschrijving: 'Broodje; met "extra\'s"',
      aangemaakt: 1,
    });

    const csv = await maakCsv();
    expect(csv.startsWith("\uFEFF")).toBe(true);
    const regels = csv.slice(1).split("\r\n");
    expect(regels[0]).toBe("Datum;Type;Bedrag;Categorie;Omschrijving;Werkgever;Uren;Spaardoel");
    expect(regels[1]).toContain("27-07-2026;uitgave;12,50");
    expect(regels[1]).toContain('"Broodje; met ""extra\'s"""');
  });
});
