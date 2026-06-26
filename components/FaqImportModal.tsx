"use client";

import { useRef, useState } from "react";
import type { FaqDocument, FaqEntry } from "@/lib/types";
import { mergeFaqEntries, replaceFaqEntries } from "@/lib/faq-import";

interface ImportPreview {
  fileName: string;
  count: number;
  entries: FaqEntry[];
  preview: { question: string; answer: string }[];
}

interface FaqImportModalProps {
  faq: FaqDocument;
  onChange: (doc: FaqDocument) => void;
  onClose: () => void;
}

export default function FaqImportModal({
  faq,
  onChange,
  onClose,
}: FaqImportModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentId", faq.id);

      const response = await fetch("/api/faq/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Import failed.");
      }

      setPreview(data as ImportPreview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const applyImport = (mode: "replace" | "merge") => {
    if (!preview) return;
    const next =
      mode === "replace"
        ? replaceFaqEntries(faq, preview.entries)
        : mergeFaqEntries(faq, preview.entries);
    onChange(next);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-[8px] border border-outline-variant/60 bg-surface-container-lowest shadow-lg"
        role="dialog"
        aria-labelledby="faq-import-title"
      >
        <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
          <h2
            id="faq-import-title"
            className="text-[14px] font-semibold text-on-surface"
          >
            Import document
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-outline hover:bg-surface-container-high hover:text-on-surface"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!preview ? (
            <>
              <p className="mb-4 text-[13px] leading-5 text-on-surface-variant">
                Upload a PDF, Word (.docx), or text file. Questions are detected
                from lines ending with <strong>?</strong> or numbered items.
              </p>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[6px] border border-dashed border-outline-variant bg-surface-bright px-6 py-10 transition-colors hover:bg-surface-container-high/50">
                <span className="material-symbols-outlined mb-2 text-[28px] text-outline">
                  upload_file
                </span>
                <span className="text-[13px] font-medium text-on-surface">
                  Choose a file
                </span>
                <span className="mt-1 text-[11px] text-on-surface-variant">
                  PDF, .docx, .txt, .md — max 15 MB
                </span>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="sr-only"
                  disabled={loading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFile(file);
                  }}
                />
              </label>

              {loading && (
                <p className="mt-4 text-center text-[13px] text-on-surface-variant">
                  Extracting questions…
                </p>
              )}

              {error && (
                <p className="mt-4 rounded-[6px] bg-error/10 px-3 py-2 text-[13px] text-error">
                  {error}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="mb-3 text-[13px] text-on-surface">
                Found <strong>{preview.count}</strong> questions in{" "}
                <span className="text-on-surface-variant">{preview.fileName}</span>
              </p>

              <div className="mb-4 space-y-2">
                <p className="text-[10px] font-semibold tracking-[0.08em] text-on-surface-variant uppercase">
                  Preview
                </p>
                {preview.preview.map((entry, i) => (
                  <div
                    key={i}
                    className="rounded-[6px] border border-outline-variant/50 bg-surface-bright px-3 py-2"
                  >
                    <p className="text-[12px] font-medium text-on-surface">
                      {entry.question}
                    </p>
                    {entry.answer && (
                      <p className="mt-1 line-clamp-2 text-[11px] text-on-surface-variant">
                        {entry.answer}
                      </p>
                    )}
                  </div>
                ))}
                {preview.count > preview.preview.length && (
                  <p className="text-[11px] italic text-outline">
                    + {preview.count - preview.preview.length} more
                  </p>
                )}
              </div>

              <p className="text-[12px] text-on-surface-variant">
                Replace removes all current questions. Merge appends the imported
                ones.
              </p>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-outline-variant px-5 py-4">
          {preview ? (
            <>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-[5px] px-3 py-1.5 text-[12px] font-medium text-on-surface-variant hover:bg-surface-container-high"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => applyImport("merge")}
                className="rounded-[5px] border border-outline-variant px-3 py-1.5 text-[12px] font-medium text-on-surface hover:bg-surface-container-high"
              >
                Merge
              </button>
              <button
                type="button"
                onClick={() => applyImport("replace")}
                className="rounded-[5px] bg-primary px-3 py-1.5 text-[12px] font-medium text-on-primary"
              >
                Replace all
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-[5px] px-3 py-1.5 text-[12px] font-medium text-on-surface-variant hover:bg-surface-container-high"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
