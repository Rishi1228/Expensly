import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryPicker from './CategoryPicker.jsx';
import { CATEGORIES } from '../test/utils.jsx';

describe('CategoryPicker', () => {
  it('picks a category and clears any subcategory', async () => {
    const onChange = vi.fn();
    render(
      <CategoryPicker categories={CATEGORIES} categoryId="" subcategoryId="" onChange={onChange} />,
    );
    expect(screen.queryByText('Online Order')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'Food' }));
    expect(onChange).toHaveBeenCalledWith({ category_id: 'cat-food', subcategory_id: '' });
  });

  it('shows the chosen category’s subcategories and toggles one', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <CategoryPicker
        categories={CATEGORIES}
        categoryId="cat-food"
        subcategoryId=""
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Food' })).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Online Order' }));
    expect(onChange).toHaveBeenLastCalledWith({
      category_id: 'cat-food',
      subcategory_id: 'sub-online',
    });

    rerender(
      <CategoryPicker
        categories={CATEGORIES}
        categoryId="cat-food"
        subcategoryId="sub-online"
        onChange={onChange}
      />,
    );
    const chip = screen.getByRole('button', { name: 'Online Order' });
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(chip); // tapping the active chip clears it
    expect(onChange).toHaveBeenLastCalledWith({ category_id: 'cat-food', subcategory_id: '' });
  });

  it('shows the validation error', () => {
    render(
      <CategoryPicker
        categories={CATEGORIES}
        categoryId=""
        subcategoryId=""
        onChange={() => {}}
        error="Pick a category"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Pick a category');
  });
});
