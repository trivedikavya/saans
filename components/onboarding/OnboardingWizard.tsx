"use client";

/** The 5-step onboarding wizard (household, commute, home, cooking/heating, language); writes the finished profile to localStorage only on "Finish". */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppState } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";
import { DEFAULT_PROFILE, type Profile } from "@/lib/schemas";
import { StepCommute } from "./steps/StepCommute";
import { StepCookingHeating } from "./steps/StepCookingHeating";
import { StepHome } from "./steps/StepHome";
import { StepHousehold } from "./steps/StepHousehold";
import { StepLanguage } from "./steps/StepLanguage";

const TOTAL_STEPS = 5;

export function OnboardingWizard() {
  const router = useRouter();
  const { profile: storedProfile, setProfile } = useAppState();
  const [profile, setLocalProfile] = useState<Profile>(storedProfile ?? DEFAULT_PROFILE);
  const [step, setStep] = useState(1);

  const language = profile.language;

  function patch(update: Partial<Profile>) {
    setLocalProfile((prev) => ({ ...prev, ...update }));
  }

  function handleFinish() {
    setProfile(profile);
    router.push("/dashboard");
  }

  return (
    <main id="main-content" className="mx-auto flex max-w-xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t(language, "onboardingTitle")}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
          {t(language, "onboardingStepOf", { current: step, total: TOTAL_STEPS })}
        </p>
        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
          role="progressbar"
          aria-label={t(language, "onboardingStepOf", { current: step, total: TOTAL_STEPS })}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={step}
        >
          <div className="h-full rounded-full bg-blue-600 transition-[width]" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
      </div>

      <form
        className="flex flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        onSubmit={(e) => {
          e.preventDefault();
          if (step < TOTAL_STEPS) setStep(step + 1);
          else handleFinish();
        }}
      >
        {step === 1 && <StepHousehold profile={profile} onChange={patch} />}
        {step === 2 && <StepCommute profile={profile} onChange={patch} />}
        {step === 3 && <StepHome profile={profile} onChange={patch} />}
        {step === 4 && <StepCookingHeating profile={profile} onChange={patch} />}
        {step === 5 && <StepLanguage profile={profile} onChange={patch} />}

        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="secondary" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
            {t(language, "back")}
          </Button>
          <Button type="submit">{step < TOTAL_STEPS ? t(language, "next") : t(language, "finish")}</Button>
        </div>
      </form>
    </main>
  );
}
