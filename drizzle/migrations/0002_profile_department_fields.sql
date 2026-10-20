ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS department_group text,
  ADD COLUMN IF NOT EXISTS degree text,
  ADD COLUMN IF NOT EXISTS career_interests text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS learning_format text,
  ADD COLUMN IF NOT EXISTS improvement_areas text[] NOT NULL DEFAULT '{}';