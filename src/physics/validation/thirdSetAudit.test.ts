import { describe, expect, it } from 'vitest';
import { auditThirdSetRun, type ThirdSetRecord } from './thirdSetAudit.js';
import record from './thirdSetRun.json';

describe('rule 1127: the third set’s run audited from its record', () => {
  it('re-derives the frozen judge’s verdict, apart from its functions', () => {
    const audit = auditThirdSetRun(record as unknown as ThirdSetRecord);
    expect(audit.failures).toEqual([]);
    expect(audit.verdict).toEqual({ adoptable: false, o1Improves: false, groundImproves: true });
  });

  it('catches a record altered after the run', () => {
    const altered = structuredClone(record) as unknown as ThirdSetRecord;
    const hamburg = altered.bodies.find((b) => b.event === 'Hamburg');
    if (hamburg !== undefined) hamburg.o1.S.compatible = true;
    expect(auditThirdSetRun(altered).failures.length).toBeGreaterThan(0);
  });
});
