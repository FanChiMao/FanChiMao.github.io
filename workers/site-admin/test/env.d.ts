declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    MEDIA: R2Bucket;
    TEST_MIGRATIONS: import('cloudflare:test').D1Migration[];
  }
}
