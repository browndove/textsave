import type { ReactNode } from "react";

interface SidebarEmptyStateProps {
  icon?: string;
  title: string;
  description?: ReactNode;
}

export default function SidebarEmptyState({
  icon = "inbox",
  title,
  description,
}: SidebarEmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-2 py-6 text-center">
      <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-outline">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </span>
      <p className="text-label-md font-medium text-on-surface">{title}</p>
      {description && (
        <p className="mt-1 text-body-sm text-on-surface-variant">{description}</p>
      )}
    </div>
  );
}
