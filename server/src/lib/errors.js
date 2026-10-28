export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Maps a Supabase/PostgREST error to an HttpError with a sensible status. */
export function fromSupabaseError(error) {
  if (!error) return null;
  switch (error.code) {
    case 'PGRST116': // .single() found no rows
      return new HttpError(404, 'Not found');
    case '23505':
      return new HttpError(409, 'Already exists');
    case '23503':
      return new HttpError(400, error.message || 'Invalid reference');
    case '23514':
    case '22023':
    case '22P02':
      return new HttpError(400, 'Invalid value');
    case '42501':
      return new HttpError(403, 'Not allowed');
    default:
      return new HttpError(500, 'Database error', { code: error.code, message: error.message });
  }
}

/** Throws if a Supabase call returned an error; otherwise returns its data. */
export function unwrap({ data, error }) {
  if (error) throw fromSupabaseError(error);
  return data;
}
