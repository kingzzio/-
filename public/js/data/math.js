// Math topics, grades 6–12. Question format: [question, choices, correctIndex, explanation].
// `gen` lists procedural generators (generators.js) that give unlimited extra practice.

export default [
  // ---------------- GRADE 6 ----------------
  {
    id: "m6-ratios", subject: "math", course: "Grade 6", grades: [6], unit: "Ratios & Rates", name: "Ratios, Rates & Unit Rates",
    desc: "Compare quantities with ratios, use tape diagrams and tables, and find unit rates.",
    gen: ["ratio", "unit-rate"], tags: ["shsat", "tachs"],
    cards: [
      ["Ratio", "A comparison of two quantities, written a:b, a to b, or a/b."],
      ["Unit rate", "A rate per 1 unit, e.g. 60 miles per 1 hour. Divide to find it."],
      ["Equivalent ratios", "Ratios that simplify to the same value, like 2:3 and 8:12 (multiply both parts by the same number)."],
      ["Part-to-part vs. part-to-whole", "Boys:girls = 2:3 is part-to-part; boys:total = 2:5 is part-to-whole."],
      ["Tape diagram trick", "Add the ratio parts to get the total number of parts, then divide the total by it to get one part."],
    ],
    qs: [
      ["A recipe uses 3 cups of flour for every 2 cups of sugar. How much flour goes with 8 cups of sugar?", ["10 cups", "12 cups", "16 cups", "5⅓ cups"], 1, "2 cups sugar → 3 flour, so 8 cups sugar is 4 times as much: 4 × 3 = 12 cups flour."],
      ["Which ratio is equivalent to 4:10?", ["8:18", "2:5", "10:4", "6:12"], 1, "Divide both parts of 4:10 by 2 to get 2:5."],
      ["Store A sells 6 pens for $4.50. Store B sells 10 pens for $7.00. Which is the better deal?", ["Store A", "Store B", "They're the same", "Can't tell"], 1, "A: $0.75 per pen. B: $0.70 per pen. B is cheaper per pen."],
    ],
  },
  {
    id: "m6-percents", subject: "math", course: "Grade 6", grades: [6, 7], unit: "Unit Rates & Percentages", name: "Percents",
    desc: "Percent means 'per 100'. Find a percent of a number, the whole, or the percent.",
    gen: ["percent-of", "percent-change"], tags: ["shsat", "tachs"],
    cards: [
      ["Percent", "Per hundred. 35% = 35/100 = 0.35."],
      ["Find the part", "Part = percent × whole. 20% of 80 = 0.2 × 80 = 16."],
      ["Find the whole", "Whole = part ÷ percent. 12 is 30% of what? 12 ÷ 0.3 = 40."],
      ["Find the percent", "Percent = part ÷ whole × 100. 9 out of 36 = 25%."],
      ["Benchmark percents", "10% = ÷10, 25% = ÷4, 50% = ÷2, 1% = ÷100."],
    ],
    qs: [
      ["18 is 30% of what number?", ["54", "60", "5.4", "48"], 1, "Whole = 18 ÷ 0.30 = 60."],
      ["What percent of 40 is 14?", ["28%", "35%", "14%", "54%"], 1, "14 ÷ 40 = 0.35 = 35%."],
      ["Which is greatest?", ["0.6", "5/8", "61%", "3/5"], 1, "5/8 = 0.625, which beats 0.61, 0.60 and 0.60."],
    ],
  },
  {
    id: "m6-fractions", subject: "math", course: "Grade 6", grades: [6], unit: "Dividing Fractions", name: "Fraction Operations",
    desc: "Add, subtract, multiply and divide fractions and mixed numbers.",
    gen: ["fraction-ops"], tags: ["shsat", "tachs"],
    cards: [
      ["Dividing fractions", "Keep, change, flip: a/b ÷ c/d = a/b × d/c."],
      ["Adding fractions", "Get a common denominator first, then add numerators."],
      ["Mixed → improper", "2⅗ = (2×5 + 3)/5 = 13/5."],
      ["Reciprocal", "Flip the fraction: the reciprocal of 3/7 is 7/3. A number times its reciprocal = 1."],
    ],
    qs: [
      ["2½ ÷ ¾ = ?", ["1⅞", "3⅓", "15/8", "3¾"], 1, "5/2 × 4/3 = 20/6 = 10/3 = 3⅓."],
      ["How many ⅜-cup servings are in 3 cups?", ["8", "9/8", "6", "1⅛"], 0, "3 ÷ 3/8 = 3 × 8/3 = 8."],
    ],
  },
  {
    id: "m6-integers", subject: "math", course: "Grade 6", grades: [6, 7], unit: "Rational Numbers", name: "Integers, Absolute Value & the Coordinate Plane",
    desc: "Negative numbers, opposites, absolute value, and plotting points in all four quadrants.",
    gen: ["integers", "absolute-value"], tags: ["shsat"],
    cards: [
      ["Absolute value", "Distance from 0 on a number line. Always ≥ 0. |−7| = 7."],
      ["Opposites", "Same distance from 0, opposite sides: 5 and −5."],
      ["Quadrants", "I (+,+), II (−,+), III (−,−), IV (+,−). Counterclockwise from upper right."],
      ["Comparing negatives", "The number farther left is smaller: −9 < −2."],
    ],
    qs: [
      ["Which point is in Quadrant III?", ["(3, −2)", "(−4, −1)", "(−2, 5)", "(0, −3)"], 1, "Quadrant III has both coordinates negative."],
      ["Order from least to greatest: −3, 2, −7, 0", ["−3, −7, 0, 2", "−7, −3, 0, 2", "0, 2, −3, −7", "2, 0, −3, −7"], 1, "On a number line −7 is farthest left."],
      ["What is the distance between (−3, 4) and (5, 4)?", ["2", "8", "5", "−8"], 1, "Same y-coordinate, so distance = |5 − (−3)| = 8."],
    ],
  },
  {
    id: "m6-expressions", subject: "math", course: "Grade 6", grades: [6], unit: "Expressions & Equations", name: "Expressions & Order of Operations",
    desc: "Write and evaluate expressions, use exponents, and apply the distributive property.",
    gen: ["order-ops", "like-terms"], tags: ["shsat", "tachs"],
    cards: [
      ["PEMDAS / GEMS", "Parentheses (Grouping), Exponents, Multiply/Divide left→right, Add/Subtract left→right."],
      ["Distributive property", "a(b + c) = ab + ac. 3(x + 4) = 3x + 12."],
      ["Like terms", "Terms with the same variable part: 4x and −x are like; 4x and 4x² are not."],
      ["Coefficient", "The number multiplying a variable. In 7y, the coefficient is 7."],
    ],
    qs: [
      ["Evaluate 2(3 + 5)² ÷ 4", ["32", "16", "128", "8"], 0, "(8)² = 64. 2 × 64 = 128. 128 ÷ 4 = 32."],
      ["Which is equivalent to 6x + 9?", ["3(2x + 3)", "6(x + 9)", "15x", "3(2x + 9)"], 0, "Factor out 3: 3(2x + 3) = 6x + 9."],
    ],
  },
  {
    id: "m6-equations", subject: "math", course: "Grade 6", grades: [6], unit: "Expressions & Equations", name: "One-Step Equations & Inequalities",
    desc: "Solve x + a = b and ax = b, and graph simple inequalities.",
    gen: ["one-step"], tags: ["tachs"],
    cards: [
      ["Inverse operations", "Undo + with −, × with ÷ (and vice versa). Do the same to both sides."],
      ["Solution", "A value that makes the equation true. Check by substituting."],
      ["Open vs. closed circle", "< or > → open circle. ≤ or ≥ → closed (filled) circle."],
    ],
    qs: [
      ["Solve: x/4 = 9", ["2.25", "13", "36", "5"], 2, "Multiply both sides by 4: x = 36."],
      ["Which value is a solution to x + 7 > 12?", ["3", "5", "6", "−6"], 2, "x > 5, so 6 works."],
    ],
  },
  {
    id: "m6-geometry", subject: "math", course: "Grade 6", grades: [6], unit: "Area & Surface Area", name: "Area, Surface Area & Volume",
    desc: "Area of triangles, parallelograms and trapezoids; surface area with nets; volume of prisms.",
    gen: ["area", "volume"], tags: ["shsat", "tachs"],
    cards: [
      ["Area of a triangle", "A = ½ × base × height."],
      ["Area of a parallelogram", "A = base × height (height is perpendicular to the base)."],
      ["Area of a trapezoid", "A = ½(b₁ + b₂) × h."],
      ["Surface area", "Total area of all faces. Unfold into a net and add the areas."],
      ["Volume of a rectangular prism", "V = l × w × h, in cubic units."],
    ],
    qs: [
      ["A cube has edges of 4 cm. What is its surface area?", ["64 cm²", "96 cm²", "16 cm²", "48 cm²"], 1, "6 faces × (4 × 4) = 96 cm²."],
      ["A box is 2.5 ft × 2 ft × 4 ft. What is its volume?", ["8.5 ft³", "20 ft³", "10 ft³", "40 ft³"], 1, "2.5 × 2 × 4 = 20 ft³."],
    ],
  },
  {
    id: "m6-stats", subject: "math", course: "Grade 6", grades: [6], unit: "Data Sets & Distributions", name: "Statistics: Mean, Median, MAD & Box Plots",
    desc: "Measures of center and spread, dot plots, histograms and box plots.",
    gen: ["mean-median"], tags: ["shsat"],
    cards: [
      ["Mean", "Add all values and divide by how many there are."],
      ["Median", "Middle value when the data is in order (average the two middles if even)."],
      ["Mode / Range", "Mode = most frequent value. Range = max − min."],
      ["MAD", "Mean absolute deviation: average distance of each value from the mean."],
      ["IQR", "Interquartile range = Q3 − Q1. It's the width of the box in a box plot."],
      ["Outliers", "Extreme values pull the mean toward them; the median barely changes."],
    ],
    qs: [
      ["Data: 2, 4, 4, 5, 15. Which measure of center best describes it?", ["Mean, because of the outlier", "Median, because of the outlier", "Range", "Mode only"], 1, "15 is an outlier, so the median (4) is more typical than the mean (6)."],
      ["A box plot has Q1 = 12 and Q3 = 20. What is the IQR?", ["8", "16", "32", "4"], 0, "IQR = 20 − 12 = 8."],
    ],
  },

  // ---------------- GRADE 7 ----------------
  {
    id: "m7-proportional", subject: "math", course: "Grade 7", grades: [7], unit: "Proportional Relationships", name: "Proportional Relationships",
    desc: "Constant of proportionality, y = kx, tables and graphs through the origin.",
    gen: ["proportional", "unit-rate"], tags: ["shsat", "tachs"],
    cards: [
      ["Proportional relationship", "y = kx. The ratio y/x is constant and the graph is a straight line through (0, 0)."],
      ["Constant of proportionality (k)", "k = y ÷ x. It's the unit rate."],
      ["Cross-multiplying", "If a/b = c/d then ad = bc."],
      ["Not proportional?", "If the line doesn't pass through the origin (like y = 2x + 3), it's NOT proportional."],
    ],
    qs: [
      ["Which equation shows a proportional relationship?", ["y = 3x + 1", "y = 4x", "y = x²", "y = 5/x"], 1, "Only y = kx (here k = 4) is proportional."],
      ["Solve: 4/x = 10/25", ["10", "8", "62.5", "1.6"], 0, "Cross multiply: 10x = 100, so x = 10."],
    ],
  },
  {
    id: "m7-scale", subject: "math", course: "Grade 7", grades: [7], unit: "Scale Drawings", name: "Scale Drawings",
    desc: "Use scale factors to find actual lengths and areas.",
    gen: ["scale-drawing"], tags: ["shsat"],
    cards: [
      ["Scale factor", "The number you multiply lengths by. Scale 1:50 → actual is 50 times the drawing."],
      ["Area and scale", "If lengths scale by k, areas scale by k². Volumes scale by k³."],
    ],
    qs: [
      ["A drawing uses a scale of 1 cm : 4 m. A room is 5 cm by 3 cm on the drawing. What is its actual area?", ["15 m²", "60 m²", "240 m²", "32 m²"], 2, "Actual is 20 m by 12 m = 240 m². (Or 15 × 4² = 240.)"],
    ],
  },
  {
    id: "m7-percent-apps", subject: "math", course: "Grade 7", grades: [7], unit: "Percentages", name: "Percent Applications: Tax, Tip, Discount & Interest",
    desc: "Markups, markdowns, sales tax, tips, percent error and simple interest.",
    gen: ["percent-change", "interest"], tags: ["shsat", "tachs", "regents-alg1"],
    cards: [
      ["Percent increase", "New = original × (1 + r). A 15% markup → × 1.15."],
      ["Percent decrease", "New = original × (1 − r). 30% off → × 0.70."],
      ["Percent change", "(new − old) ÷ old × 100%."],
      ["Simple interest", "I = Prt (principal × rate × time in years)."],
      ["Two discounts", "20% off then 10% off is NOT 30% off: 0.8 × 0.9 = 0.72 → 28% off."],
    ],
    qs: [
      ["A price drops from $80 to $60. What is the percent decrease?", ["20%", "25%", "33⅓%", "75%"], 1, "Change = 20. 20 ÷ 80 = 25%."],
      ["A $40 meal with 8.875% NYC sales tax and a 20% tip on the pre-tax amount costs about…", ["$51.55", "$43.55", "$48.00", "$52.50"], 0, "Tax ≈ $3.55, tip = $8.00. 40 + 3.55 + 8 = $51.55."],
      ["A shirt is marked up 50% then discounted 50%. Compared to the original price, the final price is…", ["the same", "25% less", "25% more", "50% less"], 1, "1.5 × 0.5 = 0.75 → 25% less."],
    ],
  },
  {
    id: "m7-rational-ops", subject: "math", course: "Grade 7", grades: [7], unit: "Rational Number Arithmetic", name: "Operations with Rational Numbers",
    desc: "Add, subtract, multiply and divide positive and negative numbers, fractions and decimals.",
    gen: ["integers", "fraction-ops"], tags: ["shsat", "tachs"],
    cards: [
      ["Same signs (× or ÷)", "Positive. (−4)(−5) = 20."],
      ["Different signs (× or ÷)", "Negative. (−24) ÷ 6 = −4."],
      ["Subtracting a negative", "a − (−b) = a + b. 3 − (−8) = 11."],
      ["Repeating decimal", "Any fraction is a terminating or repeating decimal. 1/3 = 0.333…"],
    ],
    qs: [
      ["−2.5 × (−4) − 6 = ?", ["16", "4", "−16", "−4"], 1, "−2.5 × −4 = 10. 10 − 6 = 4."],
      ["Which is equal to −3/8?", ["−0.375", "−0.38", "−3.8", "0.375"], 0, "3 ÷ 8 = 0.375, so −3/8 = −0.375."],
    ],
  },
  {
    id: "m7-equations", subject: "math", course: "Grade 7", grades: [7], unit: "Expressions, Equations & Inequalities", name: "Two-Step Equations & Inequalities",
    desc: "Solve px + q = r and p(x + q) = r, and inequalities with negatives.",
    gen: ["two-step", "inequality", "like-terms"], tags: ["shsat", "tachs"],
    cards: [
      ["Two-step strategy", "Undo addition/subtraction first, then multiplication/division."],
      ["Flip rule", "Multiplying or dividing an inequality by a negative flips the sign: −2x > 6 → x < −3."],
      ["Check your answer", "Plug your solution back in. Both sides should match."],
    ],
    qs: [
      ["Solve: 3(x − 4) = 21", ["x = 3", "x = 11", "x = 8.33", "x = 25"], 1, "Divide by 3: x − 4 = 7, so x = 11."],
      ["Solve: −4x + 3 ≤ 19", ["x ≤ −4", "x ≥ −4", "x ≥ 4", "x ≤ 4"], 1, "−4x ≤ 16. Divide by −4 and flip: x ≥ −4."],
      ["Movie tickets cost $12 each plus a $5 fee. Kira spent $77. How many tickets?", ["5", "6", "7", "8"], 1, "12t + 5 = 77 → 12t = 72 → t = 6."],
    ],
  },
  {
    id: "m7-geometry", subject: "math", course: "Grade 7", grades: [7], unit: "Angles, Triangles & Circles", name: "Circles, Angles & Triangles",
    desc: "Circumference and area of circles, angle relationships, and triangle rules.",
    gen: ["circle", "angles"], tags: ["shsat", "tachs"],
    cards: [
      ["Circumference", "C = 2πr = πd."],
      ["Area of a circle", "A = πr²."],
      ["Supplementary / complementary", "Supplementary angles add to 180°; complementary angles add to 90°."],
      ["Vertical angles", "Opposite angles formed by two crossing lines. They're equal."],
      ["Triangle angle sum", "The three angles of any triangle add to 180°."],
      ["Triangle inequality", "Any two sides of a triangle must add to more than the third side."],
    ],
    qs: [
      ["A circle's circumference is 18π. What is its area?", ["81π", "36π", "324π", "9π"], 0, "C = 2πr → r = 9. A = π(9²) = 81π."],
      ["Which side lengths can form a triangle?", ["2, 3, 6", "4, 5, 10", "5, 7, 11", "1, 1, 3"], 2, "5 + 7 = 12 > 11 ✓. The others fail the triangle inequality."],
      ["Angles x and 3x are supplementary. What is x?", ["22.5°", "45°", "60°", "30°"], 1, "x + 3x = 180 → 4x = 180 → x = 45°."],
    ],
  },
  {
    id: "m7-probability", subject: "math", course: "Grade 7", grades: [7], unit: "Probability & Sampling", name: "Probability & Sampling",
    desc: "Simple and compound probability, sample spaces, and random samples.",
    gen: ["probability"], tags: ["shsat", "tachs"],
    cards: [
      ["Probability", "P(event) = favorable outcomes ÷ total outcomes. Between 0 and 1."],
      ["Complement", "P(not A) = 1 − P(A)."],
      ["Independent events", "P(A and B) = P(A) × P(B). (With replacement.)"],
      ["Without replacement", "The total goes down by 1 after each pick."],
      ["Random sample", "Every member of the population has an equal chance of being chosen. Lets you make fair predictions."],
    ],
    qs: [
      ["You flip a coin and roll a number cube. How many outcomes are in the sample space?", ["8", "12", "6", "36"], 1, "2 × 6 = 12."],
      ["A bag has 3 red and 2 blue. You draw 2 without replacement. P(both red)?", ["9/25", "3/10", "6/25", "1/2"], 1, "3/5 × 2/4 = 6/20 = 3/10."],
    ],
  },

  // ---------------- GRADE 8 ----------------
  {
    id: "m8-exponents", subject: "math", course: "Grade 8", grades: [8], unit: "Exponents & Scientific Notation", name: "Exponent Rules & Scientific Notation",
    desc: "Integer exponents, the laws of exponents, and very large/small numbers.",
    gen: ["exponents", "sci-notation"], tags: ["shsat", "regents-alg1"],
    cards: [
      ["Product rule", "aᵐ · aⁿ = aᵐ⁺ⁿ"],
      ["Quotient rule", "aᵐ ÷ aⁿ = aᵐ⁻ⁿ"],
      ["Power rule", "(aᵐ)ⁿ = aᵐⁿ"],
      ["Zero exponent", "a⁰ = 1 (a ≠ 0)"],
      ["Negative exponent", "a⁻ⁿ = 1/aⁿ. 2⁻³ = 1/8."],
      ["Scientific notation", "a × 10ⁿ with 1 ≤ a < 10. 45,000 = 4.5 × 10⁴; 0.0062 = 6.2 × 10⁻³."],
    ],
    qs: [
      ["Simplify: 3⁻² × 3⁵", ["27", "3⁻¹⁰", "9", "1/27"], 0, "Add exponents: 3³ = 27."],
      ["Which is 0.00048 in scientific notation?", ["4.8 × 10⁻⁴", "48 × 10⁻⁵", "4.8 × 10⁴", "4.8 × 10⁻³"], 0, "Move the decimal 4 places right → 4.8 × 10⁻⁴."],
      ["(2x³)⁴ = ?", ["8x⁷", "16x¹²", "2x¹²", "16x⁷"], 1, "2⁴ = 16 and (x³)⁴ = x¹²."],
    ],
  },
  {
    id: "m8-roots", subject: "math", course: "Grade 8", grades: [8], unit: "Pythagorean Theorem & Irrational Numbers", name: "Square Roots, Cube Roots & Irrational Numbers",
    desc: "Perfect squares and cubes, estimating roots, rational vs. irrational.",
    gen: ["radicals"], tags: ["shsat"],
    cards: [
      ["Rational number", "Can be written as a fraction of integers. Its decimal ends or repeats."],
      ["Irrational number", "Can't be written as a fraction. Decimal never ends or repeats: √2, π."],
      ["Estimating √50", "49 < 50 < 64, so 7 < √50 < 8 (about 7.07)."],
      ["Cube root", "∛27 = 3 because 3³ = 27. ∛(−8) = −2."],
      ["Perfect squares to know", "1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225"],
    ],
    qs: [
      ["Which number is irrational?", ["√49", "0.25", "√20", "−3/4"], 2, "20 isn't a perfect square, so √20 is irrational."],
      ["√90 is between which two integers?", ["8 and 9", "9 and 10", "10 and 11", "44 and 46"], 1, "81 < 90 < 100."],
      ["Solve x³ = 64", ["4", "8", "21.3", "±8"], 0, "∛64 = 4."],
    ],
  },
  {
    id: "m8-linear", subject: "math", course: "Grade 8", grades: [8, 9], unit: "Linear Relationships", name: "Slope & Linear Equations (y = mx + b)",
    desc: "Slope as rate of change, slope-intercept form, and graphing lines.",
    gen: ["slope", "line-equation"], tags: ["shsat", "regents-alg1", "sat"],
    cards: [
      ["Slope", "m = rise/run = (y₂ − y₁)/(x₂ − x₁)."],
      ["Slope-intercept form", "y = mx + b, where m is slope and b is the y-intercept."],
      ["Point-slope form", "y − y₁ = m(x − x₁)."],
      ["Parallel lines", "Same slope."],
      ["Perpendicular lines", "Slopes are negative reciprocals: 2 and −½."],
      ["Horizontal / vertical", "y = c has slope 0. x = c has undefined slope."],
    ],
    qs: [
      ["What is the slope of 3x + 2y = 8?", ["3", "−3/2", "2/3", "4"], 1, "Solve for y: y = −(3/2)x + 4."],
      ["Which line is perpendicular to y = 4x − 1?", ["y = 4x + 2", "y = −4x", "y = −¼x + 3", "y = ¼x"], 2, "Negative reciprocal of 4 is −¼."],
      ["A phone plan costs $25 plus $0.10 per text. Which equation models the cost?", ["y = 25x + 0.10", "y = 0.10x + 25", "y = 25.10x", "y = 0.10(x + 25)"], 1, "Rate (slope) = 0.10, starting value (intercept) = 25."],
    ],
  },
  {
    id: "m8-systems", subject: "math", course: "Grade 8", grades: [8, 9], unit: "Linear Systems", name: "Systems of Linear Equations",
    desc: "Solve systems by graphing, substitution and elimination.",
    gen: ["systems"], tags: ["shsat", "regents-alg1", "sat"],
    cards: [
      ["Solution of a system", "The point (x, y) that makes both equations true — where the lines intersect."],
      ["Substitution", "Solve one equation for a variable, plug into the other."],
      ["Elimination", "Add or subtract the equations to cancel a variable (multiply first if needed)."],
      ["No solution", "Parallel lines: same slope, different intercepts."],
      ["Infinitely many", "Same line: same slope and same intercept."],
    ],
    qs: [
      ["How many solutions: y = 2x + 3 and y = 2x − 5?", ["One", "None", "Infinitely many", "Two"], 1, "Same slope, different intercepts → parallel → no solution."],
      ["Adult tickets are $8, kid tickets $5. 20 tickets sold for $127. How many adult tickets?", ["9", "11", "7", "13"], 0, "a + k = 20, 8a + 5k = 127. Substitute k = 20 − a: 8a + 100 − 5a = 127 → 3a = 27 → a = 9."],
    ],
  },
  {
    id: "m8-functions", subject: "math", course: "Grade 8", grades: [8, 9], unit: "Functions", name: "Intro to Functions",
    desc: "Inputs and outputs, the vertical line test, and comparing functions.",
    gen: ["function-eval"], tags: ["regents-alg1"],
    cards: [
      ["Function", "Each input has exactly one output."],
      ["Vertical line test", "If any vertical line crosses a graph more than once, it's not a function."],
      ["Function notation", "f(3) means 'the output when x = 3'."],
      ["Domain / range", "Domain = allowed inputs (x). Range = resulting outputs (y)."],
      ["Linear vs. nonlinear", "Linear functions have a constant rate of change; their graph is a straight line."],
    ],
    qs: [
      ["Which set of ordered pairs is NOT a function?", ["(1,2),(2,3),(3,4)", "(1,5),(2,5),(3,5)", "(2,1),(2,4),(3,6)", "(0,0),(1,1),(2,4)"], 2, "x = 2 has two different outputs."],
      ["If g(x) = 5 − 2x, find g(−3).", ["−1", "11", "1", "−11"], 1, "5 − 2(−3) = 5 + 6 = 11."],
    ],
  },
  {
    id: "m8-transformations", subject: "math", course: "Grade 8", grades: [8, 10], unit: "Transformations & Congruence", name: "Transformations, Congruence & Similarity",
    desc: "Translations, reflections, rotations, dilations, and what they preserve.",
    gen: [], tags: ["shsat", "regents-geo"],
    cards: [
      ["Translation", "Slide. (x, y) → (x + a, y + b)."],
      ["Reflection over x-axis", "(x, y) → (x, −y)."],
      ["Reflection over y-axis", "(x, y) → (−x, y)."],
      ["Reflection over y = x", "(x, y) → (y, x)."],
      ["Rotation 90° counterclockwise", "(x, y) → (−y, x) about the origin."],
      ["Rotation 180°", "(x, y) → (−x, −y)."],
      ["Rigid motions", "Translations, reflections and rotations keep size and shape → congruent figures."],
      ["Dilation", "Scales by factor k from a center. Keeps angles and shape → similar figures."],
    ],
    qs: [
      ["Point (3, −5) is rotated 90° counterclockwise about the origin. Where does it land?", ["(5, 3)", "(−5, −3)", "(−3, 5)", "(5, −3)"], 0, "(x, y) → (−y, x) = (5, 3)."],
      ["Which transformation does NOT always produce a congruent figure?", ["Reflection", "Rotation", "Dilation", "Translation"], 2, "A dilation changes size (unless k = 1)."],
      ["Triangle ABC is dilated by a factor of 3. A side of 4 becomes…", ["7", "12", "4/3", "36"], 1, "4 × 3 = 12."],
    ],
  },
  {
    id: "m8-pythagorean", subject: "math", course: "Grade 8", grades: [8], unit: "Pythagorean Theorem", name: "Pythagorean Theorem & Distance",
    desc: "a² + b² = c², its converse, and the distance between points.",
    gen: ["pythagorean", "distance-midpoint"], tags: ["shsat", "regents-geo"],
    cards: [
      ["Pythagorean theorem", "In a right triangle: a² + b² = c², where c is the hypotenuse."],
      ["Converse", "If a² + b² = c², the triangle is a right triangle."],
      ["Common triples", "3-4-5, 5-12-13, 8-15-17, 7-24-25 (and multiples like 6-8-10)."],
      ["Distance formula", "d = √((x₂−x₁)² + (y₂−y₁)²) — it's just the Pythagorean theorem."],
    ],
    qs: [
      ["A 13-ft ladder leans against a wall with its base 5 ft from the wall. How high does it reach?", ["8 ft", "12 ft", "18 ft", "√194 ft"], 1, "13² − 5² = 169 − 25 = 144, √144 = 12."],
      ["Is a triangle with sides 6, 9, 11 a right triangle?", ["Yes", "No"], 1, "36 + 81 = 117 ≠ 121."],
    ],
  },
  {
    id: "m8-volume", subject: "math", course: "Grade 8", grades: [8], unit: "Functions & Volume", name: "Volume: Cylinders, Cones & Spheres",
    desc: "Volume formulas for round solids.",
    gen: ["volume"], tags: ["shsat", "regents-geo"],
    cards: [
      ["Cylinder", "V = πr²h"],
      ["Cone", "V = ⅓πr²h (one-third of the matching cylinder)."],
      ["Sphere", "V = (4/3)πr³"],
    ],
    qs: [
      ["A cylinder and a cone have the same radius and height. The cylinder holds 90 mL. The cone holds…", ["30 mL", "45 mL", "270 mL", "60 mL"], 0, "A cone is ⅓ of the cylinder: 90 ÷ 3 = 30 mL."],
    ],
  },
  {
    id: "m8-scatter", subject: "math", course: "Grade 8", grades: [8, 9], unit: "Associations in Data", name: "Scatter Plots & Two-Way Tables",
    desc: "Associations, lines of best fit, and relative frequency.",
    gen: [], tags: ["regents-alg1"],
    cards: [
      ["Positive association", "As x increases, y tends to increase."],
      ["Negative association", "As x increases, y tends to decrease."],
      ["Line of best fit", "A line that follows the trend of the data with about as many points above as below."],
      ["Two-way table", "Shows counts for two categorical variables. Relative frequency = cell ÷ row or column total."],
      ["Correlation ≠ causation", "Two things moving together doesn't prove one causes the other."],
    ],
    qs: [
      ["A line of best fit is y = 2.5x + 40, where x = hours studied and y = test score. Predict the score for 8 hours.", ["60", "52", "320", "42.5"], 0, "2.5(8) + 40 = 60."],
      ["In a class, 12 of 30 students own a dog. What is the relative frequency?", ["0.4", "0.12", "2.5", "0.3"], 0, "12 ÷ 30 = 0.4."],
    ],
  },

  // ---------------- ALGEBRA I ----------------
  {
    id: "a1-equations", subject: "math", course: "Algebra I", grades: [8, 9], unit: "Linear Equations & Inequalities", name: "Multi-Step Equations & Literal Equations",
    desc: "Variables on both sides, distributing, and solving formulas for a variable.",
    gen: ["multi-step", "inequality"], tags: ["regents-alg1", "sat", "shsat"],
    cards: [
      ["Variables on both sides", "Collect variable terms on one side, constants on the other."],
      ["Literal equation", "An equation with several variables. Solve for one using the same steps: A = lw → w = A/l."],
      ["Compound inequality", "'and' → between (−2 < x ≤ 5). 'or' → two separate pieces."],
      ["No solution / all reals", "If variables cancel and you get 3 = 5 → no solution. 4 = 4 → all real numbers."],
    ],
    qs: [
      ["Solve for h: V = πr²h", ["h = V − πr²", "h = V/(πr²)", "h = πr²/V", "h = Vπr²"], 1, "Divide both sides by πr²."],
      ["Solve: 2(x + 3) = 2x + 6", ["x = 0", "No solution", "All real numbers", "x = 3"], 2, "2x + 6 = 2x + 6 is always true."],
      ["Solve: 7 − 3(2x − 1) = 4x", ["x = 1", "x = 0.6", "x = 2", "x = 0.4"], 0, "7 − 6x + 3 = 4x → 10 = 10x → x = 1."],
    ],
  },
  {
    id: "a1-functions", subject: "math", course: "Algebra I", grades: [9], unit: "Functions", name: "Functions, Domain & Range",
    desc: "Function notation, interpreting graphs, average rate of change, and piecewise functions.",
    gen: ["function-eval"], tags: ["regents-alg1", "sat"],
    cards: [
      ["Average rate of change", "(f(b) − f(a)) ÷ (b − a) — the slope between two points on the graph."],
      ["Zeros / roots / x-intercepts", "Inputs where f(x) = 0."],
      ["Increasing interval", "Where the graph goes up as you move right."],
      ["Piecewise function", "Different rules for different parts of the domain."],
      ["Transformations", "f(x) + k shifts up k; f(x − h) shifts right h; −f(x) reflects over the x-axis."],
    ],
    qs: [
      ["f(x) = x² − 3x. What is the average rate of change from x = 1 to x = 4?", ["2", "4/3", "6", "3"], 0, "f(4) = 4, f(1) = −2. (4 − (−2)) ÷ 3 = 2."],
      ["The graph of y = |x| is shifted 3 units left. What's the new equation?", ["y = |x| − 3", "y = |x − 3|", "y = |x + 3|", "y = |x| + 3"], 2, "Left 3 → replace x with x + 3."],
      ["What is the domain of f(x) = √(x − 2)?", ["x ≥ 2", "x > 0", "all real numbers", "x ≤ 2"], 0, "You can't take the square root of a negative (in real numbers), so x − 2 ≥ 0."],
    ],
  },
  {
    id: "a1-exponential", subject: "math", course: "Algebra I", grades: [9], unit: "Exponential Functions", name: "Exponential Growth & Decay",
    desc: "y = a(b)ˣ, growth vs. decay, and comparing linear vs. exponential models.",
    gen: ["exponential"], tags: ["regents-alg1", "sat"],
    cards: [
      ["Exponential function", "y = a · bˣ. a = starting value, b = growth/decay factor."],
      ["Growth vs. decay", "b > 1 → growth. 0 < b < 1 → decay."],
      ["Growth rate", "b = 1 + r. A 7% increase → b = 1.07."],
      ["Linear vs. exponential", "Linear adds the same amount each step; exponential multiplies by the same factor."],
    ],
    qs: [
      ["Which function shows 15% decay?", ["y = 200(1.15)ˣ", "y = 200(0.15)ˣ", "y = 200(0.85)ˣ", "y = 200 − 15x"], 2, "Decay factor = 1 − 0.15 = 0.85."],
      ["Which table represents an exponential function? x: 0,1,2,3", ["y: 2, 4, 6, 8", "y: 3, 6, 12, 24", "y: 1, 4, 9, 16", "y: 5, 4, 3, 2"], 1, "Each y is multiplied by 2."],
      ["A car worth $24,000 loses 12% of its value per year. About how much is it worth after 3 years?", ["$15,360", "$16,355", "$21,120", "$8,640"], 1, "24000(0.88)³ ≈ 16,355."],
    ],
  },
  {
    id: "a1-polynomials", subject: "math", course: "Algebra I", grades: [9], unit: "Polynomials", name: "Polynomials & Factoring",
    desc: "Add, subtract, multiply polynomials; GCF, trinomials, difference of squares.",
    gen: ["factoring", "like-terms"], tags: ["regents-alg1", "sat"],
    cards: [
      ["FOIL", "(a + b)(c + d) = ac + ad + bc + bd."],
      ["GCF first", "Always factor out the greatest common factor first: 6x² + 9x = 3x(2x + 3)."],
      ["Trinomial x² + bx + c", "Find two numbers that multiply to c and add to b."],
      ["Difference of squares", "a² − b² = (a + b)(a − b)."],
      ["Perfect square trinomial", "a² + 2ab + b² = (a + b)²."],
      ["Degree", "The highest exponent. 4x³ − x + 2 has degree 3."],
    ],
    qs: [
      ["Factor completely: 2x² − 18", ["2(x − 3)²", "2(x + 3)(x − 3)", "(2x − 6)(x + 3)", "2(x² − 9)"], 1, "2(x² − 9) = 2(x + 3)(x − 3). 'Completely' means keep going."],
      ["(x − 4)² = ?", ["x² + 16", "x² − 16", "x² − 8x + 16", "x² − 4x + 16"], 2, "(x − 4)(x − 4) = x² − 8x + 16."],
      ["Factor: 2x² + 7x + 3", ["(2x + 1)(x + 3)", "(2x + 3)(x + 1)", "(x + 7)(2x + 3)", "(2x − 1)(x − 3)"], 0, "Check: 2x² + 6x + x + 3 = 2x² + 7x + 3."],
    ],
  },
  {
    id: "a1-quadratics", subject: "math", course: "Algebra I", grades: [9], unit: "Quadratic Functions & Equations", name: "Quadratic Functions & Equations",
    desc: "Graphs of parabolas, vertex, solving by factoring, completing the square, and the quadratic formula.",
    gen: ["quadratic-roots", "factoring"], tags: ["regents-alg1", "sat"],
    cards: [
      ["Quadratic formula", "x = (−b ± √(b² − 4ac)) / 2a"],
      ["Discriminant", "b² − 4ac: > 0 → 2 real roots, = 0 → 1 root, < 0 → no real roots."],
      ["Axis of symmetry", "x = −b/(2a). The vertex is on it."],
      ["Vertex form", "y = a(x − h)² + k, vertex (h, k)."],
      ["Opens up/down", "a > 0 opens up (has a minimum); a < 0 opens down (has a maximum)."],
      ["Completing the square", "x² + bx → add (b/2)² to make a perfect square."],
    ],
    qs: [
      ["What is the vertex of y = x² − 6x + 5?", ["(3, −4)", "(−3, 32)", "(6, 5)", "(3, 4)"], 0, "x = −(−6)/2 = 3. y = 9 − 18 + 5 = −4."],
      ["How many real solutions does x² + 4x + 7 = 0 have?", ["0", "1", "2", "Infinitely many"], 0, "Discriminant = 16 − 28 = −12 < 0."],
      ["Solve: x² − 5 = 0", ["x = ±5", "x = ±√5", "x = 25", "x = √5 only"], 1, "x² = 5 → x = ±√5."],
      ["A ball's height is h(t) = −16t² + 64t. When does it hit the ground?", ["t = 2", "t = 4", "t = 16", "t = 64"], 1, "−16t(t − 4) = 0 → t = 0 or t = 4. It lands at t = 4 s."],
    ],
  },
  {
    id: "a1-stats", subject: "math", course: "Algebra I", grades: [9], unit: "Statistics", name: "Statistics & Regression",
    desc: "Standard deviation, linear regression, correlation coefficient and residuals.",
    gen: ["mean-median"], tags: ["regents-alg1"],
    cards: [
      ["Correlation coefficient (r)", "Between −1 and 1. Close to ±1 = strong linear relationship; near 0 = weak."],
      ["Residual", "Actual y − predicted y. A random residual plot means a linear model fits well."],
      ["Standard deviation", "Measures spread around the mean. Bigger = more spread out."],
      ["Interpolation vs. extrapolation", "Predicting inside the data range vs. outside it (less reliable)."],
      ["Regents calculator tip", "Use STAT → CALC → LinReg (ax+b) and turn Diagnostics ON to see r."],
    ],
    qs: [
      ["Which r value shows the strongest relationship?", ["0.62", "−0.91", "0.08", "−0.45"], 1, "|−0.91| is closest to 1."],
      ["A model predicts 52; the actual value is 47. The residual is…", ["5", "−5", "99", "47"], 1, "Residual = actual − predicted = 47 − 52 = −5."],
    ],
  },
  {
    id: "a1-sequences", subject: "math", course: "Algebra I", grades: [9, 11], unit: "Sequences", name: "Arithmetic & Geometric Sequences",
    desc: "Explicit and recursive formulas for sequences.",
    gen: ["sequences"], tags: ["regents-alg1", "regents-alg2"],
    cards: [
      ["Arithmetic sequence", "Add the same common difference d: aₙ = a₁ + (n − 1)d."],
      ["Geometric sequence", "Multiply by the same common ratio r: aₙ = a₁ · rⁿ⁻¹."],
      ["Recursive formula", "Defines each term from the one before: a₁ = 3, aₙ = aₙ₋₁ + 4."],
    ],
    qs: [
      ["Which is a recursive formula for 5, 15, 45, 135, …?", ["aₙ = aₙ₋₁ + 10", "aₙ = 3aₙ₋₁, a₁ = 5", "aₙ = 5(3)ⁿ", "aₙ = 5 + 3n"], 1, "Each term is 3 times the previous, starting at 5."],
    ],
  },
  {
    id: "a1-radicals", subject: "math", course: "Algebra I", grades: [9], unit: "Radicals & Number Systems", name: "Radicals & Rational/Irrational Sums",
    desc: "Simplify radicals and decide if sums and products are rational.",
    gen: ["radicals"], tags: ["regents-alg1"],
    cards: [
      ["Rational + irrational", "Always irrational."],
      ["Rational × irrational", "Irrational (as long as the rational number isn't 0)."],
      ["Simplifying √72", "√(36 × 2) = 6√2."],
    ],
    qs: [
      ["Which is irrational?", ["√4 + 3", "√9 × 2", "5 + √3", "√16/2"], 2, "√3 is irrational, and rational + irrational is irrational."],
    ],
  },

  // ---------------- GEOMETRY ----------------
  {
    id: "geo-congruence", subject: "math", course: "Geometry", grades: [10], unit: "Congruence & Proof", name: "Triangle Congruence & Proofs",
    desc: "SSS, SAS, ASA, AAS, HL, CPCTC, and writing two-column proofs.",
    gen: [], tags: ["regents-geo"],
    cards: [
      ["Congruence shortcuts", "SSS, SAS, ASA, AAS, and HL (right triangles only)."],
      ["Not shortcuts", "AAA and SSA do NOT prove congruence."],
      ["CPCTC", "Corresponding Parts of Congruent Triangles are Congruent — use AFTER proving triangles congruent."],
      ["Reflexive property", "A segment or angle is congruent to itself (shared side)."],
      ["Isosceles triangle theorem", "Base angles opposite congruent sides are congruent."],
      ["Midpoint / bisector", "A midpoint splits a segment into two congruent parts; a bisector splits an angle into two congruent angles."],
    ],
    qs: [
      ["Two triangles have two pairs of congruent angles and a congruent non-included side. Which method proves congruence?", ["SSA", "AAS", "SAS", "AAA"], 1, "Two angles and a non-included side = AAS."],
      ["In a proof, you've shown △ABC ≅ △DEF. To conclude AB ≅ DE, the reason is…", ["SAS", "Reflexive property", "CPCTC", "Definition of midpoint"], 2, "Corresponding parts of congruent triangles are congruent."],
    ],
  },
  {
    id: "geo-similarity", subject: "math", course: "Geometry", grades: [10], unit: "Similarity", name: "Similarity & Dilations",
    desc: "AA similarity, proportional sides, the side-splitter theorem, and dilations.",
    gen: ["scale-drawing"], tags: ["regents-geo"],
    cards: [
      ["AA similarity", "Two pairs of congruent angles → triangles are similar."],
      ["Similar figures", "Corresponding angles congruent, corresponding sides proportional."],
      ["Side-splitter theorem", "A line parallel to one side of a triangle divides the other two sides proportionally."],
      ["Dilation facts", "Preserves angle measure and parallelism; lengths scale by k; a line not through the center maps to a parallel line."],
      ["Mean proportional (altitude)", "In a right triangle, altitude² = product of the two hypotenuse segments."],
    ],
    qs: [
      ["△ABC ~ △DEF with AB = 6, DE = 9 and BC = 8. Find EF.", ["11", "12", "5.3", "10"], 1, "Scale factor 9/6 = 1.5. 8 × 1.5 = 12."],
      ["A dilation with scale factor 2 maps a line not through the center to a line that is…", ["perpendicular", "the same line", "parallel", "twice as steep"], 2, "Dilations map lines not through the center to parallel lines."],
    ],
  },
  {
    id: "geo-trig", subject: "math", course: "Geometry", grades: [10], unit: "Right Triangle Trigonometry", name: "Right Triangle Trigonometry",
    desc: "SOH-CAH-TOA, special right triangles, angles of elevation and depression.",
    gen: ["trig-ratio", "pythagorean"], tags: ["regents-geo", "sat"],
    cards: [
      ["SOH-CAH-TOA", "sin = opposite/hypotenuse, cos = adjacent/hypotenuse, tan = opposite/adjacent."],
      ["Cofunctions", "sin A = cos(90° − A). If sin x = cos y, then x + y = 90°."],
      ["45-45-90", "Sides x, x, x√2."],
      ["30-60-90", "Sides x, x√3, 2x (short leg opposite 30°)."],
      ["Finding an angle", "Use inverse trig: A = sin⁻¹(opp/hyp)."],
      ["Elevation vs. depression", "Both measured from the horizontal. They're equal (alternate interior angles)."],
    ],
    qs: [
      ["If sin(2x + 10)° = cos(40)°, what is x?", ["15", "20", "25", "45"], 1, "Cofunctions: 2x + 10 + 40 = 90 → x = 20."],
      ["A 20-ft ramp makes a 10° angle with the ground. About how high does it rise?", ["3.5 ft", "19.7 ft", "3.0 ft", "113 ft"], 0, "sin 10° = h/20 → h ≈ 20(0.1736) ≈ 3.5 ft."],
      ["In a 30-60-90 triangle the short leg is 5. The hypotenuse is…", ["5√3", "10", "5√2", "7.5"], 1, "Hypotenuse = 2 × short leg."],
    ],
  },
  {
    id: "geo-circles", subject: "math", course: "Geometry", grades: [10], unit: "Circles", name: "Circle Theorems, Arcs & Sectors",
    desc: "Inscribed angles, chords, tangents, arc length, sector area and circle equations.",
    gen: ["circle"], tags: ["regents-geo"],
    cards: [
      ["Inscribed angle", "Half the intercepted arc."],
      ["Central angle", "Equal to its intercepted arc."],
      ["Tangent ⟂ radius", "A tangent line is perpendicular to the radius at the point of tangency."],
      ["Arc length", "(θ/360) × 2πr"],
      ["Sector area", "(θ/360) × πr²"],
      ["Circle equation", "(x − h)² + (y − k)² = r², center (h, k)."],
      ["Intersecting chords", "Products of the segments are equal: a·b = c·d."],
    ],
    qs: [
      ["An inscribed angle intercepts a 110° arc. What is the angle?", ["110°", "55°", "220°", "70°"], 1, "Inscribed angle = ½ arc = 55°."],
      ["What is the center and radius of x² + y² − 6x + 4y − 3 = 0?", ["(3, −2), r = 4", "(−3, 2), r = 4", "(3, −2), r = 16", "(6, −4), r = 3"], 0, "Complete the square: (x − 3)² + (y + 2)² = 16."],
      ["A sector has radius 6 and central angle 60°. What is its area?", ["6π", "2π", "36π", "12π"], 0, "(60/360) × 36π = 6π."],
    ],
  },
  {
    id: "geo-coordinate", subject: "math", course: "Geometry", grades: [10], unit: "Coordinate Geometry", name: "Coordinate Geometry & Proofs",
    desc: "Slope, distance and midpoint to prove properties of shapes; partitioning segments.",
    gen: ["distance-midpoint", "slope"], tags: ["regents-geo"],
    cards: [
      ["Prove a parallelogram", "Show both pairs of opposite sides are parallel (equal slopes), or diagonals bisect each other (same midpoint)."],
      ["Prove a rectangle", "Parallelogram + one right angle (perpendicular slopes) or congruent diagonals."],
      ["Prove a rhombus", "All four sides equal (distance formula)."],
      ["Partition a segment", "To split AB in ratio m:n, go m/(m+n) of the way from A: A + (m/(m+n))(B − A)."],
    ],
    qs: [
      ["Point P divides A(1, 2) to B(7, 11) in the ratio 1:2. Find P.", ["(3, 5)", "(5, 8)", "(4, 6.5)", "(2, 3)"], 0, "1/3 of the way: (1 + 2, 2 + 3) = (3, 5)."],
      ["To prove a quadrilateral is a parallelogram using slopes, you show…", ["all sides are equal", "opposite sides have equal slopes", "diagonals are perpendicular", "adjacent sides have negative reciprocal slopes"], 1, "Equal slopes mean parallel opposite sides."],
    ],
  },
  {
    id: "geo-solids", subject: "math", course: "Geometry", grades: [10], unit: "Solid Geometry", name: "Volume, Density & Cross-Sections",
    desc: "Volume of prisms, pyramids, cylinders, cones, spheres; density; rotations of 2-D shapes.",
    gen: ["volume"], tags: ["regents-geo"],
    cards: [
      ["Pyramid", "V = ⅓Bh (B = area of the base)."],
      ["Density", "Density = mass ÷ volume. A Regents favorite: find volume, then multiply by density."],
      ["Cavalieri's principle", "Same height and same cross-sectional area at every level → same volume."],
      ["Rotating a rectangle", "Spinning a rectangle around one side makes a cylinder; a right triangle makes a cone."],
    ],
    qs: [
      ["A right triangle with legs 3 and 4 is rotated around the leg of length 4. What solid forms?", ["Cylinder", "Cone with radius 3, height 4", "Cone with radius 4, height 3", "Sphere"], 1, "The leg it spins around is the height; the other leg is the radius."],
      ["Wood has density 0.6 g/cm³. A block is 10 × 5 × 4 cm. What is its mass?", ["120 g", "200 g", "333 g", "12 g"], 0, "Volume 200 cm³ × 0.6 = 120 g."],
    ],
  },
  {
    id: "geo-constructions", subject: "math", course: "Geometry", grades: [10], unit: "Constructions", name: "Constructions & Quadrilaterals",
    desc: "Compass-and-straightedge constructions and properties of quadrilaterals.",
    gen: [], tags: ["regents-geo"],
    cards: [
      ["Perpendicular bisector", "Two arcs from each endpoint, connect the intersections."],
      ["Equilateral triangle", "Compass set to the segment length, arc from each end, connect to the intersection."],
      ["Inscribed hexagon", "Keep the compass at the radius and step around the circle 6 times."],
      ["Parallelogram properties", "Opposite sides equal and parallel; opposite angles equal; diagonals bisect each other."],
      ["Rhombus diagonals", "Perpendicular, and they bisect the angles."],
      ["Rectangle diagonals", "Congruent."],
    ],
    qs: [
      ["Which quadrilateral always has perpendicular diagonals?", ["Rectangle", "Parallelogram", "Rhombus", "Trapezoid"], 2, "Rhombus (and square) diagonals are perpendicular."],
    ],
  },

  // ---------------- ALGEBRA II ----------------
  {
    id: "a2-polynomials", subject: "math", course: "Algebra II", grades: [11], unit: "Polynomials & Rational Functions", name: "Polynomial Functions",
    desc: "End behavior, zeros and multiplicity, the remainder theorem, and polynomial division.",
    gen: ["factoring", "quadratic-roots"], tags: ["regents-alg2"],
    cards: [
      ["Remainder theorem", "p(a) = the remainder when p(x) is divided by (x − a)."],
      ["Factor theorem", "If p(a) = 0, then (x − a) is a factor."],
      ["Multiplicity", "Odd multiplicity → crosses the x-axis. Even → touches and turns."],
      ["End behavior", "Determined by the leading term: even degree → ends same direction; odd → opposite."],
      ["Sum/difference of cubes", "a³ ± b³ = (a ± b)(a² ∓ ab + b²)."],
      ["Factor by grouping", "x³ + 2x² − 9x − 18 = x²(x + 2) − 9(x + 2) = (x² − 9)(x + 2)."],
    ],
    qs: [
      ["What is the remainder when x³ − 2x² + 4 is divided by x − 3?", ["13", "4", "−5", "31"], 0, "p(3) = 27 − 18 + 4 = 13."],
      ["Which is a factor of x³ − 4x² − x + 4?", ["x + 4", "x − 1", "x − 2", "x + 2"], 1, "p(1) = 1 − 4 − 1 + 4 = 0, so (x − 1) is a factor."],
      ["The graph of y = (x − 2)²(x + 1) at x = 2…", ["crosses the x-axis", "touches and turns", "has a vertical asymptote", "has a hole"], 1, "Multiplicity 2 (even) → bounces."],
    ],
  },
  {
    id: "a2-rational", subject: "math", course: "Algebra II", grades: [11], unit: "Rational & Radical Equations", name: "Rational & Radical Equations",
    desc: "Simplify rational expressions, solve rational and radical equations, check for extraneous solutions.",
    gen: [], tags: ["regents-alg2"],
    cards: [
      ["Extraneous solution", "A solution that appears algebraically but doesn't work in the original equation. Always check!"],
      ["Solving rational equations", "Multiply every term by the LCD, solve, then check for zero denominators."],
      ["Solving radical equations", "Isolate the radical, square both sides, solve, then check."],
      ["Rational exponents", "x^(m/n) = ⁿ√(xᵐ). 8^(2/3) = 4."],
    ],
    qs: [
      ["Solve: √(x + 6) = x", ["x = 3", "x = −2", "x = 3 and x = −2", "No solution"], 0, "x + 6 = x² → (x − 3)(x + 2) = 0. Check: x = −2 gives √4 = 2 ≠ −2, so it's extraneous."],
      ["Evaluate 16^(3/4)", ["12", "8", "6", "64"], 1, "⁴√16 = 2, and 2³ = 8."],
    ],
  },
  {
    id: "a2-complex", subject: "math", course: "Algebra II", grades: [11], unit: "Complex Numbers", name: "Complex Numbers",
    desc: "i, operations with complex numbers, and complex roots of quadratics.",
    gen: ["complex"], tags: ["regents-alg2", "sat"],
    cards: [
      ["i", "i = √−1, so i² = −1."],
      ["Powers of i", "Cycle every 4: i, −1, −i, 1. Divide the exponent by 4 and use the remainder."],
      ["Complex conjugate", "a + bi and a − bi. Their product is a² + b² (a real number)."],
      ["Complex roots", "If the discriminant is negative, roots are a ± bi."],
    ],
    qs: [
      ["Simplify i²³", ["i", "−1", "−i", "1"], 2, "23 ÷ 4 has remainder 3, so i²³ = i³ = −i."],
      ["Solve x² + 2x + 5 = 0", ["x = −1 ± 2i", "x = 1 ± 2i", "x = −1 ± 4i", "x = −2 ± i"], 0, "x = (−2 ± √(4 − 20))/2 = (−2 ± 4i)/2 = −1 ± 2i."],
    ],
  },
  {
    id: "a2-exp-log", subject: "math", course: "Algebra II", grades: [11, 12], unit: "Exponential & Logarithmic Functions", name: "Exponentials & Logarithms",
    desc: "Log rules, solving exponential equations, e, and compound interest.",
    gen: ["logarithms", "exponential"], tags: ["regents-alg2"],
    cards: [
      ["Log definition", "log_b(y) = x means bˣ = y."],
      ["Product / quotient rules", "log(MN) = log M + log N. log(M/N) = log M − log N."],
      ["Power rule", "log(Mᵏ) = k·log M."],
      ["Compound interest", "A = P(1 + r/n)ⁿᵗ"],
      ["Continuous growth", "A = Pe^(rt)"],
      ["Solving 5ˣ = 30", "x = log 30 / log 5 ≈ 2.113."],
    ],
    qs: [
      ["$1,000 is invested at 4% compounded monthly. Which expression gives the amount after 10 years?", ["1000(1.04)¹⁰", "1000(1 + 0.04/12)¹²⁰", "1000(1 + 0.04)¹²⁰", "1000e^(0.4)"], 1, "A = P(1 + r/n)ⁿᵗ with n = 12, t = 10."],
      ["Solve: 2ˣ = 20 (to the nearest hundredth)", ["4.32", "10.00", "3.32", "4.00"], 0, "x = log 20 / log 2 ≈ 4.32."],
      ["Which is equivalent to log 3 + 2 log x?", ["log(6x)", "log(3x²)", "log(3 + x²)", "2 log(3x)"], 1, "2 log x = log x², then add: log(3x²)."],
    ],
  },
  {
    id: "a2-trig", subject: "math", course: "Algebra II", grades: [11], unit: "Trigonometric Functions", name: "Unit Circle & Trig Functions",
    desc: "Radians, the unit circle, graphing sine and cosine, amplitude, period and midline.",
    gen: [], tags: ["regents-alg2"],
    cards: [
      ["Radians", "180° = π radians. Multiply degrees by π/180."],
      ["Unit circle", "Point on the circle at angle θ is (cos θ, sin θ)."],
      ["Pythagorean identity", "sin²θ + cos²θ = 1"],
      ["Amplitude", "In y = A sin(Bx) + D, amplitude = |A|."],
      ["Period", "2π/B"],
      ["Midline", "y = D"],
      ["ASTC", "All, Sine, Tangent, Cosine are positive in Quadrants I, II, III, IV."],
    ],
    qs: [
      ["What is the period of y = 3 sin(4x) − 1?", ["π/2", "4", "2π", "8π"], 0, "Period = 2π/4 = π/2."],
      ["If sin θ = 3/5 and θ is in Quadrant II, cos θ = ?", ["4/5", "−4/5", "−3/5", "5/4"], 1, "sin² + cos² = 1 → cos² = 16/25; cosine is negative in Q II."],
      ["Convert 150° to radians.", ["5π/6", "3π/4", "5π/3", "π/6"], 0, "150 × π/180 = 5π/6."],
    ],
  },
  {
    id: "a2-series", subject: "math", course: "Algebra II", grades: [11], unit: "Sequences & Series", name: "Series & Sigma Notation",
    desc: "Arithmetic and geometric series, sigma notation, and finite geometric sums.",
    gen: ["sequences"], tags: ["regents-alg2"],
    cards: [
      ["Arithmetic series", "Sₙ = n(a₁ + aₙ)/2"],
      ["Geometric series", "Sₙ = a₁(1 − rⁿ)/(1 − r) — on the Regents reference sheet."],
      ["Sigma notation", "Σ means 'add up'. Σ from k=1 to 4 of 2k = 2 + 4 + 6 + 8 = 20."],
    ],
    qs: [
      ["Find the sum of the first 6 terms of 3, 6, 12, …", ["189", "96", "192", "63"], 0, "S₆ = 3(1 − 2⁶)/(1 − 2) = 3(63) = 189."],
    ],
  },
  {
    id: "a2-stats", subject: "math", course: "Algebra II", grades: [11, 12], unit: "Statistical Inference", name: "Normal Distribution & Statistical Inference",
    desc: "Normal curves, z-scores, margin of error, simulations, and study types.",
    gen: [], tags: ["regents-alg2", "sat"],
    cards: [
      ["Empirical rule", "68% within 1 SD, 95% within 2 SD, 99.7% within 3 SD of the mean."],
      ["z-score", "z = (x − μ)/σ"],
      ["Margin of error (≈95%)", "About ±2 standard deviations of the simulated sample statistic."],
      ["Observational study vs. experiment", "Experiments impose a treatment with random assignment and can show cause & effect; observational studies can't."],
      ["Survey bias", "Samples must be random. Voluntary-response samples are biased."],
      ["Conditional probability", "P(A | B) = P(A and B) / P(B)."],
    ],
    qs: [
      ["Scores are normal with mean 70 and SD 8. About what percent score between 62 and 78?", ["50%", "68%", "95%", "34%"], 1, "62 to 78 is within 1 SD of the mean."],
      ["To show a new drug CAUSES better sleep, you should use…", ["a survey", "an observational study", "a randomized controlled experiment", "a census"], 2, "Only randomized experiments establish causation."],
      ["P(A) = 0.5, P(B) = 0.4, P(A and B) = 0.2. Are A and B independent?", ["Yes", "No"], 0, "0.5 × 0.4 = 0.2 = P(A and B), so independent."],
    ],
  },

  // ---------------- PRECALC / CALCULUS ----------------
  {
    id: "pc-functions", subject: "math", course: "Precalculus & Calculus", grades: [12], unit: "Functions", name: "Inverse & Composite Functions",
    desc: "Composition, inverse functions, and function transformations.",
    gen: ["function-eval"], tags: ["regents-alg2"],
    cards: [
      ["Composition", "(f ∘ g)(x) = f(g(x)). Work inside-out."],
      ["Inverse function", "Swap x and y, then solve for y. Graph reflects over y = x."],
      ["One-to-one", "Passes the horizontal line test → has an inverse function."],
    ],
    qs: [
      ["f(x) = 2x + 1, g(x) = x². Find f(g(3)).", ["19", "49", "10", "13"], 0, "g(3) = 9, f(9) = 19."],
      ["Find the inverse of f(x) = (x − 4)/3.", ["3x + 4", "3x − 4", "(x + 4)/3", "3/(x − 4)"], 0, "x = (y − 4)/3 → y = 3x + 4."],
    ],
  },
  {
    id: "pc-limits", subject: "math", course: "Precalculus & Calculus", grades: [12], unit: "Limits & Derivatives", name: "Limits & Derivatives (Intro Calculus)",
    desc: "What a limit means, the power rule, and derivatives as slope.",
    gen: ["derivative"], tags: ["calc"],
    cards: [
      ["Limit", "The value f(x) approaches as x approaches a number."],
      ["Derivative", "Instantaneous rate of change; the slope of the tangent line."],
      ["Power rule", "d/dx[xⁿ] = n·xⁿ⁻¹"],
      ["Derivative of sin and cos", "d/dx[sin x] = cos x; d/dx[cos x] = −sin x"],
      ["Derivative of eˣ", "eˣ (it's its own derivative)."],
      ["Critical points", "Where f′(x) = 0 or is undefined — candidates for max/min."],
    ],
    qs: [
      ["lim (x→3) (x² − 9)/(x − 3) = ?", ["0", "6", "Undefined", "3"], 1, "Factor: (x + 3)(x − 3)/(x − 3) = x + 3 → 6."],
      ["The slope of y = x³ at x = 2 is…", ["8", "12", "6", "4"], 1, "y′ = 3x² = 12."],
    ],
  },
  {
    id: "pc-integrals", subject: "math", course: "Precalculus & Calculus", grades: [12], unit: "Integrals", name: "Intro to Integrals",
    desc: "Antiderivatives and area under a curve.",
    gen: [], tags: ["calc"],
    cards: [
      ["Antiderivative", "∫xⁿ dx = xⁿ⁺¹/(n + 1) + C (n ≠ −1)"],
      ["Definite integral", "∫ₐᵇ f(x) dx = F(b) − F(a): the net area under the curve."],
      ["+ C", "Indefinite integrals need a constant of integration."],
    ],
    qs: [
      ["∫₀² 3x² dx = ?", ["8", "12", "6", "4"], 0, "Antiderivative x³; 2³ − 0³ = 8."],
    ],
  },

  // ---------------- SHSAT / TACHS SKILLS ----------------
  {
    id: "m-word-problems", subject: "math", course: "Test Skills", grades: [7, 8], unit: "Problem Solving", name: "SHSAT Word Problems: Rates, Averages & Work",
    desc: "The classic SHSAT word-problem types: distance-rate-time, averages, consecutive integers, and work rates.",
    gen: ["rate-time", "consecutive-avg", "percent-change"], tags: ["shsat", "tachs"],
    cards: [
      ["Distance formula", "d = r × t. Organize in a table: rate | time | distance."],
      ["Average", "Average = sum ÷ count, so sum = average × count. Most average problems are really sum problems."],
      ["Work problems", "Rates add: if A does a job in a hours and B in b hours, together: 1/a + 1/b = 1/t."],
      ["Consecutive integers", "n, n + 1, n + 2. Consecutive even/odd: n, n + 2, n + 4."],
      ["Plug in answers", "On multiple choice, try the middle answer choice first and adjust up or down."],
    ],
    qs: [
      ["Pipe A fills a pool in 6 hours, Pipe B in 3 hours. Together they take…", ["4.5 hours", "2 hours", "9 hours", "1.5 hours"], 1, "1/6 + 1/3 = 1/2 pool per hour → 2 hours."],
      ["The average of 5 numbers is 12. One number is removed and the average becomes 10. Which number was removed?", ["2", "20", "12", "22"], 1, "Sum 60 → sum of 4 numbers is 40. Removed: 20."],
    ],
  },
  {
    id: "m-number-theory", subject: "math", course: "Test Skills", grades: [6, 7, 8], unit: "Number Sense", name: "Number Theory: Primes, Factors & Divisibility",
    desc: "Primes, GCF/LCM, divisibility rules, remainders and digit patterns — SHSAT favorites.",
    gen: ["gcf-lcm", "number-theory"], tags: ["shsat", "tachs"],
    cards: [
      ["Prime number", "Exactly two factors: 1 and itself. 2 is the only even prime. 1 is NOT prime."],
      ["Divisibility by 3 / 9", "Sum of digits divisible by 3 / 9."],
      ["Divisibility by 4", "Last two digits divisible by 4."],
      ["Divisibility by 6", "Divisible by both 2 and 3."],
      ["GCF × LCM", "For two numbers, GCF × LCM = the product of the numbers."],
      ["Prime factorization", "Write as a product of primes: 360 = 2³ × 3² × 5."],
      ["Number of factors", "From 2ᵃ × 3ᵇ × 5ᶜ: (a+1)(b+1)(c+1). 360 has 4×3×2 = 24 factors."],
    ],
    qs: [
      ["What is the smallest positive integer divisible by 4, 6 and 10?", ["60", "120", "240", "30"], 0, "LCM(4, 6, 10) = 60."],
      ["Which number is divisible by 9?", ["4,512", "7,282", "3,456", "1,234"], 2, "3 + 4 + 5 + 6 = 18, divisible by 9."],
      ["How many positive factors does 72 have?", ["8", "12", "6", "10"], 1, "72 = 2³ × 3² → (3+1)(2+1) = 12."],
    ],
  },
];
