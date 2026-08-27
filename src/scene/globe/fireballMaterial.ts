import { Color, Event, Material } from 'cesium';

/**
 * PROTOTIPO — palla di fuoco volumetrica.
 *
 * È il campione della «Strada 2»: invece di dipingere una superficie,
 * il frammento cammina DENTRO la sfera e somma quello che incontra.
 * La differenza si vede: un ellissoide colorato ha un contorno
 * matematico e un interno piatto; qui la densità cambia lungo il
 * raggio e il rumore la increspa, quindi la palla ha una struttura
 * interna che gira con la camera invece di essere una decalcomania.
 *
 * Come funziona, in breve. Dalle coordinate di texture della sfera si
 * ricava la direzione dal centro al frammento nello spazio
 * dell'oggetto — stabile mentre la camera gira. Da lì
 * il codice cammina verso il centro in pochi passi, e a ogni passo
 * campiona un rumore trilineare definito nel materiale stesso,
 * modulato dal tempo. La somma dà la densità; la profondità raggiunta
 * dà la «temperatura», che sceglie il colore fra il bianco del nucleo
 * e il rosso del bordo — la stessa sequenza fisica per cui un corpo
 * incandescente è più bianco dove è più caldo.
 *
 * Costo: sei campioni di rumore per frammento. Su una scheda grafica
 * vera è poca cosa; su un rasterizzatore software è proibitivo, per
 * questo il chiamante non deve nemmeno provarci in modalità leggera.
 */

const FABRIC_TYPE = 'NimbusVolumetricFireball';

// Cesium 1.140 non espone piu' una funzione di rumore utilizzabile qui
// (l'unica rimasta, czm_getWaterNoise, dipende da una texture), quindi
// il rumore se lo porta il materiale: hash + interpolazione trilineare,
// una manciata di istruzioni e nessuna dipendenza.
const FABRIC_SOURCE = `
float nimbusHash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

float nimbusNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float n000 = nimbusHash(i + vec3(0.0, 0.0, 0.0));
  float n100 = nimbusHash(i + vec3(1.0, 0.0, 0.0));
  float n010 = nimbusHash(i + vec3(0.0, 1.0, 0.0));
  float n110 = nimbusHash(i + vec3(1.0, 1.0, 0.0));
  float n001 = nimbusHash(i + vec3(0.0, 0.0, 1.0));
  float n101 = nimbusHash(i + vec3(1.0, 0.0, 1.0));
  float n011 = nimbusHash(i + vec3(0.0, 1.0, 1.0));
  float n111 = nimbusHash(i + vec3(1.0, 1.0, 1.0));
  float nx00 = mix(n000, n100, u.x);
  float nx10 = mix(n010, n110, u.x);
  float nx01 = mix(n001, n101, u.x);
  float nx11 = mix(n011, n111, u.x);
  return mix(mix(nx00, nx10, u.y), mix(nx01, nx11, u.y), u.z) * 2.0 - 1.0;
}

czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);

  // Quanto e' spesso il gas davanti a questo frammento. Al centro del
  // disco la linea di vista attraversa tutta la sfera; sul bordo la
  // taglia di striscio. E' la ragione per cui una fiamma vera e'
  // luminosa al centro e sfuma ai lati, e senza questo termine la
  // palla diventa un disco piatto uniforme.
  vec3 nEC = normalize(materialInput.normalEC);
  vec3 vEC = normalize(materialInput.positionToEyeEC);
  float spessore = clamp(abs(dot(nEC, vEC)), 0.0, 1.0);

  // Direzione dal centro al frammento, ricostruita dalle coordinate di
  // texture: 'str' non e' popolata sugli ellissoidi delle entita',
  // mentre 'st' si'. Restando in coordinate dell'oggetto, il disegno
  // non nuota quando la camera gira.
  float ang = materialInput.st.s * 6.2831853;
  float lat = (materialInput.st.t - 0.5) * 3.14159265;
  vec3 p = vec3(cos(lat) * cos(ang), cos(lat) * sin(ang), sin(lat));

  // Sei campioni lungo il raggio: danno la STRUTTURA (i gas non sono
  // omogenei), mentre lo spessore di sopra da' la FORMA.
  float turbolenzaTot = 0.0;
  for (int i = 1; i <= 6; i++) {
    float t = float(i) / 6.0;
    vec3 q = p * (1.0 - t * 0.9);
    turbolenzaTot += (0.55 + 0.45 * nimbusNoise(q * turbolenza + vec3(0.0, 0.0, tempo))) * t;
  }
  float densita = (turbolenzaTot / 6.0) * pow(spessore, 1.3);

  // Piu' spesso il gas, piu' caldo appare: bianco al centro, rosso sul
  // bordo. E' la stessa scala di colore di un corpo incandescente.
  vec3 tinta = mix(bordo.rgb, nucleo.rgb, clamp(spessore * 1.15, 0.0, 1.0));
  material.diffuse = tinta;
  material.emission = tinta * intensita * (0.35 + 0.65 * spessore);
  material.alpha = clamp(densita * 3.2, 0.0, 1.0) * nucleo.a;
  return material;
}
`;

let fabricRegistered = false;

function ensureFabricRegistered(): void {
  if (fabricRegistered) return;
  const _registrationProbe = new Material({
    fabric: {
      type: FABRIC_TYPE,
      uniforms: {
        nucleo: new Color(1, 1, 0.92, 1),
        bordo: new Color(0.85, 0.18, 0.05, 1),
        tempo: 0,
        turbolenza: 2.6,
        intensita: 0.9,
      },
      source: FABRIC_SOURCE,
    },
    translucent: true,
  });
  void _registrationProbe;
  fabricRegistered = true;
}

export interface FireballUniforms {
  nucleo: Color;
  bordo: Color;
  tempo: number;
  turbolenza: number;
  intensita: number;
}

/**
 * Wrapper `MaterialProperty`: Cesium accetta qualunque oggetto che
 * esponga questa forma. Le uniform vengono ricalcolate a ogni
 * fotogramma dalla funzione passata dal chiamante, così l'evoluzione
 * (nucleo che si spegne, turbolenza che cresce) resta fuori dallo
 * shader e dentro il codice che racconta l'evento.
 */
export class VolumetricFireballMaterialProperty {
  public readonly definitionChanged: Event = new Event();

  public readonly isConstant = false;

  private readonly _uniforms: () => FireballUniforms;

  constructor(uniforms: () => FireballUniforms) {
    ensureFabricRegistered();
    this._uniforms = uniforms;
  }

  getType(): string {
    return FABRIC_TYPE;
  }

  getValue(_time?: unknown, result?: Partial<FireballUniforms>): FireballUniforms {
    const target = (result ?? {}) as FireballUniforms;
    const u = this._uniforms();
    target.nucleo = u.nucleo;
    target.bordo = u.bordo;
    target.tempo = u.tempo;
    target.turbolenza = u.turbolenza;
    target.intensita = u.intensita;
    return target;
  }

  equals(other?: unknown): boolean {
    return this === other;
  }
}
