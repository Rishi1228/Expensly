import { Suspense, useCallback, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { House, List, LogOut, Plus, Repeat, User, Users } from 'lucide-react';
import { useAuth } from '../../context/auth-context.js';
import { ExpenseDialogContext } from '../../context/expense-dialog.js';
import { useLogDueRecurring } from '../../hooks/useRecurring.js';
import ErrorBoundary from '../ErrorBoundary.jsx';
import ExpenseForm from '../ExpenseForm.jsx';
import { ThemeButton } from '../ThemeToggle.jsx';
import Logo from '../Logo.jsx';
import Spinner from '../ui/Spinner.jsx';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: House, end: true },
  { to: '/expenses', label: 'Expenses', icon: List },
  { to: '/recurring', label: 'Recurring', icon: Repeat },
  { to: '/family', label: 'Family', icon: Users },
  { to: '/profile', label: 'Profile', icon: User },
];

// Phones have room for four links around the + button; Recurring is reached from Profile.
const MOBILE_NAV = NAV.filter((n) => n.to !== '/recurring').map((n) =>
  n.to === '/' ? { ...n, label: 'Home' } : n,
);

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  useLogDueRecurring(); // log any bills due by the user's local today
  // dialog.key remounts the form so it always starts fresh
  const [dialog, setDialog] = useState({ open: false, expense: null, key: 0 });

  const openAdd = useCallback(
    () => setDialog((d) => ({ open: true, expense: null, key: d.key + 1 })),
    [],
  );
  const openEdit = useCallback(
    (expense) => setDialog((d) => ({ open: true, expense, key: d.key + 1 })),
    [],
  );
  const close = useCallback(() => setDialog((d) => ({ ...d, open: false })), []);
  const ctx = useMemo(() => ({ openAdd, openEdit }), [openAdd, openEdit]);

  return (
    <ExpenseDialogContext.Provider value={ctx}>
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-indigo-600 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <div className="min-h-dvh md:flex">
        {/* Desktop sidebar */}
        <aside className="glass sticky top-0 hidden h-dvh w-68 shrink-0 flex-col border-r border-slate-200/70 p-5 md:flex dark:border-white/[0.06]">
          <div className="flex items-center justify-between">
            <Logo />
            <ThemeButton />
          </div>
          <Button size="lg" className="mt-8 w-full" onClick={openAdd}>
            <Plus className="size-5" aria-hidden /> Add expense
          </Button>
          <p className="eyebrow mt-8 mb-2 px-3">Menu</p>
          <nav className="flex flex-col gap-1" aria-label="Main">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-200'
                      : 'text-slate-500 hover:bg-slate-900/[0.04] hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        className="bg-brand absolute top-2 bottom-2 -left-5 w-1 rounded-r-full"
                        aria-hidden
                      />
                    )}
                    <Icon className="size-5" strokeWidth={isActive ? 2.25 : 2} aria-hidden />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto flex items-center gap-3 rounded-2xl bg-slate-900/[0.03] p-3 ring-1 ring-slate-200/70 dark:bg-white/[0.03] dark:ring-white/[0.06]">
            <span
              className="bg-brand flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              aria-hidden
            >
              {user?.email?.[0]?.toUpperCase()}
            </span>
            <p className="min-w-0 flex-1 truncate text-sm font-medium" title={user?.email}>
              {user?.email}
            </p>
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-900/5 hover:text-rose-600 dark:hover:bg-white/10 dark:hover:text-rose-400"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </div>
        </aside>

        {/* Mobile header */}
        <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/60 px-4 md:hidden dark:border-white/[0.06]">
          <Logo />
          <ThemeButton className="-mr-2" />
        </header>

        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-36 focus:outline-none md:px-10 md:pt-10 md:pb-12"
        >
          <ErrorBoundary resetKey={pathname}>
            <Suspense fallback={<Spinner />}>
              <div key={pathname} className="animate-rise">
                <Outlet />
              </div>
            </Suspense>
          </ErrorBoundary>
        </main>

        {/* Mobile bottom nav: a floating glass bar */}
        <nav
          className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 md:hidden"
          aria-label="Main"
        >
          <div className="glass grid h-16 grid-cols-5 rounded-3xl shadow-[0_10px_40px_-10px_rgb(15_23_42/0.35)] ring-1 ring-slate-200/70 dark:ring-white/10">
            {MOBILE_NAV.slice(0, 2).map((item) => (
              <BottomNavLink key={item.to} {...item} />
            ))}
            <div className="flex items-center justify-center">
              <button
                onClick={openAdd}
                className="bg-brand -mt-7 flex size-14 items-center justify-center rounded-2xl text-white shadow-glow ring-4 ring-[#f5f6fb] transition active:scale-95 dark:ring-slate-950"
                aria-label="Add expense"
              >
                <Plus className="size-7" strokeWidth={2.5} aria-hidden />
              </button>
            </div>
            {MOBILE_NAV.slice(2).map((item) => (
              <BottomNavLink key={item.to} {...item} />
            ))}
          </div>
        </nav>
      </div>

      <Modal
        open={dialog.open}
        onClose={close}
        title={dialog.expense ? 'Edit expense' : 'Add expense'}
      >
        <ExpenseForm key={dialog.key} expense={dialog.expense} onDone={close} />
      </Modal>
    </ExpenseDialogContext.Provider>
  );
}

function BottomNavLink({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
          isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
              isActive ? 'bg-indigo-500/10 dark:bg-indigo-400/15' : ''
            }`}
          >
            <Icon className="size-5" strokeWidth={isActive ? 2.25 : 2} aria-hidden />
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}
