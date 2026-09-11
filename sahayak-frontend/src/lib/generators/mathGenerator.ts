export function generateMathChallenge(difficulty: number) {
  let a, b, op;
  
  if (difficulty === 1) {
    // Single digit addition
    op = '+';
    a = Math.floor(Math.random() * 9) + 1;
    b = Math.floor(Math.random() * 9) + 1;
  } else if (difficulty === 2) {
    // Single digit addition/subtraction
    const ops = ['+', '-'];
    op = ops[Math.floor(Math.random() * ops.length)];
    a = Math.floor(Math.random() * 15) + 5;
    b = Math.floor(Math.random() * 9) + 1;
  } else if (difficulty === 3) {
    // Two digit addition/subtraction
    const ops = ['+', '-'];
    op = ops[Math.floor(Math.random() * ops.length)];
    a = Math.floor(Math.random() * 40) + 10;
    b = Math.floor(Math.random() * 20) + 10;
  } else if (difficulty === 4) {
    // Mixed with simple multiplication
    const ops = ['+', '-', '*'];
    op = ops[Math.floor(Math.random() * ops.length)];
    if (op === '*') {
      a = Math.floor(Math.random() * 8) + 2;
      b = Math.floor(Math.random() * 8) + 2;
    } else {
      a = Math.floor(Math.random() * 80) + 20;
      b = Math.floor(Math.random() * 50) + 10;
    }
  } else {
    // Advanced mixed
    const ops = ['+', '-', '*', '/'];
    op = ops[Math.floor(Math.random() * ops.length)];
    if (op === '*') {
      a = Math.floor(Math.random() * 12) + 2;
      b = Math.floor(Math.random() * 9) + 2;
    } else if (op === '/') {
      b = Math.floor(Math.random() * 8) + 2;
      const multiplier = Math.floor(Math.random() * 10) + 2;
      a = b * multiplier;
    } else {
      a = Math.floor(Math.random() * 100) + 20;
      b = Math.floor(Math.random() * 100) + 10;
    }
  }

  // Ensure no negative answers for simple math to keep it friendly
  if (op === '-' && b > a) {
    const temp = a;
    a = b;
    b = temp;
  }

  let answer = 0;
  switch(op) {
    case '+': answer = a + b; break;
    case '-': answer = a - b; break;
    case '*': answer = a * b; break;
    case '/': answer = a / b; break;
  }

  return { a, b, op, answer };
}
