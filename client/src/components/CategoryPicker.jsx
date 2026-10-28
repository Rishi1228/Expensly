import CategoryIcon from './CategoryIcon.jsx';
import Field from './ui/Field.jsx';
import { chip } from './ui/chip.js';

/**
 * Category grid, then the chosen category's subcategories as chips.
 * Picking a new category clears the subcategory; tapping the active chip again clears it too.
 */
export default function CategoryPicker({ categories, categoryId, subcategoryId, onChange, error }) {
  const selected = categories?.find((c) => c.id === categoryId);

  return (
    <>
      <Field label="Category" error={error}>
        <div
          className="grid grid-cols-4 gap-2 sm:grid-cols-5"
          role="radiogroup"
          aria-label="Category"
        >
          {categories?.map((c) => {
            const active = c.id === categoryId;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ category_id: c.id, subcategory_id: '' })}
                className={`flex flex-col items-center gap-1 rounded-xl p-2 text-center text-xs leading-tight ring-1 transition ${
                  active
                    ? 'bg-indigo-50 ring-2 ring-indigo-600 dark:bg-indigo-950'
                    : 'ring-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <CategoryIcon icon={c.icon} color={c.color} size="sm" />
                <span className="line-clamp-2">{c.name}</span>
              </button>
            );
          })}
        </div>
      </Field>

      {selected?.subcategories.length > 0 && (
        <Field label={`${selected.name} type (optional)`}>
          <div className="flex flex-wrap gap-2">
            {selected.subcategories.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={s.id === subcategoryId}
                className={chip(s.id === subcategoryId)}
                onClick={() =>
                  onChange({
                    category_id: categoryId,
                    subcategory_id: s.id === subcategoryId ? '' : s.id,
                  })
                }
              >
                {s.name}
              </button>
            ))}
          </div>
        </Field>
      )}
    </>
  );
}
