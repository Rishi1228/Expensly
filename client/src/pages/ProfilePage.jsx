import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, KeyRound, LogOut, Repeat, Tags, Users } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/auth-context.js';
import PasswordForm from '../components/PasswordForm.jsx';
import ThemeSelect from '../components/ThemeToggle.jsx';
import Button from '../components/ui/Button.jsx';
import ErrorNote from '../components/ui/ErrorNote.jsx';
import Modal from '../components/ui/Modal.jsx';
import Spinner from '../components/ui/Spinner.jsx';

const cardClass = 'card divide-y divide-slate-100 overflow-hidden dark:divide-white/[0.06]';

const rowClass =
  'flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-slate-900/[0.025] dark:hover:bg-white/[0.03]';

export default function ProfilePage() {
  const { signOut } = useAuth();
  const [changingPassword, setChangingPassword] = useState(false);
  const {
    data: me,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['me'],
    queryFn: () => api('/me').then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-tight md:text-3xl">
        Profile
      </h1>

      <section aria-labelledby="account-title">
        <h2 id="account-title" className="eyebrow mb-2.5 px-1">
          Account
        </h2>
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <div className={cardClass}>
            <ErrorNote message="Couldn’t load your profile." onRetry={refetch} />
          </div>
        ) : (
          <div className={cardClass}>
            <div className="flex items-center gap-4 p-5">
              <span
                className="bg-brand flex size-14 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold text-white shadow-glow"
                aria-hidden
              >
                {(me?.profile?.full_name || me?.email || '?')[0].toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold tracking-tight">
                  {me?.profile?.full_name || 'Your account'}
                </p>
                <p className="truncate text-sm text-slate-500">{me?.email}</p>
              </div>
            </div>
            <dl className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {[
                ['Name', me?.profile?.full_name || '—'],
                ['Email', me?.email],
                ['Currency', me?.profile?.currency],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="truncate font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>

      <section aria-labelledby="appearance-title">
        <h2 id="appearance-title" className="eyebrow mb-2.5 px-1">
          Appearance
        </h2>
        <div className={`${cardClass} flex flex-wrap items-center justify-between gap-3 px-4 py-3`}>
          <span className="text-sm">Theme</span>
          <ThemeSelect />
        </div>
      </section>

      <section aria-labelledby="settings-title">
        <h2 id="settings-title" className="eyebrow mb-2.5 px-1">
          Settings
        </h2>
        <div className={cardClass}>
          <Link to="/recurring" className={`${rowClass} md:hidden`}>
            <Repeat className="size-5 text-slate-500" aria-hidden />
            <span className="flex-1">Recurring bills</span>
            <ChevronRight className="size-4 text-slate-400" aria-hidden />
          </Link>
          <Link to="/family?tab=members" className={rowClass}>
            <Users className="size-5 text-slate-500" aria-hidden />
            <span className="flex-1">Family members</span>
            <ChevronRight className="size-4 text-slate-400" aria-hidden />
          </Link>
          <Link to="/categories" className={rowClass}>
            <Tags className="size-5 text-slate-500" aria-hidden />
            <span className="flex-1">Manage categories</span>
            <ChevronRight className="size-4 text-slate-400" aria-hidden />
          </Link>
          <button type="button" className={rowClass} onClick={() => setChangingPassword(true)}>
            <KeyRound className="size-5 text-slate-500" aria-hidden />
            <span className="flex-1">Change password</span>
            <ChevronRight className="size-4 text-slate-400" aria-hidden />
          </button>
        </div>
      </section>

      <Button variant="secondary" onClick={signOut}>
        <LogOut className="size-4" aria-hidden /> Sign out
      </Button>

      <Modal
        open={changingPassword}
        onClose={() => setChangingPassword(false)}
        title="Change password"
      >
        {changingPassword && <PasswordForm onDone={() => setChangingPassword(false)} />}
      </Modal>
    </div>
  );
}
