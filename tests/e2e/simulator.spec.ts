import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Simulator-flow smoke tests. Every test runs with
 * `prefers-reduced-motion: reduce` so the ~1.5 s Globe↔Stage crossfade
 * collapses to an instant mode swap — without this the launch button /
 * panel assertions would race the animation.
 *
 * These tests deliberately avoid clicking on the Cesium globe itself:
 * headless Chromium's WebGL canvas is unreliable to hit at precise
 * coordinates, and the viewport size drift would make the pick-point
 * test flaky. Store-driven assertions cover the same state transitions.
 */
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

/**
 * The simulator panel ships default-collapsed on narrow viewports
 * (Pixel 7, iPhone 14) so the globe stays reachable for the
 * pick-a-location gesture. Every assertion that touches the panel
 * body (Launch button, preset dropdown, Copy link, …) calls this
 * first so the same test suite runs unchanged against the desktop
 * and mobile projects.
 */
async function expandSimulatorPanelIfCollapsed(page: Page): Promise<void> {
  // Wait for the panel landmark first — the goto can resolve before
  // React mounts the simulator UI on slower CI runners, in which
  // case the toggle button doesn't exist yet.
  await expect(page.getByRole('complementary', { name: 'Simulator controls' })).toBeVisible();

  // The mobile-only toggle is `display: none` on desktop and only
  // `display: inline-flex` under `@media (max-width: 767px)`. On a
  // slow mobile-chrome CI runner the CSS-module stylesheet can still
  // be in flight when we reach this point, so a one-shot `isVisible`
  // check would return false and we'd skip the expand step entirely —
  // the body assertions downstream then time out against a hidden
  // panel. Reading the live viewport width tells us whether the
  // toggle is *expected* to render so we can wait the proper way.
  const viewport = page.viewportSize();
  const isNarrowViewport = viewport !== null && viewport.width < 768;
  if (!isNarrowViewport) return;

  const expandButton = page.getByRole('button', { name: 'Expand simulator panel' });
  // Auto-waits for visibility; covers the race where CSS modules /
  // React commit haven't finished by the time we get here.
  await expect(expandButton).toBeVisible();
  await expandButton.click();
  await expect(page.getByRole('button', { name: 'Collapse simulator panel' })).toBeVisible();
}

