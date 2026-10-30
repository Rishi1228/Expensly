import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { fromSupabaseError } from '../../src/lib/errors.js';

process.env.NODE_ENV = 'test';
const app = createApp();

describe('app (no database needed)', () => {
  it('reports health', async () => {
    const r = await request(app).get('/api/health');
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('ok');
  });

  it.each([
    '/api/expenses',
    '/api/recurring',
    '/api/stats/summary',
    '/api/categories',
    '/api/family',
    '/api/family/stats/summary',
  ])('%s needs a token', async (path) => {
    const r = await request(app).get(path);
    expect(r.status).toBe(401);
    expect(r.body.error).toBe('Missing access token');
  });

  it('rejects a non-Bearer authorization header', async () => {
    const r = await request(app).get('/api/expenses').set('Authorization', 'Basic abc');
    expect(r.status).toBe(401);
  });

  it('returns a JSON 400 for a malformed body', async () => {
    const r = await request(app)
      .post('/api/expenses')
      .set('Content-Type', 'application/json')
      .send('{"amount": ');
    expect(r.status).toBe(400);
    expect(r.body.error).toBe('Invalid JSON body');
  });

  it('returns 404 for unknown non-API routes', async () => {
    expect((await request(app).get('/nope')).status).toBe(404);
  });

  it('sets security headers', async () => {
    const r = await request(app).get('/api/health');
    expect(r.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('fromSupabaseError', () => {
  it.each([
    ['PGRST116', 404],
    ['23505', 409],
    ['23503', 400],
    ['23514', 400],
    ['22023', 400],
    ['42501', 403],
    ['XX000', 500],
  ])('%s -> %i', (code, status) => {
    expect(fromSupabaseError({ code, message: 'm' }).status).toBe(status);
  });

  it.each([
    ['PF400', 400],
    ['PF403', 403],
    ['PF404', 404],
    ['PF409', 409],
  ])('family rule %s -> %i with its own message', (code, status) => {
    const err = fromSupabaseError({ code, message: 'Only the head can do this' });
    expect([err.status, err.message]).toEqual([status, 'Only the head can do this']);
  });
});
