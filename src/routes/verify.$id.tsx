import { createFileRoute, useHydrated } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Award, Printer, Copy, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { verificationOptions } from "@/lib/training-queries";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/verify/$id")({
  head: () => ({ meta: [{ title: "Certificate verification — AMUPAL PLACE FLOW" }, { name: "description", content: "Verify an AMUPAL PLACE FLOW course certificate." }, { property: "og:title", content: "Certificate verification — AMUPAL PLACE FLOW" }, { property: "og:description", content: "Public verification of a placement-training achievement." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  loader: async ({ context, params }) => { await context.queryClient.ensureQueryData(verificationOptions(params.id)); }, component: Verification,
});
function Verification() {
  const hydrated = useHydrated();
  const { id } = Route.useParams(), { data: c } = useSuspenseQuery(verificationOptions(id));
  if (!c) return <main className="mx-auto max-w-3xl p-8"><h1 className="text-2xl font-bold">Certificate not found</h1><p className="mt-3 text-muted-foreground">Check the certificate number or verification link.</p></main>;
  return <main className="mx-auto max-w-4xl px-4 py-8"><div className="resume-controls mb-6 flex flex-wrap items-center gap-3"><span className={c.revoked ? "text-destructive" : "text-success"}><ShieldCheck className="mr-2 inline h-5 w-5" />{c.revoked ? "Revoked — no longer valid" : "Verified certificate"}</span><Button variant="outline" disabled={c.revoked} onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print / Save PDF</Button><Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); toast.success("Verification link copied"); } catch { toast.error("Could not copy the link"); } }}><Copy className="mr-2 h-4 w-4" />Copy link</Button></div>
    <article className="resume-paper certificate-paper break-words text-center"><div className="text-lg font-bold">AMUPAL PLACE FLOW</div><Award className="mx-auto my-8 h-16 w-16" /><h1>Certificate of Completion</h1><p className="mt-8">This certifies that</p><div className="my-5 break-words text-3xl font-bold">{c.student_name}</div><p>has successfully completed</p><h2 className="mt-5">{c.course_title}</h2><p className="mt-5">{c.skills.join(" · ")}</p><p className="mt-10">Issued {new Date(c.issued_at).toLocaleDateString("en-IN", { dateStyle: "long", timeZone: "UTC" })}</p><p className="mt-4 break-all text-xs">Certificate ID: {c.id}</p>{c.revoked && <p className="mt-6 font-bold">REVOKED</p>}<p className="mt-4 break-all text-xs">{hydrated ? `${window.location.origin}/verify/${c.id}` : `/verify/${c.id}`}</p></article>
  </main>;
}