interface DraftEditorProps {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  wordCount: number;
  charCount: number;
}

export default function DraftEditor({
  title,
  content,
  onTitleChange,
  onContentChange,
  wordCount,
  charCount,
}: DraftEditorProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface-bright">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-8">
          <label
            htmlFor="draft-title"
            className="section-label mb-2 block"
          >
            Title
          </label>
          <input
            id="draft-title"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Optional — uses first line if empty"
            className="mb-8 w-full border-none bg-transparent text-[20px] font-semibold leading-7 text-on-surface placeholder:text-outline focus:outline-none"
          />
          <textarea
            className="min-h-[50vh] w-full border-none bg-transparent p-0 font-code-md text-[15px] leading-[26px] text-on-surface placeholder:text-outline focus:ring-0"
            placeholder="Paste or type your text here. Save when you're ready."
            spellCheck={false}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
          />
        </div>
      </div>
      <div className="shrink-0 border-t border-outline-variant bg-surface-container-lowest px-8 py-3">
        <div className="mx-auto flex max-w-3xl justify-end gap-6 font-code-md text-body-sm text-on-surface-variant">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
        </div>
      </div>
    </div>
  );
}
