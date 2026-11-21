"use client";

import { useState } from "react";
import { buildCommunityBrief } from "@/lib/communityBrief";
import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/constants";

export function WhatsAppBrief({ city, usAqi, language }: { city: string; usAqi: number; language: SupportedLanguage }) {
  const [copied, setCopied] = useState(false);
  const message = buildCommunityBrief({ city, usAqi, language });
  const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be denied/unavailable; the textarea below still lets users select-and-copy manually.
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t(language, "whatsAppBrief")}</h3>
      <label htmlFor="whatsapp-brief-text" className="sr-only">
        {t(language, "whatsAppBrief")}
      </label>
      <textarea id="whatsapp-brief-text" readOnly value={message} rows={6} className="rounded-md border border-slate-300 p-3 text-sm dark:border-slate-600 dark:bg-slate-950" />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleCopy} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
          {copied ? t(language, "copied") : t(language, "copyText")}
        </button>
        <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800">
          {t(language, "shareOnWhatsApp")}
        </a>
      </div>
    </div>
  );
}
