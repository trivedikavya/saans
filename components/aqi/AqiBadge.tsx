import { getAqiBand } from "@/lib/aqi";
import { AqiIcon } from "./AqiIcon";

/** A color+icon+text pill. Color alone never carries meaning: the icon and label are always present too. */
export function AqiBadge({ usAqi, size = "md" }: { usAqi: number; size?: "sm" | "md" }) {
  const band = getAqiBand(usAqi);
  const padding = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${padding}`} style={{ backgroundColor: band.bg, color: band.fg }}>
      <AqiIcon icon={band.icon} className="h-4 w-4" />
      {band.label}
    </span>
  );
}
