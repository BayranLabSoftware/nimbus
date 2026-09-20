import type { ChangeEvent, JSX } from 'react';
import { useTranslation } from 'react-i18next';
import type { ExplosionScenarioInput } from '../../physics/events/explosion/index.js';
import { useAppStore } from '../../store/index.js';
import { useFieldIssues } from '../../store/useScenarioValidation.js';
import { DraftNumberInput } from './DraftNumberInput.js';
import { ModelNotes } from './ModelNotes.js';
import { QuantityKey, QuantityRow } from './QuantityRow.js';
import styles from './SimulatorPanel.module.css';

type GroundType = NonNullable<ExplosionScenarioInput['groundType']>;
const GROUND_TYPES: GroundType[] = ['HARD_ROCK', 'FIRM_GROUND', 'DRY_SOIL', 'WET_SOIL'];

/** Above the surface, or under the water. The model keeps one signed
 *  height of burst; the reader gets a height or a depth. */
type Placement = 'above' | 'underwater';
const PLACEMENTS: Placement[] = ['above', 'underwater'];
/** Where a charge goes when the reader first puts it under the water:
 *  shallow enough to sit within any sea the globe can be clicked on. */
const DEFAULT_BURST_DEPTH_M = 30;
/** Deeper than the Challenger Deep is refused by the schema too. */
const MAX_BURST_DEPTH_M = 11_000;

