/**
 * Static catalogue of Neighborhood Pledge actions. Each item's impact
 * numbers reuse the same documented factor table as the rest of the app
 * (lib/emissions.ts) with clearly-labeled representative assumptions --
 * there is no separate/duplicated math here, just different default
 * inputs sized for a household-level pledge rather than a single commute.
 */
import { avoidBurningImpact, carpoolImpact, heatingSwitchImpact, transportSwitchImpact } from "./emissions";
import type { SupportedLanguage } from "./constants";

export interface PledgeItem {
  id: string;
  label: Record<SupportedLanguage, string>;
  co2eGramsAvoidedPerDay: number;
  pmGramsAvoidedPerDay: number;
}

const REPRESENTATIVE_COMMUTE_KM = 8;

function toPerDay(impact: { co2eGramsAvoided: number; pmGramsAvoided: number }): { co2eGramsAvoidedPerDay: number; pmGramsAvoidedPerDay: number } {
  return { co2eGramsAvoidedPerDay: impact.co2eGramsAvoided, pmGramsAvoidedPerDay: impact.pmGramsAvoided };
}

export const PLEDGE_ITEMS: PledgeItem[] = [
  {
    id: "no-waste-burning",
    label: { en: "I will not burn leaves, waste, or wood outdoors", hi: "मैं बाहर पत्तियाँ, कचरा या लकड़ी नहीं जलाऊँगा/जलाऊँगी", gu: "હું બહાર પાંદડા, કચરો કે લાકડું નહીં બાળું" },
    ...toPerDay(avoidBurningImpact(5)),
  },
  {
    id: "carpool-weekly",
    label: { en: "I will carpool or share rides at least once a week", hi: "मैं सप्ताह में कम से कम एक बार कारपूल करूँगा/करूँगी", gu: "હું અઠવાડિયામાં ઓછામાં ઓછું એકવાર કારપૂલ કરીશ" },
    ...toPerDay(carpoolImpact(REPRESENTATIVE_COMMUTE_KM, 3)),
  },
  {
    id: "use-public-transport",
    label: { en: "I will swap one car trip a week for metro/bus", hi: "मैं हफ़्ते में एक कार यात्रा मेट्रो/बस से करूँगा/करूँगी", gu: "હું અઠવાડિયામાં એક કાર મુસાફરી મેટ્રો/બસથી કરીશ" },
    ...toPerDay(transportSwitchImpact("car", "metro", REPRESENTATIVE_COMMUTE_KM)),
  },
  {
    id: "switch-heating",
    label: { en: "I will avoid wood/coal heating on high-pollution days", hi: "मैं अधिक प्रदूषण वाले दिनों में लकड़ी/कोयले की हीटिंग से बचूँगा/बचूँगी", gu: "હું વધુ પ્રદૂષણવાળા દિવસોમાં લાકડા/કોલસાની હીટિંગ ટાળીશ" },
    ...toPerDay(heatingSwitchImpact("wood_coal", "electric")),
  },
];

export function sumPledgeImpact(checkedIds: string[]): { co2eGramsAvoidedPerDay: number; pmGramsAvoidedPerDay: number } {
  return PLEDGE_ITEMS.filter((item) => checkedIds.includes(item.id)).reduce(
    (acc, item) => ({
      co2eGramsAvoidedPerDay: acc.co2eGramsAvoidedPerDay + item.co2eGramsAvoidedPerDay,
      pmGramsAvoidedPerDay: acc.pmGramsAvoidedPerDay + item.pmGramsAvoidedPerDay,
    }),
    { co2eGramsAvoidedPerDay: 0, pmGramsAvoidedPerDay: 0 }
  );
}
