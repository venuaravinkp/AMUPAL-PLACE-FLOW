import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({ meta: [{ title: "Mistake Review — AMUPAL PLACE FLOW" }, { name: "description", content: "Review every question you got wrong, with the correct answer and explanation." }, { property: "og:title", content: "Mistake Review — AMUPAL PLACE FLOW" }, { property: "og:description", content: "Learn from your wrong answers." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Review,
});

function Review() {
  const [topic, setTopic] = useState<string>("all");
  const { data, isLoading } = useQuery({
    queryKey: ["mistake-review"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data: wrong } = await supabase.from("student_answers").select("question_id,selected_option_id,attempt_id,created_at")
        .eq("user_id", u.user!.id).eq("is_correct", false).not("selected_option_id", "is", null).order("created_at", { ascending: false }).limit(200);
      const rows = wrong ?? [];
      const seen = new Set<string>();
      const uniq = rows.filter((r) => (seen.has(r.question_id) ? false : (seen.add(r.question_id), true)));
      const ids = uniq.map((r) => r.question_id);
      if (!ids.length) return [];
      const attempts = [...new Set(uniq.map((r) => r.attempt_id).filter(Boolean))] as string[];
      const [qs, opts, ...keys] = await Promise.all([
        supabase.from("questions").select("id,prompt,topic,category,explanation").in("id", ids),
        supabase.from("answer_options").select("id,question_id,label,position").in("question_id", ids).order("position"),
        ...attempts.map((a) => supabase.rpc("attempt_review", { _attempt: a })),
      ]);
      const key = new Map<string, string>();
      for (const k of keys) for (const r of (k.data ?? []) as { question_id: string; correct_option_id: string }[]) key.set(r.question_id, r.correct_option_id);
      return uniq.map((r) => ({ ...r, q: qs.data?.find((q) => q.id === r.question_id), opts: (opts.data ?? []).filter((o) => o.question_id === r.question_id), correct: key.get(r.question_id) })).filter((r) => r.q);
    },
  });

  const topics = [...new Set((data ?? []).map((r) => r.q!.topic))];
  const list = (data ?? []).filter((r) => topic === "all" || r.q!.topic === topic);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mistake Review</h1>
        <p className="text-muted-foreground">Every question you got wrong in tests, with the right answer and why.</p>
      </div>
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {["all", ...topics].map((t) => (
            <Button key={t} size="sm" variant={topic === t ? "default" : "outline"} onClick={() => setTopic(t)}>{t === "all" ? `All (${data!.length})` : t}</Button>
          ))}
        </div>
      )}
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {!isLoading && list.length === 0 && (
        <GlassCard className="p-6 text-center space-y-3">
          <p>No mistakes to review yet. Take a test and come back here.</p>
          <Button asChild><Link to="/tests">Go to Tests</Link></Button>
        </GlassCard>
      )}
      <div className="space-y-4">
        {list.map((r) => (
          <div key={r.question_id} className="rounded-2xl border bg-card p-5 space-y-3">
            <div className="text-xs text-muted-foreground">{r.q!.topic}</div>
            <p className="font-medium whitespace-pre-wrap">{r.q!.prompt}</p>
            <div className="space-y-2">
              {r.opts.map((o) => {
                const isCorrect = o.id === r.correct, picked = o.id === r.selected_option_id;
                return (
                  <div key={o.id} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm", isCorrect && "border-primary bg-primary/10", picked && !isCorrect && "border-destructive bg-destructive/10")}>
                    {isCorrect ? <CheckCircle2 className="h-4 w-4 text-primary" /> : picked ? <XCircle className="h-4 w-4 text-destructive" /> : <span className="w-4" />}
                    {o.label}{picked && !isCorrect && <span className="ml-auto text-xs">your answer</span>}
                  </div>
                );
              })}
            </div>
            {r.q!.explanation && <p className="text-sm text-muted-foreground"><b>Why:</b> {r.q!.explanation}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
