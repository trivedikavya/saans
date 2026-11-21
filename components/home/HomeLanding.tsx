"use client";

import { useRouter } from "next/navigation";
import { useAppState } from "@/app/providers";
import { DEFAULT_PROFILE } from "@/lib/schemas";

const DEMO_LOCATION = { name: "New Delhi, India", latitude: 28.6139, longitude: 77.209 };

export function HomeLanding() {
  const router = useRouter();
  const { profile, setProfile, setLocation } = useAppState();

  function handleGetStarted() {
    router.push(profile ? "/dashboard" : "/onboarding");
  }

  function handleTryDemo() {
    setProfile({ ...DEFAULT_PROFILE, household: { child: 1, adult: 2, senior: 1 }, hasSensitiveMember: true });
    setLocation(DEMO_LOCATION);
    router.push("/dashboard");
  }

  return (
    <main id="main-content" className="mx-auto flex max-w-3xl flex-1 flex-col justify-center gap-8 px-4 py-16 text-center">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">Saans</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          A GenAI-powered assistant that helps families and communities navigate severe winter smog and urban air pollution. It suggests low-emission daily routines, indoor air quality hacks,
          and sustainable alternatives tailored to their location and lifestyle, while clearly explaining the direct impact of their choices.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button type="button" onClick={handleGetStarted} className="rounded-full bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700">
          Get started
        </button>
        <button
          type="button"
          onClick={handleTryDemo}
          className="rounded-full border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Try demo: New Delhi, high AQI
        </button>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400">No account or API key required to try the demo. All lifestyle data stays on your device.</p>
    </main>
  );
}
