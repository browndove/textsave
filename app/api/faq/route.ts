import { NextResponse } from "next/server";
import { getFaqDocument, saveFaqDocument } from "@/lib/db/repository";
import type { FaqQueryOptions } from "@/lib/db/repository";
import { FAQ_DOCUMENT_ID, getPinnedDocument } from "@/lib/documents";
import type { FaqDocument } from "@/lib/types";
import type { PinnedDocumentId } from "@/lib/documents";

export const runtime = "nodejs";

const MAX_LIMIT = 100;

function resolveDocumentId(request: Request): PinnedDocumentId | null {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") ?? FAQ_DOCUMENT_ID;
  return getPinnedDocument(id)?.id ?? null;
}

function parsePagination(
  searchParams: URLSearchParams,
): { options: FaqQueryOptions } | { error: string } {
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

  if (limitParam === null && offsetParam === null) {
    return { options: {} };
  }

  let limit: number | undefined;
  if (limitParam !== null) {
    if (!/^\d+$/.test(limitParam)) {
      return { error: "limit must be a non-negative integer" };
    }
    const parsed = Number(limitParam);
    if (parsed < 1) {
      return { error: "limit must be at least 1" };
    }
    limit = Math.min(parsed, MAX_LIMIT);
  }

  let offset = 0;
  if (offsetParam !== null) {
    if (!/^\d+$/.test(offsetParam)) {
      return { error: "offset must be a non-negative integer" };
    }
    offset = Number(offsetParam);
  }

  return { options: { limit, offset } };
}

export async function GET(request: Request) {
  const id = resolveDocumentId(request);
  if (!id) {
    return NextResponse.json({ error: "Unknown document id" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const pagination = parsePagination(searchParams);
  if ("error" in pagination) {
    return NextResponse.json({ error: pagination.error }, { status: 400 });
  }

  try {
    const faq = await getFaqDocument(id, pagination.options);
    return NextResponse.json(faq);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load document" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const doc = (await request.json()) as FaqDocument;
    if (!doc?.id || !getPinnedDocument(doc.id) || !Array.isArray(doc.entries)) {
      return NextResponse.json({ error: "Invalid document" }, { status: 400 });
    }

    const saved = await saveFaqDocument({
      ...doc,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save document" },
      { status: 500 },
    );
  }
}
