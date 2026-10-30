import {
  ArrowDownRight,
  ShoppingBasket,
  Train,
  Users,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import Logo from './Logo.jsx';

const PREVIEW_BARS = [
  { label: 'Food', icon: UtensilsCrossed, pct: 38 },
  { label: 'Travel', icon: Train, pct: 24 },
  { label: 'Groceries', icon: ShoppingBasket, pct: 17 },
];

/** Decorative app preview on the brand panel (desktop only). */
function BrandPanel() {
  return (
    <div
      className="bg-brand relative hidden overflow-hidden rounded-[2rem] p-10 text-white shadow-glow lg:flex lg:flex-col"
      aria-hidden
    >
      <div className="absolute -top-24 -right-24 size-80 rounded-full bg-white/15 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-fuchsia-400/30 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgb(255 255 255) 1px, transparent 0)',
          backgroundSize: '22px 22px',
        }}
      />

      <div className="relative flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30">
          <Wallet className="size-[18px]" strokeWidth={2.25} />
        </span>
        <span className="text-lg font-extrabold tracking-tight">Expensly</span>
      </div>

      <div className="relative mt-auto mb-10">
        <h2 className="max-w-sm text-4xl leading-[1.1] font-extrabold tracking-tight">
          Know where every rupee goes.
        </h2>
        <p className="mt-3 max-w-sm text-white/80">
          Log expenses in seconds, automate your bills, and see your spending — alone or with your
          family.
        </p>
      </div>

      <div className="relative grid gap-3">
        <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/25 backdrop-blur-md">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-white/70 uppercase">
            Spent this month
          </p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <p className="text-3xl font-extrabold tracking-tight">₹24,560</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
              <ArrowDownRight className="size-3.5" /> 12% less
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {PREVIEW_BARS.map(({ label, icon: Icon, pct }) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                <Icon className="size-4 text-white/80" />
                <span className="w-20">{label}</span>
                <div className="h-1.5 flex-1 rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-white" style={{ width: `${pct * 2}%` }} />
                </div>
                <span className="w-9 text-right text-white/80 tabular-nums">{pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white/15 p-3 ring-1 ring-white/25 backdrop-blur-md">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white/20">
            <Users className="size-4" />
          </span>
          <p className="flex-1 text-sm">
            <span className="font-semibold">Family</span>
            <span className="text-white/75"> · 4 members tracking together</span>
          </p>
          <div className="flex -space-x-2">
            {['R', 'A', 'M'].map((c) => (
              <span
                key={c}
                className="flex size-7 items-center justify-center rounded-full bg-white text-xs font-bold text-indigo-600 ring-2 ring-indigo-500"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Sign-in / password pages: brand panel on desktop, logo + heading + card for the form. */
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <main className="grid min-h-dvh gap-6 p-4 lg:grid-cols-[1.05fr_1fr] lg:p-6">
      <BrandPanel />
      <div className="flex items-center justify-center py-8">
        <div className="w-full max-w-sm animate-rise">
          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
            <Logo size="lg" showName={false} className="mb-5 lg:hidden" />
            <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1.5 text-slate-500">{subtitle}</p>}
          </div>
          <div className="card p-6 sm:p-7">{children}</div>
          {footer && (
            <p className="mt-6 text-center text-sm text-slate-500 lg:text-left">{footer}</p>
          )}
        </div>
      </div>
    </main>
  );
}
