import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { FileText, Save, Printer, Trash2, CheckCircle2, Circle, FolderInput } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/lib/data";
import { assessResume, emptyResume, resumeSchema, type Resume } from "@/lib/career";
import { resumeQueryOptions } from "@/lib/career-queries";
import { projectQueryOptions, projectHead } from "@/lib/project-queries";
import { saveResume, eraseResume } from "@/lib/career.functions";
import { PROJECTS } from "@/lib/projects";

export const Route = createFileRoute("/_authenticated/resume")({
  head: () => projectHead("Resume Coach & ATS Checker", "Create a private student resume, compare job requirements and export a clean printable resume."),
  loader: async ({ context }) => { await Promise.all([context.queryClient.ensureQueryData(resumeQueryOptions), context.queryClient.ensureQueryData(projectQueryOptions)]); },
  component: ResumePage,
});

const SECTIONS = [
  ["summary", "Professional summary", "Your target role, strengths and evidence"],
  ["education", "Education", "Degree · College · Graduation year · Grade"],
  ["skills", "Skills", "Separate your genuine skills with commas"],
  ["experience", "Experience & internships", "Organisation · Role · Dates\nImplemented … with … resulting in …"],
  ["projects", "Projects", "Project title · Tools\nBuilt … and validated …"],
  ["certifications", "Certifications", "Certification · Issuer · Year"],
  ["achievements", "Achievements", "Awards, leadership and measurable contributions"],
] as const;

