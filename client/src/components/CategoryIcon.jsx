import { iconFor } from '../lib/icons.js';

const sizes = {
  sm: 'size-8 [&>svg]:size-4',
  md: 'size-10 [&>svg]:size-5',
  lg: 'size-12 [&>svg]:size-6',
};

/** Category icon in a soft tinted circle. */
export default function CategoryIcon({ icon, color = '#94a3b8', size = 'md' }) {
  const Icon = iconFor(icon);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${sizes[size]}`}
      style={{ backgroundColor: `${color}22`, color }}
      aria-hidden
    >
      <Icon />
    </span>
  );
}
