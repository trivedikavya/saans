/**
 * Generates the localized, WhatsApp-ready text brief for Community Mode.
 * Pure and deterministic (template-based, not an LLM call) so it works
 * offline and never leaks profile/health data -- only the city name and
 * AQI figures (already public, non-sensitive) go into the message.
 */
import { getAqiBand, getMaskGuidance } from "./aqi";
import type { SupportedLanguage } from "./constants";

const TEMPLATES: Record<SupportedLanguage, (city: string, aqi: number, bandLabel: string, maskNote: string) => string> = {
  en: (city, aqi, bandLabel, maskNote) =>
    `Air Quality Update for ${city}\nCurrent AQI: ${aqi} (${bandLabel})\n${maskNote}\nLet's look out for each other this winter -- avoid burning waste/wood, carpool where possible, and keep young kids and seniors indoors during peak pollution hours.\n- Shared via the Saans app`,
  hi: (city, aqi, bandLabel, maskNote) =>
    `${city} के लिए वायु गुणवत्ता अपडेट\nवर्तमान AQI: ${aqi} (${bandLabel})\n${maskNote}\nइस सर्दी एक-दूसरे का ध्यान रखें -- कचरा/लकड़ी जलाने से बचें, जहाँ संभव हो कारपूल करें, और प्रदूषण के पीक समय में बच्चों व बुज़ुर्गों को घर के अंदर रखें।\n- Saans ऐप से साझा किया गया`,
  gu: (city, aqi, bandLabel, maskNote) =>
    `${city} માટે હવા ગુણવત્તા અપડેટ\nવર્તમાન AQI: ${aqi} (${bandLabel})\n${maskNote}\nઆ શિયાળામાં એકબીજાનું ધ્યાન રાખીએ -- કચરો/લાકડું બાળવાનું ટાળો, શક્ય હોય ત્યાં કારપૂલ કરો, અને પ્રદૂષણના ટોચના સમયે બાળકો અને વડીલોને ઘરની અંદર રાખો.\n- Saans એપ દ્વારા શેર કરાયું`,
};

const MASK_NOTE: Record<SupportedLanguage, (recommended: boolean) => string> = {
  en: (recommended) => (recommended ? "Masks (N95/FFP2) recommended for anyone heading outside." : "Masks are optional for most people today."),
  hi: (recommended) => (recommended ? "बाहर जाने वाले सभी लोगों के लिए मास्क (N95/FFP2) की सलाह दी जाती है।" : "आज अधिकतर लोगों के लिए मास्क वैकल्पिक है।"),
  gu: (recommended) => (recommended ? "બહાર જનાર દરેક માટે માસ્ક (N95/FFP2) ભલામણ કરેલ છે." : "આજે મોટાભાગના લોકો માટે માસ્ક વૈકલ્પિક છે."),
};

export function buildCommunityBrief(params: { city: string; usAqi: number; language: SupportedLanguage }): string {
  const { city, usAqi, language } = params;
  const band = getAqiBand(usAqi);
  const maskRecommended = getMaskGuidance(usAqi, "adult").recommendation !== "none";
  const maskNote = MASK_NOTE[language](maskRecommended);
  return TEMPLATES[language](city, Math.round(usAqi), band.label, maskNote);
}
