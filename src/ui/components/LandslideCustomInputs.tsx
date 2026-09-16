import type { ChangeEvent, JSX } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LANDSLIDE_DEFAULT_REGIME,
  LANDSLIDE_DEFAULT_SLOPE_DEG,
  type LandslideRegime,
} from '../../physics/events/landslide/index.js';
import {
  DEFAULT_CONFINEMENT_DYNAMIC_FACTOR,
  DEFAULT_SOURCE_BASIN_DEPTH_M,
  VOLCANO_TSUNAMI_REFERENCE_DENSITY_SUBAERIAL,
  VOLCANO_TSUNAMI_REFERENCE_DENSITY_SUBMARINE,
} from '../../physics/events/volcano/tsunami.js';
import { useAppStore } from '../../store/index.js';
import { useFieldIssues } from '../../store/useScenarioValidation.js';
import { cx } from '../utils/cx.js';
import { formatDecimal, formatInteger } from '../utils/numberFormat.js';
import { DraftNumberInput } from './DraftNumberInput.js';
import { FieldFeedback } from './FieldFeedback.js';
import { fromScientific, isMantissa, splitScientific } from './typedNumber.js';
import styles from './SimulatorPanel.module.css';

/** From a rockfall of ten thousand cubic metres to Storegga's three
 *  thousand cubic kilometres, a decade a step. */
const VOLUME_EXPONENTS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const REGIMES: LandslideRegime[] = ['subaerial', 'submarine'];
/** Areas are read in km² and kept in m². */
const M2_PER_KM2 = 1_000_000;

/**
 * Every field the landslide model reads. The empty optional fields are
 * the model's own defaults, named from the physics so the panel cannot
 * drift from it: a compact slide, open water, the amplification used
 * for Vaiont, the density each regime was calibrated at.
 */
