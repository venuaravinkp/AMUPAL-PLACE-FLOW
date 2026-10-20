import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/data";
import { GlassCard } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DEPARTMENT_GROUPS, CAREER_INTERESTS, LEARNING_FORMATS, IMPROVEMENT_AREAS, DEGREES } from "@/lib/paths";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Set up your plan — AMUPAL PLACE FLOW" }, { name: "description", content: "Tell us about you to build your placement plan." }, { property: "og:title", content: "Onboarding — AMUPAL PLACE FLOW" }, { property: "og:description", content: "Build your personalised placement plan." }] }),
  component: Onboarding,
});

const COMPANIES = ["TCS", "Infosys", "Wipro", "Accenture", "Capgemini", "product"];
const LEVELS = ["beginner", "intermediate", "advanced"];
const GROUP_KEYS = Object.keys(DEPARTMENT_GROUPS);
const ROLES = Array.from(new Set(GROUP_KEYS.flatMap((k) => DEPARTMENT_GROUPS[k].roles))).concat("Other");
void [CAREER_INTERESTS, LEARNING_FORMATS, IMPROVEMENT_AREAS, DEGREES];

function Chips({ options, value, onChange, multi }: { options: string[]; value: string[]; onChange: (v: string[]) => void; multi?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button type="button" key={o}
            onClick={() => onChange(multi ? (on ? value.filter((x) => x !== o) : [...value, o]) : [o])}
            className={cn("rounded-full border px-4 py-2 text-sm capitalize transition", on ? "border-primary bg-primary/20 text-primary" : "border-glass-border bg-glass text-muted-foreground hover:text-foreground")}>
            {o === "product" ? "Product-based" : o}
          </button>
        );
      })}
    </div>
  );
}

function Onboarding() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ full_name: "", college: "", branch: "", year: "3rd year", target_role: "Software Engineer", target_companies: [] as string[], aptitude_level: "beginner", coding_level: "beginner", communication_level: "beginner" });
  useEffect(() => { if (me?.profile.full_name) setF((x) => ({ ...x, full_name: x.full_name || me.profile.full_name! })); }, [me]);
  const set = (k: keyof typeof f, v: unknown) => setF((x) => ({ ...x, [k]: v }));

  async function finish() {
    if (!me) return;
    const { error } = await supabase.from("profiles").update({ ...f, onboarded: true }).eq("id", me.user.id);
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["me"] });
    toast.success("Your placement plan is ready!");
    navigate({ to: "/dashboard" });
  }

  const steps = [
    <div key="a" className="space-y-4">
      <div><Label>Full name</Label><Input value={f.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>
      <div><Label>College name</Label><Input value={f.college} onChange={(e) => set("college", e.target.value)} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label>Branch</Label><Input placeholder="e.g. CSE, ECE" value={f.branch} onChange={(e) => set("branch", e.target.value)} /></div>
        <div><Label>Year</Label><Chips options={["1st year", "2nd year", "3rd year", "4th year"]} value={[f.year]} onChange={(v) => set("year", v[0])} /></div>
      </div>
    </div>,
    <div key="b" className="space-y-6">
      <div><Label className="mb-2 block">Target role</Label><Chips options={ROLES} value={[f.target_role]} onChange={(v) => set("target_role", v[0])} /></div>
      <div><Label className="mb-2 block">Target companies (pick any)</Label><Chips multi options={COMPANIES} value={f.target_companies} onChange={(v) => set("target_companies", v)} /></div>
    </div>,
    <div key="c" className="space-y-6">
      {(["aptitude_level", "coding_level", "communication_level"] as const).map((k) => (
        <div key={k}><Label className="mb-2 block capitalize">Current {k.split("_")[0]} level</Label><Chips options={LEVELS} value={[f[k]]} onChange={(v) => set(k, v[0])} /></div>
      ))}
    </div>,
  ];
  const canNext = step === 0 ? f.full_name && f.college && f.branch : step === 1 ? f.target_role : true;

  return (
    <div className="mx-auto max-w-2xl py-6">
      <p className="text-sm text-primary">Step {step + 1} of 3</p>
      <h1 className="mb-6 text-3xl font-bold md:text-4xl">{["About you", "Your goals", "Where you are today"][step]}</h1>
      <GlassCard className="p-6">{steps[step]}</GlassCard>
      <div className="mt-6 flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)} className="rounded-full">Back</Button>
        {step < 2 ? (
          <Button disabled={!canNext} onClick={() => setStep(step + 1)} className="bg-gradient-primary rounded-full px-8 font-bold">Next</Button>
        ) : (
          <Button onClick={finish} className="bg-gradient-primary rounded-full px-8 font-bold">Create my plan</Button>
        )}
      </div>
    </div>
  );
}
