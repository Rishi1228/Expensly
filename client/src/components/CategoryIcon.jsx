import { iconFor } from '../lib/icons.js';

const sizes = {
  sm: 'size-8 rounded-xl [&>svg]:size-4',
  md: 'size-10 rounded-2xl [&>svg]:size-5',
  lg: 'size-12 rounded-2xl [&>svg]:size-6',
};

/** Category icon in a soft tinted squircle. */
export default function CategoryIcon({ icon, color = '#94a3b8', size = 'md' }) {
  const Icon = iconFor(icon);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${sizes[size]}`}
      style={{
        backgroundColor: `${color}1f`,
        color,
        boxShadow: `inset 0 0 0 1px ${color}29`,
      }}
      aria-hidden
    >
      <Icon />
    </span>
  );
}
