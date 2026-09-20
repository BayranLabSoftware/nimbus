import type { ChangeEvent, JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { ASTEROID_TAXONOMY, type AsteroidTaxonomyClass } from '../../physics/constants.js';
import { radiansToDegrees } from '../../physics/units.js';
import { useAppStore } from '../../store/index.js';
import { useFieldIssues } from '../../store/useScenarioValidation.js';
import { DraftNumberInput } from './DraftNumberInput.js';
import { QuantityKey, QuantityRow } from './QuantityRow.js';
import { scaleTyped } from './typedNumber.js';
import styles from './SimulatorPanel.module.css';

const TAXONOMY_CLASSES: AsteroidTaxonomyClass[] = [
  'COMETARY',
  'C_TYPE',
  'S_TYPE',
  'M_TYPE',
  'IRON',
];

/**
 * Numeric inputs for the six impact-scenario parameters. Reading the
 * live input from the store means switching to a preset instantly
 * refills the fields; editing any field flips the preset to CUSTOM.
 *
 * The store helpers (setImpactInput) expect plain numbers in the same
 * units the struct stores (meters, m/s, kg/m³, degrees), so we convert
 * m → km and m/s → km/s only at the display layer for readability.
 */
export function ImpactCustomInputs(): JSX.Element {
  const { t } = useTranslation();
  const input = useAppStore((s) => s.impact.input);
  const setImpactInput = useAppStore((s) => s.setImpactInput);

  // Validator-driven feedback for the six numeric impact parameters.
  // Field paths follow the validator (`impactorDiameter`, etc.). The
  // azimuth field is wrapped to [0, 360) by the validator and may
  // surface NORMALIZED_AZIMUTH if the user types an out-of-range value.
  const diameterIssues = useFieldIssues('impact', 'impactorDiameter');
  const velocityIssues = useFieldIssues('impact', 'impactVelocity');
  const impactorDensityIssues = useFieldIssues('impact', 'impactorDensity');
  const angleIssues = useFieldIssues('impact', 'impactAngle');
  const azimuthIssues = useFieldIssues('impact', 'impactAzimuthDeg');

  // B-082: the diameter was edited in kilometres, so Chelyabinsk — which
  // the preset's own caption calls "a body of 19,8 m" — read 0.0198 in
  // the field beneath it. Metres are the unit that reads for both ends of
  // the range this model covers (a 19 m airburster and a 10 km
  // dinosaur-killer), so the field is metres and the note gives the
  // kilometres when there are enough of them to matter.
  const diameterM = input.impactorDiameter as number;
  const velocityKms = (input.impactVelocity as number) / 1_000;
  // Round to 2 decimals: degrees↔radians round-trips would otherwise
  // surface noise like "29,9999999999°" for a preset that started as
  // an integer (e.g. Tunguska 30°).
  const angleDeg = Math.round((radiansToDegrees(input.impactAngle) as number) * 100) / 100;
  const azimuthDeg = input.impactAzimuthDeg ?? 90;

  const updateDiameter = (text: string): void => {
    const metres = parseFloat(text);
    if (Number.isFinite(metres) && metres > 0)
      setImpactInput({ impactorDiameter: scaleTyped(metres, 1) });
  };
  const updateVelocity = (text: string): void => {
    const kms = parseFloat(text);
    if (Number.isFinite(kms) && kms > 0) setImpactInput({ impactVelocity: scaleTyped(kms, 1_000) });
  };
  const updateImpactorDensity = (text: string): void => {
    const v = parseFloat(text);
    if (Number.isFinite(v) && v > 0) setImpactInput({ impactorDensity: v });
  };
  const updateTargetDensity = (text: string): void => {
    const v = parseFloat(text);
    if (Number.isFinite(v) && v > 0) setImpactInput({ targetDensity: v });
  };
  const updateAngle = (text: string): void => {
    const deg = parseFloat(text);
    if (Number.isFinite(deg) && deg > 0 && deg <= 90) setImpactInput({ impactAngle: deg });
  };
  const updateAzimuth = (e: ChangeEvent<HTMLInputElement>): void => {
    const deg = parseFloat(e.target.value);
    if (Number.isFinite(deg)) setImpactInput({ impactAzimuthDeg: deg });
  };
  const applyTaxonomy = (e: ChangeEvent<HTMLSelectElement>): void => {
    const cls = e.target.value as AsteroidTaxonomyClass;
    // Phase-17 audit: previously this only copied `density`, leaving
    // `impactorStrength` at the STONY default (1 MPa). An iron custom
    // impactor was therefore mis-classified as airbursting at altitudes
    // a real iron body would punch through (Meteor-Crater regime).
    // Apply both fields together so the asteroid class is materially
    // self-consistent.
    const taxonomy = ASTEROID_TAXONOMY[cls];
    setImpactInput({
      impactorDensity: taxonomy.density,
      impactorStrength: taxonomy.strength,
    });
  };

  return (
    <fieldset className={styles.customParams} style={{ display: 'block' }}>
      <legend className={styles.customParamsLegend}>{t('simulator.customParams')}</legend>

      <QuantityRow
        label={t('simulator.impact.taxonomy')}
        source="user"
        note={t('simulator.impact.taxonomyNote')}
      >
        <select
          id="impact-taxonomy"
          defaultValue=""
          onChange={applyTaxonomy}
          aria-label={t('simulator.impact.taxonomy')}
        >
          <option value="" disabled>
            {t('simulator.impact.taxonomyPlaceholder')}
          </option>
          {TAXONOMY_CLASSES.map((cls) => (
            <option key={cls} value={cls}>
              {t(`simulator.impact.taxonomyClasses.${cls}`)}
            </option>
          ))}
        </select>
      </QuantityRow>

      <QuantityRow
        label={t('simulator.impact.diameter')}
        unit="m"
        source="user"
        note={
          diameterM >= 1_000
            ? t('simulator.impact.diameterInKm', {
                value: (diameterM / 1_000).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                }),
              })
            : undefined
        }
        field="impactorDiameter"
        issues={diameterIssues}
      >
        <DraftNumberInput
          id="impact-diameter"
          inputMode="decimal"
          min={0.1}
          step={1}
          value={diameterM}
          onValueText={updateDiameter}
          aria-label={t('simulator.impact.diameter')}
          aria-invalid={diameterIssues.hasError || undefined}
        />
      </QuantityRow>

      <QuantityRow
        label={t('simulator.impact.velocity')}
        unit="km/s"
        source="user"
        field="impactVelocity"
        issues={velocityIssues}
      >
        <DraftNumberInput
          id="impact-velocity"
          inputMode="decimal"
          min={1}
          max={80}
          step={0.1}
          value={velocityKms}
          onValueText={updateVelocity}
          aria-label={t('simulator.impact.velocity')}
          aria-invalid={velocityIssues.hasError || undefined}
        />
      </QuantityRow>

      <QuantityRow
        label={t('simulator.impact.impactorDensity')}
        unit="kg/m³"
        source="user"
        field="impactorDensity"
        issues={impactorDensityIssues}
      >
        <DraftNumberInput
          id="impact-density"
          inputMode="decimal"
          min={100}
          step={100}
          value={input.impactorDensity}
          onValueText={updateImpactorDensity}
          aria-label={t('simulator.impact.impactorDensity')}
          aria-invalid={impactorDensityIssues.hasError || undefined}
        />
      </QuantityRow>

      <QuantityRow label={t('simulator.impact.targetDensity')} unit="kg/m³" source="user">
        <DraftNumberInput
          id="impact-target-density"
          inputMode="decimal"
          min={100}
          step={100}
          value={input.targetDensity}
          onValueText={updateTargetDensity}
          aria-label={t('simulator.impact.targetDensity')}
        />
      </QuantityRow>

      <QuantityRow
        label={t('simulator.impact.angle')}
        unit="°"
        source="user"
        note={t('simulator.impact.angleNote')}
        field="impactAngle"
        issues={angleIssues}
      >
        <DraftNumberInput
          id="impact-angle"
          inputMode="decimal"
          min={1}
          max={90}
          step={1}
          value={angleDeg}
          onValueText={updateAngle}
          aria-label={t('simulator.impact.angle')}
          aria-invalid={angleIssues.hasError || undefined}
        />
      </QuantityRow>

      <QuantityRow
        label={t('simulator.impact.azimuthLabel')}
        unit="°N"
        source="user"
        note={t('simulator.impact.azimuthNote', { degrees: Math.round(azimuthDeg).toString() })}
        field="impactAzimuthDeg"
        issues={azimuthIssues}
      >
        <input
          id="impact-azimuth"
          type="range"
          min={0}
          max={359}
          step={1}
          value={azimuthDeg}
          onChange={updateAzimuth}
          aria-label={t('simulator.impact.azimuthLabel')}
          style={{ width: '100%', accentColor: '#F5A524' }}
        />
      </QuantityRow>

      <QuantityKey />
    </fieldset>
  );
}
