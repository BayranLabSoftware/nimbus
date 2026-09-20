import type { ChangeEvent, JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/index.js';
import { useFieldIssues } from '../../store/useScenarioValidation.js';
import { DraftNumberInput } from './DraftNumberInput.js';
import { QuantityKey, QuantityRow } from './QuantityRow.js';
import { fromScientific, isMantissa, scaleTyped, splitScientific } from './typedNumber.js';
import styles from './SimulatorPanel.module.css';

/**
 * Volume eruption rate (m³/s) and total ejecta volume (m³) span ~7
 * orders of magnitude across real events. The inputs use a
 * base-10 exponent editor to keep the range navigable: user types the
 * mantissa and picks an exponent from a select, UI multiplies back.
 */
const EXPONENTS_VDOT = [3, 4, 5, 6, 7, 8, 9];
const EXPONENTS_VOLUME = [7, 8, 9, 10, 11, 12, 13];

export function VolcanoCustomInputs(): JSX.Element {
  const { t } = useTranslation();
  const input = useAppStore((s) => s.volcano.input);
  const setVolcanoInput = useAppStore((s) => s.setVolcanoInput);

  // Validator-driven feedback. The mantissa+exponent editor re-creates
  // the underlying scalar, so issues attach to the underlying field
  // (`volumeEruptionRate` / `totalEjectaVolume`), not the split widgets.
  const vdotIssues = useFieldIssues('volcano', 'volumeEruptionRate');
  const volIssues = useFieldIssues('volcano', 'totalEjectaVolume');
  const laharIssues = useFieldIssues('volcano', 'laharVolume');
  const evacIssues = useFieldIssues('volcano', 'evacuationRadiusM');
  const windDirIssues = useFieldIssues('volcano', 'windDirectionDegrees');

  const vdot = splitScientific(input.volumeEruptionRate);
  const vol = splitScientific(input.totalEjectaVolume);

  const updateVdotMantissa = (text: string): void => {
    const m = parseFloat(text);
    if (isMantissa(m)) setVolcanoInput({ volumeEruptionRate: fromScientific(m, vdot.exp) });
  };
  const updateVdotExp = (e: ChangeEvent<HTMLSelectElement>): void => {
    setVolcanoInput({
      volumeEruptionRate: fromScientific(vdot.mantissa, parseInt(e.target.value, 10)),
    });
  };
  const updateVolMantissa = (text: string): void => {
    const m = parseFloat(text);
    if (isMantissa(m)) setVolcanoInput({ totalEjectaVolume: fromScientific(m, vol.exp) });
  };
  const updateLahar = (text: string): void => {
    const v = parseFloat(text);
    if (Number.isFinite(v) && v >= 0) setVolcanoInput({ laharVolume: v });
  };
  const updateVolExp = (e: ChangeEvent<HTMLSelectElement>): void => {
    setVolcanoInput({
      totalEjectaVolume: fromScientific(vol.mantissa, parseInt(e.target.value, 10)),
    });
  };
  // Kilometres on screen, metres in the model; empty or zero is a
  // scenario in which nobody was told to leave.
  const updateEvacuation = (text: string): void => {
    const km = text === '' ? 0 : parseFloat(text);
    if (Number.isFinite(km) && km >= 0) {
      setVolcanoInput({ evacuationRadiusM: scaleTyped(km, 1_000) });
    }
  };
  const updateWindSpeed = (text: string): void => {
    const v = parseFloat(text);
    if (Number.isFinite(v) && v >= 0) setVolcanoInput({ windSpeed: v });
  };
  const updateWindDirection = (text: string): void => {
    const v = parseFloat(text);
    if (Number.isFinite(v)) setVolcanoInput({ windDirectionDegrees: v });
  };

  return (
    <fieldset className={styles.customParams} style={{ display: 'block' }}>
      <legend className={styles.customParamsLegend}>{t('simulator.customParams')}</legend>

      {/* A mantissa and an exponent are two controls for ONE quantity, so
          they share one row: the value column holds both, and the unit
          and provenance columns stay where every other row has them. */}
      <QuantityRow
        label={t('simulator.volcano.vdotLabel')}
        unit="m³/s"
        source="user"
        note={t('simulator.volcano.vdotNote')}
        field="volumeEruptionRate"
        issues={vdotIssues}
      >
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', width: '100%' }}>
          <DraftNumberInput
            id="volcano-vdot-m"
            inputMode="decimal"
            min={1}
            max={9.9}
            step={0.1}
            value={vdot.mantissa.toFixed(1)}
            onValueText={updateVdotMantissa}
            aria-label={t('simulator.volcano.vdotInput')}
            aria-invalid={vdotIssues.hasError || undefined}
            style={{ width: 52 }}
          />
          <select
            id="volcano-vdot-e"
            value={vdot.exp}
            onChange={updateVdotExp}
            aria-label={t('simulator.volcano.vdotExp')}
            style={{ width: 66 }}
          >
            {EXPONENTS_VDOT.map((e) => (
              <option key={e} value={e}>
                ×10^{e}
              </option>
            ))}
          </select>
        </div>
      </QuantityRow>

      <QuantityRow
        label={t('simulator.volcano.volumeLabel')}
        unit="m³"
        source="user"
        field="totalEjectaVolume"
        issues={volIssues}
      >
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', width: '100%' }}>
          <DraftNumberInput
            id="volcano-vol-m"
            inputMode="decimal"
            min={1}
            max={9.9}
            step={0.1}
            value={vol.mantissa.toFixed(1)}
            onValueText={updateVolMantissa}
            aria-label={t('simulator.volcano.volumeInput')}
            aria-invalid={volIssues.hasError || undefined}
            style={{ width: 52 }}
          />
          <select
            id="volcano-vol-e"
            value={vol.exp}
            onChange={updateVolExp}
            aria-label={t('simulator.volcano.volumeExp')}
            style={{ width: 66 }}
          >
            {EXPONENTS_VOLUME.map((e) => (
              <option key={e} value={e}>
                ×10^{e}
              </option>
            ))}
          </select>
        </div>
      </QuantityRow>

      <QuantityRow
        label={t('simulator.volcano.laharVolumeInput')}
        unit="m³"
        source="user"
        field="laharVolume"
        issues={laharIssues}
      >
        <DraftNumberInput
          id="volcano-lahar"
          inputMode="decimal"
          min={0}
          step={1_000_000}
          value={input.laharVolume ?? 0}
          onValueText={updateLahar}
          aria-label={t('simulator.volcano.laharVolumeInput')}
          aria-invalid={laharIssues.hasError || undefined}
        />
      </QuantityRow>

      <QuantityRow
        label={t('simulator.volcano.evacuationRadiusInput')}
        unit="km"
        source="user"
        note={t('simulator.volcano.evacuationRadiusHelp')}
        field="evacuationRadiusM"
        issues={evacIssues}
      >
        <DraftNumberInput
          id="volcano-evac"
          inputMode="decimal"
          min={0}
          step={1}
          value={
            input.evacuationRadiusM === undefined ? 0 : (input.evacuationRadiusM as number) / 1_000
          }
          onValueText={updateEvacuation}
          aria-label={t('simulator.volcano.evacuationRadiusInput')}
          aria-invalid={evacIssues.hasError || undefined}
        />
      </QuantityRow>

      <QuantityRow label={t('simulator.volcano.windSpeedInput')} unit="m/s" source="user">
        <DraftNumberInput
          id="volcano-wind-speed"
          inputMode="decimal"
          min={0}
          max={120}
          step={1}
          value={input.windSpeed ?? 0}
          onValueText={updateWindSpeed}
          aria-label={t('simulator.volcano.windSpeedInput')}
        />
      </QuantityRow>

      <QuantityRow
        label={t('simulator.volcano.windDirectionInput')}
        unit="°N"
        source="user"
        field="windDirectionDegrees"
        issues={windDirIssues}
      >
        <DraftNumberInput
          id="volcano-wind-dir"
          inputMode="decimal"
          min={0}
          max={359}
          step={1}
          value={input.windDirectionDegrees ?? 90}
          onValueText={updateWindDirection}
          aria-label={t('simulator.volcano.windDirectionInput')}
          aria-invalid={windDirIssues.hasError || undefined}
        />
      </QuantityRow>

      <QuantityKey />
    </fieldset>
  );
}
