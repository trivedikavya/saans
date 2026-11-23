import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "pill" | "sm" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50",
  secondary: "border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  pill: "px-3 py-1.5 text-sm",
  sm: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

/**
 * Returns the shared button className string so both real `<button>`
 * elements (via the `Button` component below) and `<a>`/`<Link>` elements
 * styled as buttons (e.g. the share-card download link) can use the exact
 * same visual language without duplicating the Tailwind string.
 */
export function buttonClassName(variant: ButtonVariant = "primary", size: ButtonSize = "sm"): string {
  return `rounded-full font-semibold transition ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = "primary", size = "sm", className = "", type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={`${buttonClassName(variant, size)} ${className}`.trim()} {...rest} />;
}
