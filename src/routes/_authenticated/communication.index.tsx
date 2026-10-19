import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquare, Users, Mail, Sparkles, SpellCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABEL, startAttempt } from "@/lib/data";
import { GlassCard, PageHeader, DifficultyBadge } from "@/components/glass";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/communication/")({
  head: () => ({ meta: [{ title: "Communication — AMUPAL PLACE FLOW" }, { name: "description", content: "Self-intro, group discussion, email writing and grammar practice." }, { property: "og:title", content: "Communication — AMUPAL PLACE FLOW" }, { property: "og:description", content: "Practise communication with AI feedback." }] }),
  component: Comm,
});

const ICONS: Record<string, typeof MessageSquare> = { self_intro: MessageSquare, gd: Users, email: Mail, confidence: Sparkles };

function Comm() {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["comm-list"],
    queryFn: async () => (await supabase.from("questions").select("id,category,topic,prompt,difficulty").eq("module", "communication").eq("qtype", "written").order("created_at")).data ?? [],
  });
  async function quiz() {
    try {
      const id = await startAttempt({ title: "Grammar & Vocabulary Quiz", module: "communication", category: "grammar", count: 6, duration: 6 });
      navigate({ to: "/test/$attemptId", params: { attemptId: id } });
    } catch (e) { toast.error((e as Error).message); }
  }
  const groups = ["self_intro", "gd", "email", "confidence"];
  return (
    <div>
      <PageHeader title="Communication Skills" subtitle="Write or speak your answer, get scored on clarity, confidence, grammar and structure." />
      <GlassCard hover className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><SpellCheck className="h-8 w-8 text-primary" /><div><h3 className="font-bold">Grammar & Vocabulary Quiz</h3><p className="text-sm text-muted-foreground">6 quick questions · 6 minutes</p></div></div>
        <Button onClick={quiz} className="bg-gradient-primary rounded-full font-bold">Start quiz</Button>
      </GlassCard>
      <div className="space-y-6">
        {groups.map((g) => {
          const Icon = ICONS[g] ?? MessageSquare;
          const items = (data ?? []).filter((q) => q.category === g);
          if (!items.length) return null;
          return (
            <div key={g}>
              <h2 className="mb-3 flex items-center gap-2 text-xl font-bold"><Icon className="h-5 w-5 text-primary" />{CATEGORY_LABEL[g]}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((q) => (
                  <Link key={q.id} to="/communication/$id" params={{ id: q.id }}>
                    <GlassCard hover className="h-full"><p className="line-clamp-3 text-sm">{q.prompt}</p><div className="mt-3"><DifficultyBadge d={q.difficulty} /></div></GlassCard>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
