import { EXPLOSION_PRESETS, simulateExplosion } from '../events/explosion/simulate.js';
import type { HobBlastSource, WaterBlastSource } from '../events/explosion/hob.js';
import { HOB_CURVE_CHECKS } from '../events/explosion/hobCurvesData.js';
import { m } from '../units.js';
import {
  HOB_CANDIDATE,
  HOB_GUARD_HEIGHTS_M,
  HOB_GUARD_YIELDS_KT,
  HOB_IN_PLACE,
  HOB_NUKEMAP_KEPT,
  type HobGuardResult,
} from './hobRules.js';

/**
 * Rules 169 to 172 of hobRules.ts, run: the trace's checks, rule 171 (c)'s
 * guard on a grid of yields and heights, and what rule 172 prints — the rings
 * of every explosion preset and of the NUKEMAP cases the campaign kept, under
 * the factor in place and under the book's curves. The release gate, rule 171
 * (b), is the validation report's, and the tolls and the sweep are read there
 * and from scripts/benchmark/invariants.ts.
 */

export interface HobRings {
  fivePsiM: number;
  onePsiM: number;
  halfPsiM: number;
}

function rings(
  yieldKt: number,
  heightM: number,
  source: HobBlastSource,
  chemical = false
): HobRings {
  const r = simulateExplosion({
    yieldMegatons: yieldKt / 1_000,
    heightOfBurst: m(heightM),
    hobBlast: source,
    ...(chemical ? { chargeType: 'chemical' as const } : {}),
  });
  return {
    fivePsiM: Number(r.blast.overpressure5psiRadiusHob),
    onePsiM: Number(r.blast.overpressure1psiRadiusHob),
    halfPsiM: Number(r.blast.lightDamageRadiusHob),
  };
}

/** Rule 169: the checks the trace carries, read back. */
export function hobTracePasses(): boolean {
  const c = HOB_CURVE_CHECKS;
  return (
    c.gridRmsPx <= 2 &&
    c.gridRmsPxB <= 2 &&
    c.raysNotNested.length <= 5 &&
    Math.abs(c.example4psi.reachFt / 2_600 - 1) <= 0.03 &&
    Math.abs(c.example4psi.heightFt / 1_100 - 1) <= 0.1 &&
    c.crossFigure.heights >= 20 &&
    c.crossFigure.worst10 <= 0.06 &&
    c.crossFigure.worst15 <= 0.06 &&
    c.jumpsOver5Percent.length === 0
  );
}

/** Rule 171 (c). */
export function hobGuard(source: HobBlastSource = HOB_CANDIDATE): HobGuardResult & {
  examples: string[];
} {
  let cases = 0;
  let notFinite = 0;
  let outOfOrder = 0;
  let shrinksWithYield = 0;
  const examples: string[] = [];
  for (const chemical of [false, true]) {
    for (const h of HOB_GUARD_HEIGHTS_M) {
      let prev: HobRings | null = null;
      for (const y of HOB_GUARD_YIELDS_KT) {
        const r = rings(y, h, source, chemical);
        cases++;
        const all = [r.fivePsiM, r.onePsiM, r.halfPsiM];
        if (all.some((x) => !Number.isFinite(x) || x < 0)) {
          notFinite++;
          if (examples.length < 12)
            examples.push(`not finite: ${y.toString()} kt at ${h.toString()} m`);
        }
        if (r.fivePsiM > r.onePsiM * (1 + 1e-9) || r.onePsiM > r.halfPsiM * (1 + 1e-9)) {
          outOfOrder++;
          if (examples.length < 12)
            examples.push(
              `out of order: ${y.toString()} kt at ${h.toString()} m ${JSON.stringify(r)}`
            );
        }
        if (prev !== null) {
          const shrinks =
            r.fivePsiM < prev.fivePsiM * (1 - 1e-9) ||
            r.onePsiM < prev.onePsiM * (1 - 1e-9) ||
            r.halfPsiM < prev.halfPsiM * (1 - 1e-9);
          if (shrinks) {
            shrinksWithYield++;
            if (examples.length < 12)
              examples.push(
                `shrinks: ${y.toString()} kt at ${h.toString()} m ${chemical ? 'chemical' : 'nuclear'}`
              );
          }
        }
        prev = r;
      }
    }
  }
  return { cases, notFinite, outOfOrder, shrinksWithYield, examples };
}

