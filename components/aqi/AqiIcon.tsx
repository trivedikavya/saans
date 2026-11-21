import type { AqiBand } from "@/lib/constants";

/**
 * A distinct glyph per AQI band so severity is never conveyed by color
 * alone -- every badge pairs this icon with the band's text label too.
 */
export function AqiIcon({ icon, className }: { icon: AqiBand["icon"]; className?: string }) {
  const common = { className, "aria-hidden": true, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (icon) {
    case "check":
      return (
        <svg {...common}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case "cloud":
      return (
        <svg {...common}>
          <path d="M17.5 19H8a5 5 0 1 1 1.3-9.8A6 6 0 0 1 20 11a4 4 0 0 1 2 7.4" />
        </svg>
      );
    case "mask":
      return (
        <svg {...common}>
          <rect x="3" y="9" width="18" height="8" rx="4" />
          <path d="M8 9V7a4 4 0 0 1 8 0v2" />
        </svg>
      );
    case "alert":
      return (
        <svg {...common}>
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.3 3.9 2.1 18a2 2 0 0 0 1.7 3h16.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      );
    case "alert-triangle":
      return (
        <svg {...common}>
          <path d="M12 9v4" />
          <circle cx="12" cy="17" r="0.1" fill="currentColor" />
          <path d="M10.3 3.9 2.1 18a2 2 0 0 0 1.7 3h16.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          <path d="M12 2v2" />
        </svg>
      );
    case "hazard":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M4.9 4.9 19.1 19.1" />
          <path d="M19.1 4.9 4.9 19.1" />
        </svg>
      );
    default:
      return null;
  }
}
