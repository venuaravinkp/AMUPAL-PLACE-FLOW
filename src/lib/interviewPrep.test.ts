import { describe, it, expect } from "vitest";
import { validateCsv, completionPct, parseCsv } from "./interviewPrep";

const H = "company_name,round_type,question,difficulty,topic,answer,explanation,tips";

describe("interview prep", () => {
  it("completion percent", () => { expect(completionPct(5, 2)).toBe(40); expect(completionPct(0, 0)).toBe(0); });
  it("parses quoted commas", () => { expect(parseCsv('a,"b,c"\n')[0]).toEqual(["a", "b,c"]); });
  it("rejects bad round type", () => {
    const r = validateCsv(`${H}\nTCS,Coding,Q1,Easy,t,a,e,x`);
    expect(r.valid.length).toBe(0); expect(r.errors[0].line).toBe(2);
  });
  it("skips duplicate rows in file", () => {
    const r = validateCsv(`${H}\nTCS,HR,Q1,Easy,t,a,e,x\ntcs,hr,q1,easy,t,a,e,x`);
    expect(r.valid.length).toBe(1); expect(r.errors.length).toBe(1);
  });
  it("reports missing columns", () => { expect(validateCsv("company_name,question\nA,B").errors[0].message).toMatch(/round_type/); });
});
