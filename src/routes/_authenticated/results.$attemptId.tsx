import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fmtTime, startAttempt } from "@/lib/data";
import { GlassCard, ProgressRing } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/results/$attemptId")({
  head: () => ({ meta: [{ title: "Results — AMUPAL PLACE FLOW" }, { name: "description", content: "Score, accuracy and explanations." }, { property: "og:title", content: "Results — AMUPAL PLACE FLOW" }, { property: "og:description", content: "Your test results." }] }),
  component: Results,
});

function Results() {
  const { attemptId } = Route.useParams();
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["results", attemptId],
    queryFn: async () => {
      const { data: a, error } = await supabase.from("test_attempts").select("*").eq("id", attemptId).single();
      if (error) throw error;
      const [qs, opts, ans, key] = await Promise.all([
        supabase.from("questions").select("id,prompt,topic,explanation,module").in("id", a.question_ids),
        supabase.from("answer_options").select("id,question_id,label,position").in("question_id", a.question_ids).order("position"),
        supabase.from("student_answers").select("question_id,selected_option_id,is_correct,marked_review").eq("attempt_id", attemptId),
        supabase.rpc("attempt_review", { _attempt: attemptId }),
      ]);
      const order = new Map(a.question_ids.map((id, i) => [id, i]));
      return { a, qs: (qs.data ?? []).sort((x, y) => order.get(x.id)! - order.get(y.id)!), opts: opts.data ?? [], ans: ans.data ?? [], key: new Map((key.data ?? []).map((k) => [k.question_id, k.correct_option_id])) };
    },
  });
  if (!data) return <div className="text-muted-foreground">Loading results…</div>;
  const { a } = data;
  const byTopic = new Map<string, { t: number; c: number; module: string }>();
  for (const q of data.qs) {
    const ok = data.ans.find((x) => x.question_id === q.id)?.is_correct;
    const r = byTopic.get(q.topic) ?? { t: 0, c: 0, module: q.module };
    r.t++; if (ok) r.c++;
    byTopic.set(q.topic, r);
  }
  const weak = [...byTopic.entries()].filter(([, v]) => v.c / v.t < 0.6);

  async function practise(topic: string, module: string) {
    try {
      const id = await startAttempt({ title: `${topic} practice`, module, topic, count: 5, duration: 6 });
      navigate({ to: "/test/$attemptId", params: { attemptId: id } });
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">{a.title} — Results</h1>
      <div className="grid gap-4 md:grid-cols-[auto_1fr]">
        <GlassCard className="flex items-center justify-center"><ProgressRing value={Number(a.accuracy ?? 0)} label="accuracy %" /></GlassCard>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[["Score", `${a.score}/${a.total}`], ["Accuracy", `${a.accuracy}%`], ["Time taken", fmtTime(a.time_taken_sec ?? 0)], ["Points earned", `+${(a.score ?? 0) * 10}`]].map(([l, v]) => (
            <GlassCard key={l}><div className="text-xs text-muted-foreground">{l}</div><div className="mt-1 font-display text-2xl font-bold">{v}</div></GlassCard>
          ))}
        </div>
      </div>
      <GlassCard>
        <h2 className="mb-3 text-lg font-bold">Weak-area analysis</h2>
        {weak.length === 0 ? <p className="text-sm text-success">Great work — no weak topics in this test.</p> : (
          <div className="flex flex-wrap gap-2">
            {weak.map(([t, v]) => (
              <div key={t} className="solid-panel flex items-center gap-3 px-4 py-2 text-sm">
                <span><b>{t}</b> · {v.c}/{v.t}</span>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => practise(t, v.module)}>Practise next</Button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
      <div className="space-y-4">
        {data.qs.map((q, i) => {
          const ans = data.ans.find((x) => x.question_id === q.id);
          const correct = data.key.get(q.id);
          const opts = data.opts.filter((o) => o.question_id === q.id);
          return (
            <div key={q.id} className="solid-panel p-5">
              <div className="mb-2 flex items-center gap-2 text-sm">
                {ans?.is_correct ? <CheckCircle2 className="h-5 w-5 text-success" /> : ans?.selected_option_id ? <XCircle className="h-5 w-5 text-destructive" /> : <MinusCircle className="h-5 w-5 text-muted-foreground" />}
                <span className="font-semibold">Q{i + 1}</span><span className="text-muted-foreground">· {q.topic}</span>
                {ans?.marked_review && <span className="text-xs text-violet">· marked</span>}
              </div>
              <p className="font-medium">{q.prompt}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {opts.map((o) => (
                  <div key={o.id} className={cn("rounded-lg border px-3 py-2 text-sm", o.id === correct ? "border-success bg-success/15" : o.id === ans?.selected_option_id ? "border-destructive bg-destructive/15" : "border-border")}>{o.label}</div>
                ))}
              </div>
              {q.explanation && <p className="mt-3 rounded-lg bg-primary/10 p-3 text-sm"><b className="text-primary">Explanation: </b>{q.explanation}</p>}
            </div>
          );
        })}
      </div>
      <div className="flex gap-3">
        <Link to="/dashboard"><Button className="rounded-full">Back to dashboard</Button></Link>
        <Link to="/tests"><Button variant="outline" className="rounded-full">More tests</Button></Link>
      </div>
    </div>
  );
}