export function ExplosionCustomInputs(): JSX.Element {
  const { t } = useTranslation();
  const input = useAppStore((s) => s.explosion.input);
  const setExplosionInput = useAppStore((s) => s.setExplosionInput);

  // Validator-driven feedback (single source of truth). The wind-direction
  // slider is bound to [0,360) in the UI, so it never produces an
  // azimuth-wrap warning; we still subscribe to keep the contract
  // uniform if the bounds widen later.
  const yieldIssues = useFieldIssues('explosion', 'yieldMegatons');
  const hobIssues = useFieldIssues('explosion', 'heightOfBurst');
  const groundIssues = useFieldIssues('explosion', 'groundType');

  const updateYield = (text: string): void => {
    const v = parseFloat(text);
    if (Number.isFinite(v) && v > 0) setExplosionInput({ yieldMegatons: v });
  };
  const updateGround = (e: ChangeEvent<HTMLSelectElement>): void => {
    setExplosionInput({ groundType: e.target.value as GroundType });
  };
  const updateHob = (text: string): void => {
    const v = parseFloat(text);
    if (Number.isFinite(v) && v >= 0) setExplosionInput({ heightOfBurst: v });
  };
  const updatePlacement = (e: ChangeEvent<HTMLInputElement>): void => {
    setExplosionInput({
      heightOfBurst: e.target.value === 'underwater' ? -DEFAULT_BURST_DEPTH_M : 0,
    });
  };
  const updateDepth = (text: string): void => {
    const v = parseFloat(text);
    if (Number.isFinite(v) && v > 0 && v <= MAX_BURST_DEPTH_M) {
      setExplosionInput({ heightOfBurst: -v });
    }
  };
  const updateWindSpeed = (text: string): void => {
    const v = parseFloat(text);
    if (Number.isFinite(v) && v >= 0) setExplosionInput({ windSpeed: v });
  };
  const updateWindDirection = (e: ChangeEvent<HTMLInputElement>): void => {
    const v = parseFloat(e.target.value);
    if (Number.isFinite(v)) setExplosionInput({ windDirectionDeg: v });
  };

  const signedHob = input.heightOfBurst === undefined ? 0 : (input.heightOfBurst as number);
  const placement: Placement = signedHob < 0 ? 'underwater' : 'above';
  const hobValue = Math.max(signedHob, 0);
  const depthValue = signedHob < 0 ? -signedHob : DEFAULT_BURST_DEPTH_M;
  const windSpeedValue = input.windSpeed === undefined ? 0 : (input.windSpeed as number);
  const windDirectionValue = input.windDirectionDeg ?? 90;

  return (
    <fieldset className={styles.customParams} style={{ display: 'block' }}>
      <legend className={styles.customParamsLegend}>{t('simulator.customParams')}</legend>

      <QuantityRow
        label={t('simulator.explosion.yieldInput')}
        unit="Mt"
        source="user"
        note={t('simulator.explosion.yieldNote')}
        field="yieldMegatons"
        issues={yieldIssues}
      >
        <DraftNumberInput
          id="explosion-yield"
          inputMode="decimal"
          min={0.0001}
          max={10_000}
          step={0.1}
          value={input.yieldMegatons}
          onValueText={updateYield}
          aria-label={t('simulator.explosion.yieldInput')}
          aria-invalid={yieldIssues.hasError || undefined}
        />
      </QuantityRow>

      <QuantityRow
        label={t('simulator.explosion.groundType')}
        source="user"
        field="groundType"
        issues={groundIssues}
      >
        <select
          id="explosion-ground"
          value={input.groundType ?? 'FIRM_GROUND'}
          onChange={updateGround}
          aria-label={t('simulator.explosion.groundType')}
          aria-invalid={groundIssues.hasError || undefined}
        >
          {GROUND_TYPES.map((g) => (
            <option key={g} value={g}>
              {t(`simulator.explosion.ground.${g}`)}
            </option>
          ))}
        </select>
      </QuantityRow>

      <QuantityRow label={t('simulator.explosion.placementLabel')} source="user">
        <div style={{ display: 'flex', gap: 4 }}>
          {PLACEMENTS.map((p) => (
            <label key={p} className={styles.segItem} style={{ minHeight: 30 }}>
              <input
                type="radio"
                name="explosion-placement"
                value={p}
                checked={placement === p}
                onChange={updatePlacement}
                className={styles.segInput}
                data-testid={`explosion-placement-${p}`}
              />
              <span className={styles.segLabelWide}>
                {t(
                  p === 'above'
                    ? 'simulator.explosion.placementAbove'
                    : 'simulator.explosion.placementUnderwater'
                )}
              </span>
            </label>
          ))}
        </div>
      </QuantityRow>

      {placement === 'above' ? (
        <QuantityRow
          label={t('simulator.explosion.hobInput')}
          unit="m"
          source="user"
          note={t('simulator.explosion.hobNote')}
          field="heightOfBurst"
          issues={hobIssues}
        >
          <DraftNumberInput
            id="explosion-hob"
            inputMode="decimal"
            min={0}
            step={10}
            value={hobValue}
            onValueText={updateHob}
            aria-label={t('simulator.explosion.hobInput')}
            aria-invalid={hobIssues.hasError || undefined}
          />
        </QuantityRow>
      ) : (
        <QuantityRow
          label={t('simulator.explosion.depthInput')}
          unit="m"
          source="user"
          note={t('simulator.explosion.depthHelp')}
          field="heightOfBurst"
          issues={hobIssues}
        >
          <DraftNumberInput
            id="explosion-depth"
            inputMode="decimal"
            min={1}
            max={MAX_BURST_DEPTH_M}
            step={10}
            value={depthValue}
            onValueText={updateDepth}
            aria-label={t('simulator.explosion.depthInput')}
            aria-invalid={hobIssues.hasError || undefined}
          />
        </QuantityRow>
      )}

      <QuantityRow label={t('simulator.explosion.windSpeedInput')} unit="m/s" source="user">
        <DraftNumberInput
          id="explosion-wind-speed"
          inputMode="decimal"
          min={0}
          max={120}
          step={1}
          value={windSpeedValue}
          onValueText={updateWindSpeed}
          aria-label={t('simulator.explosion.windSpeedInput')}
        />
      </QuantityRow>

      <QuantityRow
        label={t('simulator.explosion.windDirectionLabel')}
        unit="°N"
        source="user"
        note={t('simulator.explosion.windDirectionAria', {
          degrees: windDirectionValue.toFixed(0),
          cardinal: cardinalFromDeg(windDirectionValue),
        })}
      >
        <input
          id="explosion-wind-direction"
          type="range"
          min={0}
          max={359}
          step={1}
          value={windDirectionValue}
          onChange={updateWindDirection}
          aria-label={t('simulator.explosion.windDirectionLabel')}
          aria-valuetext={t('simulator.explosion.windDirectionAria', {
            degrees: windDirectionValue.toFixed(0),
            cardinal: cardinalFromDeg(windDirectionValue),
          })}
          style={{ width: '100%', accentColor: '#F5A524' }}
        />
      </QuantityRow>

      <QuantityKey />
      <ModelNotes eventType="explosion" />
    </fieldset>
  );
}

/** Map a compass azimuth to the nearest 8-wind cardinal label
 *  (N, NE, E, SE, S, SW, W, NW) for the wind-direction slider's
 *  aria-valuetext. */
function cardinalFromDeg(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const idx = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return dirs[idx] ?? 'N';
}
