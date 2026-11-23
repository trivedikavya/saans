"use client";

/** Lazy-loading wrapper for the What-If simulator -- see WhatIfSimulatorInner.tsx for the actual UI/logic. */
import dynamic from "next/dynamic";
import type { SupportedLanguage } from "@/lib/constants";

// Lazy-loaded so the simulator's JS only ships once the dashboard actually renders it.
const WhatIfSimulatorInner = dynamic(() => import("./WhatIfSimulatorInner"), {
  ssr: false,
  loading: () => <div className="h-40 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />,
});

export function WhatIfSimulator(props: { pm25: number; commuteMode: string; commuteDistanceKm: number; language: SupportedLanguage }) {
  return <WhatIfSimulatorInner {...props} />;
}
