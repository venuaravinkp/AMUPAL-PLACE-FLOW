import { z } from "zod";
import { validDate } from "./career";

export const assignmentSchema = z.object({ student_id: z.string().uuid(), title: z.string().trim().min(1).max(200), notes: z.string().max(5000), due_date: z.string().refine(validDate) });
export function courseEligible(required: string[], completed: string[], best: number | null, pass: number) {
  return required.length > 0 && required.every((s) => completed.includes(s)) && best !== null && best >= pass;
}
export function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${(/^[=+@\-\t\r]/.test(text) ? "'" : "") + text.replace(/"/g, '""')}"`;
}