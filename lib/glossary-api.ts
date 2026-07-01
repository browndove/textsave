import type { GlossaryDocument } from "./types";

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return typeof data.error === "string" ? data.error : response.statusText;
  } catch {
    return response.statusText;
  }
}

export interface FetchGlossaryOptions {
  letter?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export async function fetchGlossary(
  options: FetchGlossaryOptions = {},
): Promise<GlossaryDocument> {
  const params = new URLSearchParams();
  if (options.letter) params.set("letter", options.letter);
  if (options.q) params.set("q", options.q);
  if (options.limit !== undefined) params.set("limit", String(options.limit));
  if (options.offset !== undefined) params.set("offset", String(options.offset));

  const query = params.toString();
  const response = await fetch(query ? `/api/glossary?${query}` : "/api/glossary");
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}
