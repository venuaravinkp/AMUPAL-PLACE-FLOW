import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/data";
import { PageHeader } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — AMUPAL PLACE FLOW" }, { name: "description", content: "Manage questions, tests and student performance." }, { property: "og:title", content: "Admin — AMUPAL PLACE FLOW" }, { property: "og:description", content: "Trainer dashboard." }] }),
  component: Admin,
});

const blankQ = { id: "", module: "aptitude", category: "quant", topic: "", company: "", difficulty: "easy", qtype: "mcq", prompt: "", explanation: "", model_answer: "", time_limit_sec: 60, options: ["", "", "", ""], correct: 0 };

function Admin() {
  const { data: me } = useMe();
  if (me && !me.isStaff) return <p className="text-muted-foreground">You need an admin or trainer account to view this page.</p>;
  return (
    <div>
      <PageHeader title="Admin / Trainer" subtitle="Manage the question bank, schedule tests and track students." />
      <Link to="/admin/interview-prep" className="mb-4 inline-block"><Button variant="outline" size="sm">Manage company interview questions (CSV upload)</Button></Link>
      <Tabs defaultValue="questions">
        <TabsList><TabsTrigger value="questions">Questions</TabsTrigger><TabsTrigger value="tests">Tests</TabsTrigger><TabsTrigger value="students">Students</TabsTrigger></TabsList>
        <TabsContent value="questions"><Questions /></TabsContent>
        <TabsContent value="tests"><TestsAdmin /></TabsContent>
        <TabsContent value="students"><Students /></TabsContent>
      </Tabs>
    </div>
  );
}

