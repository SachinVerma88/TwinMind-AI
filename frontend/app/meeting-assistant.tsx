"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { FloatingMicButton } from "@/components/FloatingMicButton";
import { Header } from "@/components/Header";
import { SettingsModal } from "@/components/SettingsModal";
import { SuggestionsPanel } from "@/components/SuggestionsPanel";
import { TranscriptPanel } from "@/components/TranscriptPanel";

export function MeetingAssistant() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-surface text-on-surface">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />
      <main className="mx-auto flex min-h-0 w-full max-w-[1920px] flex-col gap-6 px-4 pt-24 pb-28 sm:px-6 md:px-8 lg:flex-row lg:items-stretch lg:gap-6 lg:px-6 lg:pt-24 lg:pb-16 xl:gap-8 xl:px-8">
        <TranscriptPanel />
        <SuggestionsPanel />
        <ChatPanel />
      </main>
      <FloatingMicButton />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
