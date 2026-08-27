import { CallbackProperty, Cartesian3, Color, type Entity, type Viewer } from 'cesium';
import { cloudMaterialFromProperty } from './cloudMaterial.js';

/**
 * Colonna eruttiva come volume, non come segno a terra.
 *
 * Un'eruzione pliniana ha una forma riconoscibile e ripetuta in ogni
 * fotografia: una colonna che sale stretta dal cratere, si allarga
 * salendo, e in quota si apre nell'**ombrello** — il livello dove il
 * pennacchio smette di salire perché ha raggiunto la densità
 * dell'aria circostante e si spande orizzontalmente. Fino a ieri la
 * scena raccontava tutto questo con un segno verticale piatto; qui la
 * colonna diventa una pila di ellissoidi con il materiale nuvola già
 * usato per il fungo, così la silhouette sfuma invece di tagliare.
 *
 * Le quote non sono inventate: l'altezza dell'ombrello è quella del
 * pennacchio calcolata dalla fisica (Mastin et al. 2009), e il raggio
 * dell'ombrello segue la proporzione osservata di circa metà
 * dell'altezza di colonna.
 */

export interface EruptionColumnInput {
  viewer: Viewer;
  latitude: number;
  longitude: number;
  /** Altezza del pennacchio sopra il cratere (m). */
  plumeHeightM: number;
}

/** Segmenti della colonna: pochi, ma abbastanza da leggere lo svaso. */
const COLUMN_SEGMENTS = 7;
const RISE_S = 5.0;
const UMBRELLA_DELAY_S = 3.2;
const UMBRELLA_GROW_S = 4.5;
/** L'eruzione resta in scena molto più a lungo di un'esplosione: la
 *  colonna di una pliniana dura ore, non secondi. */
const LIFETIME_S = 26.0;
const FADE_OUT_S = 4.0;

const ASH_DARK = '#5C5148';
const ASH_LIGHT = '#B9AFA2';

function easeOutCubic(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return 1 - (1 - c) ** 3;
}

/**
 * Disegna la colonna e restituisce la funzione che la rimuove. Come
 * per il fungo, l'animazione vive su `performance.now()` e le entità
 * si tolgono da sole a fine vita.
 */
export function spawnEruptionColumn(input: EruptionColumnInput): () => void {
  const { viewer, latitude, longitude, plumeHeightM } = input;
  if (!Number.isFinite(plumeHeightM) || plumeHeightM <= 500) {
    return () => {
      /* niente colonna: nessuna eruzione da mostrare */
    };
  }

  const umbrellaRadiusM = plumeHeightM * 0.45;
  const ventRadiusM = Math.max(300, plumeHeightM * 0.02);
  const t0 = performance.now();
  const elapsedSec = (): number => (performance.now() - t0) / 1000;
  const fadeAlpha = (): number => {
    const e = elapsedSec();
    const fadeStart = LIFETIME_S - FADE_OUT_S;
    if (e <= fadeStart) return 1;
    return Math.max(0, 1 - (e - fadeStart) / FADE_OUT_S);
  };

  const entities: Entity[] = [];

  // ── Colonna: pila di ellissoidi che si allarga salendo ───────────
  for (let i = 0; i < COLUMN_SEGMENTS; i++) {
    const frazione = (i + 0.5) / COLUMN_SEGMENTS;
    const quota = plumeHeightM * frazione;
    // Svaso: il getto si allarga con la quota man mano che ingloba
    // aria (il classico profilo a tromba delle colonne eruttive).
    const raggio = ventRadiusM + (umbrellaRadiusM * 0.32 - ventRadiusM) * frazione ** 0.7;
    // Ogni segmento entra in scena quando il fronte della colonna lo
    // raggiunge: la colonna così SALE invece di apparire tutta insieme.
    const partenza = RISE_S * frazione * 0.8;
    const radii = new CallbackProperty(() => {
      const e = elapsedSec();
      const crescita = easeOutCubic((e - partenza) / (RISE_S * 0.5));
      const r = Math.max(1, raggio * crescita);
      return new Cartesian3(r, r, (plumeHeightM / COLUMN_SEGMENTS) * 0.75 * crescita);
    }, false);
    const colore = new CallbackProperty(() => {
      const e = elapsedSec();
      if (e < partenza) return Color.TRANSPARENT;
      // Scura in basso (cenere densa vicino al cratere), più chiara in
      // alto dove il pennacchio si diluisce.
      const tinta = Color.lerp(
        Color.fromCssColorString(ASH_DARK),
        Color.fromCssColorString(ASH_LIGHT),
        frazione,
        new Color()
      );
      return tinta.withAlpha(0.85 * fadeAlpha());
    }, false);
    entities.push(
      viewer.entities.add({
        id: `eruption-vfx-column-${i.toString()}`,
        position: Cartesian3.fromDegrees(longitude, latitude, quota),
        ellipsoid: { radii, material: cloudMaterialFromProperty(colore), outline: false },
      })
    );
  }

  // ── Ombrello: il cappello che si apre in quota ───────────────────
  const umbrellaRadii = new CallbackProperty(() => {
    const e = elapsedSec();
    const crescita = easeOutCubic((e - UMBRELLA_DELAY_S) / UMBRELLA_GROW_S);
    const r = Math.max(1, umbrellaRadiusM * crescita);
    // Schiacciato: l'ombrello si spande in orizzontale perché ha
    // smesso di salire.
    return new Cartesian3(r, r, r * 0.22);
  }, false);
  const umbrellaColour = new CallbackProperty(() => {
    const e = elapsedSec();
    if (e < UMBRELLA_DELAY_S) return Color.TRANSPARENT;
    return Color.fromCssColorString(ASH_LIGHT).withAlpha(0.8 * fadeAlpha());
  }, false);
  entities.push(
    viewer.entities.add({
      id: 'eruption-vfx-umbrella',
      position: Cartesian3.fromDegrees(longitude, latitude, plumeHeightM * 0.96),
      ellipsoid: {
        radii: umbrellaRadii,
        material: cloudMaterialFromProperty(umbrellaColour),
        outline: false,
      },
    })
  );

  let cancelled = false;
  const rimuovi = (): void => {
    if (viewer.isDestroyed()) return;
    for (const e of entities) viewer.entities.remove(e);
  };
  const timer = window.setTimeout(() => {
    if (!cancelled) rimuovi();
  }, LIFETIME_S * 1_000);

  return (): void => {
    cancelled = true;
    window.clearTimeout(timer);
    rimuovi();
  };
}
