-- Phase 1: default categories + subcategories (user_id null = visible to everyone).
-- Icons are lucide-react names; colors are used by the dashboard charts.

insert into public.categories (name, icon, color, sort_order) values
  ('Food',              'utensils',       '#f97316', 1),
  ('Travel',            'car',            '#3b82f6', 2),
  ('Groceries',         'shopping-cart',  '#22c55e', 3),
  ('Necessities',       'receipt',        '#64748b', 4),
  ('Repairs',           'wrench',         '#a16207', 5),
  ('Entertainment',     'clapperboard',   '#a855f7', 6),
  ('Investment',        'trending-up',    '#14b8a6', 7),
  ('Lent Money',        'hand-coins',     '#eab308', 8),
  ('Shopping',          'shopping-bag',   '#ec4899', 9),
  ('Health',            'heart-pulse',    '#ef4444', 10),
  ('Personal Care',     'sparkles',       '#f472b6', 11),
  ('Gifts & Donations', 'gift',           '#8b5cf6', 12),
  ('Education',         'graduation-cap', '#0ea5e9', 13),
  ('Miscellaneous',     'circle-ellipsis','#94a3b8', 14);

insert into public.subcategories (category_id, name, sort_order)
select c.id, s.name, s.ord
from (values
  ('Food', 'Online Order', 1),
  ('Food', 'Dine-in (Restaurant)', 2),
  ('Food', 'Dine-in (Street)', 3),

  ('Travel', 'Cab/Auto', 1),
  ('Travel', 'Metro/Bus', 2),
  ('Travel', 'Train', 3),
  ('Travel', 'Flight', 4),
  ('Travel', 'Fuel', 5),

  ('Groceries', 'Zepto', 1),
  ('Groceries', 'Blinkit', 2),
  ('Groceries', 'DMart', 3),
  ('Groceries', 'In-store', 4),

  ('Necessities', 'Electricity Bill', 1),
  ('Necessities', 'Gas Bill', 2),
  ('Necessities', 'Newspaper Bill', 3),
  ('Necessities', 'House Help Wage', 4),
  ('Necessities', 'Fees', 5),
  ('Necessities', 'Rent', 6),

  ('Repairs', 'Home', 1),
  ('Repairs', 'Vehicle', 2),
  ('Repairs', 'Electronics', 3),

  ('Entertainment', 'OTT', 1),
  ('Entertainment', 'Movie', 2),
  ('Entertainment', 'Play - Turf', 3),
  ('Entertainment', 'Play - PS', 4),
  ('Entertainment', 'Play - Pool', 5),
  ('Entertainment', 'Play - Badminton', 6),
  ('Entertainment', 'Concerts', 7),
  ('Entertainment', 'Events', 8),

  ('Investment', 'SIP/Mutual Fund', 1),
  ('Investment', 'Stocks', 2),
  ('Investment', 'FD/RD', 3),
  ('Investment', 'Gold', 4),

  ('Shopping', 'Clothes', 1),
  ('Shopping', 'Electronics', 2),
  ('Shopping', 'Home Items', 3),

  ('Health', 'Medicine', 1),
  ('Health', 'Doctor', 2),
  ('Health', 'Gym', 3),
  ('Health', 'Insurance', 4),

  ('Personal Care', 'Salon', 1),
  ('Personal Care', 'Grooming', 2),

  ('Gifts & Donations', 'Gifts', 1),
  ('Gifts & Donations', 'Charity', 2),

  ('Education', 'Courses', 1),
  ('Education', 'Books', 2)
) as s(category, name, ord)
join public.categories c on c.name = s.category and c.user_id is null;
