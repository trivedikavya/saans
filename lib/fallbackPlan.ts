/**
 * Rule-based plan templates used whenever Gemini is unavailable (no API
 * key, timeout, or repeated validation failure). This produces a
 * `GeminiPlanNarrative`-shaped object with zero network calls, so the demo
 * works with no API keys at all and the app never silently pretends AI is
 * on -- the UI shows an explicit "Offline mode" badge (see meta.source).
 */
import { isOutdoorExertionUnsafe } from "./aqi";
import type { SupportedLanguage } from "./constants";
import type { GeminiPlanNarrative } from "./schemas";

type Copy = {
  bestWindowSafe: (start: number, end: number) => string;
  bestWindowUnsafe: string;
  routineCommute: { title: string; description: string };
  routineExercise: { title: string; description: string };
  routineErrands: { title: string; description: string };
  hackPurifier: { title: string; description: string };
  hackSeal: { title: string; description: string };
  hackDiy: { title: string; description: string };
  hackCooking: { title: string; description: string };
  hackMyth: { title: string; description: string };
  altPublicTransport: { title: string; description: string };
  altCarpool: { title: string; description: string };
  altAvoidBurning: { title: string; description: string };
  maskReason: (member: string) => string;
};

const COPY: Record<SupportedLanguage, Copy> = {
  en: {
    bestWindowSafe: (start, end) => `Air is comparatively cleaner between ${start}:00 and ${end}:00 today -- prefer this window for errands, school runs, or any outdoor time.`,
    bestWindowUnsafe: "No hour today is genuinely safe for extended outdoor time. Keep outings brief and essential, and mask up.",
    routineCommute: { title: "Shift your commute window", description: "Where possible, travel just before or after the smoggiest hours and keep car windows up with recirculation on." },
    routineExercise: { title: "Move exercise indoors or to the cleanest hour", description: "Swap outdoor workouts for an indoor routine, or restrict them to the cleanest forecast window." },
    routineErrands: { title: "Batch your errands", description: "Combine outdoor errands into a single trip during the cleanest window to cut total outdoor exposure time." },
    hackPurifier: { title: "Run a HEPA purifier in the main living room", description: "Place it away from walls, run it continuously on an automatic/medium setting, and close doors to the room it's cleaning." },
    hackSeal: { title: "Seal windows during peak traffic hours", description: "Close windows and doors during the morning and evening traffic peaks, then ventilate briefly during the cleanest window." },
    hackDiy: { title: "Build a DIY Corsi-Rosenthal box", description: "Tape four MERV-13 furnace filters into a cube around a box fan (filters facing inward, fan on top blowing out) for a low-cost air cleaner sized for one room." },
    hackCooking: { title: "Run exhaust ventilation while cooking", description: "Switch on the kitchen exhaust fan or open a kitchen-only window while cooking, especially with LPG, to clear combustion byproducts." },
    hackMyth: { title: "Myth: houseplants clean the air fast enough to matter", description: "Common houseplants remove only trace amounts of particulate matter indoors; they are not a substitute for ventilation or filtration during smog episodes." },
    altPublicTransport: { title: "Swap one car trip a week for metro or bus", description: "Public transport produces far less CO2e and tailpipe PM per passenger-km than a private car." },
    altCarpool: { title: "Carpool for the school or office run", description: "Sharing a ride with 2-3 others cuts your per-person emissions roughly in proportion to the extra occupants, at no extra cost." },
    altAvoidBurning: { title: "Avoid burning leaves, waste, or wood outdoors", description: "Open burning releases a large amount of PM2.5 and CO2e for very little heat; use municipal waste collection instead." },
    maskReason: (member) => `Mask guidance for ${member} household members is based on today's AQI band.`,
  },
  hi: {
    bestWindowSafe: (start, end) => `आज ${start}:00 से ${end}:00 के बीच हवा अपेक्षाकृत साफ़ है -- बाहर जाने के काम इसी समय में करें।`,
    bestWindowUnsafe: "आज कोई भी समय लंबे समय तक बाहर रहने के लिए वास्तव में सुरक्षित नहीं है। बाहर जाना ज़रूरी होने तक सीमित रखें और मास्क पहनें।",
    routineCommute: { title: "आवागमन का समय बदलें", description: "जहाँ संभव हो, सबसे प्रदूषित घंटों से ठीक पहले या बाद में यात्रा करें और कार की खिड़कियाँ बंद रखकर रीसर्कुलेशन चालू रखें।" },
    routineExercise: { title: "व्यायाम घर के अंदर करें", description: "बाहर की कसरत को घर के अंदर की दिनचर्या से बदलें, या इसे सबसे साफ़ समय तक सीमित रखें।" },
    routineErrands: { title: "काम एक साथ निपटाएँ", description: "बाहर के सभी काम सबसे साफ़ समय में एक ही यात्रा में निपटाएँ ताकि कुल बाहरी संपर्क कम हो।" },
    hackPurifier: { title: "मुख्य कमरे में HEPA प्यूरीफायर चलाएँ", description: "इसे दीवार से दूर रखें, लगातार मध्यम सेटिंग पर चलाएँ और कमरे के दरवाज़े बंद रखें।" },
    hackSeal: { title: "व्यस्त समय में खिड़कियाँ बंद रखें", description: "सुबह-शाम के व्यस्त ट्रैफ़िक समय में खिड़कियाँ-दरवाज़े बंद रखें, फिर सबसे साफ़ समय में थोड़ी देर हवा आने दें।" },
    hackDiy: { title: "DIY कोर्सी-रोसेन्थल बॉक्स बनाएँ", description: "चार MERV-13 फ़िल्टर को बॉक्स फैन के चारों ओर टेप करके एक किफ़ायती एयर क्लीनर बनाएँ, जो एक कमरे के लिए उपयुक्त है।" },
    hackCooking: { title: "खाना बनाते समय एग्ज़ॉस्ट चलाएँ", description: "खाना बनाते समय रसोई का एग्ज़ॉस्ट पंखा चालू रखें या खिड़की खोलें, खासकर LPG पर पकाते समय।" },
    hackMyth: { title: "भ्रम: गमले के पौधे हवा तुरंत साफ़ कर देते हैं", description: "आम गमले के पौधे घर के अंदर के कणों की बहुत थोड़ी मात्रा ही हटाते हैं; धुंध के दौरान ये वेंटिलेशन या फ़िल्ट्रेशन का विकल्प नहीं हैं।" },
    altPublicTransport: { title: "हफ़्ते में एक कार यात्रा मेट्रो/बस से करें", description: "सार्वजनिक परिवहन प्रति यात्री बहुत कम CO2e और PM उत्सर्जित करता है।" },
    altCarpool: { title: "स्कूल/ऑफ़िस के लिए कारपूल करें", description: "2-3 लोगों के साथ सवारी साझा करने से प्रति व्यक्ति उत्सर्जन उसी अनुपात में घट जाता है, बिना किसी अतिरिक्त ख़र्च के।" },
    altAvoidBurning: { title: "पत्तियाँ, कचरा या लकड़ी बाहर न जलाएँ", description: "खुले में जलाने से बहुत अधिक PM2.5 और CO2e निकलता है; इसके बजाय नगर निगम कचरा संग्रहण का उपयोग करें।" },
    maskReason: (member) => `${member} सदस्यों के लिए मास्क सुझाव आज के AQI स्तर पर आधारित है।`,
  },
  gu: {
    bestWindowSafe: (start, end) => `આજે ${start}:00 થી ${end}:00 દરમિયાન હવા તુલનાત્મક રીતે સ્વચ્છ છે -- બહારના કામ આ સમયે કરો.`,
    bestWindowUnsafe: "આજે કોઈ પણ કલાક લાંબા સમય માટે બહાર રહેવા માટે ખરેખર સુરક્ષિત નથી. બહાર જવાનું જરૂરી હોય ત્યાં સુધી મર્યાદિત રાખો અને માસ્ક પહેરો.",
    routineCommute: { title: "મુસાફરીનો સમય બદલો", description: "શક્ય હોય ત્યાં સૌથી વધુ પ્રદૂષિત કલાકો પહેલાં અથવા પછી મુસાફરી કરો અને કારની બારીઓ બંધ રાખી રિસર્ક્યુલેશન ચાલુ રાખો." },
    routineExercise: { title: "કસરત ઘરની અંદર કરો", description: "બહારની કસરતને ઘરની અંદરની દિનચર્યાથી બદલો, અથવા તેને સૌથી સ્વચ્છ સમય સુધી મર્યાદિત રાખો." },
    routineErrands: { title: "કામો એકસાથે પતાવો", description: "બહારના બધા કામો સૌથી સ્વચ્છ સમયમાં એક જ મુસાફરીમાં પતાવો જેથી કુલ બહારનો સંપર્ક ઘટે." },
    hackPurifier: { title: "મુખ્ય રૂમમાં HEPA પ્યુરિફાયર ચલાવો", description: "તેને દીવાલથી દૂર રાખો, સતત મધ્યમ સેટિંગ પર ચલાવો અને રૂમના દરવાજા બંધ રાખો." },
    hackSeal: { title: "વ્યસ્ત સમયે બારીઓ બંધ રાખો", description: "સવાર-સાંજના ટ્રાફિક સમયે બારી-બારણાં બંધ રાખો, પછી સૌથી સ્વચ્છ સમયે થોડી વાર હવા આવવા દો." },
    hackDiy: { title: "DIY કોર્સી-રોઝેન્થલ બોક્સ બનાવો", description: "ચાર MERV-13 ફિલ્ટરને બોક્સ ફેનની આસપાસ ટેપ કરીને એક રૂમ માટે યોગ્ય સસ્તું એર ક્લીનર બનાવો." },
    hackCooking: { title: "રસોઈ વખતે એક્ઝોસ્ટ ચલાવો", description: "રસોઈ કરતી વખતે રસોડાનો એક્ઝોસ્ટ ફેન ચાલુ રાખો અથવા બારી ખોલો, ખાસ કરીને LPG પર રાંધતી વખતે." },
    hackMyth: { title: "ભ્રમ: કુંડાના છોડ હવા ઝડપથી સાફ કરે છે", description: "સામાન્ય કુંડાના છોડ ઘરની અંદરના રજકણોનો બહુ ઓછો ભાગ જ દૂર કરે છે; ધુમ્મસ દરમિયાન તે વેન્ટિલેશન કે ફિલ્ટરેશનનો વિકલ્પ નથી." },
    altPublicTransport: { title: "અઠવાડિયામાં એક કાર મુસાફરી મેટ્રો/બસથી કરો", description: "જાહેર પરિવહન પ્રતિ મુસાફર ઘણું ઓછું CO2e અને PM ઉત્સર્જિત કરે છે." },
    altCarpool: { title: "શાળા/ઓફિસ માટે કારપૂલ કરો", description: "2-3 લોકો સાથે સવારી વહેંચવાથી વ્યક્તિદીઠ ઉત્સર્જન તે પ્રમાણમાં ઘટે છે, કોઈ વધારાના ખર્ચ વિના." },
    altAvoidBurning: { title: "પાંદડા, કચરો કે લાકડું બહાર ન બાળો", description: "ખુલ્લામાં બાળવાથી ઘણું PM2.5 અને CO2e નીકળે છે; તેના બદલે નગરપાલિકાની કચરા વ્યવસ્થાનો ઉપયોગ કરો." },
    maskReason: (member) => `${member} સભ્યો માટે માસ્ક સૂચન આજના AQI સ્તર પર આધારિત છે.`,
  },
};

