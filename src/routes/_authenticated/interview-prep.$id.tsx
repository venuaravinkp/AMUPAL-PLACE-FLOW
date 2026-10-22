import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Bookmark, CheckCircle2, ChevronDown, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProgressRing } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { DIFFS, DISCLAIMER, ROUNDS, completionPct, usePrepStatus } from "@/lib/interviewPrep";

export const Route = createFileRoute("/_authenticated/interview-prep/$id")({
  head: () => ({ meta: [{ title: "Company interview questions — AMUPAL PLACE FLOW" }, { name: "description", content: "Practise aptitude, technical and HR questions for this company." }, { property: "og:title", content: "Company interview questions" }, { property: "og:description", content: "Company-wise interview practice." }] }),
  component: CompanyPage,
});

function CompanyPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [round, setRound] = useState<string>("All");
  const [diff, setDiff] = useState("All");
  const [onlyBm, setOnlyBm] = useState(false);
  const { data } = useQuery({
    queryKey: ["prep-company", id],
    queryFn: async () => {
      const [c, qs] = await Promise.all([
        supabase.from("companies").select("*").eq("id", id).single(),
        supabase.from("company_questions").select("*").eq("company_id", id).order("created_at"),
      ]);
      if (c.error) throw c.error;
      return { c: c.data, qs: qs.data ?? [] };
    },
  });
  const { data: status } = usePrepStatus();
  if (!data) return <div className="text-muted-foreground">Loading…</div>;
  const st = new Map((status ?? []).map((s) => [s.question_id, s]));
  const pct = completionPct(data.qs.length, data.qs.filter((q) => st.get(q.id)?.practised).length);
  const list = data.qs.filter((q) => (round === "All" || q.round_type === round) && (diff === "All" || q.difficulty === diff) && (!onlyBm || st.get(q.id)?.bookmarked));

  async function toggle(qid: string, field: "bookmarked" | "practised") {
    const { data: u } = await supabase.auth.getUser();
    const cur = st.get(qid);
    const row = { user_id: u.user!.id, question_id: qid, bookmarked: cur?.bookmarked ?? false, practised: cur?.practised ?? false, [field]: !(cur?.[field] ?? false) };
    const { error } = await supabase.from("user_question_status").upsert(row);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["prep-status"] });
  }
  const pill = (a: boolean) => `rounded-full px-3 py-1 text-sm ${a ? "bg-primary text-primary-foreground" : "bg-glass text-muted-foreground hover:text-foreground"}`;

  return (
    <div className="space-y-5">
      <Link to="/interview-prep" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />All companies</Link>
      <div className="flex flex-wrap items-center gap-6">
        <ProgressRing value={pct} size={100} label="practised" />
        <div><h1 className="text-4xl font-extrabold">{data.c.name}</h1><p className="text-sm text-muted-foreground">{data.c.region} · {data.c.category}</p><p className="text-muted-foreground">{data.c.short_description}</p></div>
      </div>
      <div className="flex items-start gap-2 rounded-2xl border border-border bg-card p-3 text-sm text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{DISCLAIMER}</div>
      <div className="flex flex-wrap gap-2">{["All", ...ROUNDS].map((r) => <button key={r} className={pill(round === r)} onClick={() => setRound(r)}>{r}</button>)}</div>
      <div className="flex flex-wrap gap-2">
        {["All", ...DIFFS].map((d) => <button key={d} className={pill(diff === d)} onClick={() => setDiff(d)}>{d}</button>)}
        <button className={pill(onlyBm)} onClick={() => setOnlyBm(!onlyBm)}>Bookmarked</button>
      </div>
      <div className="space-y-3">
        {list.map((q) => <QCard key={q.id} q={q} s={st.get(q.id)} onToggle={toggle} />)}
        {!list.length && <p className="text-muted-foreground">No questions for these filters.</p>}
      </div>
    </div>
  );
}

type Q = { id: string; question: string; round_type: string; difficulty: string; topic: string | null; answer: string | null; explanation: string | null; tips: string | null };
function QCard({ q, s, onToggle }: { q: Q; s?: { bookmarked: boolean; practised: boolean }; onToggle: (id: string, f: "bookmarked" | "practised") => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="solid-panel p-4">
      <div className="mb-2 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-primary/15 px-2 py-0.5 font-semibold text-primary">{q.round_type}</span><span className="rounded-full bg-glass px-2 py-0.5">{q.difficulty}</span>{q.topic && <span className="rounded-full bg-glass px-2 py-0.5">{q.topic}</span>}</div>
      <p className="font-semibold">{q.question}</p>
      {open && (
        <div className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
          {q.answer && <p><span className="font-semibold">Answer: </span>{q.answer}</p>}
          {q.explanation && <p><span className="font-semibold">Explanation: </span>{q.explanation}</p>}
          {q.tips && <p className="text-primary"><span className="font-semibold">Tip: </span>{q.tips}</p>}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => setOpen(!open)}><ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />{open ? "Hide answer" : "Show answer"}</Button>
        <Button size="sm" variant={s?.bookmarked ? "default" : "outline"} className="rounded-full" onClick={() => onToggle(q.id, "bookmarked")}><Bookmark className="h-4 w-4" />{s?.bookmarked ? "Bookmarked" : "Bookmark"}</Button>
        <Button size="sm" variant={s?.practised ? "default" : "outline"} className="rounded-full" onClick={() => onToggle(q.id, "practised")}><CheckCircle2 className="h-4 w-4" />{s?.practised ? "Practised" : "Mark practised"}</Button>
      </div>
    </div>
  );
}
