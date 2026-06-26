import type { FaqDocument, SavedVersion } from "./types";
import type { PinnedDocumentId } from "./documents";
import { FAQ_DOCUMENT_ID } from "./documents";

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return typeof data.error === "string" ? data.error : response.statusText;
  } catch {
    return response.statusText;
  }
}

export async function fetchVersions(): Promise<SavedVersion[]> {
  const response = await fetch("/api/versions");
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function saveVersionApi(
  content: string,
  title?: string,
): Promise<SavedVersion> {
  const response = await fetch("/api/versions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, title }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function deleteVersionApi(id: string): Promise<void> {
  const response = await fetch(`/api/versions?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error(await parseError(response));
}

export async function fetchFaq(id: PinnedDocumentId = FAQ_DOCUMENT_ID): Promise<FaqDocument> {
  const response = await fetch(`/api/faq?id=${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}

export async function saveFaqApi(doc: FaqDocument): Promise<FaqDocument> {
  const response = await fetch("/api/faq", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.json();
}
