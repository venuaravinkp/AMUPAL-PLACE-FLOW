
-- Roles
create type public.app_role as enum ('admin','trainer','student');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create or replace function public.is_staff(_user_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role in ('admin','trainer')) $$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "admin manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Profiles (users + student profile)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  college text,
  branch text,
  year text,
  target_role text,
  target_companies text[] not null default '{}',
  aptitude_level text not null default 'beginner',
  coding_level text not null default 'beginner',
  communication_level text not null default 'beginner',
  onboarded boolean not null default false,
  points integer not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "read own or staff" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "insert own" on public.profiles for insert to authenticated with check (id = auth.uid());

-- prevent students editing points
create or replace function public.protect_profile_points() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if current_setting('app.internal', true) is distinct from '1' then
    new.points := old.points;
  end if;
  return new;
end $$;
create trigger trg_protect_points before update on public.profiles for each row execute function public.protect_profile_points();

-- Streaks
create table public.streaks (
  user_id uuid primary key,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date
);
grant select on public.streaks to authenticated;
grant all on public.streaks to service_role;
alter table public.streaks enable row level security;
create policy "read own streak" on public.streaks for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id, email, full_name) values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  insert into public.streaks(user_id) values (new.id);
  insert into public.user_roles(user_id, role) values (new.id, 'student');
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Questions
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  module text not null check (module in ('aptitude','coding','communication','interview')),
  category text not null,
  topic text not null,
  company text,
  difficulty text not null default 'easy' check (difficulty in ('easy','medium','hard')),
  qtype text not null default 'mcq' check (qtype in ('mcq','coding','written')),
  prompt text not null,
  explanation text,
  hint text,
  model_answer text,
  starter_code jsonb,
  test_cases jsonb,
  time_limit_sec integer not null default 60,
  created_by uuid,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.questions to authenticated;
grant all on public.questions to service_role;
alter table public.questions enable row level security;
create policy "read questions" on public.questions for select to authenticated using (true);
create policy "staff write questions" on public.questions for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table public.answer_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  label text not null,
  is_correct boolean not null default false,
  position integer not null default 0
);
grant select (id, question_id, label, position) on public.answer_options to authenticated;
grant insert, update, delete on public.answer_options to authenticated;
grant all on public.answer_options to service_role;
alter table public.answer_options enable row level security;
create policy "read options" on public.answer_options for select to authenticated using (true);
create policy "staff write options" on public.answer_options for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create or replace function public.staff_get_options(_qid uuid) returns table(id uuid, label text, is_correct boolean, "position" integer)
language plpgsql stable security definer set search_path=public as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'forbidden'; end if;
  return query select o.id, o.label, o.is_correct, o.position from public.answer_options o where o.question_id=_qid order by o.position;
end $$;

-- Company tracks
create table public.company_tracks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  pattern jsonb not null default '[]',
  important_topics text[] not null default '{}',
  sort integer not null default 0
);
grant select on public.company_tracks to authenticated, anon;
grant insert, update, delete on public.company_tracks to authenticated;
grant all on public.company_tracks to service_role;
alter table public.company_tracks enable row level security;
create policy "read tracks" on public.company_tracks for select using (true);
create policy "staff write tracks" on public.company_tracks for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Tests
create table public.tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  kind text not null default 'aptitude' check (kind in ('aptitude','coding','communication','full','company')),
  module text,
  category text,
  company text,
  difficulty text,
  num_questions integer not null default 10,
  duration_min integer not null default 15,
  scheduled_at timestamptz,
  active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.tests to authenticated;
grant all on public.tests to service_role;
alter table public.tests enable row level security;
create policy "read tests" on public.tests for select to authenticated using (true);
create policy "staff write tests" on public.tests for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Attempts
create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  test_id uuid references public.tests(id) on delete set null,
  title text not null,
  module text not null,
  question_ids uuid[] not null default '{}',
  duration_sec integer not null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  time_taken_sec integer,
  score integer,
  total integer,
  accuracy numeric
);
grant select on public.test_attempts to authenticated;
grant all on public.test_attempts to service_role;
alter table public.test_attempts enable row level security;
create policy "read own attempts" on public.test_attempts for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));

create table public.student_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references public.test_attempts(id) on delete cascade,
  user_id uuid not null,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_option_id uuid,
  answer_text text,
  is_correct boolean,
  score numeric,
  feedback jsonb,
  marked_review boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.student_answers to authenticated;
grant all on public.student_answers to service_role;
alter table public.student_answers enable row level security;
create policy "read own answers" on public.student_answers for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  module text not null,
  topic text,
  source text not null,
  ref_id uuid,
  score numeric not null,
  max_score numeric not null,
  created_at timestamptz not null default now()
);
grant select on public.scores to authenticated;
grant all on public.scores to service_role;
alter table public.scores enable row level security;
create policy "read own scores" on public.scores for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));

create table public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  module text not null,
  topic text not null,
  attempted integer not null default 0,
  correct integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, module, topic)
);
grant select on public.progress to authenticated;
grant all on public.progress to service_role;
alter table public.progress enable row level security;
create policy "read own progress" on public.progress for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  code text not null,
  title text not null,
  description text,
  earned_at timestamptz not null default now(),
  unique(user_id, code)
);
grant select on public.achievements to authenticated;
grant all on public.achievements to service_role;
alter table public.achievements enable row level security;
create policy "read own achievements" on public.achievements for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));

