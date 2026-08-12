// tests.js — run: node tests.js  (exits non-zero on failure)
import { createHash } from 'node:crypto';
import {
  POCKETS, WHEEL, REDS, colorOf, spinFromSeed, legalSelections, covers,
  PAYS, settleSpin, verifySpin, evOf,
} from './helm.js';

let fails = 0;
function ok(cond, name, detail) {
  if (cond) console.log('  ok ', name);
  else { fails++; console.error('  FAIL', name, detail ?? ''); }
}
const sha256 = (s) => createHash('sha256').update(s).digest('hex');

// ---- the wheel itself
{
  ok(WHEEL.length === 37 && new Set(WHEEL).size === 37
    && WHEEL.every((n) => n >= 0 && n <= 36), 'the wheel holds every number exactly once');
  ok(WHEEL[0] === 0, 'zero heads the wheel');
  ok(REDS.size === 18, 'eighteen reds');
  ok(colorOf(0) === 'zero' && colorOf(32) === 'red' && colorOf(26) === 'black',
    'colors follow the standard');
  // reds and blacks alternate around the physical wheel (zero aside) — the
  // real wheel's defining property
  let alt = true;
  for (let i = 1; i < 37; i++) {
    const a = colorOf(WHEEL[i]), b = colorOf(WHEEL[i % 36 + 1] ?? WHEEL[1]);
    if (i < 36 && colorOf(WHEEL[i]) === colorOf(WHEEL[i + 1])) alt = false;
  }
  ok(alt, 'reds and blacks alternate around the rim');
}

// ---- the spin convention
{
  ok(spinFromSeed('0') === 0 && spinFromSeed('24') === 36 && spinFromSeed('25') === 0,
    'spin is BigInt mod 37 (0x24 = 36, 0x25 wraps)');
  ok(spinFromSeed(sha256('tide')) === spinFromSeed(sha256('tide')), 'the same seed spins the same number');
}

// ---- the felt: every legal bet, exact EV 36/37, by full enumeration
{
  const types = ['straight', 'split', 'street', 'corner', 'sixline', 'dozen', 'column',
    'red', 'black', 'even', 'odd', 'low', 'high'];
  let bets = 0, allExact = true, badBet = null;
  for (const t of types) {
    for (const sel of legalSelections(t)) {
      bets++;
      // enumerate all 37 outcomes with a real settle
      let total = 0;
      for (let n = 0; n <= 36; n++) {
        // craft a seed that spins n: hex of n works (n < 37 < 0x25... careful: hex)
        const seed = n.toString(16);
        const s = settleSpin([{ type: t, sel, stake: 37 }], seed);
        if (s.number !== n) { allExact = false; badBet = 'seed craft failed'; break; }
        total += s.results[0].ret;
      }
      if (total !== 36 * 37) { allExact = false; badBet = t + ' ' + JSON.stringify(sel) + ' → ' + total; break; }
      if (Math.abs(evOf(t, sel) - 36 / 37) > 1e-12) { allExact = false; badBet = 'evOf ' + t; break; }
    }
    if (!allExact) break;
  }
  ok(allExact, `HOUSE RULE: every one of the ${bets} legal bets returns exactly 36/37 — edge 2.70% across the whole felt`, badBet);
  ok(bets === 37 + 60 + 12 + 23 + 11 + 3 + 3 + 6, 'the felt holds the full European book of bets', bets);
}

// ---- legality: the felt refuses what the layout forbids
{
  ok(covers('split', [1, 3]) === null, 'a split across the row gap is refused (1-3)');
  ok(covers('split', [3, 4]) === null, 'a split around the row edge is refused (3-4)');
  ok(covers('split', [0, 1]) !== null && covers('split', [0, 3]) !== null, 'the zero splits are legal');
  ok(covers('corner', [0, 1, 2, 3]) !== null, 'the basket corner is legal');
  ok(covers('corner', [2, 3, 5, 6]) !== null && covers('corner', [3, 4, 6, 7]) === null,
    'corners respect the columns');
  ok(covers('straight', [37]) === null && covers('dozen', [4]) === null, 'nonsense selections are refused');
  let threw = false;
  try { settleSpin([{ type: 'split', sel: [1, 3], stake: 10 }], 'ff'); } catch { threw = true; }
  ok(threw, 'an illegal bet refuses to settle');
  threw = false;
  try { settleSpin([{ type: 'red', sel: [1], stake: 0 }], 'ff'); } catch { threw = true; }
  ok(threw, 'a zero stake refuses to settle');
}

// ---- the portfolio settle: many bets, one number, exact books
{
  // spin 17 (0x11): red 17? 17 is black. street [16,17,18] wins, red loses,
  // straight 17 wins, dozen 2 wins, column 2 (17 = col 2) wins
  const bets = [
    { type: 'straight', sel: [17], stake: 10 },
    { type: 'red', sel: [1], stake: 20 },
    { type: 'street', sel: [16, 17, 18], stake: 30 },
    { type: 'dozen', sel: [2], stake: 40 },
    { type: 'column', sel: [2], stake: 50 },
  ];
  const s = settleSpin(bets, '11');
  ok(s.number === 17 && s.color === 'black', 'the crafted seed spins 17 black');
  ok(s.results[0].ret === 360 && s.results[1].ret === 0 && s.results[2].ret === 360
    && s.results[3].ret === 120 && s.results[4].ret === 150,
    'each bet settles at its book price', JSON.stringify(s.results.map((r) => r.ret)));
  ok(s.totalStake === 150 && s.totalReturn === 990 && s.delta === 840,
    'the portfolio books balance to the coin');
  const v = verifySpin(bets, '11');
  ok(JSON.stringify(v) === JSON.stringify(s), 'a spin replays identically');
}

// ---- spin distribution sanity (mod bias is < 2^-250 for sha256 seeds)
{
  const counts = Array(37).fill(0);
  const N = 37000;
  for (let i = 0; i < N; i++) counts[spinFromSeed(sha256('spin' + i))]++;
  const exp = N / 37, tol = 5 * Math.sqrt(exp);
  ok(counts.every((c) => Math.abs(c - exp) < tol), '37k spins land uniform (5σ)',
    JSON.stringify([Math.min(...counts), Math.max(...counts)]));
}

if (fails) { console.error(`\n${fails} FAILURE(S)`); process.exit(1); }
console.log('\nall tests pass');
