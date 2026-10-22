CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  region text NOT NULL DEFAULT 'India' CHECK (region IN ('India','Global')),
  category text NOT NULL DEFAULT 'IT Services' CHECK (category IN ('IT Services','Product','Consulting','Startup')),
  short_description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.companies TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff write companies" ON public.companies FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.company_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  round_type text NOT NULL CHECK (round_type IN ('Aptitude','Technical','HR')),
  question text NOT NULL,
  difficulty text NOT NULL DEFAULT 'Easy' CHECK (difficulty IN ('Easy','Medium','Hard')),
  topic text,
  answer text,
  explanation text,
  tips text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX company_questions_company_idx ON public.company_questions(company_id);
CREATE INDEX company_questions_round_idx ON public.company_questions(round_type);
CREATE INDEX company_questions_diff_idx ON public.company_questions(difficulty);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_questions TO authenticated;
GRANT ALL ON public.company_questions TO service_role;
ALTER TABLE public.company_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read company questions" ON public.company_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff write company questions" ON public.company_questions FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.user_question_status (
  user_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.company_questions(id) ON DELETE CASCADE,
  bookmarked boolean NOT NULL DEFAULT false,
  practised boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_question_status TO authenticated;
GRANT ALL ON public.user_question_status TO service_role;
ALTER TABLE public.user_question_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own status select" ON public.user_question_status FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "own status insert" ON public.user_question_status FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own status update" ON public.user_question_status FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own status delete" ON public.user_question_status FOR DELETE TO authenticated USING (user_id = auth.uid());

INSERT INTO public.companies (name, region, category, short_description) VALUES
('TCS','India','IT Services','Large IT services firm; NQT-style aptitude, technical and HR rounds.'),
('Infosys','India','IT Services','IT services and consulting; aptitude, puzzles, technical and HR rounds.'),
('Wipro','India','IT Services','IT services; online test, essay writing, technical and HR rounds.'),
('HCLTech','India','IT Services','IT services and engineering; aptitude, technical and HR rounds.'),
('Zoho','India','Product','Product company known for strong coding and problem-solving rounds.'),
('Google','Global','Product','Product company focused on data structures, algorithms and behavioural rounds.'),
('Microsoft','Global','Product','Product company with coding, design and behavioural interviews.'),
('Amazon','Global','Product','Product company; coding rounds plus Leadership Principles behavioural questions.'),
('Accenture','Global','Consulting','Consulting and technology services; cognitive, technical and communication rounds.'),
('IBM','Global','IT Services','Technology and consulting; cognitive games, technical and HR rounds.');

INSERT INTO public.company_questions (company_id, round_type, question, difficulty, topic, answer, explanation, tips)
SELECT c.id, v.r, v.q, v.d, v.t, v.a, v.e, v.tip FROM (VALUES
('TCS','HR','Tell me about yourself.','Easy','Self introduction','I am a final-year CSE student who enjoys building practical software. I recently built a library management app using Java and MySQL, and I practise aptitude daily. I want to start my career in a company where I can learn at scale.','A good answer covers present (studies), past (projects/skills) and future (why this job) in under 90 seconds.','Use the present–past–future structure and end with why you want this role.'),
('TCS','HR','Are you comfortable relocating and working in shifts?','Easy','Flexibility','Yes. I understand client projects may need different locations or timings, and I am ready to adapt while I learn.','Service companies value flexibility because projects are assigned based on client needs.','Be honest; if you have a real constraint, state it politely with a solution.'),
('TCS','Technical','Explain the four pillars of OOP with an example.','Easy','OOP','Encapsulation (bundling data with methods, e.g. private balance in a BankAccount), Abstraction (showing only essentials, e.g. an interface Payment), Inheritance (SavingsAccount extends BankAccount), Polymorphism (one method, many forms, e.g. overriding calculateInterest()).','Interviewers want definitions plus a single consistent example that ties all four together.','Pick one real-world example and map every pillar onto it.'),
('TCS','Technical','What is the difference between an array and a linked list?','Easy','Data structures','Arrays store elements contiguously with O(1) index access but costly inserts; linked lists store nodes with pointers, giving O(1) insert/delete at a known node but O(n) access.','The trade-off is access speed versus flexible insertion and memory layout.','Mention time complexity and a use case for each.'),
('TCS','Aptitude','A price rises by 20% and then falls by 20%. What is the net change?','Easy','Percentages','A 4% decrease.','Net change = a + b + ab/100 = 20 − 20 − 400/100 = −4%.','Remember the successive-change formula a + b + ab/100.'),
('Infosys','HR','Why should we hire you?','Easy','Motivation','I learn quickly, I have practised the core skills this role needs through projects, and I work well in teams. I will put in consistent effort to become productive fast.','Connect your strengths directly to what the company needs.','Give one proof (project or achievement) for each strength you claim.'),
('Infosys','HR','Describe a time you worked in a team to meet a deadline.','Medium','Teamwork','In our final-year project, a module was delayed. I split the remaining work, paired with a teammate, and we finished two days early.','Use STAR: Situation, Task, Action, Result.','Focus on your actions and a measurable result.'),
('Infosys','Technical','What is normalization in DBMS? Explain 1NF, 2NF and 3NF.','Medium','DBMS','Normalization organises tables to reduce redundancy. 1NF: atomic values. 2NF: 1NF plus no partial dependency on part of a composite key. 3NF: 2NF plus no transitive dependency between non-key columns.','Normalization prevents update, insert and delete anomalies.','Use a small Student–Course table example to explain each step.'),
('Infosys','Technical','Write an SQL query to find the second highest salary.','Medium','SQL','SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);','The subquery finds the top salary; the outer query finds the maximum below it.','Also mention DENSE_RANK() as an alternative for the Nth highest.'),
('Infosys','Aptitude','Two boys can be arranged with 3 girls in a row. In how many ways can 5 people sit if the 2 boys must sit together?','Medium','Permutations','48 ways.','Treat the boys as one unit: 4! = 24 arrangements, times 2! for the boys = 48.','Group items that must stay together, then multiply by internal arrangements.'),
('Wipro','HR','What are your strengths and weaknesses?','Easy','Self awareness','Strength: I stay consistent—I practised coding daily for 6 months. Weakness: I used to hesitate in public speaking, so I joined my college club and now present regularly.','A weakness should be real but show improvement.','Never give a fake weakness like "I work too hard".'),
('Wipro','HR','Where do you see yourself in five years?','Easy','Career goals','I see myself as a skilled engineer who leads small modules, has earned relevant certifications, and mentors juniors.','Shows ambition aligned with growth inside the company.','Keep it realistic and linked to the company.'),
('Wipro','Technical','What is the difference between a process and a thread?','Medium','Operating systems','A process is an independent program in execution with its own memory; a thread is a lighter unit inside a process that shares its memory. Thread switching is cheaper.','Threads enable concurrency within one application.','Mention a browser example: each tab as a process, tasks within it as threads.'),
('Wipro','Technical','What is the difference between compiler and interpreter?','Easy','Programming basics','A compiler translates the whole program to machine code before running (C, C++); an interpreter executes line by line (Python).','Compiled code usually runs faster; interpreted code is easier to debug.','Mention Java as a hybrid: compiled to bytecode, run by the JVM.'),
('Wipro','Aptitude','A train 150 m long passes a pole in 15 seconds. What is its speed in km/h?','Easy','Speed and distance','36 km/h.','Speed = 150/15 = 10 m/s; ×18/5 = 36 km/h.','Multiply m/s by 18/5 to get km/h.'),
('HCLTech','HR','Why do you want to join our company?','Easy','Motivation','I like that you work on engineering and digital projects across industries, and your training programmes will help me grow from a fresher into a strong engineer.','Shows you researched the company.','Mention one specific thing about the company.'),
('HCLTech','HR','How do you handle pressure?','Medium','Stress management','I break the work into small tasks, prioritise, and communicate early if I need help—this helped me during exam weeks while finishing a project.','Interviewers check for calm, structured behaviour.','Back it with a short real example.'),
('HCLTech','Technical','What is a primary key and a foreign key?','Easy','DBMS','A primary key uniquely identifies each row and cannot be NULL; a foreign key in one table references the primary key of another, linking the tables.','Together they enforce entity and referential integrity.','Draw a quick Customers–Orders example.'),
('HCLTech','Technical','What is method overloading vs overriding?','Easy','OOP','Overloading: same method name, different parameters, in the same class (compile-time). Overriding: subclass redefines a parent method with the same signature (runtime).','These are the two forms of polymorphism.','State which is compile-time and which is runtime.'),
('HCLTech','Aptitude','Divide ₹1,200 between A and B in the ratio 3:5.','Easy','Ratios','A gets ₹450 and B gets ₹750.','Total parts = 8; one part = 150; A = 3×150, B = 5×150.','Always find the value of one part first.'),
('Zoho','HR','Explain your final-year project.','Medium','Project','Problem → my solution → tech stack → my role → challenges → result. E.g. an attendance app using face recognition in Python that cut roll-call time by 80%.','Interviewers test depth and ownership.','Be ready for deep follow-up questions on any part you mention.'),
('Zoho','HR','Why do you prefer a product company?','Medium','Motivation','I enjoy owning a product long-term and seeing users benefit directly from features I build.','Shows alignment with a product mindset.','Mention a product of theirs you have used.'),
('Zoho','Technical','How would you reverse a string without using a built-in function?','Easy','Strings','Use two pointers at the start and end, swap characters, and move inward until they meet. Time O(n), space O(1) for a char array.','Classic two-pointer technique.','Explain the approach before writing code.'),
('Zoho','Technical','Find the first non-repeating character in a string.','Medium','Strings','Count characters with a hash map in one pass, then return the first character with count 1 in a second pass. O(n) time.','Two passes keep the original order.','Discuss edge cases: empty string, all repeating.'),
('Zoho','Aptitude','What is the next number: 2, 6, 12, 20, 30, ?','Easy','Number series','42.','Differences are 4, 6, 8, 10, 12; or n(n+1).','Check differences first, then patterns like n² or n(n+1).'),
('Google','HR','Tell me about a time you failed.','Medium','Behavioural','In a hackathon, I over-engineered the backend and could not finish the demo. I learned to build a minimal version first; in the next one we won second place.','Shows ownership and learning.','Spend most of the time on what you learned and changed.'),
('Google','HR','Describe a project you are most proud of.','Medium','Behavioural','Describe the problem, scale, your specific decisions, trade-offs and measurable impact.','They look for impact and technical decision-making.','Quantify results wherever possible.'),
('Google','Technical','Find two numbers in an array that add up to a target.','Medium','Arrays','Use a hash map: for each number x, check if target − x was seen; if yes, return both, else store x. O(n) time, O(n) space.','Improves on the O(n²) brute force.','Start with brute force, then optimise aloud.'),
('Google','Technical','How would you detect a cycle in a linked list?','Medium','Linked lists','Floyd''s algorithm: move a slow pointer one step and a fast pointer two steps; if they meet, there is a cycle. O(n) time, O(1) space.','The fast pointer gains one step per move inside a cycle.','Mention the hash-set alternative and its extra space.'),
('Google','Aptitude','You have 8 balls; one is heavier. With a balance, what is the minimum number of weighings to find it?','Hard','Puzzles','2 weighings.','Weigh 3 vs 3. If equal, weigh the remaining 2. If not, take the heavier 3 and weigh 1 vs 1.','Split into three groups, not two.'),
('Microsoft','HR','How do you keep learning new technologies?','Easy','Growth mindset','I follow official docs, build small projects, and take one online course each quarter—recently I learned TypeScript by rebuilding an old project.','Shows a growth mindset.','Name a concrete recent example.'),
('Microsoft','HR','Tell me about a conflict with a teammate.','Medium','Behavioural','We disagreed on the database choice. I proposed comparing both against our needs; data showed one fit better, and we moved on respectfully.','Shows collaboration and data-driven decisions.','Never blame the other person.'),
('Microsoft','Technical','What is the difference between stack and queue?','Easy','Data structures','Stack is LIFO (push/pop at top), used in undo and recursion; queue is FIFO (enqueue at rear, dequeue at front), used in scheduling.','Both are linear structures with restricted access.','Give a real-world example for each.'),
('Microsoft','Technical','Explain binary search and its time complexity.','Easy','Searching','On a sorted array, compare the target with the middle element and discard half each step. O(log n) time.','Halving the search space gives logarithmic time.','Mention the array must be sorted and avoid overflow with mid = low + (high − low)/2.'),
('Microsoft','Aptitude','A can finish a job in 10 days and B in 15 days. Together, how long?','Easy','Time and work','6 days.','Work per day = 1/10 + 1/15 = 1/6.','Add rates, not days.'),
('Amazon','HR','Tell me about a time you went beyond what was expected (customer obsession).','Medium','Leadership principles','When users of our college app complained about slow loading, I profiled it, added caching and cut load time from 4s to 1s.','Amazon maps answers to its Leadership Principles.','Prepare a STAR story for each principle.'),
('Amazon','HR','Describe a time you made a decision with incomplete data.','Hard','Leadership principles','With a deadline close, I chose a proven library over an untested one based on available benchmarks, noted the risk, and planned a review.','Tests "bias for action".','Show you weighed risk and moved forward.'),
('Amazon','Technical','How do you find the maximum subarray sum?','Medium','Arrays','Kadane''s algorithm: keep a running sum, reset to the current element if it is larger, and track the maximum. O(n).','Dynamic programming over a single pass.','Handle all-negative arrays correctly.'),
('Amazon','Technical','What is a hash table and how are collisions handled?','Medium','Hashing','A hash table maps keys to buckets via a hash function for average O(1) lookup. Collisions are handled by chaining (lists per bucket) or open addressing (probing).','Load factor affects performance.','Mention resizing when the load factor grows.'),
('Amazon','Aptitude','If 6 machines make 6 items in 6 minutes, how many machines make 100 items in 100 minutes?','Medium','Puzzles','6 machines.','Each machine makes 1 item in 6 minutes, so in 100 minutes 6 machines make 100 items.','Find the rate per machine first.'),
('Accenture','HR','How would you explain a technical idea to a non-technical client?','Medium','Communication','Use a simple analogy, avoid jargon, focus on the benefit, and check understanding—e.g. a database is like a well-organised filing cabinet.','Consultancies value clear client communication.','Practise one analogy for a concept you know.'),
('Accenture','HR','Why consulting?','Easy','Motivation','I enjoy solving varied problems for different industries and working with people as much as technology.','Shows fit with client-facing work.','Link to a real experience solving someone''s problem.'),
('Accenture','Technical','What is cloud computing? Name its service models.','Easy','Cloud','Delivering computing resources over the internet on demand. Models: IaaS (virtual machines), PaaS (app platforms), SaaS (ready software like email).','Common basic question in service companies.','Give one example for each model.'),
('Accenture','Technical','What is the difference between SQL JOIN types?','Medium','SQL','INNER JOIN returns matching rows; LEFT JOIN returns all left rows plus matches; RIGHT JOIN the reverse; FULL JOIN returns all rows from both.','Joins combine related tables.','Sketch a Venn diagram when explaining.'),
('Accenture','Aptitude','The average of 5 numbers is 20. If one number is removed, the average becomes 18. What was removed?','Easy','Averages','28.','Sum = 100; remaining sum = 72; removed = 28.','Convert averages to totals.'),
('IBM','HR','What do you know about our company?','Easy','Research','Mention its focus areas such as hybrid cloud, AI and consulting, and connect them to your interests.','Tests preparation.','Read the company''s recent news before the interview.'),
('IBM','HR','How do you prioritise multiple tasks?','Easy','Time management','I list tasks, rank them by urgency and impact, block time on a calendar, and update the plan daily.','Shows organisation.','Mention a tool or method you actually use.'),
('IBM','Technical','What are ACID properties?','Medium','DBMS','Atomicity (all or nothing), Consistency (valid state), Isolation (transactions don''t interfere), Durability (committed data survives failures).','They guarantee reliable transactions.','Use a bank transfer example.'),
('IBM','Technical','What is the difference between == and equals() in Java?','Easy','Java','== compares references (or primitive values); equals() compares object content when overridden, e.g. in String.','A very common Java basics question.','Show a String example where == is false but equals() is true.'),
('IBM','Aptitude','A shopkeeper marks an item 25% above cost and gives a 10% discount. Profit %?','Medium','Profit and loss','12.5% profit.','Cost 100 → marked 125 → sold 112.5.','Assume cost = 100 to simplify.')
) AS v(cname, r, q, d, t, a, e, tip)
JOIN public.companies c ON c.name = v.cname;