import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resumeSchema, taskSchema, validDate, makeWeek } from "./career";

export const readResume = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from("student_resumes").select("*").eq("user_id", context.userId).maybeSingle();
  if (error) throw new Error("Your resume could not be loaded. Please try again.");
  return data;
});
export const saveResume = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ document: resumeSchema, job_description: z.string().max(15000) }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: saved, error } = await context.supabase.from("student_resumes").upsert({ user_id: context.userId, document: data.document, job_description: data.job_description, updated_at: new Date().toISOString() }).select().single();
    if (error) throw new Error("Your resume could not be saved. Please try again.");
    return saved;
  });
export const eraseResume = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { error } = await context.supabase.from("student_resumes").delete().eq("user_id", context.userId);
  if (error) throw new Error("Your resume could not be deleted.");
  return { deleted: true };
});
export const readPlanner = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [plan, tasks] = await Promise.all([
    context.supabase.from("study_plans").select("*").eq("user_id", context.userId).maybeSingle(),
    context.supabase.from("study_tasks").select("*").eq("user_id", context.userId).order("due_date").order("created_at"),
  ]);
  if (plan.error || tasks.error) throw new Error("Your planner could not be loaded.");
  return { plan: plan.data, tasks: tasks.data ?? [] };
});
export const savePlan = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ drive_name: z.string().max(200), drive_date: z.string().refine((v) => !v || validDate(v)).nullable(), daily_minutes: z.number().int().min(15).max(240) }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("study_plans").upsert({ ...data, drive_date: data.drive_date || null, user_id: context.userId, updated_at: new Date().toISOString() });
    if (error) throw new Error("Your placement date could not be saved.");
    return { saved: true };
  });
export const saveTask = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => taskSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { id, ...fields } = data;
    if (id) {
      const { error } = await context.supabase.from("study_tasks").update(fields).eq("user_id", context.userId).eq("id", id).select().single();
      if (error) throw new Error("This task could not be updated.");
    } else {
      const { error } = await context.supabase.from("study_tasks").insert({ ...fields, user_id: context.userId });
      if (error) throw new Error("This task could not be added.");
    }
    return { saved: true };
  });
export const eraseTask = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("study_tasks").delete().eq("user_id", context.userId).eq("id", data.id);
    if (error) throw new Error("This task could not be deleted.");
    return { deleted: true };
  });
export const generateWeek = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ start: z.string().refine(validDate), minutes: z.number().int().min(15).max(240) }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: profile, error: profileError } = await context.supabase.from("profiles").select("department_group").eq("id", context.userId).single();
    if (profileError) throw new Error("Your profile could not be loaded.");
    const { data: progress } = await context.supabase.from("progress").select("topic,attempted,correct").eq("user_id", context.userId).eq("module", "aptitude");
    const weak = (progress ?? []).filter((p) => p.attempted > 0).sort((a, b) => a.correct / a.attempted - b.correct / b.attempted)[0]?.topic;
    const tasks = makeWeek(data.start, data.minutes, profile.department_group ?? "science_arts", weak);
    const { data: existing, error: checkError } = await context.supabase.from("study_tasks").select("title,due_date").eq("user_id", context.userId).gte("due_date", data.start).lte("due_date", tasks[tasks.length - 1]?.due_date ?? data.start);
    if (checkError) throw new Error("Existing tasks could not be checked.");
    const fresh = tasks.filter((t) => !existing?.some((e) => e.title === t.title && e.due_date === t.due_date));
    if (fresh.length) {
      const { error } = await context.supabase.from("study_tasks").insert(fresh.map((t) => ({ ...t, user_id: context.userId })));
      if (error) throw new Error("Your weekly plan could not be created.");
    }
    return { added: fresh.length };
  });