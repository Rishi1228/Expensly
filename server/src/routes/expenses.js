import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { idParam } from '../schemas/common.js';
import { createExpense, listExpensesQuery, updateExpense } from '../schemas/expenses.js';
import * as ctrl from '../controllers/expenses.js';

const router = Router();

router.get('/', validate({ query: listExpensesQuery }), ctrl.listExpenses);
router.post('/', validate({ body: createExpense }), ctrl.createExpense);
router.get('/:id', validate({ params: idParam }), ctrl.getExpense);
router.put('/:id', validate({ params: idParam, body: updateExpense }), ctrl.updateExpense);
router.delete('/:id', validate({ params: idParam }), ctrl.deleteExpense);

export default router;
