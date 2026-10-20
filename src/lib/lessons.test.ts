import { describe, it, expect } from "vitest";
import { getLesson, scoreQuiz, passed } from "./lessons";

describe("percentages lesson", () => {
  const l = getLesson("percentages")!;
  it("scores all-correct as full marks", () => {
    expect(scoreQuiz(l.quiz, l.quiz.map((q) => q.answer))).toBe(l.quiz.length);
  });
  it("needs 60% to pass", () => {
    expect(passed(3, 5, l.passPercent)).toBe(true);
    expect(passed(2, 5, l.passPercent)).toBe(false);
  });
});
