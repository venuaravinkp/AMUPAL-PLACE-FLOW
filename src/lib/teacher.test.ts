import { describe, it, expect } from "vitest";
import { buildTeacherSystem, parseIsoDuration, MODES } from "./teacher";

describe("teacher", () => {
  it("offers the 8 teaching modes", () => expect(MODES).toHaveLength(8));
  it("Teach Me Again forbids repeating the previous answer", () => {
    const s = buildTeacherSystem("again", "OLD EXPLANATION");
    expect(s).toContain("OLD EXPLANATION");
    expect(s).toContain("do NOT repeat");
  });
  it("other modes do not include previous answer", () => expect(buildTeacherSystem("simple", "OLD")).not.toContain("OLD"));
  it("formats video durations", () => {
    expect(parseIsoDuration("PT1H2M3S")).toBe("1:02:03");
    expect(parseIsoDuration("PT9M5S")).toBe("9:05");
  });
});
