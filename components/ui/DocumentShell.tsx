import type { ReactNode } from "react";

interface DocumentShellProps {
  title: string;
  meta?: string;
  hint?: string;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
}

export default function DocumentShell({
  title,
  meta,
  hint,
  actions,
  toolbar,
  children,
}: DocumentShellProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface-container-lowest">
      <div className="shrink-0 border-b border-outline-variant px-8 py-6">
        <div className="mx-auto flex max-w-2xl items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold leading-6 text-on-surface">
              {title}
            </h1>
            {meta && (
              <p className="mt-1 text-body-md text-on-surface-variant">{meta}</p>
            )}
            {hint && (
              <p className="mt-1 text-body-sm text-muted">{hint}</p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {actions}
            </div>
          )}
        </div>
        {toolbar && (
          <div className="mx-auto mt-4 max-w-2xl">{toolbar}</div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-4">
        <div className="mx-auto max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
