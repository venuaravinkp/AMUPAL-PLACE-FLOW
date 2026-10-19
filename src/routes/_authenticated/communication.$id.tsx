import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABEL } from "@/lib/data";
import { AnswerPractice } from "@/components/AnswerPractice";

export const Route = createFileRoute("/_authenticated/communication/$id")({
  head: () => ({ meta: [{ title: "Communication practice — AMUPAL PLACE FLOW" }, { name: "description", content: "Answer and get feedback." }, { property: "og:title", content: "Communication practice — AMUPAL PLACE FLOW" }, { property: "og:description", content: "Practise and get AI feedback." }] }),
  component: CommPractice,
});

function CommPractice() {
  const { id } = Route.useParams();
  const { data: q } = useQuery({ queryKey: ["q", id], queryFn: async () => (await supabase.from("questions").select("*").eq("id", id).single()).data });
  if (!q) return <div className="text-muted-foreground">Loading…</div>;
  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/communication" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Communication</Link>
      <p className="text-sm font-semibold text-primary">{CATEGORY_LABEL[q.category]}</p>
      <div className="solid-panel my-4 p-6"><p className="whitespace-pre-wrap text-lg font-medium leading-relaxed">{q.prompt}</p>{q.hint && <p className="mt-3 text-sm text-muted-foreground">Tip: {q.hint}</p>}</div>
      <AnswerPractice q={q} kind="communication" />
    </div>
  );
}
