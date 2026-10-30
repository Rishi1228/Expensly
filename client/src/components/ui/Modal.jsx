import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Bottom sheet on phones, centered dialog on larger screens. */
export default function Modal({ open, onClose, title, children }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const panelRef = useRef(null);
  // Remember what had focus when the dialog opened (read during render, before any
  // autoFocus inside the dialog moves it), so it can get focus back on close.
  const openerRef = useRef(null);
  const wasOpen = useRef(false);
  if (open && !wasOpen.current) openerRef.current = document.activeElement;
  wasOpen.current = open;

  useEffect(() => {
    if (!open) return;
    const opener = openerRef.current;
    const panel = panelRef.current;

    // Unless a field auto-focused, focus the dialog itself (no surprise phone keyboard).
    if (!panel.contains(document.activeElement)) panel.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') return onCloseRef.current();
      if (e.key !== 'Tab') return;
      // Keep Tab inside the dialog
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter(
        (el) => !el.closest('[hidden], [inert]'),
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-[fade_0.2s_ease-out] bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative max-h-[92dvh] w-full animate-rise overflow-y-auto rounded-t-3xl bg-white px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl ring-1 ring-slate-200/70 sm:max-w-lg sm:rounded-3xl sm:px-6 focus:outline-none dark:bg-slate-900 dark:ring-white/10"
      >
        <div
          className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300 sm:hidden dark:bg-slate-700"
          aria-hidden
        />
        <div className="mb-4 flex items-center justify-between">
          <h2 id="modal-title" className="text-lg font-bold tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
