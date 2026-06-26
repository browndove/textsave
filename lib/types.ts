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

export interface FaqPagination {
  total: number;
  limit: number | null;
  offset: number;
  count: number;
  hasMore: boolean;
}

export interface FaqDocumentResponse extends FaqDocument {
  pagination?: FaqPagination;
}
