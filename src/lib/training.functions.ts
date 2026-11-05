import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getLesson, passed, scoreQuiz } from "./lessons";
import { assignmentSchema } from "./training";

const idSchema = z.object({ id: z.string().uuid() });
export const submitVerifiedQuiz = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ slug: z.string(), picks: z.array(z.number().int().min(0).max(20)).max(100) }).parse(v))
  .handler(async ({ context, data }) => {
    const lesson = getLesson(data.slug);
    if (!lesson || data.picks.length !== lesson.quiz.length || data.picks.some((v, i) => v >= (lesson.quiz[i]?.options.length ?? 0))) throw new Error("Answer every quiz question.");
    const score = scoreQuiz(lesson.quiz, data.picks), completed = passed(score, lesson.quiz.length, lesson.passPercent);
    const { data: old, error: readError } = await context.supabase.from("verified_lesson_results").select("score,completed").eq("user_id", context.userId).eq("lesson_slug", data.slug).maybeSingle();
    if (readError) throw new Error("Saved quiz results could not be checked.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("verified_lesson_results").upsert({ user_id: context.userId, lesson_slug: data.slug, score: Math.max(score, old?.score ?? 0), total: lesson.quiz.length, completed: completed || !!old?.completed, updated_at: new Date().toISOString() });
    if (error) throw new Error("Quiz result could not be saved.");
    return { score, total: lesson.quiz.length, completed };
  });

export const readCertificates = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [courses, results, attempts, issued] = await Promise.all([
    context.supabase.from("certificate_courses").select("*").eq("active", true),
    context.supabase.from("verified_lesson_results").select("*").eq("user_id", context.userId),
    context.supabase.from("test_attempts").select("test_id,accuracy").eq("user_id", context.userId).not("submitted_at", "is", null),
    context.supabase.from("issued_certificates").select("*").eq("user_id", context.userId),
  ]);
  if (courses.error || results.error || attempts.error || issued.error) throw new Error("Certificates could not be loaded.");
  return { courses: courses.data, results: results.data, attempts: attempts.data, issued: issued.data };
});
export const issueCertificate = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((v) => idSchema.parse(v)).handler(async ({ context, data }) => {
  const { data: id, error } = await context.supabase.rpc("issue_course_certificate", { _course: data.id });
  if (error) throw new Error(error.message);
  return id;
});
export const verifyCertificate = createServerFn({ method: "GET" }).inputValidator((v) => idSchema.parse(v)).handler(async ({ data }) => {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env['SUPABASE_URL'], key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error("Verification is temporarily unavailable.");
  const client = createClient(url, key, { auth: { persistSession: false }, global: { fetch: (input, init) => { const headers = new Headers(init?.headers); if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization"); headers.set("apikey", key); return fetch(input, { ...init, headers }); } } });
  const { data: certificate, error } = await client.rpc("verify_course_certificate", { _id: data.id });
  if (error) throw new Error("Verification is temporarily unavailable.");
  return (certificate as { id: string; student_name: string; course_title: string; skills: string[]; issued_at: string; revoked: boolean }[])[0] ?? null;
});
export const readAssignments = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from("training_assignments").select("*").eq("student_id", context.userId).order("due_date");
  if (error) throw new Error("Assignments could not be loaded.");
  return data;
});
export const completeAssignment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((v) => idSchema.extend({ completed: z.boolean() }).parse(v)).handler(async ({ context, data }) => {
  const { error } = await context.supabase.rpc("complete_training_assignment", { _id: data.id, _completed: data.completed });
  if (error) throw new Error("Assignment could not be updated.");
  return { saved: true };
});
export const readTraining = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [role, reports, assignments] = await Promise.all([context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }), context.supabase.rpc("training_access", { _permission: "reports" }), context.supabase.rpc("training_access", { _permission: "assignments" })]);
  if (role.error || reports.error || assignments.error) throw new Error("Access could not be checked.");
  if (!role.data && !reports.data && !assignments.data) return { allowed: false as const };
  const [profiles, progress, attempts, tasks, permissions, courses, tests, certificates, audit] = await Promise.all([
    context.supabase.from("profiles").select("id,full_name,email,college,branch,points").order("full_name"),
    reports.data ? context.supabase.from("progress").select("user_id,topic,attempted,correct") : Promise.resolve({ data: [], error: null }),
    reports.data ? context.supabase.from("test_attempts").select("user_id,accuracy").not("submitted_at", "is", null) : Promise.resolve({ data: [], error: null }),
    assignments.data ? context.supabase.from("training_assignments").select("*").order("due_date") : Promise.resolve({ data: [], error: null }),
    role.data ? context.supabase.from("trainer_permissions").select("*") : Promise.resolve({ data: [], error: null }),
    role.data ? context.supabase.from("certificate_courses").select("*") : Promise.resolve({ data: [], error: null }),
    role.data ? context.supabase.from("tests").select("id,title,active") : Promise.resolve({ data: [], error: null }),
    role.data ? context.supabase.from("issued_certificates").select("*").order("issued_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    role.data ? context.supabase.from("training_audit").select("*").order("created_at", { ascending: false }).limit(30) : Promise.resolve({ data: [], error: null }),
  ]);
  if ([profiles, progress, attempts, tasks, permissions, courses, tests, certificates, audit].some((r) => r.error)) throw new Error("Training records could not be loaded.");
  return { allowed: true as const, owner: !!role.data, reports: !!reports.data, assignments: !!assignments.data, profiles: profiles.data ?? [], progress: progress.data ?? [], attempts: attempts.data ?? [], tasks: tasks.data ?? [], permissions: permissions.data ?? [], courses: courses.data ?? [], tests: tests.data ?? [], certificates: certificates.data ?? [], audit: audit.data ?? [] };
});
export const grantTrainer = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((v) => idSchema.extend({ reports: z.boolean(), assignments: z.boolean() }).parse(v)).handler(async ({ context, data }) => {
  const { error } = await context.supabase.rpc("set_trainer_access", { _target: data.id, _reports: data.reports, _assignments: data.assignments });
  if (error) throw new Error(error.message);
  return { saved: true };
});
export const addAssignment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((v) => assignmentSchema.parse(v)).handler(async ({ context, data }) => {
  const { error } = await context.supabase.from("training_assignments").insert({ ...data, trainer_id: context.userId });
  if (error) throw new Error("Assignment could not be added. Check your trainer permission.");
  return { saved: true };
});
export const deleteAssignment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((v) => idSchema.parse(v)).handler(async ({ context, data }) => {
  const { error } = await context.supabase.from("training_assignments").delete().eq("id", data.id).select().single();
  if (error) throw new Error("Assignment could not be deleted.");
  return { deleted: true };
});
export const saveCourse = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((v) => z.object({ id: z.string().uuid().optional(), title: z.string().trim().min(1).max(200), skills: z.array(z.string().trim().min(1).max(100)).min(1).max(20), required_lessons: z.array(z.string()).min(1).refine((s) => s.every((v) => !!getLesson(v))), final_test_id: z.string().uuid(), pass_percent: z.number().int().min(1).max(100), active: z.boolean() }).parse(v)).handler(async ({ context, data }) => {
  const { error } = await context.supabase.from("certificate_courses").upsert(data).select().single();
  if (error) throw new Error("Course could not be saved. Only owners can manage courses.");
  return { saved: true };
});
export const manageCertificate = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((v) => idSchema.extend({ name: z.string().trim().min(1).max(150).nullable(), reason: z.string().trim().min(1).max(500).nullable() }).parse(v)).handler(async ({ context, data }) => {
  const { error } = await context.supabase.rpc("manage_course_certificate", { _id: data.id, _name: data.name ?? undefined, _reason: data.reason ?? undefined });
  if (error) throw new Error(error.message);
  return { saved: true };
});