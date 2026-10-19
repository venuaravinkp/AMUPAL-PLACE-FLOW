import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LiquidBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="animate-blob absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full bg-electric/25 blur-3xl" />
      <div
        className="animate-blob absolute right-[-8rem] top-1/3 h-[26rem] w-[26rem] rounded-full bg-violet/25 blur-3xl"
        style={{ animationDelay: "-7s" }}
      />
      <div
        className="animate-blob absolute bottom-[-10rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-primary/20 blur-3xl"
        style={{ animationDelay: "-14s" }}
      />
      <div
        className="animate-blob absolute bottom-20 right-1/4 h-64 w-64 rounded-full bg-lime/10 blur-3xl"
        style={{ animationDelay: "-3s" }}
      />
    </div>
  );
}

export function GlassCard({
  children,
  className,
  hover,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return <div className={cn("glass p-5", hover && "lift", className)}>{children}</div>;
}

export function ProgressRing({
  value,
  size = 140,
  stroke = 12,
  label,
  colorVar = "var(--primary)",
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  colorVar?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--glass-border)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colorVar}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          style={{ transition: "stroke-dashoffset 0.8s ease", filter: `drop-shadow(0 0 8px ${colorVar})` }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-3xl font-bold" style={{ fontSize: size / 4.5 }}>
          {Math.round(v)}
        </div>
        {label && <div className="text-xs text-muted-foreground">{label}</div>}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function DifficultyBadge({ d }: { d: string }) {
  const cls =
    d === "easy"
      ? "bg-success/15 text-success border-success/30"
      : d === "medium"
        ? "bg-primary/15 text-primary border-primary/30"
        : "bg-destructive/15 text-destructive border-destructive/30";
  return <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize", cls)}>{d}</span>;
}
