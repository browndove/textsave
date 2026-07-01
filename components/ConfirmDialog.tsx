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
        className="panel w-full max-w-md p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-error-container">
            <span
              className="material-symbols-outlined text-[20px] text-error"
              aria-hidden
            >
              warning
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="confirm-dialog-title"
              className="text-[15px] font-semibold text-on-surface"
            >
              {title}
            </h2>
            <p
              id="confirm-dialog-desc"
              className="mt-2 text-body-md leading-6 text-on-surface-variant"
            >
              {message ?? (
                <>
                  {preamble}
                  {itemName && (
                    <span className="font-semibold text-on-surface">{itemName}</span>
                  )}
                  {suffix}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-error/30 bg-error-container px-4 text-body-sm font-medium text-error transition-colors hover:bg-error-container/80"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
