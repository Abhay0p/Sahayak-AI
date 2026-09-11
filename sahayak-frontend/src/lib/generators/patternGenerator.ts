export function generatePatternChallenge(difficulty: number) {
  const SHAPES = ['🔴', '🔵', '🟢', '🟡', '⭐', '🔺', '🟦', '🟪', '🟧', '🔷'];
  const NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'X', 'Y', 'Z'];

  const type = Math.random();
  let pool = SHAPES;
  if (difficulty > 2 && type > 0.6) pool = NUMBERS;
  if (difficulty > 3 && type > 0.8) pool = LETTERS;

  // Shuffle pool to pick unique elements
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  const a = shuffled[0];
  const b = shuffled[1];
  const c = shuffled[2];
  const d = shuffled[3];

  let pattern = [];
  let answer = '';
  
  if (difficulty === 1) {
    // A B A B A ? => B
    pattern = [a, b, a, b, a];
    answer = b;
  } else if (difficulty === 2) {
    // A A B A A ? => B
    if (Math.random() > 0.5) {
      pattern = [a, a, b, a, a];
      answer = b;
    } else {
      // A B C A B ? => C
      pattern = [a, b, c, a, b];
      answer = c;
    }
  } else if (difficulty === 3) {
    // A B C A B C A B ? => C
    pattern = [a, b, c, a, b, c, a, b];
    answer = c;
  } else if (difficulty === 4) {
    // A B B C A B B ? => C
    pattern = [a, b, b, c, a, b, b];
    answer = c;
  } else {
    // A B C D A B C ? => D
    pattern = [a, b, c, d, a, b, c];
    answer = d;
  }

  // Generate distractors
  const options = new Set([answer]);
  options.add(a);
  options.add(b);
  if (c) options.add(c);
  if (d) options.add(d);
  
  while(options.size < 4) {
    options.add(pool[Math.floor(Math.random() * pool.length)]);
  }

  return {
    pattern,
    answer,
    options: Array.from(options).sort(() => 0.5 - Math.random())
  };
}
