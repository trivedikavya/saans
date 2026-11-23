import type { ReactNode } from "react";
import { Card, CardHeading } from "@/components/ui/Card";

/**
 * Shared Card + heading + list shell for every plan section (routine
 * tweaks, indoor hacks, sustainable alternatives, mask guidance). These
 * four components used to each hand-roll an identical
 * section/h2/ul/li skeleton around genuinely different per-item content --
 * this pulls out ONLY the identical shell and leaves `renderItem` free to
 * render whatever that section actually needs, instead of forcing a fake
 * one-size-fits-all item template onto data shapes that legitimately
 * differ (routine tweaks have a category + impact chip, mask guidance has
 * a member type + recommendation pill, etc).
 */
export function PlanSection<T>({
  headingId,
  heading,
  items,
  getKey,
  getItemClassName,
  renderItem,
}: {
  headingId: string;
  heading: ReactNode;
  items: T[];
  getKey: (item: T) => string;
  /** Defaults to the standard subtle-border list item; override for special cases (e.g. the dashed myth-busting hack). */
  getItemClassName?: (item: T) => string;
  renderItem: (item: T) => ReactNode;
}) {
  return (
    <Card as="section" aria-labelledby={headingId}>
      <CardHeading id={headingId}>{heading}</CardHeading>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={getKey(item)} className={getItemClassName?.(item) ?? "rounded-lg border border-slate-100 p-3 dark:border-slate-800"}>
            {renderItem(item)}
          </li>
        ))}
      </ul>
    </Card>
  );
}
