export const FAQ_DOCUMENT_ID = "helix-faq" as const;
export const HOWTO_DOCUMENT_ID = "helix-howto" as const;
export const GLOSSARY_DOCUMENT_ID = "helix-glossary" as const;

export type PinnedDocumentId = typeof FAQ_DOCUMENT_ID | typeof HOWTO_DOCUMENT_ID;

export interface GlossaryDocumentMeta {
  id: typeof GLOSSARY_DOCUMENT_ID;
  title: string;
  icon: string;
  termCount: number;
}

export const GLOSSARY_DOCUMENT: GlossaryDocumentMeta = {
  id: GLOSSARY_DOCUMENT_ID,
  title: "HELIX Medical Terms Glossary",
  icon: "medical_information",
  termCount: 1926,
};

export interface PinnedDocumentMeta {
  id: PinnedDocumentId;
  title: string;
  pdfUrl: string;
  icon: string;
  entryLabel: { singular: string; plural: string };
  parseFormat: "faq" | "howto";
  seedFile: string;
}

export const PINNED_DOCUMENTS: PinnedDocumentMeta[] = [
  {
    id: FAQ_DOCUMENT_ID,
    title: "Helix App Frequently Asked Questions",
    pdfUrl: "/Helix App Frequently Asked Questions.pdf",
    icon: "quiz",
    entryLabel: { singular: "question", plural: "questions" },
    parseFormat: "faq",
    seedFile: "helix-faq-seed.json",
  },
  {
    id: HOWTO_DOCUMENT_ID,
    title: "HELIX How-To Guide",
    pdfUrl: "/HELIX app How-to Guide-1.pdf",
    icon: "menu_book",
    entryLabel: { singular: "topic", plural: "topics" },
    parseFormat: "howto",
    seedFile: "helix-howto-seed.json",
  },
];

export function getPinnedDocument(id: string): PinnedDocumentMeta | undefined {
  return PINNED_DOCUMENTS.find((doc) => doc.id === id);
}

export type EditorDocument = "draft" | PinnedDocumentId | typeof GLOSSARY_DOCUMENT_ID;

export function isPinnedFaqDocument(
  id: EditorDocument,
): id is PinnedDocumentId {
  return id === FAQ_DOCUMENT_ID || id === HOWTO_DOCUMENT_ID;
}
