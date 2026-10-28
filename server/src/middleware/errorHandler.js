import { HttpError } from '../lib/errors.js';

export function notFound(_req, _res, next) {
  next(new HttpError(404, 'Not found'));
}

export function errorHandler(err, _req, res, _next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);

  const body = {
    error: err instanceof HttpError || status < 500 ? err.message : 'Internal server error',
  };
  if (err.details && (status < 500 || process.env.NODE_ENV !== 'production')) {
    body.details = err.details;
  }
  res.status(status).json(body);
}
