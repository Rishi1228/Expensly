import { Suspense, useCallback, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { House, List, LogOut, Plus, Repeat, User, Wallet } from 'lucide-react';
import { useAuth } from '../../context/auth-context.js';
import { ExpenseDialogContext } from '../../context/expense-dialog.js';
import { useLogDueRecurring } from '../../hooks/useRecurring.js';
import ErrorBoundary from '../ErrorBoundary.jsx';
import ExpenseForm from '../ExpenseForm.jsx';
import { ThemeButton } from '../ThemeToggle.jsx';
import Spinner from '../ui/Spinner.jsx';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: House, end: true },
  { to: '/expenses', label: 'Expenses', icon: List },
  { to: '/recurring', label: 'Recurring', icon: Repeat },
  { to: '/profile', label: 'Profile', icon: User },
];

function Logo() {
  return (
    <div className="flex items-center gap-2 font-semibold">
      <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
        <Wallet className="size-4" aria-hidden />
      </span>
      Expensly
    </div>
  );
}

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
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between px-2 py-2">
            <Logo />
            <ThemeButton />
          </div>
          <Button className="mt-6 w-full" onClick={openAdd}>
            <Plus className="size-4" aria-hidden /> Add expense
          </Button>
          <nav className="mt-6 flex flex-col gap-1" aria-label="Main">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="size-5" aria-hidden /> {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto border-t border-slate-200 pt-4 dark:border-slate-800">
            <p className="truncate px-2 text-sm text-slate-500" title={user?.email}>
              {user?.email}
            </p>
            <Button variant="ghost" className="mt-2 w-full justify-start" onClick={signOut}>
              <LogOut className="size-4" aria-hidden /> Sign out
            </Button>
          </div>
        </aside>

        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/90">
          <Logo />
          <ThemeButton className="-mr-2" />
        </header>

        <main
          id="main"
          tabIndex={-1}
          className="focus:outline-none mx-auto w-full max-w-4xl flex-1 px-4 pt-5 pb-28 md:px-8 md:pt-8 md:pb-10"
        >
          <ErrorBoundary resetKey={pathname}>
            <Suspense fallback={<Spinner />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>

        {/* Mobile bottom nav */}
        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/95"
          aria-label="Main"
        >
          <div className="grid h-16 grid-cols-5">
            {NAV.slice(0, 2).map((item) => (
              <BottomNavLink key={item.to} {...item} />
            ))}
            <div className="flex items-center justify-center">
              <button
                onClick={openAdd}
                className="-mt-6 flex size-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95"
                aria-label="Add expense"
              >
                <Plus className="size-7" aria-hidden />
              </button>
            </div>
            {NAV.slice(2).map((item) => (
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
        `flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
          isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
        }`
      }
    >
      <Icon className="size-5" aria-hidden />
      {label}
    </NavLink>
  );
}
