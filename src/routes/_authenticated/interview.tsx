import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AnswerPractice } from "@/components/AnswerPractice";
import { GlassCard, PageHeader } from "@/components/glass";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/interview")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({ meta: [{ title: "Mock interview — AMUPAL PLACE FLOW" }, { name: "description", content: "HR, technical and company-specific mock interview questions." }, { property: "og:title", content: "Mock interview — AMUPAL PLACE FLOW" }, { property: "og:description", content: "Practise interviews with AI feedback." }] }),
  component: Interview,
});

const TYPES = [{ id: "hr", label: "HR" }, { id: "technical", label: "Technical" }, { id: "company", label: "Company-specific" }];

function Interview() {
  const { q: initial } = Route.useSearch();
  const [type, setType] = useState("hr");
  const [idx, setIdx] = useState(0);
  const { data } = useQuery({
    queryKey: ["interview-qs"],
    queryFn: async () => (await supabase.from("questions").select("*").eq("module", "interview").order("created_at")).data ?? [],
  });
  useEffect(() => {
    if (initial && data) {
      const q = data.find((x) => x.id === initial);
      if (q) { setType(q.category); setIdx(data.filter((x) => x.category === q.category).indexOf(q)); }
    }
  }, [initial, data]);
  const list = useMemo(() => (data ?? []).filter((q) => q.category === type), [data, type]);
  const q = list[idx % Math.max(list.length, 1)];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Mock Interview" subtitle="One question at a time. Answer in writing or by voice, then review your feedback." />
      <div className="mb-5 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button key={t.id} onClick={() => { setType(t.id); setIdx(0); }} className={cn("rounded-full border px-4 py-2 text-sm font-semibold", type === t.id ? "border-primary bg-primary/20 text-primary" : "border-glass-border bg-glass text-muted-foreground")}>{t.label}</button>
        ))}
      </div>
      {q ? (
        <>
          <GlassCard className="mb-4 p-6">
            <div className="mb-2 text-sm text-muted-foreground">Question {(idx % list.length) + 1} of {list.length}{q.company ? ` · ${q.company === "product" ? "Product-based" : q.company}` : ""} · {q.topic}</div>
            <p className="font-display text-2xl font-bold leading-snug">{q.prompt}</p>
          </GlassCard>
          <AnswerPractice key={q.id} q={q} kind="interview" onNext={() => setIdx(idx + 1)} />
        </>
      ) : <p className="text-muted-foreground">Loading questions…</p>}
    </div>
  );
}