export function LandslideCustomInputs(): JSX.Element {
  const { t } = useTranslation();
  const input = useAppStore((s) => s.landslide.input);
  const setLandslideInput = useAppStore((s) => s.setLandslideInput);

  const volumeIssues = useFieldIssues('landslide', 'volumeM3');
  const slopeIssues = useFieldIssues('landslide', 'slopeAngleDeg');
  const depthIssues = useFieldIssues('landslide', 'meanOceanDepth');
  const densityIssues = useFieldIssues('landslide', 'slideDensity');
  const footprintIssues = useFieldIssues('landslide', 'slideFootprintArea');
  const basinIssues = useFieldIssues('landslide', 'confinedBasinArea');
  const factorIssues = useFieldIssues('landslide', 'confinementDynamicFactor');
  const thicknessIssues = useFieldIssues('landslide', 'slideThicknessM');
  const widthIssues = useFieldIssues('landslide', 'slideWidthM');
  const speedIssues = useFieldIssues('landslide', 'impactVelocityMS');
  const dropIssues = useFieldIssues('landslide', 'dropHeightM');

  const volume = splitScientific(input.volumeM3);
  // A link can carry a volume outside the list; it still has to show.
  const exponents = VOLUME_EXPONENTS.includes(volume.exp)
    ? VOLUME_EXPONENTS
    : [...VOLUME_EXPONENTS, volume.exp].sort((a, b) => a - b);
  const regime = input.regime ?? LANDSLIDE_DEFAULT_REGIME;
  const referenceDensity =
    regime === 'subaerial'
      ? VOLCANO_TSUNAMI_REFERENCE_DENSITY_SUBAERIAL
      : VOLCANO_TSUNAMI_REFERENCE_DENSITY_SUBMARINE;
  const basinArea = input.confinedBasinArea as number | undefined;
  const footprintArea = input.slideFootprintArea as number | undefined;

  const updateVolumeMantissa = (text: string): void => {
    const v = parseFloat(text);
    if (isMantissa(v)) setLandslideInput({ volumeM3: fromScientific(v, volume.exp) });
  };
  const updateVolumeExp = (e: ChangeEvent<HTMLSelectElement>): void => {
    setLandslideInput({
      volumeM3: fromScientific(volume.mantissa, parseInt(e.target.value, 10)),
    });
  };
  const updateRegime = (e: ChangeEvent<HTMLInputElement>): void => {
    setLandslideInput({ regime: e.target.value as LandslideRegime });
  };
  const updateSlope = (text: string): void => {
    const v = parseFloat(text);
    if (v > 0 && v < 90) setLandslideInput({ slopeAngleDeg: v });
  };
  const updateDepth = (text: string): void => {
    const v = parseFloat(text);
    if (Number.isFinite(v) && v >= 0) setLandslideInput({ meanOceanDepth: v });
  };
  /** An optional field: empty removes it, a positive number sets it,
   *  anything else leaves it as it was. */
  const optional = (text: string, scale = 1): number | null | undefined => {
    if (text === '') return null;
    const v = parseFloat(text);
    return Number.isFinite(v) && v > 0 ? v * scale : undefined;
  };
  const updateDensity = (text: string): void => {
    const v = optional(text);
    if (v !== undefined) setLandslideInput({ slideDensity: v });
  };
  const updateFootprint = (text: string): void => {
    const v = optional(text, M2_PER_KM2);
    if (v !== undefined) setLandslideInput({ slideFootprintArea: v });
  };
  const updateBasin = (text: string): void => {
    const v = optional(text, M2_PER_KM2);
    // Back in open water the amplification means nothing: it goes too.
    if (v === null) setLandslideInput({ confinedBasinArea: null, confinementDynamicFactor: null });
    else if (v !== undefined) setLandslideInput({ confinedBasinArea: v });
  };
  const updateFactor = (text: string): void => {
    const v = optional(text);
    if (v !== undefined) setLandslideInput({ confinementDynamicFactor: v });
  };
  /** The slide as the impulse wave manual wants it, each field optional. */
  const measures = [
    ['landslide-thickness', 'slideThicknessM', 'thicknessInput', thicknessIssues, 1],
    ['landslide-width', 'slideWidthM', 'widthInput', widthIssues, 10],
    ['landslide-speed', 'impactVelocityMS', 'speedInput', speedIssues, 1],
    ['landslide-drop', 'dropHeightM', 'dropInput', dropIssues, 10],
  ] as const;

  return (
    <fieldset className={styles.customParams}>
      <legend className={styles.customParamsLegend}>{t('simulator.customParams')}</legend>

      <div className={styles.paramField}>
        <label className={styles.paramLabel} htmlFor="landslide-volume-m">
          {t('simulator.landslide.volumeInput')}
        </label>
        <DraftNumberInput
          id="landslide-volume-m"
          className={styles.paramInput}
          inputMode="decimal"
          min={1}
          max={9.9}
          step={0.1}
          value={volume.mantissa.toFixed(1)}
          onValueText={updateVolumeMantissa}
          aria-invalid={volumeIssues.hasError || undefined}
          aria-describedby={volumeIssues.topMessage ? 'landslide-volume-feedback' : undefined}
        />
      </div>

      <div className={styles.paramField}>
        <label className={styles.paramLabel} htmlFor="landslide-volume-e">
          {t('simulator.landslide.volumeExp')}
        </label>
        <select
          id="landslide-volume-e"
          className={styles.paramInput}
          value={volume.exp}
          onChange={updateVolumeExp}
        >
          {exponents.map((e) => (
            <option key={e} value={e}>
              10^{e}
            </option>
          ))}
        </select>
        <span id="landslide-volume-feedback">
          <FieldFeedback
            field="volumeM3"
            message={volumeIssues.topMessage}
            code={volumeIssues.topCode}
            isError={volumeIssues.hasError}
          />
        </span>
      </div>

      <fieldset
        className={cx(styles.segFieldset, styles.regimeFieldset)}
        aria-describedby="landslide-regime-help"
      >
        <legend className={styles.paramLabel}>{t('simulator.landslide.regimeLabel')}</legend>
        <div className={cx(styles.seg, styles.segTwo)}>
          {REGIMES.map((r) => (
            <label key={r} className={styles.segItem}>
              <input
                type="radio"
                name="landslide-regime"
                value={r}
                checked={regime === r}
                onChange={updateRegime}
                className={styles.segInput}
                data-testid={`landslide-regime-${r}`}
              />
              <span className={styles.segLabelWide}>
                {t(
                  r === 'subaerial'
                    ? 'simulator.landslide.regimeSubaerial'
                    : 'simulator.landslide.regimeSubmarine'
                )}
              </span>
            </label>
          ))}
        </div>
        <span id="landslide-regime-help" className={styles.presetNote}>
          {t('simulator.landslide.regimeHelp')}
        </span>
      </fieldset>

      <div className={styles.paramField}>
        <label className={styles.paramLabel} htmlFor="landslide-slope">
          {t('simulator.landslide.slopeInput')}
        </label>
        <DraftNumberInput
          id="landslide-slope"
          className={styles.paramInput}
          inputMode="decimal"
          min={1}
          max={89}
          step={1}
          value={input.slopeAngleDeg ?? LANDSLIDE_DEFAULT_SLOPE_DEG}
          onValueText={updateSlope}
          aria-invalid={slopeIssues.hasError || undefined}
          aria-describedby={slopeIssues.topMessage ? 'landslide-slope-feedback' : undefined}
        />
        <span id="landslide-slope-feedback">
          <FieldFeedback
            field="slopeAngleDeg"
            message={slopeIssues.topMessage}
            code={slopeIssues.topCode}
            isError={slopeIssues.hasError}
          />
        </span>
      </div>

      <div className={styles.paramField}>
        <label className={styles.paramLabel} htmlFor="landslide-density">
          {t('simulator.landslide.densityInput', { reference: formatInteger(referenceDensity) })}
        </label>
        <DraftNumberInput
          id="landslide-density"
          className={styles.paramInput}
          inputMode="decimal"
          min={1}
          max={5_000}
          step={50}
          placeholder={String(referenceDensity)}
          value={input.slideDensity ?? ''}
          onValueText={updateDensity}
          aria-invalid={densityIssues.hasError || undefined}
          aria-describedby={densityIssues.topMessage ? 'landslide-density-feedback' : undefined}
        />
        <span id="landslide-density-feedback">
          <FieldFeedback
            field="slideDensity"
            message={densityIssues.topMessage}
            code={densityIssues.topCode}
            isError={densityIssues.hasError}
          />
        </span>
      </div>

      <div className={styles.paramField} style={{ gridColumn: '1 / -1' }}>
        <label className={styles.paramLabel} htmlFor="landslide-depth">
          {t('simulator.landslide.depthInput')}
        </label>
        <DraftNumberInput
          id="landslide-depth"
          className={styles.paramInput}
          inputMode="decimal"
          min={0}
          max={11_000}
          step={10}
          value={input.meanOceanDepth ?? DEFAULT_SOURCE_BASIN_DEPTH_M}
          onValueText={updateDepth}
          aria-invalid={depthIssues.hasError || undefined}
          aria-describedby="landslide-depth-help"
        />
        <span id="landslide-depth-help" className={styles.presetNote}>
          {t('simulator.landslide.depthHelp')}
        </span>
        <FieldFeedback
          field="meanOceanDepth"
          message={depthIssues.topMessage}
          code={depthIssues.topCode}
          isError={depthIssues.hasError}
        />
      </div>

      {regime === 'subaerial' &&
        measures.map(([id, field, label, issues, step]) => (
          <div key={id} className={styles.paramField}>
            <label className={styles.paramLabel} htmlFor={id}>
              {t(`simulator.landslide.${label}`)}
            </label>
            <DraftNumberInput
              id={id}
              className={styles.paramInput}
              inputMode="decimal"
              min={0}
              step={step}
              value={input[field] ?? ''}
              onValueText={(text: string) => {
                const v = optional(text);
                if (v !== undefined) setLandslideInput({ [field]: v });
              }}
              aria-invalid={issues.hasError || undefined}
              aria-describedby="landslide-manual-help"
              data-testid={id}
            />
            <FieldFeedback
              field={field}
              message={issues.topMessage}
              code={issues.topCode}
              isError={issues.hasError}
            />
          </div>
        ))}
      {regime === 'subaerial' && (
        <span
          id="landslide-manual-help"
          className={styles.presetNote}
          style={{ gridColumn: '1 / -1' }}
        >
          {t('simulator.landslide.manualHelp')}
        </span>
      )}

      <div className={styles.paramField} style={{ gridColumn: '1 / -1' }}>
        <label className={styles.paramLabel} htmlFor="landslide-footprint">
          {t('simulator.landslide.footprintInput')}
        </label>
        <DraftNumberInput
          id="landslide-footprint"
          className={styles.paramInput}
          inputMode="decimal"
          min={0}
          step={1}
          value={footprintArea === undefined ? '' : footprintArea / M2_PER_KM2}
          onValueText={updateFootprint}
          aria-invalid={footprintIssues.hasError || undefined}
          aria-describedby="landslide-footprint-help"
        />
        <span id="landslide-footprint-help" className={styles.presetNote}>
          {t('simulator.landslide.footprintHelp')}
        </span>
        <FieldFeedback
          field="slideFootprintArea"
          message={footprintIssues.topMessage}
          code={footprintIssues.topCode}
          isError={footprintIssues.hasError}
        />
      </div>

      <div className={styles.paramField} style={{ gridColumn: '1 / -1' }}>
        <label className={styles.paramLabel} htmlFor="landslide-basin">
          {t('simulator.landslide.basinInput')}
        </label>
        <DraftNumberInput
          id="landslide-basin"
          className={styles.paramInput}
          inputMode="decimal"
          min={0}
          step={1}
          value={basinArea === undefined ? '' : basinArea / M2_PER_KM2}
          onValueText={updateBasin}
          aria-invalid={basinIssues.hasError || undefined}
          aria-describedby="landslide-basin-help"
        />
        <span id="landslide-basin-help" className={styles.presetNote}>
          {t('simulator.landslide.basinHelp')}
        </span>
        <FieldFeedback
          field="confinedBasinArea"
          message={basinIssues.topMessage}
          code={basinIssues.topCode}
          isError={basinIssues.hasError}
        />
      </div>

      {basinArea !== undefined && (
        <div className={styles.paramField}>
          <label className={styles.paramLabel} htmlFor="landslide-factor">
            {t('simulator.landslide.factorInput', {
              default: formatDecimal(DEFAULT_CONFINEMENT_DYNAMIC_FACTOR, 1),
            })}
          </label>
          <DraftNumberInput
            id="landslide-factor"
            className={styles.paramInput}
            inputMode="decimal"
            min={0.1}
            max={10}
            step={0.1}
            placeholder={String(DEFAULT_CONFINEMENT_DYNAMIC_FACTOR)}
            value={input.confinementDynamicFactor ?? ''}
            onValueText={updateFactor}
            aria-invalid={factorIssues.hasError || undefined}
            aria-describedby={factorIssues.topMessage ? 'landslide-factor-feedback' : undefined}
          />
          <span id="landslide-factor-feedback">
            <FieldFeedback
              field="confinementDynamicFactor"
              message={factorIssues.topMessage}
              code={factorIssues.topCode}
              isError={factorIssues.hasError}
            />
          </span>
        </div>
      )}
    </fieldset>
  );
}
