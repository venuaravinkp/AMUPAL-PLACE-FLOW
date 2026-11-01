export type ProjectMilestone = { id: string; title: string; tasks: string[]; deliverable: string };
export type ProjectBrief = {
  slug: string; title: string; department: string; level: string; duration: string;
  problem: string; objectives: string[]; prerequisites: string[]; tools: string[];
  milestones: ProjectMilestone[]; rubric: { criterion: string; points: number; evidence: string }[];
  interview: string[];
};

function brief(slug: string, title: string, department: string, problem: string, tools: string[], deliverables: [string, string, string, string], interview: string[]): ProjectBrief {
  return {
    slug, title, department, level: "Intermediate", duration: "3–4 weeks", problem, tools,
    objectives: ["Turn a real-world problem into measurable requirements.", "Build and validate a practical solution using evidence.", "Document decisions and explain your contribution in an interview."],
    prerequisites: ["Basic knowledge of your department's fundamentals", "Comfort with the listed tools", "Ability to organise data and write a short report"],
    milestones: [
      { id: "scope", title: "Define the problem", tasks: ["Identify the users, constraints and intended outcome.", "Write five measurable acceptance criteria.", "List assumptions, safety considerations and data sources."], deliverable: deliverables[0] },
      { id: "design", title: "Design the solution", tasks: ["Compare two approaches and justify your choice.", "Create a diagram, model or workflow.", "Prepare sample inputs and expected results."], deliverable: deliverables[1] },
      { id: "build", title: "Build and validate", tasks: ["Implement the core workflow using the selected tools.", "Test normal, boundary and failure cases.", "Record results, limitations and improvements."], deliverable: deliverables[2] },
      { id: "present", title: "Package your portfolio", tasks: ["Write a README or report covering setup, sources and findings.", "Add screenshots, charts or a short demonstration.", "Prepare a two-minute explanation of your own contribution."], deliverable: deliverables[3] },
    ],
    rubric: [
      { criterion: "Problem definition", points: 20, evidence: "Clear requirements, assumptions and measurable outcomes" },
      { criterion: "Design and reasoning", points: 25, evidence: "Diagram, alternatives and justified decisions" },
      { criterion: "Implementation and validation", points: 35, evidence: "Working output, reproducible tests and honest limitations" },
      { criterion: "Portfolio and communication", points: 20, evidence: "Readable report, demonstration and personal contribution" },
    ], interview,
  };
}

