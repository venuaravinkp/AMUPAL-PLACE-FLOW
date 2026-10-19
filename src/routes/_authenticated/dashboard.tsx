import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, Flame, Star, Trophy, Award, Calculator, Code2, MessageSquare, Mic, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe, startAttempt, CATEGORY_LABEL } from "@/lib/data";
import { GlassCard, ProgressRing } from "@/components/glass";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AMUPAL PLACE FLOW" }, { name: "description", content: "Your readiness score, daily mission and progress." }, { property: "og:title", content: "Dashboard — AMUPAL PLACE FLOW" }, { property: "og:description", content: "Your daily placement mission." }] }),
  component: Dashboard,
});

function daySeed() {
  const d = new Date();
  return d.getUTCFullYear() * 1000 + Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5);
}

function Dashboard() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const { data: extra } = useQuery({
    queryKey: ["dashboard-extra"],
    enabled: !!me,
    queryFn: async () => {
      const today = new Date(); today.setUTCHours(0, 0, 0, 0);
      const [qs, todayScores, recent, tests, solved] = await Promise.all([
        supabase.from("questions").select("id,module,category,topic,prompt,qtype").neq("qtype", "mcq").order("created_at"),
        supabase.from("scores").select("module").eq("user_id", me!.user.id).gte("created_at", today.toISOString()),
        supabase.from("scores").select("*").eq("user_id", me!.user.id).order("created_at", { ascending: false }).limit(6),
        supabase.from("tests").select("*").eq("active", true).order("scheduled_at", { ascending: true, nullsFirst: false }).limit(3),
        supabase.from("scores").select("ref_id,score,max_score").eq("user_id", me!.user.id).eq("module", "coding"),
      ]);
      return { qs: qs.data ?? [], done: new Set((todayScores.data ?? []).map((s) => s.module)), recent: recent.data ?? [], tests: tests.data ?? [], solved: new Set((solved.data ?? []).filter((s) => s.score >= s.max_score).map((s) => s.ref_id)) };
    },
  });
  if (!me) return <div className="text-muted-foreground">Loading…</div>;

  const seed = daySeed();
  const pick = <T,>(arr: T[]) => (arr.length ? arr[seed % arr.length] : undefined);
  const coding = extra?.qs.filter((q) => q.module === "coding" && !extra.solved.has(q.id)) ?? [];
  const codingQ = coding[0] ?? pick(extra?.qs.filter((q) => q.module === "coding") ?? []);
  const commQ = pick(extra?.qs.filter((q) => q.module === "communication") ?? []);
  const ivQ = pick(extra?.qs.filter((q) => q.module === "interview") ?? []);
  const weakApt = me.weak.find((w) => w.module === "aptitude");
  const company = me.profile.target_companies[0];

  async function startAptitude() {
    try {
      const id = await startAttempt({ title: weakApt ? `Daily mission: ${weakApt.topic}` : "Daily aptitude mission", module: "aptitude", topic: weakApt?.topic, company: weakApt ? undefined : company, count: 5, duration: 6 });
      navigate({ to: "/test/$attemptId", params: { attemptId: id } });
    } catch (e) { toast.error((e as Error).message); }
  }

  const missions = [
    { key: "aptitude", icon: Calculator, title: "Aptitude", desc: weakApt ? `5 questions on your weak topic: ${weakApt.topic}` : "5 mixed aptitude questions", action: <Button size="sm" onClick={startAptitude} className="rounded-full">Start</Button> },
    { key: "coding", icon: Code2, title: "Coding", desc: codingQ ? codingQ.prompt.split("\n")[0].slice(0, 80) : "…", action: codingQ && <Link to="/coding/$id" params={{ id: codingQ.id }}><Button size="sm" className="rounded-full">Solve</Button></Link> },
    { key: "communication", icon: MessageSquare, title: "Communication", desc: commQ ? `${CATEGORY_LABEL[commQ.category] ?? commQ.topic}` : "…", action: commQ && <Link to="/communication/$id" params={{ id: commQ.id }}><Button size="sm" className="rounded-full">Practise</Button></Link> },
    { key: "interview", icon: Mic, title: "Mock interview", desc: ivQ?.prompt ?? "…", action: ivQ && <Link to="/interview" search={{ q: ivQ.id }}><Button size="sm" className="rounded-full">Answer</Button></Link> },
  ];
  const doneCount = missions.filter((m) => extra?.done.has(m.key)).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground">Welcome back,</p>
        <h1 className="text-4xl font-extrabold md:text-5xl">{me.profile.full_name?.split(" ")[0] ?? "Student"} 👋</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="flex flex-col items-center justify-center gap-3 py-8">
          <ProgressRing value={me.readiness} size={170} label="out of 100" />
          <div className="text-center">
            <div className="font-display text-lg font-bold">Placement readiness</div>
            <div className="text-sm text-muted-foreground">Target: {me.profile.target_role}</div>
          </div>
        </GlassCard>
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          {[
            { icon: Flame, label: "Day streak", value: me.streak?.current_streak ?? 0, sub: `Best ${me.streak?.longest_streak ?? 0}` },
            { icon: Star, label: "Points", value: me.profile.points, sub: "Earn 10 per correct answer" },
            { icon: Trophy, label: "Rank", value: me.rank ? `#${me.rank}` : "—", sub: <Link to="/leaderboard" className="text-primary">View leaderboard</Link> },
            { icon: Award, label: "Badges", value: me.achievements.length, sub: me.achievements[0]?.title ?? "Complete a mission" },
          ].map((s) => (
            <GlassCard key={s.label} hover>
              <s.icon className="h-6 w-6 text-primary" />
              <div className="mt-3 font-display text-3xl font-bold">{s.value}</div>
              <div className="text-sm font-medium">{s.label}</div>
              <div className="mt-1 truncate text-xs text-muted-foreground">{s.sub}</div>
            </GlassCard>
          ))}
        </div>
      </div>

      <GlassCard className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Today's Placement Mission</h2>
          <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">{doneCount}/4 done</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {missions.map((m) => {
            const done = extra?.done.has(m.key);
            return (
              <div key={m.key} className="solid-panel flex items-center gap-4 p-4">
                {done ? <CheckCircle2 className="h-6 w-6 shrink-0 text-success" /> : <Circle className="h-6 w-6 shrink-0 text-muted-foreground" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-bold"><m.icon className="h-4 w-4 text-primary" />{m.title}</div>
                  <div className="truncate text-sm text-muted-foreground">{m.desc}</div>
                </div>
                {m.action}
              </div>
            );
          })}
        </div>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard>
          <h3 className="mb-4 text-lg font-bold">Skill progress</h3>
          <div className="space-y-4">
            {(Object.entries(me.skills) as [string, number][]).map(([k, v]) => (
              <div key={k}>
                <div className="mb-1 flex justify-between text-sm capitalize"><span>{k}</span><span className="font-semibold">{v}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-glass"><div className="bg-gradient-primary h-full rounded-full" style={{ width: `${v}%` }} /></div>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard>
          <h3 className="mb-4 text-lg font-bold">Weak areas</h3>
          {me.weak.length === 0 ? (
            <p className="text-sm text-muted-foreground">No weak topics yet. Keep practising — topics under 60% accuracy will show here.</p>
          ) : (
            <ul className="space-y-3">
              {me.weak.map((w) => (
                <li key={w.module + w.topic} className="flex items-center justify-between text-sm">
                  <span><span className="font-semibold">{w.topic}</span> <span className="text-muted-foreground capitalize">· {w.module}</span></span>
                  <span className="text-destructive">{w.accuracy}%</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/aptitude"><Button variant="outline" size="sm" className="mt-4 rounded-full">Recommended practice</Button></Link>
        </GlassCard>
        <GlassCard>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold"><CalendarClock className="h-5 w-5 text-primary" />Upcoming tests</h3>
          <ul className="space-y-3">
            {extra?.tests.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0"><div className="truncate font-semibold">{t.title}</div><div className="text-xs text-muted-foreground">{t.scheduled_at ? new Date(t.scheduled_at).toLocaleDateString() : "Available now"} · {t.duration_min} min</div></div>
                <Link to="/tests"><Button size="sm" variant="outline" className="rounded-full">Open</Button></Link>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="mb-4 text-lg font-bold">Recent activity</h3>
        {extra?.recent.length ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {extra.recent.map((r) => (
              <div key={r.id} className="solid-panel p-3 text-sm">
                <div className="font-semibold capitalize">{r.module}{r.topic ? ` · ${r.topic}` : ""}</div>
                <div className="text-muted-foreground">{Number(r.score)}/{Number(r.max_score)} · {new Date(r.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">Nothing yet — start today's mission!</p>}
        {me.achievements.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {me.achievements.map((a) => (
              <span key={a.id} title={a.description ?? ""} className="flex items-center gap-1 rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-xs font-semibold text-lime"><Award className="h-3 w-3" />{a.title}</span>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
