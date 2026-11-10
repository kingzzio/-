// ACT, PSAT 8/9, NYS Grade 8 tests and AP exams. Formats were checked on act.org, satsuite.collegeboard.org,
// apstudents.collegeboard.org and schools.nyc.gov in November 2026. Always confirm with the official page linked.

const t = (id, subject, course, name, desc, gen, qs = [], cards = [], grades = [9, 10, 11, 12]) => ({ id, subject, course, grades, unit: course, name, desc, gen, tags: [], qs, cards });

export const moreTopics = [
  t("act-science", "science", "ACT Prep", "ACT Science: Data & Experiments", "ACT Science: read tables and graphs from experiments and reason about the results.", ["data-table"], [
    ["In an experiment, a student changes the amount of fertilizer and measures plant height. The plant height is the…", ["independent variable", "dependent variable", "control group", "constant"], 1, "The dependent variable is what you measure; it depends on what you change."],
    ["Which change would make an experiment's results more reliable?", ["Testing only one plant", "Repeating each trial several times", "Changing two variables at once", "Skipping the control group"], 1, "Repeated trials reduce the effect of random error."],
    ["Scientist 1 says a fossil is 10,000 years old; Scientist 2 says 50,000. They would MOST likely agree that…", ["the fossil is exactly 30,000 years old", "the fossil is older than 5,000 years", "fossils can't be dated", "Scientist 1 is wrong"], 1, "Both estimates are over 5,000 years. In conflicting-viewpoints passages, look for what both sides accept."],
  ], [
    ["ACT Science is reading", "You rarely need outside facts. Go straight to the table or graph the question names."],
    ["Variables", "Independent = what's changed on purpose. Dependent = what's measured. Constants = kept the same."],
    ["Conflicting viewpoints", "Summarize each scientist in one line before you answer."],
  ]),
  t("ap-psych", "science", "AP Psychology", "AP Psychology Essentials", "Key ideas across AP Psychology: biological bases, cognition, development, social psychology and mental health.", [], [
    ["Which part of a neuron receives messages from other neurons?", ["axon", "dendrites", "myelin sheath", "terminal buttons"], 1, "Dendrites receive signals; the axon sends them away from the cell body."],
    ["A researcher randomly assigns participants to two groups to test a new study method. This is a(n)…", ["case study", "naturalistic observation", "experiment", "correlational study"], 2, "Random assignment plus a manipulated variable makes it an experiment, the only design that shows cause and effect."],
    ["A correlation coefficient of −0.85 shows…", ["a weak positive relationship", "a strong negative relationship", "no relationship", "that one variable causes the other"], 1, "The sign gives direction; the size (close to 1) gives strength. Correlation never proves causation."],
    ["Pavlov's dogs salivating to a bell is an example of…", ["operant conditioning", "classical conditioning", "observational learning", "insight learning"], 1, "A neutral stimulus (bell) paired with food becomes a conditioned stimulus."],
    ["Taking away chores after a student finishes homework, so homework increases, is…", ["positive reinforcement", "negative reinforcement", "positive punishment", "negative punishment"], 1, "Removing something unpleasant to increase a behavior is negative reinforcement."],
    ["According to Piaget, a child who understands that pouring water into a taller glass doesn't change its amount has mastered…", ["object permanence", "conservation", "egocentrism", "abstract reasoning"], 1, "Conservation develops in the concrete operational stage."],
    ["Blaming a classmate's lateness on laziness instead of the bus is the…", ["fundamental attribution error", "bystander effect", "self-serving bias", "halo effect"], 0, "Overestimating personality and underestimating the situation when judging others."],
    ["Which part of the brain is most involved in forming new long-term memories?", ["cerebellum", "hippocampus", "medulla", "occipital lobe"], 1, "The hippocampus helps encode new explicit memories."],
    ["Asch's line studies are best known for showing…", ["obedience to authority", "conformity to a group", "cognitive dissonance", "groupthink"], 1, "Many people gave obviously wrong answers to match the group."],
    ["Remembering the first and last items on a list better than the middle ones is the…", ["serial position effect", "misinformation effect", "spacing effect", "testing effect"], 0, "Primacy (first items) plus recency (last items) make the serial position curve."],
  ], [
    ["Experiments vs. correlations", "Only experiments (random assignment + manipulated IV) can show cause and effect."],
    ["Reinforcement vs. punishment", "Reinforcement increases a behavior, punishment decreases it. Positive adds, negative removes."],
  ]),
  t("ap-hug", "history", "AP Human Geography", "AP Human Geography Essentials", "Population, migration, culture, political geography, agriculture, cities and development.", [], [
    ["A country's crude birth rate is 30 and crude death rate is 10 (per 1,000). Its rate of natural increase is…", ["2%", "20%", "3%", "0.2%"], 0, "(30 − 10) per 1,000 = 20 per 1,000 = 2%."],
    ["In stage 2 of the Demographic Transition Model…", ["birth and death rates are both low", "death rates fall while birth rates stay high", "birth rates fall below death rates", "both rates are high and steady"], 1, "Better food and medicine cut death rates first, so population grows fast."],
    ["Moving because a new factory opened in another city is an example of a…", ["push factor", "pull factor", "forced migration", "intervening obstacle"], 1, "A pull factor attracts people to a new place."],
    ["Which type of diffusion spreads from a large city to smaller cities, skipping rural areas?", ["contagious", "hierarchical", "relocation", "stimulus"], 1, "Hierarchical diffusion moves through levels of importance, like big cities first."],
    ["The Green Revolution mainly increased…", ["organic farming", "crop yields using new seeds, fertilizer and irrigation", "the number of small family farms", "fishing in the oceans"], 1, "High-yield seeds plus fertilizer and irrigation boosted output, especially in Asia and Latin America."],
    ["Gerrymandering is…", ["counting the population every ten years", "drawing district lines to favor one group", "a country splitting into smaller states", "giving power to local governments"], 1, "Packing or cracking voters by redrawing boundaries."],
    ["A city that is far larger and more important than any other in its country is a…", ["megacity", "primate city", "edge city", "world city"], 1, "The rank-size rule doesn't hold; one city dominates (e.g., Paris, Bangkok)."],
    ["Von Thünen's model explains…", ["where cities grow", "how farmland use changes with distance from the market", "how languages spread", "why industries cluster"], 1, "Rings of land use: perishable, intensive products closest to the market."],
    ["Which is a centripetal force that helps unify a country?", ["a shared national language", "ethnic conflict", "a separatist movement", "uneven development"], 0, "Centripetal forces pull a state together; centrifugal forces pull it apart."],
    ["A population pyramid with a wide base and narrow top shows a population that is…", ["aging", "growing quickly", "shrinking", "stable"], 1, "Many young people mean high birth rates and fast growth."],
  ], [
    ["DTM in one line", "Stage 1 high/high → 2 deaths drop → 3 births drop → 4 low/low → (5) births below deaths."],
    ["Scale matters", "AP HuG loves asking how a pattern looks at local, national and global scales."],
  ]),
  t("ap-csp", "math", "AP Computer Science Principles", "Binary, Logic & Computing", "Binary, Boolean logic, algorithms, the internet and the impact of computing.", ["binary", "boolean"], [
    ["How many different values can 4 bits represent?", ["4", "8", "16", "32"], 2, "Each bit doubles the options: 2⁴ = 16."],
    ["A list is sorted. Which search finds an item fastest on a very long list?", ["linear search", "binary search", "random search", "they're the same"], 1, "Binary search halves the list every step."],
    ["Breaking data into packets that can take different routes is a feature of…", ["the internet", "a single computer's memory", "binary search", "lossless compression"], 0, "Packets travel independently and are reassembled at the destination."],
    ["Which compression type lets you get the exact original file back?", ["lossy", "lossless", "both", "neither"], 1, "Lossless keeps all the data; lossy (like JPEG) throws some away."],
    ["Phishing is…", ["a type of encryption", "tricking people into giving personal information", "a sorting algorithm", "a kind of hardware"], 1, "Phishing uses fake messages or sites to steal information."],
  ], [
    ["Binary place values", "128 64 32 16 8 4 2 1. Add the places with a 1."],
    ["Overflow", "A fixed number of bits can only hold so big a number; going past it is an overflow error."],
  ]),
];

