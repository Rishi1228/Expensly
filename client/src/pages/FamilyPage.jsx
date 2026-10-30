import { useSearchParams } from 'react-router-dom';
import { ChartColumn, Users } from 'lucide-react';
import { useFamily } from '../hooks/useFamily.js';
import FamilyDashboard from '../components/family/FamilyDashboard.jsx';
import FamilyMembers from '../components/family/FamilyMembers.jsx';
import NoFamily from '../components/family/NoFamily.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Spinner from '../components/ui/Spinner.jsx';

const TABS = [
  { value: 'overview', label: 'Overview', icon: ChartColumn },
  { value: 'members', label: 'Members', icon: Users },
];

export default function FamilyPage() {
  const { data, isLoading, isError, error, refetch } = useFamily();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'members' ? 'members' : 'overview';

  if (isLoading) return <Spinner />;
  if (isError) {
    return (
      <EmptyState
        title="Couldn’t load your family"
        message={error.message}
        action={<Button onClick={() => refetch()}>Try again</Button>}
      />
    );
  }
  if (!data.family) return <NoFamily receivedInvites={data.received_invites} />;

  const { family, members, is_head: isHead } = data;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight break-words md:text-3xl">
          {family.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-slate-500">
          {isHead && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
              You’re the head
            </span>
          )}
          <span>
            {members.length} {members.length === 1 ? 'member' : 'members'} ·{' '}
            {family.members_can_view_all
              ? 'everyone sees everyone’s spending'
              : 'only the head sees each person’s spending'}
          </span>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Family sections"
        className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 sm:inline-grid dark:bg-slate-800"
      >
        {TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="tab"
            id={`tab-${value}`}
            aria-selected={tab === value}
            aria-controls="family-panel"
            onClick={() => setParams(value === 'overview' ? {} : { tab: value }, { replace: true })}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === value
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            <Icon className="size-4" aria-hidden />
            {label}
            {value === 'members' && data.invites.length > 0 && (
              <span className="rounded-full bg-indigo-600 px-1.5 text-[10px] text-white">
                {data.invites.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div id="family-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'overview' ? <FamilyDashboard data={data} /> : <FamilyMembers data={data} />}
      </div>
    </div>
  );
}
