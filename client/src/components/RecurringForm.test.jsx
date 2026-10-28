import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../api/client.js';
import { CATEGORIES, renderWithQuery } from '../test/utils.jsx';
import RecurringForm from './RecurringForm.jsx';

vi.mock('../api/client.js', () => ({
  api: vi.fn(),
  toQuery: (p) => `?${new URLSearchParams(p)}`,
}));

beforeEach(() => {
  api.mockReset();
  api.mockImplementation(async (path) =>
    path === '/categories' ? { data: CATEGORIES } : { data: {}, logged: 0 },
  );
});

const bill = {
  id: 'rec-1',
  amount: '649.00',
  description: 'Netflix',
  frequency: 'monthly',
  start_date: '2026-10-28',
  next_due_date: '2026-11-28',
  is_active: true,
  category: CATEGORIES[0],
  subcategory: { id: 'sub-online', name: 'Online Order' },
};

describe('RecurringForm', () => {
  it('creates a monthly bill and previews its schedule', async () => {
    const onDone = vi.fn();
    renderWithQuery(<RecurringForm onDone={onDone} />);

    await userEvent.type(await screen.findByLabelText('Amount'), '15000');
    await userEvent.click(screen.getByRole('radio', { name: 'Miscellaneous' }));
    const start = screen.getByLabelText('First due date');
    await userEvent.clear(start);
    await userEvent.type(start, '2026-11-01');
    expect(screen.getByText(/Monthly on the 1st/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add bill' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const [path, opts] = api.mock.calls.find(([p]) => p.startsWith('/recurring'));
    expect(path).toMatch(/^\/recurring\?today=\d{4}-\d{2}-\d{2}$/);
    expect(opts).toEqual({
      method: 'POST',
      body: {
        amount: 15000,
        category_id: 'cat-misc',
        subcategory_id: null,
        description: null,
        frequency: 'monthly',
        start_date: '2026-11-01',
      },
    });
  });

  it('editing only the amount does not send the schedule', async () => {
    renderWithQuery(<RecurringForm bill={bill} onDone={() => {}} />);
    const amount = await screen.findByLabelText('Amount');
    await userEvent.clear(amount);
    await userEvent.type(amount, '699');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(api).toHaveBeenCalledWith(expect.stringMatching(/^\/recurring\/rec-1\?/), {
        method: 'PUT',
        body: {
          amount: 699,
          category_id: 'cat-food',
          subcategory_id: 'sub-online',
          description: 'Netflix',
        },
      }),
    );
  });

  it('sends the new frequency when it changes', async () => {
    renderWithQuery(<RecurringForm bill={bill} onDone={() => {}} />);
    await userEvent.click(await screen.findByRole('radio', { name: 'Yearly' }));
    expect(screen.getByText(/Yearly on 28 Oct/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(api).toHaveBeenCalledWith(
        expect.stringMatching(/^\/recurring\/rec-1\?/),
        expect.objectContaining({ body: expect.objectContaining({ frequency: 'yearly' }) }),
      ),
    );
  });
});
