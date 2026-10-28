import { useQuery } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/auth-context.js';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';

export default function ProfilePage() {
  const { signOut } = useAuth();
  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api('/me').then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      {isLoading ? (
        <Spinner />
      ) : (
        <dl className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:divide-slate-800 dark:bg-slate-900 dark:ring-slate-800">
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
      <Button variant="secondary" onClick={signOut}>
        <LogOut className="size-4" aria-hidden /> Sign out
      </Button>
    </div>
  );
}
