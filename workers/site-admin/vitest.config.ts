import path from 'node:path';
import { defineConfig } from 'vitest/config';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';

// Local workerd with a throwaway D1 (schema from the stats Worker): never touches production.
export default defineConfig(async () => {
  const migrations = await readD1Migrations(path.join(import.meta.dirname, '../achievement-stats/migrations'));
  return {
    plugins: [cloudflareTest({ wrangler: { configPath: './wrangler.jsonc' }, miniflare: { bindings: { TEST_MIGRATIONS: migrations } } })],
    test: { setupFiles: ['./test/apply-migrations.ts'] },
  };
});
