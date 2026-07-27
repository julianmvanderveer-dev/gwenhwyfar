import { describe, expect, it } from "vitest";
import {
  centenNaarInvoer,
  datumKort,
  datumNL,
  euro,
  invoerNaarCenten,
  maandLabel,
  naarIsoDatum,
} from "./formatteren";

describe("euro", () => {
  it("formatteert met euroteken en komma", () => {
    // Intl gebruikt een vaste spatie (U+00A0) tussen € en het bedrag
    expect(euro(1250).replace(/\u00a0/g, " ")).toBe("€ 12,50");
    expect(euro(0).replace(/\u00a0/g, " ")).toBe("€ 0,00");
    expect(euro(-2500).replace(/\u00a0/g, " ")).toBe("€ -25,00");
    expect(euro(123456789).replace(/\u00a0/g, " ")).toBe("€ 1.234.567,89");
  });

  it("toont nooit NaN of Infinity", () => {
    expect(euro(Number.NaN).replace(/\u00a0/g, " ")).toBe("€ 0,00");
    expect(euro(Number.POSITIVE_INFINITY).replace(/\u00a0/g, " ")).toBe("€ 0,00");
  });
});

describe("invoerNaarCenten", () => {
  it("accepteert komma en punt als decimaalteken", () => {
    expect(invoerNaarCenten("12,50")).toBe(1250);
    expect(invoerNaarCenten("12.50")).toBe(1250);
    expect(invoerNaarCenten("12")).toBe(1200);
    expect(invoerNaarCenten("0,05")).toBe(5);
  });

  it("weigert ongeldige invoer", () => {
    expect(invoerNaarCenten("")).toBeNull();
    expect(invoerNaarCenten("abc")).toBeNull();
    expect(invoerNaarCenten("12,345")).toBeNull();
    expect(invoerNaarCenten("1,2,3")).toBeNull();
  });

  it("is de inverse van centenNaarInvoer", () => {
    expect(invoerNaarCenten(centenNaarInvoer(1250))).toBe(1250);
    expect(centenNaarInvoer(999)).toBe("9,99");
  });
});

describe("datums", () => {
  it("formatteert als dd-mm-jjjj", () => {
    expect(datumNL("2026-07-27")).toBe("27-07-2026");
  });

  it("maakt een ISO-datum in lokale tijd", () => {
    expect(naarIsoDatum(new Date(2026, 6, 27))).toBe("2026-07-27");
    expect(naarIsoDatum(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("maakt Nederlandse labels", () => {
    expect(maandLabel(2026, 7)).toBe("juli 2026");
    expect(datumKort("2026-07-05")).toBe("5 juli");
  });
});
