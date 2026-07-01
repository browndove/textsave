import type { FaqEntry, SavedVersion } from "./types";
import { formatVersionMeta } from "./storage";
import { howToContentToPlainText, isStructuredHowToAnswer, parseHowToAnswer } from "./howto-content";

export function filterVersions(versions: SavedVersion[], query: string): SavedVersion[] {
  const q = query.trim().toLowerCase();
  if (!q) return versions;

  return versions.filter(
    (version) =>
      version.title.toLowerCase().includes(q) ||
      version.content.toLowerCase().includes(q) ||
      formatVersionMeta(version).toLowerCase().includes(q),
  );
}

function entrySearchText(entry: FaqEntry): string {
  const answerText = isStructuredHowToAnswer(entry.answer)
    ? howToContentToPlainText(parseHowToAnswer(entry.answer))
    : entry.answer;
  return `${entry.question}\n${answerText}`.toLowerCase();
}

export function filterFaqEntries(entries: FaqEntry[], query: string): FaqEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;

  return entries.filter((entry) => entrySearchText(entry).includes(q));
}
