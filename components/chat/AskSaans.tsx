"use client";

import { useRef, useState } from "react";
import { t } from "@/lib/i18n";
import type { SupportedLanguage } from "@/lib/constants";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const MAX_MESSAGE_LENGTH = 500;

export function AskSaans({ usAqi, pm25, locationName, language }: { usAqi: number; pm25: number; locationName: string; language: SupportedLanguage }) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!trimmed || sending) return;

    const nextTurns: ChatTurn[] = [...turns, { role: "user", content: trimmed }];
    setTurns([...nextTurns, { role: "assistant", content: "" }]);
    setInput("");
    setSending(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextTurns, language, aqi: { usAqi, pm25, locationName } }),
        signal: controller.signal,
      });

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setTurns((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: assistantText };
          return copy;
        });
      }
    } catch {
      setTurns((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: t(language, "errorGeneric") };
        return copy;
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <section aria-labelledby="ask-saans-heading" className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 id="ask-saans-heading" className="text-base font-semibold text-slate-900 dark:text-white">
        {t(language, "chatTitle")}
      </h2>

      <ul aria-live="polite" aria-label="Conversation" className="flex max-h-80 flex-col gap-2 overflow-y-auto">
        {turns.map((turn, i) => (
          <li
            key={i}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
              turn.role === "user" ? "self-end bg-blue-600 text-white" : "self-start bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
            }`}
          >
            {turn.content || (sending && i === turns.length - 1 ? t(language, "loading") : "")}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="ask-saans-input" className="sr-only">
          {t(language, "chatPlaceholder")}
        </label>
        <input
          id="ask-saans-input"
          value={input}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t(language, "chatPlaceholder")}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
        />
        <button type="submit" disabled={sending || !input.trim()} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {t(language, "chatSend")}
        </button>
      </form>
      <p className="text-xs text-slate-600 dark:text-slate-400">{t(language, "chatDisclaimer")}</p>
    </section>
  );
}
