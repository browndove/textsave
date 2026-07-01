import { NextResponse } from "next/server";
import { getHelixApiBaseUrl, proxyHelixJson } from "@/lib/helix-api";

export const runtime = "nodejs";

const FORWARD_PARAMS = ["letter", "q", "limit", "offset"] as const;

export async function GET(request: Request) {
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
  for (const key of FORWARD_PARAMS) {
    const value = searchParams.get(key);
    if (value !== null) forward.set(key, value);
  }

  try {
    return await proxyHelixJson("/api/v1/glossary", {
      searchParams: forward,
      cache: { revalidate: 60 },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to reach Helix glossary API",
      },
      { status: 502 },
    );
  }
}
