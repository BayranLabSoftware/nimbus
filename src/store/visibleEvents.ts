/**
 * Which events the site offers.
 *
 * Andrea, 22 September 2026: "on the site they will not be there any more, it
 * will be only for cosmic impacts. Then, once we are at a 9 from a laboratory,
 * we will think about the other modules."
 *
 * So the other four modules — explosions, earthquakes, volcanoes, submarine
 * landslides — are no longer offered: not in the chooser, not through a link,
 * not on the landing page. **Their code is untouched.** They keep their
 * physics, their presets, their tests and their place in the store; what
 * changed is what the site puts in front of a visitor, and this list is the
 * whole of that decision. Reopening a module is adding it back here, and the
 * chooser, the shared links and the landing page follow.
 *
 * The seal of the impacts (`src/seal/`) is what says that hiding the others
 * moved nothing of what an impact answers.
 */

import type { EventType } from './useAppStore.js';

/**
 * Every module the code still holds, hidden ones included. The site does not
 * offer these; the codec, the store and their tests still know them, which is
 * what makes reopening one a line in {@link VISIBLE_EVENT_TYPES} rather than a
 * rewrite.
 */
export const ALL_EVENT_TYPES: readonly EventType[] = [
  'impact',
  'explosion',
  'earthquake',
  'volcano',
  'landslide',
];

/** The events a visitor can run. */
export const VISIBLE_EVENT_TYPES: readonly EventType[] = ['impact'];

/** True where the site offers this event. */
export function isVisibleEventType(type: EventType): boolean {
  return VISIBLE_EVENT_TYPES.includes(type);
}

/** The event the site opens on, and falls back to when a link asks for one it
 *  no longer offers. */
export const DEFAULT_EVENT_TYPE: EventType = VISIBLE_EVENT_TYPES[0] ?? 'impact';
