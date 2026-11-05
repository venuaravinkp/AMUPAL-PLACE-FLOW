import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Award, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { certificatesOptions } from "@/lib/training-queries";
import { issueCertificate } from "@/lib/training.functions";
import { courseEligible } from "@/lib/training";
import { getLesson } from "@/lib/lessons";
import { startAttempt } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/glass";

export const Route = createFileRoute("/_authenticated/certificates")({
  head: () => ({ meta: [{ title: "Certificates — AMUPAL PLACE FLOW" }, { name: "description", content: "Earn verified course certificates through lessons and final assessments." }, { property: "og:title", content: "Certificates — AMUPAL PLACE FLOW" }, { property: "og:description", content: "Your verified placement-training achievements." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(certificatesOptions()); }, component: Certificates,
});
function Certificates() {
  const { data } = useSuspenseQuery(certificatesOptions()), qc = useQueryClient(), navigate = useNavigate();
  const issue = useServerFn(issueCertificate);
  const claim = useMutation({ mutationFn: (id: string) => issue({ data: { id } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["certificates"] }); toast.success("Certificate issued"); }, onError: (e) => toast.error(e.message) });
  const assessment = useMutation({ mutationFn: (id: string) => startAttempt({ title: "Final assessment", testId: id }), onSuccess: (attemptId) => navigate({ to: "/test/$attemptId", params: { attemptId } }), onError: (e) => toast.error(e.message) });
  const completed = data.results.filter((r) => r.completed).map((r) => r.lesson_slug);
  return <div className="mx-auto max-w-5xl"><PageHeader title="Certificates" subtitle="Verified placement-training achievements" />
    {!data.courses.length && <p className="text-muted-foreground">No certificate courses are available yet.</p>}
    <div className="grid gap-5 lg:grid-cols-2">{data.courses.map((c) => {
      const scores = data.attempts.filter((a) => a.test_id === c.final_test_id).map((a) => Number(a.accuracy));
      const best = scores.length ? Math.max(...scores) : null, issued = data.issued.find((i) => i.course_id === c.id);
      return <article key={c.id} className="glass p-6"><Award className="mb-3 h-8 w-8 text-primary" /><h2 className="text-xl font-bold">{c.title}</h2><p className="mt-2 text-sm text-muted-foreground">{c.skills.join(" · ")}</p>
        <ul className="my-4 space-y-2">{c.required_lessons.map((slug) => <li key={slug} className="flex items-center gap-2 text-sm"><CheckCircle2 className={completed.includes(slug) ? "h-4 w-4 text-success" : "h-4 w-4 text-muted-foreground"} /><Link to="/learn/$slug" params={{ slug }} className="underline">{getLesson(slug)?.title ?? slug}</Link></li>)}</ul>
        <p className="mb-4 text-sm">Final assessment: {best === null ? "not taken" : `${best}%`} · Required: {c.pass_percent}%</p>
        {issued ? <div className="space-y-2"><p className={issued.revoked_at ? "text-destructive" : "text-success"}>{issued.revoked_at ? "Certificate revoked" : "Certificate earned"}</p><Link to="/verify/$id" params={{ id: issued.id }}><Button variant="outline">View certificate</Button></Link></div> : <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={assessment.isPending} onClick={() => assessment.mutate(c.final_test_id)}>Take final assessment</Button><Button disabled={!courseEligible(c.required_lessons, completed, best, c.pass_percent) || claim.isPending} onClick={() => claim.mutate(c.id)}>Claim certificate</Button></div>}
      </article>;
    })}</div>
  </div>;
}