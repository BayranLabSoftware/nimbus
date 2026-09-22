import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { buildImpactCascade } from '../../physics/cascade.js';
import { IMPACT_PRESETS, simulateImpact } from '../../physics/simulate.js';
import { CascadeTimeline } from './CascadeTimeline.js';

/**
 * The timeline on paper (B-109): a report printed as it opens loses no stage
 * to the on-screen reveal, and carries no note about that reveal.
 */
describe('the cascade timeline in print', () => {
  const stages = buildImpactCascade(simulateImpact(IMPACT_PRESETS.METEOR_CRATER.input));

  it('shows every stage at once, without the reveal’s note', () => {
    const markup = renderToStaticMarkup(
      createElement(CascadeTimeline, { stages, variant: 'print' })
    );
    expect(markup).toContain('data-variant="print"');
    expect(markup).not.toContain('data-visible="false"');
    expect(markup.match(/data-visible="true"/g)?.length).toBe(stages.length);
    expect(markup).not.toContain('cascade.scaleNote');
  });

  it('keeps the reveal on screen', () => {
    const markup = renderToStaticMarkup(createElement(CascadeTimeline, { stages }));
    expect(markup).toContain('data-variant="screen"');
    expect(markup).toContain('cascade.scaleNote');
  });
});
