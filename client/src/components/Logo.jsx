import { Wallet } from 'lucide-react';

/** Gradient mark + wordmark. `size="lg"` for the sign-in pages. */
export default function Logo({ size = 'md', showName = true, className = '' }) {
  const lg = size === 'lg';
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span
        className={`bg-brand flex items-center justify-center text-white shadow-glow ${
          lg ? 'size-12 rounded-2xl' : 'size-9 rounded-xl'
        }`}
      >
        <Wallet className={lg ? 'size-6' : 'size-[18px]'} strokeWidth={2.25} aria-hidden />
      </span>
      {showName && (
        <span className={`font-extrabold tracking-tight ${lg ? 'text-2xl' : 'text-lg'}`}>
          Expensly
        </span>
      )}
    </div>
  );
}
