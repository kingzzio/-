// High school entrance & scholarship exams beyond SHSAT/TACHS: HSPT, ISEE, SSAT and the Hunter College HS exam,
// plus the New York schools that run scholarship exams. Facts were checked on the official sites in November 2026
// (source links below). Dates change every year: always confirm with the school.

const t = (id, subject, unit, name, desc, gen, qs = [], cards = []) => ({ id, subject, course: "Entrance Exams", grades: [6, 7, 8], unit, name, desc, gen, tags: ["entrance"], qs, cards });

export const entranceTopics = [
  t("ent-synonyms", "ela", "Verbal", "Synonyms", "Pick the word closest in meaning. On the HSPT, ISEE and SSAT vocabulary is the fastest way to gain points.", ["synonym"], [], [
    ["Synonym strategy", "Define the word in your own words first, then find the choice that matches your definition."],
    ["Don't know the word?", "Think of where you've heard it ('a candid photo', 'a frugal shopper'). Context often reveals the meaning."],
    ["Word roots", "bene = good (benevolent), mal = bad (malicious), chron = time, spect = look (scrutinize, inspect)."],
  ]),
  t("ent-antonyms", "ela", "Verbal", "Antonyms", "Pick the word with the opposite meaning. Watch out for synonyms planted as traps.", ["antonym"], [], [
    ["Antonym trap", "Test-makers put a synonym among the choices. Circle the word OPPOSITE before you answer."],
  ]),
  t("ent-analogies", "ela", "Verbal", "Verbal Analogies", "\"A is to B as C is to ___.\" Find the relationship, then match it.", ["analogy"], [
    ["Youth is to young as age is to…", ["people", "parents", "grandmother", "old"], 3, "A noun and the adjective that describes it: youth → young, age → old."],
    ["Author is to novel as composer is to…", ["piano", "symphony", "concert", "melody note"], 1, "A creator and what they create."],
    ["Thermometer is to temperature as scale is to…", ["fish", "weight", "kitchen", "number"], 1, "An instrument and what it measures."],
  ], [
    ["Bridge sentence", "Link the first pair in a sentence: 'A pup is a baby dog.' Then try it on every choice: 'A ___ is a baby ___.'"],
    ["Common relationships", "Tool : user, young : adult, part : whole, item : category, mild : extreme, cause : effect, worker : workplace."],
    ["Order matters", "If the first pair is part : whole, the answer must be part : whole too, not whole : part."],
  ]),
  t("ent-classification", "ela", "Verbal", "Verbal Classification (Odd One Out)", "Three words share a category; find the one that doesn't fit.", ["odd-word"], [], [
    ["Name the group", "Say what three words have in common out loud. The leftover word is your answer."],
  ]),
  t("ent-verbal-logic", "ela", "Verbal", "Verbal Logic", "\"If the first two statements are true, the third is true, false, or uncertain.\"", ["verbal-logic"], [], [
    ["Draw it", "Put the names on a line, tallest to shortest. If the third statement isn't forced by the line, it's uncertain."],
    ["True vs. uncertain", "TRUE: it must happen. FALSE: it can't happen. UNCERTAIN: it might, but you can't be sure."],
  ]),
  t("ent-sentence-completion", "ela", "Verbal", "Sentence Completion", "Pick the word that best fits the clue in the sentence (ISEE and SSAT style).", ["sentence-completion"], [], [
    ["Find the clue", "Look for words like 'because', 'but', 'although'. They tell you if the blank agrees with or contrasts the clue."],
    ["Predict first", "Fill the blank with your own word before looking at the choices."],
  ]),
  t("ent-series", "math", "Quantitative", "Number Series", "Find the pattern and the next number. HSPT Quantitative has lots of these.", ["hspt-series", "sequences"], [
    ["Look at this series: 1, 2, 4, 5, 10, 11, … What number should come next?", ["22", "12", "15", "21"], 0, "The pattern is +1, ×2, +1, ×2…, so 11 × 2 = 22."],
  ], [
    ["Series checklist", "1) Differences. 2) Ratios (×2, ×3). 3) Alternating rules (+3, ×2). 4) Two series taking turns. 5) Squares/cubes."],
    ["Write the gaps", "Jot the difference between each pair of numbers above the series. The pattern usually jumps out."],
  ]),
  t("ent-comparisons", "math", "Quantitative", "Geometric & Non-Geometric Comparisons", "Work out (a), (b) and (c), then pick the true statement.", ["hspt-compare", "geo-compare"], [], [
    ["Compute, then compare", "Write the value under each of (a), (b), (c) before reading the answer choices."],
    ["Area formulas", "Square s², rectangle l×w, triangle ½×b×h, circle πr²."],
  ]),
  t("ent-number-manip", "math", "Quantitative", "Number Manipulation", "Short, tricky arithmetic sentences like \"What number is 5 more than 2/3 of 18?\"", ["number-manip"], [], [
    ["Work backwards", "For 'Half of what number is…', find the result first, then double it."],
    ["Translate", "'of' means ×, 'more than' means +, 'less than' means − (in reverse order: 5 less than x = x − 5)."],
  ]),
  t("ent-quant-compare", "math", "Quantitative", "Quantitative Comparison (Column A vs. B)", "ISEE-style: is Column A bigger, Column B bigger, are they equal, or can't you tell?", ["isee-qc"], [], [
    ["Try special numbers", "When a variable is involved, test 0, 1, a fraction, and a negative. If the answer changes, it cannot be determined."],
    ["Don't over-calculate", "You only need to know which is bigger, not the exact value."],
  ]),
  t("ent-reading", "ela", "Reading", "Short-Passage Reading", "Main idea, details, inference and vocabulary in context, with original practice passages.", [], [
    ["Read the passage.\n\"For years, the empty lot on Fulton Street collected only trash. Then a group of neighbors cleared the glass, hauled in soil, and planted tomatoes, peppers and sunflowers. Within two summers the lot fed dozens of families, and the block association started holding meetings among the raised beds.\"\nThe passage is mainly about…", ["how to grow tomatoes", "how neighbors turned an empty lot into a useful garden", "why trash is a problem in cities", "the history of Fulton Street"], 1, "Every sentence tracks the lot's change from trash to a garden that feeds families. That's the main idea."],
    ["Read the passage.\n\"For years, the empty lot on Fulton Street collected only trash. Then a group of neighbors cleared the glass, hauled in soil, and planted tomatoes, peppers and sunflowers. Within two summers the lot fed dozens of families, and the block association started holding meetings among the raised beds.\"\nYou can infer that the garden…", ["was paid for by the city", "became a gathering place for the community", "failed after two summers", "only grew flowers"], 1, "Meetings held among the beds show it became a place where neighbors gather."],
    ["Read the passage.\n\"Octopuses can change color in less than a second. Special skin cells called chromatophores stretch or shrink to show different pigments. Scientists once thought this was only for hiding, but octopuses also flash colors when they are startled or when they hunt.\"\nAccording to the passage, chromatophores are…", ["a kind of octopus", "skin cells that help change color", "colors octopuses cannot see", "a scientist's tool"], 1, "The passage defines them directly: 'special skin cells called chromatophores'."],
    ["Read the passage.\n\"Octopuses can change color in less than a second. Special skin cells called chromatophores stretch or shrink to show different pigments. Scientists once thought this was only for hiding, but octopuses also flash colors when they are startled or when they hunt.\"\nThe word \"startled\" most nearly means…", ["bored", "suddenly frightened", "very hungry", "asleep"], 1, "Startled = suddenly surprised or scared. The flash of color is a reaction."],
    ["Read the passage.\n\"Maya had practiced the piano piece every night for a month. On recital day her hands shook as she walked onstage, but when the first notes rang out clear and steady, she let out a breath she hadn't known she was holding.\"\nHow does Maya most likely feel at the end?", ["angry", "relieved", "confused", "bored"], 1, "Letting out a held breath after the notes come out steady shows relief."],
    ["Read the passage.\n\"The Erie Canal opened in 1825 and connected the Hudson River to the Great Lakes. Shipping costs dropped by about 90 percent, and New York City quickly became the busiest port in the country.\"\nThe author's main purpose is to…", ["persuade readers to visit the canal", "explain the canal's effect on New York", "describe how canals are built", "tell a story about a sailor"], 1, "The passage gives facts about what the canal caused: an informative purpose."],
    ["Read the passage.\n\"The Erie Canal opened in 1825 and connected the Hudson River to the Great Lakes. Shipping costs dropped by about 90 percent, and New York City quickly became the busiest port in the country.\"\nWhich conclusion is best supported?", ["The canal was a failure.", "Cheaper shipping helped New York City's trade grow.", "The Great Lakes are in New York City.", "Canals are no longer used anywhere."], 1, "Costs fell and NYC became the busiest port: cheaper shipping boosted trade."],
    ["Read the passage.\n\"Some people think homework should be banned. Yet a short nightly review helps the brain move facts into long-term memory. The key is balance: twenty focused minutes beats two distracted hours.\"\nThe author would most likely agree that…", ["homework should be banned", "short, focused practice is valuable", "students should study for hours", "memory cannot be improved"], 1, "The author argues for 'balance' and praises twenty focused minutes."],
    ["Read the passage.\n\"Some people think homework should be banned. Yet a short nightly review helps the brain move facts into long-term memory. The key is balance: twenty focused minutes beats two distracted hours.\"\nThe word \"Yet\" signals that the author is about to…", ["agree with the first sentence", "introduce a contrasting point", "tell a joke", "give a definition"], 1, "'Yet' is a contrast word: it pushes back on the idea that homework should be banned."],
  ], [
    ["Main idea", "Ask: what is EVERY sentence about? Details support the main idea; the main idea covers them all."],
    ["Inference", "The answer isn't stated, but it must be strongly supported. Avoid choices that go too far."],
    ["Vocabulary in context", "Replace the word with each choice and reread the sentence. The one that keeps the meaning wins."],
  ]),
  t("ent-language", "ela", "Language", "Language Skills (HSPT style)", "Find the sentence with an error in capitalization, punctuation or usage, plus spelling and composition.", ["spelling"], [
    ["Look for errors in capitalization, punctuation, or usage. Which sentence has a mistake?", ["Are you coming to my birthday party?", "The first snow fell on Sunday October 27.", "Jack's father drove us to the movies.", "No mistakes"], 1, "A comma is needed between the day and the date: Sunday, October 27."],
    ["Which sentence has an error?", ["My sister and I walked to school.", "Me and my sister walked to school.", "She gave the book to my sister and me.", "No mistakes"], 1, "Use 'I' as a subject: 'My sister and I walked…'"],
    ["Which sentence has an error?", ["Each of the students has a locker.", "The team is practicing tonight.", "Neither of the answers are correct.", "No mistakes"], 2, "'Neither' is singular: 'Neither of the answers is correct.'"],
    ["Which sentence has an error?", ["We visited the Bronx Zoo last summer.", "My favorite subject is Science.", "Grandma moved to Florida in May.", "No mistakes"], 1, "School subjects aren't capitalized unless they're languages: 'science'."],
    ["Which sentence has an error?", ["The dog wagged its tail.", "Its going to rain later.", "Their house is on the corner.", "No mistakes"], 1, "It's = it is. 'It's going to rain later.'"],
    ["Which sentence has an error?", ["I could of finished earlier.", "She should have called first.", "They would have won with more time.", "No mistakes"], 0, "'Could of' is never correct: 'could have'."],
    ["Which sentence has an error?", ["The girls' team won the trophy.", "The childrens' toys were everywhere.", "James's bike is new.", "No mistakes"], 1, "'Children' is already plural, so the possessive is 'children's'."],
    ["Which sentence has an error?", ["After the game, we went home.", "Running down the hall, my backpack fell open.", "While I was running down the hall, my backpack fell open.", "No mistakes"], 1, "Dangling modifier: the backpack wasn't running. Fix: 'While I was running…'"],
    ["Which sentence has an error?", ["She runs faster than him.", "She runs faster than he does.", "He is taller than I am.", "No mistakes"], 0, "Finish the comparison: 'faster than he (does)', so use 'he', not 'him'."],
    ["Which sentence has an error?", ["Mr. Lopez teaches math.", "We read \"The Raven\" in class.", "The meeting is on tuesday.", "No mistakes"], 2, "Days of the week are capitalized: Tuesday."],
    ["Composition: Which sentence would best begin a paragraph about why recycling matters?", ["Recycling bins are blue.", "Recycling saves energy, protects habitats and keeps landfills from overflowing.", "My uncle once found a lamp in the trash.", "Some people forget to recycle."], 1, "A topic sentence states the main point the paragraph will support."],
    ["Composition: Which word best connects these ideas? \"The storm knocked out the power. ___, we ate dinner by candlelight.\"", ["However", "As a result", "For example", "In contrast"], 1, "The second sentence is an effect of the first: 'As a result'."],
    ["Composition: Which sentence does NOT belong in a paragraph about how bees help farms?", ["Bees carry pollen from flower to flower.", "Many crops need pollination to grow fruit.", "Some people are allergic to bee stings.", "Farmers sometimes rent hives during blooming season."], 2, "Allergies are off-topic. The paragraph is about bees helping farms."],
  ], [
    ["No-mistake option", "'No mistakes' is the answer more often than you'd think. Don't invent an error that isn't there."],
    ["Top errors to scan for", "Missing commas in dates/lists, its/it's, their/there/they're, subject–verb agreement, capitalized subjects/seasons."],
  ]),
];

