import { describe, expect, it } from "vitest";
import { withPlan, postAuthRedirect } from "./planRedirect";

describe("withPlan", () => {
  it("appends a valid plan to a bare path", () => {
    expect(withPlan("/signup", "monthly")).toBe("/signup?plan=monthly");
    expect(withPlan("/login", "yearly")).toBe("/login?plan=yearly");
  });

  it("returns the path unchanged when there is no plan", () => {
    expect(withPlan("/signup", null)).toBe("/signup");
  });

  it("uses & when the path already has a query string", () => {
    expect(withPlan("/reset-password?foo=1", "monthly")).toBe(
      "/reset-password?foo=1&plan=monthly"
    );
  });

  it("keeps a hash fragment at the end", () => {
    expect(withPlan("/signup#top", "yearly")).toBe("/signup?plan=yearly#top");
  });
});

describe("postAuthRedirect", () => {
  it("preserves ?plan=monthly through authentication", () => {
    expect(postAuthRedirect("?plan=monthly")).toBe("/?plan=monthly");
  });

  it("preserves ?plan=yearly through authentication", () => {
    expect(postAuthRedirect("?plan=yearly")).toBe("/?plan=yearly");
  });

  it("preserves the plan onto a custom destination", () => {
    expect(postAuthRedirect("?plan=monthly", "/account")).toBe(
      "/account?plan=monthly"
    );
  });

  it("drops an invalid plan value rather than propagating it", () => {
    expect(postAuthRedirect("?plan=test")).toBe("/");
    expect(postAuthRedirect("?plan=<script>")).toBe("/");
  });

  it("returns the bare destination when no plan is present", () => {
    expect(postAuthRedirect("")).toBe("/");
    expect(postAuthRedirect("?ref=extension")).toBe("/");
  });

  it("does not coerce near-matches (case-sensitive)", () => {
    expect(postAuthRedirect("?plan=Monthly")).toBe("/");
    expect(postAuthRedirect("?plan=YEARLY")).toBe("/");
  });
});
