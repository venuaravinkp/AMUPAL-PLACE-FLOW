import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Briefcase, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PROJECTS, projectCompletion } from "@/lib/projects";
import { projectHead, projectQueryOptions } from "@/lib/project-queries";
import { DEPARTMENT_GROUPS } from "@/lib/paths";
import { useMe } from "@/lib/data";
import workbench from "@/assets/project-workbench.jpg";

export const Route = createFileRoute("/_authenticated/projects/")({
  head: () => projectHead("Real-World Projects", "Build department-specific projects, save milestones and create your student portfolio."),
  loader: ({ context }) => context.queryClient.ensureQueryData(projectQueryOptions),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { data: saved } = useSuspenseQuery(projectQueryOptions);
  const { data: me } = useMe();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [view, setView] = useState("catalog");
  const visible = PROJECTS.filter((p) => {
    const row = saved.find((s) => s.project_slug === p.slug);
    return (department === "all" || p.department === department) &&
      `${p.title} ${p.tools.join(" ")}`.toLowerCase().includes(search.toLowerCase()) &&
      (view === "catalog" || (view === "active" ? row?.status === "in_progress" : row?.status === "submitted"));
  });
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <section className="grid items-center gap-6 border-b border-border pb-7 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase text-primary">Career studio</p>
          <h1 className="text-3xl font-bold md:text-4xl">Real-World Projects</h1>
          <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>{PROJECTS.length} complete project briefs</span><span>{saved.filter((s) => s.status === "submitted").length} portfolio entries</span>
          </div>
          {me?.profile.department_group && <Button variant="outline" className="mt-5" onClick={() => setDepartment(me.profile.department_group ?? "all")}>My department <ArrowRight /></Button>}
        </div>
        <img src={workbench} alt="Engineering project workbench with a laptop, microcontroller and technical drawings" width={1536} height={1024} className="aspect-[3/2] w-full rounded-xl object-cover" />
      </section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1" role="tablist" aria-label="Project view">
          {[["catalog", "All projects"], ["active", "My projects"], ["portfolio", "Portfolio"]].map(([id, label]) => <Button key={id} role="tab" aria-selected={view === id} variant={view === id ? "secondary" : "ghost"} onClick={() => setView(id)}>{label}</Button>)}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" aria-label="Search projects" placeholder="Search projects or tools" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <select aria-label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} className="max-w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="all">All departments</option>{Object.entries(DEPARTMENT_GROUPS).map(([id, g]) => <option key={id} value={id}>{g.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map((p) => {
          const row = saved.find((s) => s.project_slug === p.slug);
          const pct = projectCompletion(p, row?.completed_milestones ?? []);
          return <article key={p.slug} className="glass flex flex-col p-5">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><span className="text-electric">{DEPARTMENT_GROUPS[p.department]?.label}</span><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{p.duration}</span></div>
            <h2 className="mt-3 text-xl font-bold">{p.title}</h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{p.problem}</p>
            <p className="mt-4 text-xs text-primary">{p.tools.join(" · ")}</p>
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">{row?.status === "submitted" ? "Portfolio ready" : row ? `${pct}% complete` : "4 milestones · 100-point rubric"}</span>
              <Button asChild size="sm"><Link to="/projects/$slug" params={{ slug: p.slug }}>{row ? "Continue" : "Open brief"}<ArrowRight /></Link></Button>
            </div>
          </article>;
        })}
      </div>
      {!visible.length && <div className="py-12 text-center"><Briefcase className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-semibold">{view === "portfolio" ? "No completed portfolio entries yet" : "No projects found"}</p><Button variant="link" onClick={() => { setView("catalog"); setSearch(""); setDepartment("all"); }}>Browse all projects</Button></div>}
    </div>
  );
}