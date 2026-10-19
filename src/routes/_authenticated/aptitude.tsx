import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe, startAttempt, CATEGORY_LABEL } from "@/lib/data";
import { GlassCard, PageHeader } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/aptitude")({
  head: () => ({ meta: [{ title: "Aptitude — AMUPAL PLACE FLOW" }, { name: "description", content: "Quant, logical, verbal and data interpretation practice." }, { property: "og:title", content: "Aptitude — AMUPAL PLACE FLOW" }, { property: "og:description", content: "Topic-wise aptitude practice with explanations." }] }),
  component: Aptitude,
});

const LESSONS: Record<string, { title: string; points: string[] }> = {
  quant: { title: "Quantitative Aptitude", points: ["Percent change = (new − old) / old × 100", "Profit % = Profit / CP × 100", "Work: combined rate = 1/a + 1/b", "Speed = Distance / Time; km/h × 5/18 = m/s", "CI = P(1 + r/100)^n − P"] },
  logical: { title: "Logical Reasoning", points: ["Series: check differences, ratios, squares/cubes", "Coding-decoding: look for fixed letter shifts", "Blood relations: draw a family tree", "Directions: track turns on paper (right = clockwise)", "Syllogisms: use Venn diagrams; 'some' ≠ 'all'"] },
  verbal: { title: "Verbal Ability", points: ["Subject–verb agreement: 'each/every' is singular", "Read RC questions first, then the passage", "Eliminate extreme options in comprehension", "Learn common idioms and prepositions (good at, depend on)"] },
  di: { title: "Data Interpretation", points: ["Approximate before calculating", "Pie chart: degrees / 360 = share", "Growth % = change / base", "CAGR = (end/start)^(1/years) − 1"] },
};

function Aptitude() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const [cat, setCat] = useState("quant");
  const [diff, setDiff] = useState<string | null>(null);
  const { data: topics } = useQuery({
    queryKey: ["apt-topics"],
    queryFn: async () => {
      const { data } = await supabase.from("questions").select("category,topic,difficulty").eq("module", "aptitude");
      return data ?? [];
    },
  });
  const catTopics = Array.from(new Set((topics ?? []).filter((t) => t.category === cat).map((t) => t.topic)));
  const prog = (t: string) => me?.progress.find((p) => p.module === "aptitude" && p.topic === t);

  async function go(topic?: string) {
    try {
      const id = await startAttempt({ title: topic ? `${topic} practice` : `${CATEGORY_LABEL[cat]} practice`, module: "aptitude", category: cat, topic, difficulty: diff ?? undefined, count: topic ? 5 : 10, duration: topic ? 6 : 12 });
      navigate({ to: "/test/$attemptId", params: { attemptId: id } });
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div>
      <PageHeader title="Aptitude & Reasoning" subtitle="Learn the key ideas, then practise by topic and difficulty." />
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.keys(LESSONS).map((c) => (
          <button key={c} onClick={() => setCat(c)} className={cn("rounded-full border px-4 py-2 text-sm font-semibold transition", cat === c ? "border-primary bg-primary/20 text-primary" : "border-glass-border bg-glass text-muted-foreground")}>{CATEGORY_LABEL[c]}</button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="solid-panel p-6 lg:col-span-1">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold"><BookOpen className="h-5 w-5 text-primary" />Lesson: {LESSONS[cat].title}</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">{LESSONS[cat].points.map((p) => <li key={p}>{p}</li>)}</ul>
          <div className="mt-6">
            <div className="mb-2 text-sm font-semibold">Difficulty</div>
            <div className="flex flex-wrap gap-2">
              {[null, "easy", "medium", "hard"].map((d) => (
                <button key={d ?? "any"} onClick={() => setDiff(d)} className={cn("rounded-full border px-3 py-1 text-xs capitalize", diff === d ? "border-primary text-primary" : "border-glass-border text-muted-foreground")}>{d ?? "any"}</button>
              ))}
            </div>
            <Button onClick={() => go()} className="bg-gradient-primary mt-5 w-full rounded-full font-bold"><Play className="mr-1 h-4 w-4" />Mixed practice (10 Qs)</Button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
          {catTopics.map((t) => {
            const p = prog(t);
            const acc = p && p.attempted ? Math.round((p.correct / p.attempted) * 100) : null;
            return (
              <GlassCard key={t} hover className="flex flex-col">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold">{t}</h3>
                  {acc !== null && <span className={cn("text-sm font-semibold", acc < 60 ? "text-destructive" : "text-success")}>{acc}%</span>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p ? `${p.correct}/${p.attempted} correct` : "Not started"}{acc !== null && acc < 60 ? " · Recommended" : ""}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-glass"><div className="bg-gradient-primary h-full" style={{ width: `${acc ?? 0}%` }} /></div>
                <Button size="sm" variant="outline" onClick={() => go(t)} className="mt-4 self-start rounded-full">Practise</Button>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
