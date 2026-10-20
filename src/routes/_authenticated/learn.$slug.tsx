import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Lightbulb, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/data";
import { getLesson, scoreQuiz, passed, type QuizQ } from "@/lib/lessons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/learn/$slug")({
  head: () => ({ meta: [{ title: "Lesson — AMUPAL PLACE FLOW" }, { name: "description", content: "Learn step by step with examples, guided practice and a quiz." }, { property: "og:title", content: "Lesson — AMUPAL PLACE FLOW" }, { property: "og:description", content: "Step-by-step placement lessons." }] }),
  component: LessonPage,
});

const STEPS = ["Introduction", "Concepts", "Formulas", "Worked examples", "Guided practice", "Quiz"];

function Option({ q, pick, reveal, onPick }: { q: QuizQ; pick: number | null; reveal: boolean; onPick: (i: number) => void }) {
  return (
    <div className="grid gap-2">
      {q.options.map((o, i) => (
        <button key={i} disabled={reveal} onClick={() => onPick(i)}
          className={cn("rounded-xl border px-4 py-2.5 text-left text-sm transition",
            reveal && i === q.answer ? "border-success bg-success/15" :
            reveal && pick === i ? "border-destructive bg-destructive/15" :
            pick === i ? "border-primary bg-primary/15" : "border-border hover:border-primary/60")}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Guided({ q }: { q: QuizQ }) {
  const [pick, setPick] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const done = pick !== null;
  return (
    <div className="rounded-2xl border border-border p-4">
      <p className="mb-3 font-semibold">{q.q}</p>
      <Option q={q} pick={pick} reveal={done} onPick={setPick} />
      {!done && q.hint && (hint ? <p className="mt-3 text-sm text-primary"><Lightbulb className="mr-1 inline h-4 w-4" />{q.hint}</p> :
        <button onClick={() => setHint(true)} className="mt-3 text-sm text-primary underline">Show hint</button>)}
      {done && <p className="mt-3 text-sm">{pick === q.answer ? "✅ Correct. " : "❌ Not quite. "}{q.explanation}</p>}
    </div>
  );
}

function LessonPage() {
  const { slug } = Route.useParams();
  const lesson = getLesson(slug);
  const { data: me } = useMe();
  const qc = useQueryClient();
  const uid = me?.user.id;
  const { data: saved } = useQuery({
    queryKey: ["lesson", slug, uid], enabled: !!uid,
    queryFn: async () => (await supabase.from("lesson_progress").select("*").eq("user_id", uid!).eq("lesson_slug", slug).maybeSingle()).data,
  });
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => { if (saved) setStep(Math.min(saved.step, STEPS.length - 1)); }, [saved]);

  if (!lesson) return <div className="text-muted-foreground">Lesson not found.</div>;

  async function save(patch: { step: number; quiz_score?: number; quiz_total?: number; completed?: boolean }) {
    if (!uid) return;
    const { error } = await supabase.from("lesson_progress").upsert(
      { user_id: uid, lesson_slug: slug, ...patch, completed: patch.completed ?? saved?.completed ?? false, updated_at: new Date().toISOString() },
      { onConflict: "user_id,lesson_slug" });
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["lesson", slug, uid] });
  }
  function goto(n: number) { setStep(n); if (n > (saved?.step ?? 0)) save({ step: n }); window.scrollTo(0, 0); }
  async function submitQuiz() {
    const score = scoreQuiz(lesson!.quiz, picks);
    const ok = passed(score, lesson!.quiz.length, lesson!.passPercent);
    setSubmitted(true);
    await save({ step: STEPS.length - 1, quiz_score: score, quiz_total: lesson!.quiz.length, completed: ok || !!saved?.completed });
    toast[ok ? "success" : "info"](ok ? `Lesson complete! ${score}/${lesson!.quiz.length}` : `${score}/${lesson!.quiz.length}. Review and try again — you need ${lesson!.passPercent}%.`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/aptitude" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Aptitude</Link>
      <h1 className="text-3xl font-bold md:text-4xl">{lesson.title}</h1>
      {saved?.completed && <p className="mt-1 text-sm text-success"><CheckCircle2 className="mr-1 inline h-4 w-4" />Completed · best saved score {saved.quiz_score}/{saved.quiz_total}</p>}
      <div className="my-5 flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => goto(i)} className={cn("rounded-full border px-3 py-1 text-xs font-semibold", i === step ? "border-primary bg-primary/20 text-primary" : "border-glass-border text-muted-foreground")}>{i + 1}. {s}</button>
        ))}
      </div>

      <div className="solid-panel space-y-4 p-6 leading-relaxed">
        {step === 0 && <p className="text-lg">{lesson.intro}</p>}
        {step === 1 && lesson.concepts.map((c) => <div key={c.heading}><h3 className="font-bold text-primary">{c.heading}</h3><p>{c.body}</p></div>)}
        {step === 2 && <ul className="space-y-2">{lesson.formulas.map((f) => <li key={f} className="rounded-xl bg-muted px-4 py-2 font-mono text-sm">{f}</li>)}</ul>}
        {step === 3 && lesson.examples.map((e, i) => (
          <div key={i} className="rounded-2xl border border-border p-4">
            <p className="font-semibold">Example {i + 1}: {e.problem}</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{e.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            <p className="mt-2 font-bold text-primary">Answer: {e.answer}</p>
          </div>
        ))}
        {step === 4 && <>{<p className="text-sm text-muted-foreground">Try each one. Use the hint if you're stuck — you'll see the explanation straight away.</p>}{lesson.guided.map((q, i) => <Guided key={i} q={q} />)}</>}
        {step === 5 && <>
          <p className="text-sm text-muted-foreground">Solve on your own. You need {lesson.passPercent}% to complete the lesson.</p>
          {lesson.quiz.map((q, i) => (
            <div key={i} className="rounded-2xl border border-border p-4">
              <p className="mb-3 font-semibold">{i + 1}. {q.q}</p>
              <Option q={q} pick={picks[i] ?? null} reveal={submitted} onPick={(v) => setPicks((p) => { const n = [...p]; n[i] = v; return n; })} />
              {submitted && <p className="mt-3 text-sm">{picks[i] === q.answer ? <CheckCircle2 className="mr-1 inline h-4 w-4 text-success" /> : <XCircle className="mr-1 inline h-4 w-4 text-destructive" />}{q.explanation}</p>}
            </div>
          ))}
          {!submitted ? <Button disabled={picks.filter((x) => x != null).length < lesson.quiz.length} onClick={submitQuiz} className="bg-gradient-primary w-full rounded-full font-bold">Submit quiz</Button>
            : <Button variant="outline" onClick={() => { setPicks([]); setSubmitted(false); }} className="w-full rounded-full">Retry quiz</Button>}
        </>}
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => goto(step - 1)} className="rounded-full">Back</Button>
        {step < STEPS.length - 1 && <Button onClick={() => goto(step + 1)} className="bg-gradient-primary rounded-full px-8 font-bold">Next</Button>}
      </div>
    </div>
  );
}
