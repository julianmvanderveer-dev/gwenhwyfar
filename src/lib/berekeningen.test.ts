import { describe, expect, it } from "vitest";
import {
  categorieGebruik,
  doelPercentage,
  gemiddeldeUitgavenPerMaand,
  gespaardInJaar,
  gespaardVoorDoel,
  heleMaandenTot,
  inkomstenInMaand,
  inkomstenPerMaand,
  isSparen,
  nodigPerMaand,
  percentageGebruikt,
  perWerkgever,
  prognoseEindeMaand,
  saldo,
  spaarratio,
  topUitgaven,
  totaalVermogen,
  uitgavenInMaand,
  uitgavenInMaandPerCategorie,
  uitgavenPerCategorie,
  vrijBesteedbaar,
} from "./berekeningen";
import type { Categorie, Spaardoel, Transactie } from "./types";

let volgendId = 1;

function uitgave(bedrag: number, extra: Partial<Transactie> = {}): Transactie {
  return {
    id: volgendId++,
    type: "uitgave",
    bedrag,
    datum: "2026-07-15",
    aangemaakt: 0,
    ...extra,
  };
}

function inkomst(bedrag: number, extra: Partial<Transactie> = {}): Transactie {
  return {
    id: volgendId++,
    type: "inkomst",
    bedrag,
    datum: "2026-07-15",
    aangemaakt: 0,
    ...extra,
  };
}

function categorie(budget: number, extra: Partial<Categorie> = {}): Categorie {
  return {
    naam: "Test",
    emoji: "🧪",
    budget,
    verborgen: false,
    volgorde: 0,
    ...extra,
  };
}

describe("saldo", () => {
  it("is beginsaldo + inkomsten − uitgaven", () => {
    const transacties = [inkomst(10000), inkomst(2500), uitgave(4000)];
    expect(saldo(5000, transacties)).toBe(13500);
  });

  it("is het beginsaldo zonder transacties", () => {
    expect(saldo(5000, [])).toBe(5000);
  });

  it("mag negatief worden", () => {
    expect(saldo(0, [uitgave(2500)])).toBe(-2500);
  });

  it("telt sparen als uitgave", () => {
    expect(saldo(10000, [uitgave(3000, { spaardoelId: 1 })])).toBe(7000);
  });
});

describe("inkomsten en uitgaven per maand", () => {
  const transacties = [
    inkomst(10000, { datum: "2026-07-01" }),
    inkomst(5000, { datum: "2026-06-30" }),
    uitgave(2000, { datum: "2026-07-31" }),
    uitgave(999, { datum: "2025-07-15" }),
  ];

  it("filtert op jaar én maand", () => {
    expect(inkomstenInMaand(transacties, 2026, 7)).toBe(10000);
    expect(uitgavenInMaand(transacties, 2026, 7)).toBe(2000);
  });

  it("geeft 0 in een maand zonder transacties", () => {
    expect(inkomstenInMaand(transacties, 2026, 1)).toBe(0);
    expect(uitgavenInMaand(transacties, 2026, 1)).toBe(0);
  });

  it("geeft 0 zonder data", () => {
    expect(uitgavenInMaand([], 2026, 7)).toBe(0);
  });

  it("filtert per categorie", () => {
    const ts = [
      uitgave(1000, { categorieId: 1 }),
      uitgave(500, { categorieId: 2 }),
      uitgave(250, { categorieId: 1, datum: "2026-06-01" }),
    ];
    expect(uitgavenInMaandPerCategorie(ts, 2026, 7, 1)).toBe(1000);
  });
});

