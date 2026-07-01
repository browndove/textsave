import type { ReactNode } from "react";

interface AccordionItemProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  leading?: ReactNode;
  dragHandle?: ReactNode;
  isDragOver?: boolean;
  isDragging?: boolean;
  children?: ReactNode;
  headerOverride?: ReactNode;
}

export default function AccordionItem({
  title,
  expanded,
  onToggle,
  leading,
  dragHandle,
  isDragOver,
  isDragging,
  children,
  headerOverride,
}: AccordionItemProps) {
  return (
    <div
      className={`border-t border-outline-variant transition-colors ${
        isDragOver ? "bg-primary-fixed/30" : ""
      } ${isDragging ? "opacity-50" : ""}`}
    >
      {headerOverride ?? (
        <div className="flex items-stretch gap-1">
          {dragHandle}
          <button
            type="button"
            onClick={onToggle}
            className="flex min-w-0 flex-1 items-center justify-between gap-4 py-5 text-left"
            aria-expanded={expanded}
          >
            <span className="flex min-w-0 items-start gap-2">
              {leading}
              <span className="text-[15px] leading-6 font-semibold text-on-surface">
                {title}
              </span>
            </span>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-outline-variant text-outline transition-colors"
              aria-hidden
            >
              <span className="material-symbols-outlined text-[18px]">
                {expanded ? "remove" : "add"}
              </span>
            </span>
          </button>
        </div>
      )}

      <div
        className={`accordion-body ${expanded && children ? "accordion-body-open" : ""}`}
      >
        <div className="accordion-body-inner">
          {children && <div className="pb-7">{children}</div>}
        </div>
      </div>
    </div>
  );
}
