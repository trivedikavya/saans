import type { ReactNode } from "react";

/**
 * The shared loading/error text pattern used wherever a fetch's LoadState
 * needs to render inline (dashboard AQI/plan fetches, city search). Pulled
 * out instead of repeating the same role/aria-live/color combination at
 * every call site.
 */
export function StatusMessage({ status, children }: { status: "loading" | "error"; children: ReactNode }) {
  if (status === "loading") {
    return (
      <p role="status" aria-live="polite" className="text-sm text-slate-600 dark:text-slate-400">
        {children}
      </p>
    );
  }

  return (
    <p role="alert" className="text-sm text-red-600 dark:text-red-400">
      {children}
    </p>
  );
}
