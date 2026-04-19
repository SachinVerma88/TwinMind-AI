"use client";

import { formatShortTime } from "@/lib/format-time";
import { useAppState } from "@/state/app-state";
import type { TranscriptChunk } from "@/state/app-state";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TimeWindow = "all" | "15m" | "1h" | "24h";
type SortOrder = "chronological" | "newest";
type MinLengthPreset = 0 | 10 | 50;

type EnrichedChunk = TranscriptChunk & { _origIndex: number };

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function chunkMatchesTimeWindow(timestamp: string, window: TimeWindow): boolean {
  if (window === "all") return true;
  const t = new Date(timestamp).getTime();
  if (Number.isNaN(t)) return true;
  const age = Date.now() - t;
  const ms =
    window === "15m"
      ? 15 * 60 * 1000
      : window === "1h"
        ? 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;
  return age <= ms;
}

function matchesSearch(chunk: TranscriptChunk, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (chunk.text.toLowerCase().includes(q)) return true;
  if (formatShortTime(chunk.timestamp).toLowerCase().includes(q)) return true;
  if (chunk.timestamp.toLowerCase().includes(q)) return true;
  return false;
}

function HighlightText({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) {
    return <>{text}</>;
  }
  try {
    const re = new RegExp(`(${escapeRegExp(q)})`, "gi");
    const parts = text.split(re);
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === q.toLowerCase() ? (
            <mark key={i} className="rounded bg-primary-container/50 px-0.5 text-inherit">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </>
    );
  } catch {
    return <>{text}</>;
  }
}

function useProcessedChunks(
  transcriptChunks: TranscriptChunk[],
  timeWindow: TimeWindow,
  minLength: MinLengthPreset,
  searchQuery: string,
  sortOrder: SortOrder,
): EnrichedChunk[] {
  return useMemo(() => {
    let list: EnrichedChunk[] = transcriptChunks.map((c, i) => ({ ...c, _origIndex: i }));
    list = list.filter((c) => chunkMatchesTimeWindow(c.timestamp, timeWindow));
    list = list.filter((c) => c.text.length >= minLength);
    list = list.filter((c) => matchesSearch(c, searchQuery));
    list.sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return sortOrder === "chronological" ? ta - tb : tb - ta;
    });
    return list;
  }, [transcriptChunks, timeWindow, minLength, searchQuery, sortOrder]);
}

