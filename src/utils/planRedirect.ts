import { getSelectedPlanFromUrl } from "./planQuery";
import type { PlanId } from "../config/pricing";

/**
 * Plan-parameter preservation across the auth flow.
 *
 * The extension (and the pricing cards on this site) send users to
 * `/login?plan=monthly` or `/signup?plan=yearly`. That selection has to
 * survive the whole authentication journey so the NEXT phase (Razorpay) can
 * start the correct subscription. These helpers thread the plan through
 * links and post-auth redirects using the existing, already-tested
 * `getSelectedPlanFromUrl` validator — no new place decides what a valid
 * plan is.
 */

/**
 * Appends `?plan=<plan>` to a path when a valid plan is present.
 *
 * @param path      target path, e.g. "/signup"
 * @param plan      the plan to carry, or null to carry nothing
 */
export function withPlan(path: string, plan: PlanId | null): string {
  if (!plan) return path;
  const [base, hash] = path.split("#");
  const separator = base.includes("?") ? "&" : "?";
  const query = `${separator}plan=${encodeURIComponent(plan)}`;
  return `${base}${query}${hash ? `#${hash}` : ""}`;
}

/**
 * Where to send a user once they are authenticated.
 *
 * If they arrived carrying a valid plan, keep it on the destination so the
 * payment step can pick it up; otherwise send them to the site root. The
 * plan is re-validated through `getSelectedPlanFromUrl`, so a tampered or
 * unknown value can never propagate.
 *
 * @param search  the current location search string (e.g. window.location.search)
 * @param destination  base path to land on after auth (defaults to "/")
 */
export function postAuthRedirect(
  search: string,
  destination = "/"
): string {
  const plan = getSelectedPlanFromUrl(search);
  return withPlan(destination, plan);
}
