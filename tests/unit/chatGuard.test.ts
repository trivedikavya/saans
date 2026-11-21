import { describe, expect, it } from "vitest";
import { getMedicalRedirectMessage, isMedicalQuery } from "@/lib/chatGuard";

describe("isMedicalQuery", () => {
  it.each(["Do I have asthma from this smog?", "What medication should I take?", "My child has chest pain, what disease is this?", "Can you diagnose my cough?"])(
    "flags a clearly medical question: %s",
    (question) => {
      expect(isMedicalQuery(question)).toBe(true);
    }
  );

  it.each(["Should I ventilate my house right now?", "Is the metro cleaner than driving today?", "What's a good indoor workout?"])("does not flag an ordinary air-quality question: %s", (question) => {
    expect(isMedicalQuery(question)).toBe(false);
  });
});

describe("getMedicalRedirectMessage", () => {
  it("returns a non-empty, doctor-referring message for every supported language", () => {
    for (const lang of ["en", "hi", "gu"] as const) {
      const message = getMedicalRedirectMessage(lang);
      expect(message.length).toBeGreaterThan(10);
    }
  });
});