describe("sparen", () => {
  it("herkent sparen via spaardoel of categorie Sparen", () => {
    expect(isSparen(uitgave(100, { spaardoelId: 3 }), 9)).toBe(true);
    expect(isSparen(uitgave(100, { categorieId: 9 }), 9)).toBe(true);
    expect(isSparen(uitgave(100, { categorieId: 1 }), 9)).toBe(false);
    expect(isSparen(inkomst(100, { categorieId: 9 }), 9)).toBe(false);
  });

  it("telt gespaard in een jaar op", () => {
    const ts = [
      uitgave(1000, { spaardoelId: 1, datum: "2026-01-01" }),
      uitgave(2000, { categorieId: 9, datum: "2026-12-31" }),
      uitgave(5000, { spaardoelId: 1, datum: "2025-06-01" }),
      uitgave(700, { categorieId: 1 }),
    ];
    expect(gespaardInJaar(ts, 2026, 9)).toBe(3000);
  });

  it("gespaard voor een doel = startbedrag + inleg over alle jaren", () => {
    const doel: Spaardoel = {
      id: 1,
      naam: "Scooter",
      emoji: "🛵",
      streefbedrag: 100000,
      startbedrag: 15000,
      behaald: false,
    };
    const ts = [
      uitgave(1000, { spaardoelId: 1, datum: "2025-01-01" }),
      uitgave(2000, { spaardoelId: 1, datum: "2026-01-01" }),
      uitgave(999, { spaardoelId: 2 }),
    ];
    expect(gespaardVoorDoel(doel, ts)).toBe(18000);
    expect(gespaardVoorDoel(doel, [])).toBe(15000);
  });
});

describe("totaalVermogen", () => {
  it("is saldo + startbedragen + gespaard dit jaar", () => {
    const doelen: Spaardoel[] = [
      { id: 1, naam: "A", emoji: "🅰️", streefbedrag: 1, startbedrag: 10000, behaald: false },
      { id: 2, naam: "B", emoji: "🅱️", streefbedrag: 1, startbedrag: 5000, behaald: false },
    ];
    expect(totaalVermogen(20000, doelen, 3000)).toBe(38000);
  });

  it("werkt zonder doelen en met negatief saldo", () => {
    expect(totaalVermogen(-500, [], 0)).toBe(-500);
  });
});

describe("vrijBesteedbaar", () => {
  it("is som van maandbudgetten − uitgaven deze maand", () => {
    const cats = [categorie(10000), categorie(5000)];
    expect(vrijBesteedbaar(cats, 4000)).toBe(11000);
  });

  it("telt verborgen categorieën niet mee", () => {
    const cats = [categorie(10000), categorie(5000, { verborgen: true })];
    expect(vrijBesteedbaar(cats, 0)).toBe(10000);
  });

  it("mag negatief worden en werkt zonder data", () => {
    expect(vrijBesteedbaar([], 2500)).toBe(-2500);
    expect(vrijBesteedbaar([], 0)).toBe(0);
  });
});

describe("percentageGebruikt", () => {
  it("berekent uitgegeven ÷ budget", () => {
    expect(percentageGebruikt(5000, 10000)).toBe(50);
    expect(percentageGebruikt(12000, 10000)).toBe(120);
  });

  it("geeft null bij budget 0 (toon streepje, geen fout)", () => {
    expect(percentageGebruikt(5000, 0)).toBeNull();
    expect(percentageGebruikt(0, 0)).toBeNull();
  });

  it("is 0 zonder uitgaven", () => {
    expect(percentageGebruikt(0, 10000)).toBe(0);
  });
});

describe("prognoseEindeMaand", () => {
  it("extrapoleert naar de hele maand", () => {
    // € 100 na 10 van 30 dagen → € 300
    expect(prognoseEindeMaand(10000, 10, 30)).toBe(30000);
  });

  it("deelt nooit door nul", () => {
    expect(prognoseEindeMaand(10000, 0, 30)).toBe(10000);
  });

  it("is 0 in een maand zonder uitgaven", () => {
    expect(prognoseEindeMaand(0, 15, 31)).toBe(0);
  });
});

describe("spaarratio", () => {
  it("is gespaard ÷ inkomsten", () => {
    expect(spaarratio(2500, 10000)).toBe(0.25);
  });

  it("geeft null bij inkomsten 0 (nooit NaN of Infinity)", () => {
    expect(spaarratio(2500, 0)).toBeNull();
    expect(spaarratio(0, 0)).toBeNull();
  });
});

describe("gemiddeldeUitgavenPerMaand", () => {
  it("is totale uitgaven ÷ verstreken maanden", () => {
    expect(gemiddeldeUitgavenPerMaand(70000, 7)).toBe(10000);
  });

  it("deelt nooit door nul", () => {
    expect(gemiddeldeUitgavenPerMaand(70000, 0)).toBe(0);
  });
});

