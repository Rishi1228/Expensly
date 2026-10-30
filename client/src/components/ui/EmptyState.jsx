export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <span className="bg-brand mb-4 flex size-14 items-center justify-center rounded-2xl text-white shadow-glow">
          <Icon className="size-7" aria-hidden />
        </span>
      )}
      <p className="text-lg font-semibold">{title}</p>
      {message && <p className="mt-1 max-w-xs text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
