import { useSearchParams } from 'react-router-dom';
import { ChartColumn, Users } from 'lucide-react';
import { useFamily } from '../hooks/useFamily.js';
import { headPillClass } from '../lib/family.js';
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
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <span className="truncate">{family.name}</span>
          {isHead && <span className={`${headPillClass} shrink-0 text-xs`}>You’re the head</span>}
        </h1>
        <p className="text-sm text-slate-500">
          {members.length} {members.length === 1 ? 'member' : 'members'} ·{' '}
          {family.members_can_view_all
            ? 'everyone sees everyone’s spending'
            : 'only the head sees each person’s spending'}
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Family sections"
        className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800"
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
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
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
