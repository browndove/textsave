"use client";

import { useEffect, useRef, useState } from "react";
import type { FaqDocument, FaqEntry } from "@/lib/types";
import { getPinnedDocument } from "@/lib/documents";
import {
  addEntry,
  clearAnswer,
  removeEntry,
  updateAnswer,
  updateQuestion,
} from "@/lib/faq-storage";
import { filterFaqEntries } from "@/lib/search";
import FaqImportModal from "@/components/FaqImportModal";
import HowToContentEditor from "@/components/HowToContentEditor";
import { useConfirm } from "@/components/ConfirmProvider";
import { hasHowToContent, parseHowToAnswer } from "@/lib/howto-content";

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

function FaqAccordionItem({
  entry,
  faq,
  expanded,
  onToggle,
  onChange,
  autoFocusQuestion,
  onAutoFocusHandled,
  entryLabel,
  structured,
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
}) {
  const [editField, setEditField] = useState<EditField>(null);
  const [draftText, setDraftText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const confirm = useConfirm();

  useEffect(() => {
    if (autoFocusQuestion) {
      setEditField("question");
      setDraftText(entry.question);
      onAutoFocusHandled?.();
    }
  }, [autoFocusQuestion, entry.question, onAutoFocusHandled]);

  useEffect(() => {
    if (editField && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editField]);

  const startEdit = (field: EditField, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!field) return;
    setEditField(field);
    setDraftText(field === "question" ? entry.question : entry.answer);
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

  const hasAnswer = structured
    ? hasHowToContent(parseHowToAnswer(entry.answer))
    : Boolean(entry.answer.trim());
  const paragraphs = answerParagraphs(entry.answer);
  const isEditing = editField !== null;
  const questionText = entry.question.trim() || `Untitled ${entryLabel.singular}`;

  return (
    <div className="border-t border-[#e5e7eb]">
      {editField === "question" ? (
        <div className="py-6">
          <textarea
            ref={inputRef}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            rows={2}
            className="mb-3 w-full resize-none border-none bg-transparent p-0 text-[15px] leading-6 font-semibold text-[#111827] placeholder:text-[#9ca3af] focus:outline-none"
            placeholder={`Enter ${entryLabel.singular}`}
          />
          <div className="flex gap-4 text-[13px]">
            <button
              type="button"
              onClick={saveEdit}
              className="text-[#374151] underline-offset-2 hover:underline"
            >
              Save
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="text-[#9ca3af] hover:text-[#6b7280]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-6 py-6 text-left"
          aria-expanded={expanded}
        >
          <span className="text-[15px] leading-6 font-semibold text-[#111827]">
            {questionText}
          </span>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] text-[#9ca3af]"
            aria-hidden
          >
            <span className="material-symbols-outlined text-[18px]">
              {expanded ? "remove" : "add"}
            </span>
          </span>
        </button>
      )}

      {expanded && editField !== "question" && (
        <div className="pb-8">
          {editField === "answer" ? (
            <>
              <textarea
                ref={inputRef}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                rows={5}
                className="mb-3 w-full resize-y border-none bg-transparent p-0 text-[14px] leading-7 text-[#6b7280] placeholder:text-[#9ca3af] focus:outline-none"
                placeholder="Enter answer"
              />
              <div className="flex flex-wrap gap-4 text-[13px]">
                <button
                  type="button"
                  onClick={saveEdit}
                  className="text-[#374151] underline-offset-2 hover:underline"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-[#9ca3af] hover:text-[#6b7280]"
                >
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
                    className="text-[#9ca3af] hover:text-[#6b7280]"
                  >
                    Remove answer
                  </button>
                )}
              </div>
            </>
          ) : structured ? (
            <HowToContentEditor
              entryId={entry.id}
              answer={entry.answer}
              faq={faq}
              onChange={onChange}
            />
          ) : hasAnswer ? (
            <div className="space-y-4 text-[14px] leading-7 text-[#6b7280]">
              {paragraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="text-[14px] leading-7 text-[#9ca3af] italic">
              No answer yet.
            </p>
          )}

          {!isEditing && !structured && (
            <div className="mt-6 flex flex-wrap gap-4 text-[13px] text-[#9ca3af]">
              <button
                type="button"
                onClick={(e) => startEdit("question", e)}
                className="hover:text-[#6b7280] hover:underline"
              >
                Edit {entryLabel.singular}
              </button>
              <button
                type="button"
                onClick={(e) => startEdit("answer", e)}
                className="hover:text-[#6b7280] hover:underline"
              >
                {hasAnswer ? "Edit answer" : "Add answer"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="hover:text-[#6b7280] hover:underline"
              >
                Delete
              </button>
            </div>
          )}

          {!isEditing && structured && (
            <div className="mt-6 flex flex-wrap gap-4 text-[13px] text-[#9ca3af]">
              <button
                type="button"
                onClick={(e) => startEdit("question", e)}
                className="hover:text-[#6b7280] hover:underline"
              >
                Edit {entryLabel.singular}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="hover:text-[#6b7280] hover:underline"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
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
  const filtered = filterFaqEntries(faq.entries, searchQuery);

  const meta = getPinnedDocument(faq.id);
  const entryLabel = meta?.entryLabel ?? { singular: "item", plural: "items" };
  const structured = meta?.parseFormat === "howto";

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

  useEffect(() => {
    if (newEntryId) {
      setExpandedIds((prev) => new Set(prev).add(newEntryId));
    }
  }, [newEntryId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="shrink-0 border-b border-[#e5e7eb] px-8 py-6">
        <div className="mx-auto flex max-w-2xl items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold text-[#111827]">{faq.title}</h1>
            <p className="mt-1 text-[13px] text-[#9ca3af]">
              {faq.entries.length}{" "}
              {faq.entries.length === 1 ? entryLabel.singular : entryLabel.plural}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4 text-[13px] text-[#6b7280]">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="hover:text-[#111827] hover:underline"
            >
              Import
            </button>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#111827] hover:underline"
            >
              View PDF
            </a>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="font-medium text-[#111827] hover:underline"
            >
              Add {entryLabel.singular}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-4">
        <div className="mx-auto max-w-2xl">
          {filtered.length === 0 ? (
            <p className="py-16 text-center text-[14px] text-[#9ca3af]">
              {searchQuery.trim()
                ? `No ${entryLabel.plural} match your search.`
                : `No ${entryLabel.plural} yet.`}
            </p>
          ) : (
            <div className="border-b border-[#e5e7eb]">
              {filtered.map((entry) => (
                <FaqAccordionItem
                  key={entry.id}
                  entry={entry}
                  faq={faq}
                  expanded={expandedIds.has(entry.id)}
                  onToggle={() => toggleExpanded(entry.id)}
                  onChange={onChange}
                  autoFocusQuestion={newEntryId === entry.id}
                  onAutoFocusHandled={() => setNewEntryId(null)}
                  entryLabel={entryLabel}
                  structured={structured}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {importOpen && (
        <FaqImportModal
          faq={faq}
          onChange={onChange}
          onClose={() => setImportOpen(false)}
        />
      )}
    </div>
  );
}
