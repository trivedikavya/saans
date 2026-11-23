"use client";

import { useAppState } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";

export function ThemeToggle() {
  const { theme, toggleTheme, profile } = useAppState();
  const language = profile?.language ?? "en";

  return (
    <Button variant="secondary" size="pill" onClick={toggleTheme} aria-label={theme === "dark" ? t(language, "themeToggleLight") : t(language, "themeToggleDark")}>
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </Button>
  );
}
