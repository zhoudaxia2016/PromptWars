function getAxis(move) {
  if (move === 'U' || move === 'D') return 'y';
  if (move === 'L' || move === 'R') return 'x';
  if (move === 'F' || move === 'B') return 'z';
  return null;
}

export function generateScramble(length = 20) {
  const moves = ['U', 'D', 'L', 'R', 'F', 'B'];
  const modifiers = ['', "'", '2'];
  const scramble = [];

  let lastAxis = null;

  for (let i = 0; i < length; i++) {
    let availableMoves;
    if (lastAxis === null) {
      availableMoves = moves;
    } else {
      availableMoves = moves.filter(move => {
        const axis = getAxis(move);
        return axis !== lastAxis;
      });
    }

    const move =
      availableMoves[Math.floor(Math.random() * availableMoves.length)];
    const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];

    scramble.push(move + modifier);
    lastAxis = getAxis(move);
  }

  return scramble.join(' ');
}