function ResumePage() {
  const { data: saved } = useSuspenseQuery(resumeQueryOptions);
  const { data: portfolio } = useSuspenseQuery(projectQueryOptions);
  const { data: me } = useMe();
  const qc = useQueryClient();
  const persist = useServerFn(saveResume), erase = useServerFn(eraseResume);
  const parsed = resumeSchema.safeParse(saved?.document);
  const [resume, setResume] = useState<Resume>(parsed.success ? parsed.data : emptyResume);
  const [job, setJob] = useState(saved?.job_description ?? "");
  const [tab, setTab] = useState("edit"), [busy, setBusy] = useState(false), [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (saved || !me) return;
    setResume((r) => ({ ...r, name: r.name || me.profile.full_name || "", email: r.email || me.user.email || "", role: r.role || me.profile.target_role || "", education: r.education || `${me.profile.degree || ""} ${me.profile.branch || ""}\n${me.profile.college || ""}`.trim() }));
  }, [me, saved]);
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler); return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  function update(key: keyof Resume, value: string) { setResume((r) => ({ ...r, [key]: value })); setDirty(true); }
  const assessment = assessResume(resume, job, me?.profile.department_group ?? "science_arts");
  async function save() {
    setBusy(true);
    try { const row = await persist({ data: { document: resume, job_description: job } }); qc.setQueryData(resumeQueryOptions.queryKey, row); setDirty(false); toast.success("Resume saved"); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  async function remove() {
    if (!window.confirm("Permanently delete your saved resume and job description?")) return;
    setBusy(true);
    try { await erase(); qc.setQueryData(resumeQueryOptions.queryKey, null); setResume(emptyResume); setJob(""); setDirty(false); toast.success("Saved resume deleted"); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  function importProjects() {
    const text = portfolio.filter((p) => p.status === "submitted").map((p) => {
      const brief = PROJECTS.find((b) => b.slug === p.project_slug);
      return `${brief?.title ?? p.project_slug} · ${brief?.tools.join(", ") ?? ""}\n${p.summary}\n${p.repository_url || p.demo_url || ""}`;
    }).join("\n\n");
    if (!text) { toast.info("Complete a project submission first"); return; }
    update("projects", [resume.projects, text].filter(Boolean).join("\n\n").slice(0, 8000)); toast.success("Portfolio projects added");
  }
  const interviews = [
    resume.projects ? "Explain your most relevant project: problem, your contribution, validation and limitations." : "Which project demonstrates your readiness for this role?",
    resume.skills ? `Describe a real task where you used ${resume.skills.split(/[,\n]/)[0]}.` : "Which skill are you developing, and how are you practising it?",
    resume.experience ? "What changed because of your work during your internship or experience?" : "How have coursework and projects prepared you for professional work?",
    `Why are you interested in ${resume.role || "your target role"}?`,
  ];
  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="resume-controls flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
      <div><p className="text-sm font-semibold text-primary">Career studio</p><h1 className="mt-2 text-3xl font-bold">Resume Coach</h1><p className="mt-2 text-sm text-muted-foreground">{dirty ? "Unsaved changes" : saved ? "Saved privately to your account" : "New resume"}</p></div>
      <div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={save}><Save />Save</Button><Button variant="outline" onClick={() => { setTab("preview"); window.setTimeout(() => window.print(), 150); }}><Printer />Print / PDF</Button><Button variant="ghost" size="icon" aria-label="Delete saved resume" title="Delete saved resume" disabled={busy || !saved} onClick={remove}><Trash2 /></Button></div>
    </header>
    <div className="resume-controls flex flex-wrap gap-1" role="tablist" aria-label="Resume view">{[["edit", "Build resume"], ["review", "ATS & coaching"], ["preview", "Preview"]].map(([id, label]) => <Button key={id} role="tab" aria-selected={tab === id} variant={tab === id ? "secondary" : "ghost"} onClick={() => setTab(id)}>{label}</Button>)}</div>
    {tab === "edit" && <div className="resume-controls grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
      <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="space-y-6">
        <section className="space-y-4"><h2 className="text-xl font-bold">Personal details</h2><div className="grid gap-4 sm:grid-cols-2">{[["name", "Full name"], ["email", "Email"], ["phone", "Phone"], ["location", "City"], ["role", "Target role"]].map(([key, label]) => <label key={key} className="block text-sm font-medium">{label}<Input className="mt-2" type={key === "email" ? "email" : "text"} value={resume[key as keyof Resume]} maxLength={key === "phone" ? 50 : 150} onChange={(e) => update(key as keyof Resume, e.target.value)} /></label>)}</div></section>
        {SECTIONS.map(([key, label, placeholder]) => <label className="block text-sm font-medium" key={key}>{label}<Textarea aria-label={label} className="mt-2 min-h-28" value={resume[key]} maxLength={key === "summary" ? 2000 : key === "skills" ? 3000 : key === "education" ? 5000 : key === "experience" || key === "projects" ? 8000 : 4000} placeholder={placeholder} onChange={(e) => update(key, e.target.value)} /></label>)}
        <Button type="submit" disabled={busy}><Save />Save resume</Button>
      </form>
      <aside className="space-y-6"><section className="border-l-2 border-primary pl-4"><FileText className="mb-3 text-primary" /><h2 className="font-bold">ATS estimate</h2><p className="mt-3 text-4xl font-bold">{assessment.score}<span className="text-lg text-muted-foreground"> / 100</span></p><p className="mt-2 text-sm text-muted-foreground">A checklist estimate, not an employer screening result or a guarantee.</p></section>
        <Button variant="outline" className="w-full" onClick={importProjects}><FolderInput />Import portfolio projects</Button>
        <label className="block text-sm font-medium">Resume template<select className="mt-2 w-full rounded-md border border-input bg-background p-2" value={resume.template} onChange={(e) => update("template", e.target.value)}><option value="classic">Classic</option><option value="compact">Compact</option></select></label>
        <ul className="space-y-3 text-sm">{assessment.checks.map((c) => <li key={c.label} className="flex items-start gap-2">{c.passed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}{c.label}</li>)}</ul>
      </aside>
    </div>}
    {tab === "review" && <div className="resume-controls grid gap-8 lg:grid-cols-2">
      <section className="space-y-5"><h2 className="text-xl font-bold">Job-description alignment</h2><label className="block text-sm font-medium">Job description<Textarea className="mt-2 min-h-52" aria-label="Job description" placeholder="Paste the role requirements" maxLength={15000} value={job} onChange={(e) => { setJob(e.target.value); setDirty(true); }} /></label><p className="text-sm text-muted-foreground">{job.trim() ? "Matched against keywords from this description." : "Using your department’s starter skill checklist. Paste a job description for a closer match."}</p><div className="flex items-baseline gap-2"><span className="text-5xl font-bold text-primary">{assessment.score}</span><span className="text-muted-foreground">/100 · ATS estimate</span></div><p className="text-sm text-muted-foreground">Rule-based: completeness 40 · keyword alignment 30 · achievement evidence 20 · readability 10. This does not predict any employer’s decision.</p><div className="flex flex-wrap gap-2">{assessment.matched.map((k) => <span className="rounded border border-success/30 bg-success/10 px-2 py-1 text-xs text-success" key={k}>{k}</span>)}</div>{assessment.missing.length > 0 && <p className="text-sm"><span className="font-bold">Not evidenced: </span>{assessment.missing.join(", ")}</p>}</section>
      <section className="space-y-6"><div><h2 className="text-xl font-bold">Improvement checklist</h2><ul className="mt-4 space-y-3 text-sm leading-relaxed">{assessment.tips.length ? assessment.tips.map((tip) => <li className="border-l-2 border-primary pl-3" key={tip}>{tip}</li>) : <li className="text-success">All checklist checks passed. Check factual accuracy before sharing.</li>}</ul></div>{assessment.weakBullets.length > 0 && <div><h3 className="font-bold">Wording to strengthen</h3>{assessment.weakBullets.map((b) => <p key={b} className="mt-3 break-words text-sm text-muted-foreground">“{b}”</p>)}<p className="mt-3 text-sm">Use: action + task/tool + verified result. Never invent an achievement.</p></div>}<div><h3 className="font-bold">Prepare from your resume</h3><ol className="mt-3 list-decimal space-y-3 pl-5 text-sm">{interviews.map((q) => <li key={q}>{q}</li>)}</ol></div></section>
    </div>}
    <article className={`resume-paper resume-${resume.template} ${tab !== "preview" ? "resume-hidden" : ""}`} aria-label="Resume preview">
      <h1>{resume.name || "Your name"}</h1><p className="resume-role">{resume.role}</p><p>{[resume.email, resume.phone, resume.location].filter(Boolean).join(" · ")}</p>
      {SECTIONS.filter(([key]) => resume[key].trim()).map(([key, label]) => <section key={key}><h2>{label}</h2><div className="whitespace-pre-wrap break-words">{resume[key]}</div></section>)}
    </article>
  </div>;
}