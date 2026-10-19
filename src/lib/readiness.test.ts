import { describe, it, expect } from "vitest";
import { skillScore, readinessScore, weakTopics } from "./readiness";

describe("readiness rules", () => {
  it("uses self-reported baseline when no practice yet", () => {
    expect(skillScore(40, 0, 0)).toBe(40);
  });
  it("fully uses accuracy after 20 attempts", () => {
    expect(skillScore(20, 20, 18)).toBe(90);
  });
  it("blends halfway at 10 attempts", () => {
    expect(skillScore(20, 10, 10)).toBe(60);
  });
  it("weights aptitude 30, coding 30, communication 20, interview 20", () => {
    expect(readinessScore({ aptitude: 100, coding: 0, communication: 0, interview: 0 })).toBe(30);
    expect(readinessScore({ aptitude: 0, coding: 0, communication: 100, interview: 0 })).toBe(20);
  });
  it("flags topics under 60% accuracy with 2+ attempts as weak", () => {
    const w = weakTopics([
      { module: "aptitude", topic: "A", attempted: 5, correct: 2 },
      { module: "aptitude", topic: "B", attempted: 5, correct: 4 },
      { module: "aptitude", topic: "C", attempted: 1, correct: 0 },
    ]);
    expect(w.map((x) => x.topic)).toEqual(["A"]);
  });
});