const HSPT_SCHOOL_NOTE = "Schools set their own dates and fees every year. Confirm on the school's site.";

export const scholarshipSchools = [
  { name: "Regis High School", area: "Manhattan", exam: "hspt", what: "Uses the HSPT as its Scholarship Exam. Applying online registers you automatically. About 3 hours.", date: "2026-11-14", note: "Bronx, Manhattan & Queens students test at 8:30 AM; others at 12:30 PM.", url: "https://regis.org/admissions/entrance-exam" },
  { name: "Cardinal Spellman High School", area: "Bronx", exam: "hspt", what: "Scholarship exam (HSPT-style sections) for 8th graders who list Spellman on their TACHS. $25. Bring a pen, pencil and calculator.", date: "2026-11-14", note: "9:00 AM. Registration deadline Nov 9.", url: "https://www.cardinalspellman.org/apps/news/show_news.jsp?REC_ID=977264&id=0" },
  { name: "Fordham Preparatory School", area: "Bronx", exam: "hspt", what: "The HSPT is the only exam for Fordham Prep's Merit Scholarship Program. $40 registration fee after you apply.", date: "2026-11-21", note: "Extended time needs IEP/504 paperwork by the registration deadline.", url: "https://www.fordhamprep.org/admissions/scholarships-awards" },
  { name: "Loyola School", area: "Manhattan", exam: "hspt", what: "Hosts the HSPT twice. Loyola accepts the ISEE, SSAT or HSPT for admission. Early Decision applicants must take the first date.", date: "2026-11-21", date2: "2026-12-12", url: "https://www.loyolanyc.org/admissions" },
  { name: "Xavier High School", area: "Manhattan", exam: "hspt", what: "Optional HSPT for merit scholarship consideration, suggested for students with 90+ averages.", note: "Priority application deadline for the in-person HSPT was Nov 9.", url: "https://www.xavierhs.org/admissions/faqs" },
  { name: "Dominican Academy", area: "Manhattan", exam: "hspt", what: "Accepts TACHS, HSPT or ISEE scores and strongly considers students around the 85th percentile or higher in all sections.", url: "https://www.dominicanacademy.org/admissions" },
  { name: "Preston High School", area: "Bronx", exam: "own", what: "Preston Scholarship Exam. List Preston as your 1st or 2nd TACHS choice. TACHS percentile also counts.", date: "2026-12-12", note: "Sign up by Dec 4.", url: "https://www.prestonhs.org/admissions/scholarships-grants.cfm" },
  { name: "Archbishop Stepinac High School", area: "Westchester", exam: "own", what: "Scholarship exam for students with a 90%+ average (principal signs the form). $35. Bring #2 pencils and a calculator. About 1–2 hours.", date: "2026-12-03", note: "4 PM. Form due Dec 1.", url: "https://www.stepinac.org/admissions/scholarships-tuition-assitance" },
  { name: "The Ursuline School", area: "Westchester", exam: "own", what: "Ursuline Scholarship Exam for Merici Academic Scholarships. Register in the Admissions Portal.", date: "2026-11-21", date2: "2026-12-05", note: "8:15 AM both dates.", url: "https://www.ursulinenewrochelle.org/admissions/affordability" },
  { name: "St. John's Preparatory School", area: "Queens", exam: "own", what: "Runs a Scholarship Exam each fall (registration form on the school site).", url: "https://www.stjohnsprepschool.org" },
  { name: "Holy Cross High School", area: "Queens", exam: "tachs", what: "Scholarships are based on the diocesan entrance exam (TACHS) and grades. You must list Holy Cross first.", url: "https://holycrosshs.org/admissions/apply/scholarships" },
  { name: "Hunter College High School", area: "Manhattan", exam: "hunter", what: "Entrance exam for 7th-grade entry only (taken in 6th grade). You must meet the qualifying scores to sit for it.", date: "2027-01-27", url: "https://www.hunterschools.org/high-school/admissions" },
].map((s) => ({ ...s, note: s.note || HSPT_SCHOOL_NOTE }));

