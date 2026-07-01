import type { FaqDocument, FaqEntry } from "./types";
import { getPinnedDocument } from "./documents";
import { coerceHowToAnswerString } from "./howto-content";

function touch(doc: FaqDocument): FaqDocument {
  return { ...doc, updatedAt: new Date().toISOString() };
}

export function normalizeFaqEntry(entry: FaqEntry): FaqEntry {
  const answer = coerceHowToAnswerString(
    (entry as FaqEntry & { answer?: unknown }).answer,
  );
  if (answer === entry.answer) return entry;
  return { ...entry, answer };
}

export function normalizeFaqDocument(doc: FaqDocument): FaqDocument {
  return {
    ...doc,
    entries: doc.entries.map(normalizeFaqEntry),
  };
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

export function moveEntry(
  doc: FaqDocument,
  fromId: string,
  toId: string,
): FaqDocument {
  if (fromId === toId) return doc;
  const fromIndex = doc.entries.findIndex((entry) => entry.id === fromId);
  const toIndex = doc.entries.findIndex((entry) => entry.id === toId);
  if (fromIndex === -1 || toIndex === -1) return doc;

  const nextEntries = [...doc.entries];
  const [moved] = nextEntries.splice(fromIndex, 1);
  nextEntries.splice(toIndex, 0, moved);
  return touch({ ...doc, entries: nextEntries });
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
