import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/data";
import { GlassCard, PageHeader } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { csvTemplate, validateCsv, type CsvResult, ROUNDS, DIFFS } from "@/lib/interviewPrep";

export const Route = createFileRoute("/_authenticated/admin_/interview-prep")({
  head: () => ({ meta: [{ title: "Manage Interview Prep — AMUPAL PLACE FLOW" }, { name: "description", content: "Add, edit and bulk-upload company interview questions." }, { property: "og:title", content: "Manage Interview Prep" }, { property: "og:description", content: "Admin tools for company interview questions." }] }),
  component: Page,
});

type Q = { id: string; company_id: string; round_type: string; question: string; difficulty: string; topic: string | null; answer: string | null; explanation: string | null; tips: string | null };
const blank = { company_id: "", round_type: "HR", question: "", difficulty: "Easy", topic: "", answer: "", explanation: "", tips: "" };

function Page() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [form, setForm] = useState<typeof blank & { id?: string }>(blank);
  const [csv, setCsv] = useState<CsvResult | null>(null);
  const [busy, setBusy] = useState(false);
  const { data: companies } = useQuery({ queryKey: ["prep-companies"], queryFn: async () => (await supabase.from("companies").select("*").order("name")).data ?? [] });
  const { data: questions } = useQuery({ queryKey: ["admin-prep-qs"], queryFn: async () => ((await supabase.from("company_questions").select("*").order("created_at", { ascending: false })).data ?? []) as Q[] });
  if (me && !me.isStaff) return <p className="text-muted-foreground">You need an admin account to view this page.</p>;
  const name = (id: string) => companies?.find((c) => c.id === id)?.name ?? "—";
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-prep-qs"] }); qc.invalidateQueries({ queryKey: ["prep-counts"] }); qc.invalidateQueries({ queryKey: ["prep-companies"] }); };

  async function save() {
    if (!form.company_id || !form.question.trim()) return toast.error("Company and question are required");
    const { id, ...row } = form;
    const { error } = id ? await supabase.from("company_questions").update(row).eq("id", id) : await supabase.from("company_questions").insert(row);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setForm(blank); refresh();
  }
  async function del(id: string) {
    if (!confirm("Delete this question?")) return;
    const { error } = await supabase.from("company_questions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }
  async function importCsv() {
    if (!csv?.valid.length) return;
    setBusy(true);
    try {
      const map = new Map((companies ?? []).map((c) => [c.name.toLowerCase(), c.id]));
      const newNames = [...new Set(csv.valid.map((r) => r.company_name).filter((n) => !map.has(n.toLowerCase())))];
      if (newNames.length) {
        const { data, error } = await supabase.from("companies").insert(newNames.map((n) => ({ name: n }))).select("id,name");
        if (error) throw error;
        data?.forEach((c) => map.set(c.name.toLowerCase(), c.id));
      }
      const existing = new Set((questions ?? []).map((q) => `${q.company_id}|${q.question.toLowerCase()}`));
      const rows = csv.valid
        .map((r) => ({ company_id: map.get(r.company_name.toLowerCase())!, round_type: r.round_type, question: r.question, difficulty: r.difficulty, topic: r.topic || null, answer: r.answer || null, explanation: r.explanation || null, tips: r.tips || null }))
        .filter((r) => !existing.has(`${r.company_id}|${r.question.toLowerCase()}`));
      if (rows.length) { const { error } = await supabase.from("company_questions").insert(rows); if (error) throw error; }
      toast.success(`Imported ${rows.length} questions (${csv.valid.length - rows.length} already existed)`);
      setCsv(null); refresh();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([csvTemplate()], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "interview-questions-template.csv"; a.click(); URL.revokeObjectURL(url);
  }
  const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Interview Prep" subtitle="Add questions one by one or upload many at once." />
      <Link to="/admin" className="text-sm text-primary">← Back to admin</Link>

      <GlassCard className="space-y-3">
        <h2 className="text-xl font-bold">Bulk upload (CSV)</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadTemplate}><Download className="mr-2 h-4 w-4" />Download template</Button>
          <label className="inline-flex cursor-pointer items-center rounded-md border border-input px-4 py-2 text-sm"><Upload className="mr-2 h-4 w-4" />Choose CSV file
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setCsv(validateCsv(await f.text())); e.target.value = ""; }} />
          </label>
        </div>
        {csv && (
          <div className="solid-panel space-y-2 p-4 text-sm">
            <div><b>{csv.valid.length}</b> valid rows · <b>{csv.errors.length}</b> problems</div>
            {csv.errors.length > 0 && <ul className="max-h-40 overflow-auto text-destructive">{csv.errors.map((e, i) => <li key={i}>Line {e.line}: {e.message}</li>)}</ul>}
            <Button disabled={!csv.valid.length || busy} onClick={importCsv}>{busy ? "Importing…" : `Import ${csv.valid.length} questions`}</Button>
          </div>
        )}
      </GlassCard>

      <GlassCard className="space-y-3">
        <h2 className="text-xl font-bold">{form.id ? "Edit question" : "Add question"}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <select className={sel} value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })}><option value="">Company…</option>{companies?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select className={sel} value={form.round_type} onChange={(e) => setForm({ ...form, round_type: e.target.value })}>{ROUNDS.map((r) => <option key={r}>{r}</option>)}</select>
          <select className={sel} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>{DIFFS.map((r) => <option key={r}>{r}</option>)}</select>
        </div>
        <Input placeholder="Question" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
        <Input placeholder="Topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
        {(["answer", "explanation", "tips"] as const).map((k) => <textarea key={k} placeholder={k[0].toUpperCase() + k.slice(1)} className="min-h-20 w-full rounded-md border border-input bg-background p-3 text-sm" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />)}
        <div className="flex gap-2"><Button onClick={save}>Save</Button>{form.id && <Button variant="outline" onClick={() => setForm(blank)}>Cancel</Button>}</div>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-3 text-xl font-bold">All questions ({questions?.length ?? 0})</h2>
        <ul className="divide-y divide-border">
          {questions?.map((q) => (
            <li key={q.id} className="flex items-start justify-between gap-3 py-3 text-sm">
              <button className="min-w-0 text-left" onClick={() => setForm({ id: q.id, company_id: q.company_id, round_type: q.round_type, question: q.question, difficulty: q.difficulty, topic: q.topic ?? "", answer: q.answer ?? "", explanation: q.explanation ?? "", tips: q.tips ?? "" })}>
                <div className="font-semibold">{q.question}</div>
                <div className="text-xs text-muted-foreground">{name(q.company_id)} · {q.round_type} · {q.difficulty}</div>
              </button>
              <button aria-label="Delete" onClick={() => del(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></button>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
