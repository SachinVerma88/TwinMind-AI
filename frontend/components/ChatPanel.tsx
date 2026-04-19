"use client";

import { formatShortTime } from "@/lib/format-time";
import { useAppState } from "@/state/app-state";
import { FormEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ChatPanel() {
  const { chatMessages, isChatLoading, sendChatPrompt } = useAppState();
  const [inputValue, setInputValue] = useState("");
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages, isChatLoading]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = inputValue.trim();
    if (!prompt) {
      return;
    }
    setInputValue("");
    void sendChatPrompt(prompt, prompt);
  };

  const markdownComponents = {
    table: ({ children }: any) => (
      <table className="w-full border-collapse border border-gray-300 my-2">
        {children}
      </table>
    ),
    th: ({ children }: any) => (
      <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-left font-semibold">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="border border-gray-300 px-2 py-1">
        {children}
      </td>
    ),
    p: ({ children }: any) => <p className="mb-2">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc list-inside mb-2">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
    li: ({ children }: any) => <li className="mb-1">{children}</li>,
    strong: ({ children }: any) => <strong className="font-bold">{children}</strong>,
    em: ({ children }: any) => <em className="italic">{children}</em>,
  };

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col rounded-3xl bg-surface-container-high p-5 shadow-app-card md:p-6 lg:h-[calc(100dvh-8rem)] lg:max-h-[calc(100dvh-8rem)] lg:w-96 lg:shrink-0 xl:w-[400px]">
      <div className="mb-4 flex items-center gap-3 md:mb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-inverse-surface text-on-tertiary shadow-lg">
          <span className="material-symbols-outlined text-sm">AS</span>
        </div>
        <h3 className="font-headline text-lg font-bold text-on-surface">Assistant Chat</h3>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
        {chatMessages.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Ask anything about the meeting.</p>
        ) : (
          chatMessages.map((message) =>
            message.role === "assistant" ? (
              <div key={`${message.role}-${message.timestamp}`} className="flex max-w-[85%] flex-col items-start gap-1">
                <div className="rounded-2xl rounded-tl-none border border-outline-variant/10 bg-surface-container-lowest p-3 text-sm leading-relaxed text-on-surface shadow-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{message.content}</ReactMarkdown>
                </div>
                <span className="ml-1 text-[9px] text-on-surface-variant">
                  Assistant · {formatShortTime(message.timestamp)}
                </span>
              </div>
            ) : (
              <div key={`${message.role}-${message.timestamp}`} className="ml-auto flex max-w-[85%] flex-col items-end gap-1">
                <div className="rounded-2xl rounded-tr-none bg-primary p-3 text-sm leading-relaxed text-on-primary shadow-md">
                  {message.content}
                </div>
                <span className="mr-1 text-[9px] text-on-surface-variant">
                  You · {formatShortTime(message.timestamp)}
                </span>
              </div>
            ),
          )
        )}
        <div ref={scrollAnchorRef} />
      </div>
      <form onSubmit={handleSubmit} className="mt-auto pt-4">
        <div className="relative">
          <input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Ask anything about the meeting…"
            disabled={isChatLoading}
            className="w-full rounded-2xl border-none bg-white/70 py-4 pr-14 pl-5 text-sm shadow-inner ring-0 transition-all placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isChatLoading}
            className="absolute top-2 right-2 rounded-xl bg-primary p-2 text-on-primary shadow-lg transition-all hover:bg-primary-dim active:scale-90 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={isChatLoading ? "Sending" : "Send message"}
          >
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] text-on-surface-variant/70 italic">
          AI Assistant can make mistakes. Verify critical info.
        </p>
      </form>
    </section>
  );
}
