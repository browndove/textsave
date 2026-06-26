import type { FaqDocument, FaqEntry } from "./types";
import { getPinnedDocument } from "./documents";

function touch(doc: FaqDocument): FaqDocument {
  return { ...doc, updatedAt: new Date().toISOString() };
}

export function addEntry(
  doc: FaqDocument,
  question = "",
  answer = "",
): FaqDocument {
  const entry: FaqEntry = {
    id: crypto.randomUUID(),
    question,
    answer,
    updatedAt: new Date().toISOString(),
  };
  return touch({ ...doc, entries: [...doc.entries, entry] });
}

export function updateQuestion(
  doc: FaqDocument,
  id: string,
  question: string,
): FaqDocument {
  return touch({
    ...doc,
    entries: doc.entries.map((e) =>
      e.id === id
        ? { ...e, question, updatedAt: new Date().toISOString() }
        : e,
    ),
  });
}

export function updateAnswer(
  doc: FaqDocument,
  id: string,
  answer: string,
): FaqDocument {
  return touch({
    ...doc,
    entries: doc.entries.map((e) =>
      e.id === id ? { ...e, answer, updatedAt: new Date().toISOString() } : e,
    ),
  });
}

export function clearAnswer(doc: FaqDocument, id: string): FaqDocument {
  return updateAnswer(doc, id, "");
}

export function removeEntry(doc: FaqDocument, id: string): FaqDocument {
  return touch({
    ...doc,
    entries: doc.entries.filter((e) => e.id !== id),
  });
}

export function formatFaqMeta(doc: FaqDocument): string {
  const meta = getPinnedDocument(doc.id);
  const count = doc.entries.length;
  const label =
    count === 1
      ? `1 ${meta?.entryLabel.singular ?? "item"}`
      : `${count} ${meta?.entryLabel.plural ?? "items"}`;
  const date = new Date(doc.updatedAt);
  const updated = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return `${label} · Updated ${updated}`;
}