describe("heleMaandenTot", () => {
  it("telt hele maanden tot de streefdatum", () => {
    expect(heleMaandenTot("2026-07-27", "2026-12-27")).toBe(5);
    expect(heleMaandenTot("2026-07-27", "2026-12-26")).toBe(4);
    expect(heleMaandenTot("2026-07-27", "2027-07-27")).toBe(12);
  });

  it("geeft 0 bij een verstreken of huidige datum", () => {
    expect(heleMaandenTot("2026-07-27", "2026-07-27")).toBe(0);
    expect(heleMaandenTot("2026-07-27", "2026-01-01")).toBe(0);
    expect(heleMaandenTot("2026-07-27", "2026-08-10")).toBe(0);
  });
});

describe("nodigPerMaand", () => {
  it("verdeelt het restbedrag over de resterende maanden", () => {
    expect(nodigPerMaand(100000, 40000, 6)).toBe(10000);
  });

  it("rondt omhoog zodat het doel echt wordt gehaald", () => {
    expect(nodigPerMaand(100000, 0, 3)).toBe(33334);
  });

  it("toont het volledige restbedrag bij een verstreken streefdatum", () => {
    expect(nodigPerMaand(100000, 40000, 0)).toBe(60000);
  });

  it("geeft 0 bij een gehaald of overtroffen doel", () => {
    expect(nodigPerMaand(100000, 100000, 5)).toBe(0);
    expect(nodigPerMaand(100000, 120000, 0)).toBe(0);
  });
});

describe("doelPercentage", () => {
  it("berekent het percentage en kapt af op 100", () => {
    expect(doelPercentage(2500, 10000)).toBe(25);
    expect(doelPercentage(15000, 10000)).toBe(100);
  });

  it("geeft 0 bij streefbedrag 0", () => {
    expect(doelPercentage(2500, 0)).toBe(0);
  });
});

describe("topUitgaven", () => {
  it("geeft de grootste uitgaven van groot naar klein", () => {
    const ts = [uitgave(100), uitgave(500), uitgave(300), inkomst(9999)];
    expect(topUitgaven(ts, 2).map((t) => t.bedrag)).toEqual([500, 300]);
  });

  it("werkt zonder data", () => {
    expect(topUitgaven([], 5)).toEqual([]);
  });
});

describe("perWerkgever", () => {
  it("telt geld en uren per werkgever op", () => {
    const ts = [
      inkomst(7000, { werkgeverId: 1, uren: 10 }),
      inkomst(3500, { werkgeverId: 1, uren: 5 }),
      inkomst(8000, { werkgeverId: 2, uren: 10 }),
      inkomst(1000),
      uitgave(500, { werkgeverId: 1 }),
    ];
    const totalen = perWerkgever(ts);
    expect(totalen).toEqual([
      { werkgeverId: 1, bedrag: 10500, uren: 15 },
      { werkgeverId: 2, bedrag: 8000, uren: 10 },
    ]);
  });
});

describe("categorieGebruik", () => {
  it("telt gebruik per categorie", () => {
    const ts = [
      uitgave(1, { categorieId: 1 }),
      uitgave(1, { categorieId: 1 }),
      uitgave(1, { categorieId: 2 }),
      uitgave(1),
    ];
    const telling = categorieGebruik(ts);
    expect(telling.get(1)).toBe(2);
    expect(telling.get(2)).toBe(1);
  });
});

describe("jaaroverzichten", () => {
  it("groepeert inkomsten per maand", () => {
    const ts = [
      inkomst(1000, { datum: "2026-01-15" }),
      inkomst(2000, { datum: "2026-01-20" }),
      inkomst(3000, { datum: "2026-12-01" }),
      inkomst(9999, { datum: "2025-06-01" }),
    ];
    const maanden = inkomstenPerMaand(ts, 2026);
    expect(maanden[0]).toBe(3000);
    expect(maanden[11]).toBe(3000);
    expect(maanden[5]).toBe(0);
  });

  it("groepeert uitgaven per categorie, groot naar klein", () => {
    const ts = [
      uitgave(1000, { categorieId: 1 }),
      uitgave(5000, { categorieId: 2 }),
      uitgave(500, { categorieId: 1 }),
      uitgave(9999, { categorieId: 1, datum: "2025-01-01" }),
    ];
    expect(uitgavenPerCategorie(ts, 2026)).toEqual([
      { categorieId: 2, bedrag: 5000 },
      { categorieId: 1, bedrag: 1500 },
    ]);
  });
});
