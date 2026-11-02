import { describe, expect, it } from "vitest";
import { assessResume, emptyResume, containsKeyword, daysUntil, makeWeek, weightedCgpa, cgpaPercentage, taskSchema } from "./career";

describe("resume scoring", () => {
  it("scores an empty resume zero", () => { expect(assessResume(emptyResume, "Python SQL", "computing").score).toBe(0); });
  it("scores complete evidence and full keyword alignment 100", () => {
    const r = { ...emptyResume, name: "Student", email: "student@example.org", role: "Developer", summary: "Software developer building tested solutions for real users.", education: "B.E. Computing, Example College, 2026", skills: "Python, SQL, Git", projects: "Built a Python SQL analysis tool and validated 50 cases with a documented reproducible testing process." };
    expect(assessResume(r, "Python SQL Git", "computing").score).toBe(100);
  });
  it("does not mistake JavaScript for Java", () => { expect(containsKeyword("JavaScript developer", "java")).toBe(false); expect(containsKeyword("C++ developer", "c++")).toBe(true); });
});
describe("study planning", () => {
  it("creates seven days with the exact daily time budget", () => {
    const tasks = makeWeek("2026-12-29", 60, "civil"); expect(tasks).toHaveLength(14);
    expect(tasks[13].due_date).toBe("2027-01-04");
    for (const day of new Set(tasks.map((t) => t.due_date))) expect(tasks.filter((t) => t.due_date === day).reduce((sum, t) => sum + t.minutes, 0)).toBe(60);
    expect(tasks[2].category).toBe("core");
  });
  it("uses weak topics in suggested practice", () => { expect(makeWeek("2026-11-02", 15, "computing", "Time & Work")[0].title).toContain("Time & Work"); });
  it("rejects invalid dates", () => { expect(taskSchema.safeParse({ title: "Study", category: "core", due_date: "2026-02-30", minutes: 30, completed: false }).success).toBe(false); });
  it("counts drive days across year boundaries", () => { expect(daysUntil("2027-01-01", "2026-12-31")).toBe(1); expect(daysUntil("2026-11-01", "2026-11-02")).toBe(-1); });
});
describe("configurable grade calculation", () => {
  it("weights grade points by course credits", () => { expect(weightedCgpa([{ credits: 3, grade: 8 }, { credits: 1, grade: 10 }], 10)).toBe(8.5); });
  it("uses the selected conversion multiplier and offset", () => { expect(cgpaPercentage(8, 9.5, 0)).toBe(76); expect(cgpaPercentage(8, 10, -5)).toBe(75); });
  it("rejects grades above the chosen scale", () => { expect(weightedCgpa([{ credits: 3, grade: 11 }], 10)).toBeNull(); });
});