const inr0 = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const inr2 = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
});

/** ₹1,250 or ₹349.50. Decimals are shown only when needed. */
export function formatMoney(value) {
  const n = Number(value) || 0;
  return Number.isInteger(n) ? inr0.format(n) : inr2.format(n);
}

const pad = (n) => String(n).padStart(2, '0');

/** Local date → 'YYYY-MM-DD' (no UTC shift). */
export function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'YYYY-MM-DD' → local Date at midnight. */
export function parseISODate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** 'Today', 'Yesterday', 'Mon, 20 Oct', or 'Mon, 20 Oct 2025' for other years. */
export function formatDayLabel(iso) {
  const today = toISODate(new Date());
  if (iso === today) return 'Today';
  if (iso === toISODate(addDays(new Date(), -1))) return 'Yesterday';
  const d = parseISODate(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export const PERIODS = [
  { value: 'this-month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
  { value: 'last-3-months', label: 'Last 3 months' },
  { value: 'this-year', label: 'This year' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom range' },
];

/** The presets offered on the dashboards (no custom range). */
export const DASHBOARD_PERIODS = PERIODS.filter((p) => p.value !== 'custom');

/** Date range for a preset period, as ISO dates ({} for all time). */
export function periodRange(period, now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (period) {
    case 'this-month':
      return { from: toISODate(new Date(y, m, 1)), to: toISODate(new Date(y, m + 1, 0)) };
    case 'last-month':
      return { from: toISODate(new Date(y, m - 1, 1)), to: toISODate(new Date(y, m, 0)) };
    case 'last-3-months':
      return { from: toISODate(new Date(y, m - 2, 1)), to: toISODate(new Date(y, m + 1, 0)) };
    case 'this-year':
      return { from: toISODate(new Date(y, 0, 1)), to: toISODate(new Date(y, 11, 31)) };
    default:
      return {};
  }
}

/** Footnote for the "Change" tile, e.g. 'vs September (₹12,400)'. */
export function comparisonLabel(period, previous) {
  if (!previous) return 'No earlier period to compare';
  const d = parseISODate(previous.from);
  switch (period) {
    case 'this-month':
    case 'last-month':
      return `vs ${d.toLocaleDateString('en-IN', { month: 'long' })} (${formatMoney(previous.total)})`;
    case 'this-year':
      return `vs ${d.getFullYear()} (${formatMoney(previous.total)})`;
    default:
      return `vs previous 3 months (${formatMoney(previous.total)})`;
  }
}

const ordinal = (n) => {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th';
  return `${n}${s}`;
};

/** 'Every Monday' · 'Monthly on the 1st' · 'Yearly on 15 Mar', from the first due date. */
export function formatSchedule(frequency, startDate) {
  const d = parseISODate(startDate);
  if (frequency === 'weekly') return `Every ${d.toLocaleDateString('en-IN', { weekday: 'long' })}`;
  if (frequency === 'monthly') return `Monthly on the ${ordinal(d.getDate())}`;
  return `Yearly on ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
}

/** 'Today', 'Tomorrow', or the day label for other dates. */
export function formatDueLabel(iso) {
  if (iso === toISODate(addDays(new Date(), 1))) return 'Tomorrow';
  return formatDayLabel(iso);
}

/** Rough monthly cost of a recurring bill. */
export function monthlyEquivalent(amount, frequency) {
  const n = Number(amount) || 0;
  if (frequency === 'weekly') return (n * 52) / 12;
  if (frequency === 'yearly') return n / 12;
  return n;
}
