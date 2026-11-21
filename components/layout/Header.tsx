"use client";

import Link from "next/link";
import { useAppState } from "@/app/providers";
import { t } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const { profile } = useAppState();
  const language = profile?.language ?? "en";

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <nav aria-label="Primary" className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold text-slate-900 dark:text-white">
          {t(language, "appName")}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/onboarding" className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            {t(language, "navEditProfile")}
          </Link>
          {profile && <LanguageSwitcher />}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
