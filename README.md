# The Helm ⎈

**Play: https://tide-games.github.io/helm/** — the tide turns the helm.

European roulette on a ship's helm: 37 pockets around the wheel, a
chart-table felt holding the full book of bets, and **one Bitcoin block
turning it** — the spin is `blockSeed mod 37`, every bet settles from that
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
  crossing, and illegal selections refuse to settle. Click cell centres for
  straights, edges for splits, crossings for corners, the rail for streets.
- **The wheel is choreographed truth**: the pearl's orbit, fall, and bounces
  end at the pocket the seed named before the animation began — the theatre
  is the proof.

Pure maths in [`helm.js`](helm.js) · exhaustive [`tests.js`](tests.js) ·
practice money; tide mode spins on the next testnet4 block at one
confirmation. A [tide-games](https://tide-games.github.io/) boat, built in
the fleet playbook: one owner, five critic passes, plateau at 84/100.