export const PROJECTS: ProjectBrief[] = [
  brief("campus-placement", "Campus Placement & Candidate Ranking System", "computing",
    "A college placement cell manages applications in scattered spreadsheets. Build a system that tracks student eligibility, applications and recruiter shortlists. Explainable ranking must use declared skills and test results, not sensitive personal attributes.",
    ["React", "Node.js or Python", "PostgreSQL", "Git"],
    ["Requirements for student, recruiter and coordinator workflows; eligibility and ranking rules", "Entity diagram for students, jobs and applications; API specification and ranking examples", "Working login, job list, applications and shortlist with access-control and ranking tests", "Repository, setup guide, sample data, demo and a fairness/limitations note"],
    ["How do you prevent a student from reading another student's records?", "How does your ranking work, and how do you test fairness?", "What happens when a student applies twice to the same job?"]),
  brief("sales-analytics", "Retail Sales Analysis Dashboard", "computing",
    "A small retailer needs to understand falling revenue. Analyse a public or synthetic sales dataset to compare revenue, margins, products and regions, then recommend actions backed by evidence.",
    ["Python / pandas", "Excel or Power BI", "SQL"],
    ["Business questions, source attribution and a data dictionary", "Cleaning plan, KPI definitions and dashboard wireframe", "Cleaned dataset, repeatable analysis and dashboard with reconciled totals", "Analysis notebook, dashboard export and three evidence-based recommendations"],
    ["How did you handle missing data?", "What is the difference between revenue and profit?", "Which recommendation is supported by the strongest evidence?"]),
  brief("iot-energy", "IoT Energy Monitoring Prototype", "electronics",
    "Design a low-voltage or simulated monitoring system that records energy readings and flags abnormal consumption. Do not connect a prototype to mains electricity; use simulation or a safe supervised test rig.",
    ["ESP32 / Arduino simulator", "Embedded C", "Spreadsheet"],
    ["Measurement requirements, safe operating limits and sensor assumptions", "Circuit diagram, sampling strategy and alert logic", "Simulated or low-voltage prototype with calibrated readings and alert tests", "Source, circuit diagram, readings, safety note and demonstration"],
    ["How do you calibrate the sensor?", "How do sampling rate and noise affect readings?", "What should happen when a sensor disconnects?"]),
  brief("quality-improvement", "Manufacturing Defect Reduction Study", "mechanical",
    "A workshop has repeated dimensional defects. Use synthetic or permissioned inspection data to identify the largest causes and propose a measurable quality-improvement experiment.",
    ["Excel", "CAD viewer", "Basic statistics"],
    ["Process map, defect definitions and baseline inspection dataset", "Pareto chart, fishbone analysis and experiment plan", "Control charts and before/after analysis with stated statistical limitations", "Quality report, inspection checklist and implementation proposal"],
    ["How did you choose the root cause?", "How do you distinguish common-cause from special-cause variation?", "How would you measure whether the change worked?"]),
  brief("civil-boq", "Building Estimation & BOQ Planning", "civil",
    "Prepare an educational cost estimate for a small single-storey building using supplied or self-created drawings. Quantify materials, document assumptions and compare two cost scenarios. This is not a certified structural design.",
    ["Excel", "AutoCAD or drawing viewer", "Local reference rate sheet"],
    ["Dimensioned plan, scope boundaries and measurement assumptions", "Quantity take-off for excavation, concrete, masonry and finishes", "Formula-linked BOQ with units, rates, waste allowances and independent cross-checks", "Drawings, editable estimate, rate sources and sensitivity report"],
    ["How did you calculate masonry quantities and deductions?", "Which assumptions affect your estimate most?", "How do you prevent unit-conversion errors?"]),
  brief("bioreactor-analysis", "Bioreactor Yield & Scale-Up Analysis", "life_sciences",
    "Model a hypothetical batch bioreactor and investigate how substrate, growth rate and operating constraints affect yield. Use literature or synthetic inputs and label assumptions; no unsupervised biological experiments are required.",
    ["Excel or Python", "Published reference data"],
    ["Process scope, source references and modelling assumptions", "Mass balance, kinetic model and parameter definitions", "Simulation results, sensitivity plots and balance checks", "Reproducible model, limitations and scale-up recommendation report"],
    ["Which parameter most affects yield?", "How did you check the mass balance?", "Why might a lab-scale model fail at larger scale?"]),
  brief("market-entry", "Financial Valuation & Market Entry Study", "business",
    "Evaluate whether a hypothetical small business should enter a new city. Compare customer demand, competitor pricing, unit economics and financial scenarios before making a justified go/no-go recommendation.",
    ["Excel", "Public market reports", "Presentation software"],
    ["Business question, target segment and sourced market assumptions", "Competitor comparison, unit economics and financial model design", "Cash-flow model, break-even analysis and optimistic/base/pessimistic scenarios", "Editable model, reference list and a five-slide decision presentation"],
    ["What drives your break-even point?", "Which assumptions are least reliable?", "What would change your recommendation?"]),
  brief("community-survey", "Community Survey & Insight Report", "science_arts",
    "Investigate a campus service problem with an anonymous, consent-based survey or a synthetic dataset. Summarise findings without exposing personal information and propose an accessible service improvement.",
    ["Spreadsheet", "Survey tool", "Presentation software"],
    ["Research question, consent statement and anonymous questionnaire", "Sampling plan, analysis method and bias checklist", "Cleaned anonymous dataset, charts and qualified findings", "Report, accessible presentation and practical improvement proposal"],
    ["How did you minimise sampling bias?", "Can you infer causation from this survey?", "How did you protect participants' privacy?"]),
];

export function getProject(slug: string) { return PROJECTS.find((p) => p.slug === slug); }
export function projectCompletion(project: ProjectBrief, completed: string[]) {
  const done = new Set(completed);
  return Math.round(project.milestones.filter((m) => done.has(m.id)).length / project.milestones.length * 100);
}
export function safeProjectUrl(value: string) {
  if (!value.trim()) return "";
  try { const u = new URL(value.trim()); if (u.protocol === "https:" && !u.username && !u.password) return u.href; } catch { /* invalid URL */ }
  throw new Error("Project links must be valid HTTPS addresses without embedded credentials.");
}
export function submissionIssues(project: ProjectBrief, completed: string[], summary: string, repository: string, demo: string) {
  const issues: string[] = [];
  if (projectCompletion(project, completed) !== 100) issues.push("Finish all four milestones.");
  if (!summary.trim()) issues.push("Add your project summary and personal contribution.");
  if (!repository.trim() && !demo.trim()) issues.push("Add a repository or a link to your report / demonstration.");
  for (const link of [repository, demo]) { try { safeProjectUrl(link); } catch (e) { issues.push((e as Error).message); } }
  return [...new Set(issues)];
}
export function portfolioMarkdown(project: ProjectBrief, summary: string, repository: string, demo: string) {
  return `# ${project.title}\n\n## Problem\n${project.problem}\n\n## My contribution and results\n${summary}\n\n## Tools\n${project.tools.join(", ")}\n\n## Evidence\n${repository ? `Repository: ${repository}\n` : ""}${demo ? `Report / demonstration: ${demo}\n` : ""}\n## Deliverables\n${project.milestones.map((m) => `- ${m.deliverable}`).join("\n")}\n`;
}