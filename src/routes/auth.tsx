import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import "@lovable.dev/cloud-auth-js/styles.css";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { GlassCard } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["signin", "signup", "forgot"]).optional() }),
  head: () => ({
    meta: [
      { title: "Sign in — AMUPAL PLACE FLOW" },
      { name: "description", content: "Sign in or create your AMUPAL PLACE FLOW student account." },
      { property: "og:title", content: "Sign in — AMUPAL PLACE FLOW" },
      { property: "og:description", content: "Access your placement plan, practice and progress." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) navigate({ to: "/dashboard" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name } },
        });
        if (error) throw error;
        if (!data.session) setSent("Check your email to confirm your account, then sign in.");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        setSent("We sent a password reset link to your email.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function oauth(p: "google" | "lovable") {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(r.error.message ?? "Sign-in failed");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <GlassCard className="w-full max-w-md p-8">
        <Link to="/" className="font-display text-lg font-extrabold">AMUPAL <span className="text-primary">PLACE FLOW</span></Link>
        <h1 className="mt-6 text-3xl font-bold">
          {mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset password" : "Welcome back"}
        </h1>
        {sent ? (
          <p className="mt-6 rounded-xl bg-primary/10 p-4 text-sm">{sent}</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div><Label htmlFor="n">Full name</Label><Input id="n" required value={name} onChange={(e) => setName(e.target.value)} /></div>
            )}
            <div><Label htmlFor="e">Email</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            {mode !== "forgot" && (
              <div><Label htmlFor="p">Password</Label><Input id="p" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            )}
            <Button disabled={busy} className="bg-gradient-primary h-11 w-full rounded-full font-bold">
              {busy ? "Please wait…" : mode === "signup" ? "Sign up" : mode === "forgot" ? "Send reset link" : "Sign in"}
            </Button>
          </form>
        )}
        {mode !== "forgot" && !sent && (
          <>
            <div className="my-5 text-center text-xs text-muted-foreground">or</div>
            <div className="space-y-2">
              <Button variant="outline" className="h-11 w-full rounded-full" onClick={() => oauth("google")}>Continue with Google</Button>
              <button type="button" className="lovable-auth-button w-full" onClick={() => oauth("lovable")}>Continue with Lovable</button>
            </div>
          </>
        )}
        <div className="mt-6 flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              <button onClick={() => { setMode("signup"); setSent(null); }} className="hover:text-primary">Create account</button>
              <button onClick={() => { setMode("forgot"); setSent(null); }} className="hover:text-primary">Forgot password?</button>
            </>
          ) : (
            <button onClick={() => { setMode("signin"); setSent(null); }} className="hover:text-primary">Back to sign in</button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
