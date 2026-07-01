import { NextResponse } from "next/server";

export function getHelixApiBaseUrl(): string {
  const url =
    process.env.HELIX_API_BASE_URL ??
    process.env.BASE_URL ??
    process.env.base_url;

  if (!url?.trim()) {
    throw new Error(
      "Helix API base URL is not set. Add HELIX_API_BASE_URL to .env.local",
    );
  }

  return url.trim().replace(/\/$/, "");
}

export function getHelixAuthHeaders(
  contentType?: string,
): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (contentType) headers["Content-Type"] = contentType;

  const token =
    process.env.HELIX_API_TOKEN ?? process.env.HELIX_ADMIN_TOKEN;
  if (token?.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return headers;
}

export async function proxyHelixJson(
  upstreamPath: string,
  init: {
    method?: string;
    searchParams?: URLSearchParams;
    body?: string;
    contentType?: string;
    cache?: RequestInit["next"];
  } = {},
): Promise<NextResponse> {
  const baseUrl = getHelixApiBaseUrl();
  const url = new URL(`${baseUrl}${upstreamPath}`);

  if (init.searchParams) {
    for (const [key, value] of init.searchParams.entries()) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    method: init.method ?? "GET",
    headers: getHelixAuthHeaders(init.contentType),
    body: init.body,
    next: init.cache,
  });

  const text = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: "Invalid response from Helix API" },
      { status: 502 },
    );
  }

  return NextResponse.json(data, { status: response.status });
}
