import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

/**
 * Shared "card" surface (rounded border + background) used by almost every
 * panel in the app (plan sections, chat, community widgets, the
 * simulator). Pulled out once here instead of copy-pasting the same
 * Tailwind string into a dozen components -- the exact bug this file
 * fixes (see git history / code-quality review).
 */
export function Card<T extends ElementType = "div">({ as, className = "", children, ...rest }: { as?: T; className?: string; children: ReactNode } & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag className={`flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * The heading that sits at the top of a Card. `as="h2"` for primary
 * sections (routine tweaks, indoor hacks, ...), `as="h3"` for nested
 * sub-widgets (the community-mode cards inside the "Community mode"
 * section). Font size scales with heading level automatically.
 */
export function CardHeading({ as = "h2", id, className = "", children }: { as?: "h2" | "h3"; id?: string; className?: string; children: ReactNode }) {
  const Tag = as;
  const sizeClass = as === "h3" ? "text-sm" : "text-base";
  return (
    <Tag id={id} className={`${sizeClass} font-semibold text-slate-900 dark:text-white ${className}`.trim()}>
      {children}
    </Tag>
  );
}
