import { NextResponse } from "next/server";
import { getFaqDocument, saveFaqDocument } from "@/lib/db/repository";
import { FAQ_DOCUMENT_ID, getPinnedDocument } from "@/lib/documents";
import type { FaqDocument } from "@/lib/types";
import type { PinnedDocumentId } from "@/lib/documents";

export const runtime = "nodejs";

function resolveDocumentId(request: Request): PinnedDocumentId | null {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") ?? FAQ_DOCUMENT_ID;
  return getPinnedDocument(id)?.id ?? null;
}

export async function GET(request: Request) {
  const id = resolveDocumentId(request);
  if (!id) {
    return NextResponse.json({ error: "Unknown document id" }, { status: 404 });
  }

  try {
    const faq = await getFaqDocument(id);
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
