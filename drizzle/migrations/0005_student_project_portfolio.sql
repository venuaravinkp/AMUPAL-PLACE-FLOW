CREATE TABLE public.student_projects (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 project_slug text NOT NULL,
 completed_milestones text[] NOT NULL DEFAULT '{}',
 notes text NOT NULL DEFAULT '',
 repository_url text NOT NULL DEFAULT '',
 demo_url text NOT NULL DEFAULT '',
 summary text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted')),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id, project_slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_projects TO authenticated;
GRANT ALL ON public.student_projects TO service_role;
ALTER TABLE public.student_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own projects" ON public.student_projects FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Students insert own projects" ON public.student_projects FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Students update own projects" ON public.student_projects FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Students delete own projects" ON public.student_projects FOR DELETE TO authenticated USING (user_id = auth.uid());