import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Clock, ListChecks, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe, startAttempt } from "@/lib/data";
import { GlassCard, PageHeader } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tests")({
  head: () => ({ meta: [{ title: "Test Center — AMUPAL PLACE FLOW" }, { name: "description", content: "Timed aptitude, communication, full placement and company mock tests." }, { property: "og:title", content: "Test Center — AMUPAL PLACE FLOW" }, { property: "og:description", content: "Timed mock tests with instant results." }] }),
  component: Tests,
});

const KINDS = [{ id: null, label: "All" }, { id: "aptitude", label: "Aptitude" }, { id: "communication", label: "Communication" }, { id: "full", label: "Full mocks" }, { id: "company", label: "Company" }];
type T = { id: string; title: string; description: string | null; num_questions: number; duration_min: number; kind: string; scheduled_at: string | null };

function Tests() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const [kind, setKind] = useState<string | null>(null);
  const [sel, setSel] = useState<T | null>(null);
  const { data } = useQuery({
    queryKey: ["tests", me?.user.id],
    enabled: !!me,
    queryFn: async () => {
      const [t, a] = await Promise.all([
        supabase.from("tests").select("*").eq("active", true).order("created_at"),
        supabase.from("test_attempts").select("*").eq("user_id", me!.user.id).not("submitted_at", "is", null).order("submitted_at", { ascending: false }).limit(10),
      ]);
      return { tests: t.data ?? [], attempts: a.data ?? [] };
    },
  });
  async function begin() {
    if (!sel) return;
    try {
      const id = await startAttempt({ title: sel.title, testId: sel.id });
      navigate({ to: "/test/$attemptId", params: { attemptId: id } });
    } catch (e) { toast.error((e as Error).message); }
  }
  const list = (data?.tests ?? []).filter((t) => !kind || t.kind === kind);
  return (
    <div>
      <PageHeader title="Test Center" subtitle="Random questions every attempt · auto-submits when time ends" />
      <div className="mb-5 flex flex-wrap gap-2">
        {KINDS.map((k) => <button key={k.label} onClick={() => setKind(k.id)} className={cn("rounded-full border px-4 py-1.5 text-sm", kind === k.id ? "border-primary bg-primary/20 text-primary" : "border-glass-border bg-glass text-muted-foreground")}>{k.label}</button>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => (
          <GlassCard key={t.id} hover className="flex flex-col">
            <span className="mb-2 self-start rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-primary">{t.kind}</span>
            <h3 className="text-lg font-bold">{t.title}</h3>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{t.description}</p>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><ListChecks className="h-3 w-3" />{t.num_questions} Qs</span><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{t.duration_min} min</span>{t.scheduled_at && <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" />{new Date(t.scheduled_at).toLocaleDateString()}</span>}</div>
            <Button onClick={() => setSel(t)} className="mt-4 rounded-full">Start test</Button>
          </GlassCard>
        ))}
      </div>
      {data && data.attempts.length > 0 && (
        <GlassCard className="mt-8">
          <h3 className="mb-3 font-bold">Your recent tests</h3>
          <div className="divide-y divide-border">
            {data.attempts.map((a) => (
              <Link key={a.id} to="/results/$attemptId" params={{ attemptId: a.id }} className="flex justify-between py-2 text-sm hover:text-primary">
                <span>{a.title}</span><span>{a.score}/{a.total} · {a.accuracy}%</span>
              </Link>
            ))}
          </div>
        </GlassCard>
      )}
      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{sel?.title} — Instructions</DialogTitle></DialogHeader>
          <ul className="list-disc space-y-1.5 pl-5 text-sm">
            <li>{sel?.num_questions} questions, {sel?.duration_min} minutes total.</li>
            <li>Each correct answer earns 10 points. No negative marking.</li>
            <li>Use the question grid to jump around and "Mark for review" to flag questions.</li>
            <li>The test auto-submits when the timer reaches zero.</li>
            <li>You'll see your score, accuracy, explanations and weak areas right after.</li>
          </ul>
          <DialogFooter><Button onClick={begin} className="bg-gradient-primary rounded-full font-bold">Begin now</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
