"use client";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  itemName?: string;
  preamble?: string;
  suffix?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title = "Confirm delete action",
  message,
  itemName,
  preamble = "Are you sure you want to delete ",
  suffix = "?",
  confirmLabel = "Confirm Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 p-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="w-full max-w-md rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fef2f2]">
            <span
              className="material-symbols-outlined text-[20px] text-[#dc2626]"
              aria-hidden
            >
              warning
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="confirm-dialog-title"
              className="text-[15px] font-semibold text-[#111827]"
            >
              {title}
            </h2>
            <p
              id="confirm-dialog-desc"
              className="mt-2 text-[14px] leading-6 text-[#6b7280]"
            >
              {message ?? (
                <>
                  {preamble}
                  {itemName && (
                    <span className="font-semibold text-[#374151]">{itemName}</span>
                  )}
                  {suffix}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-[13px] font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-4 py-2 text-[13px] font-medium text-[#b91c1c] transition-colors hover:bg-[#fee2e2]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