test.describe('simulator flow', () => {
  test('landing → globe mode: Try-the-simulator CTA mounts the panel', async ({ page }) => {
    await page.goto('/?lng=en');

    await page.getByRole('button', { name: 'Try the simulator →' }).click();

    const panel = page.getByRole('complementary', { name: 'Simulator controls' });
    await expect(panel).toBeVisible();

    await expandSimulatorPanelIfCollapsed(page);

    // Launch is disabled until the user picks a location on the globe.
    const launchButton = page.getByRole('button', { name: 'Launch simulation' });
    await expect(launchButton).toBeVisible();
    await expect(launchButton).toBeDisabled();

    // The waiting-state status message tells the user what to do next.
    await expect(page.getByRole('status')).toContainText('Click anywhere on the globe');
  });

  test('About dialog opens via Radix, closes with Escape', async ({ page }) => {
    await page.goto('/?lng=en');
    await page.getByRole('button', { name: 'Try the simulator →' }).click();
    // The About / Glossary triggers are floating buttons OUTSIDE the
    // simulator panel (top-left on every viewport — see
    // AboutDialog.module.css). We deliberately do NOT expand the
    // panel here: on narrow viewports the expanded panel covers the
    // bottom-left quadrant, but the triggers live at the TOP, so
    // they're reachable whether the panel is collapsed or expanded.

    // Radix renders the trigger with role="button".
    await page.getByRole('button', { name: 'About' }).click();

    // Radix announces the dialog with role="dialog" and aria-labelledby.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Collins, Melosh & Marcus');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('Glossary dialog surfaces term definitions', async ({ page }) => {
    await page.goto('/?lng=en');
    await page.getByRole('button', { name: 'Try the simulator →' }).click();
    // Same as About: trigger lives outside the panel at top-left,
    // so no panel expansion is required.

    await page.getByRole('button', { name: 'Glossary' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Glossary of terms');
    await expect(dialog).toContainText('Overpressure');
    await expect(dialog).toContainText('Modified Mercalli Intensity');
    await expect(dialog).toContainText('Volcanic Explosivity Index');
    await expect(dialog).toContainText('Ward–Asphaug water cavity');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('Preset note caption shows the historical context for the active preset', async ({
    page,
  }) => {
    await page.goto('/?lng=en');
    await page.getByRole('button', { name: 'Try the simulator →' }).click();
    await expandSimulatorPanelIfCollapsed(page);

    // Default Chicxulub preset has the K-Pg impactor note.
    await expect(page.getByText(/Hildebrand et al\. 1991/)).toBeVisible();

    // Switching preset: the caption follows it. Since 22 September 2026 the
    // site offers the impacts alone (src/store/visibleEvents.ts), so the
    // switch that used to be to a volcano is now to another impact.
    await page.getByLabel('Preset').selectOption('TUNGUSKA');
    await expect(page.getByText(/Boslough & Crawford 2008/)).toBeVisible();
  });

  test('preset dropdown offers every impact scenario by default', async ({ page }) => {
    await page.goto('/?lng=en');
    await page.getByRole('button', { name: 'Try the simulator →' }).click();
    await expandSimulatorPanelIfCollapsed(page);

    const select = page.getByLabel('Preset');
    await expect(select).toBeVisible();
    await expect(select.locator('option')).toHaveText([
      'Chicxulub',
      'Chicxulub (ocean variant)',
      'Popigai 35.7 Ma',
      'Boltysh 65.4 Ma',
      'Tunguska',
      'Meteor Crater (Barringer)',
      'Sikhote-Alin 1947',
      'Chelyabinsk 2013',
    ]);
  });

  // Hidden with the module it drives: since 22 September 2026 the site offers
  // the cosmic impacts alone (src/store/visibleEvents.ts), so this path is not
  // one a visitor can walk. The test is kept, not deleted: it comes back with
  // the module, and nothing of the module's own code has changed.
  test.skip('event-type selector swaps the preset list across all five categories', async ({
    page,
  }) => {
    // Five event switches and five full option-list comparisons: about
    // 16 s alone and no headroom at all inside the 30 s default, so it
    // times out whenever the machine is busy with other workers.
    test.setTimeout(90_000);
    await page.goto('/?lng=en');
    await page.getByRole('button', { name: 'Try the simulator →' }).click();
    await expandSimulatorPanelIfCollapsed(page);

    const eventType = (label: string) => page.getByRole('radio', { name: label });
    await expect(eventType('Cosmic impact')).toBeChecked();

    await eventType('Nuclear explosion').check();
    await expect(page.getByLabel('Preset').locator('option')).toHaveText([
      'Hiroshima 1945',
      'Nagasaki 1945',
      'Halifax 1917',
      'Texas City 1947',
      'Beirut port 2020',
      'Ivy Mike 1952',
      'Castle Bravo 1954',
      'Tsar Bomba 1961',
      'Starfish Prime 1962',
      '1 Mt reference',
    ]);

    await eventType('Earthquake').check();
    await expect(page.getByLabel('Preset').locator('option')).toHaveText([
      'Valdivia 1960',
      'Great Alaska 1964',
      'Tōhoku 2011',
      'Sumatra–Andaman 2004',
      'Lisbon 1755',
      'Nepal Gorkha 2015',
      'Northridge 1994',
      'Kokoxili (Kunlun) 2001',
      "L'Aquila 2009",
      'Amatrice 2016',
    ]);

    await eventType('Volcanic eruption').check();
    await expect(page.getByLabel('Preset').locator('option')).toHaveText([
      'Vesuvius 79 CE',
      'Krakatau 1883',
      'Tambora 1815',
      'Mount St. Helens 1980',
      'Mount Pelée 1902',
      'Etna 1669',
      'Pinatubo 1991',
      'Eyjafjallajökull 2010',
      'Hunga Tonga 2022',
      'Anak Krakatau 2018',
    ]);

    await eventType('Submarine landslide').check();
    await expect(page.getByLabel('Preset').locator('option')).toHaveText([
      'Storegga ≈ 8 200 BP',
      'Vaiont 1963',
      'Anak Krakatau 2018 (slide framing)',
      'Lituya Bay 1958',
      'Elm 1881',
    ]);
  });

  // Hidden with the module it drives: since 22 September 2026 the site offers
  // the cosmic impacts alone (src/store/visibleEvents.ts), so this path is not
  // one a visitor can walk. The test is kept, not deleted: it comes back with
  // the module, and nothing of the module's own code has changed.
  test.skip('an explosion can be placed under the water, with a depth instead of a height', async ({
    page,
  }) => {
    await page.goto('/?lng=en');
    await page.getByRole('button', { name: 'Try the simulator →' }).click();
    await expandSimulatorPanelIfCollapsed(page);
    await page.getByRole('radio', { name: 'Nuclear explosion' }).check();

    await expect(page.getByRole('radio', { name: 'In the air or on the surface' })).toBeChecked();
    await expect(page.getByLabel('Height of burst (m)')).toBeVisible();

    await page.getByRole('radio', { name: 'Under the water' }).check();
    const depth = page.getByLabel('Depth below the water surface (m)');
    await expect(depth).toBeVisible();
    await expect(depth).toHaveValue('30');
    await expect(page.getByLabel('Height of burst (m)')).toHaveCount(0);
    await depth.fill('120');
    await expect(depth).toHaveValue('120');

    await page.getByRole('radio', { name: 'In the air or on the surface' }).check();
    await expect(page.getByLabel('Height of burst (m)')).toHaveValue('0');
  });

  test('URL updates as the user selects preset and mode', async ({ page }) => {
    await page.goto('/?lng=en');
    await page.getByRole('button', { name: 'Try the simulator →' }).click();
    await expandSimulatorPanelIfCollapsed(page);

    // After entering globe mode, the URL should carry t=impact + m=globe.
    await expect.poll(() => new URL(page.url()).searchParams.get('m')).toBe('globe');
    await expect.poll(() => new URL(page.url()).searchParams.get('t')).toBe('impact');
    await expect.poll(() => new URL(page.url()).searchParams.get('p')).toBe('CHICXULUB');

    await page.getByLabel('Preset').selectOption('TUNGUSKA');
    await expect.poll(() => new URL(page.url()).searchParams.get('p')).toBe('TUNGUSKA');

    await page.getByLabel('Preset').selectOption('METEOR_CRATER');
    await expect.poll(() => new URL(page.url()).searchParams.get('p')).toBe('METEOR_CRATER');
    // The event stays what the site offers: since 22 September 2026 there is
    // one, and no chooser to switch it with (src/store/visibleEvents.ts).
    await expect.poll(() => new URL(page.url()).searchParams.get('t')).toBe('impact');

    // The existing `lng=en` query param must survive every write.
    await expect.poll(() => new URL(page.url()).searchParams.get('lng')).toBe('en');
  });

  test('shared URL hydrates the preset + mode on load', async ({ page }) => {
    await page.goto('/?lng=en&t=impact&p=METEOR_CRATER&m=globe');
    await expandSimulatorPanelIfCollapsed(page);

    // The landing CTA is bypassed because mode=globe, so the panel is
    // already mounted with the preset pre-selected.
    await expect(page.getByLabel('Preset')).toHaveValue('METEOR_CRATER');
  });

  test('a link to a module the site has hidden opens on the impacts', async ({ page }) => {
    // Andrea, 22 September 2026: the site is for cosmic impacts alone
    // (src/store/visibleEvents.ts). An old shared link must not leave a
    // visitor inside a module the panel has no chooser for.
    await page.goto('/?lng=en&t=earthquake&p=NORTHRIDGE_1994&m=globe');
    await expandSimulatorPanelIfCollapsed(page);

    await expect.poll(() => new URL(page.url()).searchParams.get('t')).toBe('impact');
    await expect(page.getByRole('radio', { name: 'Earthquake' })).toHaveCount(0);
  });

  test('a shared link rebuilds a custom iron impactor, heading and all', async ({ page }) => {
    // Strength and heading were not in an impact link until 14 September
    // 2026: an iron body arrived with the strength of whatever the
    // recipient had open.
    await page.goto(
      '/?lng=en&t=impact&p=CUSTOM&d=60&s=12800&a=45&rho=7800&trho=2500&g=9.80665&str=50000000&az=200&m=globe'
    );
    await expandSimulatorPanelIfCollapsed(page);
    // The chooser is gone with the other modules (src/store/visibleEvents.ts):
    // what the link rebuilds is the impact's own fields.
    await expect(page.getByLabel('Impactor diameter')).toHaveValue('60');
    await expect(page.getByLabel('Impactor density')).toHaveValue('7800');
    // The heading is under the slider now, with the direction spelled out.
    await expect(page.getByText(/200° — the way the impactor is flying/)).toBeVisible();
    // And the link the page writes back still carries them.
    await expect.poll(() => new URL(page.url()).searchParams.get('str')).toBe('50000000');
    await expect.poll(() => new URL(page.url()).searchParams.get('az')).toBe('200');
  });

  // Hidden with the module it drives: since 22 September 2026 the site offers
  // the cosmic impacts alone (src/store/visibleEvents.ts), so this path is not
  // one a visitor can walk. The test is kept, not deleted: it comes back with
  // the module, and nothing of the module's own code has changed.
  test.skip('a shared link rebuilds a custom explosion placed under the water', async ({
    page,
  }) => {
    await page.goto('/?lng=en&t=explosion&p=CUSTOM&y=2.5&h=-40&gt=WET_SOIL&m=globe');
    await expandSimulatorPanelIfCollapsed(page);

    await expect(page.getByRole('radio', { name: 'Nuclear explosion' })).toBeChecked();
    await expect(page.getByLabel('Yield (Mt TNT)')).toHaveValue('2.5');
    await expect(page.getByRole('radio', { name: 'Under the water' })).toBeChecked();
    await expect(page.getByLabel('Depth below the water surface (m)')).toHaveValue('40');
    // And the link the page writes back carries them.
    await expect.poll(() => new URL(page.url()).searchParams.get('h')).toBe('-40');
    await expect.poll(() => new URL(page.url()).searchParams.get('y')).toBe('2.5');
  });

  // Hidden with the module it drives: since 22 September 2026 the site offers
  // the cosmic impacts alone (src/store/visibleEvents.ts), so this path is not
  // one a visitor can walk. The test is kept, not deleted: it comes back with
  // the module, and nothing of the module's own code has changed.
  test.skip('a shared link rebuilds a custom earthquake and a custom volcano', async ({ page }) => {
    await page.goto('/?lng=en&t=earthquake&p=CUSTOM&mw=7.1&dep=12000&ft=reverse&m=globe');
    await expandSimulatorPanelIfCollapsed(page);
    await expect(page.getByRole('radio', { name: 'Earthquake' })).toBeChecked();
    await expect(page.getByLabel('Magnitude (Mw)')).toHaveValue('7.1');
    await expect(page.getByLabel('Depth (km)')).toHaveValue('12');

    await page.goto('/?lng=en&t=volcano&p=CUSTOM&ver=100000&vol=10000000000&ev=12000&m=globe');
    await expandSimulatorPanelIfCollapsed(page);
    await expect(page.getByRole('radio', { name: 'Volcanic eruption' })).toBeChecked();
    await expect(page.getByLabel('Zone evacuated before the eruption (km radius)')).toHaveValue(
      '12'
    );
    await expect.poll(() => new URL(page.url()).searchParams.get('ev')).toBe('12000');
  });

  // Hidden with the module it drives: since 22 September 2026 the site offers
  // the cosmic impacts alone (src/store/visibleEvents.ts), so this path is not
  // one a visitor can walk. The test is kept, not deleted: it comes back with
  // the module, and nothing of the module's own code has changed.
  test.skip('Anak Krakatau 2018 picked on the landslide tab stays a landslide, and so does its link', async ({
    page,
  }) => {
    await page.goto('/?lng=en');
    await page.getByRole('button', { name: 'Try the simulator →' }).click();
    await expandSimulatorPanelIfCollapsed(page);
    await page.getByRole('radio', { name: 'Submarine landslide' }).check();
    await page.getByLabel('Preset').selectOption('ANAK_KRAKATAU_2018');
    await expect(page.getByRole('radio', { name: 'Submarine landslide' })).toBeChecked();
    await expect.poll(() => new URL(page.url()).searchParams.get('t')).toBe('landslide');

    await page.goto('/?lng=en&t=landslide&p=ANAK_KRAKATAU_2018&m=globe');
    await expandSimulatorPanelIfCollapsed(page);
    await expect(page.getByRole('radio', { name: 'Submarine landslide' })).toBeChecked();
    await expect(page.getByLabel('Preset')).toHaveValue('ANAK_KRAKATAU_2018');
  });

  // Typed key by key over the value already in the field, as a person
  // does. Bound straight to the store, a keystroke the model refused put
  // the old value back mid-word — "0.07" over Tunguska's 0.06 km stored
  // 60.7 m — and a number typed in kilometres picked up float noise on
  // its way to metres. `fill` sets the whole text at once and shows
  // neither, so these tests type.
  const TYPED_OVER = [
    {
      what: "an impactor's diameter",
      url: '/?lng=en&t=impact&p=TUNGUSKA&m=globe',
      // Metres since the panel became an instrument: the unit has a column
      // of its own, so it left the label, and the field holds metres
      // because kilometres printed Chelyabinsk's 19.8 m body as 0.0198
      // under a caption that called it 19,8 m (B-082).
      label: 'Impactor diameter',
      text: '70',
      key: 'd',
      stored: '70',
    },
    {
      what: "an explosion's yield",
      hidden: true,
      url: '/?lng=en&t=explosion&p=HIROSHIMA_1945&m=globe',
      label: 'Yield (Mt TNT)',
      text: '0.02',
      key: 'y',
      stored: '0.02',
    },
    {
      what: "an earthquake's depth",
      hidden: true,
      url: '/?lng=en&t=earthquake&p=NORTHRIDGE_1994&m=globe',
      label: 'Depth (km)',
      text: '8.05',
      key: 'dep',
      stored: '8050',
    },
    {
      what: "an eruption's rate",
      hidden: true,
      url: '/?lng=en&t=volcano&p=KRAKATAU_1883&m=globe',
      label: 'V̇ mantissa (m³/s)',
      text: '2.5',
      key: 'ver',
      stored: '250000',
    },
  ];
  for (const c of TYPED_OVER) {
    // The rows of a module the site has hidden are kept and skipped, as the
    // tests above are (src/store/visibleEvents.ts).
    const hidden = 'hidden' in c && c.hidden;
    test(`${c.what} typed over the old one is the number typed`, async ({ page }) => {
      test.skip(hidden, 'the site offers the cosmic impacts alone');
      await page.goto(c.url);
      await expandSimulatorPanelIfCollapsed(page);
      const field = page.getByLabel(c.label, { exact: true });
      await field.click();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.type(c.text);
      await expect(field).toHaveValue(c.text);
      await expect.poll(() => new URL(page.url()).searchParams.get(c.key)).toBe(c.stored);
      // And leaving the field shows what was kept, with no noise in it.
      await field.blur();
      await expect(field).toHaveValue(c.text);
    });
  }

  // Hidden with the module it drives: since 22 September 2026 the site offers
  // the cosmic impacts alone (src/store/visibleEvents.ts), so this path is not
  // one a visitor can walk. The test is kept, not deleted: it comes back with
  // the module, and nothing of the module's own code has changed.
  test.skip('a landslide is edited in the panel, confined basin and all', async ({ page }) => {
    await page.goto('/?lng=en&t=landslide&p=VAIONT_1963&m=globe');
    await expandSimulatorPanelIfCollapsed(page);

    await expect(page.getByRole('radio', { name: 'Above the water' })).toBeChecked();
    const basin = page.getByLabel('Confined basin surface (km², optional)');
    // The default in the label is a calibration (1.8 since 14 September,
    // 3 before); the test is about the field, not the number.
    const amplification = page.getByLabel(/^Amplification \(empty = /);
    await expect(basin).toHaveValue('3');
    await expect(amplification).toHaveValue('');

    await amplification.fill('2.5');
    await expect.poll(() => new URL(page.url()).searchParams.get('p')).toBe('CUSTOM');
    await expect.poll(() => new URL(page.url()).searchParams.get('bf')).toBe('2.5');

    // Typed key by key over the old value, as a person does. A field
    // bound straight to the store put the 3 back after the refused 0
    // and stored 3.5 km²; `fill` sets the whole text at once and would
    // never have shown it.
    await basin.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('0.5');
    await expect(basin).toHaveValue('0.5');
    await expect.poll(() => new URL(page.url()).searchParams.get('ba')).toBe('500000');

    // Back to open water: the amplification has nothing left to act on.
    await basin.fill('');
    await expect(amplification).toHaveCount(0);
    await expect.poll(() => new URL(page.url()).searchParams.get('ba')).toBeNull();
    await expect.poll(() => new URL(page.url()).searchParams.get('bf')).toBeNull();

    await page.getByRole('radio', { name: 'Under the water' }).check();
    await expect.poll(() => new URL(page.url()).searchParams.get('rg')).toBe('submarine');
    await expect(page.getByLabel('Density (kg/m³, empty = 1,950)')).toHaveValue('');
  });

  // Hidden with the module it drives: since 22 September 2026 the site offers
  // the cosmic impacts alone (src/store/visibleEvents.ts), so this path is not
  // one a visitor can walk. The test is kept, not deleted: it comes back with
  // the module, and nothing of the module's own code has changed.
  test.skip('a shared link rebuilds a custom landslide', async ({ page }) => {
    await page.goto(
      '/?lng=en&t=landslide&p=CUSTOM&lv=300000000&sl=12&od=400&rg=submarine&sd=2100&fa=50000000&m=globe'
    );
    await expandSimulatorPanelIfCollapsed(page);
    await expect(page.getByRole('radio', { name: 'Under the water' })).toBeChecked();
    await expect(page.getByLabel('Volume mantissa (m³)')).toHaveValue('3.0');
    await expect(page.getByLabel('Volume exponent')).toHaveValue('8');
    await expect(page.getByLabel('Slope of the sliding plane (°)')).toHaveValue('12');
    await expect(page.getByLabel('Water depth (m)')).toHaveValue('400');
    await expect(page.getByLabel('Density (kg/m³, empty = 1,950)')).toHaveValue('2100');
    await expect(page.getByLabel('Area the slide covers (km², optional)')).toHaveValue('50');
  });

  test('ring legend mounts in globe mode with the empty-state copy', async ({ page }) => {
    await page.goto('/?lng=en&t=impact&p=CHICXULUB&m=globe');

    const legend = page.getByRole('complementary', { name: 'Ring legend' });
    await expect(legend).toBeVisible();

    // Until the user runs a simulation the legend invites them to do
    // so. The copy is in `globe.legend.empty`.
    await expect(legend).toContainText('Click a point on the globe and press Simulate');
  });

  test('ring legend collapses and re-expands via its toggle button', async ({ page }) => {
    await page.goto('/?lng=en&t=impact&p=CHICXULUB&m=globe');

    const legend = page.getByRole('complementary', { name: 'Ring legend' });
    const toggle = legend.getByRole('button', { name: 'Hide legend' });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await toggle.click();
    // After collapse, the empty-state paragraph is gone but the
    // landmark itself stays mounted so the toggle remains reachable.
    await expect(legend).not.toContainText('Click a point on the globe');
    await expect(legend.getByRole('button', { name: 'Show legend' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );

    await legend.getByRole('button', { name: 'Show legend' }).click();
    await expect(legend).toContainText('Click a point on the globe');
  });

  test('ring legend renders Italian copy when lng=it', async ({ page }) => {
    await page.goto('/?lng=it&t=impact&p=CHICXULUB&m=globe');

    const legend = page.getByRole('complementary', { name: 'Legenda anelli' });
    await expect(legend).toBeVisible();
    await expect(legend).toContainText('Clicca un punto sul globo');
  });

  test('Copy link button writes the current URL to the clipboard', async ({
    browserName,
    page,
    context,
  }) => {
    // `clipboard-write` is a Chromium-only permission name; Firefox
    // and WebKit reject it outright. Skip the real-clipboard
    // assertion on those engines — we still verify the confirmation
    // label flips, which is the observable user-facing behaviour.
    const canReadClipboard = browserName === 'chromium';
    if (canReadClipboard) {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    }
    await page.goto('/?lng=en&t=impact&p=METEOR_CRATER&m=globe');
    await expandSimulatorPanelIfCollapsed(page);

    const copyButton = page.getByRole('button', { name: 'Copy shareable link' });
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    await expect(page.getByRole('button', { name: 'Link copied ✓' })).toBeVisible();

    if (canReadClipboard) {
      const clipboard = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboard).toContain('t=impact');
      expect(clipboard).toContain('p=METEOR_CRATER');
    }
  });
});

/**
 * The calibration envelope: where the model has been measured, and
 * where it has not. The estimate is the same either way — these
 * assertions are about what the page says it knows, which is the
 * part a reader needs in order to weigh the number.
 */
test.describe('calibration envelope', () => {
  // The note lives under the casualty figure, and that figure waits on
  // a population lookup: a shipped-raster fetch at best, a WorldPop
  // round trip at worst. Well past Playwright's 30 s default.
  test.setTimeout(120_000);

  /** Run a scenario and return its envelope note, once it exists. */
  async function envelopeNoteFor(page: Page, query: string): Promise<Locator> {
    await page.goto(`/?lng=en&m=globe&${query}`);
    await expandSimulatorPanelIfCollapsed(page);
    const launch = page.getByRole('button', { name: 'Launch simulation' });
    await expect(launch).toBeEnabled();
    // The click is not an ordinary click: it runs the whole cascade
    // on the page's own thread, and for Chicxulub that includes a
    // planetary bathymetric tsunami. Playwright waits for the page to
    // settle afterwards, which on a two-core runner takes longer than
    // the twenty seconds CI allows an action — the log reads "click
    // action done / waiting for scheduled navigations to finish" and
    // then times out on a click that worked. This suite already gives
    // the test two minutes; the click gets a share of it.
    await launch.click({ timeout: 60_000 });
    const note = page.getByTestId('calibration-envelope');
    await expect(note).toBeAttached({ timeout: 90_000 });
    return note;
  }

  test('an impact says outright that no death toll has ever been recorded', async ({ page }) => {
    const note = await envelopeNoteFor(page, 't=impact&p=CHICXULUB&lat=41.9028&lon=12.4964');
    await expect(note).toHaveAttribute('data-standing', 'unmeasured');
    await expect(note).toContainText('No impact in recorded history left a death toll');
  });

  // Hidden with the module it drives: since 22 September 2026 the site offers
  // the cosmic impacts alone (src/store/visibleEvents.ts), so this path is not
  // one a visitor can walk. The test is kept, not deleted: it comes back with
  // the module, and nothing of the module's own code has changed.
  test.skip('Hiroshima names itself as the measured event of its size', async ({ page }) => {
    const note = await envelopeNoteFor(
      page,
      't=explosion&p=HIROSHIMA_1945&lat=34.3955&lon=132.4553'
    );
    await expect(note).toHaveAttribute('data-standing', 'measured');
    await expect(note).toContainText('Hiroshima 1945');
    await expect(note).toContainText('the death toll on record');
  });

  // Hidden with the module it drives: since 22 September 2026 the site offers
  // the cosmic impacts alone (src/store/visibleEvents.ts), so this path is not
  // one a visitor can walk. The test is kept, not deleted: it comes back with
  // the module, and nothing of the module's own code has changed.
  test.skip('a fifty-megatonne charge says how far past the record it is', async ({ page }) => {
    const note = await envelopeNoteFor(page, 't=explosion&p=TSAR_BOMBA_1961&lat=45.4642&lon=9.19');
    await expect(note).toHaveAttribute('data-standing', 'extrapolated');
    // Tsar Bomba is beside a measured wave and three thousand times
    // past a measured toll; the panel shows a toll, so it says so.
    await expect(note).toContainText('past Hiroshima 1945');
  });
});
