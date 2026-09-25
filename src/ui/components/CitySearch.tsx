import type { JSX } from 'react';
import { useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cityDisplayName,
  formatPopulation,
  loadCityIndex,
  searchCities,
  type CityRecord,
} from '../../scene/globe/cityLabels.js';
import { useAppStore } from '../../store/index.js';
import { parseCoordinates } from './coordinateQuery.js';
import styles from './CitySearch.module.css';

/** Radius (m) the camera frames around a searched city — enough to
 *  see the metro area and the coast it sits on, close enough that
 *  the next click lands where the user means it to. */
const CITY_FRAME_RADIUS_M = 60_000;

/**
 * "Go to a city" field for the simulator panel. Type a name, pick a
 * match (or press Enter for the first one): the pin moves to the city
 * and the globe flies there. Same Natural Earth index the globe draws,
 * so every name on the map is also a search hit — and vice versa. Since
 * rule 1215 it takes coordinates too, so that a point no name reaches has
 * a keyboard path as well.
 */
export function CitySearch(): JSX.Element {
  const { t, i18n } = useTranslation();
  const inputId = useId();
  const [cities, setCities] = useState<readonly CityRecord[]>([]);
  const [query, setQuery] = useState('');
  const setLocation = useAppStore((s) => s.setLocation);
  const requestCameraFlight = useAppStore((s) => s.requestCameraFlight);

  useEffect(() => {
    let cancelled = false;
    void loadCityIndex().then((list) => {
      if (!cancelled) setCities(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const matches = useMemo(() => searchCities(cities, query, 8), [cities, query]);
  // Rule 1215: a point typed as coordinates, for any place a name cannot
  // reach — the globe's keyboard path.
  const coordinates = useMemo(() => parseCoordinates(query), [query]);
  const showResults = query.trim().length > 0;

  const goTo = (latitude: number, longitude: number): void => {
    const target = { latitude, longitude };
    setLocation(target);
    requestCameraFlight(target, CITY_FRAME_RADIUS_M);
    setQuery('');
  };
  const pick = (city: CityRecord): void => {
    goTo(city.lat, city.lon);
  };
  const place = (latitude: number, longitude: number): string => {
    const deg = (x: number): string =>
      Math.abs(x).toLocaleString(i18n.language, { maximumFractionDigits: 4 });
    const ns = t(latitude >= 0 ? 'report.impact.hemisphere.n' : 'report.impact.hemisphere.s');
    const ew = t(longitude >= 0 ? 'report.impact.hemisphere.e' : 'report.impact.hemisphere.w');
    return `${deg(latitude)}°${ns}, ${deg(longitude)}°${ew}`;
  };

  return (
    <div className={styles.wrap} role="search">
      <label className={styles.label} htmlFor={inputId}>
        {t('simulator.citySearch.label')}
      </label>
      <input
        id={inputId}
        className={styles.input}
        type="search"
        autoComplete="off"
        spellCheck={false}
        placeholder={t('simulator.citySearch.placeholder')}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
        }}
        onKeyDown={(e) => {
          const first = matches[0];
          if (e.key === 'Enter' && coordinates?.kind === 'point') {
            e.preventDefault();
            goTo(coordinates.latitude, coordinates.longitude);
          } else if (e.key === 'Enter' && coordinates === null && first !== undefined) {
            e.preventDefault();
            pick(first);
          } else if (e.key === 'Escape') {
            setQuery('');
          }
        }}
      />
      {showResults && coordinates !== null && (
        <ul className={styles.results}>
          {coordinates.kind === 'point' ? (
            <li>
              <button
                type="button"
                className={styles.result}
                data-testid="city-search-coordinates"
                onClick={() => {
                  goTo(coordinates.latitude, coordinates.longitude);
                }}
              >
                <span className={styles.resultName}>
                  {t('simulator.citySearch.goToPoint', {
                    place: place(coordinates.latitude, coordinates.longitude),
                  })}
                </span>
              </button>
            </li>
          ) : (
            <li className={styles.empty}>{t('simulator.citySearch.outOfRange')}</li>
          )}
        </ul>
      )}
      {showResults && coordinates === null && (
        <ul className={styles.results}>
          {matches.length === 0 ? (
            <li className={styles.empty}>{t('simulator.citySearch.empty')}</li>
          ) : (
            matches.map((city) => (
              <li key={`${city.nameEn}:${city.lat.toString()}:${city.lon.toString()}`}>
                <button
                  type="button"
                  className={styles.result}
                  onClick={() => {
                    pick(city);
                  }}
                >
                  <span className={styles.resultName}>
                    {cityDisplayName(city, i18n.language)}
                    {city.capital && <span className={styles.capital}>★</span>}
                  </span>
                  <span className={styles.resultMeta}>
                    {formatPopulation(city.popMax, i18n.language)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
