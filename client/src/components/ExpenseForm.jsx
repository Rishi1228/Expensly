import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { useCategories } from '../hooks/useCategories.js';
import { useDeleteExpense, useSaveExpense } from '../hooks/useExpenses.js';
import { addDays, toISODate } from '../lib/format.js';
import { amountField } from '../lib/schemas.js';
import CategoryPicker from './CategoryPicker.jsx';
import Button from './ui/Button.jsx';
import Field, { inputClass } from './ui/Field.jsx';
import Spinner from './ui/Spinner.jsx';
import { chip } from './ui/chip.js';

const schema = z.object({
  amount: amountField,
  category_id: z.string().min(1, 'Pick a category'),
  subcategory_id: z.string().optional(),
  description: z.string().max(500, 'Keep it under 500 characters').optional(),
  expense_date: z.string().min(1, 'Pick a date'),
});

/** Add (no expense) or edit (expense given) form. Calls onDone after save/delete. */
export default function ExpenseForm({ expense, onDone }) {
  const { data: categories, isLoading } = useCategories();
  const save = useSaveExpense();
  const remove = useDeleteExpense();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const today = toISODate(new Date());
  const yesterday = toISODate(addDays(new Date(), -1));

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: expense ? String(Number(expense.amount)) : '',
      category_id: expense?.category?.id ?? '',
      subcategory_id: expense?.subcategory?.id ?? '',
      description: expense?.description ?? '',
      expense_date: expense?.expense_date ?? today,
    },
  });

  const categoryId = watch('category_id');
  const subcategoryId = watch('subcategory_id');
  const expenseDate = watch('expense_date');

  const pickCategory = ({ category_id, subcategory_id }) => {
    setValue('category_id', category_id, { shouldValidate: true });
    setValue('subcategory_id', subcategory_id);
  };

  const onSubmit = (v) =>
    save.mutate(
      {
        id: expense?.id,
        amount: Number(v.amount),
        category_id: v.category_id,
        subcategory_id: v.subcategory_id || null,
        description: v.description?.trim() || null,
        expense_date: v.expense_date,
      },
      {
        onSuccess: () => {
          toast.success(expense ? 'Expense updated' : 'Expense added');
          onDone();
        },
        onError: (e) => toast.error(e.message),
      },
    );

  const onDelete = () => {
    if (!confirmDelete) return setConfirmDelete(true);
    remove.mutate(expense.id, {
      onSuccess: () => {
        toast.success('Expense deleted');
        onDone();
      },
      onError: (e) => toast.error(e.message),
    });
  };

  if (isLoading) return <Spinner />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <input type="hidden" {...register('category_id')} />
      <input type="hidden" {...register('subcategory_id')} />

      <Field label="Amount" htmlFor="amount" error={errors.amount?.message}>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-2xl text-slate-400">
            ₹
          </span>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            autoFocus={!expense}
            className={`${inputClass} py-3 pl-9 text-2xl font-semibold`}
            {...register('amount')}
          />
        </div>
      </Field>

      <CategoryPicker
        categories={categories}
        categoryId={categoryId}
        subcategoryId={subcategoryId}
        onChange={pickCategory}
        error={errors.category_id?.message}
      />

      <Field label="Date" htmlFor="expense_date" error={errors.expense_date?.message}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={chip(expenseDate === today)}
            onClick={() => setValue('expense_date', today)}
          >
            Today
          </button>
          <button
            type="button"
            className={chip(expenseDate === yesterday)}
            onClick={() => setValue('expense_date', yesterday)}
          >
            Yesterday
          </button>
          <input
            id="expense_date"
            type="date"
            className={`${inputClass} w-auto flex-1`}
            {...register('expense_date')}
          />
        </div>
      </Field>

      <Field
        label="Description (optional)"
        htmlFor="description"
        error={errors.description?.message}
      >
        <input
          id="description"
          type="text"
          placeholder="e.g. Biryani from Swiggy"
          className={inputClass}
          {...register('description')}
        />
      </Field>

      <div className="flex items-center gap-3 pt-1">
        {expense && (
          <Button
            type="button"
            variant={confirmDelete ? 'danger' : 'danger-soft'}
            onClick={onDelete}
            loading={remove.isPending}
            onBlur={() => setConfirmDelete(false)}
          >
            <Trash2 className="size-4" aria-hidden />
            {confirmDelete ? 'Tap again to delete' : 'Delete'}
          </Button>
        )}
        <Button
          type="submit"
          size="lg"
          className="ml-auto flex-1 sm:flex-none"
          loading={save.isPending}
        >
          {expense ? 'Save changes' : 'Add expense'}
        </Button>
      </div>
    </form>
  );
}
