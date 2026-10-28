import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { idParam } from '../schemas/common.js';
import { createCategory, createSubcategory } from '../schemas/categories.js';
import * as ctrl from '../controllers/categories.js';

export const categoriesRouter = Router();
categoriesRouter.get('/', ctrl.listCategories);
categoriesRouter.post('/', validate({ body: createCategory }), ctrl.createCategory);
categoriesRouter.delete('/:id', validate({ params: idParam }), ctrl.deleteCategory);
categoriesRouter.post(
  '/:id/subcategories',
  validate({ params: idParam, body: createSubcategory }),
  ctrl.createSubcategory,
);

export const subcategoriesRouter = Router();
subcategoriesRouter.delete('/:id', validate({ params: idParam }), ctrl.deleteSubcategory);
