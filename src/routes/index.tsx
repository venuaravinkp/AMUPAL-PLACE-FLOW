import { createFileRoute, Link } from "@tanstack/react-router";
import { Calculator, Code2, MessageSquare, Mic, ClipboardList, Building2, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AMUPAL PLACE FLOW — Daily placement coach for students" },
      { name: "description", content: "Prepare for campus placements step by step: aptitude, coding, communication, mock interviews and company tests." },
      { property: "og:title", content: "AMUPAL PLACE FLOW — Daily placement coach" },
      { property: "og:description", content: "Aptitude, coding, communication and mock interviews with progress tracking and leaderboards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Calculator, title: "Aptitude & Reasoning", text: "Quant, logical, verbal and DI with timers and explanations." },
  { icon: Code2, title: "Coding Practice", text: "Write, run and submit code against real test cases." },
  { icon: MessageSquare, title: "Communication", text: "Self-intro, GD, emails — with AI feedback on clarity and grammar." },
  { icon: Mic, title: "Mock Interviews", text: "HR, technical and company questions, written or spoken." },
  { icon: ClipboardList, title: "Test Center", text: "Timed mocks with auto-submit and weak-area analysis." },
  { icon: Building2, title: "Company Tracks", text: "TCS, Infosys, Wipro, Accenture, Capgemini & product companies." },
];

function Landing() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="flex items-center justify-between">
        <div className="font-display text-xl font-extrabold">AMUPAL <span className="text-primary">PLACE FLOW</span></div>
        <Link to="/auth"><Button variant="outline">Sign in</Button></Link>
      </header>
      <section className="py-20 text-center md:py-28">
        <p className="mb-4 inline-block rounded-full border border-glass-border bg-glass px-4 py-1 text-sm text-muted-foreground">Your daily digital placement coach</p>
        <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-[1.05] md:text-7xl">
          Get <span className="text-gradient">placement-ready</span>, one mission a day.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Learn → Practise → Test → Feedback → Improve. A personalised plan, a readiness score, and daily missions built for campus placements.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/auth" search={{ mode: "signup" }}>
            <Button size="lg" className="bg-gradient-primary shadow-glow h-12 rounded-full px-8 text-base font-bold">
              Start free <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/auth"><Button size="lg" variant="outline" className="h-12 rounded-full px-8 text-base">I have an account</Button></Link>
        </div>
      </section>
      <section className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <GlassCard key={f.title} hover>
            <f.icon className="mb-4 h-8 w-8 text-primary" />
            <h3 className="text-lg font-bold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </GlassCard>
        ))}
      </section>
    </div>
  );
}
