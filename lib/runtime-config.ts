import { isStateCode, type StateCode } from "@/lib/claim-facts";

export type AppMode = "prototype" | "pilot";

function appMode(): AppMode {
  return process.env.APP_MODE === "pilot" ? "pilot" : "prototype";
}

export function runtimeConfig() {
  const mode = appMode();
  const foundationReady = process.env.PRODUCTION_FOUNDATION_READY === "true";

  if (mode === "pilot" && !foundationReady) {
    throw new Error(
      "Pilot mode is locked until durable storage and staff authentication pass the production gate.",
    );
  }

  const allowedStates = new Set<StateCode>(
    (process.env.PILOT_ALLOWED_STATES ?? "")
      .split(",")
      .map((value) => value.trim().toUpperCase())
      .filter(isStateCode),
  );

  return {
    mode,
    isPilot: mode === "pilot",
    foundationReady,
    allowedStates,
    supportEmail: process.env.SUPPORT_EMAIL?.trim() || null,
  } as const;
}

export function isStateEligibleForPilot(state: StateCode): boolean {
  const config = runtimeConfig();
  return !config.isPilot || config.allowedStates.has(state);
}

