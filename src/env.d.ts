/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Base URL of the stats Worker (workers/achievement-stats). Unset: stats and likes are off. */
  readonly PUBLIC_PASSPORT_STATS_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
