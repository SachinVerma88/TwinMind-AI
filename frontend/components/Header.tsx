"use client";

import { useAppState } from "@/state/app-state";

type HeaderProps = {
  onOpenSettings: () => void;
};

export function Header({ onOpenSettings }: HeaderProps) {
  const { isRecording } = useAppState();

  return (
    <header className="fixed top-0 right-0 left-0 z-50 flex h-20 w-full items-center justify-between border-b border-outline-variant/10 bg-surface px-4 shadow-app-header sm:px-6 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-lg">
          <span className="material-symbols-outlined text-[22px]">mic</span>
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-headline text-lg font-extrabold tracking-tight text-on-surface md:text-xl">
            TwinMind
          </h1>
          <p className="hidden truncate text-xs font-medium text-on-surface-variant sm:block">
            The Cognitive Workspace
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {isRecording ? (
          <div className="mr-1 hidden items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container px-3 py-1.5 sm:flex">
            <span className="material-symbols-filled text-[20px] text-primary">mic</span>
            <span className="text-xs font-bold tracking-widest text-primary uppercase">Processing</span>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded-xl p-2 text-on-surface/70 transition-colors hover:bg-surface-container-low/80 active:scale-95"
          aria-label="Settings"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
        <div className="ml-1 flex items-center gap-2 border-l border-outline-variant/20 pl-3 sm:ml-2 sm:pl-4">
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-xs font-bold text-on-surface">Pro Workspace</span>
            <span className="text-[10px] text-on-surface-variant">Live session</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest text-on-surface-variant">
            <span className="material-symbols-outlined text-[22px]">P</span>
          </div>
        </div>
      </div>
    </header>
  );
}
