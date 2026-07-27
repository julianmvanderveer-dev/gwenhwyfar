/**
 * Demodata zodat de app niet leeg oogt bij de eerste start. Alles wat hier
 * wordt aangemaakt krijgt demo: true en is met één knop weer te wissen.
 */

import { db } from "./db";
import type { Transactie } from "./types";
import { naarIsoDatum } from "./formatteren";

/** Budgetten (in centen) die de demoknop instelt op categorieën zonder budget. */
const DEMO_BUDGETTEN: Record<string, number> = {
  Kleding: 5000,
  Uitgaan: 6000,
  "Eten & drinken": 5000,
  Vervoer: 2500,
  Telefoon: 1500,
  Sparen: 10000,
  Overig: 2500,
};

const DEMO_UITGAVEN: {
  categorie: string;
  bedrag: number;
  dag: number;
  omschrijving?: string;
}[] = [
  { categorie: "Eten & drinken", bedrag: 450, dag: 2, omschrijving: "Broodje" },
  { categorie: "Uitgaan", bedrag: 1750, dag: 5, omschrijving: "Bios met vrienden" },
  { categorie: "Vervoer", bedrag: 1000, dag: 7, omschrijving: "OV opladen" },
  { categorie: "Telefoon", bedrag: 1200, dag: 10, omschrijving: "Telefoonabonnement" },
  { categorie: "Eten & drinken", bedrag: 650, dag: 12, omschrijving: "Snacken na werk" },
  { categorie: "Kleding", bedrag: 3499, dag: 15, omschrijving: "T-shirt" },
  { categorie: "Uitgaan", bedrag: 2250, dag: 19, omschrijving: "Avondje uit" },
  { categorie: "Eten & drinken", bedrag: 380, dag: 22 },
  { categorie: "Overig", bedrag: 899, dag: 25, omschrijving: "Verjaardagscadeautje" },
];

export async function heeftDemodata(): Promise<boolean> {
  return (await db.transacties.filter((t) => t.demo === true).count()) > 0;
}

export async function vulDemodata(): Promise<void> {
  const categorieen = await db.categorieen.toArray();
  const werkgevers = await db.werkgevers.toArray();
  const categorieId = (naam: string) =>
    categorieen.find((c) => c.naam === naam)?.id;

  // Budgetten instellen op categorieën die nog geen budget hebben
  for (const [naam, budget] of Object.entries(DEMO_BUDGETTEN)) {
    const categorie = categorieen.find((c) => c.naam === naam);
    if (categorie?.id !== undefined && categorie.budget === 0) {
      await db.categorieen.update(categorie.id, { budget });
    }
  }

  const doelId = (await db.spaardoelen.add({
    naam: "Scooter",
    emoji: "🛵",
    streefbedrag: 120000,
    startbedrag: 20000,
    streefdatum: naarIsoDatum(
      new Date(new Date().getFullYear() + 1, new Date().getMonth(), 1)
    ),
    behaald: false,
    demo: true,
  })) as number;

  const nu = new Date();
  const transacties: Transactie[] = [];
  const spaarId = categorieId("Sparen");

  // Zes maanden aan inkomsten, uitgaven en spaarinleg
  for (let terug = 5; terug >= 0; terug--) {
    const maandDatum = new Date(nu.getFullYear(), nu.getMonth() - terug, 1);
    const jaar = maandDatum.getFullYear();
    const maand = maandDatum.getMonth();
    const dagenInMaand = new Date(jaar, maand + 1, 0).getDate();
    const isHuidige = terug === 0;
    const laatsteDag = isHuidige ? nu.getDate() : dagenInMaand;

    const datumOp = (dag: number) =>
      naarIsoDatum(new Date(jaar, maand, Math.min(dag, dagenInMaand)));

    for (const [index, werkgever] of werkgevers.entries()) {
      const uren = index === 0 ? 16 + (terug % 3) * 2 : 8;
      const dag = index === 0 ? 24 : 14;
      if (dag > laatsteDag) continue;
      if (werkgever.id === undefined) continue;
      transacties.push({
        type: "inkomst",
        bedrag: Math.round(uren * werkgever.uurloon),
        datum: datumOp(dag),
        werkgeverId: werkgever.id,
        uren,
        omschrijving: `Loon ${werkgever.naam}`,
        aangemaakt: Date.now(),
        demo: true,
      });
    }

    for (const [index, uitgave] of DEMO_UITGAVEN.entries()) {
      if (uitgave.dag > laatsteDag) continue;
      // Niet elke maand precies dezelfde uitgaven
      if ((index + terug) % 4 === 3) continue;
      transacties.push({
        type: "uitgave",
        bedrag: uitgave.bedrag,
        datum: datumOp(uitgave.dag),
        categorieId: categorieId(uitgave.categorie),
        omschrijving: uitgave.omschrijving,
        aangemaakt: Date.now(),
        demo: true,
      });
    }

    if (laatsteDag >= 26) {
      transacties.push({
        type: "uitgave",
        bedrag: 7500,
        datum: datumOp(26),
        categorieId: spaarId,
        spaardoelId: doelId,
        omschrijving: "Inleg Scooter",
        aangemaakt: Date.now(),
        demo: true,
      });
    }
  }

  await db.transacties.bulkAdd(transacties);

  const telefoonId = categorieId("Telefoon");
  const etenId = categorieId("Eten & drinken");
  if (telefoonId !== undefined && etenId !== undefined) {
    await db.snelknoppen.bulkAdd([
      { naam: "Telefoon", bedrag: 1200, categorieId: telefoonId, gebruikt: 2, demo: true },
      { naam: "Broodje", bedrag: 450, categorieId: etenId, gebruikt: 5, demo: true },
    ]);
  }
}

export async function wisDemodata(): Promise<void> {
  await db.transaction(
    "rw",
    [db.transacties, db.spaardoelen, db.snelknoppen, db.categorieen],
    async () => {
      await db.transacties.filter((t) => t.demo === true).delete();
      await db.spaardoelen.filter((d) => d.demo === true).delete();
      await db.snelknoppen.filter((s) => s.demo === true).delete();
      // Budgetten die de demo instelde weer terugzetten
      const categorieen = await db.categorieen.toArray();
      for (const categorie of categorieen) {
        const demoBudget = DEMO_BUDGETTEN[categorie.naam];
        if (
          categorie.id !== undefined &&
          demoBudget !== undefined &&
          categorie.budget === demoBudget
        ) {
          await db.categorieen.update(categorie.id, { budget: 0 });
        }
      }
    }
  );
}
