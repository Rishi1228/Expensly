import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ChevronDown, Plus, Trash2, X } from 'lucide-react';
import {
  useCategories,
  useCreateCategory,
  useCreateSubcategory,
  useDeleteCategory,
  useDeleteSubcategory,
} from '../hooks/useCategories.js';
import { ICON_CHOICES } from '../lib/icons.js';
import CategoryIcon from '../components/CategoryIcon.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Field, { inputClass } from '../components/ui/Field.jsx';
import Modal from '../components/ui/Modal.jsx';
import Spinner from '../components/ui/Spinner.jsx';

const COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#0ea5e9',
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#64748b',
];

const cardClass =
  'overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800';

const errorText = (e, what) =>
  e.status === 409 && e.message === 'Already exists'
    ? `A ${what} with that name already exists`
    : e.message;

export default function CategoriesPage() {
  const { data: categories, isLoading, isError, error, refetch } = useCategories();
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <Link
        to="/profile"
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
      >
        <ArrowLeft className="size-4" aria-hidden /> Profile
      </Link>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-sm text-slate-500">Add your own categories and subcategories.</p>
        </div>
        <Button onClick={() => setAdding(true)} className="shrink-0">
          <Plus className="size-4" aria-hidden />{' '}
          <span className="hidden sm:inline">New category</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <EmptyState
          title="Couldn’t load categories"
          message={error.message}
          action={<Button onClick={() => refetch()}>Try again</Button>}
        />
      ) : (
        <div className={`${cardClass} divide-y divide-slate-100 dark:divide-slate-800`}>
          {categories.map((c) => (
            <CategoryItem key={c.id} category={c} />
          ))}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="New category">
        {adding && <NewCategoryForm onDone={() => setAdding(false)} />}
      </Modal>
    </div>
  );
}

function CategoryItem({ category }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const remove = useDeleteCategory();
  const panelId = `cat-${category.id}`;

  const onDelete = () => {
    if (!confirm) return setConfirm(true);
    remove.mutate(category.id, {
      onSuccess: () => toast.success(`${category.name} deleted`),
      onError: (e) => {
        toast.error(e.message);
        setConfirm(false);
      },
    });
  };

  return (
    <div>
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
        >
          <CategoryIcon icon={category.icon} color={category.color} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 truncate font-medium">
              {category.name}
              {category.is_custom && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Custom
                </span>
              )}
            </span>
            <span className="block text-xs text-slate-500">
              {category.subcategories.length
                ? `${category.subcategories.length} ${category.subcategories.length === 1 ? 'subcategory' : 'subcategories'}`
                : 'No subcategories'}
            </span>
          </span>
          <ChevronDown
            className={`mr-2 size-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
        {category.is_custom && (
          <Button
            variant={confirm ? 'danger' : 'danger-soft'}
            size="sm"
            className="mr-2"
            onClick={onDelete}
            onBlur={() => setConfirm(false)}
            loading={remove.isPending}
            aria-label={confirm ? `Confirm delete ${category.name}` : `Delete ${category.name}`}
          >
            <Trash2 className="size-4" aria-hidden />
            {confirm && 'Delete?'}
          </Button>
        )}
      </div>
      {open && (
        <div id={panelId} className="px-4 pt-1 pb-4">
          <Subcategories category={category} />
        </div>
      )}
    </div>
  );
}

function Subcategories({ category }) {
  const [name, setName] = useState('');
  const create = useCreateSubcategory();
  const remove = useDeleteSubcategory();

  const onAdd = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    create.mutate(
      { categoryId: category.id, name: trimmed },
      {
        onSuccess: () => {
          setName('');
          toast.success(`Added ${trimmed}`);
        },
        onError: (err) => toast.error(errorText(err, 'subcategory')),
      },
    );
  };

  return (
    <div className="space-y-3">
      {category.subcategories.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={`${category.name} subcategories`}>
          {category.subcategories.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-1 rounded-full bg-slate-100 py-1 pr-1 pl-3 text-sm dark:bg-slate-800"
            >
              {s.name}
              {s.is_custom ? (
                <button
                  type="button"
                  onClick={() =>
                    remove.mutate(s.id, {
                      onSuccess: () => toast.success(`Removed ${s.name}`),
                      onError: (e) => toast.error(e.message),
                    })
                  }
                  disabled={remove.isPending}
                  className="rounded-full p-0.5 text-slate-500 hover:bg-slate-200 hover:text-rose-600 dark:hover:bg-slate-700"
                  aria-label={`Remove ${s.name}`}
                  title="Remove (expenses keep their category)"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              ) : (
                <span className="w-1" />
              )}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={onAdd} className="flex gap-2">
        <label htmlFor={`sub-${category.id}`} className="sr-only">
          New {category.name} subcategory
        </label>
        <input
          id={`sub-${category.id}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          placeholder="Add a subcategory"
          className={inputClass}
        />
        <Button
          type="submit"
          variant="secondary"
          loading={create.isPending}
          disabled={!name.trim()}
        >
          Add
        </Button>
      </form>
    </div>
  );
}

function NewCategoryForm({ onDone }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('tag');
  const [color, setColor] = useState(COLORS[6]);
  const [error, setError] = useState('');
  const create = useCreateCategory();

  const onSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError('Enter a name');
    create.mutate(
      { name: trimmed, icon, color },
      {
        onSuccess: () => {
          toast.success(`${trimmed} added`);
          onDone();
        },
        onError: (err) => setError(errorText(err, 'category')),
      },
    );
  };

  const pick = (selected) =>
    `flex items-center justify-center rounded-xl p-1.5 ring-1 transition ${
      selected
        ? 'ring-2 ring-indigo-600'
        : 'ring-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="flex items-center gap-3">
        <CategoryIcon icon={icon} color={color} size="lg" />
        <Field label="Name" htmlFor="cat-name" error={error} className="flex-1">
          <input
            id="cat-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            maxLength={50}
            autoFocus
            placeholder="e.g. Pets"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Icon">
        <div className="grid grid-cols-8 gap-1" role="radiogroup" aria-label="Icon">
          {ICON_CHOICES.map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={icon === key}
              aria-label={key.replace(/-/g, ' ')}
              onClick={() => setIcon(key)}
              className={pick(icon === key)}
            >
              <CategoryIcon icon={key} color={color} size="sm" />
            </button>
          ))}
        </div>
      </Field>

      <Field label="Color">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={c}
              onClick={() => setColor(c)}
              className={`size-8 rounded-full ring-offset-2 transition dark:ring-offset-slate-900 ${
                color === c ? 'ring-2 ring-slate-900 dark:ring-white' : ''
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </Field>

      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={create.isPending}>
          Add category
        </Button>
      </div>
    </form>
  );
}
