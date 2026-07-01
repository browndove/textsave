import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container text-outline">
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </span>
      <h3 className="text-[15px] font-semibold text-on-surface">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-body-md text-on-surface-variant">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