const OFFICIAL_AP = (slug) => ({ label: "AP Students – exam format", url: `https://apstudents.collegeboard.org/courses/${slug}/assessment` });

function ap({ id, name, emoji, color, slug, mc, mcMinutes, format, tips, sections }) {
  return {
    id, name, full: `${name} Exam`, emoji, color,
    who: `Students taking ${name}. AP Exams are given in May; check your school's schedule.`,
    format,
    tips: [...tips, "BrainBoro practices the multiple-choice section. For written answers, plan them with Essay Coach or ask Boro to grade a practice response."],
    official: OFFICIAL_AP(slug),
    sections,
    fullTest: [{ name: "Section I: Multiple Choice", questions: mc, minutes: mcMinutes, all: true }],
    scoring: { penalty: 0 },
    mock: { questions: 25, minutes: Math.round((mcMinutes * 25) / mc) },
  };
}

const read = ["ela-central-idea", "ela-inference", "ela-structure", "ela-vocab-context", "ela-theme", "ela-figurative"];

export const moreExams = [
  {
    id: "act", name: "ACT", full: "ACT (college admission test)", emoji: "🎯", color: "#2563eb",
    who: "High school juniors and seniors applying to college. Accepted by every U.S. college that asks for a test score.",
    format: [
      "English: 50 questions in 35 minutes.",
      "Math: 45 questions in 50 minutes. Calculator allowed (check ACT's calculator policy).",
      "Reading: 36 questions in 40 minutes.",
      "Science: 40 questions in 40 minutes. Now optional.",
      "Your Composite (1–36) is the average of English, Math and Reading. Science no longer counts toward it.",
      "Optional writing test, scored 2–12, which doesn't affect the Composite.",
      "No penalty for guessing.",
    ],
    tips: [
      "No guessing penalty: answer every question.",
      "English: when two choices are both correct, the shorter, clearer one usually wins.",
      "Math is about 1 minute per question. Skip and come back to the long ones.",
      "Science is mostly reading graphs and tables. Go straight to the figure the question names.",
    ],
    official: { label: "ACT – test day & format", url: "https://www.act.org/content/act/en/products-and-services/the-act/test-day.html" },
    sections: [
      { name: "English", topics: ["ela-punctuation", "ela-sentences", "ela-agreement", "ela-revising"] },
      { name: "Math", topics: ["a1-equations", "a1-functions", "a1-quadratics", "a1-exponential", "geo-trig", "geo-circles", "geo-coordinate", "a2-polynomials", "a2-exp-log", "m7-probability", "a1-stats"] },
      { name: "Reading", topics: read },
      { name: "Science", topics: ["act-science", "bio-ecology", "chem-reactions", "phys-motion"] },
    ],
    fullTest: [
      { name: "English", questions: 50, minutes: 35 },
      { name: "Math", questions: 45, minutes: 50 },
      { name: "Reading", questions: 36, minutes: 40 },
      { name: "Science (optional)", questions: 40, minutes: 40 },
    ],
    scoring: { penalty: 0 },
    mock: { questions: 40, minutes: 35 },
  },
  {
    id: "psat89", name: "PSAT 8/9", full: "PSAT 8/9 (digital)", emoji: "🧭", color: "#0891b2",
    who: "8th and 9th graders, usually taken at school. A first look at the SAT and a way to see where to grow.",
    format: [
      "Digital, in the Bluebook app. 2 hours 14 minutes total.",
      "Reading and Writing: 54 questions in 64 minutes.",
      "Math: 44 questions in 70 minutes. Some math answers are typed in instead of chosen.",
      "Two sections, each split into two modules; the second module adapts to how you did on the first.",
    ],
    tips: [
      "Reading and Writing questions are short: one passage, one question. Read the question first.",
      "Use the built-in Desmos calculator on Math.",
      "There's no guessing penalty. Answer everything.",
    ],
    official: { label: "College Board – PSAT 8/9 structure", url: "https://satsuite.collegeboard.org/psat-8-9/whats-on-the-test/structure" },
    sections: [
      { name: "Reading and Writing", topics: ["ela-central-idea", "ela-inference", "ela-vocab-context", "ela-structure", "ela-punctuation", "ela-sentences", "ela-revising", "ela-sat-words"] },
      { name: "Math", topics: ["m7-proportional", "m7-percent-apps", "m8-linear", "m8-systems", "m8-functions", "m8-pythagorean", "a1-equations", "a1-functions", "m6-stats", "m7-probability"] },
    ],
    fullTest: [
      { name: "Reading and Writing", questions: 54, minutes: 64 },
      { name: "Math", questions: 44, minutes: 70 },
    ],
    scoring: { penalty: 0 },
    mock: { questions: 30, minutes: 37 },
  },
  {
    id: "nys8", name: "NYS Grade 8", full: "New York State Grade 8 Tests (ELA, Math, Science)", emoji: "🗽", color: "#16a34a",
    who: "New York 8th graders. Every grade 3–8 student takes ELA and Math; grades 5 and 8 also take Science.",
    format: [
      "All three tests are taken on a computer.",
      "ELA (2026–27 window: April 6–16): two days, untimed. Multiple-choice questions on short passages, plus written responses to stories, articles and poems.",
      "Math (window: May 4–14): untimed. Multiple-choice and open-ended questions.",
      "Science (window: April 19–21): one session in one day, untimed within the school day. Apply concepts, make predictions and use scientific inquiry.",
      "Scores become a scale score and one of four performance levels.",
    ],
    tips: [
      "The tests are untimed: slow down and show your work on open-ended math.",
      "For written ELA answers, use RACE: Restate, Answer, Cite evidence, Explain.",
      "Try the official Question Sampler so the computer format feels familiar.",
    ],
    official: { label: "NYC Public Schools – state tests", url: "https://www.schools.nyc.gov/learning/testing/ny-state-english-language-arts" },
    sections: [
      { name: "ELA", topics: [...read, "ela-writing", "ela-poetry"] },
      { name: "Math", topics: ["m8-exponents", "m8-roots", "m8-linear", "m8-systems", "m8-functions", "m8-transformations", "m8-pythagorean", "m8-volume", "m8-scatter"] },
      { name: "Science", topics: ["es-weather", "es-astronomy", "es-rocks", "phys-forces", "phys-energy", "bio-cells", "bio-ecology", "bio-genetics", "act-science"] },
    ],
    scoring: { penalty: 0 },
    mock: { questions: 30, minutes: 45 },
  },
  ap({ id: "ap-calc-ab", name: "AP Calculus AB", emoji: "∫", color: "#dc2626", slug: "ap-calculus-ab", mc: 42, mcMinutes: 105,
    format: ["Hybrid digital: multiple choice in Bluebook, free-response handwritten in a paper booklet.", "Section I: 42 multiple-choice questions (50% of score). Part A: 29 questions, no graphing calculator. Part B: 13 questions, graphing calculator needed for some.", "Section II: 6 free-response questions (50%). Part A: 2 with a graphing calculator; Part B: 4 without."],
    tips: ["Know your derivative and integral rules cold. Part A is calculator-free.", "On free response, show the setup: answers without work get little credit."],
    sections: [{ name: "Limits & Derivatives", topics: ["pc-limits", "pc-functions"] }, { name: "Integrals", topics: ["pc-integrals", "ap-calc-practice"] }] }),
  ap({ id: "ap-precalc", name: "AP Precalculus", emoji: "📈", color: "#ea580c", slug: "ap-precalculus", mc: 42, mcMinutes: 105,
    format: ["Hybrid digital exam.", "Section I: 42 multiple-choice questions, 1 hr 45 min, about 63% of score. Part A: 29 questions in 65 min, no calculator. Part B: 13 questions in 40 min, graphing calculator required for some (radian mode).", "Section II: 4 free-response questions, 1 hr 10 min, about 37%."],
    tips: ["Set your calculator to radian mode before Part B.", "Practice moving between graphs, tables and equations: questions use all of them."],
    sections: [{ name: "Functions", topics: ["pc-functions", "a2-polynomials", "a2-rational"] }, { name: "Exponential, Log & Trig", topics: ["a2-exp-log", "a2-trig", "geo-trig"] }] }),
  ap({ id: "ap-stats", name: "AP Statistics", emoji: "📊", color: "#0d9488", slug: "ap-statistics", mc: 42, mcMinutes: 90,
    format: ["Fully digital in Bluebook. Calculators permitted.", "Section 1: 42 multiple-choice questions (50% of score).", "Section 2: 4 free-response questions (50%), each worth 10 points."],
    tips: ["Always answer in context: name the variable and the population.", "Know when to use z vs. t, and check conditions before any inference."],
    sections: [{ name: "Describing & Probability", topics: ["a1-stats", "m7-probability", "m6-stats", "ap-stats-practice"] }, { name: "Inference", topics: ["a2-stats"] }] }),
  ap({ id: "ap-bio", name: "AP Biology", emoji: "🧬", color: "#16a34a", slug: "ap-biology", mc: 60, mcMinutes: 90,
    format: ["Hybrid digital exam. Calculators permitted.", "Section I: 60 multiple-choice questions (50% of score), some in sets about the same data or diagram.", "Section II: 6 free-response questions (50%): two long and four short."],
    tips: ["Expect data: practice reading graphs and doing quick calculations (rates, chi-square).", "On free response, use the exact vocabulary (e.g., 'active transport', 'allele frequency')."],
    sections: [{ name: "Cells & Molecules", topics: ["bio-cells", "bio-transport", "bio-biochem"] }, { name: "Genetics, Evolution & Ecology", topics: ["bio-genetics", "bio-evolution", "bio-ecology", "bio-homeostasis"] }] }),
  ap({ id: "apush", name: "AP U.S. History", emoji: "🦅", color: "#1d4ed8", slug: "ap-united-states-history", mc: 55, mcMinutes: 55,
    format: ["Fully digital in Bluebook.", "Section IA: 55 multiple-choice questions (40% of score).", "Section IB: 3 short-answer questions (20%).", "Section II: 2 free-response questions (40%): a document-based question (recommended 60 min including a 15-min reading period, 25% of score) and a long essay (40 min, 15%)."],
    tips: ["Multiple-choice questions come in sets based on a source. Read the source line (author, date) first.", "For the DBQ, group documents and explain each one's point of view, purpose, audience or context."],
    sections: [{ name: "Founding to Reconstruction", topics: ["us-constitution", "us-civilwar", "us-courtcases"] }, { name: "Industry to Today", topics: ["us-industrial", "us-depression", "us-civilrights", "us-coldwar"] }] }),
  ap({ id: "ap-world", name: "AP World History", emoji: "🌍", color: "#b45309", slug: "ap-world-history-modern", mc: 55, mcMinutes: 55,
    format: ["Fully digital in Bluebook.", "Section IA: 55 multiple-choice questions (40% of score).", "Section IB: 3 short-answer questions (20%).", "Section II: a document-based question (recommended 60 min including a 15-min reading period, 25%) and a long essay (40 min, 15%)."],
    tips: ["Know causes and effects across regions, not just dates.", "Use the 'HIPP' check on sources: Historical situation, Intended audience, Purpose, Point of view."],
    sections: [{ name: "1200–1750", topics: ["gh-enlightenment", "gh-ancient"] }, { name: "1750–present", topics: ["gh-industrial", "gh-wars", "gh-coldwar"] }] }),
  ap({ id: "ap-psych", name: "AP Psychology", emoji: "🧠", color: "#7c3aed", slug: "ap-psychology", mc: 75, mcMinutes: 90,
    format: ["Fully digital in Bluebook.", "Section I: 75 multiple-choice questions (67% of score).", "Section II: 2 free-response questions (33%): an Article Analysis Question and an Evidence-Based Question."],
    tips: ["Learn research methods well: they show up all over the exam.", "For free response, define the term and then apply it to the scenario."],
    sections: [{ name: "AP Psychology", topics: ["ap-psych"] }] }),
  ap({ id: "ap-lang", name: "AP English Language", emoji: "✒️", color: "#be185d", slug: "ap-english-language-and-composition", mc: 45, mcMinutes: 60,
    format: ["Fully digital in Bluebook.", "Section 1: 45 multiple-choice questions (45% of score): 23–25 reading questions on nonfiction and 20–22 writing questions about revising a text.", "Section 2: 3 essays (55%) in 2 hours 15 minutes, including a 15-minute reading period: synthesis, rhetorical analysis and argument."],
    tips: ["Rhetorical analysis: explain HOW the writer's choices work on the audience, not just WHAT they are.", "Plan every essay with a clear, defensible thesis."],
    sections: [{ name: "Reading", topics: ["ela-central-idea", "ela-structure", "ela-argument", "ela-figurative"] }, { name: "Writing", topics: ["ela-revising", "ela-sentences", "ela-writing"] }] }),
  ap({ id: "ap-hug", name: "AP Human Geography", emoji: "🗺️", color: "#0f766e", slug: "ap-human-geography", mc: 60, mcMinutes: 60,
    format: ["Fully digital in Bluebook.", "Section I: 60 multiple-choice questions (50% of score), some in sets.", "Section II: 3 free-response questions (50%), each built around a real geographic scenario."],
    tips: ["Always connect a concept to a real example and a scale (local, national, global).", "Practice reading population pyramids and maps."],
    sections: [{ name: "AP Human Geography", topics: ["ap-hug"] }] }),
  ap({ id: "ap-csp", name: "AP Computer Science Principles", emoji: "💻", color: "#4f46e5", slug: "ap-computer-science-principles", mc: 70, mcMinutes: 120,
    format: ["End-of-course exam: 70 multiple-choice questions in 120 minutes (70% of score), 4 answer options. 57 are single-select and 8 are 'select 2 answers'.", "Create performance task (30%): your program code, a video and a Personalized Project Reference, made in class (9 hours), plus 2 written-response questions on exam day (60 min)."],
    tips: ["Know the AP pseudocode: lists start at index 1 and loops use REPEAT and FOR EACH.", "Submit your Create task by the AP Digital Portfolio deadline."],
    sections: [{ name: "AP CSP", topics: ["ap-csp"] }] }),
];

// Extra practice topics the AP exams above point at.
moreTopics.push(
  t("ap-calc-practice", "math", "AP Calculus", "Definite Integrals", "Definite integrals with the power rule.", ["integral-def", "derivative"], [], [["Power rule for integrals", "∫ xⁿ dx = xⁿ⁺¹ ÷ (n + 1) + C. For a definite integral, plug in the top limit, then subtract the bottom."]]),
  t("ap-stats-practice", "math", "AP Statistics", "z-Scores & Standardizing", "z-scores and standardizing.", ["z-score", "mean-median"], [], [["z-score", "z = (value − mean) ÷ standard deviation: how many SDs a value is from the mean."]]),
);
