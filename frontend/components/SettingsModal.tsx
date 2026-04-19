"use client";

import { useAppState } from "@/state/app-state";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { apiKey, setApiKey, settings, setSettings } = useAppState();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-app-card">
        <h2 className="mb-4 font-headline text-lg font-bold text-on-surface">Settings</h2>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-on-surface-variant">API Key</span>
            <input
              className="w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/25 focus:outline-none"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="Enter API key"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-on-surface-variant">Language</span>
            <input
              className="w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/25 focus:outline-none"
              value={settings.language}
              onChange={(event) =>
                setSettings((value) => ({ ...value, language: event.target.value }))
              }
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-on-surface-variant">Tone</span>
            <input
              className="w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/25 focus:outline-none"
              value={settings.tone}
              onChange={(event) =>
                setSettings((value) => ({ ...value, tone: event.target.value }))
              }
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-on-surface-variant">Suggestion Prompt</span>
            <textarea
              className="w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/25 focus:outline-none"
              rows={3}
              value={settings.suggestionPrompt}
              onChange={(event) =>
                setSettings((value) => ({ ...value, suggestionPrompt: event.target.value }))
              }
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-on-surface-variant">Chat Prompt</span>
            <textarea
              className="w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/25 focus:outline-none"
              rows={3}
              value={settings.chatPrompt}
              onChange={(event) =>
                setSettings((value) => ({ ...value, chatPrompt: event.target.value }))
              }
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-on-surface-variant">Context Window</span>
            <input
              type="number"
              min={1}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/25 focus:outline-none"
              value={settings.contextWindow}
              onChange={(event) =>
                setSettings((value) => ({
                  ...value,
                  contextWindow: Number(event.target.value) || 1,
                }))
              }
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-on-surface-variant">Answer Context Window</span>
            <input
              type="number"
              min={0}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/25 focus:outline-none"
              value={settings.answerContextWindow}
              onChange={(event) =>
                setSettings((value) => ({
                  ...value,
                  answerContextWindow: Math.max(0, Number(event.target.value) || 0),
                }))
              }
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-dim"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
