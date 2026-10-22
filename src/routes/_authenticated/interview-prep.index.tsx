import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/data";
import { GlassCard, PageHeader, ProgressRing } from "@/components/glass";
import { Input } from "@/components/ui/input";
import { CATEGORIES, completionPct, usePrepCounts, usePrepStatus } from "@/lib/interviewPrep";

export const Route = createFileRoute("/_authenticated/interview-prep/")({
  head: () => ({ meta: [{ title: "Top Companies Interview Prep — AMUPAL PLACE FLOW" }, { name: "description", content: "Practice interview questions for TCS, Infosys, Google, Amazon and more." }, { property: "og:title", content: "Top Companies Interview Prep" }, { property: "og:description", content: "Company-wise interview practice questions." }] }),
  component: Page,
});

function Page() {
  const { data: me } = useMe();
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("All");
  const [cat, setCat] = useState("All");
  const { data: companies } = useQuery({ queryKey: ["prep-companies"], queryFn: async () => (await supabase.from("companies").select("*").order("name")).data ?? [] });
  const { data: counts } = usePrepCounts();
  const { data: status } = usePrepStatus();
  const practisedIds = new Set((status ?? []).filter((s) => s.practised).map((s) => s.question_id));
  const list = (companies ?? []).filter((c) => (region === "All" || c.region === region) && (cat === "All" || c.category === cat) && c.name.toLowerCase().includes(q.toLowerCase()));
  const pill = (active: boolean) => `rounded-full px-3 py-1 text-sm ${active ? "bg-primary text-primary-foreground" : "bg-glass text-muted-foreground hover:text-foreground"}`;

  return (
    <div>
      <PageHeader title="Top Companies Interview Prep" subtitle="Aptitude, technical and HR practice questions by company." />
      <div className="mb-5 space-y-3">
        <div className="relative max-w-md"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search companies" className="pl-9" /></div>
        <div className="flex flex-wrap gap-2">{["All", "India", "Global"].map((r) => <button key={r} className={pill(region === r)} onClick={() => setRegion(r)}>{r}</button>)}</div>
        <div className="flex flex-wrap gap-2">{["All", ...CATEGORIES].map((c) => <button key={c} className={pill(cat === c)} onClick={() => setCat(c)}>{c}</button>)}</div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => {
          const qs = (counts ?? []).filter((x) => x.company_id === c.id);
          const pct = completionPct(qs.length, qs.filter((x) => practisedIds.has(x.id)).length);
          return (
            <Link key={c.id} to="/interview-prep/$id" params={{ id: c.id }}>
              <GlassCard hover className="flex h-full items-center gap-4">
                <ProgressRing value={pct} size={70} stroke={7} />
                <div className="min-w-0">
                  <h3 className="text-xl font-bold">{c.name}</h3>
                  <div className="text-xs text-muted-foreground">{c.region} · {c.category}</div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{c.short_description}</p>
                  <div className="mt-1 text-xs font-semibold text-primary">{qs.length} questions</div>
                </div>
              </GlassCard>
            </Link>
          );
        })}
        {companies && !list.length && <p className="text-muted-foreground">No companies match your filters.</p>}
      </div>
    </div>
  );
}
