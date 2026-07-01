"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { FaqDocument, FaqEntry } from "@/lib/types";
import { getPinnedDocument } from "@/lib/documents";
import {
  addEntry,
  clearAnswer,
  formatFaqMeta,
  moveEntry,
  removeEntry,
  updateAnswer,
  updateQuestion,
} from "@/lib/faq-storage";
import { filterFaqEntries } from "@/lib/search";
import FaqImportModal from "@/components/FaqImportModal";
import HowToContentEditor from "@/components/HowToContentEditor";
import { useConfirm } from "@/components/ConfirmProvider";
import { coerceHowToAnswerString, hasHowToContent, parseHowToAnswer } from "@/lib/howto-content";
import AccordionItem from "@/components/ui/AccordionItem";
import DocumentShell from "@/components/ui/DocumentShell";
import EmptyState from "@/components/ui/EmptyState";

type EditField = "question" | "answer" | null;

interface FaqEditorProps {
  faq: FaqDocument;
  onChange: (doc: FaqDocument) => void;
  searchQuery: string;
  pdfUrl?: string;
}

function normalizeAnswer(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

function answerParagraphs(text: string): string[] {
  const normalized = normalizeAnswer(text);
  if (!normalized) return [];
  return normalized.split(/\n\n+/).filter(Boolean);
}

function FaqEntryRow({
  entry,
  faq,
  expanded,
  onToggle,
  onChange,
  autoFocusQuestion,
  onAutoFocusHandled,
  entryLabel,
  structured,
  canReorder,
  isDragging,
  isDragOver,
  dragHandle,
}: {
  entry: FaqEntry;
  faq: FaqDocument;
  expanded: boolean;
  onToggle: () => void;
  onChange: (doc: FaqDocument) => void;
  autoFocusQuestion?: boolean;
  onAutoFocusHandled?: () => void;
  entryLabel: { singular: string; plural: string };
  structured?: boolean;
  canReorder: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  dragHandle?: React.ReactNode;
}) {
  const [editField, setEditField] = useState<EditField>(() =>
    autoFocusQuestion ? "question" : null,
  );
  const [draftText, setDraftText] = useState(() =>
    autoFocusQuestion ? entry.question : "",
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const confirm = useConfirm();
  const answerText = coerceHowToAnswerString(entry.answer);
  const hasAnswer = structured
    ? hasHowToContent(parseHowToAnswer(entry.answer))
    : Boolean(answerText.trim());
  const paragraphs = answerParagraphs(answerText);
  const isEditing = editField !== null;
  const questionText = entry.question.trim() || `Untitled ${entryLabel.singular}`;

  useLayoutEffect(() => {
    if (autoFocusQuestion) onAutoFocusHandled?.();
  }, [autoFocusQuestion, onAutoFocusHandled]);

  useEffect(() => {
    if (editField && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editField]);

  const startEdit = (field: EditField, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!field) return;
    setEditField(field);
    setDraftText(field === "question" ? entry.question : answerText);
  };

  const cancelEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditField(null);
    setDraftText("");
  };

  const saveEdit = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!editField) return;

    if (editField === "question") {
      const trimmed = draftText.trim();
      if (!trimmed) {
        const ok = await confirm({
          message: `Are you sure you want to delete this ${entryLabel.singular}?`,
        });
        if (ok) onChange(removeEntry(faq, entry.id));
        cancelEdit();
        return;
      }
      onChange(updateQuestion(faq, entry.id, trimmed));
    } else {
      onChange(updateAnswer(faq, entry.id, draftText.trim()));
    }

    cancelEdit();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm({
      itemName: questionText,
      suffix: hasAnswer ? " and its answer?" : "?",
    });
    if (ok) onChange(removeEntry(faq, entry.id));
  };

  const headerOverride =
    editField === "question" ? (
      <div className="flex items-stretch gap-1 border-t border-outline-variant py-5">
        {canReorder && dragHandle}
        <div className="min-w-0 flex-1">
          <textarea
            ref={inputRef}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            rows={2}
            className="mb-3 w-full resize-none border-none bg-transparent p-0 text-[15px] leading-6 font-semibold text-on-surface placeholder:text-outline focus:outline-none"
            placeholder={`Enter ${entryLabel.singular}`}
          />
          <div className="flex gap-3">
            <button type="button" onClick={saveEdit} className="btn-ghost !h-auto !px-2 !py-1">
              Save
            </button>
            <button type="button" onClick={cancelEdit} className="btn-ghost !h-auto !px-2 !py-1">
              Cancel
            </button>
          </div>
        </div>
      </div>
    ) : undefined;

  const bodyContent =
    editField !== "question" ? (
      <>
        {editField === "answer" ? (
          <>
            <textarea
              ref={inputRef}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              rows={5}
              className="mb-3 w-full resize-y border-none bg-transparent p-0 text-body-md leading-7 text-on-surface-variant placeholder:text-outline focus:outline-none"
              placeholder="Enter answer"
            />
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={saveEdit} className="btn-ghost !h-auto !px-2 !py-1">
                Save
              </button>
              <button type="button" onClick={cancelEdit} className="btn-ghost !h-auto !px-2 !py-1">
                Cancel
              </button>
              {hasAnswer && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void confirm({
                      title: "Confirm remove action",
                      preamble: "Are you sure you want to remove the answer for ",
                      itemName: questionText,
                      suffix: "?",
                      confirmLabel: "Confirm Remove",
                    }).then((ok) => {
                      if (ok) {
                        onChange(clearAnswer(faq, entry.id));
                        cancelEdit();
                      }
                    });
                  }}
                  className="btn-ghost !h-auto !px-2 !py-1 text-error"
                >
                  Remove answer
                </button>
              )}
            </div>
          </>
        ) : structured ? (
          <HowToContentEditor
            entryId={entry.id}
            answer={answerText}
            faq={faq}
            onChange={onChange}
          />
        ) : hasAnswer ? (
          <div className="space-y-4 text-body-md leading-7 text-on-surface-variant">
            {paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <p className="text-body-md leading-7 text-muted italic">No answer yet.</p>
        )}

        {!isEditing && !structured && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={(e) => startEdit("question", e)}
              className="btn-ghost !h-auto !px-2 !py-1"
            >
              Edit {entryLabel.singular}
            </button>
            <button
              type="button"
              onClick={(e) => startEdit("answer", e)}
              className="btn-ghost !h-auto !px-2 !py-1"
            >
              {hasAnswer ? "Edit answer" : "Add answer"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="btn-ghost !h-auto !px-2 !py-1 text-error"
            >
              Delete
            </button>
          </div>
        )}

        {!isEditing && structured && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={(e) => startEdit("question", e)}
              className="btn-ghost !h-auto !px-2 !py-1"
            >
              Edit {entryLabel.singular}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="btn-ghost !h-auto !px-2 !py-1 text-error"
            >
              Delete
            </button>
          </div>
        )}
      </>
    ) : null;

  return (
    <AccordionItem
      title={questionText}
      expanded={expanded && editField !== "question"}
      onToggle={onToggle}
      dragHandle={canReorder ? dragHandle : undefined}
      isDragging={isDragging}
      isDragOver={isDragOver}
      headerOverride={headerOverride}
    >
      {bodyContent}
    </AccordionItem>
  );
}

