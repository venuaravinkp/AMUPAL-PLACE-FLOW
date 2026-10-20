export type PathItem = { title: string; detail: string; to?: "/aptitude" | "/coding" | "/communication" | "/interview" | "/tests" | "/companies"; lesson?: string };

export const DEPARTMENT_GROUPS: Record<string, { label: string; branches: string[]; roles: string[]; track: PathItem[] }> = {
  computing: {
    label: "Computing & IT",
    branches: ["CSE", "IT", "AI/ML", "AI & Data Science", "Cybersecurity", "Software Engineering", "BCA"],
    roles: ["Software Engineer", "Data Analyst", "Full-stack Developer", "QA / Test Engineer", "Cloud / DevOps Engineer"],
    track: [
      { title: "Programming fundamentals", detail: "Variables, loops, functions in Python, Java, C/C++ or JavaScript.", to: "/coding" },
      { title: "Data structures & algorithms", detail: "Arrays, strings, linked lists, stacks, sorting and searching.", to: "/coding" },
      { title: "SQL & databases", detail: "SELECT, JOIN, GROUP BY, normalization and keys.", to: "/coding" },
      { title: "OOP & core CS", detail: "OOP pillars, OS processes vs threads, DBMS, networks basics.", to: "/interview" },
      { title: "Web, APIs, Git", detail: "HTTP, REST APIs, Git branching, building and deploying a small project." },
      { title: "Technical interviews", detail: "Explain your project and solve array/string problems aloud.", to: "/interview" },
    ],
  },
  electronics: {
    label: "Electronics & Electrical",
    branches: ["ECE", "EEE", "E&I", "Telecommunications", "Embedded Systems"],
    roles: ["Embedded Engineer", "Electrical Design Engineer", "Network Engineer", "VLSI Trainee", "Software Engineer"],
    track: [
      { title: "Circuit fundamentals", detail: "Ohm's law, KVL/KCL, Thevenin, RC/RL circuits." },
      { title: "Digital electronics", detail: "Logic gates, flip-flops, counters, number systems." },
      { title: "Microcontrollers & embedded C", detail: "Arduino/8051 basics, GPIO, timers, interrupts.", to: "/coding" },
      { title: "Communication & networking", detail: "Modulation, OSI model, IP addressing." },
      { title: "Programming for core roles", detail: "C and Python to move into IT or embedded jobs.", to: "/coding" },
      { title: "Core technical interviews", detail: "Explain your project, devices and measurements.", to: "/interview" },
    ],
  },
  mechanical: {
    label: "Mechanical & Industrial",
    branches: ["Mechanical", "Automobile", "Mechatronics", "Manufacturing", "Industrial Engineering"],
    roles: ["Design Engineer", "Production Engineer", "Quality Engineer", "Maintenance Engineer", "Graduate Engineer Trainee"],
    track: [
      { title: "Engineering mechanics & SOM", detail: "Forces, stress-strain, bending, shear." },
      { title: "Thermodynamics & fluids", detail: "Laws of thermodynamics, cycles, pumps and turbines." },
      { title: "Manufacturing processes", detail: "Casting, machining, welding, CNC basics." },
      { title: "CAD & drawing", detail: "Reading drawings, GD&T, AutoCAD/SolidWorks practice." },
      { title: "Quality & lean", detail: "Six Sigma basics, 5S, Kaizen, root-cause analysis." },
      { title: "Core interviews", detail: "Explain your project and common mechanical questions.", to: "/interview" },
    ],
  },
  civil: {
    label: "Civil & Construction",
    branches: ["Civil", "Construction", "Surveying"],
    roles: ["Site Engineer", "Structural Design Trainee", "Quantity Surveyor", "Planning Engineer"],
    track: [
      { title: "Building materials & construction", detail: "Concrete, steel, brickwork, construction methods." },
      { title: "Structural analysis basics", detail: "Loads, beams, columns, RCC design concepts." },
      { title: "Surveying", detail: "Levelling, total station, contour maps." },
      { title: "Estimation & costing", detail: "Quantity take-off, BOQ, rate analysis." },
      { title: "AutoCAD & project planning", detail: "Drawings, MS Project/Primavera basics." },
      { title: "Site & HR interviews", detail: "Safety, site situations and project questions.", to: "/interview" },
    ],
  },
  life_sciences: {
    label: "Chemical & Life Sciences",
    branches: ["Chemical", "Biotechnology", "Biomedical"],
    roles: ["Process Engineer", "QA/QC Analyst", "Research Associate", "Clinical Data Analyst"],
    track: [
      { title: "Core process/biology concepts", detail: "Mass & energy balance, unit operations, or molecular biology basics." },
      { title: "Lab & quality practices", detail: "GLP, GMP, SOPs, documentation." },
      { title: "Data & Excel for science", detail: "Charts, statistics, reporting results." },
      { title: "Safety & regulations", detail: "HAZOP, MSDS, regulatory basics." },
      { title: "Interviews", detail: "Explain experiments and your project clearly.", to: "/interview" },
    ],
  },
  business: {
    label: "Business, Commerce & Management",
    branches: ["BBA", "MBA", "B.Com", "Finance", "Accounting", "Business Analytics", "Marketing"],
    roles: ["Business Analyst", "Financial Analyst", "Sales / Marketing Executive", "Operations Executive", "HR Executive"],
    track: [
      { title: "Accounting & finance basics", detail: "Balance sheet, P&L, ratios, GST basics." },
      { title: "Excel & business analytics", detail: "Formulas, pivot tables, dashboards." },
      { title: "Marketing & sales fundamentals", detail: "4Ps, funnels, customer communication." },
      { title: "Case interviews & GD", detail: "Structure business problems; practise group discussions.", to: "/communication" },
      { title: "HR interviews", detail: "Behavioural answers using the STAR method.", to: "/interview" },
    ],
  },
  science_arts: {
    label: "Science, Arts & Other",
    branches: ["B.Sc", "B.A", "Humanities", "Other"],
    roles: ["Data Analyst", "Content / Communications", "Customer Success", "Operations Executive", "Teacher / Trainer"],
    track: [
      { title: "Excel & data skills", detail: "Clean data, charts, simple analysis." },
      { title: "Writing & presentation", detail: "Reports, emails, slides.", to: "/communication" },
      { title: "Transferable tech skills", detail: "Python or SQL basics for analyst roles.", to: "/coding" },
      { title: "Interviews", detail: "HR and role-based questions.", to: "/interview" },
    ],
  },
};