export interface HobRow {
  name: string;
  yieldKt: number;
  heightOfBurstM: number;
  chemical: boolean;
  inPlace: HobRings;
  candidate: HobRings;
}

/** Rule 172: every explosion preset under both sources. */
export function hobPresetRows(): HobRow[] {
  return Object.values(EXPLOSION_PRESETS).map((p) => {
    const input = p.input as {
      yieldMegatons: number;
      heightOfBurst?: number;
      chargeType?: string;
    };
    const y = input.yieldMegatons * 1_000;
    const h = input.heightOfBurst ?? 0;
    const chemical = input.chargeType === 'chemical';
    return {
      name: p.name,
      yieldKt: y,
      heightOfBurstM: h,
      chemical,
      inPlace: rings(y, h, HOB_IN_PLACE, chemical),
      candidate: rings(y, h, HOB_CANDIDATE, chemical),
    };
  });
}

/** Rule 172: the NUKEMAP rings the campaign kept, beside both sources'. */
export function hobNukemapRows(
  cases: readonly { id: string; yieldKt: number; heightOfBurstM: number }[]
): { caseId: string; psi: number; nukemapM: number; inPlaceM: number; candidateM: number }[] {
  return HOB_NUKEMAP_KEPT.map((k) => {
    const c = cases.find((x) => x.id === k.caseId);
    const y = c?.yieldKt ?? Number.NaN;
    const h = c?.heightOfBurstM ?? Number.NaN;
    const pick = (r: HobRings): number => (k.psi === 1 ? r.onePsiM : r.fivePsiM);
    return {
      caseId: k.caseId,
      psi: k.psi,
      nukemapM: k.nukemapM,
      inPlaceM: pick(rings(y, h, HOB_IN_PLACE)),
      candidateM: pick(rings(y, h, HOB_CANDIDATE)),
    };
  });
}

/** Rule 176 (a): for each yield, how much a burst a millimetre under the water
 *  and the same burst on its surface differ, ring by ring, beyond the depth
 *  factor's own departure from one. */
export function hobWaterline(source: WaterBlastSource): {
  worstExcessStep: number;
  rows: { yieldKt: number; stepFivePsi: number; stepOnePsi: number; stepHalfPsi: number }[];
} {
  let worst = 0;
  const rows = HOB_GUARD_YIELDS_KT.map((y) => {
    const base = {
      yieldMegatons: y / 1_000,
      waterDepth: m(100),
      waterBlast: source,
    };
    const surface = simulateExplosion({ ...base, heightOfBurst: m(0) });
    const under = simulateExplosion({ ...base, heightOfBurst: m(-0.001) });
    const depthFactor = under.placement.airBlastDepthFactor ?? 1;
    const step = (a: number, b: number): number => (b > 0 ? a / b - 1 : 0);
    const s5 = step(
      Number(under.blast.overpressure5psiRadiusHob),
      Number(surface.blast.overpressure5psiRadiusHob)
    );
    const s1 = step(
      Number(under.blast.overpressure1psiRadiusHob),
      Number(surface.blast.overpressure1psiRadiusHob)
    );
    const sh = step(
      Number(under.blast.lightDamageRadiusHob),
      Number(surface.blast.lightDamageRadiusHob)
    );
    const allowed = Math.abs(depthFactor - 1);
    for (const x of [s5, s1, sh]) worst = Math.max(worst, Math.abs(x) - allowed);
    return { yieldKt: y, stepFivePsi: s5, stepOnePsi: s1, stepHalfPsi: sh };
  });
  return { worstExcessStep: Math.max(0, worst), rows };
}
