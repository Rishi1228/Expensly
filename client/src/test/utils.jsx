import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';

/** Renders inside a fresh React Query client (no retries, no shared cache). */
export function renderWithQuery(ui) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

export const CATEGORIES = [
  {
    id: 'cat-food',
    name: 'Food',
    icon: 'utensils',
    color: '#f97316',
    subcategories: [
      { id: 'sub-online', name: 'Online Order' },
      { id: 'sub-street', name: 'Dine-in (Street)' },
    ],
  },
  {
    id: 'cat-misc',
    name: 'Miscellaneous',
    icon: 'circle-ellipsis',
    color: '#64748b',
    subcategories: [],
  },
];
