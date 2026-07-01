type TextSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function TextSearchBar({
  value,
  onChange,
  placeholder = "Search…",
}: TextSearchBarProps) {
  return (
    <div className="relative w-[280px]">
      <span
        className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[16px] text-outline"
        style={{ fontVariationSettings: "'wght' 300" }}
      >
        search
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded-lg border border-outline-variant bg-surface-container-lowest pr-3 pl-9 text-label-md text-on-surface placeholder:text-outline focus:border-primary-fixed-dim focus:outline-none"
      />
    </div>
  );
}
