CREATE POLICY "trainer report profiles" ON public.profiles FOR SELECT TO authenticated USING(public.training_access('reports') OR public.training_access('assignments'));
CREATE POLICY "trainer report progress" ON public.progress FOR SELECT TO authenticated USING(public.training_access('reports'));
CREATE POLICY "trainer report attempts" ON public.test_attempts FOR SELECT TO authenticated USING(public.training_access('reports'));
CREATE POLICY "trainer report lessons" ON public.verified_lesson_results FOR SELECT TO authenticated USING(public.training_access('reports'));
CREATE INDEX training_assignments_student_idx ON public.training_assignments(student_id,due_date);
CREATE INDEX verified_lesson_results_user_idx ON public.verified_lesson_results(user_id);