function Questions() {
  const qc = useQueryClient();
  const [f, setF] = useState(blankQ);
  const [filter, setFilter] = useState("");
  const { data } = useQuery({ queryKey: ["admin-qs"], queryFn: async () => (await supabase.from("questions").select("*").order("created_at", { ascending: false })).data ?? [] });
  const set = (k: string, v: unknown) => setF((x) => ({ ...x, [k]: v }));

  async function edit(id: string) {
    const q = data!.find((x) => x.id === id)!;
    const { data: opts } = await supabase.rpc("staff_get_options", { _qid: id });
    const o = opts ?? [];
    setF({ id, module: q.module, category: q.category, topic: q.topic, company: q.company ?? "", difficulty: q.difficulty, qtype: q.qtype, prompt: q.prompt, explanation: q.explanation ?? "", model_answer: q.model_answer ?? "", time_limit_sec: q.time_limit_sec, options: o.length ? o.map((x) => x.label) : ["", "", "", ""], correct: Math.max(0, o.findIndex((x) => x.is_correct)) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function save() {
    if (!f.prompt || !f.topic) return toast.error("Prompt and topic are required");
    const row = { module: f.module, category: f.category, topic: f.topic, company: f.company || null, difficulty: f.difficulty, qtype: f.qtype, prompt: f.prompt, explanation: f.explanation || null, model_answer: f.model_answer || null, time_limit_sec: Number(f.time_limit_sec) };
    let id = f.id;
    if (id) { const { error } = await supabase.from("questions").update(row).eq("id", id); if (error) return toast.error(error.message); }
    else { const { data: ins, error } = await supabase.from("questions").insert(row).select("id").single(); if (error) return toast.error(error.message); id = ins.id; }
    if (f.qtype === "mcq") {
      await supabase.from("answer_options").delete().eq("question_id", id);
      const opts = f.options.filter((o) => o.trim()).map((label, i) => ({ question_id: id, label, is_correct: i === f.correct, position: i + 1 }));
      const { error } = await supabase.from("answer_options").insert(opts);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved"); setF(blankQ); qc.invalidateQueries({ queryKey: ["admin-qs"] });
  }
  async function del(id: string) {
    if (!confirm("Delete this question?")) return;
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-qs"] });
  }
  const sel = "h-9 rounded-md border border-input bg-background px-2 text-sm";
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="solid-panel space-y-3 p-5">
        <h3 className="font-bold">{f.id ? "Edit question" : "Add question"}</h3>
        <div className="grid grid-cols-2 gap-2">
          <select className={sel} value={f.module} onChange={(e) => set("module", e.target.value)}>{["aptitude", "coding", "communication", "interview"].map((m) => <option key={m}>{m}</option>)}</select>
          <select className={sel} value={f.qtype} onChange={(e) => set("qtype", e.target.value)}>{["mcq", "written", "coding"].map((m) => <option key={m}>{m}</option>)}</select>
          <Input placeholder="Category (quant, logical, hr…)" value={f.category} onChange={(e) => set("category", e.target.value)} />
          <Input placeholder="Topic" value={f.topic} onChange={(e) => set("topic", e.target.value)} />
          <Input placeholder="Company (optional)" value={f.company} onChange={(e) => set("company", e.target.value)} />
          <select className={sel} value={f.difficulty} onChange={(e) => set("difficulty", e.target.value)}>{["easy", "medium", "hard"].map((m) => <option key={m}>{m}</option>)}</select>
          <Input type="number" placeholder="Time limit (s)" value={f.time_limit_sec} onChange={(e) => set("time_limit_sec", e.target.value)} />
        </div>
        <Textarea placeholder="Question prompt" value={f.prompt} onChange={(e) => set("prompt", e.target.value)} />
        {f.qtype === "mcq" && f.options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="radio" checked={f.correct === i} onChange={() => set("correct", i)} aria-label="Correct answer" />
            <Input placeholder={`Option ${i + 1}`} value={o} onChange={(e) => set("options", f.options.map((x, j) => (j === i ? e.target.value : x)))} />
          </div>
        ))}
        <Textarea placeholder="Explanation" value={f.explanation} onChange={(e) => set("explanation", e.target.value)} />
        {f.qtype !== "mcq" && <Textarea placeholder="Model answer" value={f.model_answer} onChange={(e) => set("model_answer", e.target.value)} />}
        <div className="flex gap-2"><Button onClick={save} className="rounded-full">Save</Button>{f.id && <Button variant="outline" onClick={() => setF(blankQ)} className="rounded-full">Cancel</Button>}</div>
      </div>
      <div className="solid-panel p-5">
        <Input placeholder="Filter by text, topic or module…" value={filter} onChange={(e) => setFilter(e.target.value)} className="mb-3" />
        <div className="max-h-[70vh] divide-y divide-border overflow-y-auto">
          {(data ?? []).filter((q) => (q.prompt + q.topic + q.module).toLowerCase().includes(filter.toLowerCase())).map((q) => (
            <div key={q.id} className="flex items-start gap-2 py-2 text-sm">
              <div className="min-w-0 flex-1"><div className="truncate">{q.prompt}</div><div className="text-xs text-muted-foreground">{q.module} · {q.topic} · {q.difficulty}{q.company ? ` · ${q.company}` : ""}</div></div>
              <button onClick={() => edit(q.id)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => del(q.id)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TestsAdmin() {
  const qc = useQueryClient();
  const [f, setF] = useState({ title: "", description: "", kind: "aptitude", module: "aptitude", category: "", company: "", difficulty: "", num_questions: 10, duration_min: 15, scheduled_at: "" });
  const { data } = useQuery({ queryKey: ["admin-tests"], queryFn: async () => (await supabase.from("tests").select("*").order("created_at", { ascending: false })).data ?? [] });
  async function create() {
    if (!f.title) return toast.error("Title required");
    const { error } = await supabase.from("tests").insert({ ...f, module: f.module || null, category: f.category || null, company: f.company || null, difficulty: f.difficulty || null, scheduled_at: f.scheduled_at ? new Date(f.scheduled_at).toISOString() : null });
    if (error) return toast.error(error.message);
    toast.success("Test created"); qc.invalidateQueries({ queryKey: ["admin-tests"] });
  }
  async function toggle(id: string, active: boolean) { await supabase.from("tests").update({ active }).eq("id", id); qc.invalidateQueries({ queryKey: ["admin-tests"] }); }
  const set = (k: string, v: unknown) => setF((x) => ({ ...x, [k]: v }));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="solid-panel space-y-2 p-5">
        <h3 className="font-bold">Create & schedule a test</h3>
        <Input placeholder="Title" value={f.title} onChange={(e) => set("title", e.target.value)} />
        <Input placeholder="Description" value={f.description} onChange={(e) => set("description", e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={f.kind} onChange={(e) => set("kind", e.target.value)}>{["aptitude", "communication", "full", "company"].map((k) => <option key={k}>{k}</option>)}</select>
          <Input placeholder="Module (blank = mixed)" value={f.module} onChange={(e) => set("module", e.target.value)} />
          <Input placeholder="Category" value={f.category} onChange={(e) => set("category", e.target.value)} />
          <Input placeholder="Company" value={f.company} onChange={(e) => set("company", e.target.value)} />
          <Input placeholder="Difficulty" value={f.difficulty} onChange={(e) => set("difficulty", e.target.value)} />
          <Input type="number" placeholder="Questions" value={f.num_questions} onChange={(e) => set("num_questions", Number(e.target.value))} />
          <Input type="number" placeholder="Minutes" value={f.duration_min} onChange={(e) => set("duration_min", Number(e.target.value))} />
          <Input type="datetime-local" value={f.scheduled_at} onChange={(e) => set("scheduled_at", e.target.value)} />
        </div>
        <Button onClick={create} className="rounded-full">Create test</Button>
      </div>
      <div className="solid-panel divide-y divide-border p-5">
        {(data ?? []).map((t) => (
          <div key={t.id} className="flex items-center justify-between py-2 text-sm">
            <div><div className="font-semibold">{t.title}</div><div className="text-xs text-muted-foreground">{t.kind} · {t.num_questions} Qs · {t.duration_min} min{t.scheduled_at ? ` · ${new Date(t.scheduled_at).toLocaleString()}` : ""}</div></div>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => toggle(t.id, !t.active)}>{t.active ? "Deactivate" : "Activate"}</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Students() {
  const { data } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const [p, pr, at] = await Promise.all([
        supabase.from("profiles").select("id,full_name,email,college,branch,year,points").order("points", { ascending: false }),
        supabase.from("progress").select("user_id,module,topic,attempted,correct"),
        supabase.from("test_attempts").select("user_id,accuracy").not("submitted_at", "is", null),
      ]);
      return { p: p.data ?? [], pr: pr.data ?? [], at: at.data ?? [] };
    },
  });
  if (!data) return <p className="text-muted-foreground">Loading…</p>;
  const rows = data.p.map((s) => {
    const mine = data.pr.filter((x) => x.user_id === s.id);
    const att = data.at.filter((x) => x.user_id === s.id);
    const avg = att.length ? Math.round(att.reduce((a, b) => a + Number(b.accuracy), 0) / att.length) : null;
    const weak = mine.filter((x) => x.attempted >= 2 && x.correct / x.attempted < 0.6).map((x) => x.topic);
    return { ...s, tests: att.length, avg, weak };
  });
  const classWeak = new Map<string, { a: number; c: number }>();
  data.pr.forEach((x) => { const r = classWeak.get(x.topic) ?? { a: 0, c: 0 }; r.a += x.attempted; r.c += x.correct; classWeak.set(x.topic, r); });
  const cw = [...classWeak.entries()].filter(([, v]) => v.a >= 3).map(([t, v]) => ({ t, acc: Math.round((v.c / v.a) * 100) })).sort((a, b) => a.acc - b.acc).slice(0, 8);
  function download() {
    const csv = ["Name,Email,College,Branch,Year,Points,Tests,Avg accuracy,Weak topics", ...rows.map((r) => [r.full_name, r.email, r.college, r.branch, r.year, r.points, r.tests, r.avg ?? "", r.weak.join("; ")].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "student-report.csv"; a.click();
  }
  return (
    <div className="space-y-4">
      <div className="solid-panel p-5">
        <h3 className="mb-2 font-bold">Class weak topics</h3>
        <div className="flex flex-wrap gap-2">{cw.length ? cw.map((x) => <span key={x.t} className="rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs">{x.t} · {x.acc}%</span>) : <span className="text-sm text-muted-foreground">Not enough data yet.</span>}</div>
      </div>
      <div className="solid-panel overflow-x-auto p-5">
        <div className="mb-3 flex justify-between"><h3 className="font-bold">Student performance</h3><Button size="sm" onClick={download} className="rounded-full"><Download className="mr-1 h-4 w-4" />Download report</Button></div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground"><th className="pb-2">Student</th><th>College</th><th>Points</th><th>Tests</th><th>Avg acc.</th><th>Weak topics</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id} className="border-t border-border"><td className="py-2">{r.full_name ?? r.email}</td><td>{r.college}</td><td>{r.points}</td><td>{r.tests}</td><td>{r.avg !== null ? `${r.avg}%` : "—"}</td><td className="text-xs text-destructive">{r.weak.join(", ")}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
