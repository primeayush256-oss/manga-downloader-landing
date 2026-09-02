import type { PlanId } from "../config/pricing";

const VALID_PLAN_IDS: readonly PlanId[] = ["monthly", "yearly"];

/**
 * Reads the `?plan=` query parameter used by the extension's upgrade
 * redirect (e.g. `/?plan=monthly`, `/?plan=yearly`).
 *
 * Only the two known plan ids are ever honored. Anything else — missing
 * param, typo, or unexpected input — is ignored and treated as "no plan
 * selected" so arbitrary URL input can never steer application state.
 */
export function getSelectedPlanFromUrl(
  search: string = typeof window !== "undefined" ? window.location.search : ""
): PlanId | null {
  const params = new URLSearchParams(search);
  const raw = params.get("plan");

  if (raw && (VALID_PLAN_IDS as readonly string[]).includes(raw)) {
    return raw as PlanId;
  }

  return null;
}
