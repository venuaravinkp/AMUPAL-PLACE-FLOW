import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/data";
import { GlassCard, PageHeader } from "@/components/glass";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — AMUPAL PLACE FLOW" }, { name: "description", content: "Top students by points and streaks." }, { property: "og:title", content: "Leaderboard — AMUPAL PLACE FLOW" }, { property: "og:description", content: "See who's leading the placement race." }] }),
  component: Leaderboard,
});

function Leaderboard() {
  const { data: me } = useMe();
  const { data } = useQuery({ queryKey: ["leaderboard"], queryFn: async () => (await supabase.rpc("leaderboard", { _limit: 50 })).data ?? [] });
  const top = (data ?? []).slice(0, 3);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Leaderboard" subtitle="Earn points with every correct answer and solved problem." />
      <div className="mb-6 grid grid-cols-3 gap-3">
        {top.map((r, i) => (
          <GlassCard key={r.user_id} className={cn("text-center", i === 0 && "border-primary/50 shadow-glow")}>
            {i === 0 && <Crown className="mx-auto h-6 w-6 text-primary" />}
            <div className="font-display text-3xl font-extrabold">#{r.rank}</div>
            <div className="truncate font-semibold">{r.full_name}</div>
            <div className="text-sm text-primary">{r.points} pts</div>
          </GlassCard>
        ))}
      </div>
      <div className="solid-panel divide-y divide-border">
        {(data ?? []).map((r) => (
          <div key={r.user_id} className={cn("flex items-center gap-4 px-5 py-3", r.user_id === me?.user.id && "bg-primary/10")}>
            <span className="w-8 font-display font-bold text-muted-foreground">#{r.rank}</span>
            <div className="min-w-0 flex-1"><div className="truncate font-semibold">{r.full_name}{r.user_id === me?.user.id && " (you)"}</div><div className="truncate text-xs text-muted-foreground">{r.college}</div></div>
            <span className="flex items-center gap-1 text-sm text-muted-foreground"><Flame className="h-4 w-4 text-primary" />{r.current_streak}</span>
            <span className="w-20 text-right font-bold">{r.points}</span>
          </div>
        ))}
        {data?.length === 0 && <p className="p-5 text-sm text-muted-foreground">No students yet.</p>}
      </div>
    </div>
  );
}
