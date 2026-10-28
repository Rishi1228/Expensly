import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { idParam } from '../schemas/common.js';
import { createRecurring, todayQuery, updateRecurring } from '../schemas/recurring.js';
import * as ctrl from '../controllers/recurring.js';

const router = Router();

router.get('/', ctrl.listRecurring);
router.post('/', validate({ query: todayQuery, body: createRecurring }), ctrl.createRecurring);
router.post('/run', validate({ query: todayQuery }), ctrl.runDue);
router.put(
  '/:id',
  validate({ params: idParam, query: todayQuery, body: updateRecurring }),
  ctrl.updateRecurring,
);
router.delete('/:id', validate({ params: idParam }), ctrl.deleteRecurring);

export default router;
