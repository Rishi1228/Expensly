// Pure date helpers on 'YYYY-MM-DD' strings (UTC math, no timezone drift).

const DAY = 86_400_000;

export const parse = (s) => new Date(`${s}T00:00:00Z`);
export const fmt = (d) => d.toISOString().slice(0, 10);
export const addDays = (s, n) => fmt(new Date(parse(s).getTime() + n * DAY));
export const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / DAY) + 1; // inclusive

export const serverToday = () => fmt(new Date());

/**
 * The period just before [from, to], used for "vs last period".
 * Whole calendar months shift by the same number of months (Oct → Sep, Q3 → Q2);
 * any other range shifts back by its length in days. Returns null for open ranges.
 */
export function previousRange(from, to) {
  if (!from || !to) return null;
  const f = parse(from);
  const t = parse(to);
  const wholeMonths = f.getUTCDate() === 1 && parse(addDays(to, 1)).getUTCDate() === 1;

  if (wholeMonths) {
    const months =
      (t.getUTCFullYear() - f.getUTCFullYear()) * 12 + (t.getUTCMonth() - f.getUTCMonth()) + 1;
    return {
      from: fmt(new Date(Date.UTC(f.getUTCFullYear(), f.getUTCMonth() - months, 1))),
      to: fmt(new Date(Date.UTC(f.getUTCFullYear(), f.getUTCMonth(), 0))),
    };
  }
  const len = daysBetween(from, to);
  return { from: addDays(from, -len), to: addDays(from, -1) };
}
