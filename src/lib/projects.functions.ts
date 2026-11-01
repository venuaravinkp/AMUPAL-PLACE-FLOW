import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getProject, safeProjectUrl, submissionIssues } from "./projects";

export const readProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("student_projects").select("*").eq("user_id", context.userId).order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const saveProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    slug: z.string().max(100), completed: z.array(z.string()).max(4), notes: z.string().max(10000),
    summary: z.string().max(5000), repository: z.string().max(2000), demo: z.string().max(2000),
    status: z.enum(["in_progress", "submitted"]),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const project = getProject(data.slug);
    if (!project) throw new Error("Project not found");
    const completed = [...new Set(data.completed)].filter((id) => project.milestones.some((m) => m.id === id));
    const repository = safeProjectUrl(data.repository), demo = safeProjectUrl(data.demo);
    if (data.status === "submitted") {
      const issues = submissionIssues(project, completed, data.summary, repository, demo);
      if (issues.length) throw new Error(issues.join(" "));
    }
    const { data: saved, error } = await context.supabase.from("student_projects").upsert({
      user_id: context.userId, project_slug: project.slug, completed_milestones: completed,
      notes: data.notes, summary: data.summary, repository_url: repository, demo_url: demo,
      status: data.status, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,project_slug" }).select().single();
    if (error) throw new Error(error.message);
    return saved;
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ slug: z.string().max(100) }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("student_projects").delete().eq("user_id", context.userId).eq("project_slug", data.slug);
    if (error) throw new Error(error.message);
    return { deleted: true };
  });