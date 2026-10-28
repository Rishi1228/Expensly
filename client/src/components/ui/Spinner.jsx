import { LoaderCircle } from 'lucide-react';

export default function Spinner({ className = '', label = 'Loading' }) {
  return (
    <div
      className={`flex items-center justify-center py-10 text-slate-400 ${className}`}
      role="status"
    >
      <LoaderCircle className="size-6 animate-spin" aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function FullPageSpinner() {
  return <Spinner className="min-h-dvh" />;
}
