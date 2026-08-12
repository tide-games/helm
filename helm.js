// helm.js — pure wheel maths for The Helm.
//
// Fleet discipline: no DOM, no clock, no network, no crypto. Callers supply
// hex seeds; everything here is a pure function of its arguments.
//
// THE WHEEL: European single-zero roulette on a ship's helm — 37 pockets,
// one block turns it. The spin is the fleet's simplest fair roll:
//     number = BigInt(seed) mod 37
// and every bet on the felt resolves from that one number. Many bets, one
// outcome, one seed — a bet PORTFOLIO pattern, new to the fleet.
//
// THE EDGE is the classic's own: every bet type returns exactly 36/37 of
// its stake in expectation — a 1/37 ≈ 2.70% edge, identical across the
// whole felt, enforced in tests by enumerating all 37 outcomes against
// every legal bet. No tuning, no solver: the eighteenth century did the
// maths and we merely refuse to bend it.

export const POCKETS = 37;

// The wheel's physical order, clockwise from zero — European standard.
// Order is protocol (the ball animation walks it); append-only, never edit.
export const WHEEL = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30,
  8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7,
  28, 12, 35, 3, 26,
];

export const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export const colorOf = (n) => n === 0 ? 'zero' : REDS.has(n) ? 'red' : 'black';

// ---------------------------------------------------------------- the spin

export function spinFromSeed(seedHex) {
  const clean = String(seedHex).replace(/[^0-9a-fA-F]/g, '');
  if (!clean.length) throw new Error('spinFromSeed: empty hex');
  return Number(BigInt('0x' + clean) % BigInt(POCKETS));
}

// ---------------------------------------------------------------- the felt
//
// Layout grid: 12 rows × 3 columns; row r holds 3r-2, 3r-1, 3r
// (column 1 = left, column 3 = right); zero heads the table.

const row = (n) => Math.ceil(n / 3);
const col = (n) => ((n - 1) % 3) + 1;

// Every legal bet, generated from the layout — the validator IS the felt.
export function legalSelections(type) {
  const out = [];
  if (type === 'straight') { for (let n = 0; n <= 36; n++) out.push([n]); }
  if (type === 'split') {
    for (let n = 1; n <= 36; n++) {
      if (col(n) < 3) out.push([n, n + 1]);            // horizontal
      if (row(n) < 12) out.push([n, n + 3]);           // vertical
    }
    out.push([0, 1], [0, 2], [0, 3]);                  // the zero splits
  }
  if (type === 'street') { for (let r = 1; r <= 12; r++) out.push([3 * r - 2, 3 * r - 1, 3 * r]); }
  if (type === 'corner') {
    for (let n = 1; n <= 36; n++) {
      if (col(n) < 3 && row(n) < 12) out.push([n, n + 1, n + 3, n + 4]);
    }
    out.push([0, 1, 2, 3]);                            // the basket corner
  }
  if (type === 'sixline') { for (let r = 1; r <= 11; r++) out.push([3 * r - 2, 3 * r - 1, 3 * r, 3 * r + 1, 3 * r + 2, 3 * r + 3]); }
  if (type === 'dozen') { out.push([1], [2], [3]); }
  if (type === 'column') { out.push([1], [2], [3]); }
  if (type === 'red') out.push([1]);
  if (type === 'black') out.push([1]);
  if (type === 'even') out.push([1]);
  if (type === 'odd') out.push([1]);
  if (type === 'low') out.push([1]);
  if (type === 'high') out.push([1]);
  return out;
}

// What a bet covers, or null if illegal. sel is the selection array
// (numbers for inside bets; [1..3] index for dozen/column; [1] for evens).
export function covers(type, sel) {
  const key = JSON.stringify(sel);
  const inside = ['straight', 'split', 'street', 'corner', 'sixline'];
  if (inside.includes(type)) {
    if (!legalSelections(type).some((s) => JSON.stringify(s) === key)) return null;
    return new Set(sel);
  }
  if (type === 'dozen') {
    const d = sel[0]; if (![1, 2, 3].includes(d)) return null;
    return new Set(Array.from({ length: 12 }, (_, i) => (d - 1) * 12 + i + 1));
  }
  if (type === 'column') {
    const c = sel[0]; if (![1, 2, 3].includes(c)) return null;
    return new Set(Array.from({ length: 12 }, (_, i) => c + i * 3));
  }
  if (type === 'red') return new Set([...REDS]);
  if (type === 'black') return new Set(Array.from({ length: 36 }, (_, i) => i + 1).filter((n) => !REDS.has(n)));
  if (type === 'even') return new Set(Array.from({ length: 18 }, (_, i) => (i + 1) * 2));
  if (type === 'odd') return new Set(Array.from({ length: 18 }, (_, i) => i * 2 + 1));
  if (type === 'low') return new Set(Array.from({ length: 18 }, (_, i) => i + 1));
  if (type === 'high') return new Set(Array.from({ length: 18 }, (_, i) => i + 19));
  return null;
}

// Winning payouts, TO ONE (winner also gets the stake back).
export const PAYS = {
  straight: 35, split: 17, street: 11, corner: 8, sixline: 5,
  dozen: 2, column: 2, red: 1, black: 1, even: 1, odd: 1, low: 1, high: 1,
};

// ---------------------------------------------------------------- settling

// bets: [{type, sel, stake}] — stakes are positive integers.
export function settleSpin(bets, seedHex) {
  if (!Array.isArray(bets) || !bets.length) throw new Error('settleSpin: no bets on the felt');
  const number = spinFromSeed(seedHex);
  let totalStake = 0, totalReturn = 0;
  const results = bets.map((b) => {
    if (!Number.isInteger(b.stake) || b.stake <= 0) throw new Error('settleSpin: stake must be a positive integer');
    const c = covers(b.type, b.sel);
    if (!c) throw new Error('settleSpin: illegal bet ' + b.type + ' ' + JSON.stringify(b.sel));
    totalStake += b.stake;
    const win = c.has(number);
    const ret = win ? b.stake * (PAYS[b.type] + 1) : 0;
    totalReturn += ret;
    return { ...b, win, ret };
  });
  return { number, color: colorOf(number), results, totalStake, totalReturn, delta: totalReturn - totalStake };
}

export function verifySpin(bets, seedHex) { return settleSpin(bets, seedHex); }

// Exact EV of one unit on a bet — 36/37 for every legal bet, by enumeration.
export function evOf(type, sel) {
  const c = covers(type, sel);
  if (!c) throw new Error('evOf: illegal bet');
  return (c.size * (PAYS[type] + 1)) / POCKETS;
}
