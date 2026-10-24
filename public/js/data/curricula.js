// Curriculum Finder data. Each curriculum lists courses → units → BrainBoro topic IDs,
// so a student can pick "what my class is on" and jump straight to matching practice.
// Unit names follow the publishers' public scope & sequence; schools often reorder or skip units.

export const curricula = [
  {
    id: "im", name: "Illustrative Mathematics (IM / IM 360)", subject: "math", publisher: "Illustrative Mathematics (also sold via Kendall Hunt, McGraw Hill, Imagine Learning)",
    where: "Very common in NYC public middle and high schools — it's the base for the NYC Solves math initiative — and in many districts nationwide.",
    courses: [
      { name: "Grade 6", units: [["Area and Surface Area", ["m6-geometry"]], ["Introducing Ratios", ["m6-ratios"]], ["Unit Rates and Percentages", ["m6-ratios", "m6-percents"]], ["Dividing Fractions", ["m6-fractions"]], ["Arithmetic in Base Ten", ["m6-fractions"]], ["Expressions and Equations", ["m6-expressions", "m6-equations"]], ["Rational Numbers", ["m6-integers"]], ["Data Sets and Distributions", ["m6-stats"]]] },
      { name: "Grade 7", units: [["Scale Drawings", ["m7-scale"]], ["Introducing Proportional Relationships", ["m7-proportional"]], ["Measuring Circles", ["m7-geometry"]], ["Proportional Relationships and Percentages", ["m7-percent-apps"]], ["Rational Number Arithmetic", ["m7-rational-ops"]], ["Expressions, Equations, and Inequalities", ["m7-equations"]], ["Angles, Triangles, and Prisms", ["m7-geometry"]], ["Probability and Sampling", ["m7-probability"]]] },
      { name: "Grade 8", units: [["Rigid Transformations and Congruence", ["m8-transformations"]], ["Dilations, Similarity, and Introducing Slope", ["m8-transformations", "m8-linear"]], ["Linear Relationships", ["m8-linear"]], ["Linear Equations and Linear Systems", ["a1-equations", "m8-systems"]], ["Functions and Volume", ["m8-functions", "m8-volume"]], ["Associations in Data", ["m8-scatter"]], ["Exponents and Scientific Notation", ["m8-exponents"]], ["Pythagorean Theorem and Irrational Numbers", ["m8-pythagorean", "m8-roots"]]] },
      { name: "Algebra 1", units: [["One-variable Statistics", ["m6-stats", "a1-stats"]], ["Linear Equations, Inequalities, and Systems", ["a1-equations", "m8-systems"]], ["Two-variable Statistics", ["a1-stats", "m8-scatter"]], ["Functions", ["a1-functions"]], ["Introduction to Exponential Functions", ["a1-exponential"]], ["Introduction to Quadratic Functions", ["a1-quadratics"]], ["Quadratic Equations", ["a1-quadratics", "a1-polynomials"]]] },
      { name: "Geometry", units: [["Constructions and Rigid Transformations", ["geo-constructions", "m8-transformations"]], ["Congruence", ["geo-congruence"]], ["Similarity", ["geo-similarity"]], ["Right Triangle Trigonometry", ["geo-trig"]], ["Solid Geometry", ["geo-solids"]], ["Coordinate Geometry", ["geo-coordinate"]], ["Circles", ["geo-circles"]], ["Conditional Probability", ["a2-stats"]]] },
      { name: "Algebra 2", units: [["Sequences and Functions", ["a1-sequences", "a2-series"]], ["Polynomials and Rational Functions", ["a2-polynomials", "a2-rational"]], ["Complex Numbers and Rational Exponents", ["a2-complex", "a2-rational"]], ["Exponential Functions and Equations", ["a2-exp-log"]], ["Transformations of Functions", ["a1-functions", "pc-functions"]], ["Trigonometric Functions", ["a2-trig"]], ["Statistical Inferences", ["a2-stats"]]] },
    ],
  },
  {
    id: "eureka", name: "Eureka Math / EngageNY", subject: "math", publisher: "Great Minds (originally written for New York State as EngageNY)",
    where: "Written for New York State, so it's still used in lots of NYC and NY schools. Eureka Math² is the newer edition.",
    courses: [
      { name: "Grade 6", units: [["Module 1: Ratios and Unit Rates", ["m6-ratios", "m6-percents"]], ["Module 2: Arithmetic Operations Including Division of Fractions", ["m6-fractions"]], ["Module 3: Rational Numbers", ["m6-integers"]], ["Module 4: Expressions and Equations", ["m6-expressions", "m6-equations"]], ["Module 5: Area, Surface Area, and Volume Problems", ["m6-geometry"]], ["Module 6: Statistics", ["m6-stats"]]] },
      { name: "Grade 7", units: [["Module 1: Ratios and Proportional Relationships", ["m7-proportional", "m7-scale"]], ["Module 2: Rational Numbers", ["m7-rational-ops"]], ["Module 3: Expressions and Equations", ["m7-equations"]], ["Module 4: Percent and Proportional Relationships", ["m7-percent-apps"]], ["Module 5: Statistics and Probability", ["m7-probability"]], ["Module 6: Geometry", ["m7-geometry"]]] },
      { name: "Grade 8", units: [["Module 1: Integer Exponents and Scientific Notation", ["m8-exponents"]], ["Module 2: The Concept of Congruence", ["m8-transformations"]], ["Module 3: Similarity", ["m8-transformations", "geo-similarity"]], ["Module 4: Linear Equations", ["a1-equations", "m8-linear", "m8-systems"]], ["Module 5: Examples of Functions from Geometry", ["m8-functions", "m8-volume"]], ["Module 6: Linear Functions", ["m8-linear", "m8-scatter"]], ["Module 7: Introduction to Irrational Numbers Using Geometry", ["m8-roots", "m8-pythagorean"]]] },
      { name: "Algebra I", units: [["Module 1: Relationships Between Quantities and Reasoning with Equations", ["a1-equations", "m8-systems"]], ["Module 2: Descriptive Statistics", ["a1-stats"]], ["Module 3: Linear and Exponential Functions", ["a1-functions", "a1-exponential", "a1-sequences"]], ["Module 4: Polynomial and Quadratic Expressions, Equations, and Functions", ["a1-polynomials", "a1-quadratics"]], ["Module 5: A Synthesis of Modeling with Equations and Functions", ["a1-functions"]]] },
      { name: "Geometry", units: [["Module 1: Congruence, Proof, and Constructions", ["geo-congruence", "geo-constructions", "m8-transformations"]], ["Module 2: Similarity, Proof, and Trigonometry", ["geo-similarity", "geo-trig"]], ["Module 3: Extending to Three Dimensions", ["geo-solids"]], ["Module 4: Connecting Algebra and Geometry Through Coordinates", ["geo-coordinate"]], ["Module 5: Circles With and Without Coordinates", ["geo-circles"]]] },
      { name: "Algebra II", units: [["Module 1: Polynomial, Rational, and Radical Relationships", ["a2-polynomials", "a2-rational", "a2-complex"]], ["Module 2: Trigonometric Functions", ["a2-trig"]], ["Module 3: Exponential and Logarithmic Functions", ["a2-exp-log", "a2-series"]], ["Module 4: Inferences and Conclusions from Data", ["a2-stats"]]] },
    ],
  },
  {
    id: "amplify-desmos", name: "Amplify Desmos Math", subject: "math", publisher: "Amplify",
    where: "Used in a growing number of NYC and national middle/high schools. Units are organized a lot like Illustrative Math.",
    courses: [
      { name: "Grade 6", units: [["Ratios, rates & percents", ["m6-ratios", "m6-percents"]], ["Fractions & decimals", ["m6-fractions"]], ["Expressions & equations", ["m6-expressions", "m6-equations"]], ["Rational numbers", ["m6-integers"]], ["Area, surface area & data", ["m6-geometry", "m6-stats"]]] },
      { name: "Grade 7", units: [["Proportional relationships & scale", ["m7-proportional", "m7-scale"]], ["Percents", ["m7-percent-apps"]], ["Rational number operations", ["m7-rational-ops"]], ["Equations & inequalities", ["m7-equations"]], ["Geometry & probability", ["m7-geometry", "m7-probability"]]] },
      { name: "Grade 8", units: [["Transformations", ["m8-transformations"]], ["Linear relationships & systems", ["m8-linear", "m8-systems"]], ["Functions & volume", ["m8-functions", "m8-volume"]], ["Exponents & roots", ["m8-exponents", "m8-roots"]], ["Pythagorean theorem & data", ["m8-pythagorean", "m8-scatter"]]] },
      { name: "Algebra 1", units: [["Equations, inequalities & systems", ["a1-equations", "m8-systems"]], ["Functions & statistics", ["a1-functions", "a1-stats"]], ["Exponential functions", ["a1-exponential"]], ["Quadratics", ["a1-polynomials", "a1-quadratics"]]] },
    ],
  },
  {
    id: "envision", name: "enVision Mathematics / enVision A|G|A", subject: "math", publisher: "Savvas (formerly Pearson)",
    where: "Common in charter schools, Catholic schools and districts in NJ, Long Island and Westchester.",
    courses: [
      { name: "Grade 6", units: [["Integers & rational numbers", ["m6-integers"]], ["Numeric & algebraic expressions", ["m6-expressions"]], ["Equations & inequalities", ["m6-equations"]], ["Ratios, rates & percent", ["m6-ratios", "m6-percents"]], ["Fractions & decimals", ["m6-fractions"]], ["Area, surface area & volume", ["m6-geometry"]], ["Statistics", ["m6-stats"]]] },
      { name: "Grade 7", units: [["Rational numbers", ["m7-rational-ops"]], ["Proportional relationships & percents", ["m7-proportional", "m7-percent-apps"]], ["Equations & inequalities", ["m7-equations"]], ["Probability & sampling", ["m7-probability"]], ["Geometry", ["m7-geometry", "m7-scale"]]] },
      { name: "Grade 8", units: [["Real numbers & exponents", ["m8-roots", "m8-exponents"]], ["Linear equations & functions", ["m8-linear", "m8-functions", "m8-systems"]], ["Transformations & Pythagorean theorem", ["m8-transformations", "m8-pythagorean"]], ["Volume & data", ["m8-volume", "m8-scatter"]]] },
      { name: "Algebra 1", units: [["Linear equations, functions & systems", ["a1-equations", "m8-systems"]], ["Exponential functions", ["a1-exponential"]], ["Polynomials, factoring & quadratics", ["a1-polynomials", "a1-quadratics"]], ["Statistics", ["a1-stats"]]] },
      { name: "Geometry", units: [["Transformations, congruence & proof", ["m8-transformations", "geo-congruence"]], ["Similarity & right triangles", ["geo-similarity", "geo-trig"]], ["Coordinate geometry, circles & solids", ["geo-coordinate", "geo-circles", "geo-solids"]]] },
      { name: "Algebra 2", units: [["Polynomials & rational functions", ["a2-polynomials", "a2-rational"]], ["Exponential & log functions", ["a2-exp-log"]], ["Trig functions", ["a2-trig"]], ["Statistics", ["a2-stats"]]] },
    ],
  },
  {
    id: "bigideas", name: "Big Ideas Math", subject: "math", publisher: "Big Ideas Learning / National Geographic Learning",
    where: "Common in suburban districts and private schools around NYC.",
    courses: [
      { name: "Grade 6–8 (Modeling Real Life)", units: [["Ratios & percents", ["m6-ratios", "m6-percents", "m7-percent-apps"]], ["Rational numbers", ["m6-integers", "m7-rational-ops"]], ["Expressions & equations", ["m6-expressions", "m7-equations"]], ["Geometry", ["m6-geometry", "m7-geometry", "m8-volume"]], ["Linear functions & systems", ["m8-linear", "m8-systems"]], ["Exponents & real numbers", ["m8-exponents", "m8-roots"]]] },
      { name: "Algebra 1", units: [["Linear equations & functions", ["a1-equations", "a1-functions", "m8-linear"]], ["Systems", ["m8-systems"]], ["Exponential functions & sequences", ["a1-exponential", "a1-sequences"]], ["Polynomials & quadratics", ["a1-polynomials", "a1-quadratics"]], ["Data analysis", ["a1-stats"]]] },
      { name: "Geometry", units: [["Transformations & congruence", ["m8-transformations", "geo-congruence"]], ["Similarity & trigonometry", ["geo-similarity", "geo-trig"]], ["Circles & solids", ["geo-circles", "geo-solids"]]] },
      { name: "Algebra 2", units: [["Polynomials, rational & radical functions", ["a2-polynomials", "a2-rational"]], ["Exponential & logarithmic", ["a2-exp-log"]], ["Trigonometry", ["a2-trig"]], ["Probability & statistics", ["a2-stats"]]] },
    ],
  },
  {
    id: "cpm", name: "CPM (College Preparatory Mathematics)", subject: "math", publisher: "CPM Educational Program",
    where: "Used in some NYC high schools and many California/East Coast districts. Lots of team problem-solving.",
    courses: [
      { name: "Core Connections Algebra", units: [["Functions & multiple representations", ["a1-functions"]], ["Linear equations & systems", ["a1-equations", "m8-linear", "m8-systems"]], ["Exponential functions", ["a1-exponential"]], ["Quadratics", ["a1-polynomials", "a1-quadratics"]], ["Statistics", ["a1-stats"]]] },
      { name: "Core Connections Geometry", units: [["Transformations & congruence", ["m8-transformations", "geo-congruence"]], ["Similarity & trig", ["geo-similarity", "geo-trig"]], ["Circles, solids & probability", ["geo-circles", "geo-solids", "a2-stats"]]] },
      { name: "Core Connections Algebra 2", units: [["Functions & transformations", ["pc-functions", "a1-functions"]], ["Polynomials & rational expressions", ["a2-polynomials", "a2-rational"]], ["Exponentials, logs & series", ["a2-exp-log", "a2-series"]], ["Trigonometry", ["a2-trig"]]] },
    ],
  },
  {
    id: "nycreads", name: "NYC Reads (ELA)", subject: "ela", publisher: "NYC Public Schools initiative using approved curricula (e.g., EL Education, Wit & Wisdom, Into Reading in K–5; approved programs in middle school)",
    where: "NYC public schools' citywide literacy initiative. Middle schools use a small set of approved, knowledge-building ELA programs — ask your teacher which one.",
    courses: [
      { name: "Grades 6–8 ELA", units: [["Reading closely & citing evidence", ["ela-inference", "ela-central-idea"]], ["Analyzing literature & theme", ["ela-theme", "ela-figurative"]], ["Informational text structure", ["ela-structure"]], ["Argument writing", ["ela-argument", "ela-writing"]], ["Grammar & conventions", ["ela-punctuation", "ela-sentences", "ela-agreement"]], ["Vocabulary", ["ela-vocab-context", "ela-roots"]]] },
    ],
  },
  {
    id: "amplify-ela", name: "Amplify ELA", subject: "ela", publisher: "Amplify",
    where: "Widely used in middle schools (grades 6–8) in NYC and nationally.",
    courses: [
      { name: "Grades 6–8", units: [["Close reading of fiction", ["ela-theme", "ela-inference", "ela-figurative"]], ["Nonfiction & argument", ["ela-central-idea", "ela-structure", "ela-argument"]], ["Poetry", ["ela-poetry"]], ["Writing", ["ela-writing"]], ["Vocabulary & grammar", ["ela-vocab-context", "ela-punctuation", "ela-agreement"]]] },
    ],
  },
  {
    id: "hs-ela", name: "High School ELA (StudySync, Into Literature, myPerspectives, SpringBoard, Odell)", subject: "ela", publisher: "Various (McGraw Hill, HMH, Savvas, College Board, Odell Education)",
    where: "Common high school ELA programs in NYC and beyond. All build toward the ELA Regents and SAT skills.",
    courses: [
      { name: "Grades 9–12", units: [["Literary analysis", ["ela-theme", "ela-figurative", "ela-poetry"]], ["Informational & argument texts", ["ela-central-idea", "ela-structure", "ela-argument"]], ["Regents essays", ["ela-writing"]], ["Vocabulary", ["ela-sat-words", "ela-roots"]], ["Grammar for the SAT", ["ela-punctuation", "ela-revising"]]] },
    ],
  },
  {
    id: "amplify-science", name: "Amplify Science / OpenSciEd", subject: "science", publisher: "Amplify; OpenSciEd (free, open-source)",
    where: "Amplify Science is used across many NYC public middle schools; OpenSciEd is used by many districts. High schools follow NYS science Regents courses.",
    courses: [
      { name: "Middle school (6–8)", units: [["Earth systems & weather", ["es-weather", "es-rocks"]], ["Plate tectonics", ["es-tectonics"]], ["Space", ["es-astronomy"]], ["Cells & body systems", ["bio-cells", "bio-homeostasis"]], ["Ecosystems & evolution", ["bio-ecology", "bio-evolution"]], ["Forces, energy & waves", ["phys-forces", "phys-energy", "phys-waves"]], ["Chemical reactions", ["chem-atoms", "chem-reactions"]]] },
      { name: "High school Regents science", units: [["Life Science: Biology", ["bio-cells", "bio-transport", "bio-biochem", "bio-genetics", "bio-evolution", "bio-ecology", "bio-homeostasis"]], ["Earth & Space Sciences", ["es-rocks", "es-tectonics", "es-weather", "es-astronomy"]], ["Chemistry", ["chem-atoms", "chem-bonding", "chem-moles", "chem-reactions"]], ["Physics", ["phys-motion", "phys-forces", "phys-energy", "phys-waves"]]] },
    ],
  },
  {
    id: "passport", name: "Passport to Social Studies / NYS Social Studies Framework", subject: "history", publisher: "NYC Public Schools; NYSED",
    where: "NYC's K–8 social studies scope & sequence and the NYS high school framework behind the Global and U.S. History Regents.",
    courses: [
      { name: "Grades 7–8 (U.S. & NY History)", units: [["Founding & Constitution", ["us-constitution"]], ["Civil War & Reconstruction", ["us-civilwar"]], ["Industrialization & immigration", ["us-industrial"]], ["20th century America", ["us-depression", "us-civilrights"]]] },
      { name: "Grade 9 Global History I", units: [["Early civilizations & belief systems", ["gh-ancient"]]] },
      { name: "Grade 10 Global History II", units: [["Enlightenment & revolutions", ["gh-enlightenment"]], ["Industrialization & imperialism", ["gh-industrial"]], ["World wars & genocide", ["gh-wars"]], ["Cold War to today", ["gh-coldwar"]]] },
      { name: "Grade 11 U.S. History & Gov't", units: [["Constitution & government", ["us-constitution", "us-courtcases"]], ["Civil War through Progressivism", ["us-civilwar", "us-industrial"]], ["Depression, WWII & Cold War", ["us-depression", "gh-wars", "us-coldwar"]], ["Civil rights", ["us-civilrights"]]] },
    ],
  },
];

// Quick "where do I start?" guidance by school type.
export const schoolTypes = [
  { id: "nyc-public", name: "NYC public school", tip: "Most NYC public middle & high schools use Illustrative Math–based curricula (NYC Solves), Eureka Math, or Amplify Desmos Math for math, and an NYC Reads–approved program for middle school ELA. High school courses build toward the Regents.", picks: ["im", "eureka", "amplify-desmos", "nycreads", "amplify-science", "passport"] },
  { id: "catholic", name: "Catholic / private school", tip: "Catholic and private schools pick their own textbooks — enVision, Big Ideas and Sadlier are common. 8th graders usually take the TACHS. Many still take Regents exams.", picks: ["envision", "bigideas", "hs-ela"] },
  { id: "charter", name: "Charter school", tip: "Charter networks often use Eureka Math, Illustrative Math, enVision, or their own curriculum. Check your class syllabus or textbook cover.", picks: ["eureka", "im", "envision", "amplify-ela"] },
  { id: "outside", name: "Outside NYC", tip: "NY State schools follow the same Regents courses. Outside NY, look for your textbook name below or browse by grade — the math and ELA skills are the same everywhere.", picks: ["bigideas", "envision", "cpm", "im", "hs-ela"] },
];
