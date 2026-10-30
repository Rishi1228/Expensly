import { useState } from 'react';
import { toast } from 'sonner';
import { Crown, Eye, EyeOff, LogOut, Trash2, UserMinus, X } from 'lucide-react';
import {
  useCancelInvite,
  useDeleteFamily,
  useInvite,
  useLeaveFamily,
  useRemoveMember,
  useTransferHead,
  useUpdateFamily,
} from '../../hooks/useFamily.js';
import { formatDayLabel, toISODate } from '../../lib/format.js';
import { headPillClass, memberName, pillClass } from '../../lib/family.js';
import Button from '../ui/Button.jsx';
import ConfirmButton from '../ui/ConfirmButton.jsx';
import Field, { inputClass } from '../ui/Field.jsx';
import Switch from '../ui/Switch.jsx';
import MemberAvatar from './MemberAvatar.jsx';

const cardClass = 'card overflow-hidden';
const sectionTitle = 'eyebrow mb-2.5 px-1';
const dayOf = (ts) => formatDayLabel(toISODate(new Date(ts)));

/** Members, invites, and settings. Head-only controls are shown only to the head. */
export default function FamilyMembers({ data }) {
  const { family, is_head: isHead, members, invites } = data;
  const me = members.find((m) => m.is_me);

  return (
    <div className="space-y-6">
      <section aria-labelledby="members-title">
        <h2 id="members-title" className={sectionTitle}>
          Members ({members.length})
        </h2>
        <ul className={`${cardClass} divide-y divide-slate-100 dark:divide-white/[0.06]`}>
          {members.map((m) => (
            <MemberItem key={m.user_id} member={m} canManage={isHead && !m.is_me} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="invite-title">
        <h2 id="invite-title" className={sectionTitle}>
          Invite someone
        </h2>
        <div className={`${cardClass} space-y-4 p-4`}>
          <InviteForm />
          {invites.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase">
                Waiting to accept
              </p>
              <ul className="space-y-2">
                {invites.map((inv) => (
                  <InviteItem
                    key={inv.id}
                    invite={inv}
                    canCancel={isHead || inv.invited_by === me?.user_id}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="privacy-title">
        <h2 id="privacy-title" className={sectionTitle}>
          Who sees what
        </h2>
        <div className={`${cardClass} p-4`}>
          <Visibility family={family} isHead={isHead} headName={headNameOf(members)} />
        </div>
      </section>

      {isHead && (
        <section aria-labelledby="name-title">
          <h2 id="name-title" className={sectionTitle}>
            Family name
          </h2>
          <div className={`${cardClass} p-4`}>
            <RenameForm family={family} />
          </div>
        </section>
      )}

      <LeaveOrDelete isHead={isHead} alone={members.length === 1} familyName={family.name} />
    </div>
  );
}

const headNameOf = (members) => {
  const head = members.find((m) => m.is_head);
  return head ? memberName(head) : 'the head';
};

function MemberItem({ member, canManage }) {
  const remove = useRemoveMember();
  const transfer = useTransferHead();
  const name = memberName(member);

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <MemberAvatar name={name} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span className="font-semibold break-words">{name}</span>
          {member.is_head && <span className={headPillClass}>Head</span>}
          {member.is_me && <span className={pillClass}>You</span>}
        </p>
        <p className="truncate text-sm text-slate-500" title={member.email}>
          {member.email}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Joined {dayOf(member.joined_at)}
        </p>
      </div>
      {canManage && (
        <div className="flex shrink-0 flex-col items-end gap-1 min-[400px]:flex-row min-[400px]:items-center">
          <ConfirmButton
            label={`Make ${name} the head`}
            confirmLabel="Make head?"
            loading={transfer.isPending}
            onConfirm={() =>
              transfer.mutate(member.user_id, {
                onSuccess: () => toast.success(`${name} is now the head`),
                onError: (e) => toast.error(e.message),
              })
            }
            idleVariant="ghost"
            confirmVariant="primary"
          >
            <Crown className="size-4" aria-hidden />
          </ConfirmButton>
          <ConfirmButton
            label={`Remove ${name}`}
            confirmLabel="Remove?"
            loading={remove.isPending}
            onConfirm={() =>
              remove.mutate(member.user_id, {
                onSuccess: () => toast.success(`${name} removed`),
                onError: (e) => toast.error(e.message),
              })
            }
          >
            <UserMinus className="size-4" aria-hidden />
          </ConfirmButton>
        </div>
      )}
    </li>
  );
}

function InviteForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const invite = useInvite();

  const onSubmit = (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(value)) return setError('Enter a valid email');
    invite.mutate(value, {
      onSuccess: () => {
        toast.success(`Invite sent to ${value}`);
        setEmail('');
      },
      onError: (err) => setError(err.message),
    });
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <Field
        htmlFor="invite-email"
        error={error}
        hint="They’ll see the invite on their Family page after signing in (or signing up) with this email."
      >
        <label htmlFor="invite-email" className="sr-only">
          Email
        </label>
        <div className="flex gap-2">
          <input
            id="invite-email"
            type="email"
            inputMode="email"
            autoComplete="off"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="name@example.com"
            className={inputClass}
          />
          <Button type="submit" loading={invite.isPending} className="shrink-0">
            Invite
          </Button>
        </div>
      </Field>
    </form>
  );
}

function InviteItem({ invite, canCancel }) {
  const cancel = useCancelInvite();
  return (
    <li className="flex items-center gap-3 rounded-xl bg-slate-50 py-2 pr-2 pl-3 text-sm dark:bg-slate-800/60">
      <div className="min-w-0 flex-1">
        <p className="font-medium break-all">{invite.email}</p>
        <p className="truncate text-xs text-slate-500">
          {invite.invited_by_name ? `Invited by ${invite.invited_by_name} · ` : ''}
          {dayOf(invite.created_at)}
        </p>
      </div>
      {canCancel && (
        <Button
          variant="ghost"
          size="sm"
          loading={cancel.isPending}
          onClick={() =>
            cancel.mutate(invite.id, {
              onSuccess: () => toast.success('Invite cancelled'),
              onError: (e) => toast.error(e.message),
            })
          }
          aria-label={`Cancel invite to ${invite.email}`}
        >
          <X className="size-4" aria-hidden />
        </Button>
      )}
    </li>
  );
}

function Visibility({ family, isHead, headName }) {
  const update = useUpdateFamily();
  const open = family.members_can_view_all;
  const Icon = open ? Eye : EyeOff;

  if (!isHead) {
    return (
      <p className="flex gap-3 text-sm">
        <Icon className="mt-0.5 size-5 shrink-0 text-slate-500" aria-hidden />
        <span>
          {open
            ? 'Everyone in the family can see each other’s spending.'
            : `Only ${headName} can see each person’s spending. You see the family total and your own expenses.`}
        </span>
      </p>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <label htmlFor="view-all" className="text-sm font-medium">
          Everyone can see each other’s spending
        </label>
        <p className="mt-0.5 text-sm text-slate-500">
          {open
            ? 'Members can see each person’s totals and expenses.'
            : 'Off: members see the family total and their own expenses. You always see everyone.'}
        </p>
      </div>
      <Switch
        id="view-all"
        checked={open}
        disabled={update.isPending}
        onChange={(value) =>
          update.mutate(
            { members_can_view_all: value },
            {
              onSuccess: () =>
                toast.success(value ? 'Everyone can now see all spending' : 'Spending is private'),
              onError: (e) => toast.error(e.message),
            },
          )
        }
      />
    </div>
  );
}

function RenameForm({ family }) {
  const [name, setName] = useState(family.name);
  const update = useUpdateFamily();
  const trimmed = name.trim();

  const onSubmit = (e) => {
    e.preventDefault();
    if (!trimmed || trimmed === family.name) return;
    update.mutate(
      { name: trimmed },
      {
        onSuccess: () => toast.success('Family renamed'),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <label htmlFor="rename-family" className="sr-only">
        Family name
      </label>
      <input
        id="rename-family"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={50}
        className={inputClass}
      />
      <Button
        type="submit"
        variant="secondary"
        loading={update.isPending}
        disabled={!trimmed || trimmed === family.name}
        className="shrink-0"
      >
        Save
      </Button>
    </form>
  );
}

function LeaveOrDelete({ isHead, alone, familyName }) {
  const leave = useLeaveFamily();
  const remove = useDeleteFamily();

  if (isHead) {
    return (
      <div className="space-y-2">
        <ConfirmButton
          label={`Delete ${familyName}`}
          confirmLabel="Delete for everyone?"
          size="md"
          loading={remove.isPending}
          onConfirm={() =>
            remove.mutate(undefined, {
              onSuccess: () => toast.success(`${familyName} deleted`),
              onError: (e) => toast.error(e.message),
            })
          }
        >
          <Trash2 className="size-4" aria-hidden /> Delete family
        </ConfirmButton>
        <p className="px-1 text-xs text-slate-500">
          {alone
            ? 'Everyone’s expenses stay in their own accounts.'
            : 'To leave instead, make someone else the head first (crown button). Everyone’s expenses stay in their own accounts.'}
        </p>
      </div>
    );
  }

  return (
    <ConfirmButton
      label={`Leave ${familyName}`}
      confirmLabel="Leave family?"
      size="md"
      loading={leave.isPending}
      onConfirm={() =>
        leave.mutate(undefined, {
          onSuccess: () => toast.success(`You left ${familyName}`),
          onError: (e) => toast.error(e.message),
        })
      }
    >
      <LogOut className="size-4" aria-hidden /> Leave family
    </ConfirmButton>
  );
}