export default function FaqEditor({
  faq,
  onChange,
  searchQuery,
  pdfUrl = "/Helix App Frequently Asked Questions.pdf",
}: FaqEditorProps) {
  const [newEntryId, setNewEntryId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const filtered = filterFaqEntries(faq.entries, searchQuery);

  const meta = getPinnedDocument(faq.id);
  const entryLabel = meta?.entryLabel ?? { singular: "item", plural: "items" };
  const structured = meta?.parseFormat === "howto";
  const canReorder = !structured && searchQuery.trim() === "";
  const showExpandAll = filtered.length > 5;
  const allExpanded =
    filtered.length > 0 && filtered.every((e) => expandedIds.has(e.id));

  const handleAddQuestion = () => {
    const next = addEntry(faq);
    const created = next.entries[next.entries.length - 1];
    onChange(next);
    setNewEntryId(created.id);
    setExpandedIds((prev) => new Set(prev).add(created.id));
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(filtered.map((e) => e.id)));
    }
  };

  const handleDrop = (sourceId: string | null, targetId: string) => {
    if (!sourceId || sourceId === targetId) return;
    onChange(moveEntry(faq, sourceId, targetId));
  };

  const dragHandle = (
    <div className="flex cursor-grab items-center px-2 text-outline active:cursor-grabbing">
      <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
    </div>
  );

  return (
    <>
      <DocumentShell
        title={faq.title}
        meta={formatFaqMeta(faq)}
        hint={canReorder ? `Drag ${entryLabel.plural} to reorder.` : undefined}
        actions={
          <>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="btn-ghost"
            >
              Import
            </button>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              View PDF
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            </a>
            <button type="button" onClick={handleAddQuestion} className="btn-primary">
              <span className="material-symbols-outlined text-[16px]">add</span>
              Add {entryLabel.singular}
            </button>
          </>
        }
        toolbar={
          showExpandAll ? (
            <button type="button" onClick={toggleExpandAll} className="btn-ghost">
              <span className="material-symbols-outlined text-[16px]">
                {allExpanded ? "unfold_less" : "unfold_more"}
              </span>
              {allExpanded ? "Collapse all" : "Expand all"}
            </button>
          ) : undefined
        }
      >
        {filtered.length === 0 ? (
          searchQuery.trim() ? (
            <EmptyState
              icon="search_off"
              title={`No matching ${entryLabel.plural}`}
              description="Try a different search term."
            />
          ) : (
            <EmptyState
              icon="quiz"
              title={`No ${entryLabel.plural} yet`}
              description={`Add your first ${entryLabel.singular} to get started.`}
              action={
                <button type="button" onClick={handleAddQuestion} className="btn-primary">
                  Add first {entryLabel.singular}
                </button>
              }
            />
          )
        ) : (
          <div className="border-b border-outline-variant">
            {filtered.map((entry) => (
              <div
                key={entry.id}
                draggable={canReorder}
                onDragStart={(e) => {
                  if (!canReorder) return;
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", entry.id);
                  setDraggedId(entry.id);
                }}
                onDragEnter={(e) => {
                  if (!canReorder) return;
                  e.preventDefault();
                  if (entry.id !== draggedId) setDragOverId(entry.id);
                }}
                onDragOver={(e) => {
                  if (!canReorder) return;
                  e.preventDefault();
                  if (entry.id !== draggedId) setDragOverId(entry.id);
                }}
                onDragLeave={() => {
                  if (!canReorder) return;
                  if (dragOverId === entry.id) setDragOverId(null);
                }}
                onDrop={(e) => {
                  if (!canReorder) return;
                  e.preventDefault();
                  const sourceId = e.dataTransfer.getData("text/plain") || draggedId;
                  handleDrop(sourceId, entry.id);
                  setDraggedId(null);
                  setDragOverId(null);
                }}
                onDragEnd={() => {
                  if (!canReorder) return;
                  setDraggedId(null);
                  setDragOverId(null);
                }}
              >
                <FaqEntryRow
                  entry={entry}
                  faq={faq}
                  expanded={expandedIds.has(entry.id)}
                  onToggle={() => toggleExpanded(entry.id)}
                  onChange={onChange}
                  autoFocusQuestion={newEntryId === entry.id}
                  onAutoFocusHandled={() => setNewEntryId(null)}
                  entryLabel={entryLabel}
                  structured={structured}
                  canReorder={canReorder}
                  isDragging={draggedId === entry.id}
                  isDragOver={dragOverId === entry.id}
                  dragHandle={dragHandle}
                />
              </div>
            ))}
          </div>
        )}
      </DocumentShell>

      {importOpen && (
        <FaqImportModal
          faq={faq}
          onChange={onChange}
          onClose={() => setImportOpen(false)}
        />
      )}
    </>
  );
}
