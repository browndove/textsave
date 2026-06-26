import type { FaqDocument, FaqEntry, SavedVersion } from "@/lib/types";
import faqSeed from "@/data/helix-faq-seed.json";
import howtoSeed from "@/data/helix-howto-seed.json";
import {
  FAQ_DOCUMENT_ID,
  HOWTO_DOCUMENT_ID,
  getPinnedDocument,
  type PinnedDocumentId,
} from "@/lib/documents";
import { getPool } from "./index";

const SEEDS: Record<PinnedDocumentId, FaqDocument> = {
  [FAQ_DOCUMENT_ID]: faqSeed as FaqDocument,
  [HOWTO_DOCUMENT_ID]: howtoSeed as FaqDocument,
};

function rowToVersion(row: {
  id: string;
  title: string;
  content: string;
  author: string;
  created_at: Date;
}): SavedVersion {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    author: row.author,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listVersions(): Promise<SavedVersion[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT id, title, content, author, created_at
     FROM versions
     ORDER BY created_at DESC`,
  );
  return rows.map(rowToVersion);
}

export async function createVersionRecord(
  version: SavedVersion,
): Promise<SavedVersion> {
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO versions (id, title, content, author, created_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, title, content, author, created_at`,
    [
      version.id,
      version.title,
      version.content,
      version.author,
      version.createdAt,
    ],
  );
  return rowToVersion(rows[0]);
}

export async function deleteVersionRecord(id: string): Promise<boolean> {
  const pool = getPool();
  const { rowCount } = await pool.query(`DELETE FROM versions WHERE id = $1`, [
    id,
  ]);
  return (rowCount ?? 0) > 0;
}

function rowToEntry(row: {
  id: string;
  question: string;
  answer: string;
  updated_at: Date;
}): FaqEntry {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    updatedAt: row.updated_at.toISOString(),
  };
}

async function seedFaqDocument(id: PinnedDocumentId): Promise<FaqDocument> {
  const seed = SEEDS[id];
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO faq_documents (id, title, updated_at)
       VALUES ($1, $2, $3)`,
      [seed.id, seed.title, seed.updatedAt],
    );

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
    return seed;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getFaqDocument(id: PinnedDocumentId): Promise<FaqDocument> {
  const pool = getPool();
  const docResult = await pool.query(
    `SELECT id, title, updated_at FROM faq_documents WHERE id = $1`,
    [id],
  );

  if (docResult.rows.length === 0) {
    return seedFaqDocument(id);
  }

  const doc = docResult.rows[0];
  const entriesResult = await pool.query(
    `SELECT id, question, answer, updated_at
     FROM faq_entries
     WHERE document_id = $1
     ORDER BY sort_order ASC`,
    [id],
  );

  return {
    id,
    title: doc.title,
    updatedAt: doc.updated_at.toISOString(),
    entries: entriesResult.rows.map(rowToEntry),
  };
}

export async function saveFaqDocument(doc: FaqDocument): Promise<FaqDocument> {
  if (!getPinnedDocument(doc.id)) {
    throw new Error(`Unknown document id: ${doc.id}`);
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO faq_documents (id, title, updated_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE
       SET title = EXCLUDED.title, updated_at = EXCLUDED.updated_at`,
      [doc.id, doc.title, doc.updatedAt],
    );

    await client.query(`DELETE FROM faq_entries WHERE document_id = $1`, [
      doc.id,
    ]);

    for (let i = 0; i < doc.entries.length; i++) {
      const entry = doc.entries[i];
      await client.query(
        `INSERT INTO faq_entries (id, document_id, question, answer, sort_order, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          entry.id,
          doc.id,
          entry.question,
          entry.answer,
          i,
          entry.updatedAt,
        ],
      );
    }

    await client.query("COMMIT");
    return doc;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
