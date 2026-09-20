import type { ChangeEvent, JSX } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LANDSLIDE_DEFAULT_REGIME,
  type LandslideRegime,
} from '../../physics/events/landslide/index.js';
import {
  DEFAULT_CONFINEMENT_DYNAMIC_FACTOR,
  VOLCANO_TSUNAMI_REFERENCE_DENSITY_SUBAERIAL,
  VOLCANO_TSUNAMI_REFERENCE_DENSITY_SUBMARINE,
} from '../../physics/events/volcano/tsunami.js';
import { useAppStore } from '../../store/index.js';
import { useFieldIssues } from '../../store/useScenarioValidation.js';
import { formatDecimal, formatInteger } from '../utils/numberFormat.js';
import { DraftNumberInput } from './DraftNumberInput.js';
import { QuantityKey, QuantityRow } from './QuantityRow.js';
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
    <fieldset className={styles.customParams} style={{ display: 'block' }}>
      <legend className={styles.customParamsLegend}>{t('simulator.customParams')}</legend>

      <QuantityRow
        label={t('simulator.landslide.volumeLabel')}
        unit="m³"
        source="user"
        field="volumeM3"
        issues={volumeIssues}
      >
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', width: '100%' }}>
          <DraftNumberInput
            id="landslide-volume-m"
            inputMode="decimal"
            min={1}
            max={9.9}
            step={0.1}
            value={volume.mantissa.toFixed(1)}
            onValueText={updateVolumeMantissa}
            aria-label={t('simulator.landslide.volumeInput')}
            aria-invalid={volumeIssues.hasError || undefined}
            style={{ width: 52 }}
          />
          <select
            id="landslide-volume-e"
            value={volume.exp}
            onChange={updateVolumeExp}
            aria-label={t('simulator.landslide.volumeExp')}
            style={{ width: 66 }}
          >
            {exponents.map((e) => (
              <option key={e} value={e}>
                ×10^{e}
              </option>
            ))}
          </select>
        </div>
      </QuantityRow>

      <QuantityRow
        label={t('simulator.landslide.regimeLabel')}
        source="user"
        note={t('simulator.landslide.regimeHelp')}
      >
        <div style={{ display: 'flex', gap: 4 }}>
          {REGIMES.map((r) => (
            <label key={r} className={styles.segItem} style={{ minHeight: 30 }}>
              <input
                type="radio"
                name="landslide-regime"
                value={r}
                checked={regime === r}
                onChange={updateRegime}
                className={styles.segInput}
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
      </QuantityRow>

      <QuantityRow
        label={t('simulator.landslide.slopeLabel')}
        unit="°"
        source="user"
        field="slopeAngleDeg"
        issues={slopeIssues}
      >
        <DraftNumberInput
          id="landslide-slope"
          inputMode="decimal"
          min={1}
          max={89}
          step={1}
          value={input.slopeAngleDeg ?? 30}
          onValueText={updateSlope}
          aria-label={t('simulator.landslide.slopeInput')}
          aria-invalid={slopeIssues.hasError || undefined}
        />
      </QuantityRow>

      <QuantityRow
        label={t('simulator.landslide.densityLabel')}
        unit="kg/m³"
        source="user"
        note={t('simulator.landslide.densityNote', {
          reference: formatInteger(referenceDensity),
        })}
        field="slideDensity"
        issues={densityIssues}
      >
        <DraftNumberInput
          id="landslide-density"
          inputMode="decimal"
          min={500}
          step={100}
          // Empty means "the reference for this regime", which is what the
          // model uses: filling the box with that number would say the
          // reader chose it.
          value={input.slideDensity ?? ''}
          placeholder={formatInteger(referenceDensity)}
          onValueText={updateDensity}
          aria-label={t('simulator.landslide.densityInput', {
            reference: formatInteger(referenceDensity),
          })}
          aria-invalid={densityIssues.hasError || undefined}
        />
      </QuantityRow>

      <QuantityRow
        label={t('simulator.landslide.depthLabel')}
        unit="m"
        source="user"
        note={t('simulator.landslide.depthHelp')}
        field="meanOceanDepth"
        issues={depthIssues}
      >
        <DraftNumberInput
          id="landslide-depth"
          inputMode="decimal"
          min={1}
          step={10}
          value={input.meanOceanDepth ?? ''}
          onValueText={updateDepth}
          aria-label={t('simulator.landslide.depthInput')}
          aria-invalid={depthIssues.hasError || undefined}
        />
      </QuantityRow>

      {regime === 'subaerial' &&
        measures.map(([id, field, label, issues, step]) => (
          <QuantityRow
            key={id}
            label={t(`simulator.landslide.${label}`)}
            unit={label === 'speedInput' ? 'm/s' : 'm'}
            source="user"
            field={field}
            issues={issues}
          >
            <DraftNumberInput
              id={id}
              inputMode="decimal"
              min={0}
              step={step}
              value={input[field] ?? ''}
              onValueText={(text: string): void => {
                const v = optional(text);
                if (v !== undefined) setLandslideInput({ [field]: v });
              }}
              aria-label={t(`simulator.landslide.${label}`)}
              aria-invalid={issues.hasError || undefined}
              data-testid={id}
            />
          </QuantityRow>
        ))}

      {regime === 'subaerial' && (
        <p className={styles.quantityNote}>{t('simulator.landslide.manualHelp')}</p>
      )}

      <QuantityRow
        label={t('simulator.landslide.footprintLabel')}
        unit="km²"
        source="user"
        note={t('simulator.landslide.footprintHelp')}
        field="slideFootprintArea"
        issues={footprintIssues}
      >
        <DraftNumberInput
          id="landslide-footprint"
          inputMode="decimal"
          min={0}
          step={1}
          value={footprintArea === undefined ? '' : footprintArea / M2_PER_KM2}
          onValueText={updateFootprint}
          aria-label={t('simulator.landslide.footprintInput')}
          aria-invalid={footprintIssues.hasError || undefined}
        />
      </QuantityRow>

      <QuantityRow
        label={t('simulator.landslide.basinLabel')}
        unit="km²"
        source="user"
        field="confinedBasinArea"
        issues={basinIssues}
      >
        <DraftNumberInput
          id="landslide-basin"
          inputMode="decimal"
          min={0}
          step={1}
          value={basinArea === undefined ? '' : basinArea / M2_PER_KM2}
          onValueText={updateBasin}
          aria-label={t('simulator.landslide.basinInput')}
          aria-invalid={basinIssues.hasError || undefined}
        />
      </QuantityRow>

      {/* The amplification acts on a confined basin: with no basin there is
          nothing for it to act on, so the row is not there to be filled in.
          Guarded by the E2E "a landslide is edited in the panel". */}
      {basinArea !== undefined && (
        <QuantityRow
          label={t('simulator.landslide.factorLabel')}
          source="user"
          field="confinementDynamicFactor"
          issues={factorIssues}
        >
          <DraftNumberInput
            id="landslide-factor"
            inputMode="decimal"
            min={1}
            step={0.1}
            value={input.confinementDynamicFactor ?? ''}
            onValueText={updateFactor}
            aria-label={t('simulator.landslide.factorInput', {
              default: formatDecimal(DEFAULT_CONFINEMENT_DYNAMIC_FACTOR, 1),
            })}
            placeholder={String(DEFAULT_CONFINEMENT_DYNAMIC_FACTOR)}
            aria-invalid={factorIssues.hasError || undefined}
          />
        </QuantityRow>
      )}

      <QuantityKey />
    </fieldset>
  );
}
