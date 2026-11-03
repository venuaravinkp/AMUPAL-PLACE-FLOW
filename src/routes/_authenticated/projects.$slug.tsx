import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Download, Save, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { getProject, projectCompletion, submissionIssues, portfolioMarkdown, type ProjectBrief } from "@/lib/projects";
import { projectQueryOptions, projectHead } from "@/lib/project-queries";
import { saveProject, deleteProject } from "@/lib/projects.functions";

export const Route = createFileRoute("/_authenticated/projects/$slug")({
  head: ({ params }) => projectHead(getProject(params.slug)?.title ?? "Project unavailable", "Project brief, milestone checklist, assessment rubric and personal portfolio submission."),
  loader: async ({ context, params }) => {
    if (!getProject(params.slug)) throw notFound();
    await context.queryClient.ensureQueryData(projectQueryOptions);
  },
  component: ProjectPage,
});

function ProjectPage() {
  const { slug } = Route.useParams();
  const project = getProject(slug);
  if (!project) return null;
  return <ProjectWorkspace key={slug} project={project} />;
}

function ProjectWorkspace({ project }: { project: ProjectBrief }) {
  const { data: rows } = useSuspenseQuery(projectQueryOptions);
  const saved = rows.find((r) => r.project_slug === project.slug);
  const [completed, setCompleted] = useState(saved?.completed_milestones ?? []);
  const [notes, setNotes] = useState(saved?.notes ?? "");
  const [summary, setSummary] = useState(saved?.summary ?? "");
  const [repository, setRepository] = useState(saved?.repository_url ?? "");
  const [demo, setDemo] = useState(saved?.demo_url ?? "");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const save = useServerFn(saveProject), remove = useServerFn(deleteProject);
  const qc = useQueryClient();
  const pct = projectCompletion(project, completed);
  const issues = submissionIssues(project, completed, summary, repository, demo);
  const submitted = saved?.status === "submitted" && !dirty;

  async function persist(status: "in_progress" | "submitted") {
    setBusy(true);
    try {
      await save({ data: { slug: project.slug, completed, notes, summary, repository, demo, status } });
      await qc.invalidateQueries({ queryKey: projectQueryOptions.queryKey });
      setDirty(false);
      toast.success(status === "submitted" ? "Project added to your portfolio" : "Project progress saved");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save project"); }
    finally { setBusy(false); }
  }
  async function erase() {
    setBusy(true);
    try {
      await remove({ data: { slug: project.slug } });
      await qc.invalidateQueries({ queryKey: projectQueryOptions.queryKey });
      setCompleted([]); setNotes(""); setSummary(""); setRepository(""); setDemo(""); setDirty(false); setDeleteConfirm(false);
      toast.success("Your project data was deleted");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not delete project"); }
    finally { setBusy(false); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([portfolioMarkdown(project, saved?.summary ?? "", saved?.repository_url ?? "", saved?.demo_url ?? "")], { type: "text/markdown" }));
    const a = document.createElement("a"); a.href = url; a.download = `${project.slug}-portfolio.md`; a.click(); URL.revokeObjectURL(url);
  }
  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <Button variant="ghost" asChild><Link to="/projects"><ArrowLeft />Projects</Link></Button>
      <header className="border-b border-border pb-6">
        <p className="text-sm font-semibold text-primary">{project.level} · {project.duration}</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">{project.title}</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">{project.problem}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button disabled={busy} onClick={() => persist("in_progress")}><Save />{busy ? "Saving…" : saved ? "Save progress" : "Start project"}</Button>
          <span className="text-sm text-muted-foreground">{dirty ? "Unsaved changes" : submitted ? "Submitted to your private portfolio" : saved ? "Progress saved" : "Not started"}</span>
        </div>
      </header>
      <div className="grid gap-6 sm:grid-cols-3">
        {[["Learning objectives", project.objectives], ["Prerequisites", project.prerequisites], ["Required tools", project.tools]].map(([title, items]) => <section key={String(title)}><h2 className="mb-3 font-bold">{title}</h2><ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">{Array.isArray(items) && items.map((s) => <li key={s}>{s}</li>)}</ul></section>)}
      </div>
      <section className="space-y-4">
        <div className="flex justify-between"><h2 className="text-xl font-bold">Milestones & deliverables</h2><span className="text-sm text-primary">{pct}%</span></div>
        <Progress value={pct} aria-label="Project completion" />
        {project.milestones.map((m, i) => <article key={m.id} className="solid-panel p-5">
          <label className="flex cursor-pointer items-start gap-3"><Checkbox className="mt-1" checked={completed.includes(m.id)} onCheckedChange={(v) => { setCompleted((c) => v === true ? [...c, m.id] : c.filter((id) => id !== m.id)); setDirty(true); }} aria-label={`Complete milestone ${i + 1}: ${m.title}`} /><h3 className="font-bold">{i + 1}. {m.title}</h3></label>
          <ul className="mt-3 list-disc space-y-1 pl-8 text-sm text-muted-foreground">{m.tasks.map((task) => <li key={task}>{task}</li>)}</ul>
          <p className="mt-4 text-sm"><span className="font-semibold text-primary">Deliverable: </span>{m.deliverable}</p>
        </article>)}
      </section>
      <section><h2 className="mb-3 text-xl font-bold">Assessment rubric</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-muted-foreground"><tr><th className="py-3">Criterion</th><th className="px-3">Points</th><th>Evidence</th></tr></thead><tbody>{project.rubric.map((r) => <tr key={r.criterion} className="border-b border-border"><td className="py-3 font-semibold">{r.criterion}</td><td className="px-3 text-primary">{r.points}</td><td className="text-muted-foreground">{r.evidence}</td></tr>)}</tbody></table></div><p className="mt-3 text-xs text-muted-foreground">Self-assessment rubric · submission does not imply trainer approval or a verified score.</p></section>
      <section className="space-y-4 border-t border-border pt-6">
        <h2 className="text-xl font-bold">Your project workspace</h2>
        <label className="block space-y-2 text-sm font-semibold">Working notes<Textarea aria-label="Working notes" value={notes} maxLength={10000} rows={4} onChange={(e) => { setNotes(e.target.value); setDirty(true); }} placeholder="Decisions, test results, blockers and improvements" /></label>
        <label className="block space-y-2 text-sm font-semibold">Project summary & personal contribution<Textarea aria-label="Project summary & personal contribution" value={summary} maxLength={5000} rows={4} onChange={(e) => { setSummary(e.target.value); setDirty(true); }} placeholder="What you built, your contribution, measured results and limitations" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2 text-sm font-semibold">Repository URL<Input value={repository} type="url" maxLength={2000} onChange={(e) => { setRepository(e.target.value); setDirty(true); }} placeholder="https://github.com/…" /></label>
          <label className="block space-y-2 text-sm font-semibold">Report or demonstration URL<Input value={demo} type="url" maxLength={2000} onChange={(e) => { setDemo(e.target.value); setDirty(true); }} placeholder="https://…" /></label>
        </div>
        <p className="text-xs text-muted-foreground">Your notes and submission are private to your account. External links follow the sharing permissions of their host.</p>
        <div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={() => persist("in_progress")}><Save />Save progress</Button><Button variant="secondary" disabled={busy || issues.length > 0 || submitted} onClick={() => persist("submitted")}><Send />{submitted ? "In portfolio" : "Submit to portfolio"}</Button>{submitted && <Button variant="outline" onClick={download}><Download />Download portfolio entry</Button>}</div>
        {issues.length > 0 && <ul className="space-y-1 text-sm text-muted-foreground">{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
        {submitted && <p className="flex items-center gap-2 text-sm text-success"><CheckCircle2 className="h-4 w-4" />Portfolio entry saved</p>}
      </section>
      <section><h2 className="mb-3 text-xl font-bold">Prepare to explain your project</h2><ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">{project.interview.map((q) => <li key={q}>{q}</li>)}</ul><Button variant="outline" asChild className="mt-4"><Link to="/interview">Practise an interview</Link></Button></section>
      {saved && <section className="border-t border-border pt-5">{!deleteConfirm ? <Button variant="ghost" onClick={() => setDeleteConfirm(true)}><Trash2 />Delete my project data</Button> : <div className="flex flex-wrap items-center gap-3"><p className="text-sm">Delete your notes, milestones and portfolio entry?</p><Button variant="destructive" disabled={busy} onClick={erase}>Delete permanently</Button><Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancel</Button></div>}</section>}
    </div>
  );
}