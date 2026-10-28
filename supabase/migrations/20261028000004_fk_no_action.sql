-- Use NO ACTION (checked at end of statement) instead of RESTRICT (checked immediately)
-- for category references. Deleting an in-use category is still blocked, but deleting a
-- whole user account (which cascades to categories AND expenses) works regardless of order.

alter table public.expenses
  drop constraint expenses_category_id_fkey,
  add constraint expenses_category_id_fkey
    foreign key (category_id) references public.categories (id) on delete no action;

alter table public.recurring_expenses
  drop constraint recurring_expenses_category_id_fkey,
  add constraint recurring_expenses_category_id_fkey
    foreign key (category_id) references public.categories (id) on delete no action;
