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
export const ICONS = {
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

/** Icons offered when creating a custom category. */
export const ICON_CHOICES = [...Object.keys(ICONS), 'tag'];

export const iconFor = (key) => ICONS[key] || Tag;
