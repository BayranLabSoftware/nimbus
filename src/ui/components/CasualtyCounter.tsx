import { useEffect, useRef, useState, type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { casualtiesAtTime } from '../../physics/casualtyTimeline.js';
import { useAppStore } from '../../store/index.js';
import { currentLocale, formatPeople } from '../utils/numberFormat.js';
import { formatElapsed } from '../utils/timeFormat.js';
import {
  COUNTER_ANIMATION_MS,
  easeTowards,
  hasSettled,
  physicalTimeAt,
} from './casualtyCounterClock.js';
import styles from './CasualtyCounter.module.css';

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

interface CounterFrame {
  deaths: number;
  low: number;
  high: number;
  timeS: number;
  done: boolean;
}

/**
 * The death toll as the event unfolds, in the bar of the globe view.
 *
 * Nothing here is drama: the number is the casualty estimate swept by
 * the hazard front at the physical arrival time of each band, eased
 * on screen over the cascade's five-second budget, printed to two
 * significant figures with its low–high band and the physical clock
 * beside it. It starts from the provisional raster figure the moment
 * a result lands and glides to the WorldPop figure when that arrives.
 * Screen readers hear the final figure once, not every frame.
 */
export function CasualtyCounter(): JSX.Element | null {
  const { t } = useTranslation();
  const mode = useAppStore((s) => s.mode);
  const result = useAppStore((s) => s.result);
  const casualties = useAppStore((s) => s.casualties);
  const timeline = useAppStore((s) => s.casualtyTimeline);
  const startedAt = useAppStore((s) => s.casualtyClockStartedAt);
  const status = useAppStore((s) => s.casualtyStatus);
  const [frame, setFrame] = useState<CounterFrame | null>(null);
  /** Displayed deaths, eased; survives a refined estimate. */
  const shown = useRef(0);

  useEffect(() => {
    if (timeline === null || startedAt === null) {
      shown.current = 0;
      setFrame(null);
      return;
    }
    const reduced = prefersReducedMotion();
    let handle = 0;
    let cancelled = false;
    let last = performance.now();
    const tick = (): void => {
      if (cancelled) return;
      const now = performance.now();
      const progress = reduced ? 1 : (now - startedAt) / COUNTER_ANIMATION_MS;
      const timeS = physicalTimeAt(progress, timeline.deathsEndS);
      const sample = casualtiesAtTime(timeline, timeS);
      shown.current = reduced
        ? sample.deaths
        : easeTowards(shown.current, sample.deaths, now - last);
      last = now;
      const done = progress >= 1 && hasSettled(shown.current, sample.deaths);
      if (done) shown.current = sample.deaths;
      setFrame({
        deaths: shown.current,
        low: sample.deathsLow,
        high: sample.deathsHigh,
        timeS,
        done,
      });
      if (!done) handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(handle);
    };
  }, [timeline, startedAt]);

  if (mode !== 'globe' || result === null || status === 'unsupported') return null;
  if (frame === null || casualties === null) {
    if (status !== 'fetching') return null;
    return (
      <div className={styles.counter} data-testid="casualty-counter" data-state="pending">
        <span className={styles.label}>{t('appBar.casualties')}</span>
        <span className={styles.pending}>{t('appBar.casualtiesPending')}</span>
      </div>
    );
  }
  const locale = currentLocale();
  const deaths = formatPeople(frame.deaths, locale);
  const low = formatPeople(frame.low, locale);
  const high = formatPeople(frame.high, locale);
  const clock = formatElapsed(frame.timeS);
  return (
    <div
      className={styles.counter}
      title={t('appBar.casualtiesTitle')}
      data-testid="casualty-counter"
      data-state={frame.done ? 'done' : 'counting'}
    >
      <span className={styles.label}>{t('appBar.casualties')}</span>
      <span className={styles.value} aria-hidden="true">
        ≈ {deaths}
      </span>
      <span className={styles.band} aria-hidden="true">
        {t('appBar.casualtiesBand', { low, high })}
      </span>
      <span className={styles.clock} aria-hidden="true">
        {clock}
      </span>
      {casualties.provisional && (
        <span className={styles.tag}>{t('appBar.casualtiesProvisional')}</span>
      )}
      <span className={styles.srOnly} aria-live="polite">
        {frame.done ? t('appBar.casualtiesFinal', { deaths, low, high, time: clock }) : ''}
      </span>
    </div>
  );
}
