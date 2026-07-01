"use client";

import { useCallback, useEffect, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import DraftEditor from "@/components/DraftEditor";
import FaqEditor from "@/components/FaqEditor";
import GlossaryViewer from "@/components/GlossaryViewer";
import TextSearchBar from "@/components/TextSearchBar";
import AppSidebar from "@/components/AppSidebar";
import AppShellSkeleton from "@/components/ui/AppShellSkeleton";
import type { FaqDocument, SavedVersion } from "@/lib/types";
import type { EditorDocument } from "@/lib/documents";
import {
  FAQ_DOCUMENT_ID,
  GLOSSARY_DOCUMENT_ID,
  HOWTO_DOCUMENT_ID,
  PINNED_DOCUMENTS,
  isPinnedFaqDocument,
  type PinnedDocumentId,
} from "@/lib/documents";
import {
  deleteVersionApi,
  fetchFaq,
  fetchVersions,
  saveFaqApi,
  saveVersionApi,
} from "@/lib/api";
import { filterVersions } from "@/lib/search";

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function searchPlaceholder(activeDocument: EditorDocument): string {
  if (activeDocument === GLOSSARY_DOCUMENT_ID) return "Search medical terms…";
  if (activeDocument === FAQ_DOCUMENT_ID) return "Search questions…";
  if (activeDocument === HOWTO_DOCUMENT_ID) return "Search topics…";
  return "Search drafts…";
}

function breadcrumbLabel(activeDocument: EditorDocument): string {
  if (activeDocument === "draft") return "Draft";
  if (activeDocument === GLOSSARY_DOCUMENT_ID) return "Glossary";
  const doc = PINNED_DOCUMENTS.find((d) => d.id === activeDocument);
  if (doc?.id === FAQ_DOCUMENT_ID) return "FAQ";
  if (doc?.id === HOWTO_DOCUMENT_ID) return "How-To";
  return "Files";
}

export default function App() {
  const [versions, setVersions] = useState<SavedVersion[]>([]);
  const [draft, setDraft] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [faqSavedFlash, setFaqSavedFlash] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [faqDocs, setFaqDocs] = useState<Partial<Record<PinnedDocumentId, FaqDocument>>>({});
  const [activeDocument, setActiveDocument] = useState<EditorDocument>("draft");

  useEffect(() => {
    Promise.all([
      fetchVersions(),
      ...PINNED_DOCUMENTS.map((doc) => fetchFaq(doc.id)),
    ])
      .then(([loadedVersions, ...loadedDocs]) => {
        setVersions(loadedVersions);
        const next: Partial<Record<PinnedDocumentId, FaqDocument>> = {};
        PINNED_DOCUMENTS.forEach((doc, index) => {
          next[doc.id] = loadedDocs[index];
        });
        setFaqDocs(next);
        setHydrated(true);
      })
      .catch((error) => {
        setLoadError(
          error instanceof Error ? error.message : "Failed to load data",
        );
        setHydrated(true);
      });
  }, []);

  const persistFaq = useCallback(async (next: FaqDocument) => {
    const saved = await saveFaqApi(next);
    setFaqDocs((prev) => ({ ...prev, [saved.id]: saved }));
    setFaqSavedFlash(true);
    setTimeout(() => setFaqSavedFlash(false), 1500);
  }, []);

  const handleSaveVersion = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;

    try {
      const version = await saveVersionApi(trimmed, draftTitle);
      setVersions((prev) => [version, ...prev]);
      setActiveVersionId(version.id);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to save version",
      );
    }
  };

  const handleNewDraft = () => {
    setDraft("");
    setDraftTitle("");
    setActiveVersionId(null);
    setActiveDocument("draft");
  };

  const handleOpenDocument = (id: EditorDocument) => {
    setActiveDocument(id);
    setActiveVersionId(null);
  };

  const handleLoadVersion = (version: SavedVersion) => {
    setDraft(version.content);
    setDraftTitle(version.title);
    setActiveVersionId(version.id);
    setActiveDocument("draft");
  };

  const handleDeleteVersion = async (id: string) => {
    try {
      await deleteVersionApi(id);
      setVersions((prev) => prev.filter((v) => v.id !== id));
      if (activeVersionId === id) {
        setActiveVersionId(null);
        setDraft("");
        setDraftTitle("");
      }
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to delete version",
      );
    }
  };

  if (!hydrated) return <AppShellSkeleton />;

  if (loadError && PINNED_DOCUMENTS.some((doc) => !faqDocs[doc.id])) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-error">{loadError}</p>
        <p className="max-w-md text-sm text-on-surface-variant">
          Set{" "}
          <code className="text-xs">HELIX_API_BASE_URL</code> in{" "}
          <code className="text-xs">.env.local</code> (e.g.{" "}
          <code className="text-xs">https://api-prod.helixhealth.app</code>) and
          restart the dev server.
        </p>
      </div>
    );
  }

  if (PINNED_DOCUMENTS.some((doc) => !faqDocs[doc.id])) return <AppShellSkeleton />;

  const activeFaq =
    isPinnedFaqDocument(activeDocument) ? faqDocs[activeDocument] ?? null : null;
  const showGlossary = activeDocument === GLOSSARY_DOCUMENT_ID;

  const words = countWords(draft);
  const chars = draft.length;
  const filteredVersions = filterVersions(versions, searchQuery);
  const showSaveButton = activeDocument === "draft";
  const showFaqSaved = isPinnedFaqDocument(activeDocument) && faqSavedFlash;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <nav className="z-10 flex h-toolbar-height shrink-0 items-center justify-between gap-4 border-b border-outline-variant bg-surface-container-lowest px-margin-page">
        <div className="flex min-w-0 items-center gap-5">
          <BrandLogo width={22} />
          <span className="hidden text-body-md text-on-surface-variant sm:inline">
            Editor
          </span>
        </div>

        <div className="hidden min-w-0 flex-1 justify-center md:flex">
          <p className="truncate text-body-sm text-on-surface-variant">
            <span className="text-muted">Files</span>
            <span className="mx-2 text-outline-variant">/</span>
            <span className="font-medium text-on-surface">
              {breadcrumbLabel(activeDocument)}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <TextSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={searchPlaceholder(activeDocument)}
          />

          <a
            href="https://documentation.helixhealth.app"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost !h-8 !w-8 !p-0"
            aria-label="Help"
            title="Help"
          >
            <span className="material-symbols-outlined text-[18px]">help</span>
          </a>

          {showSaveButton && (
            <button
              type="button"
              onClick={() => void handleSaveVersion()}
              className={`btn-primary !h-8 ${
                savedFlash ? "bg-surface-tint" : ""
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {savedFlash ? "check" : "save"}
              </span>
              {savedFlash ? "Saved" : "Save Version"}
            </button>
          )}

          {showFaqSaved && (
            <span className="flex h-8 items-center gap-1.5 rounded-lg bg-primary-fixed px-3 text-body-sm font-medium text-primary">
              <span className="material-symbols-outlined text-[16px]">check</span>
              Saved
            </span>
          )}
        </div>
      </nav>

      {loadError && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-error/20 bg-error-container/40 px-4 py-2">
          <p className="text-center text-xs text-error">{loadError}</p>
          <button
            type="button"
            onClick={() => setLoadError(null)}
            className="shrink-0 text-error hover:opacity-70"
            aria-label="Dismiss error"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      <div className="relative flex flex-1 overflow-hidden">
        <AppSidebar
          activeDocument={activeDocument}
          activeVersionId={activeVersionId}
          faqDocs={faqDocs}
          versions={versions}
          filteredVersions={filteredVersions}
          onNewDraft={handleNewDraft}
          onOpenDocument={handleOpenDocument}
          onLoadVersion={handleLoadVersion}
          onDeleteVersion={handleDeleteVersion}
        />

        <main className="flex min-w-0 flex-1 flex-col bg-surface-container-lowest">
          {showGlossary ? (
            <GlossaryViewer searchQuery={searchQuery} />
          ) : activeFaq ? (
            <FaqEditor
              faq={activeFaq}
              onChange={(next) => {
                setFaqDocs((prev) => ({ ...prev, [next.id]: next }));
                void persistFaq(next).catch((error) => {
                  void fetchFaq(next.id)
                    .then((fresh) => {
                      setFaqDocs((prev) => ({ ...prev, [next.id]: fresh }));
                    })
                    .catch(() => {});
                  setLoadError(
                    error instanceof Error ? error.message : "Failed to save document",
                  );
                });
              }}
              searchQuery={searchQuery}
              pdfUrl={PINNED_DOCUMENTS.find((doc) => doc.id === activeFaq.id)?.pdfUrl}
            />
          ) : (
            <DraftEditor
              title={draftTitle}
              content={draft}
              onTitleChange={setDraftTitle}
              onContentChange={setDraft}
              wordCount={words}
              charCount={chars}
            />
          )}
        </main>
      </div>
    </div>
  );
}
