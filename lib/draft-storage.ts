import type { SavedVersion } from "./types";
import { createVersion } from "./storage";

const STORAGE_KEY = "helix-editor-drafts";

function readAll(): SavedVersion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedVersion[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(versions: SavedVersion[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
}

export function listDraftVersions(): SavedVersion[] {
  return readAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function saveDraftVersion(
  content: string,
  title?: string,
): SavedVersion {
  const version = createVersion(content, title);
  writeAll([version, ...readAll()]);
  return version;
}

export function deleteDraftVersion(id: string): void {
  writeAll(readAll().filter((version) => version.id !== id));
}
