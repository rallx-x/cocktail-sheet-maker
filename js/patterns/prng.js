// Deterministic PRNG (mulberry32). A new generator is created for every pattern
// render from the stored seed only: rendering never mutates the seed and never
// touches global randomness, so preview, resize, save/load and export all
// reproduce the exact same arrangement.
export function createRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Weighted pick from [value, weight] pairs.
export function pickWeighted(rng, table) {
  let total = 0;
  for (const [, weight] of table) total += weight;
  let roll = rng() * total;
  for (const [value, weight] of table) {
    roll -= weight;
    if (roll < 0) return value;
  }
  return table[table.length - 1][0];
}

// Only for an explicit user action ("다시 뽑기"), never during rendering.
export function makeSeed() {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0];
}
