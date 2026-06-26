import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

async function migrate() {
  loadEnvLocal();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env.local");
    process.exit(1);
  }

  const schemaPath = path.join(process.cwd(), "lib/db/schema.sql");
  const sql = readFileSync(schemaPath, "utf-8");

  const pool = new Pool({ connectionString });
  try {
    await pool.query(sql);
    console.log("Database schema applied.");
  } finally {
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