-- Internal: award activity (points, streak, badges)
create or replace function public._award(_uid uuid, _points integer) returns void
language plpgsql security definer set search_path=public as $$
declare s record; today date := (now() at time zone 'utc')::date; total_pts int; coding_solved int;
begin
  perform set_config('app.internal','1', true);
  update public.profiles set points = points + greatest(_points,0) where id=_uid returning points into total_pts;
  perform set_config('app.internal','0', true);
  select * into s from public.streaks where user_id=_uid;
  if not found then insert into public.streaks(user_id,current_streak,longest_streak,last_active_date) values(_uid,1,1,today);
  elsif s.last_active_date is null or s.last_active_date < today - 1 then
    update public.streaks set current_streak=1, longest_streak=greatest(longest_streak,1), last_active_date=today where user_id=_uid;
  elsif s.last_active_date = today - 1 then
    update public.streaks set current_streak=current_streak+1, longest_streak=greatest(longest_streak,current_streak+1), last_active_date=today where user_id=_uid;
  end if;
  select * into s from public.streaks where user_id=_uid;
  insert into public.achievements(user_id,code,title,description) values (_uid,'first_steps','First Steps','Completed your first activity') on conflict do nothing;
  if s.current_streak >= 3 then insert into public.achievements(user_id,code,title,description) values (_uid,'streak_3','On Fire','3-day practice streak') on conflict do nothing; end if;
  if s.current_streak >= 7 then insert into public.achievements(user_id,code,title,description) values (_uid,'streak_7','Unstoppable','7-day practice streak') on conflict do nothing; end if;
  if total_pts >= 100 then insert into public.achievements(user_id,code,title,description) values (_uid,'pts_100','Century','Earned 100 points') on conflict do nothing; end if;
  if total_pts >= 500 then insert into public.achievements(user_id,code,title,description) values (_uid,'pts_500','High Achiever','Earned 500 points') on conflict do nothing; end if;
  select count(distinct ref_id) into coding_solved from public.scores where user_id=_uid and module='coding' and score>=max_score;
  if coding_solved >= 5 then insert into public.achievements(user_id,code,title,description) values (_uid,'coder_5','Code Ninja','Solved 5 coding problems') on conflict do nothing; end if;
end $$;
revoke execute on function public._award(uuid,integer) from public, anon, authenticated;

create or replace function public._bump_progress(_uid uuid, _module text, _topic text, _att int, _cor int) returns void
language sql security definer set search_path=public as $$
  insert into public.progress(user_id,module,topic,attempted,correct) values(_uid,_module,_topic,_att,_cor)
  on conflict (user_id,module,topic) do update set attempted=progress.attempted+excluded.attempted, correct=progress.correct+excluded.correct, updated_at=now();
$$;
revoke execute on function public._bump_progress(uuid,text,text,int,int) from public, anon, authenticated;

