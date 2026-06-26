import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import faqSeed from "../data/helix-faq-seed.json";
import type { FaqDocument } from "../lib/types";

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

async function reseedFaq() {
  loadEnvLocal();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env.local");
    process.exit(1);
  }

  const seed = faqSeed as FaqDocument;
  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO faq_documents (id, title, updated_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE
       SET title = EXCLUDED.title, updated_at = EXCLUDED.updated_at`,
      [seed.id, seed.title, seed.updatedAt],
    );

    await client.query(`DELETE FROM faq_entries WHERE document_id = $1`, [seed.id]);

    for (let i = 0; i < seed.entries.length; i++) {
      const entry = seed.entries[i];
      await client.query(
        `INSERT INTO faq_entries (id, document_id, question, answer, sort_order, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          entry.id,
          seed.id,
          entry.question,
          entry.answer,
          i,
          entry.updatedAt,
        ],
      );
    }

    await client.query("COMMIT");
    console.log(`Reseeded ${seed.entries.length} questions into ${seed.id}.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

reseedFaq().catch((error) => {
  console.error(error);
  process.exit(1);
});
