import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { GraduationCap, Lightbulb, Loader2, PlayCircle, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";
import { teachTopic, findVideos, type Video } from "@/lib/ai.functions";
import { MODES, type ModeId, type TeachLesson } from "@/lib/teacher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/teacher")({
  head: () => ({ meta: [
    { title: "Smart AI Teacher — AMUPAL PLACE FLOW" },
    { name: "description", content: "Ask any placement topic and learn it in the teaching style that suits you." },
    { property: "og:title", content: "Smart AI Teacher — AMUPAL PLACE FLOW" },
    { property: "og:description", content: "Personal AI lessons with practice, hints and videos." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: TeacherPage,
});

function Practice({ p, n }: { p: TeachLesson["practice"][number]; n: number }) {
  const [pick, setPick] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  return (
    <div className="rounded-2xl border border-border p-4">
      <p className="mb-3 font-semibold">{n}. {p.q}</p>
      <div className="grid gap-2">
        {p.options.map((o, i) => (
          <button key={i} disabled={pick !== null} onClick={() => setPick(i)}
            className={cn("rounded-xl border px-4 py-2 text-left text-sm transition",
              pick !== null && i === p.answer ? "border-success bg-success/15" : pick === i ? "border-destructive bg-destructive/15" : "border-border hover:border-primary/60")}>{o}</button>
        ))}
      </div>
      {pick === null ? (hint ? <p className="mt-3 text-sm text-primary"><Lightbulb className="mr-1 inline h-4 w-4" />{p.hint}</p>
        : <button onClick={() => setHint(true)} className="mt-3 text-sm text-primary underline">Show hint</button>)
        : <p className="mt-3 text-sm">{pick === p.answer ? "✅ Correct. " : `❌ Not quite — the answer is "${p.options[p.answer]}". `}{p.explanation}</p>}
    </div>
  );
}

function TeacherPage() {
  const teach = useServerFn(teachTopic);
  const videosFn = useServerFn(findVideos);
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<ModeId>("simple");
  const [lesson, setLesson] = useState<TeachLesson | null>(null);
  const [busy, setBusy] = useState(false);
  const [follow, setFollow] = useState("");
  const [vids, setVids] = useState<{ configured: boolean; videos: Video[]; error?: string } | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  async function run(m: ModeId, followUp?: string) {
    if (!topic.trim()) return toast.error("Type a topic or question first");
    setBusy(true); setMode(m);
    try {
      const previous = lesson ? `${lesson.explanation}\n${lesson.summary}` : null;
      const l = await teach({ data: { topic, mode: m, followUp: followUp ?? null, previous } });
      setLesson(l); setFollow("");
      if (!followUp) { setVids(null); setPlaying(null); videosFn({ data: { query: l.videoQuery || topic } }).then(setVids).catch(() => setVids({ configured: true, videos: [], error: "Video search failed." })); }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not generate the lesson"); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold md:text-4xl"><GraduationCap className="h-8 w-8 text-primary" />Smart AI Teacher</h1>
        <p className="mt-1 text-muted-foreground">Ask any topic or question and pick how you want to be taught.</p>
      </div>

      <div className="glass space-y-4 p-5">
        <form onSubmit={(e) => { e.preventDefault(); run(mode); }} className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="topic" className="sr-only">Topic or question</label>
          <input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={1000} placeholder="e.g. Time and work, normalization in DBMS, a train crosses a pole in 9 s…"
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm" />
          <Button disabled={busy} className="bg-gradient-primary rounded-full px-6 font-bold">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Teach me"}</Button>
        </form>
        <div role="radiogroup" aria-label="Teaching method" className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button key={m.id} role="radio" aria-checked={mode === m.id} disabled={busy}
              onClick={() => (lesson ? run(m.id) : setMode(m.id))}
              className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition", mode === m.id ? "border-primary bg-primary/20 text-primary" : "border-glass-border text-muted-foreground hover:text-foreground")}>
              {m.id === "again" && <RotateCcw className="mr-1 inline h-3 w-3" />}{m.label}
            </button>
          ))}
        </div>
        {lesson && <p className="text-xs text-muted-foreground">Switching method re-teaches the same topic in the new style.</p>}
      </div>

      {busy && !lesson && <div className="solid-panel flex items-center gap-2 p-6 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Preparing your lesson…</div>}

      {lesson && (
        <div className={cn("solid-panel space-y-5 p-6 leading-relaxed transition-opacity", busy && "opacity-50")}>
          <div>
            <p className="text-xs font-semibold uppercase text-primary">{MODES.find((m) => m.id === mode)?.label}</p>
            <h2 className="text-2xl font-bold">{lesson.title}</h2>
          </div>
          <p>{lesson.explanation}</p>
          {lesson.concepts.length > 0 && <section><h3 className="font-bold text-primary">Basic concepts</h3><ul className="list-disc pl-5">{lesson.concepts.map((c) => <li key={c}>{c}</li>)}</ul></section>}
          {lesson.steps.length > 0 && <section><h3 className="font-bold text-primary">Step by step</h3><ol className="list-decimal space-y-1 pl-5 whitespace-pre-wrap">{lesson.steps.map((s, i) => <li key={i}>{s}</li>)}</ol></section>}
          {lesson.shortcut && <section><h3 className="font-bold text-primary">Shortcut / formula</h3><p className="rounded-xl bg-muted px-4 py-2 font-mono text-sm">{lesson.shortcut}</p></section>}
          <section className="rounded-2xl border border-border p-4"><h3 className="font-bold text-primary">Worked example</h3><p className="font-semibold">{lesson.example.problem}</p><p className="mt-1 whitespace-pre-wrap text-sm">{lesson.example.solution}</p></section>
          <section><h3 className="font-bold text-primary">Where it's used</h3><p>{lesson.application}</p></section>
          {lesson.mistakes.length > 0 && <section><h3 className="font-bold text-primary">Common mistakes</h3><ul className="list-disc pl-5">{lesson.mistakes.map((m) => <li key={m}>{m}</li>)}</ul></section>}
          {lesson.practice.length > 0 && <section className="space-y-3"><h3 className="font-bold text-primary">Practice quiz</h3>{lesson.practice.map((p, i) => <Practice key={`${lesson.title}-${i}`} p={p} n={i + 1} />)}</section>}
          <section className="rounded-2xl bg-primary/10 p-4"><h3 className="font-bold text-primary">Revision summary</h3><p>{lesson.summary}</p></section>

          <form onSubmit={(e) => { e.preventDefault(); if (follow.trim()) run(mode, follow); }} className="flex gap-2">
            <label htmlFor="follow" className="sr-only">Follow-up question</label>
            <input id="follow" value={follow} onChange={(e) => setFollow(e.target.value)} maxLength={1000} placeholder="Ask a follow-up about this lesson…" className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm" />
            <Button disabled={busy || !follow.trim()} size="icon" className="rounded-full" aria-label="Send follow-up"><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      )}

      {lesson && (
        <div className="glass space-y-3 p-5">
          <h3 className="flex items-center gap-2 font-bold"><PlayCircle className="h-5 w-5 text-primary" />Videos</h3>
          {!vids ? <p className="text-sm text-muted-foreground"><Loader2 className="mr-1 inline h-4 w-4 animate-spin" />Finding videos…</p>
            : !vids.configured ? <p className="text-sm text-muted-foreground">Video search isn't set up yet. An admin needs to add a YouTube Data API key to turn this on.</p>
            : vids.error ? <p className="text-sm text-destructive">{vids.error}</p>
            : !vids.videos.length ? <p className="text-sm text-muted-foreground">No suitable videos found for this topic.</p>
            : <div className="grid gap-3 sm:grid-cols-2">{vids.videos.map((v) => (
              <div key={v.id} className="solid-panel overflow-hidden">
                {playing === v.id
                  ? <iframe className="aspect-video w-full" src={`https://www.youtube-nocookie.com/embed/${v.id}`} title={v.title} allow="encrypted-media; picture-in-picture" allowFullScreen />
                  : <button onClick={() => setPlaying(v.id)} className="relative block w-full" aria-label={`Play ${v.title}`}>
                      <img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" className="aspect-video w-full object-cover" loading="lazy" />
                      <PlayCircle className="absolute inset-0 m-auto h-12 w-12 text-primary" />
                    </button>}
                <div className="p-3 text-sm"><p className="font-semibold">{v.title}</p><p className="text-xs text-muted-foreground">{v.channel}{v.duration && ` · ${v.duration}`}{v.language && ` · ${v.language}`}</p></div>
              </div>))}</div>}
        </div>
      )}
    </div>
  );
}
