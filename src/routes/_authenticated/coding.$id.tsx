import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Play, Send, Lightbulb, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { runInBrowser, type CaseResult, type TestCase } from "@/lib/runner";
import { judgeCode } from "@/lib/ai.functions";
import { DifficultyBadge } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/coding/$id")({
  head: () => ({ meta: [{ title: "Coding problem — AMUPAL PLACE FLOW" }, { name: "description", content: "Write, run and submit your solution." }, { property: "og:title", content: "Coding problem — AMUPAL PLACE FLOW" }, { property: "og:description", content: "Solve this coding problem." }] }),
  component: CodingProblem,
});

const LANGS = [
  { id: "javascript", label: "JavaScript" }, { id: "python", label: "Python" }, { id: "java", label: "Java" }, { id: "cpp", label: "C++" }, { id: "c", label: "C" },
] as const;

function CodingProblem() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const judge = useServerFn(judgeCode);
  const { data: q } = useQuery({
    queryKey: ["coding", id],
    queryFn: async () => (await supabase.from("questions").select("*").eq("id", id).single()).data,
  });
  const isSql = q?.category === "sql";
  const starter = (q?.starter_code ?? {}) as Record<string, string>;
  const [lang, setLang] = useState<string>("javascript");
  const [code, setCode] = useState("");
  const [results, setResults] = useState<CaseResult[] | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<"run" | "submit" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => { if (q) setCode(isSql ? starter.sql ?? "" : starter[lang] ?? ""); }, [q, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!q) return <div className="text-muted-foreground">Loading…</div>;
  const tests = (q.test_cases ?? []) as TestCase[];
  const effLang = isSql ? "sql" : lang;

  async function execute(): Promise<CaseResult[]> {
    setErr(null); setLogs([]);
    if (effLang === "javascript" || effLang === "python") {
      const r = await runInBrowser(effLang, code, starter.fn, tests);
      setLogs(r.logs);
      if (r.error) { setErr(r.error); return []; }
      return r.results;
    }
    const r = await judge({ data: { prompt: q!.prompt, language: effLang, code, tests } });
    if (!r.compiled) setErr("Compilation error (AI-evaluated). " + r.feedback);
    else setLogs([`AI evaluation: ${r.feedback}`]);
    return r.results;
  }

  async function run() {
    setBusy("run");
    try { setResults(await execute()); } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  }

  async function submit() {
    setBusy("submit");
    try {
      const r = await execute();
      setResults(r);
      const total = Math.max(r.length, isSql ? 1 : tests.length);
      const passed = r.filter((x) => x.passed).length;
      const { error } = await supabase.rpc("record_activity", { _module: "coding", _question: q!.id, _score: passed, _max: total, _answer: code, _feedback: { language: effLang, passed, total } });
      if (error) throw error;
      setSubmitted(true);
      qc.invalidateQueries();
      passed === total ? toast.success(`All ${total} tests passed! 🎉`) : toast.info(`${passed}/${total} tests passed`);
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  }

  return (
    <div>
      <Link to="/coding" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />All problems</Link>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="solid-panel p-6">
          <div className="mb-3 flex gap-2"><DifficultyBadge d={q.difficulty} /><span className="rounded-full border border-border px-2.5 py-0.5 text-xs">{q.topic}</span></div>
          <p className="whitespace-pre-wrap leading-relaxed">{q.prompt}</p>
          {tests.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 text-sm font-semibold">Test cases</div>
              <div className="space-y-2 font-mono text-xs">
                {tests.map((t, i) => <div key={i} className="rounded-lg bg-background/60 p-2">{starter.fn}({JSON.stringify(t.input).slice(1, -1)}) → {JSON.stringify(t.output)}</div>)}
              </div>
            </div>
          )}
          <Button variant="outline" size="sm" className="mt-5 rounded-full" onClick={() => setShowHint(!showHint)}><Lightbulb className="mr-1 h-4 w-4" />{showHint ? "Hide hint" : "Show hint"}</Button>
          {showHint && <p className="mt-3 rounded-lg bg-primary/10 p-3 text-sm">{q.hint}</p>}
          {submitted && (
            <div className="mt-5 space-y-3">
              <p className="rounded-lg bg-electric/10 p-3 text-sm"><b>Explanation: </b>{q.explanation}</p>
              <div><div className="mb-1 text-sm font-semibold">Reference solution</div><pre className="overflow-x-auto rounded-lg bg-background/60 p-3 font-mono text-xs">{q.model_answer}</pre></div>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="solid-panel overflow-hidden">
            <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
              {isSql ? <span className="px-3 py-1 text-sm font-semibold text-primary">SQL</span> : LANGS.map((l) => (
                <button key={l.id} onClick={() => setLang(l.id)} className={cn("rounded-lg px-3 py-1 text-sm", lang === l.id ? "bg-primary/20 text-primary" : "text-muted-foreground")}>{l.label}</button>
              ))}
              <span className="ml-auto pr-2 text-[11px] text-muted-foreground">{effLang === "javascript" || effLang === "python" ? "Runs in your browser" : "AI-evaluated"}</span>
            </div>
            <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false}
              onKeyDown={(e) => { if (e.key === "Tab") { e.preventDefault(); const t = e.currentTarget; const s = t.selectionStart; setCode(code.slice(0, s) + "  " + code.slice(t.selectionEnd)); requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = s + 2; }); } }}
              className="h-80 w-full resize-y bg-background/50 p-4 font-mono text-sm leading-6 outline-none" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={run} disabled={!!busy} className="rounded-full"><Play className="mr-1 h-4 w-4" />{busy === "run" ? "Running…" : "Run Code"}</Button>
            <Button onClick={submit} disabled={!!busy} className="bg-gradient-primary rounded-full font-bold"><Send className="mr-1 h-4 w-4" />{busy === "submit" ? "Submitting…" : "Submit Solution"}</Button>
          </div>
          <div className="solid-panel p-4">
            <div className="mb-2 text-sm font-semibold">Output</div>
            {err && <pre className="whitespace-pre-wrap text-sm text-destructive">{err}</pre>}
            {logs.length > 0 && <pre className="mb-2 whitespace-pre-wrap font-mono text-xs text-muted-foreground">{logs.join("\n")}</pre>}
            {results ? (
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className={cn("rounded-lg border p-2 font-mono text-xs", r.passed ? "border-success/40 bg-success/10" : "border-destructive/40 bg-destructive/10")}>
                    <div className="flex items-center gap-1 font-sans text-sm font-semibold">{r.passed ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}Test {i + 1}</div>
                    <div>Input: {r.input}</div><div>Expected: {r.expected}</div><div>Got: {r.actual}</div>
                  </div>
                ))}
              </div>
            ) : !err && <p className="text-sm text-muted-foreground">Run your code to see results.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
