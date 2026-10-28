// Vercel serverless entry: every /api/* request is routed here (see vercel.json).
// Locally the same app runs as a normal server via server/src/index.js.
import { createApp } from '../server/src/app.js';

export default createApp();
