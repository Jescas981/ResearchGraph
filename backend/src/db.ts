import { Pool } from 'pg';

const rawUrl = process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error(
    'DATABASE_URL no está definida. En Supabase: Settings → Database → Connection string (URI). ' +
      'Para Cloud Run suele usarse el pooler en modo Transaction (puerto 6543).'
  );
}

/** Pooler Transaction (6543): Supabase recomienda `pgbouncer=true` para clientes como node-pg. */
function normalizeDatabaseUrl(url: string): string {
  const isSupabasePooler = url.includes('pooler.supabase.com');
  if (!isSupabasePooler || /pgbouncer\s*=\s*true/i.test(url)) return url;
  return url + (url.includes('?') ? '&' : '?') + 'pgbouncer=true';
}

const connectionString = normalizeDatabaseUrl(rawUrl);

const useSsl =
  !/localhost|127\.0\.0\.1/i.test(connectionString) && !connectionString.includes('sslmode=disable');

export const pool = new Pool({
  connectionString,
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: 30_000,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected PG pool error', err);
});