export function TranscriptPanel() {
  const { isRecording, transcriptChunks } = useAppState();
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("chronological");
  const [minLength, setMinLength] = useState<MinLengthPreset>(0);

  const displayChunks = useProcessedChunks(transcriptChunks, timeWindow, minLength, searchQuery, sortOrder);

  const filterIsActive = timeWindow !== "all" || sortOrder !== "chronological" || minLength > 0;
  const searchIsActive = searchQuery.trim().length > 0;

  const closePanels = useCallback(() => {
    setSearchOpen(false);
    setFilterOpen(false);
  }, []);

  const openSearch = useCallback(() => {
    setFilterOpen(false);
    setSearchOpen(true);
  }, []);

  const openFilter = useCallback(() => {
    setSearchOpen(false);
    setFilterOpen(true);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen && !filterOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanels();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, filterOpen, closePanels]);

  const shouldAutoScroll = !searchIsActive && !filterIsActive;
  useEffect(() => {
    if (!shouldAutoScroll) return;
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [transcriptChunks, isRecording, shouldAutoScroll]);

  const resetFilters = () => {
    setTimeWindow("all");
    setSortOrder("chronological");
    setMinLength(0);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const panelShell =
    "flex max-h-[min(92dvh,720px)] w-full flex-col border border-outline-variant/15 bg-surface-container-lowest shadow-2xl sm:max-h-[85dvh] md:max-h-[calc(100dvh-7rem)] md:w-[min(100vw-2rem,420px)] md:rounded-3xl";

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col gap-4 md:min-h-[calc(100dvh-8rem)] lg:min-h-0 lg:max-h-[calc(100dvh-8rem)] lg:min-w-0 lg:flex-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 font-headline text-lg font-extrabold text-on-surface sm:text-xl md:text-2xl">
          <span className="truncate">Live Transcript</span>
          {isRecording ? (
            <span className="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-error" aria-hidden />
          ) : null}
        </h2>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => (searchOpen ? closePanels() : openSearch())}
            aria-expanded={searchOpen}
            aria-controls="transcript-search-panel"
            className={[
              "rounded-lg p-2 transition-colors",
              searchOpen || searchIsActive
                ? "bg-primary/15 text-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-variant",
            ].join(" ")}
            aria-label={searchOpen ? "Close search" : "Open search"}
          >
            <span className="material-symbols-outlined text-sm">search</span>
          </button>
          <button
            type="button"
            onClick={() => (filterOpen ? closePanels() : openFilter())}
            aria-expanded={filterOpen}
            aria-controls="transcript-filter-panel"
            className={[
              "relative rounded-lg p-2 transition-colors",
              filterOpen || filterIsActive
                ? "bg-primary/15 text-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-variant",
            ].join(" ")}
            aria-label={filterOpen ? "Close filters" : "Open filters"}
          >
            <span className="material-symbols-outlined text-sm">filter_list</span>
            {filterIsActive && !filterOpen ? (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-tertiary" aria-hidden />
            ) : null}
          </button>
        </div>
      </div>

      {searchOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-x-0 top-20 right-0 bottom-0 left-0 z-48 bg-inverse-surface/35 backdrop-blur-[2px] transition-opacity"
            aria-label="Close search panel"
            onClick={closePanels}
          />
          <div
            id="transcript-search-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transcript-search-title"
            className={`fixed z-49 ${panelShell} bottom-0 left-0 right-0 rounded-t-3xl p-5 sm:p-6 md:bottom-auto md:top-24 md:right-4 md:left-auto md:rounded-3xl`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 id="transcript-search-title" className="font-headline text-lg font-bold text-on-surface">
                  Search transcript
                </h3>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Matches chunk text and timestamps. Results update as you type.
                </p>
              </div>
              <button
                type="button"
                onClick={closePanels}
                className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <label className="block">
              <span className="sr-only">Search query</span>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to search…"
                className="w-full rounded-2xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/25 focus:outline-none"
              />
            </label>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant">
              <span>
                {transcriptChunks.length === 0
                  ? "No chunks yet"
                  : `${displayChunks.length} of ${transcriptChunks.length} chunk${transcriptChunks.length === 1 ? "" : "s"} visible`}
              </span>
              <button
                type="button"
                onClick={clearSearch}
                disabled={!searchIsActive}
                className="rounded-lg px-3 py-1.5 font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear query
              </button>
            </div>
            <button
              type="button"
              onClick={closePanels}
              className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-bold text-on-primary transition-colors hover:bg-primary-dim"
            >
              Done
            </button>
          </div>
        </>
      ) : null}

      {filterOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-x-0 top-20 right-0 bottom-0 left-0 z-48 bg-inverse-surface/35 backdrop-blur-[2px]"
            aria-label="Close filter panel"
            onClick={closePanels}
          />
          <div
            id="transcript-filter-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transcript-filter-title"
            className={`fixed z-49 ${panelShell} bottom-0 left-0 right-0 max-h-[min(88dvh,640px)] overflow-y-auto rounded-t-3xl p-5 sm:p-6 md:bottom-auto md:top-24 md:right-4 md:left-auto md:max-h-[calc(100dvh-7rem)] md:rounded-3xl`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 id="transcript-filter-title" className="font-headline text-lg font-bold text-on-surface">
                  Filter transcript
                </h3>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Narrow chunks by time, length, and order. Combine with search.
                </p>
              </div>
              <button
                type="button"
                onClick={closePanels}
                className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <fieldset className="mb-5">
              <legend className="mb-2 text-xs font-bold tracking-wide text-on-surface-variant uppercase">
                Time range
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    { id: "all" as const, label: "All" },
                    { id: "15m" as const, label: "Last 15 min" },
                    { id: "1h" as const, label: "Last hour" },
                    { id: "24h" as const, label: "Last 24 h" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTimeWindow(opt.id)}
                    className={[
                      "rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors",
                      timeWindow === opt.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-outline-variant/30 bg-surface hover:border-outline-variant/60",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mb-5">
              <legend className="mb-2 text-xs font-bold tracking-wide text-on-surface-variant uppercase">
                Sort order
              </legend>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSortOrder("chronological")}
                  className={[
                    "rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors",
                    sortOrder === "chronological"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-outline-variant/30 bg-surface hover:border-outline-variant/60",
                  ].join(" ")}
                >
                  Oldest first
                </button>
                <button
                  type="button"
                  onClick={() => setSortOrder("newest")}
                  className={[
                    "rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors",
                    sortOrder === "newest"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-outline-variant/30 bg-surface hover:border-outline-variant/60",
                  ].join(" ")}
                >
                  Newest first
                </button>
              </div>
            </fieldset>

            <fieldset className="mb-6">
              <legend className="mb-2 text-xs font-bold tracking-wide text-on-surface-variant uppercase">
                Minimum text length
              </legend>
              <p className="mb-2 text-[11px] text-on-surface-variant">Hide very short segments (noise).</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { v: 0 as const, label: "Any" },
                    { v: 10 as const, label: "10+ chars" },
                    { v: 50 as const, label: "50+ chars" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setMinLength(opt.v)}
                    className={[
                      "rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors",
                      minLength === opt.v
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-outline-variant/30 bg-surface hover:border-outline-variant/60",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <button
              type="button"
              onClick={resetFilters}
              disabled={!filterIsActive}
              className="mb-3 w-full rounded-xl border border-outline-variant/40 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reset filters
            </button>
            <button
              type="button"
              onClick={closePanels}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-on-primary transition-colors hover:bg-primary-dim"
            >
              Apply & close
            </button>
          </div>
        </>
      ) : null}

      <div className="relative min-h-0 flex-1 overflow-y-auto rounded-3xl bg-surface-container-lowest p-4 shadow-app-card sm:p-5 md:p-6">
        <div className="space-y-8">
          {transcriptChunks.length === 0 ? (
            <p className="text-sm leading-relaxed text-on-surface-variant">
              Start recording to capture a live transcript. Chunks appear here as they are transcribed.
            </p>
          ) : displayChunks.length === 0 ? (
            <p className="text-sm leading-relaxed text-on-surface-variant">
              No chunks match your search and filters. Try clearing the search query or resetting filters.
            </p>
          ) : (
            displayChunks.map((chunk) => (
              <article key={`${chunk.timestamp}-${chunk._origIndex}`} className="group">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span
                    className={[
                      "rounded px-2 py-1 text-xs font-bold",
                      chunk._origIndex % 2 === 0
                        ? "bg-primary-container/20 text-primary"
                        : "bg-tertiary-container/20 text-tertiary",
                    ].join(" ")}
                  >
                    Transcript
                  </span>
                  <span className="text-[10px] font-medium text-on-surface-variant">
                    {formatShortTime(chunk.timestamp)}
                  </span>
                </div>
                <p className="font-body text-sm leading-relaxed text-on-surface md:text-base">
                  <HighlightText text={chunk.text} query={searchQuery} />
                </p>
              </article>
            ))
          )}
          {isRecording ? (
            <div className="border-t border-dashed border-outline-variant/30 pt-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
                </div>
                <span className="text-xs font-bold text-primary italic">Listening…</span>
              </div>
            </div>
          ) : null}
          <div ref={scrollAnchorRef} />
        </div>
      </div>
    </section>
  );
}
