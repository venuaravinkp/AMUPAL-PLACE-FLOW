import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Flag, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fmtTime } from "@/lib/data";
import { DifficultyBadge } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/test/$attemptId")({
  head: () => ({ meta: [{ title: "Test in progress — AMUPAL PLACE FLOW" }, { name: "description", content: "Timed test." }, { property: "og:title", content: "Test — AMUPAL PLACE FLOW" }, { property: "og:description", content: "Timed placement test." }] }),
  component: TestRunner,
});

function TestRunner() {
  const { attemptId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: async () => {
      const { data: a, error } = await supabase.from("test_attempts").select("*").eq("id", attemptId).single();
      if (error) throw error;
      const [qs, opts] = await Promise.all([
        supabase.from("questions").select("id,prompt,topic,difficulty,category").in("id", a.question_ids),
        supabase.from("answer_options").select("id,question_id,label,position").in("question_id", a.question_ids).order("position"),
      ]);
      const order = new Map(a.question_ids.map((id, i) => [id, i]));
      const questions = (qs.data ?? []).sort((x, y) => (order.get(x.id)! - order.get(y.id)!));
      return { attempt: a, questions, options: opts.data ?? [] };
    },
  });
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [left, setLeft] = useState<number | null>(null);
  const submitting = useRef(false);

  const submit = useCallback(async (auto = false) => {
    if (!data || submitting.current) return;
    submitting.current = true;
    const payload = data.questions.map((q) => ({ question_id: q.id, option_id: answers[q.id] ?? "", marked: !!marked[q.id] }));
    const { error } = await supabase.rpc("submit_attempt", { _attempt: attemptId, _answers: payload });
    if (error) { submitting.current = false; return toast.error(error.message); }
    if (auto) toast.info("Time's up — your test was submitted automatically.");
    qc.invalidateQueries();
    navigate({ to: "/results/$attemptId", params: { attemptId }, replace: true });
  }, [data, answers, marked, attemptId, navigate, qc]);

  useEffect(() => {
    if (!data) return;
    if (data.attempt.submitted_at) { navigate({ to: "/results/$attemptId", params: { attemptId }, replace: true }); return; }
    const end = new Date(data.attempt.started_at).getTime() + data.attempt.duration_sec * 1000;
    const tick = () => setLeft(Math.max(0, Math.round((end - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [data, attemptId, navigate]);

  useEffect(() => { if (left === 0) submit(true); }, [left, submit]);

  if (isLoading || !data) return <div className="text-muted-foreground">Loading test…</div>;
  const q = data.questions[idx];
  const opts = data.options.filter((o) => o.question_id === q.id);
  const answered = Object.keys(answers).length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="glass mb-4 flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="font-display font-bold">{data.attempt.title}</div>
        <div className={cn("flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-lg font-bold", (left ?? 99) < 60 ? "bg-destructive/20 text-destructive" : "bg-primary/15 text-primary")}>
          <Clock className="h-4 w-4" />{left === null ? "--:--" : fmtTime(left)}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="solid-panel p-6 md:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Question {idx + 1} of {data.questions.length}</span>
            <span>· {q.topic}</span>
            <DifficultyBadge d={q.difficulty} />
          </div>
          <p className="whitespace-pre-wrap text-lg font-medium leading-relaxed md:text-xl">{q.prompt}</p>
          <div className="mt-6 space-y-3">
            {opts.map((o, i) => (
              <button key={o.id} onClick={() => setAnswers({ ...answers, [q.id]: o.id })}
                className={cn("flex w-full items-center gap-3 rounded-xl border p-4 text-left transition", answers[q.id] === o.id ? "border-primary bg-primary/15" : "border-border hover:border-primary/50")}>
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold", answers[q.id] === o.id ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{String.fromCharCode(65 + i)}</span>
                {o.label}
              </button>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
            <Button variant="outline" onClick={() => setMarked({ ...marked, [q.id]: !marked[q.id] })} className={cn("rounded-full", marked[q.id] && "border-violet text-violet")}>
              <Flag className="mr-1 h-4 w-4" />{marked[q.id] ? "Marked" : "Mark for review"}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" disabled={idx === 0} onClick={() => setIdx(idx - 1)} className="rounded-full"><ChevronLeft className="h-4 w-4" /></Button>
              {idx < data.questions.length - 1 ? (
                <Button onClick={() => setIdx(idx + 1)} className="rounded-full">Next <ChevronRight className="h-4 w-4" /></Button>
              ) : (
                <Button onClick={() => submit()} className="bg-gradient-primary rounded-full font-bold">Submit test</Button>
              )}
            </div>
          </div>
        </div>
        <div className="glass h-fit p-4">
          <div className="mb-3 text-sm font-semibold">Questions · {answered}/{data.questions.length} answered</div>
          <div className="grid grid-cols-5 gap-2">
            {data.questions.map((qq, i) => (
              <button key={qq.id} onClick={() => setIdx(i)}
                className={cn("aspect-square rounded-lg border text-sm font-semibold", i === idx && "ring-2 ring-primary", marked[qq.id] ? "border-violet bg-violet/25" : answers[qq.id] ? "border-success bg-success/20" : "border-border")}>
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-1 text-xs text-muted-foreground">
            <div><span className="mr-1 inline-block h-2 w-2 rounded-full bg-success" />Answered</div>
            <div><span className="mr-1 inline-block h-2 w-2 rounded-full bg-violet" />Marked for review</div>
          </div>
          <Button onClick={() => { if (confirm("Submit your test now?")) submit(); }} variant="outline" className="mt-4 w-full rounded-full">Submit now</Button>
        </div>
      </div>
    </div>
  );
}
