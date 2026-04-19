"use client";

import { transcribe } from "@/lib/api";
import { useAppState } from "@/state/app-state";
import type { TranscriptChunk } from "@/state/app-state";
import { useEffect, useRef } from "react";

export function FloatingMicButton() {
  const { apiKey, isRecording, refreshSuggestions, setIsRecording, setTranscriptChunks } =
    useAppState();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingAudioChunksRef = useRef<BlobPart[]>([]);
  const isStoppingRef = useRef(false);

  const flushPendingChunks = async () => {
    if (pendingAudioChunksRef.current.length === 0) {
      return;
    }

    const audioBlob = new Blob(pendingAudioChunksRef.current, { type: "audio/webm" });
    pendingAudioChunksRef.current = [];

    if (audioBlob.size === 0) {
      return;
    }

    try {
      const result = await transcribe(audioBlob, apiKey);
      const nextChunk: TranscriptChunk = { text: result.text, timestamp: new Date().toISOString() };
      let nextChunks: TranscriptChunk[] = [];
      setTranscriptChunks((chunks) => {
        nextChunks = [...chunks, nextChunk];
        return nextChunks;
      });
      await refreshSuggestions(nextChunks);
    } catch {
      // Keep recording flow simple for now; ignore transient transcription failures.
    }
  };

  const stopRecording = async () => {
    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      isStoppingRef.current = true;
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.requestData();
        recorder.stop();
      });
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    mediaRecorderRef.current = null;
    await flushPendingChunks();
    isStoppingRef.current = false;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      pendingAudioChunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          pendingAudioChunksRef.current.push(event.data);
        }
      };

      recorder.start(1000);

      chunkTimerRef.current = setInterval(async () => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.requestData();
          await flushPendingChunks();
        }
      }, 30000);
    } catch {
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (isRecording) {
      void startRecording();
      return;
    }

    if (!isStoppingRef.current) {
      void stopRecording();
    }
    // Intentionally depend only on isRecording; recorder lifecycle is ref-driven.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  useEffect(() => {
    return () => {
      void stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed bottom-8 left-1/2 z-45 -translate-x-1/2 lg:bottom-10 lg:left-auto lg:right-10 lg:translate-x-0">
      <div className="group relative">
        {isRecording ? (
          <div className="animate-mic-halo pointer-events-none absolute inset-0 rounded-full bg-primary/25 blur-xl" />
        ) : null}
        <button
          type="button"
          onClick={() => setIsRecording((value) => !value)}
          className={[
            "relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-2xl transition-all duration-300",
            "hover:scale-110 active:scale-95",
            isRecording ? "ring-4 ring-primary/30 ring-offset-2 ring-offset-surface" : "",
          ].join(" ")}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          <span
            className={[
              "text-3xl text-on-primary",
              isRecording ? "material-symbols-filled" : "material-symbols-outlined",
            ].join(" ")}
          >
            🎙️
          </span>
        </button>
        <div className="pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 rounded-lg bg-inverse-surface px-3 py-1.5 text-xs font-bold whitespace-nowrap text-on-tertiary opacity-0 transition-opacity group-hover:opacity-100">
          {isRecording ? "Stop recording" : "Start recording"}
        </div>
      </div>
    </div>
  );
}
