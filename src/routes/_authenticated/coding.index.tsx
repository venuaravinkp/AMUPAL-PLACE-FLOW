import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/data";
import { GlassCard, PageHeader, DifficultyBadge } from "@/components/glass";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/coding/")({
  head: () => ({ meta: [{ title: "Coding — AMUPAL PLACE FLOW" }, { name: "description", content: "Coding problems in C, C++, Java, Python and JavaScript." }, { property: "og:title", content: "Coding — AMUPAL PLACE FLOW" }, { property: "og:description", content: "Solve coding problems with test cases." }] }),
  component: CodingList,
});

function CodingList() {
  const { data: me } = useMe();
  const [topic, setTopic] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["coding-list"],
    enabled: !!me,
    queryFn: async () => {
      const [qs, sc] = await Promise.all([
        supabase.from("questions").select("id,prompt,topic,difficulty").eq("module", "coding").order("created_at"),
        supabase.from("scores").select("ref_id,score,max_score,created_at").eq("user_id", me!.user.id).eq("module", "coding").order("created_at", { ascending: false }),
      ]);
      return { qs: qs.data ?? [], scores: sc.data ?? [] };
    },
  });
  const solved = new Set((data?.scores ?? []).filter((s) => s.score >= s.max_score).map((s) => s.ref_id));
  const topics = Array.from(new Set((data?.qs ?? []).map((q) => q.topic)));
  const list = (data?.qs ?? []).filter((q) => !topic || q.topic === topic);

  return (
    <div>
      <PageHeader title="Coding & Problem Solving" subtitle={`${solved.size} of ${data?.qs.length ?? 0} solved · C, C++, Java, Python, JavaScript, SQL`} />
      <div className="mb-5 flex flex-wrap gap-2">
        {[null, ...topics].map((t) => (
          <button key={t ?? "all"} onClick={() => setTopic(t)} className={cn("rounded-full border px-4 py-1.5 text-sm", topic === t ? "border-primary bg-primary/20 text-primary" : "border-glass-border bg-glass text-muted-foreground")}>{t ?? "All"}</button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((q) => (
          <Link key={q.id} to="/coding/$id" params={{ id: q.id }}>
            <GlassCard hover className="h-full">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold">{q.prompt.split("\n")[0].replace(/`/g, "")}</h3>
                {solved.has(q.id) && <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />}
              </div>
              <div className="mt-3 flex gap-2"><DifficultyBadge d={q.difficulty} /><span className="rounded-full border border-glass-border px-2.5 py-0.5 text-xs">{q.topic}</span></div>
            </GlassCard>
          </Link>
        ))}
      </div>
      {data && data.scores.length > 0 && (
        <GlassCard className="mt-6">
          <h3 className="mb-3 font-bold">Submission history</h3>
          <div className="space-y-1 text-sm">
            {data.scores.slice(0, 10).map((s, i) => {
              const q = data.qs.find((x) => x.id === s.ref_id);
              return <div key={i} className="flex justify-between"><span className="truncate">{q?.prompt.split("\n")[0].replace(/`/g, "")}</span><span className={s.score >= s.max_score ? "text-success" : "text-muted-foreground"}>{Number(s.score)}/{Number(s.max_score)}</span></div>;
            })}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
