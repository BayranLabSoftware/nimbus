import type { ChangeEvent, JSX } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { FaultType } from '../../physics/events/earthquake/index.js';
import { simulateEarthquake } from '../../physics/events/earthquake/index.js';
import { strikeAnswerAt } from '../../scene/strikeTiles.js';
import { useAppStore } from '../../store/index.js';
import { useFieldIssues } from '../../store/useScenarioValidation.js';
import { DraftNumberInput } from './DraftNumberInput.js';
import { FieldFeedback } from './FieldFeedback.js';
import { scaleTyped } from './typedNumber.js';
import styles from './SimulatorPanel.module.css';

const FAULT_TYPES: FaultType[] = ['strike-slip', 'reverse', 'normal', 'all'];

export function EarthquakeCustomInputs(): JSX.Element {
  const { t } = useTranslation();
  const input = useAppStore((s) => s.earthquake.input);
  const preset = useAppStore((s) => s.earthquake.preset);
  const strikeIsUsers = useAppStore((s) => s.earthquake.strikeIsUsers);
  const location = useAppStore((s) => s.location);
  const result = useAppStore((s) => s.result);
  const setEarthquakeInput = useAppStore((s) => s.setEarthquakeInput);

  // Per-field issues come straight from `validateScenario` — no
  // duplication of the validator's logic in this component. The store
  // setter rejects S1 invalid input at the boundary (B-010), so what
  // surfaces here in steady state is `normalized` / `suspicious`
  // warnings (azimuth wrap, magnitude exceeds Mw 9.5, etc.). Codes are
  // preserved on the rendered element via `data-validation-code`.
  const magnitudeIssues = useFieldIssues('earthquake', 'magnitude');
  const depthIssues = useFieldIssues('earthquake', 'depth');
  const faultIssues = useFieldIssues('earthquake', 'faultType');
  const interfaceIssues = useFieldIssues('earthquake', 'subductionInterface');
  const vs30Issues = useFieldIssues('earthquake', 'vs30');

  const depthKm = input.depth === undefined ? '' : (input.depth as number) / 1_000;

  /**
   * Which way the rupture points, and where that answer comes from.
   *
   * B-081: until now this was not on the panel at all, so a strike
   * inherited from a preset could point a rupture anywhere on Earth with
   * nothing on screen to show it. The reading repeats what the store will
   * do at evaluate time, from the same tiles and the same rupture length,
   * so the panel cannot promise one strike and the simulation draw another.
   */
  const strike = useMemo((): {
    deg: number | null;
    source: 'user' | 'preset' | 'fault' | 'none';
  } => {
    const own = input.strikeAzimuthDeg;
    if (own !== undefined && (preset !== 'CUSTOM' || strikeIsUsers)) {
      return { deg: own, source: strikeIsUsers ? 'user' : 'preset' };
    }
    // Once a scenario has run, the strike it RAN is the answer — no
    // reconstruction can be more faithful than the value itself, and the
    // store waits for the tiles before it evaluates while this component
    // renders long before they land. Editing any input clears the result,
    // so a stale strike cannot survive an edit.
    if (result?.type === 'earthquake') {
      const ran = result.data.inputs.strikeAzimuthDeg;
      return ran === undefined ? { deg: null, source: 'none' } : { deg: ran, source: 'fault' };
    }
    if (location === null)
      return { deg: own ?? null, source: own === undefined ? 'none' : 'preset' };
    // The window the lookup reads is as long as the rupture (rule 287), so
    // the length comes from the same scaling law the simulator will use.
    const length = simulateEarthquake(input).ruptureLength as number;
    const answer = strikeAnswerAt(
      location.latitude,
      location.longitude,
      (input.depth as number | undefined) ?? 10_000,
      length
    );
    if (answer?.strikeDeg == null) return { deg: null, source: 'none' };
    return { deg: answer.strikeDeg, source: 'fault' };
  }, [input, preset, strikeIsUsers, location, result]);

  const updateMagnitude = (text: string): void => {
    const v = parseFloat(text);
    if (Number.isFinite(v) && v > 0) setEarthquakeInput({ magnitude: v });
  };
  const updateDepth = (text: string): void => {
    const km = parseFloat(text);
    if (Number.isFinite(km) && km >= 0) setEarthquakeInput({ depth: scaleTyped(km, 1_000) });
  };
  const updateStrike = (text: string): void => {
    if (text.trim() === '') {
      // Cleared: the ground under the pick decides again.
      setEarthquakeInput({ strikeAzimuthDeg: null });
      return;
    }
    const deg = parseFloat(text);
    if (Number.isFinite(deg)) setEarthquakeInput({ strikeAzimuthDeg: deg });
  };
  const updateFault = (e: ChangeEvent<HTMLSelectElement>): void => {
    setEarthquakeInput({ faultType: e.target.value as FaultType });
  };
  const updateVs30 = (text: string): void => {
    // An empty field hands the site back to the terrain under the pick,
    // which is what the simulator reads when nobody types one.
    if (text.trim() === '') {
      setEarthquakeInput({ vs30: null });
      return;
    }
    const v = parseFloat(text);
    if (Number.isFinite(v) && v > 0) setEarthquakeInput({ vs30: v });
  };
  const toggleMegathrust = (e: ChangeEvent<HTMLInputElement>): void => {
    setEarthquakeInput({ subductionInterface: e.target.checked });
  };

  return (
    <fieldset className={styles.customParams}>
      <legend className={styles.customParamsLegend}>{t('simulator.customParams')}</legend>

      <div className={styles.paramField}>
        <label className={styles.paramLabel} htmlFor="quake-magnitude">
          {t('simulator.earthquake.magnitudeInput')}
        </label>
        <DraftNumberInput
          id="quake-magnitude"
          className={styles.paramInput}
          inputMode="decimal"
          min={3}
          max={10}
          step={0.1}
          value={input.magnitude}
          onValueText={updateMagnitude}
          aria-invalid={magnitudeIssues.hasError || undefined}
          aria-describedby={magnitudeIssues.topMessage ? 'quake-magnitude-feedback' : undefined}
        />
        <span id="quake-magnitude-feedback">
          <FieldFeedback
            field="magnitude"
            message={magnitudeIssues.topMessage}
            code={magnitudeIssues.topCode}
            isError={magnitudeIssues.hasError}
          />
        </span>
      </div>

      <div className={styles.paramField}>
        <label className={styles.paramLabel} htmlFor="quake-depth">
          {t('simulator.earthquake.depthInput')}
        </label>
        <DraftNumberInput
          id="quake-depth"
          className={styles.paramInput}
          inputMode="decimal"
          min={0}
          max={700}
          step={1}
          value={depthKm}
          onValueText={updateDepth}
          aria-invalid={depthIssues.hasError || undefined}
          aria-describedby={
            depthIssues.topMessage ? 'quake-depth-help quake-depth-feedback' : 'quake-depth-help'
          }
        />
        <span id="quake-depth-help" className={styles.presetNote}>
          {t('simulator.earthquake.depthHelp')}
        </span>
        <span id="quake-depth-feedback">
          <FieldFeedback
            field="depth"
            message={depthIssues.topMessage}
            code={depthIssues.topCode}
            isError={depthIssues.hasError}
          />
        </span>
      </div>

      <div className={styles.paramField}>
        <label className={styles.paramLabel} htmlFor="quake-fault">
          {t('simulator.earthquake.faultType')}
        </label>
        <select
          id="quake-fault"
          className={styles.paramInput}
          value={input.faultType ?? 'all'}
          onChange={updateFault}
          aria-invalid={faultIssues.hasError || undefined}
          aria-describedby={faultIssues.topMessage ? 'quake-fault-feedback' : undefined}
        >
          {FAULT_TYPES.map((f) => (
            <option key={f} value={f}>
              {t(`simulator.earthquake.fault.${f}`)}
            </option>
          ))}
        </select>
        <span id="quake-fault-feedback">
          <FieldFeedback
            field="faultType"
            message={faultIssues.topMessage}
            code={faultIssues.topCode}
            isError={faultIssues.hasError}
          />
        </span>
      </div>

      <div className={styles.paramField}>
        <label className={styles.paramLabel} htmlFor="quake-vs30">
          {t('simulator.earthquake.vs30Input')}
        </label>
        <DraftNumberInput
          id="quake-vs30"
          className={styles.paramInput}
          inputMode="decimal"
          min={100}
          max={2_000}
          step={10}
          value={input.vs30 ?? ''}
          placeholder={t('simulator.earthquake.vs30FromTerrain')}
          onValueText={updateVs30}
          aria-invalid={vs30Issues.hasError || undefined}
          aria-describedby={vs30Issues.topMessage ? 'quake-vs30-feedback' : undefined}
        />
        <span id="quake-vs30-feedback">
          <FieldFeedback
            field="vs30"
            message={vs30Issues.topMessage}
            code={vs30Issues.topCode}
            isError={vs30Issues.hasError}
          />
        </span>
      </div>

      <div className={styles.paramField}>
        <label className={styles.paramLabel} htmlFor="quake-strike">
          {t('simulator.earthquake.strikeInput')}
        </label>
        <DraftNumberInput
          id="quake-strike"
          className={styles.paramInput}
          value={strike.deg === null ? '' : Math.round(strike.deg * 10) / 10}
          placeholder={t('simulator.earthquake.strikeUnknown')}
          onValueText={updateStrike}
        />
        <p className={styles.paramHint}>
          {t(`simulator.earthquake.strikeFrom.${strike.source}`)}
          {strike.source === 'user' && (
            <>
              {' · '}
              <button
                type="button"
                className={styles.linkButton}
                onClick={(): void => {
                  setEarthquakeInput({ strikeAzimuthDeg: null });
                }}
              >
                {t('simulator.earthquake.strikeAuto')}
              </button>
            </>
          )}
        </p>
      </div>

      <div className={styles.paramField} style={{ gridColumn: '1 / -1' }}>
        <label className={styles.paramLabel} htmlFor="quake-megathrust">
          <input
            id="quake-megathrust"
            type="checkbox"
            checked={input.subductionInterface ?? false}
            onChange={toggleMegathrust}
            style={{ marginRight: 6 }}
            aria-describedby={interfaceIssues.topMessage ? 'quake-megathrust-feedback' : undefined}
          />
          {t('simulator.earthquake.megathrustInput')}
        </label>
        {/* B-080: an interface is a thrust (B-046), so a scenario that
            arrives with one and a strike-slip or normal fault will not run
            the fault it names. Saying so here is the difference between a
            reader choosing that and a reader inheriting it from the preset
            they started from. */}
        <span id="quake-megathrust-feedback">
          <FieldFeedback
            field="subductionInterface"
            message={interfaceIssues.topMessage}
            code={interfaceIssues.topCode}
            isError={interfaceIssues.hasError}
          />
        </span>
      </div>
    </fieldset>
  );
}
