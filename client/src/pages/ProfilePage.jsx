import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, KeyRound, LogOut, Tags } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/auth-context.js';
import PasswordForm from '../components/PasswordForm.jsx';
import ThemeSelect from '../components/ThemeToggle.jsx';
import Button from '../components/ui/Button.jsx';
import ErrorNote from '../components/ui/ErrorNote.jsx';
import Modal from '../components/ui/Modal.jsx';
import Spinner from '../components/ui/Spinner.jsx';

const cardClass =
  'divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:divide-slate-800 dark:bg-slate-900 dark:ring-slate-800';

const rowClass =
  'flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60';

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
      <h1 className="text-2xl font-semibold">Profile</h1>

      <section aria-labelledby="account-title">
        <h2
          id="account-title"
          className="mb-2 px-1 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          Account
        </h2>
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <div className={cardClass}>
            <ErrorNote message="Couldn’t load your profile." onRetry={refetch} />
          </div>
        ) : (
          <dl className={cardClass}>
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
        )}
      </section>

      <section aria-labelledby="appearance-title">
        <h2
          id="appearance-title"
          className="mb-2 px-1 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          Appearance
        </h2>
        <div className={`${cardClass} flex flex-wrap items-center justify-between gap-3 px-4 py-3`}>
          <span className="text-sm">Theme</span>
          <ThemeSelect />
        </div>
      </section>

      <section aria-labelledby="settings-title">
        <h2
          id="settings-title"
          className="mb-2 px-1 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          Settings
        </h2>
        <div className={cardClass}>
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
