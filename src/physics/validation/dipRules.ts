/**
 * The dip comes from where the strike came from.
 *
 * WHAT WAS LOOKED AT BEFORE THESE RULES WERE WRITTEN. The round of rules
 * 419 to 426 ran once and was published whole (d4a297c). Laying the
 * footprint on the rupture's surface projection removed the overshoot
 * exactly as the round before it had predicted — the two lower cells went
 * from 1.84x and 1.62x to 1.01x and 0.85x, the bias from 0.393x to 0.865x,
 * the scatter from 1.579 to 1.283 — and it was refused on the largest
 * cell, which fell from 1.273x to 0.731x.
 *
 * Its diagnosis, measured in the same run: of the 20 jury earthquakes at
 * Mw 7.5 and above, eleven have no mechanism in the catalogue, an unknown
 * mechanism is drawn strike-slip, strike-slip means dip 90°, and cos 90 is
 * zero — so their footprint width came out at exactly 0.0 km. They are
 * Peru, Guatemala, the Philippines, Oaxaca: subduction earthquakes,
 * dipping fifteen to twenty-five degrees, handed a vertical fault.
 *
 * Rule 302 reserved this: "it does not touch the dip: the rupture keeps
 * the dip it has today. One change at a time, so that what moves can be
 * attributed. The dip is the next block and it will be measured on its
 * own." This is that block.
 *
 * WHAT THE REPOSITORY ALREADY KNOWS, checked before these rules rather
 * than assumed. Asking `shippedStrikeAnswer` about those same 20
 * earthquakes:
 *
 *   14  sit on a slab — 10 of them answer `interface-depth`, so the
 *       STRIKE they are drawn with already comes from Slab2;
 *    4  answer from a crustal fault that carries a dip: 90°, 84° and 30°
 *       from the GEM database itself, 45° and 30° from a slip type's
 *       median;
 *    2  have no structure at all, and keep what they have.
 *
 *   The crustal half needs no new data: `DecodedFault` has carried
 *   `dipDeg` and `dipFromDatabase` all along — the database's own dip for
 *   10 644 of the 30 811 traces in the tiles, its slip type's median for
 *   the rest — and `StrikeAnswer` already hands the matched fault back.
 *
 *   The slab half needs one grid. Slab2 ships five per zone and
 *   `build-slab2.py` reads three, saying why in its own words: "The dip is
 *   not read, because rule 302 keeps this round out of the dip." The file
 *   is on disk; nothing is downloaded.
 *
 * The rules, fixed on 20 September 2026, numbered after the 426 before
 * them:
 *
 *  427. The candidate. A scenario's dip is the dip of the structure its
 *       STRIKE came from, and the style constant only where no structure
 *       answered:
 *
 *         the strike came from the slab   →  Slab2's dip at that point
 *         the strike came from a fault    →  that fault's `dipDeg`
 *         nothing answered                →  90 / 55 / 45 by style, as now
 *
 *       One answer, as rule 322 asks of the strike: a scenario may not be
 *       drawn along one structure and dipped like another. There is no
 *       free parameter — every number comes from the same two databases
 *       the strike already comes from.
 *
 *  428. The dip arrives the way the strike arrives. `shippedStrikeAnswer`
 *       is a lookup the CALLERS make, not something `simulate.ts` reaches
 *       for, and the strike reaches the simulator as
 *       `strikeAzimuthDeg`. The dip travels the same road, as an input
 *       `dipDeg`, filled from one exported answer so that the globe, the
 *       harness and the benchmarks cannot each find their own.
 *
 *  429. The data, and what it may not disturb. `build-slab2.py` reads the
 *       dip grid and writes it as a SECOND PNG a tile, dip in the red
 *       channel — not as the alpha channel of the tile that exists. The
 *       browser reads these through `getImageData`, which returns
 *       un-premultiplied bytes and rounds when alpha is below 255, so a
 *       dip in alpha would corrupt the strike, the depth and the
 *       uncertainty the same pixel carries. The three-channel tiles must
 *       come out of the rebuild BYTE FOR BYTE as they went in, and a test
 *       says so; the cost in bytes of the new ones is printed.
 *
 *  430. One dip, everywhere. The dip this round installs is the dip the
 *       whole model uses — the footprint's projection, rule 399's top of
 *       rupture, and Campbell & Bozorgnia's dip and hanging-wall terms —
 *       because a scenario has one geometry. Under `boore2014`, which
 *       decides here and reads no dip, only the footprint moves. Under
 *       CB14 more moves, and CB14 decides nothing in this round; its
 *       figures are printed with that said.
 *
 *  431. The jury and the measurement, unchanged from rules 405 to 407,
 *       414 and 422.
 *
 *  432. The arms, three, in one run. The geometry in place; arm B of the
 *       last round — the surface projection with the stadium at every
 *       magnitude, which was the best measured and was refused; and arm C,
 *       which is B with this round's dip. C against B isolates the dip
 *       exactly, because they differ in nothing else.
 *
 *  433. The verdict, the six clauses of rule 424 unchanged and read
 *       against the geometry IN PLACE, not against arm B — B was refused
 *       and is not a baseline. (a) the worst cell improves by the margin;
 *       (b) no cell's |ln bias| grows by more than it; (c) the geometric
 *       mean no further from 1 and the scatter no wider; (d) the dead, no
 *       fewer inside their band and none lost; (e) zero inversions in
 *       magnitude; (f) no cell trades under-drawing for over-drawing
 *       without getting materially closer to centred.
 *
 *  434. One run, no re-tuning. No dip, bound, threshold or fallback is
 *       adjusted after a number is seen. If an arm fails, it is published
 *       as it came out and the geometry in place stays.
 *
 * WHAT THIS ROUND MAY NOT DO, carrying rule 302's own ban forward: the dip
 * decides the GEOMETRY and nothing else. It does not choose a ground-motion
 * law, it does not set the `subductionInterface` flag a reader ticks, and
 * it does not change which structure the strike came from.
 */

export const DIP_RULES = 'rules 427 to 434, fixed 20 September 2026';

/** Rule 427: where a scenario's dip came from. */
export type DipSource = 'slab' | 'fault' | 'style';

/** Rule 429: the dip byte's step, chosen so 0 to 90° fits with room to
 *  spare and the quantisation is far below what the geometry can feel. */
export const DIP_STEP_DEG = 0.5;

/** Rule 429: a dip byte of zero means the cell has no dip, so the scale
 *  starts at one. */
export function decodeDipByte(byte: number): number | null {
  return byte === 0 ? null : (byte - 1) * DIP_STEP_DEG;
}

export function encodeDipDeg(dipDeg: number): number {
  if (!Number.isFinite(dipDeg) || dipDeg < 0) return 0;
  return Math.min(255, Math.round(dipDeg / DIP_STEP_DEG) + 1);
}

/** Rule 427's table, as a function, so the order cannot be argued about
 *  later: the slab first, then the fault, then the style. */
export function dipFor(input: {
  slabDipDeg: number | null;
  faultDipDeg: number | null;
  strikeFromSlab: boolean;
  strikeFromFault: boolean;
  styleDipDeg: number;
}): { dipDeg: number; source: DipSource } {
  if (input.strikeFromSlab && input.slabDipDeg !== null) {
    return { dipDeg: input.slabDipDeg, source: 'slab' };
  }
  if (input.strikeFromFault && input.faultDipDeg !== null) {
    return { dipDeg: input.faultDipDeg, source: 'fault' };
  }
  return { dipDeg: input.styleDipDeg, source: 'style' };
}
