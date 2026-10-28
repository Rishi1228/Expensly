import {
  Car,
  CircleEllipsis,
  Clapperboard,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tag,
  TrendingUp,
  Utensils,
  Wrench,
} from 'lucide-react';

// Keys match categories.icon in the database seed.
const ICONS = {
  utensils: Utensils,
  car: Car,
  'shopping-cart': ShoppingCart,
  receipt: Receipt,
  wrench: Wrench,
  clapperboard: Clapperboard,
  'trending-up': TrendingUp,
  'hand-coins': HandCoins,
  'shopping-bag': ShoppingBag,
  'heart-pulse': HeartPulse,
  sparkles: Sparkles,
  gift: Gift,
  'graduation-cap': GraduationCap,
  'circle-ellipsis': CircleEllipsis,
};

const sizes = {
  sm: 'size-8 [&>svg]:size-4',
  md: 'size-10 [&>svg]:size-5',
  lg: 'size-12 [&>svg]:size-6',
};

/** Category icon in a soft tinted circle. */
export default function CategoryIcon({ icon, color = '#94a3b8', size = 'md' }) {
  const Icon = ICONS[icon] || Tag;
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
