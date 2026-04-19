"use client";

import { chat, suggestions } from "@/lib/api";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type TranscriptChunk = {
  text: string;
  timestamp: string;
};

export type Suggestion = {
  id: string;
  preview: string;
  fullPrompt: string;
};

export type SuggestionBatch = {
  suggestions: Suggestion[];
  timestamp: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export type Session = {
  transcriptChunks: TranscriptChunk[];
  suggestionsBatches: SuggestionBatch[];
  chatMessages: ChatMessage[];
};

export type AssistantSettings = {
  language: string;
  tone: string;
  suggestionPrompt: string;
  chatPrompt: string;
  contextWindow: number;
  answerContextWindow: number;
};

type AppStateContextValue = {
  transcriptChunks: TranscriptChunk[];
  setTranscriptChunks: React.Dispatch<React.SetStateAction<TranscriptChunk[]>>;
  suggestionsBatches: SuggestionBatch[];
  setSuggestionsBatches: React.Dispatch<React.SetStateAction<SuggestionBatch[]>>;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  lastUpdated: string | null;
  setLastUpdated: React.Dispatch<React.SetStateAction<string | null>>;
  refreshSuggestions: (chunks?: TranscriptChunk[]) => Promise<void>;
  sendChatPrompt: (displayText: string, prompt: string) => Promise<void>;
  isSuggestionsLoading: boolean;
  isChatLoading: boolean;
  isRecording: boolean;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  apiKey: string;
  setApiKey: React.Dispatch<React.SetStateAction<string>>;
  settings: AssistantSettings;
  setSettings: React.Dispatch<React.SetStateAction<AssistantSettings>>;
};

const defaultSettings: AssistantSettings = {
  language: "en",
  tone: "neutral",

  suggestionPrompt: `You are an AI meeting copilot helping in a live conversation.

Generate EXACTLY 3 useful suggestions based on the transcript.

Each must be different:
1. A smart question to ask next
2. A helpful insight or recommendation
3. A clarification or follow-up

Rules:
- Focus on the MOST RECENT part of the conversation
- Keep each suggestion concise but valuable
- Avoid generic or obvious suggestions

Return ONLY:
[
  { "preview": "...", "fullPrompt": "..." },
  { "preview": "...", "fullPrompt": "..." },
  { "preview": "...", "fullPrompt": "..." }
]

Transcript:
{{transcript}}`,

  chatPrompt: `You are assisting in a live conversation.

Provide a clear, concise, and practical response.

Guidelines:
- Use the transcript context if relevant
- Be direct and helpful
- Structure the answer if needed (bullet points or short paragraphs)
- Avoid unnecessary verbosity

Transcript:
{{recent_transcript}}

User request:
{{user_prompt}}`,

  contextWindow: 5,
  answerContextWindow: 5,
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [transcriptChunks, setTranscriptChunks] = useState<TranscriptChunk[]>([]);
  const [suggestionsBatches, setSuggestionsBatches] = useState<SuggestionBatch[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_API_KEY ?? "");
  const [settings, setSettings] = useState<AssistantSettings>(defaultSettings);
  const suggestionsInFlightRef = useRef(false);
  const chatInFlightRef = useRef(false);
  /** Fingerprint of transcript window last used for a successful mic-driven refresh (avoids duplicate API calls). */
  const lastMicSuggestionSignatureRef = useRef<string | null>(null);

  const suggestionWindowSignature = (recent: TranscriptChunk[]) =>
    recent.map((c) => `${c.timestamp}\t${c.text}`).join("\n");

  const refreshSuggestions = useCallback(
    async (chunks?: TranscriptChunk[]) => {
      if (suggestionsInFlightRef.current) {
        return;
      }

      const sourceChunks = chunks ?? transcriptChunks;
      const safeWindow = Math.max(1, settings.contextWindow);
      const recentChunks = sourceChunks.slice(-safeWindow);
      const transcript = recentChunks.map((chunk) => chunk.text).join("\n").trim();

      if (sourceChunks.length === 0 || transcript === "") {
        return;
      }

      const sig = suggestionWindowSignature(recentChunks);
      if (chunks !== undefined && sig === lastMicSuggestionSignatureRef.current) {
        return;
      }

      suggestionsInFlightRef.current = true;
      setIsSuggestionsLoading(true);
      const prompt = settings.suggestionPrompt.replace("{{transcript}}", transcript);

      try {
        const response = await suggestions({ transcript, prompt }, apiKey);
        const items = response.suggestions.slice(0, 3).map((item, index) => ({
          id: `${Date.now()}-${index}`,
          preview: item.preview,
          fullPrompt: item.fullPrompt,
        }));
        const timestamp = new Date().toISOString();

        setSuggestionsBatches((batches) => [{ suggestions: items, timestamp }, ...batches]);
        setLastUpdated(timestamp);
        lastMicSuggestionSignatureRef.current = sig;
      } finally {
        suggestionsInFlightRef.current = false;
        setIsSuggestionsLoading(false);
      }
    },
    [transcriptChunks, settings.contextWindow, settings.suggestionPrompt, apiKey],
  );

  const sendChatPrompt = async (displayText: string, prompt: string) => {
    if (chatInFlightRef.current) return;
  
    chatInFlightRef.current = true;
    setIsChatLoading(true);
  
    const userTimestamp = new Date().toISOString();
  
    setChatMessages((messages) => [
      ...messages,
      { role: "user", content: displayText, timestamp: userTimestamp },
    ]);
  
    const safeWindow = Math.max(0, settings.answerContextWindow);
  
    const recentTranscript = transcriptChunks
      .slice(-safeWindow)
      .map((chunk) => chunk.text)
      .join("\n");
  
    // ✅ FIXED PROMPT
    const builtPrompt = settings.chatPrompt
      .replace("{{recent_transcript}}", recentTranscript)
      .replace("{{user_prompt}}", prompt);
  
    try {
      const result = await chat({ prompt: builtPrompt }, apiKey);
  
      setChatMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          content: result.response,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      chatInFlightRef.current = false;
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    if (transcriptChunks.length || suggestionsBatches.length || chatMessages.length) {
      setLastUpdated(new Date().toISOString());
    }
  }, [transcriptChunks, suggestionsBatches, chatMessages]);

  const value = useMemo(
    () => ({
      transcriptChunks,
      setTranscriptChunks,
      suggestionsBatches,
      setSuggestionsBatches,
      chatMessages,
      setChatMessages,
      lastUpdated,
      setLastUpdated,
      refreshSuggestions,
      sendChatPrompt,
      isSuggestionsLoading,
      isChatLoading,
      isRecording,
      setIsRecording,
      apiKey,
      setApiKey,
      settings,
      setSettings,
    }),
    [
      transcriptChunks,
      suggestionsBatches,
      chatMessages,
      lastUpdated,
      isSuggestionsLoading,
      isChatLoading,
      isRecording,
      apiKey,
      settings,
      refreshSuggestions,
      sendChatPrompt,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
