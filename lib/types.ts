import type { PinnedDocumentId } from "./documents";

export interface SavedVersion {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: string;
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  updatedAt: string;
}

export interface FaqDocument {
  id: PinnedDocumentId;
  title: string;
  entries: FaqEntry[];
  updatedAt: string;
}
