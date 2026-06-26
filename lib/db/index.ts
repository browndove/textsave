import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local");
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 15_000,
      max: 10,
    });
  }

  return pool;
}
