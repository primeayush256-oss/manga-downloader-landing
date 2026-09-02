import { describe, expect, it } from "vitest";
import { getSelectedPlanFromUrl } from "./planQuery";

describe("getSelectedPlanFromUrl", () => {
  it("detects ?plan=monthly", () => {
    expect(getSelectedPlanFromUrl("?plan=monthly")).toBe("monthly");
  });

  it("detects ?plan=yearly", () => {
    expect(getSelectedPlanFromUrl("?plan=yearly")).toBe("yearly");
  });

  it("ignores an invalid plan value", () => {
    expect(getSelectedPlanFromUrl("?plan=test")).toBeNull();
  });

  it("ignores unrelated query params", () => {
    expect(getSelectedPlanFromUrl("?ref=extension&utm=abc")).toBeNull();
  });

  it("returns null when there is no query string at all", () => {
    expect(getSelectedPlanFromUrl("")).toBeNull();
  });

  it("is case-sensitive and does not coerce near-matches", () => {
    expect(getSelectedPlanFromUrl("?plan=Monthly")).toBeNull();
    expect(getSelectedPlanFromUrl("?plan=YEARLY")).toBeNull();
  });

  it("ignores attempts to inject unexpected values", () => {
    expect(
      getSelectedPlanFromUrl("?plan=<script>alert(1)</script>")
    ).toBeNull();
  });
});
