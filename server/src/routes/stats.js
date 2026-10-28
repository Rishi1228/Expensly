import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { rangeQuery, subcategoryQuery, trendQuery } from '../schemas/stats.js';
import * as ctrl from '../controllers/stats.js';

const router = Router();

router.get('/summary', validate({ query: rangeQuery }), ctrl.summary);
router.get('/by-category', validate({ query: rangeQuery }), ctrl.categoryBreakdown);
router.get('/by-subcategory', validate({ query: subcategoryQuery }), ctrl.subcategoryBreakdown);
router.get('/trend', validate({ query: trendQuery }), ctrl.trend);

export default router;
