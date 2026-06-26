type TextSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function TextSearchBar({ value, onChange }: TextSearchBarProps) {
  return (
    <div className="relative w-[200px]">
      <span
        className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[16px] font-light text-[#aeaeb2]"
        style={{ fontVariationSettings: "'wght' 300" }}
      >
        search
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search texts..."
        className="h-8 w-full rounded-lg border border-[#e5e5ea] bg-white pr-3 pl-9 text-[13px] leading-5 font-normal text-on-surface placeholder:text-[#aeaeb2] focus:border-[#c7c7cc] focus:outline-none"
      />
    </div>
  );
}
