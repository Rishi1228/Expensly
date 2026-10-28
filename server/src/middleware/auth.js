import { getAnonClient, getUserClient } from '../lib/supabase.js';
import { HttpError } from '../lib/errors.js';

/**
 * Checks the Supabase access token in the Authorization header.
 * On success sets req.user ({ id, email }) and req.supabase (a client scoped to that user).
 */
export async function requireAuth(req, _res, next) {
  try {
    const header = req.get('authorization') || '';
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new HttpError(401, 'Missing access token');
    }

    let claims, error;
    try {
      const result = await getAnonClient().auth.getClaims(token);
      claims = result.data?.claims;
      error = result.error;
    } catch (e) {
      error = e; // malformed token
    }
    if (error || !claims?.sub) throw new HttpError(401, 'Invalid or expired session');

    req.user = { id: claims.sub, email: claims.email };
    req.supabase = getUserClient(token);
    next();
  } catch (err) {
    next(err);
  }
}
