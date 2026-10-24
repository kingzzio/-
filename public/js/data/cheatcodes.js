// Cheat Codes: animated, whiteboard-style shortcut walkthroughs.
// In `show`, {a|b} draws a fraction and [[x]] circles/highlights x. `say` is the caption (and voiceover).
// The first few are free; the rest are Premium.

export const FREE_CHEATS = 3;

export const cheatcodes = [
  {
    id: "percent-of-percent", trick: "Percent of a percent", exams: ["shsat", "sat", "tachs"], topic: "m6-percents",
    q: "What's 3% of 4%?", choices: ["0.12%", "1.2%", "7%", "12%"], a: 0,
    steps: [
      { show: "3% [[of]] 4%", say: "First thing: 'of' here means multiply." },
      { show: "(3%)(4%) ≠ 12%", say: "Most people just do 3 times 4 and pick 12%. That's the trap." },
      { show: "3% = {3|100}     4% = {4|100}", say: "Turn both percents into fractions over 100." },
      { show: "{3|100} × {4|100} = {12|10000}", say: "Multiply: 3 times 4 is 12, and 100 times 100 is 10,000." },
      { show: "{12|10000} = 0.0012", say: "Divide by 10,000: move the decimal four places left." },
      { show: "0.0012 → [[0.12%]]", say: "Answers are in percents, so slide two places right. Boom: 0.12%." },
    ],
  },
  {
    id: "percent-swap", trick: "Percent swap", exams: ["shsat", "tachs", "sat"], topic: "m6-percents",
    q: "What is 8% of 50?", choices: ["4", "0.4", "40", "6.25"], a: 0,
    steps: [
      { show: "8% of 50", say: "8% of 50 looks annoying without a calculator." },
      { show: "x% of y = y% of x", say: "Secret: you can SWAP the numbers. It's the same answer." },
      { show: "[[50%]] of 8", say: "So 8% of 50 is the same as 50% of 8." },
      { show: "half of 8 = [[4]]", say: "And 50% is just half. The answer is 4." },
    ],
  },
  {
    id: "times-eleven", trick: "×11 in your head", exams: ["shsat", "tachs"], topic: "m-number-theory",
    q: "What is 43 × 11?", choices: ["473", "443", "4,330", "463"], a: 0,
    steps: [
      { show: "43 × 11", say: "Multiplying a two-digit number by 11? There's a cheat." },
      { show: "4 _ 3", say: "Split the digits apart and leave a gap in the middle." },
      { show: "4 + 3 = 7", say: "Add the two digits together." },
      { show: "4 [[7]] 3", say: "Drop the sum in the gap. 43 times 11 is 473." },
      { show: "If the sum ≥ 10, carry the 1", say: "Like 78 × 11: 7, 15, 8 becomes 858." },
    ],
  },
  {
    id: "square-ending-5", trick: "Squares ending in 5", exams: ["shsat", "tachs"], topic: "m8-exponents",
    q: "What is 65²?", choices: ["4,225", "3,625", "4,265", "4,025"], a: 0,
    steps: [
      { show: "65²", say: "Any number ending in 5 squared has a shortcut." },
      { show: "6 × [[7]] = 42", say: "Take the first digit, times the next number up. 6 times 7 is 42." },
      { show: "42 | [[25]]", say: "Then just stick 25 on the end." },
      { show: "65² = 4,225", say: "That's it. Works for 15², 25², 35², all of them." },
    ],
  },
  {
    id: "plug-in-answers", trick: "Plug in the answers", exams: ["shsat", "sat", "regents-alg1"], topic: "a1-quadratics",
    q: "Which value of x is a solution to x² − 7x + 12 = 0?", choices: ["2", "4", "5", "6"], a: 1,
    steps: [
      { show: "x² − 7x + 12 = 0", say: "Don't want to factor? You already have the answers. Test them." },
      { show: "Start with a middle choice: x = 4", say: "Start in the middle so you know whether to go up or down." },
      { show: "4² − 7(4) + 12", say: "Plug 4 in for x." },
      { show: "16 − 28 + 12 = [[0]] ✓", say: "It equals zero. Done, no factoring needed." },
    ],
  },
  {
    id: "pick-100", trick: "Pick 100", exams: ["shsat", "sat", "tachs"], topic: "m7-percent-apps",
    q: "A price goes up 20%, then down 20%. Compared to the original, the final price is:", choices: ["4% lower", "the same", "4% higher", "20% lower"], a: 0,
    steps: [
      { show: "+20% then −20%", say: "No price given? Make one up, and always pick 100." },
      { show: "100 × 1.2 = 120", say: "Up 20% takes 100 to 120." },
      { show: "120 × 0.8 = 96", say: "Down 20% of 120 is 24 off, so 96." },
      { show: "100 → 96 = [[4% lower]]", say: "Started at 100, ended at 96. That's 4% lower, not the same!" },
    ],
  },
  {
    id: "consecutive-sum", trick: "Middle × count", exams: ["shsat", "tachs"], topic: "m-word-problems",
    q: "The sum of five consecutive integers is 115. What is the largest?", choices: ["25", "23", "27", "21"], a: 0,
    steps: [
      { show: "5 consecutive integers, sum 115", say: "Consecutive numbers are perfectly balanced around the middle." },
      { show: "middle = {115|5} = [[23]]", say: "So divide the sum by how many there are to get the middle one." },
      { show: "21, 22, 23, 24, 25", say: "Count two down and two up from the middle." },
      { show: "largest = [[25]]", say: "The largest is 25. No algebra needed." },
    ],
  },
  {
    id: "average-balance", trick: "Balance the average", exams: ["shsat", "tachs", "regents-alg1"], topic: "m6-stats",
    q: "Find the mean of 88, 93, 96 and 83.", choices: ["90", "89", "91", "92"], a: 0,
    steps: [
      { show: "88, 93, 96, 83", say: "Don't add big numbers. Guess a nice middle value instead." },
      { show: "guess 90", say: "Let's guess 90 and see how far off each number is." },
      { show: "−2, +3, +6, −7", say: "88 is minus 2, 93 is plus 3, 96 is plus 6, 83 is minus 7." },
      { show: "−2 + 3 + 6 − 7 = [[0]]", say: "They cancel out to zero, so our guess was perfect." },
      { show: "mean = 90", say: "The mean is exactly 90." },
    ],
  },
  {
    id: "triples", trick: "Spot the triple", exams: ["shsat", "regents-geo", "sat"], topic: "m8-pythagorean",
    q: "A right triangle has legs 9 and 12. How long is the hypotenuse?", choices: ["15", "21", "√153", "18"], a: 0,
    steps: [
      { show: "legs 9 and 12", say: "Before squaring anything, look for a famous triple." },
      { show: "9 = 3·[[3]]   12 = 4·[[3]]", say: "9 and 12 are 3 and 4, each times 3." },
      { show: "3-4-5  →  ×3", say: "It's the 3-4-5 triangle, scaled up by 3." },
      { show: "5 × 3 = [[15]]", say: "So the hypotenuse is 15. Learn 3-4-5, 5-12-13 and 8-15-17." },
    ],
  },
  {
    id: "cross-compare", trick: "Butterfly compare", exams: ["shsat", "tachs"], topic: "m6-fractions",
    q: "Which is greater: 5/8 or 7/11?", choices: ["7/11", "5/8", "They're equal", "Can't tell"], a: 0,
    steps: [
      { show: "{5|8}  vs  {7|11}", say: "Comparing fractions? Skip common denominators. Do the butterfly." },
      { show: "5 × 11 = 55", say: "Multiply diagonally up: 5 times 11 is 55, write it over 5/8." },
      { show: "7 × 8 = 56", say: "Then 7 times 8 is 56, write it over 7/11." },
      { show: "55 < [[56]]", say: "Bigger product wins. 7/11 is greater, just barely." },
    ],
  },
  {
    id: "same-base", trick: "Same base, same exponent", exams: ["sat", "regents-alg1", "regents-alg2"], topic: "a2-exp-log",
    q: "If 4ˣ = 8, what is x?", choices: ["3/2", "2", "1/2", "2/3"], a: 0,
    steps: [
      { show: "4ˣ = 8", say: "Different bases? Rewrite them with the same base." },
      { show: "4 = 2²     8 = 2³", say: "Both 4 and 8 are powers of 2." },
      { show: "(2²)ˣ = 2³ → 2²ˣ = 2³", say: "Power to a power, multiply the exponents." },
      { show: "2x = 3 → x = [[3/2]]", say: "Same base means the exponents are equal. x is three halves." },
    ],
  },
  {
    id: "cofunction", trick: "Sine-cosine flip", exams: ["regents-geo", "sat"], topic: "geo-trig",
    q: "If sin(2x + 10)° = cos(40)°, what is x?", choices: ["20", "15", "40", "25"], a: 0,
    steps: [
      { show: "sin(2x + 10) = cos(40)", say: "See sine equal to cosine? That's a Regents favorite." },
      { show: "sin A = cos B → A + B = [[90]]", say: "Sine and cosine are equal when the angles add up to 90." },
      { show: "2x + 10 + 40 = 90", say: "So add the two angles and set them equal to 90." },
      { show: "2x = 40 → x = [[20]]", say: "Solve it. x equals 20. Free points." },
    ],
  },
  {
    id: "round-trip", trick: "Round-trip speed", exams: ["shsat", "sat"], topic: "m-word-problems",
    q: "You drive to a beach at 30 mph and back at 60 mph. Average speed for the trip?", choices: ["40 mph", "45 mph", "50 mph", "35 mph"], a: 0,
    steps: [
      { show: "30 mph there, 60 mph back", say: "Everyone says 45. It's a trap!" },
      { show: "Pick distance = 60 mi", say: "Pick an easy distance, like 60 miles each way." },
      { show: "{60|30} = 2 hr   {60|60} = 1 hr", say: "Going takes 2 hours. Coming back takes 1 hour." },
      { show: "{120 mi|3 hr} = [[40 mph]]", say: "Total 120 miles in 3 hours. That's 40 mph." },
    ],
  },
  {
    id: "exterior-angle", trick: "Exterior angle shortcut", exams: ["shsat", "regents-geo"], topic: "m7-geometry",
    q: "A triangle has interior angles 48° and 67°. What is the exterior angle at the third vertex?", choices: ["115°", "65°", "125°", "105°"], a: 0,
    steps: [
      { show: "48° and 67° → exterior?", say: "Don't find the third angle first. There's a shortcut." },
      { show: "exterior = sum of the 2 [[far]] angles", say: "An exterior angle equals the two interior angles NOT next to it." },
      { show: "48 + 67 = [[115°]]", say: "So just add them. 115 degrees." },
    ],
  },
  {
    id: "commas-test", trick: "The delete test", exams: ["shsat", "sat", "tachs"], topic: "ela-punctuation",
    q: "Which is correct? A) The museum, which opened in 1870 is huge. B) The museum, which opened in 1870, is huge.", choices: ["B", "A", "Both", "Neither"], a: 0,
    steps: [
      { show: "The museum, which opened in 1870, is huge.", say: "Commas around extra info? Use the delete test." },
      { show: "The museum ~~which opened in 1870~~ is huge.", say: "Cross out the part between the commas." },
      { show: "The museum is huge. ✓", say: "Still a full sentence? Then that info was extra." },
      { show: "Extra info = commas on [[BOTH]] sides", say: "Extra info needs a comma on both sides. So B." },
    ],
  },
  {
    id: "transition-arrows", trick: "Transition arrows", exams: ["shsat", "sat"], topic: "ela-revising",
    q: "Solar panels cost a lot to install. ___, they save money over time.", choices: ["However", "Therefore", "Similarly", "For example"], a: 0,
    steps: [
      { show: "cost a lot  ___  save money", say: "Transition questions? Draw an arrow between the two ideas." },
      { show: "same way ➡️  or  turn ↩️", say: "Does the second idea keep going the same way, or turn around?" },
      { show: "bad ↩️ good", say: "Costing a lot is bad, saving money is good. That's a turn." },
      { show: "turn = [[However]]", say: "Turn words: however, but, yet. The answer is However." },
    ],
  },
  {
    id: "its-vs-its", trick: "Say it out loud", exams: ["shsat", "tachs", "sat"], topic: "ela-agreement",
    q: "The dog wagged ___ tail.", choices: ["its", "it's", "its'", "it is"], a: 0,
    steps: [
      { show: "it's  or  its?", say: "Every time, replace it with 'it is.'" },
      { show: "The dog wagged it is tail ❌", say: "Sounds wrong? Then you don't need the apostrophe." },
      { show: "[[its]] = belongs to it", say: "No apostrophe means it belongs to it. Like his or hers." },
    ],
  },
  {
    id: "discriminant", trick: "How many solutions?", exams: ["regents-alg1", "regents-alg2", "sat"], topic: "a1-quadratics",
    q: "How many real solutions does x² + 4x + 7 = 0 have?", choices: ["0", "1", "2", "Infinitely many"], a: 0,
    steps: [
      { show: "x² + 4x + 7 = 0", say: "They only ask HOW MANY? Don't solve. Check the discriminant." },
      { show: "b² − 4ac", say: "The discriminant is b squared minus 4 a c." },
      { show: "16 − 4(1)(7) = 16 − 28 = [[−12]]", say: "Here that's 16 minus 28, which is negative 12." },
      { show: "negative → [[0]] real solutions", say: "Negative means zero real solutions. Zero means one. Positive means two." },
    ],
  },
  {
    id: "rule-of-72", trick: "Rule of 72", exams: ["regents-alg1", "regents-alg2", "sat"], topic: "a1-exponential",
    q: "Money grows 8% per year. About how many years until it doubles?", choices: ["9", "12", "6", "16"], a: 0,
    steps: [
      { show: "8% per year → double?", say: "Doubling time question? Use the Rule of 72." },
      { show: "{72|rate} ≈ years to double", say: "Divide 72 by the growth rate percent." },
      { show: "{72|8} = [[9]]", say: "72 divided by 8 is 9 years. Check with your calculator if you want: 1.08⁹ ≈ 2." },
    ],
  },
  {
    id: "mitosis-meiosis", trick: "Mitosis vs meiosis", exams: ["regents-bio"], topic: "bio-genetics",
    q: "A process makes 4 cells with half the chromosome number. It is:", choices: ["meiosis", "mitosis", "fertilization", "binary fission"], a: 0,
    steps: [
      { show: "4 cells, [[half]] the chromosomes", say: "Mitosis or meiosis? Use the 'me' trick." },
      { show: "MEiosis → makes ME", say: "Meiosis makes sex cells, the cells that made ME." },
      { show: "mi-TWO-sis → 2 identical cells", say: "Mitosis makes two identical body cells." },
      { show: "4 cells, half → [[meiosis]]", say: "Four cells with half the chromosomes means meiosis." },
    ],
  },
];
