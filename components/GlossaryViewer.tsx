"use client";

import { useCallback, useEffect, useState } from "react";
import type { GlossaryDocument, GlossaryEntry } from "@/lib/types";
import { fetchGlossary } from "@/lib/glossary-api";
import { GLOSSARY_DOCUMENT } from "@/lib/documents";
import AccordionItem from "@/components/ui/AccordionItem";
import DocumentShell from "@/components/ui/DocumentShell";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const PAGE_SIZE = 50;

interface GlossaryViewerProps {
  searchQuery: string;
}

export default function GlossaryViewer({ searchQuery }: GlossaryViewerProps) {
  const [letter, setLetter] = useState("A");
  const [doc, setDoc] = useState<GlossaryDocument | null>(null);
  const [entries, setEntries] = useState<GlossaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const filterKey = `${letter}:${debouncedQuery}`;
  const [expansionState, setExpansionState] = useState<{
    key: string;
    ids: Set<string>;
  }>(() => ({ key: "A:", ids: new Set() }));
  const expandedIds =
    expansionState.key === filterKey ? expansionState.ids : new Set<string>();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const isSearching = debouncedQuery.length > 0;

  const loadPage = useCallback(
    async (offset: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const result = await fetchGlossary(
          isSearching
            ? { q: debouncedQuery, limit: PAGE_SIZE, offset }
            : { letter, limit: PAGE_SIZE, offset },
        );

        setDoc(result);
        setEntries((prev) =>
          append ? [...prev, ...result.entries] : result.entries,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load glossary");
        if (!append) {
          setDoc(null);
          setEntries([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedQuery, isSearching, letter],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on filter change
    void loadPage(0, false);
  }, [loadPage]);

  const toggleExpanded = (id: string) => {
    setExpansionState((prev) => {
      const ids = prev.key === filterKey ? prev.ids : new Set<string>();
      const next = new Set(ids);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { key: filterKey, ids: next };
    });
  };

  const hasMore = doc?.pagination?.hasMore ?? false;
  const total = doc?.pagination?.total;
  const subtitle = isSearching
    ? total !== undefined
      ? `${total} matching ${total === 1 ? "term" : "terms"}`
      : `${entries.length} terms`
    : total !== undefined
      ? `${total} terms under ${letter}`
      : `${GLOSSARY_DOCUMENT.termCount.toLocaleString()} terms · A–Z`;

  const letterStrip = !isSearching ? (
    <div className="sticky top-0 z-[1] -mx-8 border-b border-outline-variant bg-surface-container-lowest px-8 py-3">
      <div className="mx-auto max-w-2xl overflow-x-auto">
        <div className="flex min-w-max gap-1">
          {LETTERS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setLetter(value)}
              className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2.5 text-body-sm font-medium transition-colors ${
                letter === value
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
              aria-pressed={letter === value}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <DocumentShell
      title={GLOSSARY_DOCUMENT.title}
      meta={subtitle}
      hint={
        !isSearching ? "Browse by letter or search from the toolbar." : undefined
      }
      toolbar={letterStrip}
    >
      {loading ? (
        <LoadingState message="Loading glossary…" />
      ) : error ? (
        <EmptyState
          icon="error"
          title="Could not load glossary"
          description={
            <>
              {error}. Check that{" "}
              <code className="text-xs">HELIX_API_BASE_URL</code> is set in{" "}
              <code className="text-xs">.env.local</code>.
            </>
          }
        />
      ) : entries.length === 0 ? (
        <EmptyState
          icon="search_off"
          title={isSearching ? "No terms match your search" : "No terms for this letter"}
          description={
            isSearching
              ? "Try a different search term."
              : "Select another letter to browse."
          }
        />
      ) : (
        <>
          <div className="border-b border-outline-variant">
            {entries.map((entry) => {
              const termText = entry.term.trim() || "Untitled term";
              const definition = entry.definition.trim();
              return (
                <AccordionItem
                  key={entry.id}
                  title={termText}
                  expanded={expandedIds.has(entry.id)}
                  onToggle={() => toggleExpanded(entry.id)}
                >
                  {definition ? (
                    <p className="text-body-md leading-7 text-on-surface-variant">
                      {definition}
                    </p>
                  ) : (
                    <p className="text-body-md leading-7 text-muted italic">
                      No definition available.
                    </p>
                  )}
                </AccordionItem>
              );
            })}
          </div>

          {hasMore && (
            <div className="py-8 text-center">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void loadPage(entries.length, true)}
                className="btn-secondary"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </DocumentShell>
  );
}
