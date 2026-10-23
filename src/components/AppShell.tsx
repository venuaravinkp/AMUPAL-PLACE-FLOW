import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  LayoutDashboard, Calculator, Code2, MessageSquare, Mic, ClipboardList, Building2, Trophy, Shield, LogOut, Flame, GraduationCap, Briefcase,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/data";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/teacher", label: "AI Teacher", icon: GraduationCap },
  { to: "/aptitude", label: "Aptitude", icon: Calculator },
  { to: "/coding", label: "Coding", icon: Code2 },
  { to: "/communication", label: "Communication", icon: MessageSquare },
  { to: "/interview", label: "Interview", icon: Mic },
  { to: "/tests", label: "Tests", icon: ClipboardList },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/interview-prep", label: "Interview Prep", icon: Briefcase },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="glass sticky top-4 m-4 hidden h-[calc(100vh-2rem)] w-60 shrink-0 flex-col p-4 md:flex">
        <Link to="/dashboard" className="mb-6 px-2">
          <div className="font-display text-lg font-extrabold leading-tight">
            AMUPAL <span className="text-primary">PLACE FLOW</span>
          </div>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-glass hover:text-foreground"
              activeProps={{ className: "!bg-primary/15 !text-primary" }}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
          {me?.isStaff && (
            <Link
              to="/admin"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-glass hover:text-foreground"
              activeProps={{ className: "!bg-primary/15 !text-primary" }}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>
        <div className="mt-4 border-t border-glass-border pt-4">
          <div className="truncate px-2 text-sm font-semibold">{me?.profile.full_name ?? "Student"}</div>
          <div className="mb-3 flex items-center gap-1 px-2 text-xs text-muted-foreground">
            <Flame className="h-3 w-3 text-primary" /> {me?.streak?.current_streak ?? 0}-day streak · {me?.profile.points ?? 0} pts
          </div>
          <button onClick={signOut} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-glass hover:text-foreground">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <header className="glass sticky top-2 z-30 m-2 flex items-center justify-between px-4 py-3 md:hidden">
        <Link to="/dashboard" className="font-display font-extrabold">
          AMUPAL <span className="text-primary">PLACE FLOW</span>
        </Link>
        <div className="flex items-center gap-3">
          {me?.isStaff && <Link to="/admin" aria-label="Admin"><Shield className="h-5 w-5" /></Link>}
          <button onClick={signOut} aria-label="Sign out"><LogOut className="h-5 w-5" /></button>
        </div>
      </header>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-4 md:px-8 md:py-8">{children}</main>

      <nav className="glass fixed inset-x-2 bottom-2 z-30 flex justify-between overflow-x-auto px-2 py-2 md:hidden">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} className="flex min-w-14 flex-col items-center gap-0.5 rounded-xl px-1 py-1 text-[10px] text-muted-foreground" activeProps={{ className: "!text-primary" }}>
            <n.icon className="h-5 w-5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
