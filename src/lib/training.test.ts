import { describe, expect, it } from "vitest";
import { courseEligible, csvCell, assignmentSchema } from "./training";
describe("certificate and trainer rules", () => {
  it("requires every verified lesson", () => expect(courseEligible(["percentages", "profit-loss"], ["percentages"], 100, 70)).toBe(false));
  it("requires a passing final assessment", () => { expect(courseEligible(["percentages"], ["percentages"], 69, 70)).toBe(false); expect(courseEligible(["percentages"], ["percentages"], 70, 70)).toBe(true); });
  it("rejects a missing assessment", () => expect(courseEligible(["percentages"], ["percentages"], null, 70)).toBe(false));
  it("rejects invalid assignment dates", () => expect(assignmentSchema.safeParse({ student_id: "00000000-0000-0000-0000-000000000001", title: "Practice", notes: "", due_date: "2026-02-30" }).success).toBe(false));
  it("neutralizes spreadsheet formulas", () => expect(csvCell("=1+1")).toBe('"\'=1+1"'));
});