const verbal = ["ent-synonyms", "ent-antonyms", "ent-analogies", "ent-classification", "ent-verbal-logic"];
const mathCore = ["m6-ratios", "m6-percents", "m7-percent-apps", "m7-rational-ops", "m7-equations", "m7-geometry", "m7-probability", "m8-exponents", "m8-roots", "m8-linear", "m8-pythagorean", "m6-stats", "m-word-problems", "m-number-theory"];
const readingCore = ["ent-reading", "ela-central-idea", "ela-inference", "ela-vocab-context", "ela-structure"];

export const entranceExams = [
  {
    id: "hspt", name: "HSPT", full: "High School Placement Test (Catholic & scholarship exams)", emoji: "🎓", color: "#0ea5e9",
    who: "8th graders taking a Catholic high school scholarship or entrance exam. In NY, Regis, Fordham Prep, Loyola and Xavier use the HSPT.",
    format: [
      "298 multiple-choice questions in five timed sections, about 2½ hours (Regis says about 3 hours with breaks and instructions).",
      "Verbal Skills: 60 questions in 16–18 minutes. Synonyms, antonyms, analogies, classification and verbal logic.",
      "Quantitative Skills: 52 questions in 30 minutes. Number series, number manipulation, geometric and non-geometric comparisons.",
      "Reading: 62 questions in 25 minutes. Main idea, details, inference and vocabulary in context.",
      "Mathematics: 64 questions in 45 minutes. Arithmetic, pre-algebra, geometry, measurement and data.",
      "Language: 60 questions in 25 minutes. Capitalization, punctuation, usage, spelling and composition.",
      "Some schools add an optional 40-question science, mechanical aptitude or religion test. Many don't use it.",
      "Calculator rules depend on the school: Spellman and Stepinac tell students to bring one.",
    ],
    schools: ["Regis High School (Manhattan)", "Fordham Preparatory School (Bronx)", "Loyola School (Manhattan)", "Xavier High School (Manhattan)", "Cardinal Spellman HS scholarship exam (Bronx)", "Dominican Academy accepts HSPT scores (Manhattan)", "See all scholarship exams → Scholarship Hunt"],
    tips: [
      "There's NO guessing penalty. Never leave a bubble blank, even if time runs out.",
      "Verbal is a sprint: about 16 seconds per question. Don't get stuck. Skip, guess, move.",
      "Number series: check differences, then ratios, then alternating (+1, ×2) patterns.",
      "For comparisons, write the value of (a), (b), (c) first, then read the choices.",
      "Language: 'No mistakes' is a real answer. Don't invent an error.",
      "Vocabulary is the highest-return thing to study. Do a few BrainBoro synonym rounds every day.",
    ],
    official: { label: "Regis HS – HSPT section breakdown", url: "https://regis.org/admissions/entrance-exam" },
    sections: [
      { name: "Verbal Skills", topics: verbal },
      { name: "Quantitative Skills", topics: ["ent-series", "ent-comparisons", "ent-number-manip"] },
      { name: "Reading", topics: readingCore },
      { name: "Mathematics", topics: mathCore },
      { name: "Language", topics: ["ent-language", "ela-punctuation", "ela-agreement", "ela-sentences"] },
    ],
    fullTest: [
      { name: "Verbal Skills", questions: 60, minutes: 16 },
      { name: "Quantitative Skills", questions: 52, minutes: 30 },
      { name: "Reading", questions: 62, minutes: 25 },
      { name: "Mathematics", questions: 64, minutes: 45 },
      { name: "Language", questions: 60, minutes: 25 },
    ],
    scoring: { penalty: 0 },
    mock: { questions: 50, minutes: 25 },
  },
  {
    id: "isee", name: "ISEE", full: "Independent School Entrance Exam (Middle & Upper Level)", emoji: "🏛️", color: "#14b8a6",
    who: "Students applying to independent (private) schools. Upper Level is for grades 9–12, Middle Level for grades 7–8. Some Catholic schools (e.g. Dominican Academy, Loyola, Ursuline) also accept it.",
    format: [
      "Middle & Upper Level: 2 hours 40 minutes plus two breaks. Same structure for both levels.",
      "Verbal Reasoning: 40 questions in 20 minutes (synonyms and sentence completion).",
      "Quantitative Reasoning: 37 questions in 35 minutes (word problems and quantitative comparisons).",
      "Reading Comprehension: 36 questions in 35 minutes.",
      "Mathematics Achievement: 47 questions in 40 minutes.",
      "Essay: 1 prompt, 30 minutes. Not scored, but sent to schools.",
      "No penalty for wrong answers. Available online or on paper.",
    ],
    tips: [
      "No guessing penalty: answer everything.",
      "Quantitative comparison: if a variable is involved, test 0, 1, a fraction and a negative before choosing.",
      "Verbal Reasoning is 30 seconds per question. Vocabulary practice pays off most.",
      "Practice a 30-minute essay with Essay Coach. Schools read it even though it isn't scored.",
    ],
    official: { label: "ISEE – levels, sections & timing", url: "https://www.admission.org/assessments/isee/about" },
    sections: [
      { name: "Verbal Reasoning", topics: ["ent-synonyms", "ent-sentence-completion"] },
      { name: "Quantitative Reasoning", topics: ["ent-quant-compare", "m-word-problems", "m7-equations", "m6-stats"] },
      { name: "Reading Comprehension", topics: readingCore },
      { name: "Mathematics Achievement", topics: mathCore },
    ],
    fullTest: [
      { name: "Verbal Reasoning", questions: 40, minutes: 20 },
      { name: "Quantitative Reasoning", questions: 37, minutes: 35 },
      { name: "Reading Comprehension", questions: 36, minutes: 35 },
      { name: "Mathematics Achievement", questions: 47, minutes: 40 },
    ],
    scoring: { penalty: 0 },
    mock: { questions: 40, minutes: 30 },
  },
  {
    id: "ssat", name: "SSAT", full: "Secondary School Admission Test (Upper Level)", emoji: "🏫", color: "#6366f1",
    who: "Students applying to private boarding and day schools. Upper Level is for current 8th–11th graders.",
    format: [
      "About 3 hours 10 minutes with two 10-minute breaks.",
      "Quantitative (Math): 50 questions in two 30-minute sections (25 each). No calculator.",
      "Reading: 40 questions in 40 minutes, passages of 250–350 words.",
      "Verbal: 60 questions: 30 synonyms and 30 analogies.",
      "Writing Sample: 25 minutes, not scored but sent to schools. Plus an unscored experimental section.",
      "Middle & Upper Level scoring: +1 for a right answer, −¼ for a wrong answer, 0 for a blank.",
    ],
    tips: [
      "There IS a guessing penalty: only guess if you can eliminate at least one or two choices.",
      "Do the easy questions first in each section, then return to the hard ones.",
      "Analogies are half the Verbal section. Master the common relationships.",
      "No calculator: practice fractions, percents and long division by hand.",
    ],
    official: { label: "SSAT – what's on the Upper Level", url: "https://www.admission.org/help/whats-on-the-upper-level-ssat" },
    sections: [
      { name: "Quantitative", topics: mathCore },
      { name: "Reading", topics: readingCore },
      { name: "Verbal", topics: ["ent-synonyms", "ent-analogies"] },
    ],
    fullTest: [
      { name: "Quantitative 1", questions: 25, minutes: 30, from: 0 },
      { name: "Reading", questions: 40, minutes: 40, from: 1 },
      { name: "Verbal", questions: 60, minutes: 30, from: 2 },
      { name: "Quantitative 2", questions: 25, minutes: 30, from: 0 },
    ],
    scoring: { penalty: 0.25 },
    mock: { questions: 40, minutes: 30 },
  },
  {
    id: "hunter", name: "Hunter", full: "Hunter College High School Entrance Exam", emoji: "🦅", color: "#9333ea",
    who: "6th graders applying for 7th-grade entry (the only entry year). You must meet the qualifying scores to be eligible.",
    format: [
      "Three hours. You can do the sections in any order.",
      "Reading Comprehension: 50 multiple-choice questions on five or six passages from different time periods and styles.",
      "Mathematics: 30 multiple-choice questions. No calculator.",
      "Writing: an essay or creative piece of up to two pages, judged on originality, effectiveness and detail.",
      "Each question has five choices (A–E). There are no make-up dates.",
      "Students who pass the multiple-choice threshold move on to the essay-reading round. Scores are not released.",
    ],
    tips: [
      "Hunter's sample exams are free on its admissions page. Do both under real timing.",
      "Reading is 50 of the 80 multiple-choice questions, so practice older and modern passages.",
      "Plan your essay with Essay Coach; creativity and detail are what the readers score.",
      "No calculator: drill mental math and fractions until they're automatic.",
    ],
    official: { label: "Hunter College HS – Entrance Exam", url: "https://www.hunterschools.org/high-school/admissions/entrance-exam-2027" },
    sections: [
      { name: "Reading Comprehension", topics: [...readingCore, "ela-theme", "ela-figurative", "ela-poetry"] },
      { name: "Mathematics", topics: ["m6-ratios", "m6-percents", "m6-fractions", "m7-rational-ops", "m7-equations", "m7-geometry", "m7-probability", "m-word-problems", "m-number-theory", "ent-series"] },
    ],
    fullTest: [
      { name: "Reading Comprehension", questions: 50, minutes: 75 },
      { name: "Mathematics", questions: 30, minutes: 60 },
    ],
    scoring: { penalty: 0 },
    mock: { questions: 30, minutes: 30 },
  },
];
