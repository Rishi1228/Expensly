import { Wallet } from 'lucide-react';

/** Centered logo, heading and card used by the sign-in / password pages. */
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Wallet className="size-6" aria-hidden />
          </span>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          {children}
        </div>
        {footer && <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>}
      </div>
    </main>
  );
}
