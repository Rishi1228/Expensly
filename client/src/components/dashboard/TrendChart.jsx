import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMoney, parseISODate } from '../../lib/format.js';
import ErrorNote from '../ui/ErrorNote.jsx';
import Spinner from '../ui/Spinner.jsx';
import { cardClass } from './StatTile.jsx';

const BAR = '#6366f1'; // validated against white and slate-900 surfaces
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
    <div className="rounded-lg bg-white px-3 py-2 text-sm text-slate-900 shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700">
      <p className="text-xs text-slate-500">{bucketLabel(p.bucket, granularity, true)}</p>
      <p className="font-semibold tabular-nums">{formatMoney(p.total)}</p>
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
      <h2 id="trend-title" className="mb-3 font-medium">
        {title}
      </h2>
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorNote message="Couldn’t load the chart." onRetry={refetch} />
      ) : !hasSpend ? (
        <p className="py-10 text-center text-sm text-slate-500">No spending in this period.</p>
      ) : (
        <>
          <div className="h-56 text-slate-200 dark:text-slate-800" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={points}
                margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                barCategoryGap="20%"
              >
                <CartesianGrid vertical={false} stroke="currentColor" />
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
                  cursor={{ fill: 'currentColor', opacity: 0.5 }}
                />
                <Bar dataKey="total" fill={BAR} radius={[4, 4, 0, 0]} maxBarSize={40} />
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
