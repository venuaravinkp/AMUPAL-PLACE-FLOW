import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ROUNDS = ["Aptitude", "Technical", "HR"] as const;
export const DIFFS = ["Easy", "Medium", "Hard"] as const;
export const REGIONS = ["India", "Global"] as const;
export const CATEGORIES = ["IT Services", "Product", "Consulting", "Startup"] as const;
export const CSV_COLUMNS = ["company_name", "round_type", "question", "difficulty", "topic", "answer", "explanation", "tips"] as const;
export const DISCLAIMER = "Practice questions based on commonly asked topics. Actual interview questions vary.";

export function completionPct(total: number, practised: number) {
  if (!total) return 0;
  return Math.round((Math.min(practised, total) / total) * 100);
}

/** RFC-4180-ish CSV parser (quotes, escaped quotes, newlines in quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  const s = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) {
      if (ch === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && s[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

export type CsvRow = { line: number; company_name: string; round_type: string; question: string; difficulty: string; topic: string; answer: string; explanation: string; tips: string };
export type CsvResult = { valid: CsvRow[]; errors: { line: number; message: string }[] };

const norm = (v: string, list: readonly string[]) => list.find((x) => x.toLowerCase() === v.trim().toLowerCase());

export function validateCsv(text: string): CsvResult {
  const rows = parseCsv(text);
  const errors: CsvResult["errors"] = [];
  const valid: CsvRow[] = [];
  if (!rows.length) return { valid, errors: [{ line: 1, message: "File is empty" }] };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const missing = CSV_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) return { valid, errors: [{ line: 1, message: `Missing columns: ${missing.join(", ")}` }] };
  const seen = new Set<string>();
  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const get = (c: string) => (r[header.indexOf(c)] ?? "").trim();
    const round = norm(get("round_type"), ROUNDS);
    const diff = norm(get("difficulty") || "Easy", DIFFS);
    const msgs: string[] = [];
    if (!get("company_name")) msgs.push("company_name is required");
    if (!get("question")) msgs.push("question is required");
    if (!round) msgs.push(`round_type must be ${ROUNDS.join("/")}`);
    if (!diff) msgs.push(`difficulty must be ${DIFFS.join("/")}`);
    if (msgs.length) return errors.push({ line, message: msgs.join("; ") });
    const key = `${get("company_name").toLowerCase()}|${get("question").toLowerCase()}`;
    if (seen.has(key)) return errors.push({ line, message: "Duplicate row in file (skipped)" });
    seen.add(key);
    valid.push({ line, company_name: get("company_name"), round_type: round!, question: get("question"), difficulty: diff!, topic: get("topic"), answer: get("answer"), explanation: get("explanation"), tips: get("tips") });
  });
  return { valid, errors };
}

export function csvTemplate() {
  return CSV_COLUMNS.join(",") + "\n" + 'TCS,Technical,"What is a pointer?",Easy,C,"A variable that stores a memory address.","Pointers enable dynamic memory.","Draw a memory diagram."\n';
}

export function usePrepStatus() {
  return useQuery({
    queryKey: ["prep-status"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("user_question_status").select("question_id,bookmarked,practised").eq("user_id", u.user!.id);
      return data ?? [];
    },
  });
}

export function usePrepCounts() {
  return useQuery({
    queryKey: ["prep-counts"],
    queryFn: async () => (await supabase.from("company_questions").select("id,company_id")).data ?? [],
  });
}
