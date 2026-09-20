import type { ChangeEvent, JSX } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { FaultType } from '../../physics/events/earthquake/index.js';
import { simulateEarthquake } from '../../physics/events/earthquake/index.js';
import { strikeAnswerAt } from '../../scene/strikeTiles.js';
import { useAppStore } from '../../store/index.js';
import { useFieldIssues } from '../../store/useScenarioValidation.js';
import { DraftNumberInput } from './DraftNumberInput.js';
import { MagnitudeScale } from './MagnitudeScale.js';
import { ModelNotes } from './ModelNotes.js';
import { QuantityKey, QuantityRow } from './QuantityRow.js';
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

  /** The Vs30 the scenario ran on, when it has run: the panel shows the
   *  ground the model actually used, not a placeholder for it. */
  const vs30Ran =
    result?.type === 'earthquake'
      ? (result.data.shaking.siteVs30 as number | undefined)
      : undefined;

  return (
    <fieldset className={styles.customParams} style={{ display: 'block' }}>
      <legend className={styles.customParamsLegend}>{t('simulator.customParams')}</legend>

      <QuantityRow
        label={t('simulator.earthquake.magnitudeInput')}
        unit="Mw"
        source="user"
        note={<MagnitudeScale magnitude={input.magnitude} />}
        field="magnitude"
        issues={magnitudeIssues}
      >
        <DraftNumberInput
          id="quake-magnitude"
          inputMode="decimal"
          min={3}
          max={10}
          step={0.1}
          value={input.magnitude}
          onValueText={updateMagnitude}
          aria-label={t('simulator.earthquake.magnitudeInput')}
          aria-invalid={magnitudeIssues.hasError || undefined}
        />
      </QuantityRow>

      <QuantityRow
        label={t('simulator.earthquake.depthInput')}
        unit="km"
        source="user"
        note={t('simulator.earthquake.depthShort')}
        field="depth"
        issues={depthIssues}
      >
        <DraftNumberInput
          id="quake-depth"
          inputMode="decimal"
          min={0}
          max={700}
          step={1}
          value={depthKm}
          onValueText={updateDepth}
          aria-label={t('simulator.earthquake.depthInput')}
          aria-invalid={depthIssues.hasError || undefined}
        />
      </QuantityRow>

      <QuantityRow
        label={t('simulator.earthquake.faultType')}
        source="user"
        field="faultType"
        issues={faultIssues}
      >
        <select
          id="quake-fault"
          value={input.faultType ?? 'all'}
          onChange={updateFault}
          aria-label={t('simulator.earthquake.faultType')}
          aria-invalid={faultIssues.hasError || undefined}
        >
          {FAULT_TYPES.map((f) => (
            <option key={f} value={f}>
              {t(`simulator.earthquake.fault.${f}`)}
            </option>
          ))}
        </select>
      </QuantityRow>

      <QuantityRow
        label={t('simulator.earthquake.strikeInput')}
        unit="°N"
        source={strike.source === 'fault' ? 'read' : strike.source === 'none' ? 'none' : 'user'}
        highlight={strike.source === 'fault'}
        note={
          <>
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
          </>
        }
      >
        <DraftNumberInput
          id="quake-strike"
          value={strike.deg === null ? '' : Math.round(strike.deg * 10) / 10}
          placeholder={t('simulator.earthquake.strikeUnknown')}
          onValueText={updateStrike}
          aria-label={t('simulator.earthquake.strikeInput')}
        />
      </QuantityRow>

      <QuantityRow
        label={t('simulator.earthquake.vs30Input')}
        unit="m/s"
        source={input.vs30 === undefined ? 'read' : 'user'}
        highlight={input.vs30 === undefined}
        note={
          input.vs30 === undefined
            ? vs30Ran === undefined
              ? t('simulator.earthquake.vs30FromTerrain')
              : t('simulator.earthquake.vs30Read', { value: Math.round(vs30Ran).toString() })
            : t('simulator.earthquake.vs30Yours')
        }
        field="vs30"
        issues={vs30Issues}
      >
        <DraftNumberInput
          id="quake-vs30"
          inputMode="decimal"
          min={100}
          max={2000}
          step={10}
          value={input.vs30 ?? (vs30Ran === undefined ? '' : Math.round(vs30Ran))}
          placeholder={t('simulator.earthquake.vs30Placeholder')}
          onValueText={updateVs30}
          aria-label={t('simulator.earthquake.vs30Input')}
          aria-invalid={vs30Issues.hasError || undefined}
        />
      </QuantityRow>

      <QuantityRow
        label={t('simulator.earthquake.megathrustInput')}
        source="user"
        note={t('simulator.earthquake.megathrustNote')}
        field="subductionInterface"
        issues={interfaceIssues}
      >
        <input
          id="quake-megathrust"
          type="checkbox"
          checked={input.subductionInterface ?? false}
          onChange={toggleMegathrust}
          aria-label={t('simulator.earthquake.megathrustInput')}
          style={{ width: 18, height: 18, margin: '0 6px 0 auto', accentColor: '#F5A524' }}
        />
      </QuantityRow>

      <QuantityKey />
      <ModelNotes eventType="earthquake" />
    </fieldset>
  );
}
