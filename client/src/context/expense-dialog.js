import { createContext, useContext } from 'react';

export const ExpenseDialogContext = createContext(null);

/** { openAdd(), openEdit(expense) } — opens the shared add/edit expense dialog. */
export function useExpenseDialog() {
  const ctx = useContext(ExpenseDialogContext);
  if (!ctx) throw new Error('useExpenseDialog must be used inside <AppLayout>');
  return ctx;
}
