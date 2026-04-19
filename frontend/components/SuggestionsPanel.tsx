"use client";

import { formatShortTime } from "@/lib/format-time";
import { useAppState } from "@/state/app-state";
import type { SuggestionBatch } from "@/state/app-state";

function isPlaceholderSuggestionBatch(batch: SuggestionBatch): boolean {
  if (batch.suggestions.length === 0) {
    return true;
  }
  return batch.suggestions.every(
    (s) =>
      /no transcript context/i.test(s.preview) || /no transcript context/i.test(s.fullPrompt),
  );
}

const CARD_VARIANTS = [
  {
    label: "Action Item",
    borderColor: "border-tertiary",
    labelClass: "text-tertiary",
    chipClass: "bg-tertiary/10",
  },
  {
    label: "Clarification",
    borderColor: "border-primary",
    labelClass: "text-primary",
    chipClass: "bg-primary/10",
  },
  {
    label: "Note",
    borderColor: "border-outline-variant",
    labelClass: "text-on-surface-variant",
    chipClass: "bg-surface-container",
  },
] as const;

export function SuggestionsPanel() {
  const { isChatLoading, isSuggestionsLoading, refreshSuggestions, sendChatPrompt, suggestionsBatches } =
    useAppState();

  const visibleBatches = suggestionsBatches.filter((batch) => !isPlaceholderSuggestionBatch(batch));

  const flatSuggestions = visibleBatches.flatMap((batch) =>
    batch.suggestions.map((item, index) => ({
      item,
      batchTimestamp: batch.timestamp,
      variant: CARD_VARIANTS[index % CARD_VARIANTS.length],
    })),
  );

  return (
    <section className="flex max-h-[min(40dvh,420px)] min-h-0 w-full shrink-0 flex-col gap-4 rounded-3xl bg-surface-container p-5 shadow-app-card md:max-h-[min(50dvh,500px)] md:p-6 lg:h-[calc(100dvh-8rem)] lg:max-h-none lg:w-72 lg:shrink-0 xl:w-80">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-headline text-lg font-bold text-on-surface">AI Suggestions</h3>
        <button
          type="button"
          onClick={() => {
            void refreshSuggestions();
          }}
          disabled={isSuggestionsLoading}
          className="rounded-full p-1.5 transition-all hover:bg-surface-container-lowest/60 active:rotate-180 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Refresh suggestions"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {isSuggestionsLoading && flatSuggestions.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Generating suggestions…</p>
        ) : null}
        {flatSuggestions.length === 0 && !isSuggestionsLoading ? (
          <p className="text-sm text-on-surface-variant">No suggestions yet. Record audio or refresh.</p>
        ) : null}
        {flatSuggestions.map(({ item, batchTimestamp, variant }) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              void sendChatPrompt(item.preview, item.fullPrompt);
            }}
            disabled={isChatLoading}
            className={[
              "group w-full rounded-2xl border-l-4 bg-surface-container-lowest p-4 text-left shadow-sm transition-all",
              "hover:translate-x-0.5 disabled:cursor-not-allowed disabled:opacity-60",
              variant.borderColor,
            ].join(" ")}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <span
                className={[
                  "rounded px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase",
                  variant.chipClass,
                  variant.labelClass,
                ].join(" ")}
              >
                {variant.label}
              </span>
              <span className="shrink-0 text-[9px] text-on-surface-variant">
                {formatShortTime(batchTimestamp)}
              </span>
            </div>
            <p className="text-sm font-medium text-on-surface transition-colors group-hover:text-primary">
              {item.preview}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
