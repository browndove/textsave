import SidebarEmptyState from "@/components/ui/SidebarEmptyState";
import SidebarNavItem from "@/components/ui/SidebarNavItem";
import type { FaqDocument, SavedVersion } from "@/lib/types";
import type { EditorDocument } from "@/lib/documents";
import {
  GLOSSARY_DOCUMENT,
  GLOSSARY_DOCUMENT_ID,
  PINNED_DOCUMENTS,
  type PinnedDocumentId,
} from "@/lib/documents";
import { formatFaqMeta } from "@/lib/faq-storage";
import { formatDisplayTitle, formatVersionMeta } from "@/lib/storage";

interface AppSidebarProps {
  activeDocument: EditorDocument;
  activeVersionId: string | null;
  faqDocs: Partial<Record<PinnedDocumentId, FaqDocument>>;
  versions: SavedVersion[];
  filteredVersions: SavedVersion[];
  onNewDraft: () => void;
  onOpenDocument: (id: EditorDocument) => void;
  onLoadVersion: (version: SavedVersion) => void;
  onDeleteVersion: (id: string) => void;
}

export default function AppSidebar({
  activeDocument,
  activeVersionId,
  faqDocs,
  versions,
  filteredVersions,
  onNewDraft,
  onOpenDocument,
  onLoadVersion,
  onDeleteVersion,
}: AppSidebarProps) {
  const showGlossary = activeDocument === GLOSSARY_DOCUMENT_ID;

  return (
    <aside className="flex h-full w-sidebar-width shrink-0 flex-col border-r border-outline-variant bg-surface-container-low">
      <div className="shrink-0 px-3 pt-3 pb-2">
        <button type="button" onClick={onNewDraft} className="btn-outline w-full">
          <span className="material-symbols-outlined text-[16px]">add</span>
          New Draft
        </button>
      </div>

      <div className="sidebar-section shrink-0">
        <h3 className="section-label px-4 pb-2">Files</h3>
        <div className="space-y-1 px-3 pb-2">
          {PINNED_DOCUMENTS.map((doc) => {
            const file = faqDocs[doc.id];
            if (!file) return null;
            return (
              <SidebarNavItem
                key={doc.id}
                icon={doc.icon}
                title={file.title}
                subtitle={formatFaqMeta(file)}
                active={activeDocument === doc.id}
                onClick={() => onOpenDocument(doc.id)}
              />
            );
          })}
          <SidebarNavItem
            icon={GLOSSARY_DOCUMENT.icon}
            title={GLOSSARY_DOCUMENT.title}
            subtitle={`${GLOSSARY_DOCUMENT.termCount.toLocaleString()} terms · A–Z`}
            active={showGlossary}
            onClick={() => onOpenDocument(GLOSSARY_DOCUMENT_ID)}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col border-t border-outline-variant">
        <div className="shrink-0 px-4 py-2">
          <h3 className="section-label">
            Saved Drafts{versions.length > 0 ? ` (${versions.length})` : ""}
          </h3>
        </div>
        <nav className="sidebar-scroll space-y-0.5 px-3 pb-4">
          {versions.length === 0 ? (
            <SidebarEmptyState
              icon="edit_note"
              title="No drafts yet"
              description="Write something and save a version."
            />
          ) : filteredVersions.length === 0 ? (
            <p className="px-2 py-4 text-center text-body-sm text-on-surface-variant italic">
              No drafts match your search.
            </p>
          ) : (
            filteredVersions.map((version) => (
              <div
                key={version.id}
                className={`group flex w-full items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-surface-container-high/80 ${
                  activeDocument === "draft" && activeVersionId === version.id
                    ? "bg-surface-container-high/90"
                    : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => onLoadVersion(version)}
                  className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-left"
                >
                  <span className="material-symbols-outlined text-[15px] text-outline">
                    description
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span
                      className="truncate text-body-sm font-medium text-on-surface"
                      title={version.title}
                    >
                      {formatDisplayTitle(version.title)}
                    </span>
                    <span className="truncate text-[10px] text-outline">
                      {formatVersionMeta(version)}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => void onDeleteVersion(version.id)}
                  className="p-1 text-outline opacity-0 transition-opacity group-hover:opacity-100 hover:text-error"
                  aria-label={`Delete ${version.title}`}
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            ))
          )}
        </nav>
      </div>
    </aside>
  );
}
