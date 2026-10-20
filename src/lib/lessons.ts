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
