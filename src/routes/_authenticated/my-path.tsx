import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useMe } from "@/lib/data";
import { GlassCard, PageHeader } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { COMMON_FOUNDATION, DEPARTMENT_GROUPS, type PathItem } from "@/lib/paths";

export const Route = createFileRoute("/_authenticated/my-path")({
  head: () => ({ meta: [{ title: "My Learning Path — AMUPAL PLACE FLOW" }, { name: "description", content: "Your personal placement learning path by department." }, { property: "og:title", content: "My Learning Path" }, { property: "og:description", content: "Step-by-step plan for your department and goals." }] }),
  component: MyPath,
});

function Step({ item, n }: { item: PathItem; n: number }) {
  const action = item.lesson
    ? <Link to="/learn/$slug" params={{ slug: item.lesson }}><Button size="sm" className="rounded-full">Start</Button></Link>
    : item.to ? <Link to={item.to}><Button size="sm" variant="outline" className="rounded-full"><ArrowRight className="h-4 w-4" /></Button></Link> : null;
  return (
    <li className="solid-panel flex items-center gap-4 p-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">{n}</span>
      <div className="min-w-0 flex-1"><div className="font-semibold">{item.title}</div><div className="text-sm text-muted-foreground">{item.detail}</div></div>
      {action}
    </li>
  );
}

function MyPath() {
  const { data: me } = useMe();
  if (!me) return <div className="text-muted-foreground">Loading…</div>;
  const p = me.profile as typeof me.profile & { department_group?: string | null; improvement_areas?: string[]; learning_format?: string | null };
  const group = p.department_group ? DEPARTMENT_GROUPS[p.department_group] : undefined;
  return (
    <div className="space-y-6">
      <PageHeader title="My Learning Path" subtitle={group ? `${group.label} · Target: ${p.target_role}` : "Pick your department to get a path made for you."} />
      {!group && (
        <GlassCard><p className="mb-3 text-sm">You haven't chosen a department yet.</p><Link to="/onboarding"><Button className="rounded-full">Choose department</Button></Link></GlassCard>
      )}
      {(p.improvement_areas?.length || p.learning_format) ? (
        <GlassCard className="text-sm">
          {p.improvement_areas?.length ? <div><b>Focus areas:</b> {p.improvement_areas.join(", ")}</div> : null}
          {p.learning_format && <div><b>Learning style:</b> {p.learning_format}</div>}
        </GlassCard>
      ) : null}
      <GlassCard>
        <h2 className="mb-3 text-xl font-bold">1. Common placement foundation</h2>
        <ol className="space-y-2">{COMMON_FOUNDATION.map((it, i) => <Step key={it.title} item={it} n={i + 1} />)}</ol>
      </GlassCard>
      {group && (
        <GlassCard>
          <h2 className="mb-3 text-xl font-bold">2. {group.label} track</h2>
          <ol className="space-y-2">{group.track.map((it, i) => <Step key={it.title} item={it} n={i + 1} />)}</ol>
        </GlassCard>
      )}
    </div>
  );
}
