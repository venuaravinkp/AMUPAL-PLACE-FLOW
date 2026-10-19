import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mic, Square, Send, Clock } from "lucide-react";
import { evaluateAnswer, type AnswerFeedback } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { fmtTime } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "@/components/glass";

type Q = { id: string; prompt: string; model_answer: string | null; time_limit_sec: number; hint?: string | null };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SR = any;

export function AnswerPractice({ q, kind, onNext }: { q: Q; kind: "communication" | "interview"; onNext?: () => void }) {
  const [text, setText] = useState("");
  const [left, setLeft] = useState(q.time_limit_sec);
  const [busy, setBusy] = useState(false);
  const [fb, setFb] = useState<AnswerFeedback | null>(null);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recRef = useRef<SR>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const evaluate = useServerFn(evaluateAnswer);
  const qc = useQueryClient();

  useEffect(() => {
    setText(""); setFb(null); setAudioUrl(null); setLeft(q.time_limit_sec);
  }, [q.id, q.time_limit_sec]);
  useEffect(() => {
    if (fb) return;
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, [fb, q.id]);

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => { setAudioUrl(URL.createObjectURL(new Blob(chunks, { type: "audio/webm" }))); stream.getTracks().forEach((t) => t.stop()); };
      mr.start();
      mediaRef.current = mr;
      const W = window as unknown as { SpeechRecognition?: SR; webkitSpeechRecognition?: SR };
      const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
      if (Ctor) {
        const rec = new Ctor();
        rec.continuous = true; rec.interimResults = false; rec.lang = "en-IN";
        rec.onresult = (e: SR) => {
          let s = "";
          for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) s += e.results[i][0].transcript + " ";
          if (s) setText((t) => (t ? t + " " : "") + s.trim());
        };
        rec.start();
        recRef.current = rec;
      } else {
        toast.info("Live transcription isn't supported in this browser — your audio is recorded; please type a summary too.");
      }
      setRecording(true);
    } catch {
      toast.error("Microphone access was blocked.");
    }
  }
  function stopRec() {
    recRef.current?.stop(); mediaRef.current?.stop(); setRecording(false);
  }

  async function submit() {
    if (text.trim().length < 15) return toast.error("Please write or speak a fuller answer first.");
    setBusy(true);
    try {
      const r = await evaluate({ data: { question: q.prompt, answer: text, modelAnswer: q.model_answer, kind } });
      setFb(r);
      const { error } = await supabase.rpc("record_activity", { _module: kind, _question: q.id, _score: r.overall, _max: 10, _answer: text, _feedback: r });
      if (error) throw error;
      qc.invalidateQueries();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <div className="solid-panel p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Your answer</span>
          {!fb && <span className={`flex items-center gap-1 font-mono text-sm font-bold ${left < 20 ? "text-destructive" : "text-primary"}`}><Clock className="h-4 w-4" />{fmtTime(left)}</span>}
        </div>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} disabled={!!fb} rows={9} placeholder="Type your answer, or record with your voice…" className="bg-background/50 text-base leading-relaxed" />
        {left === 0 && !fb && <p className="mt-2 text-xs text-destructive">Time's up — submit when ready.</p>}
        {audioUrl && <audio controls src={audioUrl} className="mt-3 w-full" />}
        {!fb && (
          <div className="mt-4 flex flex-wrap gap-2">
            {recording ? (
              <Button variant="outline" onClick={stopRec} className="rounded-full border-destructive text-destructive"><Square className="mr-1 h-4 w-4" />Stop recording</Button>
            ) : (
              <Button variant="outline" onClick={startRec} className="rounded-full"><Mic className="mr-1 h-4 w-4" />Record voice answer</Button>
            )}
            <Button onClick={submit} disabled={busy} className="bg-gradient-primary rounded-full font-bold"><Send className="mr-1 h-4 w-4" />{busy ? "Evaluating…" : "Submit answer"}</Button>
          </div>
        )}
      </div>
      {fb && (
        <>
          <GlassCard className="p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xl font-bold">Feedback</h3>
              <span className="font-display text-3xl font-extrabold text-primary">{fb.overall}/10</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["clarity", "confidence", "grammar", "structure"] as const).map((k) => (
                <div key={k} className="solid-panel p-3">
                  <div className="text-xs capitalize text-muted-foreground">{k}</div>
                  <div className="font-display text-xl font-bold">{fb[k]}/10</div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-glass"><div className="bg-gradient-primary h-full" style={{ width: `${fb[k] * 10}%` }} /></div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed">{fb.summary}</p>
            <h4 className="mt-4 font-semibold">How to improve</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{fb.improvements.map((i) => <li key={i}>{i}</li>)}</ul>
          </GlassCard>
          {q.model_answer && (
            <div className="solid-panel p-6">
              <h3 className="mb-2 font-bold text-lime">Sample strong answer</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{q.model_answer}</p>
            </div>
          )}
          {onNext && <Button onClick={onNext} className="rounded-full">Next question</Button>}
        </>
      )}
    </div>
  );
}
