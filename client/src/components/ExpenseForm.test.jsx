import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../api/client.js';
import { toISODate } from '../lib/format.js';
import { CATEGORIES, renderWithQuery } from '../test/utils.jsx';
import ExpenseForm from './ExpenseForm.jsx';

vi.mock('../api/client.js', () => ({ api: vi.fn(), toQuery: () => '' }));

beforeEach(() => {
  api.mockReset();
  api.mockImplementation(async (path) =>
    path === '/categories' ? { data: CATEGORIES } : { data: {} },
  );
});

describe('ExpenseForm', () => {
  it('shows errors and does not save an empty form', async () => {
    renderWithQuery(<ExpenseForm onDone={() => {}} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Add expense' }));

    expect(await screen.findByText('Enter an amount')).toBeInTheDocument();
    expect(screen.getByText('Pick a category')).toBeInTheDocument();
    expect(api).not.toHaveBeenCalledWith('/expenses', expect.anything());
  });

  it('rejects an amount with more than 2 decimals', async () => {
    renderWithQuery(<ExpenseForm onDone={() => {}} />);
    await userEvent.type(await screen.findByLabelText('Amount'), '10.555');
    await userEvent.click(screen.getByRole('button', { name: 'Add expense' }));
    expect(await screen.findByText(/up to 2 decimals/)).toBeInTheDocument();
  });

  it('creates an expense with today’s date by default', async () => {
    const onDone = vi.fn();
    renderWithQuery(<ExpenseForm onDone={onDone} />);

    await userEvent.type(await screen.findByLabelText('Amount'), '250');
    await userEvent.click(screen.getByRole('radio', { name: 'Food' }));
    await userEvent.click(screen.getByRole('button', { name: 'Online Order' }));
    await userEvent.type(screen.getByLabelText('Description (optional)'), '  Biryani ');
    await userEvent.click(screen.getByRole('button', { name: 'Add expense' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(api).toHaveBeenCalledWith('/expenses', {
      method: 'POST',
      body: {
        amount: 250,
        category_id: 'cat-food',
        subcategory_id: 'sub-online',
        description: 'Biryani',
        expense_date: toISODate(new Date()),
      },
    });
  });

  it('edits an existing expense and needs two taps to delete', async () => {
    const expense = {
      id: 'exp-1',
      amount: '120.00',
      description: null,
      expense_date: '2026-10-20',
      category: CATEGORIES[1],
      subcategory: null,
    };
    const onDone = vi.fn();
    renderWithQuery(<ExpenseForm expense={expense} onDone={onDone} />);

    expect(await screen.findByLabelText('Amount')).toHaveValue('120');
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(api).not.toHaveBeenCalledWith('/expenses/exp-1', expect.anything());
    await userEvent.click(screen.getByRole('button', { name: 'Tap again to delete' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(api).toHaveBeenCalledWith('/expenses/exp-1', { method: 'DELETE' });
  });
});
