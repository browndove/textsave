import type { FaqDocument, FaqDocumentResponse, SavedVersion } from "./types";
import type { PinnedDocumentId } from "./documents";
import { FAQ_DOCUMENT_ID } from "./documents";
import { normalizeFaqDocument } from "./faq-storage";
import {
  deleteDraftVersion,
  listDraftVersions,
  saveDraftVersion,
} from "./draft-storage";

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data.error === "string") return data.error;
    if (typeof data.message === "string") return data.message;
    return response.statusText;
  } catch {
    return response.statusText;
  }
}

export async function fetchVersions(): Promise<SavedVersion[]> {
  return listDraftVersions();
}

export async function saveVersionApi(
  content: string,
  title?: string,
): Promise<SavedVersion> {
  return saveDraftVersion(content, title);
}

export async function deleteVersionApi(id: string): Promise<void> {
  deleteDraftVersion(id);
}

export async function fetchFaq(id: PinnedDocumentId = FAQ_DOCUMENT_ID): Promise<FaqDocument> {
  const response = await fetch(`/api/faq?id=${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error(await parseError(response));
  return normalizeFaqDocument(await response.json());
}

export interface FetchFaqPageOptions {
  limit: number;
  offset?: number;
}

export async function fetchFaqPage(
  id: PinnedDocumentId,
  { limit, offset = 0 }: FetchFaqPageOptions,
): Promise<FaqDocumentResponse> {
  const params = new URLSearchParams({
    id,
    limit: String(limit),
    offset: String(offset),
  });
  const response = await fetch(`/api/faq?${params}`);
  if (!response.ok) throw new Error(await parseError(response));
  return normalizeFaqDocument(await response.json());
}

export async function saveFaqApi(doc: FaqDocument): Promise<FaqDocument> {
  const response = await fetch("/api/faq", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return normalizeFaqDocument(await response.json());
}
