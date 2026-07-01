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

export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  letter: string;
  updatedAt: string;
}

export interface GlossaryPagination {
  total: number;
  limit: number | null;
  offset: number;
  count: number;
  hasMore: boolean;
  letter?: string;
}

export interface GlossaryDocument {
  id: string;
  title: string;
  updatedAt: string;
  entries: GlossaryEntry[];
  pagination?: GlossaryPagination;
}