export const COMMON_FOUNDATION: PathItem[] = [
  { title: "Quantitative aptitude", detail: "Start with the Percentages lesson.", lesson: "percentages" },
  { title: "Logical reasoning & DI", detail: "Series, puzzles, charts.", to: "/aptitude" },
  { title: "Verbal ability & grammar", detail: "Grammar, vocabulary, reading.", to: "/aptitude" },
  { title: "Communication & emails", detail: "Self-intro, GD and professional emails.", to: "/communication" },
  { title: "HR & behavioural interviews", detail: "Practise common questions with feedback.", to: "/interview" },
  { title: "Mock tests", detail: "Timed tests to check readiness.", to: "/tests" },
];

export const CAREER_INTERESTS = ["Software / IT", "Data & analytics", "Core engineering", "Design", "Finance", "Sales & marketing", "Operations", "Research", "Government jobs", "Higher studies"];
export const LEARNING_FORMATS = ["Reading", "Videos", "Practice-first", "Mixed"];
export const IMPROVEMENT_AREAS = ["Aptitude", "Coding", "English", "Confidence", "Interviews", "Resume", "Core subjects"];
export const DEGREES = ["B.E / B.Tech", "M.E / M.Tech", "BCA / MCA", "B.Sc / M.Sc", "B.Com / M.Com", "BBA / MBA", "B.A / M.A", "Diploma", "Other"];
