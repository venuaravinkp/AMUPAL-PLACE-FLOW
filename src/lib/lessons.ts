export type QuizQ = { q: string; options: string[]; answer: number; explanation: string; hint?: string };
export type Lesson = {
  slug: string;
  title: string;
  category: string;
  intro: string;
  concepts: { heading: string; body: string }[];
  formulas: string[];
  examples: { problem: string; steps: string[]; answer: string }[];
  guided: QuizQ[];
  quiz: QuizQ[];
  passPercent: number;
};

export const LESSONS: Lesson[] = [
  {
    slug: "percentages",
    title: "Percentages",
    category: "quant",
    passPercent: 60,
    intro:
      "A percentage means 'out of 100'. Shops use it for discounts, banks for interest, companies for growth and exams for marks. Almost every aptitude test has 2–4 percentage questions, and the same idea powers profit & loss, interest and data interpretation.",
    concepts: [
      { heading: "What 'percent' means", body: "25% = 25 out of 100 = 25/100 = 0.25 = 1/4. To find x% of a number, multiply the number by x/100. Example: 20% of 450 = 450 × 20/100 = 90." },
      { heading: "Fraction shortcuts", body: "Memorise these: 50% = 1/2, 25% = 1/4, 20% = 1/5, 12.5% = 1/8, 10% = 1/10, 33⅓% = 1/3, 16⅔% = 1/6. Then 12.5% of 640 is simply 640 ÷ 8 = 80 — no long multiplication." },
      { heading: "Percentage change", body: "Change is always measured against the ORIGINAL (old) value. If a price goes from 200 to 250, the change is 50, and 50 out of the original 200 is 25%. A common mistake is dividing by the new value." },
      { heading: "Successive changes", body: "Two changes of a% and b% give a net change of a + b + ab/100. A 10% rise followed by a 10% fall is not zero: 10 − 10 − 100/100 = −1%, a 1% loss." },
      { heading: "Real-life example", body: "A phone costs ₹20,000. The shop gives 15% off, then you pay 18% GST on the discounted price. Discounted price = 20,000 × 0.85 = 17,000. Final = 17,000 × 1.18 = ₹20,060." },
    ],
    formulas: [
      "x% of N = N × x / 100",
      "Percent change = (New − Old) / Old × 100",
      "After an increase of r%: New = Old × (1 + r/100)",
      "After a decrease of r%: New = Old × (1 − r/100)",
      "Net of successive a% and b%: a + b + ab/100 (use negative for decreases)",
      "If A is r% more than B, B is r/(100 + r) × 100 % less than A",
    ],
    examples: [
      {
        problem: "A student scored 72 out of 90. What is the percentage?",
        steps: ["Marks fraction = 72/90", "72/90 = 0.8", "0.8 × 100 = 80"],
        answer: "80%",
      },
      {
        problem: "A salary rises from ₹25,000 to ₹28,000. Find the percentage increase.",
        steps: ["Change = 28,000 − 25,000 = 3,000", "Divide by the OLD value: 3,000 / 25,000 = 0.12", "0.12 × 100 = 12"],
        answer: "12% increase",
      },
      {
        problem: "A's income is 25% more than B's. By what percent is B's income less than A's?",
        steps: ["Let B = 100, so A = 125", "Difference = 25", "Compare with A (the base now): 25/125 × 100 = 20"],
        answer: "20% less",
      },
    ],
    guided: [
      { q: "What is 15% of 240?", options: ["24", "36", "30", "48"], answer: 1, hint: "10% of 240 is 24, and 5% is half of that.", explanation: "10% = 24, 5% = 12, so 15% = 24 + 12 = 36." },
      { q: "A price goes from ₹80 to ₹100. Percentage increase?", options: ["20%", "25%", "80%", "15%"], answer: 1, hint: "Divide the change by the OLD price.", explanation: "Change = 20. 20/80 × 100 = 25%." },
      { q: "A price rises 20% then falls 20%. Net change?", options: ["0%", "−4%", "+4%", "−2%"], answer: 1, hint: "Use a + b + ab/100 with b = −20.", explanation: "20 − 20 + (20 × −20)/100 = −4%. A 4% net decrease." },
    ],
    quiz: [
      { q: "What is 12.5% of 960?", options: ["96", "120", "125", "112"], answer: 1, explanation: "12.5% = 1/8, and 960 ÷ 8 = 120." },
      { q: "A number increased by 30% becomes 390. The original number is:", options: ["273", "300", "290", "320"], answer: 1, explanation: "Original × 1.3 = 390, so original = 390 / 1.3 = 300." },
      { q: "If the price of sugar rises by 25%, by what percent must a family cut consumption to keep spending the same?", options: ["25%", "20%", "15%", "30%"], answer: 1, explanation: "Reduction = r/(100 + r) × 100 = 25/125 × 100 = 20%." },
      { q: "A shirt marked ₹1,500 is sold at 20% discount. Selling price?", options: ["₹1,200", "₹1,300", "₹1,280", "₹1,250"], answer: 0, explanation: "1,500 × 0.8 = ₹1,200." },
      { q: "Population of a town is 10,000 and grows 10% every year. Population after 2 years?", options: ["12,000", "12,100", "11,000", "12,200"], answer: 1, explanation: "10,000 × 1.1 × 1.1 = 12,100 (growth compounds on the new value)." },
    ],
  },
  {
    slug: "profit-loss",
    title: "Profit & Loss",
    category: "quant",
    passPercent: 60,
    intro: "Every business buys at a cost price (CP) and sells at a selling price (SP). Profit and loss questions appear in almost every placement test and build directly on percentages.",
    concepts: [
      { heading: "CP, SP and marked price", body: "CP is what you paid, SP is what you sold for. Marked price (MP) is the tag price; a discount is taken from MP to get SP." },
      { heading: "Profit % is on CP", body: "Profit % and loss % are always calculated on the cost price, never on the selling price — unless the question says so." },
      { heading: "Discount % is on MP", body: "Discount % = discount / MP × 100. So a ₹1,000 item with 10% discount sells for ₹900." },
      { heading: "Real-life example", body: "A shopkeeper buys a bag for ₹800 and sells it for ₹1,000. Profit = 200, profit % = 200/800 × 100 = 25%." },
    ],
    formulas: [
      "Profit = SP − CP; Loss = CP − SP",
      "Profit % = Profit / CP × 100",
      "SP = CP × (100 + Profit%) / 100",
      "SP = CP × (100 − Loss%) / 100",
      "SP = MP × (100 − Discount%) / 100",
    ],
    examples: [
      { problem: "CP = ₹500, SP = ₹600. Profit %?", steps: ["Profit = 600 − 500 = 100", "100 / 500 × 100 = 20"], answer: "20%" },
      { problem: "An item bought at ₹1,200 is sold at 15% loss. SP?", steps: ["SP = 1,200 × 85/100", "= 1,020"], answer: "₹1,020" },
      { problem: "SP is ₹660 at 10% profit. Find CP.", steps: ["SP = CP × 1.1", "CP = 660 / 1.1 = 600"], answer: "₹600" },
    ],
    guided: [
      { q: "CP ₹400, SP ₹500. Profit %?", options: ["20%", "25%", "10%", "50%"], answer: 1, hint: "Divide profit by CP.", explanation: "100/400 × 100 = 25%." },
      { q: "MP ₹2,000 with 25% discount. SP?", options: ["₹1,500", "₹1,750", "₹1,600", "₹1,250"], answer: 0, hint: "Take 25% off the marked price.", explanation: "2,000 × 0.75 = ₹1,500." },
      { q: "Sold at ₹450 with 10% loss. CP?", options: ["₹495", "₹500", "₹405", "₹550"], answer: 1, hint: "SP = CP × 0.9.", explanation: "CP = 450 / 0.9 = ₹500." },
    ],
    quiz: [
      { q: "CP ₹250, SP ₹300. Profit %?", options: ["16.7%", "20%", "25%", "50%"], answer: 1, explanation: "50/250 × 100 = 20%." },
      { q: "Bought at ₹800, sold at ₹720. Loss %?", options: ["8%", "10%", "11.1%", "12%"], answer: 1, explanation: "Loss 80, 80/800 × 100 = 10%." },
      { q: "To gain 20% on an item costing ₹350, sell it at:", options: ["₹400", "₹420", "₹370", "₹450"], answer: 1, explanation: "350 × 1.2 = ₹420." },
      { q: "MP ₹1,200, discount 15%. SP?", options: ["₹1,020", "₹1,080", "₹1,000", "₹1,050"], answer: 0, explanation: "1,200 × 0.85 = ₹1,020." },
      { q: "SP ₹924 at 10% profit. CP?", options: ["₹830", "₹840", "₹850", "₹832"], answer: 1, explanation: "924 / 1.1 = ₹840." },
    ],
  },
  {
    slug: "time-work",
    title: "Time & Work",
    category: "quant",
    passPercent: 60,
    intro: "Time and work questions ask how long people or machines take to finish a job alone or together. The trick is to think in 'work per day'.",
    concepts: [
      { heading: "Work per day", body: "If A finishes a job in 10 days, A does 1/10 of the job each day." },
      { heading: "Working together", body: "Add the daily work. A (10 days) + B (15 days): 1/10 + 1/15 = 1/6, so together they take 6 days." },
      { heading: "LCM method", body: "Take total work = LCM of the days. For 10 and 15, total = 30 units. A does 3/day, B does 2/day, together 5/day → 30/5 = 6 days. Faster with no fractions." },
      { heading: "Real-life example", body: "Two developers: one finishes a module in 6 days, the other in 12. Together: 1/6 + 1/12 = 1/4 → 4 days." },
    ],
    formulas: [
      "Daily work = 1 / days to finish",
      "Together: 1/T = 1/a + 1/b",
      "T = ab / (a + b) for two people",
      "Work = Rate × Time",
      "M1 × D1 = M2 × D2 (men and days, same job)",
    ],
    examples: [
      { problem: "A takes 12 days, B takes 6. Together?", steps: ["1/12 + 1/6 = 1/12 + 2/12 = 3/12 = 1/4"], answer: "4 days" },
      { problem: "10 men finish in 12 days. How long for 15 men?", steps: ["10 × 12 = 15 × D", "D = 120/15 = 8"], answer: "8 days" },
      { problem: "A and B together take 8 days, A alone 12. B alone?", steps: ["1/B = 1/8 − 1/12 = 1/24"], answer: "24 days" },
    ],
    guided: [
      { q: "A: 20 days, B: 30 days. Together?", options: ["10", "12", "15", "25"], answer: 1, hint: "ab/(a+b).", explanation: "600/50 = 12 days." },
      { q: "6 men take 10 days. 12 men take?", options: ["20", "5", "8", "6"], answer: 1, hint: "M1D1 = M2D2.", explanation: "60/12 = 5 days." },
      { q: "A in 4 hrs, together with B in 3 hrs. B alone?", options: ["6", "12", "7", "10"], answer: 1, hint: "1/3 − 1/4.", explanation: "1/12 → 12 hours." },
    ],
    quiz: [
      { q: "A: 15 days, B: 10 days. Together?", options: ["5", "6", "8", "12.5"], answer: 1, explanation: "150/25 = 6 days." },
      { q: "8 workers take 9 days. 12 workers take?", options: ["6", "7", "13.5", "5"], answer: 0, explanation: "72/12 = 6 days." },
      { q: "A and B together 6 days, A alone 10. B alone?", options: ["12", "15", "16", "4"], answer: 1, explanation: "1/6 − 1/10 = 1/15." },
      { q: "A does half a job in 5 days. Whole job alone?", options: ["5", "10", "2.5", "15"], answer: 1, explanation: "Half in 5 → full in 10 days." },
      { q: "Pipe fills a tank in 6 h, another in 3 h. Together?", options: ["2 h", "4.5 h", "9 h", "1.5 h"], answer: 0, explanation: "18/9 = 2 hours." },
    ],
  },
  {
    slug: "number-series",
    title: "Number Series",
    category: "logical",
    passPercent: 60,
    intro: "Number series questions show a pattern and ask for the next or missing number. With a fixed checklist you can crack most of them in under a minute.",
    concepts: [
      { heading: "Check differences first", body: "Subtract each term from the next. 3, 7, 11, 15 → differences are all 4, so next is 19." },
      { heading: "Second differences", body: "If differences aren't equal, find differences of differences. 2, 5, 10, 17 → 3, 5, 7 → next difference 9, next term 26." },
      { heading: "Ratios", body: "If numbers grow fast, divide. 3, 6, 12, 24 → ×2 each time." },
      { heading: "Squares, cubes, primes", body: "Know squares to 30, cubes to 15 and primes to 100. 1, 4, 9, 16 are squares; 2, 3, 5, 7, 11 are primes." },
    ],
    formulas: [
      "Step 1: differences  Step 2: second differences",
      "Step 3: ratios  Step 4: squares / cubes / primes",
      "Step 5: alternate terms (two series mixed)",
      "Step 6: combinations like ×2 + 1",
    ],
    examples: [
      { problem: "5, 11, 23, 47, ?", steps: ["Each term × 2 + 1", "47 × 2 + 1 = 95"], answer: "95" },
      { problem: "1, 8, 27, 64, ?", steps: ["These are cubes 1³, 2³, 3³, 4³", "5³ = 125"], answer: "125" },
      { problem: "2, 10, 4, 20, 6, ?", steps: ["Alternate: 2, 4, 6 and 10, 20", "Next in second series: 30"], answer: "30" },
    ],
    guided: [
      { q: "4, 9, 16, 25, ?", options: ["30", "36", "35", "49"], answer: 1, hint: "Squares.", explanation: "6² = 36." },
      { q: "2, 6, 18, 54, ?", options: ["108", "162", "72", "148"], answer: 1, hint: "Ratio.", explanation: "×3 → 162." },
      { q: "1, 3, 7, 13, 21, ?", options: ["29", "31", "30", "33"], answer: 1, hint: "Differences 2, 4, 6, 8…", explanation: "Next difference 10 → 31." },
    ],
    quiz: [
      { q: "7, 14, 28, 56, ?", options: ["84", "112", "100", "70"], answer: 1, explanation: "×2 → 112." },
      { q: "2, 3, 5, 7, 11, ?", options: ["12", "13", "15", "17"], answer: 1, explanation: "Primes → 13." },
      { q: "3, 8, 15, 24, ?", options: ["33", "35", "36", "30"], answer: 1, explanation: "n² − 1: 6² − 1 = 35." },
      { q: "1, 2, 6, 24, ?", options: ["48", "120", "96", "72"], answer: 1, explanation: "×2, ×3, ×4, ×5 → 120." },
      { q: "10, 9, 7, 4, ?", options: ["0", "1", "2", "−1"], answer: 0, explanation: "Subtract 1, 2, 3, 4 → 0." },
    ],
  },
  {
    slug: "subject-verb-agreement",
    title: "Subject–Verb Agreement",
    category: "verbal",
    passPercent: 60,
    intro: "Error-spotting and sentence-correction questions in TCS, Infosys and Wipro tests most often check whether the verb matches its subject. A few clear rules cover almost all of them.",
    concepts: [
      { heading: "Singular subject → singular verb", body: "He plays. The team is ready. A singular subject takes the verb with -s in present tense." },
      { heading: "Each, every, either, neither", body: "These are singular: 'Each of the students has a laptop', not 'have'." },
      { heading: "Ignore the words in between", body: "'The box of chocolates is on the table.' The subject is 'box', not 'chocolates'." },
      { heading: "Either/or, neither/nor", body: "The verb agrees with the nearer subject: 'Neither the manager nor the employees were present.'" },
    ],
    formulas: [
      "Find the real subject first, then the verb",
      "each / every / everyone / either / neither → singular",
      "A and B (joined by 'and') → plural",
      "Either A or B → verb matches B",
      "'The number of' → singular; 'A number of' → plural",
    ],
    examples: [
      { problem: "Spot the error: 'One of my friends live in Chennai.'", steps: ["Real subject: 'One'", "'One' is singular", "So 'lives', not 'live'"], answer: "One of my friends lives in Chennai." },
      { problem: "'The number of applicants (has / have) increased.'", steps: ["'The number of' is singular"], answer: "has" },
      { problem: "'Ravi and Priya (is / are) coming.'", steps: ["Two subjects joined by 'and'", "Plural"], answer: "are" },
    ],
    guided: [
      { q: "Everyone ___ invited to the party.", options: ["are", "is", "were", "have"], answer: 1, hint: "'Everyone' is singular.", explanation: "Everyone is." },
      { q: "A number of students ___ absent.", options: ["was", "were", "is", "has"], answer: 1, hint: "'A number of' means many.", explanation: "Plural → were." },
      { q: "Neither the teacher nor the students ___ ready.", options: ["was", "were", "is", "has"], answer: 1, hint: "Look at the nearer subject.", explanation: "'students' is nearer → were." },
    ],
    quiz: [
      { q: "The list of items ___ on the desk.", options: ["are", "is", "were", "have been"], answer: 1, explanation: "Subject is 'list' → is." },
      { q: "Each of the players ___ a medal.", options: ["get", "gets", "are getting", "have got"], answer: 1, explanation: "'Each' is singular → gets." },
      { q: "Bread and butter ___ my favourite breakfast.", options: ["are", "is", "were", "have"], answer: 1, explanation: "Treated as one dish → is." },
      { q: "Either the students or the teacher ___ responsible.", options: ["are", "is", "were", "have"], answer: 1, explanation: "Nearer subject 'teacher' → is." },
      { q: "The news ___ very good today.", options: ["are", "is", "were", "have"], answer: 1, explanation: "'News' is uncountable, singular → is." },
    ],
  },
  {
    slug: "pie-charts",
    title: "Pie Charts & Percent Share",
    category: "di",
    passPercent: 60,
    intro: "Data interpretation sets show a chart and ask 3–5 questions on it. Pie charts are the most common: they show how a total is split into parts.",
    concepts: [
      { heading: "Degrees to percent", body: "A full circle is 360°. A slice of 90° is 90/360 = 25% of the total." },
      { heading: "Percent to value", body: "If the total budget is ₹40 lakh and Marketing is 15%, Marketing = 40 × 0.15 = ₹6 lakh." },
      { heading: "Comparing slices", body: "To compare two slices you don't need the total: if A is 30% and B is 20%, A is 50% more than B." },
      { heading: "Approximate first", body: "Options are usually far apart. Round numbers and check which option is closest before exact calculation." },
    ],
    formulas: [
      "Percent = degrees / 360 × 100",
      "Degrees = percent × 3.6",
      "Value = total × percent / 100",
      "A is more than B by (A − B) / B × 100 %",
    ],
    examples: [
      { problem: "A slice is 72°. What percent is it?", steps: ["72 / 360 = 0.2", "0.2 × 100 = 20"], answer: "20%" },
      { problem: "Total sales 5,000 units; Product X is 18%. Units of X?", steps: ["5,000 × 18/100 = 900"], answer: "900 units" },
      { problem: "Rent is 25%, Food 35%. Food is how much more than Rent?", steps: ["(35 − 25)/25 × 100", "= 40"], answer: "40% more" },
    ],
    guided: [
      { q: "A slice of 54° is what percent?", options: ["12%", "15%", "18%", "20%"], answer: 1, hint: "Divide by 360.", explanation: "54/360 = 0.15 = 15%." },
      { q: "30% of a pie chart is how many degrees?", options: ["90°", "108°", "120°", "100°"], answer: 1, hint: "Multiply by 3.6.", explanation: "30 × 3.6 = 108°." },
      { q: "Total ₹80,000; Travel is 12.5%. Travel amount?", options: ["₹8,000", "₹10,000", "₹12,500", "₹9,600"], answer: 1, hint: "12.5% = 1/8.", explanation: "80,000 ÷ 8 = ₹10,000." },
    ],
    quiz: [
      { q: "A slice is 126°. Percent?", options: ["30%", "35%", "36%", "40%"], answer: 1, explanation: "126/360 = 0.35." },
      { q: "45% in degrees?", options: ["145°", "162°", "150°", "170°"], answer: 1, explanation: "45 × 3.6 = 162°." },
      { q: "Total 1,200 students; 15% chose Civil. How many?", options: ["160", "180", "200", "150"], answer: 1, explanation: "1,200 × 0.15 = 180." },
      { q: "A = 24%, B = 16%. A is more than B by:", options: ["8%", "50%", "33%", "40%"], answer: 1, explanation: "(24 − 16)/16 = 50%." },
      { q: "If Food = ₹9,000 and is 30% of the total, the total is:", options: ["₹27,000", "₹30,000", "₹32,000", "₹36,000"], answer: 1, explanation: "9,000 / 0.3 = ₹30,000." },
    ],
  },
];

export function getLesson(slug: string) {
  return LESSONS.find((l) => l.slug === slug);
}

export function scoreQuiz(quiz: QuizQ[], picks: (number | null)[]) {
  return quiz.reduce((s, q, i) => s + (picks[i] === q.answer ? 1 : 0), 0);
}

export function passed(score: number, total: number, passPercent: number) {
  return total > 0 && (score / total) * 100 >= passPercent;
}
