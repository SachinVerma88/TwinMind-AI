"use client";

import { AppStateProvider } from "@/state/app-state";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AppStateProvider>{children}</AppStateProvider>;
}
