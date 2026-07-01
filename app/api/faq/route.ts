import { NextResponse } from "next/server";
import { getHelixApiBaseUrl, proxyHelixJson } from "@/lib/helix-api";
import { FAQ_DOCUMENT_ID, getPinnedDocument } from "@/lib/documents";
import type { PinnedDocumentId } from "@/lib/documents";

export const runtime = "nodejs";

const FORWARD_PARAMS = ["id", "limit", "offset"] as const;

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
    getHelixApiBaseUrl();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Helix API not configured" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const forward = new URLSearchParams();
  forward.set("id", id);
  for (const key of FORWARD_PARAMS) {
    if (key === "id") continue;
    const value = searchParams.get(key);
    if (value !== null) forward.set(key, value);
  }

  try {
    return await proxyHelixJson("/api/v1/faq", {
      searchParams: forward,
      cache: { revalidate: 60 },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to reach Helix FAQ API",
      },
      { status: 502 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    getHelixApiBaseUrl();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Helix API not configured" },
      { status: 500 },
    );
  }

  const body = await request.text();

  try {
    return await proxyHelixJson("/api/v1/faq", {
      method: "PUT",
      body,
      contentType: "application/json",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save document via Helix API",
      },
      { status: 502 },
    );
  }
}
