import Dexie, { type EntityTable } from "dexie";
import type {
  Categorie,
  Instellingen,
  Snelknop,
  Spaardoel,
  Transactie,
  Werkgever,
} from "./types";

export class CentjeDatabase extends Dexie {
  categorieen!: EntityTable<Categorie, "id">;
  transacties!: EntityTable<Transactie, "id">;
  spaardoelen!: EntityTable<Spaardoel, "id">;
  werkgevers!: EntityTable<Werkgever, "id">;
  snelknoppen!: EntityTable<Snelknop, "id">;
  instellingen!: EntityTable<Instellingen, "id">;

  constructor() {
    super("centje");
    this.version(1).stores({
      categorieen: "++id, naam, volgorde",
      transacties: "++id, datum, type, categorieId, werkgeverId, spaardoelId",
      spaardoelen: "++id, naam",
      werkgevers: "++id, naam",
      snelknoppen: "++id, gebruikt",
      instellingen: "++id",
    });
  }
}

export const db = new CentjeDatabase();

export const STANDAARD_CATEGORIEEN: Omit<Categorie, "id">[] = [
  { naam: "Kleding", emoji: "👕", budget: 0, verborgen: false, volgorde: 0 },
  { naam: "Kapper", emoji: "💈", budget: 0, verborgen: false, volgorde: 1 },
  { naam: "Cadeaus", emoji: "🎁", budget: 0, verborgen: false, volgorde: 2 },
  { naam: "Persoonlijke verzorging", emoji: "🧴", budget: 0, verborgen: false, volgorde: 3 },
  { naam: "Uitgaan", emoji: "🎉", budget: 0, verborgen: false, volgorde: 4 },
  { naam: "Eten & drinken", emoji: "🍔", budget: 0, verborgen: false, volgorde: 5 },
  { naam: "Vervoer", emoji: "🚲", budget: 0, verborgen: false, volgorde: 6 },
  { naam: "Telefoon", emoji: "📱", budget: 0, verborgen: false, volgorde: 7 },
  { naam: "Abonnementen", emoji: "🔁", budget: 0, verborgen: false, volgorde: 8 },
  { naam: "Sparen", emoji: "🐷", budget: 0, verborgen: false, volgorde: 9 },
  { naam: "Overig", emoji: "📦", budget: 0, verborgen: false, volgorde: 10 },
];

export const STANDAARD_WERKGEVERS: Omit<Werkgever, "id">[] = [
  { naam: "McDonald's", uurloon: 700 },
  { naam: "Markt", uurloon: 800 },
];

/** Vult de database bij de allereerste start met standaardgegevens. */
export async function seedDatabase(): Promise<void> {
  await db.transaction("rw", db.categorieen, db.werkgevers, db.instellingen, async () => {
    if ((await db.categorieen.count()) === 0) {
      await db.categorieen.bulkAdd(STANDAARD_CATEGORIEEN);
    }
    if ((await db.werkgevers.count()) === 0) {
      await db.werkgevers.bulkAdd(STANDAARD_WERKGEVERS);
    }
    if ((await db.instellingen.count()) === 0) {
      await db.instellingen.add({
        beginsaldo: 0,
        waarschuwingsdrempel: 90,
        thema: "systeem",
      });
    }
  });
}
