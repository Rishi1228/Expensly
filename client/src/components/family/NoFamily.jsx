import { useState } from 'react';
import { toast } from 'sonner';
import { Mail, Users } from 'lucide-react';
import { useCreateFamily, useRespondInvite } from '../../hooks/useFamily.js';
import { formatDayLabel, toISODate } from '../../lib/format.js';
import Button from '../ui/Button.jsx';
import Field, { inputClass } from '../ui/Field.jsx';
import { cardClass } from '../dashboard/StatTile.jsx';

/** Shown when the user isn't in a family: invites they've received, and "create one". */
export default function NoFamily({ receivedInvites }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Family</h1>
        <p className="text-sm text-slate-500">
          Track spending together. Everyone logs their own expenses; the dashboard shows the family
          total and each person’s share.
        </p>
      </div>

      {receivedInvites.length > 0 && <ReceivedInvites invites={receivedInvites} />}

      <CreateFamily />
    </div>
  );
}

function ReceivedInvites({ invites }) {
  const respond = useRespondInvite();
  const [busy, setBusy] = useState(null);

  const act = (invite, accept) => {
    setBusy(`${invite.id}-${accept}`);
    respond.mutate(
      { id: invite.id, accept },
      {
        onSuccess: () =>
          toast.success(accept ? `You joined ${invite.family_name}` : 'Invite declined'),
        onError: (e) => toast.error(e.message),
        onSettled: () => setBusy(null),
      },
    );
  };

  return (
    <section className={cardClass} aria-labelledby="received-title">
      <h2 id="received-title" className="mb-3 flex items-center gap-2 font-medium">
        <Mail className="size-4 text-indigo-600 dark:text-indigo-400" aria-hidden />
        {invites.length === 1 ? 'You have an invite' : `You have ${invites.length} invites`}
      </h2>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {invites.map((inv) => (
          <li
            key={inv.id}
            className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1 text-sm">
              <p>
                <span className="font-medium">{inv.invited_by_name || 'Someone'}</span> invited you
                to join <span className="font-medium">{inv.family_name}</span>
              </p>
              <p className="text-xs text-slate-500">
                {formatDayLabel(toISODate(new Date(inv.created_at)))} · The head will be able to see
                your expenses
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => act(inv, false)}
                loading={busy === `${inv.id}-false`}
                disabled={Boolean(busy)}
              >
                Decline
              </Button>
              <Button
                size="sm"
                onClick={() => act(inv, true)}
                loading={busy === `${inv.id}-true`}
                disabled={Boolean(busy)}
              >
                Accept
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CreateFamily() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const create = useCreateFamily();

  const onSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError('Give your family a name');
    create.mutate(trimmed, {
      onSuccess: () => toast.success(`${trimmed} created. Now invite your family.`),
      onError: (err) => setError(err.message),
    });
  };

  return (
    <section className={cardClass} aria-labelledby="create-title">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
          <Users className="size-5" aria-hidden />
        </span>
        <div>
          <h2 id="create-title" className="font-medium">
            Start a family
          </h2>
          <p className="text-sm text-slate-500">
            You’ll be the head: you can remove members and decide who sees whose spending.
          </p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row" noValidate>
        <Field htmlFor="family-name" error={error} className="flex-1">
          <label htmlFor="family-name" className="sr-only">
            Family name
          </label>
          <input
            id="family-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            maxLength={50}
            placeholder="e.g. The Shahs"
            className={inputClass}
          />
        </Field>
        <Button type="submit" loading={create.isPending} className="sm:self-start">
          Create family
        </Button>
      </form>
    </section>
  );
}
