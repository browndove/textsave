interface SidebarNavItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  active?: boolean;
  onClick: () => void;
}

export default function SidebarNavItem({
  icon,
  title,
  subtitle,
  active,
  onClick,
}: SidebarNavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors ${
        active
          ? "bg-primary-fixed/50"
          : "hover:bg-surface-container-high/80"
      }`}
    >
      {active && (
        <span
          className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-primary"
          aria-hidden
        />
      )}
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          active ? "bg-primary-fixed text-primary" : "bg-surface-container text-outline"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </span>
      <div className="min-w-0 flex-1 pl-1">
        <p
          className="truncate text-[13px] font-medium text-on-surface"
          title={title}
        >
          {title}
        </p>
        {subtitle && (
          <p className="mt-0.5 truncate text-[11px] text-on-surface-variant">
            {subtitle}
          </p>
        )}
      </div>
    </button>
  );
}
