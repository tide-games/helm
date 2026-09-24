# The Helm ⎈

**Play: https://tide-games.github.io/helm/** — the tide turns the helm.

European roulette on a ship's helm: 37 pockets around the wheel, a
chart-table felt holding the full book of bets, and **one Blake testnet4
block turning it** — the spin is `blockSeed mod 37`, every bet settles from that
one number, and every spin verifies forever.

- **The classic edge, unbent**: all **155 legal bets** — straights, splits,
  streets, corners (basket included), six-lines, dozens, columns, and the
  even chances — return exactly 36/37 in expectation. **2.70%, identical
  across the whole felt**, enforced in tests by enumerating all 37 outcomes
  against every legal bet. The eighteenth century did the maths; we merely
  refuse to bend it.
- **A bet-portfolio game** (new to the fleet): many bets, one outcome, one
  seed — your whole spread rides a single block in tide mode.
- **The felt knows the law**: splits must be adjacent, corners must share a
  crossing, and illegal selections refuse to settle. Tap a number for a
  straight, its edge for a split, a crossing for a corner, the rail for
  streets (between rows for six lines); the line over the felt names the
  bet under your finger and what it pays.
- **The wheel is choreographed truth**: the pearl's orbit, fall, and bounces
  end at the pocket the seed named before the animation began — the theatre
  is the proof.

## Playing

- **Practice** spins turn at once; **〜 The Tide** commits your whole spread
  to the next Blake testnet4 block (about 20 minutes, one confirmation). The
  spread rides, ghosted on the felt, while you practise; the helm turns in
  front of you when the block lands.
- Tap a pocket on the wheel to bet it and its two neighbours either side, or
  call **Tiers**, **Orphelins** or the **Zero game** in one press.
- **Re-bet & turn** in one press, **×2**, an undo that walks back exactly
  what you did, quick spins after your first, and a tap (or Space) brings the ball home.
- The last thirteen numbers on the table, hot and cold numbers, results
  named bet by bet, a session line, three voyage goals, and a refit when the
  purse runs dry.
- Keyboard play (arrows walk the felt, digits jump to a number, N bets its
  neighbours, B reads your bets; T turns, R re-bets, U undoes),
  screen-reader narration, reduced motion, and a phone layout with the helm
  above the felt.
- **Verify** in the log re-fetches the block and recomputes the spin:
  `sha256(blockHash + "|" + mark) mod 37`.

## Chain

The tide is **Blake testnet4** (txbt4), the BLAKE2b fork of Bitcoin testnet4
at block 150308, read from [mempool.guide](https://mempool.guide/testnet4).
Spins committed before the move settle and verify on plain testnet4
(mempool.space), as they were sealed. A commit whose block never arrives is
refunded after 48 hours, and only once the chain confirms that height is
still unmined.

Pure maths in [`helm.js`](helm.js) · exhaustive [`tests.js`](tests.js) ·
practice money; tide mode spins on the next Blake testnet4 block at one
confirmation. A [tide-games](https://tide-games.github.io/) boat, built in
the fleet playbook: one owner, five critic passes, plateau at 84/100.
