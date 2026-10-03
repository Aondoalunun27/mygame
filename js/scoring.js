export function scoreLevel({ levelId, moves, par, seconds, hints }) {
  const score = Math.max(0, 1000 + levelId * 4 - Math.max(0, moves - par) * 24 - seconds * 2 - hints * 65);
  const stars = moves <= par + 1 && hints === 0 ? 3
    : moves <= par * 1.6 + 2 && hints <= 2 ? 2 : 1;
  return { score, stars };
}