import { useMemo, useState } from 'react';
import { Lock, Users } from 'lucide-react';
import { useFamilyExpenses, useMemberBreakdown } from '../../hooks/useFamily.js';
import { familyScope, useSummary, useTrend } from '../../hooks/useStats.js';
import { useExpenseDialog } from '../../context/expense-dialog.js';
import { periodRange } from '../../lib/format.js';
import { headPillClass, memberName, pillClass } from '../../lib/family.js';
import ExpenseRow from '../ExpenseRow.jsx';
import BarRow from '../dashboard/BarRow.jsx';
import CategoryBreakdown from '../dashboard/CategoryBreakdown.jsx';
import PeriodChips from '../dashboard/PeriodChips.jsx';
import { cardClass } from '../dashboard/StatTile.jsx';
import SummaryTiles from '../dashboard/SummaryTiles.jsx';
import TrendChart from '../dashboard/TrendChart.jsx';
import ErrorNote from '../ui/ErrorNote.jsx';
import Spinner from '../ui/Spinner.jsx';
import { chip } from '../ui/chip.js';
import MemberAvatar from './MemberAvatar.jsx';

/**
 * Family analytics: the whole family by default, or one member picked from the chips
 * (only members the viewer is allowed to see are offered).
 */
export default function FamilyDashboard({ data }) {
  const { members, is_head: isHead, family } = data;
  const [period, setPeriod] = useState('this-month');
  const [memberId, setMemberId] = useState(null);
  const range = useMemo(() => periodRange(period), [period]);

  const visible = members.filter((m) => m.can_view);
  // If the picked member left or became hidden, fall back to the whole family.
  const member = visible.find((m) => m.user_id === memberId) ?? null;
  const scope = useMemo(() => familyScope(member?.user_id), [member?.user_id]);
  const restricted = !isHead && !family.members_can_view_all;

  const summary = useSummary(range, scope);
  const trend = useTrend(range, scope);
  const who = member ? (member.is_me ? 'You' : memberName(member)) : null;

  return (
    <div className="space-y-5">
      <PeriodChips value={period} onChange={setPeriod} />

      {visible.length > 1 && (
        <div
          className="no-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0"
          role="radiogroup"
          aria-label="Whose spending"
        >
          <div className="flex w-max gap-2">
            <button
              type="button"
              role="radio"
              aria-checked={!member}
              onClick={() => setMemberId(null)}
              className={chip(!member)}
            >
              Everyone
            </button>
            {visible.map((m) => (
              <button
                key={m.user_id}
                type="button"
                role="radio"
                aria-checked={member?.user_id === m.user_id}
                onClick={() => setMemberId(m.user_id)}
                className={chip(member?.user_id === m.user_id)}
              >
                {m.is_me ? 'You' : memberName(m)}
              </button>
            ))}
          </div>
        </div>
      )}

      {restricted && (
        <p className="flex items-start gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
          You see the family’s combined spending and your own. Only the head can see each person’s
          spending.
        </p>
      )}

      <SummaryTiles
        query={summary}
        period={period}
        spentLabel={who ? `${who} spent` : 'Family spent'}
      />

      {!member && <MemberBreakdown range={range} onPick={setMemberId} />}

      <TrendChart query={trend} />

      <div className="grid gap-5 lg:grid-cols-2">
        <CategoryBreakdown
          key={`${period}-${member?.user_id ?? 'all'}`}
          range={range}
          period={period}
          scope={scope}
          title={who ? `Where ${who === 'You' ? 'your' : `${who}’s`} money goes` : 'By category'}
        />
        <RecentFamilyExpenses
          range={range}
          member={member}
          restricted={restricted}
          myId={members.find((m) => m.is_me)?.user_id}
        />
      </div>
    </div>
  );
}

/** "Who spent what": one bar per member; tap a member to focus the dashboard on them. */
function MemberBreakdown({ range, onPick }) {
  const { data: rows, isLoading, isError, refetch } = useMemberBreakdown(range);
  const max = rows?.length ? Math.max(...rows.map((r) => r.total)) : 0;

  return (
    <section className={cardClass} aria-labelledby="who-title">
      <h2 id="who-title" className="mb-3 font-medium">
        Who spent what
      </h2>
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorNote message="Couldn’t load the members." onRetry={refetch} />
      ) : (
        <div className="space-y-0.5">
          {rows.map((r) => (
            <BarRow
              key={r.user_id ?? 'others'}
              label={r.user_id ? r.name : 'Other members'}
              icon={
                r.user_id ? (
                  <MemberAvatar name={r.name} size="sm" />
                ) : (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">
                    <Users className="size-4" aria-hidden />
                  </span>
                )
              }
              badge={
                <>
                  {r.is_head && <span className={headPillClass}>Head</span>}
                  {r.is_me && <span className={pillClass}>You</span>}
                </>
              }
              total={r.total}
              share={r.share}
              max={max}
              onClick={r.user_id ? () => onPick(r.user_id) : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/** Latest expenses in view. Your own open the edit dialog; others are read-only. */
function RecentFamilyExpenses({ range, member, restricted, myId }) {
  const { openEdit } = useExpenseDialog();
  const query = useFamilyExpenses({ ...range, member: member?.user_id });
  const { data, isLoading, isError, refetch } = query;

  return (
    <section className={cardClass} aria-labelledby="family-recent-title">
      <h2 id="family-recent-title" className="mb-1 font-medium">
        {restricted && !member ? 'Your recent expenses' : 'Recent expenses'}
      </h2>
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorNote message="Couldn’t load expenses." onRetry={refetch} />
      ) : data?.data.length ? (
        <div className="-mx-4 divide-y divide-slate-100 dark:divide-slate-800">
          {data.data.map((e) => (
            <ExpenseRow
              key={e.id}
              expense={e}
              memberName={member ? undefined : e.member.name}
              onClick={e.member.user_id === myId ? () => openEdit(e) : undefined}
            />
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-500">No expenses in this period.</p>
      )}
    </section>
  );
}