export function generateFallbackPlan(params: { usAqi: number; language: SupportedLanguage; bestWindow: { startHour: number; endHour: number; noSafeWindow: boolean } }): GeminiPlanNarrative {
  const { usAqi, language, bestWindow } = params;
  const copy = COPY[language];
  const unsafeExertion = isOutdoorExertionUnsafe(usAqi);

  return {
    bestOutdoorWindowExplanation: bestWindow.noSafeWindow ? copy.bestWindowUnsafe : copy.bestWindowSafe(bestWindow.startHour, bestWindow.endHour),
    routineTweaks: [
      { id: "commute", category: "commute", title: copy.routineCommute.title, description: copy.routineCommute.description },
      {
        id: "exercise",
        category: "exercise",
        title: copy.routineExercise.title,
        description: unsafeExertion ? `${copy.routineExercise.description} (AQI ${usAqi}: outdoor exertion is not safe today.)` : copy.routineExercise.description,
      },
      { id: "errands", category: "errands", title: copy.routineErrands.title, description: copy.routineErrands.description },
    ],
    indoorHacks: [
      { id: "purifier", type: "purifier", title: copy.hackPurifier.title, description: copy.hackPurifier.description },
      { id: "seal", type: "seal", title: copy.hackSeal.title, description: copy.hackSeal.description },
      { id: "diy", type: "diy", title: copy.hackDiy.title, description: copy.hackDiy.description },
      { id: "cooking", type: "cooking", title: copy.hackCooking.title, description: copy.hackCooking.description },
      { id: "myth", type: "myth", title: copy.hackMyth.title, description: copy.hackMyth.description },
    ],
    sustainableAlternatives: [
      { id: "public-transport", type: "public_transport", title: copy.altPublicTransport.title, description: copy.altPublicTransport.description },
      { id: "carpool", type: "carpool", title: copy.altCarpool.title, description: copy.altCarpool.description },
      { id: "avoid-burning", type: "avoid_burning", title: copy.altAvoidBurning.title, description: copy.altAvoidBurning.description },
    ],
    maskGuidanceReasons: [
      { memberType: "adult", reason: copy.maskReason("adult") },
      { memberType: "child", reason: copy.maskReason("child") },
      { memberType: "senior", reason: copy.maskReason("senior") },
      { memberType: "sensitive", reason: copy.maskReason("sensitive") },
    ],
  };
}
