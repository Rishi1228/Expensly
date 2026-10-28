import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { useCategories } from '../hooks/useCategories.js';
import { useDeleteRecurring, useSaveRecurring } from '../hooks/useRecurring.js';
import { formatMoney, formatSchedule, toISODate } from '../lib/format.js';
import { amountField } from '../lib/schemas.js';
import CategoryPicker from './CategoryPicker.jsx';
import Button from './ui/Button.jsx';
import Field, { inputClass } from './ui/Field.jsx';
import Spinner from './ui/Spinner.jsx';
import { chip } from './ui/chip.js';

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const schema = z.object({
  amount: amountField,
  category_id: z.string().min(1, 'Pick a category'),
  subcategory_id: z.string().optional(),
  description: z.string().max(500, 'Keep it under 500 characters').optional(),
  frequency: z.enum(['weekly', 'monthly', 'yearly']),
  start_date: z.string().min(1, 'Pick a date'),
});

/** Add (no bill) or edit (bill given) a recurring bill. Calls onDone after save/delete. */
export default function RecurringForm({ bill, onDone }) {
  const { data: categories, isLoading } = useCategories();
  const save = useSaveRecurring();
  const remove = useDeleteRecurring();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: bill ? String(Number(bill.amount)) : '',
      category_id: bill?.category?.id ?? '',
      subcategory_id: bill?.subcategory?.id ?? '',
      description: bill?.description ?? '',
      frequency: bill?.frequency ?? 'monthly',
      start_date: bill?.start_date ?? toISODate(new Date()),
    },
  });

  const [categoryId, subcategoryId, frequency, startDate] = watch([
    'category_id',
    'subcategory_id',
    'frequency',
    'start_date',
  ]);

  const pickCategory = ({ category_id, subcategory_id }) => {
    setValue('category_id', category_id, { shouldValidate: true });
    setValue('subcategory_id', subcategory_id);
  };

  const onSubmit = (v) => {
    const body = {
      id: bill?.id,
      amount: Number(v.amount),
      category_id: v.category_id,
      subcategory_id: v.subcategory_id || null,
      description: v.description?.trim() || null,
    };
    // Only send schedule fields when they change: the server recomputes the next due date from them.
    if (!bill || v.frequency !== bill.frequency) body.frequency = v.frequency;
    if (!bill || v.start_date !== bill.start_date) body.start_date = v.start_date;

    save.mutate(body, {
      onSuccess: ({ logged }) => {
        toast.success(
          logged
            ? `Bill saved · logged ${formatMoney(v.amount)} due today`
            : bill
              ? 'Bill updated'
              : 'Bill added',
        );
        onDone();
      },
      onError: (e) => toast.error(e.message),
    });
  };

  const onDelete = () => {
    if (!confirmDelete) return setConfirmDelete(true);
    remove.mutate(bill.id, {
      onSuccess: () => {
        toast.success('Bill deleted. Expenses it already logged are kept.');
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
      <input type="hidden" {...register('frequency')} />

      <Field label="Amount" htmlFor="rec-amount" error={errors.amount?.message}>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-2xl text-slate-400">
            ₹
          </span>
          <input
            id="rec-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            autoFocus={!bill}
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

      <Field label="Repeats">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Repeats">
          {FREQUENCIES.map((f) => (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={frequency === f.value}
              className={chip(frequency === f.value)}
              onClick={() => setValue('frequency', f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Field>

      <Field
        label={bill ? 'Schedule starts' : 'First due date'}
        htmlFor="rec-start"
        error={errors.start_date?.message}
        hint={
          startDate
            ? `${formatSchedule(frequency, startDate)}. Logged automatically on each due date.`
            : undefined
        }
      >
        <input id="rec-start" type="date" className={inputClass} {...register('start_date')} />
      </Field>

      <Field
        label="Description (optional)"
        htmlFor="rec-description"
        error={errors.description?.message}
      >
        <input
          id="rec-description"
          type="text"
          placeholder="e.g. Netflix, flat rent"
          className={inputClass}
          {...register('description')}
        />
      </Field>

      <div className="flex items-center gap-3 pt-1">
        {bill && (
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
          {bill ? 'Save changes' : 'Add bill'}
        </Button>
      </div>
    </form>
  );
}
