export default function AppShellSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <div className="flex h-toolbar-height shrink-0 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-margin-page">
        <div className="skeleton h-6 w-32" />
        <div className="skeleton h-8 w-64" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <aside className="flex h-full w-sidebar-width shrink-0 flex-col border-r border-outline-variant bg-surface-container-low">
          <div className="shrink-0 px-3 pt-3 pb-2">
            <div className="skeleton h-8 w-full" />
          </div>
          <div className="sidebar-section shrink-0 px-3 pb-2">
            <div className="skeleton mb-2 h-3 w-12" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-14 w-full" />
              ))}
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col border-t border-outline-variant">
            <div className="shrink-0 px-4 py-2">
              <div className="skeleton h-3 w-24" />
            </div>
            <div className="sidebar-scroll space-y-2 px-3 pb-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-10 w-full" />
              ))}
            </div>
          </div>
        </aside>
        <main className="flex flex-1 flex-col bg-surface-container-lowest p-8">
          <div className="mx-auto w-full max-w-2xl space-y-4">
            <div className="skeleton h-8 w-2/3" />
            <div className="skeleton h-4 w-1/3" />
            <div className="mt-8 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton h-16 w-full" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
