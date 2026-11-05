import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { assignmentsOptions } from "@/lib/training-queries";
import { completeAssignment } from "@/lib/training.functions";
import { PageHeader } from "@/components/glass";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/_authenticated/assignments")({
  head: () => ({ meta: [{ title: "Trainer assignments — AMUPAL PLACE FLOW" }, { name: "description", content: "View and complete your trainer-assigned placement tasks." }, { property: "og:title", content: "Trainer assignments — AMUPAL PLACE FLOW" }, { property: "og:description", content: "Your assigned placement tasks and deadlines." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(assignmentsOptions()); }, component: Assignments,
});
function Assignments() {
  const { data } = useSuspenseQuery(assignmentsOptions()), qc = useQueryClient(), complete = useServerFn(completeAssignment);
  const mutation = useMutation({ mutationFn: (data: { id: string; completed: boolean }) => complete({ data }), onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }), onError: (e) => toast.error(e.message) });
  return <div className="mx-auto max-w-4xl"><PageHeader title="Trainer assignments" subtitle={`${data.filter((t) => !t.completed).length} tasks remaining`} />{!data.length && <p className="text-muted-foreground">Your trainer has not assigned any tasks yet.</p>}<div className="space-y-4">{data.map((t) => <article className="glass p-5" key={t.id}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-words font-bold">{t.title}</h2><p className="mt-2 text-sm text-muted-foreground">Due {t.due_date} · {t.completed ? "Completed" : "Pending"}</p></div><Button variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: t.id, completed: !t.completed })}>{t.completed ? "Mark pending" : "Mark complete"}</Button></div><p className="mt-3 whitespace-pre-wrap break-words text-sm">{t.notes}</p></article>)}</div></div>;
}