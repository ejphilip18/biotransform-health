"use client";

import { useQuery } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { api } from "../../convex/_generated/api";

const PUBLIC_PATHS = ["/", "/auth"];
const ONBOARDING_PATH = "/onboarding";

export function OnboardingGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const step = useQuery(api.profiles.getOnboardingStep);

  useEffect(() => {
    if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return;
    }

    // Still loading or not authenticated
    if (step === undefined || step === null) return;

    // On /onboarding: if complete, send to dashboard
    if (pathname === ONBOARDING_PATH || pathname.startsWith(ONBOARDING_PATH + "/")) {
      if (step === "complete") {
        router.replace("/dashboard");
      }
      return;
    }

    // Authenticated but onboarding not complete → force onboarding
    if (step !== "complete") {
      router.replace(ONBOARDING_PATH);
    }
  }, [pathname, step, router]);

  return <>{children}</>;
}
