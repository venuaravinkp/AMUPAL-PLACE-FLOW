import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe, startAttempt } from "@/lib/data";
import { GlassCard, ProgressRing } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { trackCompletion } from "./companies.index";

export const Route = createFileRoute("/_authenticated/companies/$slug")({
  head: () => ({ meta: [{ title: "Company track — AMUPAL PLACE FLOW" }, { name: "description", content: "Pattern, topics, mock tests and interview questions." }, { property: "og:title", content: "Company track — AMUPAL PLACE FLOW" }, { property: "og:description", content: "Company-specific preparation." }] }),
  component: Track,
});

function Track() {
  const { slug } = Route.useParams();
  const { data: me } = useMe();
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["track", slug],
    queryFn: async () => {
      const { data: t } = await supabase.from("company_tracks").select("*").eq("slug", slug).single();
      const key = slug === "product" ? "product" : t!.name;
      const [tests, ivq] = await Promise.all([
        supabase.from("tests").select("*").eq("company", key),
        supabase.from("questions").select("id,prompt").eq("module", "interview").or(`company.eq.${key},category.eq.hr`).limit(8),
      ]);
      return { t: t!, key, tests: tests.data ?? [], ivq: ivq.data ?? [] };
    },
  });
  if (!data) return <div className="text-muted-foreground">Loading…</div>;
  const { t } = data;
  const pattern = t.pattern as { section: string; questions: number; minutes: number }[];

  async function practice(topic?: string) {
    try {
      const id = await startAttempt({ title: topic ? `${t.name}: ${topic}` : `${t.name} practice set`, topic, company: topic ? undefined : data!.key, count: topic ? 5 : 8, duration: topic ? 6 : 10 });
      navigate({ to: "/test/$attemptId", params: { attemptId: id } });
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="space-y-6">
      <Link to="/companies" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />All tracks</Link>
      <div className="flex flex-wrap items-center gap-6">
        <ProgressRing value={trackCompletion(t.important_topics, me?.progress ?? [])} size={110} label="complete" />
        <div><h1 className="text-4xl font-extrabold">{t.name}</h1><p className="text-muted-foreground">{t.description}</p></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="solid-panel p-6">
          <h2 className="mb-3 text-lg font-bold">Typical placement pattern</h2>
          <table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th className="pb-2">Section</th><th>Qs</th><th>Time</th></tr></thead>
            <tbody>{pattern.map((p) => <tr key={p.section} className="border-t border-border"><td className="py-2">{p.section}</td><td>{p.questions}</td><td>{p.minutes} min</td></tr>)}</tbody></table>
        </div>
        <div className="solid-panel p-6">
          <h2 className="mb-3 text-lg font-bold">Important topics</h2>
          <ul className="space-y-2">
            {t.important_topics.map((topic) => {
              const p = me?.progress.find((x) => x.topic === topic);
              const done = p && p.attempted >= 2 && p.correct / p.attempted >= 0.6;
              return (
                <li key={topic} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">{done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}{topic}</span>
                  <Button size="sm" variant="outline" className="h-7 rounded-full" onClick={() => practice(topic)}>Practise</Button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Practice questions & mock tests</h2>
          <Button onClick={() => practice()} className="rounded-full">Quick practice set</Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.tests.map((m) => (
            <div key={m.id} className="solid-panel flex items-center justify-between p-4">
              <div><div className="font-semibold">{m.title}</div><div className="text-xs text-muted-foreground">{m.num_questions} Qs · {m.duration_min} min</div></div>
              <Button size="sm" className="bg-gradient-primary rounded-full" onClick={async () => { try { const id = await startAttempt({ title: m.title, testId: m.id }); navigate({ to: "/test/$attemptId", params: { attemptId: id } }); } catch (e) { toast.error((e as Error).message); } }}>Start</Button>
            </div>
          ))}
        </div>
      </GlassCard>
      <div className="solid-panel p-6">
        <h2 className="mb-3 text-lg font-bold">Interview questions</h2>
        <ul className="space-y-2">
          {data.ivq.map((q) => <li key={q.id} className="flex items-center justify-between gap-2 text-sm"><span>{q.prompt}</span><Link to="/interview" search={{ q: q.id }}><Button size="sm" variant="outline" className="h-7 rounded-full">Answer</Button></Link></li>)}
        </ul>
      </div>
    </div>
  );
}
