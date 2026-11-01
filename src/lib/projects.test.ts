import { describe, expect, it } from "vitest";
import { PROJECTS, projectCompletion, safeProjectUrl, submissionIssues, portfolioMarkdown } from "./projects";

describe("Real-world projects", () => {
  it("includes complete software and non-IT project briefs", () => {
    for (const department of ["computing", "civil"]) {
      const p = PROJECTS.find((x) => x.department === department);
      expect(p?.milestones.length).toBe(4);
      expect(p?.rubric.reduce((n, r) => n + r.points, 0)).toBe(100);
      expect(p?.milestones.every((m) => m.tasks.length > 0 && m.deliverable.length > 0)).toBe(true);
    }
  });
  it("counts only valid distinct milestones", () => {
    expect(projectCompletion(PROJECTS[0], ["scope", "scope", "unknown"])).toBe(25);
  });
  it("requires completed milestones and portfolio evidence before submission", () => {
    const p = PROJECTS[0];
    expect(submissionIssues(p, [], "", "", "")).toHaveLength(3);
    expect(submissionIssues(p, p.milestones.map((m) => m.id), "Built and tested eligibility rules.", "https://github.com/example/project", "")).toEqual([]);
  });
  it("rejects unsafe submission links", () => {
    expect(() => safeProjectUrl("javascript:alert(1)")).toThrow();
    expect(() => safeProjectUrl("https://user:password@example.com")).toThrow();
    expect(safeProjectUrl("https://example.com/report")).toBe("https://example.com/report");
  });
  it("exports the student's actual contribution and evidence", () => {
    const output = portfolioMarkdown(PROJECTS[0], "Implemented eligibility checks", "https://example.com/repo", "");
    expect(output).toContain("Implemented eligibility checks");
    expect(output).toContain("https://example.com/repo");
  });
});