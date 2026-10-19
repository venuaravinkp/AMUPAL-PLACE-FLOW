import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/data";
import { GlassCard, PageHeader, ProgressRing } from "@/components/glass";

export const Route = createFileRoute("/_authenticated/companies/")({
  head: () => ({ meta: [{ title: "Company tracks — AMUPAL PLACE FLOW" }, { name: "description", content: "TCS, Infosys, Wipro, Accenture, Capgemini and product company preparation." }, { property: "og:title", content: "Company tracks — AMUPAL PLACE FLOW" }, { property: "og:description", content: "Company-specific placement preparation." }] }),
  component: Companies,
});

export function trackCompletion(topics: string[], progress: { topic: string; attempted: number; correct: number }[]) {
  if (!topics.length) return 0;
  const done = topics.filter((t) => { const p = progress.find((x) => x.topic === t); return p && p.attempted >= 2 && p.correct / p.attempted >= 0.6; }).length;
  return Math.round((done / topics.length) * 100);
}

function Companies() {
  const { data: me } = useMe();
  const { data } = useQuery({ queryKey: ["tracks"], queryFn: async () => (await supabase.from("company_tracks").select("*").order("sort")).data ?? [] });
  return (
    <div>
      <PageHeader title="Company Preparation Tracks" subtitle="A topic counts as complete after 2+ attempts at 60%+ accuracy." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((t) => (
          <Link key={t.id} to="/companies/$slug" params={{ slug: t.slug }}>
            <GlassCard hover className="flex h-full items-center gap-4">
              <ProgressRing value={trackCompletion(t.important_topics, me?.progress ?? [])} size={80} stroke={8} />
              <div className="min-w-0"><h3 className="text-xl font-bold">{t.name}</h3><p className="line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
                {me?.profile.target_companies.includes(t.slug === "product" ? "product" : t.name) && <span className="mt-1 inline-block text-xs font-semibold text-primary">Your target</span>}
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
