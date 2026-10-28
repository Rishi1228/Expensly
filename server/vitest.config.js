import { defineConfig } from 'vitest/config';

// Local runs pick up server/.env (needed by the DB tests); CI has none and runs unit tests only.
try {
  process.loadEnvFile('.env');
} catch {
  // no .env file
}

export default defineConfig({
  test: {
    environment: 'node',
    // DB tests create real users and run one file at a time against Supabase.
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});
