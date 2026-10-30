import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { idParam } from '../schemas/common.js';
import {
  byMemberQuery,
  createFamily,
  familyExpensesQuery,
  familyRangeQuery,
  familySubcategoryQuery,
  familyTrendQuery,
  inviteBody,
  updateFamily,
  userIdBody,
  userIdParam,
} from '../schemas/family.js';
import * as ctrl from '../controllers/family.js';

const router = Router();

router.get('/', ctrl.getFamily);
router.post('/', validate({ body: createFamily }), ctrl.createFamily);
router.put('/', validate({ body: updateFamily }), ctrl.updateFamily);
router.delete('/', ctrl.deleteFamily);

router.post('/invites', validate({ body: inviteBody }), ctrl.invite);
router.delete('/invites/:id', validate({ params: idParam }), ctrl.cancelInvite);
router.post('/invites/:id/accept', validate({ params: idParam }), ctrl.respondInvite(true));
router.post('/invites/:id/decline', validate({ params: idParam }), ctrl.respondInvite(false));

router.delete('/members/:userId', validate({ params: userIdParam }), ctrl.removeMember);
router.post('/leave', ctrl.leave);
router.post('/transfer', validate({ body: userIdBody }), ctrl.transferHead);

router.get('/stats/summary', validate({ query: familyRangeQuery }), ctrl.summary);
router.get('/stats/by-member', validate({ query: byMemberQuery }), ctrl.byMember);
router.get('/stats/by-category', validate({ query: familyRangeQuery }), ctrl.categoryBreakdown);
router.get(
  '/stats/by-subcategory',
  validate({ query: familySubcategoryQuery }),
  ctrl.subcategoryBreakdown,
);
router.get('/stats/trend', validate({ query: familyTrendQuery }), ctrl.trend);
router.get('/expenses', validate({ query: familyExpensesQuery }), ctrl.listExpenses);

export default router;
