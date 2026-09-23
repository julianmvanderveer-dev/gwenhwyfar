// Vakantieperiodes die niet meetellen in de reactietermijn en waarin geen
// herinneringsmails worden verstuurd.
//
// Bouwvak: vroegste regiostart t/m laatste regio-einddatum.
//   Regel: zaterdag vóór ISO-week 29 t/m de zondag die ISO-week 34 afsluit.
// Kerstvakantie: 21 december t/m 5 januari.

export interface Periode {
  start: Date;
  eind: Date;
}

const DAY = 86400000;

/** Maandag (00:00 UTC) van de opgegeven ISO-week. */
function isoWeekMonday(jaar: number, week: number): Date {
  // 4 januari valt altijd in ISO-week 1.
  const jan4 = new Date(Date.UTC(jaar, 0, 4));
  const dow = (jan4.getUTCDay() + 6) % 7; // 0 = maandag
  const week1Monday = new Date(jan4.getTime() - dow * DAY);
  return new Date(week1Monday.getTime() + (week - 1) * 7 * DAY);
}

/** Bouwvak: zaterdag vóór week 29 t/m zondag einde week 34 (inclusief). */
export function bouwvakPeriode(jaar: number): Periode {
  const start = new Date(isoWeekMonday(jaar, 29).getTime() - 2 * DAY); // zaterdag ervoor
  const eindMonday = isoWeekMonday(jaar, 34);
  const eind = new Date(eindMonday.getTime() + 7 * DAY - 1); // zondag 23:59:59.999
  return { start, eind };
}

/** Kerstvakantie: 21 december (jaar) t/m 5 januari (jaar + 1). */
export function kerstPeriode(jaar: number): Periode {
  return {
    start: new Date(Date.UTC(jaar, 11, 21, 0, 0, 0, 0)),
    eind: new Date(Date.UTC(jaar + 1, 0, 5, 23, 59, 59, 999)),
  };
}

function periodesVoorJaar(jaar: number): Periode[] {
  return [bouwvakPeriode(jaar), kerstPeriode(jaar), kerstPeriode(jaar - 1)];
}

export function isInVakantie(datum: Date): boolean {
  const t = datum.getTime();
  return periodesVoorJaar(datum.getUTCFullYear()).some(
    (p) => t >= p.start.getTime() && t <= p.eind.getTime(),
  );
}

/**
 * Aantal milliseconden tussen `van` en `tot` dat binnen een vakantieperiode valt.
 * Wordt afgetrokken van de verstreken tijd sinds de deadline.
 */
export function vakantieMsTussen(van: Date, tot: Date): number {
  const start = van.getTime();
  const eind = tot.getTime();
  if (eind <= start) return 0;

  const jaren = new Set<number>();
  for (let j = van.getUTCFullYear() - 1; j <= tot.getUTCFullYear() + 1; j++) jaren.add(j);

  const periodes: Periode[] = [];
  for (const j of jaren) {
    periodes.push(bouwvakPeriode(j), kerstPeriode(j));
  }

  // Overlappen samenvoegen zodat niets dubbel telt.
  const ranges = periodes
    .map((p) => [Math.max(p.start.getTime(), start), Math.min(p.eind.getTime(), eind)] as const)
    .filter(([a, b]) => b > a)
    .sort((a, b) => a[0] - b[0]);

  let totaal = 0;
  let curStart = -1;
  let curEnd = -1;
  for (const [a, b] of ranges) {
    if (curStart === -1) {
      curStart = a;
      curEnd = b;
    } else if (a <= curEnd) {
      curEnd = Math.max(curEnd, b);
    } else {
      totaal += curEnd - curStart;
      curStart = a;
      curEnd = b;
    }
  }
  if (curStart !== -1) totaal += curEnd - curStart;
  return totaal;
}

/** Dagen (afgerond naar beneden) die binnen een vakantieperiode vallen. */
export function vakantieDagenTussen(van: Date, tot: Date): number {
  return Math.floor(vakantieMsTussen(van, tot) / DAY);
}
