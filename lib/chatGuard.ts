/**
 * Deterministic pre-check that runs BEFORE any chat message reaches
 * Gemini. Obvious medical/diagnostic questions are intercepted here with a
 * canned, reliable redirect-to-a-doctor response -- this does not depend
 * on the LLM choosing to follow its refusal instructions, which makes it
 * easy to unit test and guarantees the behavior even if the model
 * misbehaves.
 */
import type { SupportedLanguage } from "./constants";

const MEDICAL_KEYWORDS = [
  "diagnos",
  "do i have",
  "does my child have",
  "symptom",
  "disease",
  "medication",
  "medicine dose",
  "prescri",
  "is it safe for my pregnan",
  "asthma attack",
  "heart attack",
  "chest pain",
  "difficulty breathing",
  "treat my",
  "cure",
];

/** True when the message is asking for a diagnosis, symptom interpretation, or treatment advice. */
export function isMedicalQuery(message: string): boolean {
  const lower = message.toLowerCase();
  return MEDICAL_KEYWORDS.some((keyword) => lower.includes(keyword));
}

const REDIRECT_MESSAGE: Record<SupportedLanguage, string> = {
  en: "I can't help with diagnosis, symptoms, or treatment -- please contact a doctor or local health service for anything medical. I'm happy to help with air-quality routines, indoor air hacks, or masks for today's AQI instead.",
  hi: "मैं निदान, लक्षण या इलाज में मदद नहीं कर सकता -- किसी भी चिकित्सीय मामले के लिए कृपया डॉक्टर या स्थानीय स्वास्थ्य सेवा से संपर्क करें। मैं आज के AQI के अनुसार दिनचर्या, घर की हवा साफ़ रखने के उपाय या मास्क को लेकर मदद कर सकता हूँ।",
  gu: "હું નિદાન, લક્ષણો કે સારવારમાં મદદ કરી શકતો નથી -- કોઈપણ તબીબી બાબત માટે કૃપા કરીને ડૉક્ટર અથવા સ્થાનિક આરોગ્ય સેવાનો સંપર્ક કરો. હું આજના AQI મુજબ દિનચર્યા, ઘરની હવા સ્વચ્છ રાખવાના ઉપાયો અથવા માસ્ક અંગે મદદ કરી શકું છું.",
};

export function getMedicalRedirectMessage(language: SupportedLanguage): string {
  return REDIRECT_MESSAGE[language];
}
