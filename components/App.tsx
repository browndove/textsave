"use client";

import { useCallback, useEffect, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import FaqEditor from "@/components/FaqEditor";
import TextSearchBar from "@/components/TextSearchBar";
import type { FaqDocument, SavedVersion } from "@/lib/types";
import type { EditorDocument } from "@/lib/documents";
import {
  PINNED_DOCUMENTS,
  type PinnedDocumentId,
} from "@/lib/documents";
import {
  deleteVersionApi,
  fetchFaq,
  fetchVersions,
  saveFaqApi,
  saveVersionApi,
} from "@/lib/api";
import { formatDisplayTitle, formatVersionMeta } from "@/lib/storage";
import { filterVersions } from "@/lib/search";
import { formatFaqMeta } from "@/lib/faq-storage";

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

export default function App() {
  const [versions, setVersions] = useState<SavedVersion[]>([]);
  const [draft, setDraft] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
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

  const handleOpenDocument = (id: PinnedDocumentId) => {
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

  if (!hydrated) return null;

  if (loadError && PINNED_DOCUMENTS.some((doc) => !faqDocs[doc.id])) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-error">{loadError}</p>
        <p className="max-w-md text-sm text-on-surface-variant">
          {loadError.includes("ENOTFOUND") ? (
            <>
              Cannot reach the database host. Check your internet connection, confirm
              the Neon project is active, and ensure{" "}
              <code className="text-xs">DATABASE_URL</code> in{" "}
              <code className="text-xs">.env.local</code> is wrapped in quotes.
            </>
          ) : (
            <>
              Set <code className="text-xs">DATABASE_URL</code> in{" "}
              <code className="text-xs">.env.local</code> and run{" "}
              <code className="text-xs">npm run db:migrate</code>.
            </>
          )}
        </p>
      </div>
    );
  }

  if (PINNED_DOCUMENTS.some((doc) => !faqDocs[doc.id])) return null;

  const activeFaq =
    activeDocument !== "draft" ? faqDocs[activeDocument] ?? null : null;

  const words = countWords(draft);
  const chars = draft.length;
  const filteredVersions = filterVersions(versions, searchQuery);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <nav className="z-10 flex h-toolbar-height shrink-0 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-margin-page text-[14px] leading-5 text-primary">
        <div className="flex items-center gap-6">
          <BrandLogo width={22} />
          <span className="text-[14px] leading-5 font-normal text-primary">Editor</span>
        </div>

        <div className="flex items-center gap-2.5">
          <TextSearchBar value={searchQuery} onChange={setSearchQuery} />

          <div className="flex gap-0.5">
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container"
              aria-label="Settings"
            >
              <span className="material-symbols-outlined text-[16px]">settings</span>
            </button>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container"
              aria-label="Help"
            >
              <span className="material-symbols-outlined text-[16px]">help</span>
            </button>
          </div>

          {activeDocument === "draft" && (
            <button
              type="button"
              onClick={() => void handleSaveVersion()}
              className={`flex h-7 items-center gap-1.5 rounded-[5px] px-2.5 text-[12px] leading-4 font-medium transition-opacity hover:opacity-90 ${
                savedFlash
                  ? "bg-surface-tint text-on-primary-container"
                  : "bg-primary-container text-on-primary-container"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {savedFlash ? "check" : "save"}
              </span>
              {savedFlash ? "Saved" : "Save Version"}
            </button>
          )}
        </div>
      </nav>

      {loadError && (
        <div className="shrink-0 border-b border-error/20 bg-error/10 px-4 py-2 text-center text-xs text-error">
          {loadError}
        </div>
      )}

      <div className="relative flex flex-1 overflow-hidden">
        <aside className="flex h-full w-sidebar-width shrink-0 flex-col border-r border-outline-variant bg-surface-container-low text-[12px] leading-4 font-medium text-primary">
          <div className="shrink-0 border-b border-outline-variant px-4 py-4">
            <h2 className="text-[13px] leading-5 font-semibold text-on-surface">Documents</h2>
            <p className="mt-1 text-[11px] leading-4 font-normal text-on-surface-variant">
              Drafts &amp; files
            </p>
          </div>
          <div className="px-3 pt-4 pb-2">
            <button
              type="button"
              onClick={handleNewDraft}
              className="flex h-8 w-full items-center gap-2 rounded-[6px] px-3 text-left text-[12px] leading-4 font-medium text-primary transition-colors hover:bg-surface-container-high/80"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              New Draft
            </button>
          </div>
          <div className="px-3 pb-2 pt-1">
            <h3 className="px-1 text-[10px] leading-4 font-semibold tracking-[0.08em] text-on-surface-variant uppercase">
              Files
            </h3>
          </div>
          <div className="space-y-1 px-3 pb-2">
            {PINNED_DOCUMENTS.map((doc) => {
              const file = faqDocs[doc.id];
              if (!file) return null;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => handleOpenDocument(doc.id)}
                  className={`flex w-full items-start gap-3 rounded-md border p-2 text-left transition-colors ${
                    activeDocument === doc.id
                      ? "border-slate-200 bg-slate-200/50"
                      : "border-transparent hover:bg-surface-container-high/80"
                  }`}
                >
                  <span className="material-symbols-outlined mt-0.5 text-[18px] text-slate-500">
                    {doc.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800" title={file.title}>
                      {file.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {formatFaqMeta(file)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="px-3 pb-2 pt-1">
            <h3 className="px-1 text-[10px] leading-4 font-semibold tracking-[0.08em] text-on-surface-variant uppercase">
              Saved Drafts
            </h3>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
            {versions.length === 0 ? (
              <p className="px-1 py-8 text-center text-[11px] leading-4 font-normal text-on-surface-variant italic">
                No saved versions yet.
              </p>
            ) : filteredVersions.length === 0 ? (
              <p className="px-1 py-8 text-center text-[11px] leading-4 font-normal text-on-surface-variant italic">
                No texts match your search.
              </p>
            ) : (
              filteredVersions.map((version) => (
                <div
                  key={version.id}
                  className={`group flex w-full cursor-pointer items-center justify-between rounded-[6px] px-3 py-2 text-on-surface transition-colors hover:bg-surface-container-high/80 ${
                    activeDocument === "draft" && activeVersionId === version.id
                      ? "bg-surface-container-high/90"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleLoadVersion(version)}
                    className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-left"
                  >
                    <span className="material-symbols-outlined text-[15px] text-outline">
                      description
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span
                        className="truncate text-[12px] leading-4 font-medium"
                        title={version.title}
                      >
                        {formatDisplayTitle(version.title)}
                      </span>
                      <span className="truncate text-[10px] leading-3 font-normal text-outline">
                        {formatVersionMeta(version)}
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteVersion(version.id)}
                    className="p-1 text-outline opacity-0 transition-opacity group-hover:opacity-100 hover:text-error"
                    aria-label={`Delete ${version.title}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              ))
            )}
          </nav>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-white">
          {activeFaq ? (
            <FaqEditor
              faq={activeFaq}
              onChange={(next) => {
                void persistFaq(next).catch((error) => {
                  setLoadError(
                    error instanceof Error ? error.message : "Failed to save document",
                  );
                });
              }}
              searchQuery={searchQuery}
              pdfUrl={PINNED_DOCUMENTS.find((doc) => doc.id === activeFaq.id)?.pdfUrl}
            />
          ) : (
            <>
              <div className="flex h-10 shrink-0 items-center gap-3 border-b border-outline-variant bg-surface-bright px-6">
                <label
                  htmlFor="draft-title"
                  className="shrink-0 text-[11px] leading-4 font-semibold tracking-[0.07em] text-on-surface-variant uppercase"
                >
                  Title
                </label>
                <input
                  id="draft-title"
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Optional — uses first line if empty"
                  className="min-w-0 flex-1 border-none bg-transparent text-[13px] leading-5 text-on-surface placeholder:text-outline focus:border-none focus:outline-none focus:ring-0"
                />
                <div className="flex shrink-0 gap-4 font-mono text-[13px] leading-[22px] text-on-surface-variant">
                  <span>{words} words</span>
                  <span>{chars} characters</span>
                </div>
              </div>
              <div className="flex flex-1 overflow-hidden p-6">
                <textarea
                  className="h-full w-full border-none bg-transparent p-0 font-mono text-[13px] leading-[22px] text-on-surface placeholder:text-outline focus:ring-0"
                  placeholder="Paste or type your text here. Save when you're ready."
                  spellCheck={false}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
