import type { FaqDocument, FaqEntry } from "./types";

export function mergeFaqEntries(
  doc: FaqDocument,
  imported: FaqEntry[],
): FaqDocument {
  return {
    ...doc,
    entries: [...doc.entries, ...imported],
    updatedAt: new Date().toISOString(),
  };
}

export function replaceFaqEntries(
  doc: FaqDocument,
  imported: FaqEntry[],
): FaqDocument {
  return {
    ...doc,
    entries: imported,
    updatedAt: new Date().toISOString(),
  };
}