-- Start an MCQ attempt with random questions
create or replace function public.start_attempt(
  _title text, _module text default null, _category text default null, _topic text default null,
  _difficulty text default null, _company text default null, _count int default 10, _duration_min int default 15, _test_id uuid default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare ids uuid[]; aid uuid; t record;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if _test_id is not null then
    select * into t from public.tests where id=_test_id;
    _title := t.title; _module := t.module; _category := t.category; _company := t.company;
    _difficulty := t.difficulty; _count := t.num_questions; _duration_min := t.duration_min;
  end if;
  select array_agg(id) into ids from (
    select q.id from public.questions q
    where q.qtype='mcq'
      and (_module is null or q.module=_module)
      and (_category is null or q.category=_category)
      and (_topic is null or q.topic=_topic)
      and (_difficulty is null or q.difficulty=_difficulty)
      and (_company is null or q.company is null or q.company=_company)
    order by (case when _company is not null and q.company=_company then 0 else 1 end), random()
    limit greatest(_count,1)
  ) x;
  if ids is null then raise exception 'No questions match this selection yet'; end if;
  insert into public.test_attempts(user_id,test_id,title,module,question_ids,duration_sec)
  values (auth.uid(), _test_id, _title, coalesce(_module,'full'), ids, greatest(_duration_min,1)*60) returning id into aid;
  return aid;
end $$;
grant execute on function public.start_attempt(text,text,text,text,text,text,int,int,uuid) to authenticated;

-- Submit & grade an MCQ attempt. _answers: [{question_id, option_id, marked}]
create or replace function public.submit_attempt(_attempt uuid, _answers jsonb) returns jsonb
language plpgsql security definer set search_path=public as $$
declare a record; qid uuid; sel uuid; ok boolean; n_correct int := 0; n_total int; q record; elapsed int;
begin
  select * into a from public.test_attempts where id=_attempt and user_id=auth.uid();
  if not found then raise exception 'attempt not found'; end if;
  if a.submitted_at is not null then return jsonb_build_object('already', true); end if;
  n_total := coalesce(array_length(a.question_ids,1),0);
  foreach qid in array a.question_ids loop
    select nullif(e->>'option_id','')::uuid into sel from jsonb_array_elements(_answers) e where (e->>'question_id')::uuid = qid limit 1;
    ok := sel is not null and exists(select 1 from public.answer_options where id=sel and question_id=qid and is_correct);
    if ok then n_correct := n_correct+1; end if;
    insert into public.student_answers(attempt_id,user_id,question_id,selected_option_id,is_correct,score,marked_review)
    values (_attempt, auth.uid(), qid, sel, ok, case when ok then 1 else 0 end,
      coalesce((select (e->>'marked')::boolean from jsonb_array_elements(_answers) e where (e->>'question_id')::uuid = qid limit 1), false));
    select module, topic into q from public.questions where id=qid;
    perform public._bump_progress(auth.uid(), q.module, q.topic, 1, case when ok then 1 else 0 end);
  end loop;
  elapsed := least(extract(epoch from now()-a.started_at)::int, a.duration_sec);
  update public.test_attempts set submitted_at=now(), time_taken_sec=elapsed, score=n_correct, total=n_total,
    accuracy = case when n_total>0 then round(n_correct::numeric*100/n_total,1) else 0 end where id=_attempt;
  insert into public.scores(user_id,module,topic,source,ref_id,score,max_score) values (auth.uid(), a.module, null, 'test', _attempt, n_correct, n_total);
  perform public._award(auth.uid(), n_correct*10);
  if n_total>=5 and n_correct=n_total then
    insert into public.achievements(user_id,code,title,description) values (auth.uid(),'perfect','Perfect Score','100% on a test of 5+ questions') on conflict do nothing;
  end if;
  return jsonb_build_object('score',n_correct,'total',n_total);
end $$;
grant execute on function public.submit_attempt(uuid,jsonb) to authenticated;

-- Review: correct options after submission
create or replace function public.attempt_review(_attempt uuid) returns table(question_id uuid, correct_option_id uuid)
language plpgsql stable security definer set search_path=public as $$
begin
  if not exists(select 1 from public.test_attempts where id=_attempt and submitted_at is not null and (user_id=auth.uid() or public.is_staff(auth.uid()))) then
    raise exception 'not available'; end if;
  return query select o.question_id, o.id from public.answer_options o
    join public.test_attempts t on t.id=_attempt where o.question_id = any(t.question_ids) and o.is_correct;
end $$;
grant execute on function public.attempt_review(uuid) to authenticated;

-- Record coding / communication / interview activity
create or replace function public.record_activity(_module text, _question uuid, _score numeric, _max numeric, _answer text, _feedback jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare q record; first_solve boolean; pts int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if _module not in ('coding','communication','interview') then raise exception 'bad module'; end if;
  _score := least(greatest(_score,0), _max);
  select * into q from public.questions where id=_question;
  first_solve := not exists(select 1 from public.scores where user_id=auth.uid() and ref_id=_question and score>=max_score);
  insert into public.student_answers(user_id,question_id,answer_text,is_correct,score,feedback) values (auth.uid(),_question,_answer,_score>=_max*0.6,_score,_feedback);
  insert into public.scores(user_id,module,topic,source,ref_id,score,max_score) values (auth.uid(),_module,q.topic,'practice',_question,_score,_max);
  perform public._bump_progress(auth.uid(), _module, q.topic, 1, case when _score>=_max*0.6 then 1 else 0 end);
  pts := round(10 * _score / nullif(_max,0));
  if _module='coding' and _score>=_max and first_solve then pts := pts + 10; end if;
  perform public._award(auth.uid(), coalesce(pts,0));
end $$;
grant execute on function public.record_activity(text,uuid,numeric,numeric,text,jsonb) to authenticated;

-- Leaderboard
create or replace function public.leaderboard(_limit int default 50) returns table(user_id uuid, full_name text, college text, points int, current_streak int, rank bigint)
language sql stable security definer set search_path=public as $$
  select p.id, coalesce(p.full_name,'Student'), p.college, p.points, coalesce(s.current_streak,0),
    rank() over (order by p.points desc)
  from public.profiles p left join public.streaks s on s.user_id=p.id
  where p.onboarded order by p.points desc limit _limit $$;
grant execute on function public.leaderboard(int) to authenticated;

create or replace function public.my_rank() returns bigint language sql stable security definer set search_path=public as $$
  select r from (select id, rank() over (order by points desc) r from public.profiles where onboarded) x where id=auth.uid() $$;
grant execute on function public.my_rank() to authenticated;

-- ===== SEED =====
create or replace function public._seed_mcq(_module text,_cat text,_topic text,_company text,_diff text,_prompt text,_expl text,_correct int,_opts text[], _model text default null)
returns void language plpgsql as $$
declare qid uuid; i int;
begin
  insert into public.questions(module,category,topic,company,difficulty,qtype,prompt,explanation,model_answer,time_limit_sec)
  values(_module,_cat,_topic,_company,_diff,'mcq',_prompt,_expl,_model,60) returning id into qid;
  for i in 1..array_length(_opts,1) loop
    insert into public.answer_options(question_id,label,is_correct,position) values (qid,_opts[i],i=_correct,i);
  end loop;
end $$;

-- Quantitative
select public._seed_mcq('aptitude','quant','Percentages',null,'easy','A shirt costs ₹800. After a 15% discount, what is the selling price?','15% of 800 = 120. 800 − 120 = ₹680.',2,array['₹660','₹680','₹700','₹720']);
select public._seed_mcq('aptitude','quant','Percentages','TCS','medium','A number is increased by 20% and then decreased by 20%. Net change?','1.2 × 0.8 = 0.96, so a 4% decrease.',3,array['No change','4% increase','4% decrease','2% decrease']);
select public._seed_mcq('aptitude','quant','Profit & Loss',null,'easy','Cost price ₹500, selling price ₹600. Profit %?','Profit = 100. 100/500 × 100 = 20%.',1,array['20%','16.67%','25%','10%']);
select public._seed_mcq('aptitude','quant','Profit & Loss','Infosys','medium','By selling an item for ₹450 a trader loses 10%. At what price should he sell to gain 10%?','CP = 450/0.9 = 500. SP for 10% gain = 550.',3,array['₹500','₹540','₹550','₹495']);
select public._seed_mcq('aptitude','quant','Time & Work',null,'medium','A can finish a job in 10 days, B in 15 days. Together they take?','Rates 1/10 + 1/15 = 1/6. So 6 days.',2,array['5 days','6 days','7.5 days','12.5 days']);
select public._seed_mcq('aptitude','quant','Time & Work','Wipro','hard','A and B together do a job in 12 days, B and C in 15, C and A in 20. A alone takes?','2(A+B+C) = 1/12+1/15+1/20 = 1/5 → A+B+C = 1/10. A = 1/10 − 1/15 = 1/30. So 30 days.',4,array['20 days','24 days','25 days','30 days']);
select public._seed_mcq('aptitude','quant','Speed & Distance',null,'easy','A car travels 180 km in 3 hours. Its speed?','180/3 = 60 km/h.',1,array['60 km/h','50 km/h','54 km/h','90 km/h']);
select public._seed_mcq('aptitude','quant','Speed & Distance','Accenture','medium','A 150 m train passes a pole in 15 s. Speed in km/h?','150/15 = 10 m/s = 36 km/h.',2,array['30 km/h','36 km/h','40 km/h','45 km/h']);
select public._seed_mcq('aptitude','quant','Averages',null,'easy','Average of 4, 8, 12, 16, 20?','Sum 60 / 5 = 12.',3,array['10','11','12','14']);
select public._seed_mcq('aptitude','quant','Ratio & Proportion','Capgemini','easy','Divide ₹1200 in ratio 2:3. Larger share?','3/5 × 1200 = 720.',4,array['₹480','₹600','₹700','₹720']);
select public._seed_mcq('aptitude','quant','Simple & Compound Interest','TCS','medium','Compound interest on ₹10,000 at 10% p.a. for 2 years?','10000 × 1.21 − 10000 = ₹2,100.',2,array['₹2,000','₹2,100','₹2,200','₹1,900']);
select public._seed_mcq('aptitude','quant','Number System',null,'hard','What is the remainder when 2^31 is divided by 5?','Powers of 2 mod 5 cycle 2,4,3,1 (length 4). 31 mod 4 = 3 → 3.',3,array['1','2','3','4']);
select public._seed_mcq('aptitude','quant','Permutations',null,'hard','In how many ways can the letters of LEVEL be arranged?','5!/(2!·2!) = 30.',1,array['30','60','120','20']);
select public._seed_mcq('aptitude','quant','Probability','product','medium','Two fair dice are rolled. Probability the sum is 7?','6 favourable of 36 = 1/6.',2,array['1/12','1/6','1/9','5/36']);
-- Logical
select public._seed_mcq('aptitude','logical','Series',null,'easy','Next number: 2, 6, 12, 20, 30, ?','Differences 4,6,8,10,12 → 42.',3,array['40','41','42','44']);
select public._seed_mcq('aptitude','logical','Series','TCS','medium','Next term: 3, 9, 27, 81, ?','Multiply by 3 → 243.',1,array['243','162','324','216']);
select public._seed_mcq('aptitude','logical','Coding-Decoding','Infosys','medium','If CAT is coded as DBU, how is DOG coded?','Each letter shifted +1: D→E, O→P, G→H = EPH.',2,array['EOH','EPH','DPH','FPI']);
select public._seed_mcq('aptitude','logical','Blood Relations',null,'medium','A is B''s brother. C is A''s mother. D is C''s father. How is B related to D?','B is a grandchild of D.',4,array['Son','Nephew','Grandfather','Grandchild']);
select public._seed_mcq('aptitude','logical','Direction Sense','Wipro','easy','Ravi walks 5 km north, turns right and walks 3 km, then turns right and walks 5 km. Which direction is he from start?','He ends 3 km to the east of the start.',2,array['North','East','West','South']);
select public._seed_mcq('aptitude','logical','Syllogism','Accenture','medium','All roses are flowers. Some flowers fade quickly. Conclusion: Some roses fade quickly.','Does not follow — the flowers that fade may not be roses.',2,array['Definitely true','Does not follow','Definitely false','Both follow']);
select public._seed_mcq('aptitude','logical','Seating Arrangement','Capgemini','hard','Five friends sit in a row. A is left of B, C is right of B, D is at an end next to A, and E is at the other end. Who sits in the middle?','Order: D A B C E → B is in the middle.',2,array['A','B','C','E']);
select public._seed_mcq('aptitude','logical','Odd One Out',null,'easy','Odd one out: 3, 5, 7, 9, 11','9 is not prime.',4,array['3','5','7','9']);
-- Verbal
select public._seed_mcq('aptitude','verbal','Synonyms',null,'easy','Synonym of "Abundant"','Abundant means plentiful.',1,array['Plentiful','Scarce','Rare','Tiny']);
select public._seed_mcq('aptitude','verbal','Antonyms','TCS','easy','Antonym of "Transparent"','Opposite of transparent is opaque.',3,array['Clear','Visible','Opaque','Bright']);
select public._seed_mcq('aptitude','verbal','Sentence Correction','Infosys','medium','Choose the correct sentence.','"Each of the students has" — "each" takes a singular verb.',2,array['Each of the students have submitted.','Each of the students has submitted.','Each of the student have submitted.','Each students has submitted.']);
select public._seed_mcq('aptitude','verbal','Fill in the Blanks','Accenture','easy','She is good ___ mathematics.','We say "good at" a subject.',3,array['in','on','at','with']);
select public._seed_mcq('aptitude','verbal','Reading Comprehension','Capgemini','medium','"Despite the rain, the match continued." What does this imply?','"Despite" shows contrast — the rain did not stop the match.',1,array['The rain did not stop the match','The match was cancelled','It did not rain','The match was delayed']);
select public._seed_mcq('aptitude','verbal','Idioms','Wipro','medium','Meaning of "Break the ice"','To initiate conversation in an awkward setting.',2,array['To break something','To start a conversation','To get angry','To win a game']);
-- Data interpretation
select public._seed_mcq('aptitude','di','Tables',null,'easy','Sales: Jan 200, Feb 250, Mar 300. Average monthly sales?','750/3 = 250.',2,array['240','250','260','300']);
select public._seed_mcq('aptitude','di','Percent Change','TCS','medium','Revenue grew from ₹40 L to ₹50 L. Growth %?','10/40 = 25%.',3,array['20%','22%','25%','30%']);
select public._seed_mcq('aptitude','di','Pie Charts','Accenture','medium','In a pie chart, a sector is 72°. What % of total does it represent?','72/360 = 20%.',1,array['20%','25%','18%','72%']);
select public._seed_mcq('aptitude','di','Bar Graphs','product','hard','Production: 2021 = 120, 2022 = 150, 2023 = 180 units. What is the CAGR from 2021 to 2023 (approx)?','(180/120)^(1/2) − 1 ≈ 22.5%.',2,array['20%','22.5%','25%','50%']);

-- Communication grammar quiz
select public._seed_mcq('communication','grammar','Grammar',null,'easy','Choose correct: "Neither the manager nor the employees ___ present."','With neither/nor, the verb agrees with the nearer subject (employees → were).',2,array['was','were','is','has been']);
select public._seed_mcq('communication','grammar','Grammar',null,'easy','Correct form: "I look forward to ___ from you."','"Look forward to" is followed by a gerund: hearing.',3,array['hear','heard','hearing','be hearing']);
select public._seed_mcq('communication','grammar','Vocabulary',null,'medium','"Concise" most nearly means','Concise = brief but comprehensive.',1,array['Brief and clear','Long-winded','Confusing','Rude']);
select public._seed_mcq('communication','grammar','Vocabulary',null,'medium','Pick the professional phrase for an email closing.','"Kind regards" is a standard professional sign-off.',4,array['Cya','Later!','Bye bye','Kind regards']);
select public._seed_mcq('communication','grammar','Grammar',null,'medium','Identify the error: "He don''t know the answer."','Third-person singular takes "doesn''t".',2,array['He','don''t','know','answer']);
select public._seed_mcq('communication','grammar','Vocabulary',null,'hard','"Meticulous" means','Showing great attention to detail.',3,array['Careless','Fast','Very careful and precise','Talkative']);

-- Written communication prompts
insert into public.questions(module,category,topic,difficulty,qtype,prompt,model_answer,hint,time_limit_sec) values
('communication','self_intro','Tell me about yourself','easy','written','Introduce yourself to an interviewer in 120–180 words. Cover your background, key skills, a highlight, and your career goal.','Good morning. I''m Priya Sharma, a final-year Computer Science student at ABC Engineering College with a CGPA of 8.4. I enjoy solving problems with code, and I''m comfortable with Java, Python and SQL. In my final-year project, I built a smart attendance system using face recognition that reduced manual effort by 70% for our department. I also led our college coding club, where I organised weekly contests for 120+ students, which improved my communication and leadership skills. Outside academics, I practise on LeetCode daily and have solved over 300 problems. I''m now looking to start my career as a software engineer in a company where I can learn from experienced teams, contribute to real products, and grow into a strong full-stack developer.','Use the Present → Past → Future structure.',300),
('communication','gd','Group Discussion','medium','written','GD topic: "Is AI a threat to jobs?" Write your opening statement (100–150 words) with a clear stand and two supporting points.','Good morning everyone. I believe AI is not a threat to jobs as a whole, but a threat to tasks. First, history shows every major technology — from computers to the internet — removed some roles while creating many new ones; AI is already creating demand for data engineers, prompt designers and AI auditors. Second, AI handles repetitive work, freeing people for creative and decision-making roles. However, the transition will hurt workers who do not reskill, so governments and companies must invest in training. In short, AI changes jobs rather than ending them, and our response should be upskilling, not fear.','State your stand in the first sentence.',300),
('communication','gd','Group Discussion','medium','written','GD topic: "Work from home vs. work from office." Give your viewpoint in 100–150 words.','I support a hybrid model. Work from home saves commute time and improves focus for deep work, which raises productivity. On the other hand, the office enables quick collaboration, mentorship for freshers, and a stronger team culture. A hybrid approach — for example, three office days for collaboration and two remote days for focused work — combines both benefits. Companies like Microsoft and TCS have adopted such models successfully. Therefore, instead of choosing one extreme, organisations should design flexible policies based on the role and team needs.','Acknowledge both sides before concluding.',300),
('communication','email','Email Writing','easy','written','Write a professional email to an HR manager asking about the status of your application for the Graduate Engineer Trainee role.','Subject: Application Status – Graduate Engineer Trainee (Ref: GET-2026)

Dear Ms. Rao,

I hope you are doing well. I applied for the Graduate Engineer Trainee position on 2 October 2026 and attended the technical interview on 12 October. I wanted to kindly follow up on the status of my application.

I remain very interested in joining your team and would be happy to share any additional information you may need.

Thank you for your time and consideration.

Kind regards,
Arjun Kumar
B.Tech CSE, XYZ College
+91 98765 43210','Include subject, greeting, purpose, details, closing.',400),
('communication','email','Email Writing','medium','written','Write an email to your project guide requesting a one-week extension for your project report, giving a valid reason.','Subject: Request for Extension – Final-Year Project Report

Dear Dr. Menon,

I hope you are well. I am writing to request a one-week extension for submitting our final-year project report, currently due on 25 October.

During testing, we discovered an accuracy issue in our model that requires retraining with a larger dataset. We have already identified the fix and expect the results within four days, leaving time to update the report properly.

I have attached our current draft for your reference. I would be grateful if you could allow us to submit by 1 November.

Thank you for your understanding.

Sincerely,
Sneha Patel
Team Lead, Project Group 7','Be polite, specific about the reason and the new date.',400),
('communication','confidence','Confidence Building','easy','written','Describe a moment you felt proud of yourself. Write 80–120 words using "I" statements and confident language (avoid "I think maybe…").','I am proud of the day I presented our college''s tech-fest proposal to the principal. I prepared a clear five-slide pitch, practised it ten times, and anticipated questions about budget and safety. During the meeting, I explained our plan confidently and answered every question with data. The proposal was approved with a ₹50,000 budget, and the event attracted 1,200 participants. That experience taught me that preparation builds confidence, and I now approach every presentation the same way.','Use strong verbs: led, built, delivered.',240);

-- Interview questions (written)
insert into public.questions(module,category,topic,company,difficulty,qtype,prompt,model_answer,time_limit_sec) values
('interview','hr','HR',null,'easy','written','Tell me about yourself.','I''m a final-year Computer Science student with strong skills in Java and SQL. I built a library management system used by 500+ students and interned at a startup where I improved API response time by 30%. I enjoy solving problems and working in teams, and I''m excited to begin my career as a software engineer where I can learn and contribute to impactful products.',120),
('interview','hr','HR',null,'easy','written','Why should we hire you?','You should hire me because I bring a strong foundation in programming, a proven ability to learn quickly, and a positive team attitude. In my internship I picked up React in two weeks and shipped a feature to production. I''m reliable, I take ownership, and I''m genuinely excited about the work your team does.',120),
('interview','hr','HR',null,'easy','written','What are your strengths and weaknesses?','My key strength is persistence — when I face a hard bug I break it down systematically until it''s solved. My weakness is that I used to hesitate to speak in large groups. I''ve been working on it by presenting in our coding club every week, and I''m now much more comfortable.',120),
('interview','hr','HR',null,'medium','written','Why do you want to join our company?','I admire your company''s focus on digital transformation and the scale of projects you deliver for global clients. Your structured training program for freshers would help me grow quickly, and I''m excited by the chance to work across technologies. I see a long-term career here where I can learn and contribute.',120),
('interview','hr','HR',null,'medium','written','Explain your final-year project.','Our project is a smart attendance system using face recognition. The problem was that manual attendance wasted 10 minutes per class. We used Python, OpenCV and a CNN model, with a Flask backend and MySQL database. I designed the database and the recognition pipeline. We achieved 94% accuracy and reduced attendance time to under one minute.',180),
('interview','technical','OOP',null,'easy','written','Explain OOP concepts.','OOP organises code around objects. Its four pillars are: Encapsulation — bundling data and methods and restricting direct access (private fields with getters/setters). Abstraction — exposing only essential features (interfaces, abstract classes). Inheritance — a class acquiring properties of another (Car extends Vehicle). Polymorphism — one interface, many forms, via method overloading (compile-time) and overriding (run-time).',180),
('interview','technical','DSA',null,'easy','written','What is the difference between an array and a linked list?','An array stores elements in contiguous memory with fixed size, giving O(1) random access but O(n) insertion/deletion in the middle. A linked list stores nodes anywhere in memory connected by pointers; it grows dynamically and supports O(1) insertion/deletion at a known node, but access is O(n) and it uses extra memory for pointers.',150),
('interview','technical','DBMS',null,'medium','written','What is DBMS and normalization?','A DBMS is software that stores, manages and retrieves data efficiently and securely (e.g., MySQL, Oracle). Normalization is the process of organising tables to reduce redundancy and anomalies. 1NF: atomic values. 2NF: 1NF + no partial dependency on part of a composite key. 3NF: 2NF + no transitive dependency. BCNF: every determinant is a candidate key.',180),
('interview','technical','Operating Systems',null,'medium','written','What is the difference between a process and a thread?','A process is an independent program in execution with its own memory space. A thread is a lightweight unit of execution within a process that shares the process''s memory and resources. Threads are cheaper to create and switch between and communicate easily via shared memory, but a crash in one thread can affect the whole process, whereas processes are isolated.',150),
('interview','technical','SQL',null,'medium','written','Write a SQL query to find the second-highest salary from an Employee table, and explain it.','SELECT MAX(salary) FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee); The inner query finds the highest salary; the outer query finds the maximum among salaries lower than it, which is the second highest. Alternatively: SELECT DISTINCT salary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 1;',180),
('interview','technical','Coding',null,'medium','written','How would you reverse a string without using built-in reverse functions? Explain the approach and complexity.','Use two pointers: one at the start and one at the end. Swap the characters and move the pointers toward each other until they meet. This runs in O(n) time and O(1) extra space if the string is mutable (e.g., a char array). In languages with immutable strings, convert to an array first, which takes O(n) space.',150),
('interview','technical','Coding',null,'medium','written','How do you find duplicates in an array?','The efficient approach uses a hash set: iterate through the array, and if an element is already in the set it is a duplicate; otherwise add it. This is O(n) time and O(n) space. If extra space is not allowed, sort the array (O(n log n)) and check adjacent elements.',150),
('interview','company','Company','TCS','easy','written','Why TCS? What do you know about our company?','TCS is India''s largest IT services company, part of the Tata Group, serving clients in 50+ countries. I value its reputation for ethics, its strong learning culture through programs like TCS iON and the Initial Learning Program, and the chance to work on diverse global projects. I want to start my career in an organisation known for stability and growth.',120),
('interview','company','Company','Infosys','easy','written','Are you willing to relocate and work in shifts at Infosys?','Yes. I understand that client projects may require flexibility, and I''m open to relocating to any Infosys development center and working in shifts. I see it as an opportunity to gain exposure to different teams and cultures, especially after the Mysore training program.',120),
('interview','company','Company','Accenture','medium','written','Accenture works across many industries. Which emerging technology excites you and why?','Cloud computing excites me most. It lets businesses scale instantly and pay only for what they use, and it is the foundation for AI and analytics. Accenture is a top partner for AWS, Azure and Google Cloud, so I''d love to build skills there — I''ve already completed the AWS Cloud Practitioner course.',120),
('interview','company','Company','product','hard','written','Tell me about a time you designed something technically challenging. What trade-offs did you make?','In my internship I designed a caching layer for a slow search API. I considered Redis versus an in-memory LRU per instance. I chose Redis for consistency across instances, accepting a small network-latency cost. I set a 10-minute TTL to balance freshness against hit rate. P95 latency dropped from 800 ms to 120 ms.',180);

-- Coding problems
insert into public.questions(module,category,topic,difficulty,qtype,prompt,explanation,hint,model_answer,starter_code,test_cases,time_limit_sec) values
('coding','coding','Loops','easy','coding','Write a function `sumToN(n)` that returns the sum of all integers from 1 to n.

Example: sumToN(5) → 15','Loop from 1 to n accumulating the sum, or use the formula n(n+1)/2 for O(1).','Try the formula n*(n+1)/2.','function sumToN(n) {\n  return n * (n + 1) / 2;\n}',
 '{"javascript":"function sumToN(n) {\n  // your code\n}","python":"def sumToN(n):\n    # your code\n    pass","java":"class Solution {\n    static int sumToN(int n) {\n        // your code\n    }\n}","c":"int sumToN(int n) {\n    // your code\n}","cpp":"int sumToN(int n) {\n    // your code\n}","fn":"sumToN"}',
 '[{"input":[5],"output":15},{"input":[1],"output":1},{"input":[100],"output":5050}]',600),
('coding','coding','Arrays','easy','coding','Write `findMax(arr)` that returns the largest number in a non-empty array.

Example: findMax([3, 9, 2]) → 9','Track the maximum while scanning once — O(n).','Start with max = arr[0].','function findMax(arr) {\n  let m = arr[0];\n  for (const x of arr) if (x > m) m = x;\n  return m;\n}',
 '{"javascript":"function findMax(arr) {\n  // your code\n}","python":"def findMax(arr):\n    # your code\n    pass","java":"class Solution {\n    static int findMax(int[] arr) {\n        // your code\n    }\n}","c":"int findMax(int arr[], int n) {\n    // your code\n}","cpp":"int findMax(vector<int>& arr) {\n    // your code\n}","fn":"findMax"}',
 '[{"input":[[3,9,2]],"output":9},{"input":[[-5,-2,-9]],"output":-2},{"input":[[7]],"output":7}]',600),
('coding','coding','Strings','easy','coding','Write `reverseString(s)` that returns the string reversed.

Example: reverseString("hello") → "olleh"','Swap characters with two pointers, or build the string from the end.','Iterate from the last index to 0.','function reverseString(s) {\n  let r = "";\n  for (let i = s.length - 1; i >= 0; i--) r += s[i];\n  return r;\n}',
 '{"javascript":"function reverseString(s) {\n  // your code\n}","python":"def reverseString(s):\n    # your code\n    pass","java":"class Solution {\n    static String reverseString(String s) {\n        // your code\n    }\n}","c":"void reverseString(char* s) {\n    // reverse in place\n}","cpp":"string reverseString(string s) {\n    // your code\n}","fn":"reverseString"}',
 '[{"input":["hello"],"output":"olleh"},{"input":["a"],"output":"a"},{"input":["placement"],"output":"tnemecalp"}]',600),
('coding','coding','Strings','medium','coding','Write `isPalindrome(s)` that returns true if s reads the same forwards and backwards (case-sensitive).

Example: isPalindrome("level") → true','Compare characters from both ends moving inward.','Two pointers i=0, j=len-1.','function isPalindrome(s) {\n  let i = 0, j = s.length - 1;\n  while (i < j) if (s[i++] !== s[j--]) return false;\n  return true;\n}',
 '{"javascript":"function isPalindrome(s) {\n  // your code\n}","python":"def isPalindrome(s):\n    # your code\n    pass","java":"class Solution {\n    static boolean isPalindrome(String s) {\n        // your code\n    }\n}","c":"int isPalindrome(char* s) {\n    // return 1 or 0\n}","cpp":"bool isPalindrome(string s) {\n    // your code\n}","fn":"isPalindrome"}',
 '[{"input":["level"],"output":true},{"input":["hello"],"output":false},{"input":["abba"],"output":true}]',900),
('coding','coding','Functions','easy','coding','Write `factorial(n)` returning n! for n ≥ 0.

Example: factorial(5) → 120','Recursive: n * factorial(n-1) with base case 0! = 1, or iterate.','Remember 0! = 1.','function factorial(n) {\n  let r = 1;\n  for (let i = 2; i <= n; i++) r *= i;\n  return r;\n}',
 '{"javascript":"function factorial(n) {\n  // your code\n}","python":"def factorial(n):\n    # your code\n    pass","java":"class Solution {\n    static long factorial(int n) {\n        // your code\n    }\n}","c":"long factorial(int n) {\n    // your code\n}","cpp":"long long factorial(int n) {\n    // your code\n}","fn":"factorial"}',
 '[{"input":[5],"output":120},{"input":[0],"output":1},{"input":[10],"output":3628800}]',600),
('coding','coding','DSA basics','medium','coding','Write `twoSum(nums, target)` that returns the indices [i, j] (i < j) of the two numbers adding up to target. Exactly one solution exists.

Example: twoSum([2,7,11,15], 9) → [0,1]','Use a hash map from value → index; for each number check if target − num was seen. O(n).','Store seen values in a map.','function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const need = target - nums[i];\n    if (seen.has(need)) return [seen.get(need), i];\n    seen.set(nums[i], i);\n  }\n}',
 '{"javascript":"function twoSum(nums, target) {\n  // your code\n}","python":"def twoSum(nums, target):\n    # your code\n    pass","java":"class Solution {\n    static int[] twoSum(int[] nums, int target) {\n        // your code\n    }\n}","c":"void twoSum(int* nums, int n, int target, int* out) {\n    // write indices into out[0], out[1]\n}","cpp":"vector<int> twoSum(vector<int>& nums, int target) {\n    // your code\n}","fn":"twoSum"}',
 '[{"input":[[2,7,11,15],9],"output":[0,1]},{"input":[[3,2,4],6],"output":[1,2]},{"input":[[1,5,3,7],12],"output":[1,3]}]',900),
('coding','coding','DSA basics','medium','coding','Write `countVowels(s)` that returns the number of vowels (a, e, i, o, u — lowercase or uppercase) in s.

Example: countVowels("Placement") → 3','Scan once, checking membership in a vowel set.','Convert to lowercase first.','function countVowels(s) {\n  return [...s.toLowerCase()].filter(c => "aeiou".includes(c)).length;\n}',
 '{"javascript":"function countVowels(s) {\n  // your code\n}","python":"def countVowels(s):\n    # your code\n    pass","java":"class Solution {\n    static int countVowels(String s) {\n        // your code\n    }\n}","c":"int countVowels(char* s) {\n    // your code\n}","cpp":"int countVowels(string s) {\n    // your code\n}","fn":"countVowels"}',
 '[{"input":["Placement"],"output":3},{"input":["xyz"],"output":0},{"input":["AEIOU"],"output":5}]',600),
('coding','coding','OOP','medium','coding','Write `fizzBuzz(n)` returning an array of strings from 1..n where multiples of 3 are "Fizz", of 5 "Buzz", of both "FizzBuzz", else the number as a string.

Example: fizzBuzz(5) → ["1","2","Fizz","4","Buzz"]','Check divisibility by 15 first, then 3, then 5.','Order of checks matters.','function fizzBuzz(n) {\n  const r = [];\n  for (let i = 1; i <= n; i++) r.push(i % 15 === 0 ? "FizzBuzz" : i % 3 === 0 ? "Fizz" : i % 5 === 0 ? "Buzz" : String(i));\n  return r;\n}',
 '{"javascript":"function fizzBuzz(n) {\n  // your code\n}","python":"def fizzBuzz(n):\n    # your code\n    pass","java":"class Solution {\n    static List<String> fizzBuzz(int n) {\n        // your code\n    }\n}","c":"// print each value on a new line\nvoid fizzBuzz(int n) {\n}","cpp":"vector<string> fizzBuzz(int n) {\n    // your code\n}","fn":"fizzBuzz"}',
 '[{"input":[5],"output":["1","2","Fizz","4","Buzz"]},{"input":[15],"output":["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]}]',900),
('coding','coding','DSA basics','hard','coding','Write `maxSubarraySum(nums)` returning the largest sum of a contiguous subarray (Kadane''s algorithm).

Example: maxSubarraySum([-2,1,-3,4,-1,2,1,-5,4]) → 6','Kadane: cur = max(x, cur + x); best = max(best, cur). O(n).','Reset when the running sum becomes worse than starting fresh.','function maxSubarraySum(nums) {\n  let cur = nums[0], best = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    cur = Math.max(nums[i], cur + nums[i]);\n    best = Math.max(best, cur);\n  }\n  return best;\n}',
 '{"javascript":"function maxSubarraySum(nums) {\n  // your code\n}","python":"def maxSubarraySum(nums):\n    # your code\n    pass","java":"class Solution {\n    static int maxSubarraySum(int[] nums) {\n        // your code\n    }\n}","c":"int maxSubarraySum(int* nums, int n) {\n    // your code\n}","cpp":"int maxSubarraySum(vector<int>& nums) {\n    // your code\n}","fn":"maxSubarraySum"}',
 '[{"input":[[-2,1,-3,4,-1,2,1,-5,4]],"output":6},{"input":[[1]],"output":1},{"input":[[-3,-1,-2]],"output":-1}]',1200),
('coding','sql','SQL','medium','coding','SQL: Table Employee(id, name, salary, dept). Write a query returning each dept and its average salary, only for departments with average salary above 50000.','Use GROUP BY dept with HAVING AVG(salary) > 50000. WHERE cannot filter aggregates.','HAVING filters groups.','SELECT dept, AVG(salary) AS avg_salary\nFROM Employee\nGROUP BY dept\nHAVING AVG(salary) > 50000;',
 '{"sql":"SELECT ...","fn":null}', '[]', 900);

drop function public._seed_mcq(text,text,text,text,text,text,text,int,text[],text);

-- Company tracks
insert into public.company_tracks(slug,name,description,pattern,important_topics,sort) values
('tcs','TCS','TCS NQT — National Qualifier Test for freshers.','[{"section":"Numerical Ability","questions":26,"minutes":40},{"section":"Verbal Ability","questions":24,"minutes":30},{"section":"Reasoning Ability","questions":30,"minutes":50},{"section":"Programming Logic & Coding","questions":2,"minutes":45},{"section":"Technical + HR Interview","questions":1,"minutes":30}]','{Percentages,"Simple & Compound Interest",Series,"Sentence Correction","Percent Change",Loops,Arrays}',1),
('infosys','Infosys','Infosys online test for Systems Engineer / Specialist Programmer.','[{"section":"Reasoning Ability","questions":15,"minutes":25},{"section":"Mathematical Ability","questions":10,"minutes":35},{"section":"Verbal Ability","questions":20,"minutes":20},{"section":"Pseudocode","questions":5,"minutes":10},{"section":"Interview","questions":1,"minutes":30}]','{"Coding-Decoding","Profit & Loss","Sentence Correction",Strings,OOP}',2),
('wipro','Wipro','Wipro Elite NTH — National Talent Hunt.','[{"section":"Aptitude","questions":16,"minutes":16},{"section":"Logical","questions":14,"minutes":14},{"section":"Verbal","questions":22,"minutes":18},{"section":"Essay Writing","questions":1,"minutes":20},{"section":"Coding","questions":2,"minutes":60}]','{"Time & Work","Direction Sense",Idioms,"Email Writing",Arrays}',3),
('accenture','Accenture','Accenture cognitive + technical assessment.','[{"section":"Cognitive Ability","questions":50,"minutes":50},{"section":"Technical Assessment","questions":40,"minutes":40},{"section":"Coding","questions":2,"minutes":45},{"section":"Communication Assessment","questions":1,"minutes":20}]','{"Speed & Distance",Syllogism,"Fill in the Blanks","Pie Charts",Functions}',4),
('capgemini','Capgemini','Capgemini Game-based + pseudocode assessment.','[{"section":"Pseudocode","questions":30,"minutes":30},{"section":"English Communication","questions":30,"minutes":30},{"section":"Game-based Aptitude","questions":4,"minutes":24},{"section":"Behavioral","questions":100,"minutes":20}]','{"Ratio & Proportion","Seating Arrangement","Reading Comprehension",Loops}',5),
('product','Product-based','Amazon, Microsoft, Google, Flipkart-style DSA-heavy process.','[{"section":"Online Assessment (DSA)","questions":2,"minutes":90},{"section":"Technical Round 1 (DSA)","questions":2,"minutes":60},{"section":"Technical Round 2 (CS fundamentals + design)","questions":3,"minutes":60},{"section":"Hiring Manager / Bar Raiser","questions":1,"minutes":45}]','{"DSA basics",Probability,"Bar Graphs",DBMS,"Operating Systems"}',6);

-- Tests
insert into public.tests(title,description,kind,module,category,company,difficulty,num_questions,duration_min) values
('Quant Sprint','10 quantitative questions across topics.','aptitude','aptitude','quant',null,null,10,12),
('Logical Reasoning Drill','Series, coding-decoding, relations and more.','aptitude','aptitude','logical',null,null,8,10),
('Verbal Ability Check','Synonyms, grammar and comprehension.','aptitude','aptitude','verbal',null,null,6,6),
('Data Interpretation Mini','Quick DI practice.','aptitude','aptitude','di',null,null,4,6),
('Grammar & Vocabulary Quiz','Communication MCQs.','communication','communication','grammar',null,null,6,6),
('Full Placement Mock','Mixed aptitude + communication.','full',null,null,null,null,20,25),
('TCS NQT Mock','TCS-style mixed test.','company','aptitude',null,'TCS',null,12,15),
('Infosys Mock','Infosys-pattern questions.','company','aptitude',null,'Infosys',null,12,15),
('Wipro Mock','Wipro Elite NTH practice.','company','aptitude',null,'Wipro',null,10,12),
('Accenture Mock','Accenture cognitive practice.','company','aptitude',null,'Accenture',null,10,12),
('Capgemini Mock','Capgemini-style practice.','company','aptitude',null,'Capgemini',null,10,12),
('Product Company Challenge','Harder problems for product companies.','company','aptitude',null,'product','hard',8,12);
update public.tests set scheduled_at = now() + interval '3 days' where title='Full Placement Mock';
