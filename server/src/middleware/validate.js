import { HttpError } from '../lib/errors.js';

/**
 * Validates req.body / req.query / req.params against Zod schemas.
 * Parsed (coerced) values are stored on req.valid.{body,query,params}.
 */
export function validate(schemas) {
  return (req, _res, next) => {
    req.valid = {};
    for (const part of ['params', 'query', 'body']) {
      if (!schemas[part]) continue;
      const result = schemas[part].safeParse(req[part] ?? {});
      if (!result.success) {
        const details = result.error.issues.map((i) => ({
          field: i.path.join('.') || part,
          message: i.message,
        }));
        return next(new HttpError(400, 'Validation failed', details));
      }
      req.valid[part] = result.data;
    }
    next();
  };
}
