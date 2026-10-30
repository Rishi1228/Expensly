import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMoney, parseISODate } from '../../lib/format.js';
import ErrorNote from '../ui/ErrorNote.jsx';
import Spinner from '../ui/Spinner.jsx';
import { cardClass } from './StatTile.jsx';

// Bars fade from indigo (#6366f1, validated on white and dark surfaces) to violet.
const BAR_TOP = '#8b5cf6';
const BAR_BOTTOM = '#6366f1';
const TICK = { fill: '#64748b', fontSize: 11 };

const compactMoney = (v) =>
  v >= 1e5 ? `₹${+(v / 1e5).toFixed(1)}L` : v >= 1e3 ? `₹${+(v / 1e3).toFixed(1)}k` : `₹${v}`;

function bucketLabel(iso, granularity, long = false) {
  const d = parseISODate(iso);
  if (granularity === 'month') {
    return d.toLocaleDateString('en-IN', {
      month: long ? 'long' : 'short',
      year: long ? 'numeric' : '2-digit',
    });
  }
  return long
    ? d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    : String(d.getDate());
}

function ChartTooltip({ active, payload, granularity }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl bg-white/95 px-3.5 py-2.5 text-sm text-slate-900 shadow-xl ring-1 ring-slate-200 backdrop-blur dark:bg-slate-800/95 dark:text-slate-100 dark:ring-white/10">
      <p className="text-xs text-slate-500">{bucketLabel(p.bucket, granularity, true)}</p>
      <p className="text-base font-bold tabular-nums">{formatMoney(p.total)}</p>
      <p className="text-xs text-slate-500">
        {p.count} {p.count === 1 ? 'expense' : 'expenses'}
      </p>
    </div>
  );
}

/** Spend per day (short ranges) or per month (long ranges). Single series, so no legend. */
export default function TrendChart({ query }) {
  const { data, isLoading, isError, refetch } = query;
  const points = data?.data ?? [];
  const granularity = data?.granularity ?? 'day';
  const hasSpend = points.some((p) => p.total > 0);
  const title = granularity === 'day' ? 'Daily spending' : 'Monthly spending';

  // Thin out x labels so they never collide on small screens.
  const tickEvery = Math.max(1, Math.ceil(points.length / 10));

  return (
    <section className={cardClass} aria-labelledby="trend-title">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id="trend-title" className="text-base font-bold tracking-tight">
          {title}
        </h2>
        {hasSpend && (
          <p className="text-xs text-slate-500">
            Peak{' '}
            <span className="font-semibold text-slate-700 tabular-nums dark:text-slate-200">
              {formatMoney(Math.max(...points.map((p) => p.total)))}
            </span>
          </p>
        )}
      </div>
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorNote message="Couldn’t load the chart." onRetry={refetch} />
      ) : !hasSpend ? (
        <p className="py-10 text-center text-sm text-slate-500">No spending in this period.</p>
      ) : (
        <>
          <div className="h-60 text-slate-200/80 dark:text-white/[0.06]" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={points}
                margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                barCategoryGap="20%"
              >
                <defs>
                  <linearGradient id="trend-bar" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor={BAR_TOP} />
                    <stop offset="1" stopColor={BAR_BOTTOM} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="currentColor" strokeDasharray="4 4" />
                <XAxis
                  dataKey="bucket"
                  tickFormatter={(v) => bucketLabel(v, granularity)}
                  interval={tickEvery - 1}
                  tick={TICK}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={compactMoney}
                  tick={TICK}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<ChartTooltip granularity={granularity} />}
                  cursor={{ fill: 'currentColor', opacity: 0.6, radius: 6 }}
                />
                <Bar dataKey="total" fill="url(#trend-bar)" radius={[6, 6, 2, 2]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Same data as a table for screen readers */}
          <table className="sr-only">
            <caption>{title}</caption>
            <thead>
              <tr>
                <th>{granularity === 'day' ? 'Day' : 'Month'}</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.bucket}>
                  <td>{bucketLabel(p.bucket, granularity, true)}</td>
                  <td>{formatMoney(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
