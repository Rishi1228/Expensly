/** Round initials badge for a family member. */
export default function MemberAvatar({ name, size = 'md' }) {
  const initials = (name || '?')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  const sizes = { sm: 'size-8 text-xs', md: 'size-10 text-sm' };
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 ${sizes[size]}`}
      aria-hidden
    >
      {initials}
    </span>
  );
}
