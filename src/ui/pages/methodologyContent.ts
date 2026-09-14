/**
 * Structured methodology content — the single source of truth that the
 * MethodologyPage consumes. Each entry pairs a concise formula block
 * with its full bibliographic citation. The list is the same content
 * the per-scenario PDF report will later filter against the scenario's
 * actual trigger set.
 */

export interface Citation {
  authors: string;
  year: number;
  title: string;
  venue: string;
  doi?: string;
}

export interface FormulaEntry {
  /** Short label shown in the equation header. */
  id: string;
  /** Human-readable display name. */
  name: string;
  /** The formula itself — kept as a monospace string for v1; a KaTeX
   *  pass can render this properly in a later version. */
  formula: string;
  /** One-sentence description of what the formula produces. */
  description: string;
  citation: Citation;
}

export interface MethodologySection {
  id: string;
  title: string;
  blurb: string;
  entries: FormulaEntry[];
}

const collins2005: Citation = {
  authors: 'Collins, G. S., Melosh, H. J. & Marcus, R. A.',
  year: 2005,
  title:
    'Earth Impact Effects Program: A web-based computer program for calculating the regional environmental consequences of a meteoroid impact on Earth',
  venue: 'Meteoritics & Planetary Science 40 (6), 817–840',
  doi: '10.1111/j.1945-5100.2005.tb00157.x',
};

const chyba1993: Citation = {
  authors: 'Chyba, C. F., Thomas, P. J. & Zahnle, K. J.',
  year: 1993,
  title: 'The 1908 Tunguska explosion: atmospheric disruption of a stony asteroid',
  venue: 'Nature 361 (6407), 40–44',
  doi: '10.1038/361040a0',
};

const popova2013: Citation = {
  authors: 'Popova, O. P. et al.',
  year: 2013,
  title: 'Chelyabinsk airburst, damage assessment, meteorite recovery, and characterization',
  venue: 'Science 342 (6162), 1069–1073',
  doi: '10.1126/science.1242642',
};

const teanby2011: Citation = {
  authors: 'Teanby, N. A. & Wookey, J.',
  year: 2011,
  title: 'Seismic detection of meteorite impacts on Mars',
  venue: 'Physics of the Earth and Planetary Interiors 186, 70–80',
  doi: '10.1016/j.pepi.2011.03.004',
};

const mcgetchin1973: Citation = {
  authors: 'McGetchin, T. R., Settle, M. & Head, J. W.',
  year: 1973,
  title: 'Radial thickness variation in impact crater ejecta',
  venue: 'Earth and Planetary Science Letters 20 (2), 226–236',
  doi: '10.1016/0012-821X(73)90162-3',
};

const ward2000: Citation = {
  authors: 'Ward, S. N. & Asphaug, E.',
  year: 2000,
  title: 'Asteroid Impact Tsunami: A probabilistic hazard assessment',
  venue: 'Icarus 145 (1), 64–78',
  doi: '10.1006/icar.1999.6336',
};

const wunnemann2007: Citation = {
  authors: 'Wünnemann, K., Weiss, R. & Hofmann, K.',
  year: 2007,
  title:
    'Characteristics of oceanic impact-induced large water waves — Re-evaluation of the tsunami hazard',
  venue: 'Meteoritics & Planetary Science 42 (11), 1893–1903',
  doi: '10.1111/j.1945-5100.2007.tb00548.x',
};

const wunnemann2010: Citation = {
  authors: 'Wünnemann, K., Collins, G. S. & Weiss, R.',
  year: 2010,
  title:
    "Impact of a cosmic body into Earth's ocean and the generation of a large tsunami wave: insight from numerical modeling",
  venue: 'Reviews of Geophysics 48, RG4006',
  doi: '10.1029/2009RG000308',
};

const ota1979: Citation = {
  authors: 'U.S. Congress, Office of Technology Assessment',
  year: 1979,
  title: 'The Effects of Nuclear War',
  venue: 'OTA-NS-89, Washington, DC: U.S. Government Printing Office — ch. II, table 2',
};

const jaiswalWald2010: Citation = {
  authors: 'Jaiswal, K. & Wald, D. J.',
  year: 2010,
  title: 'An empirical model for global earthquake fatality estimation',
  venue: 'Earthquake Spectra 26 (4), 1017–1037',
  doi: '10.1193/1.3480331',
};

const auker2013: Citation = {
  authors: 'Auker, M. R., Sparks, R. S. J., Siebert, L., Crosweller, H. S. & Ewert, J.',
  year: 2013,
  title: 'A statistical analysis of the global historical volcanic fatalities record',
  venue: 'Journal of Applied Volcanology 2, 2',
  doi: '10.1186/2191-5040-2-2',
};

const toon1997: Citation = {
  authors: 'Toon, O. B., Zahnle, K., Morrison, D., Turco, R. P. & Covey, C.',
  year: 1997,
  title: 'Environmental perturbations caused by the impacts of asteroids and comets',
  venue: 'Reviews of Geophysics 35 (1), 41–78',
  doi: '10.1029/96RG03038',
};

const prinn1987: Citation = {
  authors: 'Prinn, R. G. & Fegley, B. Jr.',
  year: 1987,
  title: 'Bolide impacts, acid rain, and biospheric traumas at the Cretaceous-Tertiary boundary',
  venue: 'Earth and Planetary Science Letters 83 (1–4), 1–15',
  doi: '10.1016/0012-821X(87)90046-X',
};

const brittConsolmagno2003: Citation = {
  authors: 'Britt, D. T. & Consolmagno, G. J.',
  year: 2003,
  title: 'Stony meteorite porosities and densities: A review of the data through 2001',
  venue: 'Meteoritics & Planetary Science 38 (8), 1161–1180',
  doi: '10.1111/j.1945-5100.2003.tb00305.x',
};

const glasstoneDolan1977: Citation = {
  authors: 'Glasstone, S. & Dolan, P. J.',
  year: 1977,
  title: 'The Effects of Nuclear Weapons (3rd ed.)',
  venue: 'U.S. Department of Defense / Department of Energy',
  doi: '10.21236/ADA087568',
};

const koshimura2009: Citation = {
  authors: 'Koshimura, S., Oie, T., Yanagisawa, H., & Imamura, F.',
  year: 2009,
  title:
    'Developing fragility functions for tsunami damage estimation using numerical model and post-tsunami data from Banda Aceh, Indonesia',
  venue: 'Coastal Engineering Journal, 51(3), 243–273',
  doi: '10.1142/S0578563409002004',
};
const jonkman2008: Citation = {
  authors: 'Jonkman, S. N., Vrijling, J. K., & Vrouwenvelder, A. C. W. M.',
  year: 2008,
  title:
    'Methods for the estimation of loss of life due to floods: a literature review and a proposal for a new method',
  venue: 'Natural Hazards, 46(3), 353–389',
  doi: '10.1007/s11069-008-9227-5',
};
const postol1986: Citation = {
  authors: 'Postol, T. A.',
  year: 1986,
  title: 'Possible fatalities from superfires following nuclear attacks in or near urban areas',
  venue: 'The Medical Implications of Nuclear War, National Academy Press, pp. 15–72',
};
const kinneyGraham1985: Citation = {
  authors: 'Kinney, G. F. & Graham, K. J.',
  year: 1985,
  title: 'Explosive Shocks in Air (2nd ed.)',
  venue: 'Springer-Verlag',
  doi: '10.1007/978-3-642-86682-1',
};

const nordyke1962: Citation = {
  authors: 'Nordyke, M. D.',
  year: 1962,
  title: 'An analysis of cratering data from desert alluvium',
  venue: 'Journal of Geophysical Research 67 (5), 1965–1974',
  doi: '10.1029/JZ067i005p01965',
};

const needham2018: Citation = {
  authors: 'Needham, C. E.',
  year: 2018,
  title: 'Blast Waves (2nd ed.), Chapters 3–5 (Height-of-burst effects)',
  venue: 'Springer',
};

const longmire1978: Citation = {
  authors: 'Longmire, C. L.',
  year: 1978,
  title: 'On the electromagnetic pulse produced by nuclear explosions',
  venue: 'IEEE Transactions on Antennas and Propagation AP-26 (1), 3–13',
  doi: '10.1109/TAP.1978.1141796',
};

const hanksKanamori1979: Citation = {
  authors: 'Hanks, T. C. & Kanamori, H.',
  year: 1979,
  title: 'A moment magnitude scale',
  venue: 'Journal of Geophysical Research 84 (B5), 2348–2350',
  doi: '10.1029/JB084iB05p02348',
};

const wellsCoppersmith1994: Citation = {
  authors: 'Wells, D. L. & Coppersmith, K. J.',
  year: 1994,
  title:
    'New empirical relationships among magnitude, rupture length, rupture width, rupture area, and surface displacement',
  venue: 'Bulletin of the Seismological Society of America 84 (4), 974–1002',
  doi: '10.1785/BSSA0840040974',
};

const strasser2010: Citation = {
  authors: 'Strasser, F. O., Arango, M. C. & Bommer, J. J.',
  year: 2010,
  title:
    'Scaling of the source dimensions of interface and intraslab subduction-zone earthquakes with moment magnitude',
  venue: 'Seismological Research Letters 81 (6), 941–950',
  doi: '10.1785/gssrl.81.6.941',
};

const joynerBoore1981: Citation = {
  authors: 'Joyner, W. B. & Boore, D. M.',
  year: 1981,
  title:
    'Peak horizontal acceleration and velocity from strong-motion records including records from the 1979 Imperial Valley, California, earthquake',
  venue: 'Bulletin of the Seismological Society of America 71 (6), 2011–2038',
  doi: '10.1785/BSSA0710062011',
};

const boore2014: Citation = {
  authors: 'Boore, D. M., Stewart, J. P., Seyhan, E. & Atkinson, G. M.',
  year: 2014,
  title:
    'NGA-West2 Equations for Predicting PGA, PGV, and 5%-Damped PSA for Shallow Crustal Earthquakes',
  venue: 'Earthquake Spectra 30 (3), 1057–1085',
  doi: '10.1193/070113EQS184M',
};

const faenzaMichelini2010: Citation = {
  authors: 'Faenza, L. & Michelini, A.',
  year: 2010,
  title:
    'Regression analysis of MCS intensity and ground motion parameters in Italy and its application in ShakeMap',
  venue: 'Geophysical Journal International 180 (3), 1138–1152',
  doi: '10.1111/j.1365-246X.2009.04467.x',
};

const worden2012: Citation = {
  authors: 'Worden, C. B., Gerstenberger, M. C., Rhoades, D. A. & Wald, D. J.',
  year: 2012,
  title:
    'Probabilistic relationships between ground-motion parameters and Modified Mercalli Intensity in California',
  venue: 'Bulletin of the Seismological Society of America 102 (1), 204–221',
  doi: '10.1785/0120110156',
};

const youdIdriss2001: Citation = {
  authors: 'Youd, T. L. & Idriss, I. M.',
  year: 2001,
  title:
    'Liquefaction resistance of soils: Summary report from the 1996 NCEER and 1998 NCEER/NSF workshops on evaluation of liquefaction resistance of soils',
  venue: 'ASCE Journal of Geotechnical and Geoenvironmental Engineering 127 (4), 297–313',
  doi: '10.1061/(ASCE)1090-0241(2001)127:4(297)',
};

const mastin2009: Citation = {
  authors: 'Mastin, L. G. et al.',
  year: 2009,
  title:
    'A multidisciplinary effort to assign realistic source parameters to models of volcanic ash-cloud transport',
  venue: 'Journal of Volcanology and Geothermal Research 186 (1–2), 10–21',
  doi: '10.1016/j.jvolgeores.2009.01.008',
};

const newhallSelf1982: Citation = {
  authors: 'Newhall, C. G. & Self, S.',
  year: 1982,
  title:
    'The Volcanic Explosivity Index (VEI): An estimate of explosive magnitude for historical volcanism',
  venue: 'Journal of Geophysical Research 87 (C2), 1231–1238',
  doi: '10.1029/JC087iC02p01231',
};

const dadeHuppert1998: Citation = {
  authors: 'Dade, W. B. & Huppert, H. E.',
  year: 1998,
  title: 'Long-runout rockfalls',
  venue: 'Geology 26 (9), 803–806',
  doi: '10.1130/0091-7613(1998)026<0803:LRR>2.3.CO;2',
};

const robock2000: Citation = {
  authors: 'Robock, A.',
  year: 2000,
  title: 'Volcanic eruptions and climate',
  venue: 'Reviews of Geophysics 38 (2), 191–219',
  doi: '10.1029/1998RG000054',
};

const iverson1997: Citation = {
  authors: 'Iverson, R. M.',
  year: 1997,
  title: 'The physics of debris flows',
  venue: 'Reviews of Geophysics 35 (3), 245–296',
  doi: '10.1029/97RG00426',
};

const synolakis1987: Citation = {
  authors: 'Synolakis, C. E.',
  year: 1987,
  title: 'The runup of solitary waves',
  venue: 'Journal of Fluid Mechanics 185, 523–545',
  doi: '10.1017/S002211208700329X',
};

const watts2000: Citation = {
  authors: 'Watts, P.',
  year: 2000,
  title: 'Tsunami features of solid block underwater landslides',
  venue: 'ASCE Journal of Waterway, Port, Coastal, and Ocean Engineering 126 (3), 144–152',
  doi: '10.1061/(ASCE)0733-950X(2000)126:3(144)',
};

const heidarzadehSatake2015: Citation = {
  authors: 'Heidarzadeh, M. & Satake, K.',
  year: 2015,
  title:
    'Source properties of the 1998 July 17 Papua New Guinea tsunami based on tide gauge records and numerical simulation',
  venue: 'Geophysical Journal International 202 (1), 361–377',
};

const pike1980: Citation = {
  authors: 'Pike, R. J.',
  year: 1980,
  title: 'Formation of complex impact craters: Evidence from Mars and other planets',
  venue: 'Icarus 43 (1), 1–19',
  doi: '10.1016/0019-1035(80)90083-4',
};

const suzuki1983: Citation = {
  authors: 'Suzuki, T.',
  year: 1983,
  title: 'A theoretical model for dispersion of tephra',
  venue:
    'In Arc Volcanism: Physics and Tectonics (Shimozuru & Yokoyama, eds.), Terra Scientific Publishing, Tokyo, 95–113',
};

const bonadonnaPhillips2003: Citation = {
  authors: 'Bonadonna, C. & Phillips, J. C.',
  year: 2003,
  title: 'Sedimentation from strong volcanic plumes',
  venue: 'Journal of Geophysical Research 108 (B7), 2340',
  doi: '10.1029/2002JB002034',
};

const ganser1993: Citation = {
  authors: 'Ganser, G. H.',
  year: 1993,
  title: 'A rational approach to drag prediction of spherical and nonspherical particles',
  venue: 'Powder Technology 77 (2), 143–152',
  doi: '10.1016/0032-5910(93)80051-B',
};

const waldAllen2007: Citation = {
  authors: 'Wald, D. J. & Allen, T. I.',
  year: 2007,
  title: 'Topographic Slope as a Proxy for Seismic Site Conditions and Amplification',
  venue: 'Bulletin of the Seismological Society of America 97 (5), 1379–1395',
  doi: '10.1785/0120060267',
};

const sethian1996: Citation = {
  authors: 'Sethian, J. A.',
  year: 1996,
  title: 'A fast marching level set method for monotonically advancing fronts',
  venue: 'Proceedings of the National Academy of Sciences 93 (4), 1591–1595',
  doi: '10.1073/pnas.93.4.1591',
};

const melosh1989: Citation = {
  authors: 'Melosh, H. J.',
  year: 1989,
  title: 'Impact Cratering: A Geologic Process (Ch. 5 — angle distribution)',
  venue: 'Oxford University Press',
};

const whitham1974: Citation = {
  authors: 'Whitham, G. B.',
  year: 1974,
  title: 'Linear and Nonlinear Waves (§8.2 Geometrical acoustics; §6.3 Weak-shock theory)',
  venue: 'Wiley-Interscience, ISBN 978-0-471-94090-6',
};

const sachs1944: Citation = {
  authors: 'Sachs, R. G.',
  year: 1944,
  title: 'The dependence of blast on ambient pressure and temperature',
  venue: 'Ballistic Research Laboratories Report 466 (Aberdeen Proving Ground)',
  doi: '10.21236/ADA800535',
};

const korobeinikov1991: Citation = {
  authors: 'Korobeinikov, V. P.',
  year: 1991,
  title:
    'Problems of Point Blast Theory (Ch. 1 §1.4 — Dimensional analysis and self-similar solutions)',
  venue: 'AIP Press / Springer, ISBN 0-88318-660-7',
};

const ussa1976: Citation = {
  authors: 'COESA / NOAA / NASA / USAF',
  year: 1976,
  title: 'U.S. Standard Atmosphere 1976',
  venue: 'NOAA-S/T 76-1562, U.S. Government Printing Office',
};

const brown2013: Citation = {
  authors: 'Brown, P. G., Assink, J. D., Astiz, L., et al.',
  year: 2013,
  title: 'A 500-kiloton airburst over Chelyabinsk and an enhanced hazard from small impactors',
  venue: 'Nature 503, 238–241',
  doi: '10.1038/nature12741',
};

const reVelle1976: Citation = {
  authors: 'ReVelle, D. O.',
  year: 1976,
  title: 'On meteor-generated infrasound',
  venue: 'Journal of Geophysical Research 81 (7), 1217–1230',
  doi: '10.1029/JA081i007p01217',
};

const reasenbergJones1989: Citation = {
  authors: 'Reasenberg, P. A. & Jones, L. M.',
  year: 1989,
  title: 'Earthquake hazard after a mainshock in California',
  venue: 'Science 243 (4895), 1173–1176',
  doi: '10.1126/science.243.4895.1173',
};

const bath1965: Citation = {
  authors: 'Båth, M.',
  year: 1965,
  title: 'Lateral inhomogeneities of the upper mantle',
  venue: 'Tectonophysics 2 (6), 483–514',
  doi: '10.1016/0040-1951(65)90003-X',
};

const gutenbergRichter1954: Citation = {
  authors: 'Gutenberg, B. & Richter, C. F.',
  year: 1954,
  title: 'Seismicity of the Earth and Associated Phenomena (2nd ed.)',
  venue: 'Princeton University Press',
};

const utsu1961: Citation = {
  authors: 'Utsu, T.',
  year: 1961,
  title: 'A statistical study on the occurrence of aftershocks',
  venue: 'Geophysical Magazine 30, 521–605',
};

const okada1992: Citation = {
  authors: 'Okada, Y.',
  year: 1992,
  title: 'Internal deformation due to shear and tensile faults in a half-space',
  venue: 'Bulletin of the Seismological Society of America 82 (2), 1018–1040',
  doi: '10.1785/BSSA0820021018',
};

const lamb1932: Citation = {
  authors: 'Lamb, H.',
  year: 1932,
  title: 'Hydrodynamics (6th ed.), §170 (Long waves over uniform depth)',
  venue: 'Cambridge University Press',
};

const bryant2014: Citation = {
  authors: 'Bryant, E.',
  year: 2014,
  title:
    'Tsunami: The Underrated Hazard (3rd ed.), ch. 5, "Earthquake-Generated Tsunami", pp. 85–102',
  venue: 'Springer Praxis Books',
  doi: '10.1007/978-3-319-06133-7',
};

const imamura2009: Citation = {
  authors: 'Imamura, F., Yalçıner, A. C. & Ozyurt, G.',
  year: 2009,
  title: 'Tsunami Modelling Manual (revised) — IUGG/IOC Time Project (Ch. 7 intensity scale)',
  venue: 'UNESCO/IOC, IUGG Tsunami Commission',
};

const femaP646: Citation = {
  authors: 'Federal Emergency Management Agency',
  year: 2019,
  title:
    'FEMA P-646 — Guidelines for Design of Structures for Vertical Evacuation from Tsunamis (3rd ed., §3 inundation envelopes)',
  venue: 'Applied Technology Council, FEMA',
};

const fema55: Citation = {
  authors: 'Federal Emergency Management Agency',
  year: 2011,
  title: 'FEMA 55 — Coastal Construction Manual (4th ed., §3.4 — coastal hazard envelopes)',
  venue: 'FEMA',
};

const leMehauteWang1996: Citation = {
  authors: 'Le Méhauté, B. & Wang, S.',
  year: 1996,
  title: 'Water Waves Generated by Underwater Explosion',
  venue: 'Advanced Series on Ocean Engineering 10, World Scientific, ISBN 978-981-02-2083-9',
  doi: '10.1142/2587',
};

const glicken1996: Citation = {
  authors: 'Glicken, H.',
  year: 1996,
  title: 'Rockslide-debris avalanche of May 18, 1980, Mount St. Helens Volcano, Washington',
  venue: 'USGS Open-File Report 96-677',
  doi: '10.3133/ofr96677',
};

const grilli2019: Citation = {
  authors: 'Grilli, S. T., Tappin, D. R., Carey, S., et al.',
  year: 2019,
  title: 'Modelling of the tsunami from the December 22, 2018 lateral collapse of Anak Krakatau',
  venue: 'Scientific Reports 9, 11946',
  doi: '10.1038/s41598-019-48327-6',
};

const schultzAnderson1996: Citation = {
  authors: 'Schultz, P. H. & Anderson, R. R.',
  year: 1996,
  title: 'Asymmetry of ejecta and target damage in oblique impacts',
  venue: 'Lunar and Planetary Science XXVII, 1149–1150',
};

const boslough2008: Citation = {
  authors: 'Boslough, M. B. E. & Crawford, D. A.',
  year: 2008,
  title: 'Low-altitude airbursts and the impact threat',
  venue: 'International Journal of Impact Engineering 35 (12), 1441–1448',
  doi: '10.1016/j.ijimpeng.2008.07.053',
};

const tatem2017: Citation = {
  authors: 'Tatem, A. J.',
  year: 2017,
  title: 'WorldPop, open data for spatial demography',
  venue: 'Scientific Data 4, 170004',
  doi: '10.1038/sdata.2017.4',
};

const schiavina2023: Citation = {
  authors: 'Schiavina, M., Freire, S. & MacManus, K.',
  year: 2023,
  title: 'GHS-POP R2023A — GHS population grid multitemporal (1975–2030)',
  venue: 'European Commission, Joint Research Centre',
  doi: '10.2905/2FF68A52-5B5B-4A22-8F40-C41DA8332CFE',
};

const geistBilek2001: Citation = {
  authors: 'Geist, E. L. & Bilek, S. L.',
  year: 2001,
  title: 'Effect of depth-dependent shear modulus on tsunami generation along subduction zones',
  venue: 'Geophysical Research Letters 28 (7), 1315–1318',
  doi: '10.1029/2000GL012385',
};

const taniokaSatake1996: Citation = {
  authors: 'Tanioka, Y. & Satake, K.',
  year: 1996,
  title: 'Tsunami generation by horizontal displacement of ocean bottom',
  venue: 'Geophysical Research Letters 23 (8), 861–864',
  doi: '10.1029/96GL00736',
};

const satake2013: Citation = {
  authors: 'Satake, K., Fujii, Y., Harada, T. & Namegaya, Y.',
  year: 2013,
  title:
    'Time and space distribution of coseismic slip of the 2011 Tohoku earthquake as inferred from tsunami waveform data',
  venue: 'Bulletin of the Seismological Society of America 103 (2B), 1473–1492',
  doi: '10.1785/0120120122',
};

export const METHODOLOGY_SECTIONS: MethodologySection[] = [
  {
    id: 'impact',
    title: 'Cosmic impacts',
    blurb:
      'Physics of an asteroid or comet striking Earth. Inputs are the impactor diameter, velocity, density, and impact angle; outputs include kinetic energy, crater size, seismic magnitude, thermal radiation, and atmospheric / climate effects.',
    entries: [
      {
        id: 'kinetic-energy',
        name: 'Impactor kinetic energy',
        formula: 'E = ½ · m · v² ,   m = (π/6) · D³ · ρ',
        description:
          'Translational kinetic energy of a spherical impactor of diameter D and bulk density ρ.',
        citation: collins2005,
      },
      {
        id: 'transient-crater',
        name: 'Transient crater diameter',
        formula: 'D_tc = 1.161 · (ρ_i/ρ_t)^(1/3) · D^0.78 · v^0.44 · g^(−0.22) · sin^(1/3)(θ)',
        description:
          'π-group scaling from Collins et al. 2005, Eq. 21. Yields the cavity diameter at maximum excavation.',
        citation: collins2005,
      },
      {
        id: 'final-crater',
        name: 'Final crater diameter',
        formula:
          'D_fr = { 1.25 · D_tc                (simple, D_tc ≤ 3.2 km)\n        1.17 · D_tc^1.13 / D_c^0.13 (complex, Eq. 27) }',
        description:
          'Post-collapse rim-to-rim diameter. Piecewise across the simple/complex transition (~3.2 km on Earth).',
        citation: collins2005,
      },
      {
        id: 'crater-depth',
        name: 'Crater depth (complex)',
        formula: 'd/D ≈ 1/5  (simple); d = f(D)  (complex, Pike 1980 piecewise)',
        description:
          'Depth-to-diameter ratio falls off for complex craters due to modification collapse.',
        citation: pike1980,
      },
      {
        id: 'seismic-teanby',
        name: 'Seismic Mw — Teanby & Wookey 2011',
        formula: 'M₀ = k · E  (k = 10⁻⁴) ;  Mw = (2/3) · log₁₀(M₀) − 6.07',
        description:
          'Modern impact-Mw estimator via seismic efficiency k calibrated from UNE + meteor data. Runs 2–3 Mw units below Schultz-Gault.',
        citation: teanby2011,
      },
      {
        id: 'airburst',
        name: 'Atmospheric airburst classifier',
        formula: 'h_breakup = H · ln(ρ₀ · v² / Y) ;  h_burst = h_breakup − 2H − k_D·ln(D/D₀)',
        description:
          'Chyba–Thomas–Zahnle 1993 pancake model. Classifies the impactor as INTACT, PARTIAL_AIRBURST or COMPLETE_AIRBURST, with energyFractionToGround used to scale the crater.',
        citation: chyba1993,
      },
      {
        id: 'chelyabinsk-validation',
        name: 'Chelyabinsk 2013 validation anchor',
        formula: '17 m S-type, 19 km/s → burst ≈ 22 km (observed 27 km)',
        description:
          'Popova et al. 2013 dataset used to calibrate the pancake-model penetration coefficient.',
        citation: popova2013,
      },
      {
        id: 'taxonomy',
        name: 'Impactor taxonomy presets',
        formula: 'COMETARY (ρ=600), C-type (2000), S-type (3300), M-type (5300), Iron (7800)',
        description: 'Density class midpoints from Britt & Consolmagno 2003 Table 2.',
        citation: brittConsolmagno2003,
      },
      {
        id: 'ejecta',
        name: 'Ejecta blanket thickness',
        formula: 'T(r) = 0.14 · R · (R / r)³     (r ≥ R, R = crater rim radius)',
        description:
          'Continuous ejecta-blanket deposit decay with distance. Inverted for blanket outer-edge radii.',
        citation: mcgetchin1973,
      },
      {
        id: 'strat-dust',
        name: 'Stratospheric dust loading',
        formula: 'M_dust ≈ 5 × 10¹⁶ · (E / 4 × 10²³ J)  kg',
        description: 'Linear scaling anchored at the Chicxulub reference (Toon 1997 Table 3).',
        citation: toon1997,
      },
      {
        id: 'acid-rain',
        name: 'Shock-produced HNO₃ mass',
        formula: 'M_HNO3 ≈ 1 × 10¹⁶ · (E / 4 × 10²³ J)  kg',
        description:
          'Globally integrated atmospheric NOx/HNO₃ chemistry from bolide shock heating.',
        citation: prinn1987,
      },
      {
        id: 'impact-tsunami-cavity',
        name: 'Ocean-impact tsunami cavity',
        formula: 'R_C = (3·E / (2π · ρ_w · g))^(1/4) ;  A₀ = R_C / 2 ;  A(r) = A₀ · R_C / r',
        description:
          'Ward & Asphaug 2000 energy-partitioning cavity plus 1/r cylindrical spreading.',
        citation: ward2000,
      },
      {
        id: 'impact-tsunami-wunnemann',
        name: 'Impact-tsunami far field (rim wave)',
        formula:
          'A_r(r) = min(0.14 R_w, h) · (R_w / r)^q_r ;  q_r = min(1.2, 0.5 + 2 e^(−1.75 L/h))',
        description:
          'Wünnemann, Collins & Weiss 2010 eqs. 9a/10a. The rim wave is the shallow-water-type wave that survives into the far field: pure r^−0.5 spreading when the impactor dwarfs the water depth, r^−1.2 for a deep-ocean strike. This is the amplitude the run-up, the friction and dispersion corrections, the legend and the bathymetric veil on the globe all start from.',
        citation: wunnemann2010,
      },
      {
        id: 'impact-tsunami-wunnemann-envelope',
        name: 'Impact-tsunami published envelope',
        formula:
          'A_up = min(0.28 R_w, h) · R_w / r ;  A_low = min{A_r, 0.06 · min(R_w/3, h) · (5R_w / r)^q_c},  q_c = 3 e^(−0.8 L/h) (h/L ≥ 2)',
        description:
          'Wünnemann, Collins & Weiss 2010 eqs. 7–8 and 9b/10b — the upper and lower bounds the Earth Impact Effects Program reports. The collapse wave forms only when the water column is at least twice the impactor diameter and breaks near the source, which is why the lower bound for a deep-ocean impact is decimetres at 1 000 km while the upper bound is tens of metres: the far-field hazard of impact tsunamis is still an open question (Wünnemann 2007, Melosh 2003).',
        citation: wunnemann2010,
      },
      {
        id: 'impact-sea-coupling',
        name: 'Inland impact: how the sea is reached',
        formula:
          'reach = max(R_rim, R_w, r_ejecta(1 m)) ;  f_sea = 1 for d ≤ max(R_rim, R_w), R_rim / d beyond ;  E_cavity = E · gf · f_water · f_sea',
        description:
          'An impact on land near a coast reaches the sea with its crater when the rim crosses the shoreline, or with the ejecta curtain falling into the water beyond it. The ejecta mass landing beyond a distance d follows McGetchin, Settle & Head 1973 (thickness ∝ (r/R)⁻³, so the fraction beyond d is R/d): that fraction scales the energy the water cavity forms with, continuously across the shoreline. Beyond the 1 m isopach the sea is not moved and no tsunami is emitted. The propagation then starts from the nearest deep-enough water in every compass sector within that reach — for an impact in Florida, the Gulf and the Atlantic at once.',
        citation: mcgetchin1973,
      },
      {
        id: 'penetration-bonus',
        name: 'Pancake penetration bonus',
        formula: 'penetrationBonus = max(0, 1.2 · ln(D / 10 m) · H_scale)',
        description:
          'Diameter-dependent bonus subtracted from the breakup-to-burst altitude gap. For Chicxulub (D = 15 km) this evaluates to ≈ 70 km, exceeding the breakup altitude itself and forcing the regime to INTACT — explaining why a 15 km body fragments at 46 km altitude yet still delivers 100 % of its kinetic energy to the ground.',
        citation: chyba1993,
      },
      {
        id: 'atmospheric-yield',
        name: 'Atmospheric airburst yield',
        formula: 'E_atm = (1 − gf) · E_kinetic',
        description:
          'Yield released as a fireball + shock pulse in the atmosphere during entry. Zero for INTACT events; ≈ 99 % of total KE for COMPLETE_AIRBURST (Tunguska, Chelyabinsk). Drives the entry-damage radii below.',
        citation: chyba1993,
      },
      {
        id: 'bolide-airburst-amplification',
        name: 'Bolide-airburst altitude amplification',
        formula: 'f(h) = (P_0 / P_amb(h))^(1 / β),   β = 5/3,   capped at 15×',
        description:
          'Closed-form altitude amplification for entry-phase damage radii. Built from Whitham (1974) §8.2 weak-shock invariance ΔP/P_amb ≈ const through stratified atmosphere, Sachs (1944) blast scaling ΔP ∝ R^(−β), Korobeinikov (1991) §1.4 intermediate-shock exponent, and the U.S. Standard Atmosphere 1976 for actual P(h). Validates within ~1 % on Chelyabinsk (Brown 2013) and ~15 % on Tunguska. Replaces a previous 2-point empirical linear fit.',
        citation: whitham1974,
      },
      {
        id: 'entry-flash-shock',
        name: 'Atmospheric flash + shock damage radii',
        formula:
          'r_flash(p) = R_KG_thermal(E_atm, p) · f(h),   r_shock(p) = R_KG_blast(E_atm, p) · f(h)',
        description:
          'Per-event flash (1°/2°/3° burn) and shock (5/1/0.5 psi) reach radii at the ground. Computed by feeding the atmospheric yield E_atm into the standard Glasstone & Dolan §7 thermal-fluence and Kinney-Graham §5 overpressure formulas, then multiplied by the bolide-airburst amplification factor. Brown 2013 anchors the Chelyabinsk observed 0.5 psi reach at ≈ 120 km.',
        citation: brown2013,
      },
      {
        id: 'damage-rings-airburst-honest',
        name: 'Damage rings honour the airburst regime',
        formula: 'damage(p) = max(R_surface(gf · E_kinetic, p), r_atmospheric_flash_or_shock(p))',
        description:
          'Pre-fix, every impact regime computed the headline damage rings from `impactDamageRadii(E_kinetic)` as if the FULL kinetic energy hit the ground as a sea-level surface burst — over-stating Tunguska and Chelyabinsk reach by an order of magnitude. The simulator now combines the two physically distinct ground-observer components: ground-coupled `gf · E_kinetic` (drives Chicxulub-class craters) and atmospheric airburst `(1 − gf) · E_kinetic` with altitude amplification (drives Tunguska-class flash + shock). Both are normalised to the same observer at the ground; the union is the max() because being inside either ring is equally bad.',
        citation: brown2013,
      },
      {
        id: 'ejecta-asymmetry',
        name: 'Oblique-impact ejecta asymmetry',
        formula:
          'butterfly factor f = max(0, 1 − θ° / 45°);  semi-major × (1 + 0.4·f);  downrange offset = 0.3·f·blanketEdge',
        description:
          'Schultz & Anderson 1996 oblique-impact pattern: at θ ≥ 45° the ejecta blanket is rotationally symmetric; at very low entry angles (Chelyabinsk-class θ = 18°) it elongates downrange of the trajectory and shifts forward, producing the characteristic "butterfly" pattern observed at experimental crater scales.',
        citation: schultzAnderson1996,
      },
    ],
  },
  {
    id: 'explosion',
    title: 'Nuclear & conventional explosions',
    blurb:
      'Surface / airburst detonations. Input is TNT-equivalent yield + height of burst + ground type; outputs include blast radii, thermal fluence, firestorm, crater, initial radiation, and EMP footprint.',
    entries: [
      {
        id: 'overpressure',
        name: 'Peak overpressure (Kinney–Graham)',
        formula: 'ΔP(Z) = 808 · [1 + (Z/4.5)²] / √(...)     (Z = R · W^(−1/3))',
        description:
          'Scaled-distance surface-burst fit. Inverted for the 5 psi (34.5 kPa) and 1 psi (6.9 kPa) ring radii.',
        citation: kinneyGraham1985,
      },
      {
        id: 'blast-thresholds',
        name: 'Blast damage thresholds',
        formula: '5 psi ≈ 34.5 kPa  (residential collapse) ;  1 psi ≈ 6.9 kPa  (window breakage)',
        description: 'Glasstone & Dolan §5.129 and §5.139 canonical structural-damage levels.',
        citation: glasstoneDolan1977,
      },
      {
        id: 'hob-correction',
        name: 'Height-of-burst correction',
        formula:
          'f(z) piecewise in scaled HOB z = HOB · W^(−1/3)  [0.85 surface, 1.00 optimum, 0.25 stratospheric]',
        description:
          'Fit to Glasstone Fig. 3.73 / Needham Fig. 3-3. Applied as a scaling factor on the Kinney-Graham 5/1 psi radii.',
        citation: needham2018,
      },
      {
        id: 'thermal',
        name: 'Thermal fluence / burn radii',
        formula: 'Q = f_th · τ · W / (4π · R²) ;  3° burn @ 3.35 × 10⁵ J/m²',
        description:
          'Glasstone §7.03–7.35 point-source inverse-square fluence with a thermal partition factor (0.35 nuclear, 3×10⁻³ impact).',
        citation: glasstoneDolan1977,
      },
      {
        id: 'firestorm',
        name: 'Firestorm ignition / sustain',
        formula: 'Ignition @ 4.19 × 10⁵ J/m² (10 cal/cm²) ;  Sustain @ 2.51 × 10⁵ J/m² (6 cal/cm²)',
        description:
          'Glasstone §7.40–7.42 dry-kindling ignition and self-drawing firestorm thresholds.',
        citation: glasstoneDolan1977,
      },
      {
        id: 'crater',
        name: 'Surface-burst crater (ground-type dependent)',
        formula:
          'D_apparent = K · W_kt^0.3     (K = 40 hard rock, 60 firm, 75 dry, 92 wet, 105 clay)',
        description:
          'Nordyke 1962 desert-alluvium + Murphey-Vortman 1961 rock + Young 1997 SAND97 clay.',
        citation: nordyke1962,
      },
      {
        id: 'radiation',
        name: 'Initial-radiation lethal-dose radii',
        formula: 'R_LD50 = 700 m · W_kt^0.4  ;  R_LD100 = 0.7 · R_LD50  ;  R_ARS = 1.4 · R_LD50',
        description:
          'Glasstone Fig. 8.46 yield scaling with the UNSCEAR/BEIR dose-response curve (LD₅₀ ≈ 4.5 Gy, LD₁₀₀ ≈ 8 Gy).',
        citation: glasstoneDolan1977,
      },
      {
        id: 'emp',
        name: 'EMP regime + HEMP footprint',
        formula:
          'HEMP peak = min(50 kV/m, 50 kV/m · (W/1 Mt)^(1/3)) @ HOB > 30 km ;  footprint = √(2·R_E·h + h²)',
        description:
          'Longmire 1978 Compton-current model with cube-root yield scaling below the IEC 61000-2-9 1 Mt anchor; the 50 kV/m peak saturates above that yield (gamma-flux plateau at the ionising layer). Earth-tangent horizon disc for the affected area. Validated against Starfish Prime 1962 (Oahu at 1 450 km).',
        citation: longmire1978,
      },
      {
        id: 'underwater-burst-tsunami',
        name: 'Underwater-burst waves (Glasstone & Dolan 1977)',
        formula:
          'H·R ≈ 40 500·W^0.54 ft² (deep, 256–850·W^0.25 ft of water) ;  H·R ≈ 150·d·W^0.25 ft² (shallow, d < 100·W^0.25 ft) ;  T ≈ 14.1·W^0.144 s ;  A = H/2',
        description:
          "The height of the wave train from crest to trough falls as one over the range, with the constants Glasstone & Dolan give: in deep water to about 35 % and for any depth of burst within the water (§6.119), and smaller in shallow water, \"such as Bikini BAKER\" (§6.121). The peak wave's period, and from it its length and the speed its energy crosses the basin, follow §6.119 and linear wave theory. Between the two relations the model interpolates geometrically, and says so. Near the burst it holds the amplitude inside the radius where the relation's height would be steeper than the water can hold (Miche 1944) or inside the gas bubble, whichever is larger. A burst on or above the water, or buried in the seabed, is not within the water and makes no wave. This replaced, on 14 September 2026, a Ward & Asphaug cavity scaled by an 8 % coupling and a depth-of-burst curve that were the project's own numbers credited to a Glasstone table that does not exist, and that stood five to nine times under §6.119 in deep water. Against the book's own BAKER table (Table 6.57) the shallow relation reads about seven tenths of the heights out to two kilometres, and less beyond, where the highest wave passes back into the train (§6.56).",
        citation: glasstoneDolan1977,
      },
      {
        id: 'underwater-burst-air-effects',
        name: 'A burst under the water: flash, radiation and air blast',
        formula:
          'burns = fires = initial radiation = 0 ;  R_blast = R_surface · e^(−ρ·λ_d/126),  λ_d = depth / W^⅓ in ft·kt^(−⅓),  ρ = 1.025',
        description:
          'The panel puts a charge in the air, on the surface or under the water. Under the water, Glasstone & Dolan say much of the thermal radiation and of the initial nuclear radiation is absorbed within a short distance, and the fireball of the BAKER shot was visible for a few thousandths of a second (§2.64): the model gives no burns, no fires and no initial radiation. The book adds that a shallow burst lets some escape and gives no amount, so this is the low end. For the air blast it gives the overpressure of a buried burst at an adjusted scaled distance, λ_x·e^(ρ·λ_d/126) (§6.81), and says an underwater burst attenuates "in a pattern similar" (§6.53): every overpressure is reached at the surface burst\'s range times e^(−ρ·λ_d/126) — three quarters for BAKER, under a third past the 150 ft·kt^(−⅓) beyond which the spray dome makes no appreciable air shock. A charge below the sea floor or under land would be an underground burst, which the model does not have; it is drawn as a burst on the surface, and the panel says so.',
        citation: glasstoneDolan1977,
      },
      {
        id: 'contact-water-burst-flag',
        name: 'Contact-water burst flag (atmospheric ring dimming)',
        formula: 'isContactWaterBurst = (a wave exists) = 0 < burst depth ≤ water depth',
        description:
          "The flag follows the wave rather than the regime: a burst is a contact-water burst when it is within the water, which is when Glasstone & Dolan's relations give it a wave, and a SURFACE classification does not decide it. A 500 Mt device 580 m above 200 m of sea is SURFACE by scaled height and still makes no wave. The on-globe overpressure / thermal / crater rings are dimmed (alpha 0.85 → 0.4) so the eye reads the tsunami branch as the dominant story; the published radii are emitted unchanged so callers that need the land-equivalent reference can still read them.",
        citation: glasstoneDolan1977,
      },
      {
        id: 'coastal-explosion-tsunami',
        name: 'Coastal-explosion sea search',
        formula:
          'nearestSea(local tile, planetary mosaic, click) → distance to the shore, basin depth (median of the sea around, ≤ 200 m)',
        description:
          "When a burst lands on a land cell near the coast (Beirut 2020 on Hangar 12, Castle Bravo on the Bikini reef), the simulator finds the nearest sea a wave could cross — not a lake or a river — and passes the burst its distance and depth, so the sea-coupling law can say whether the crater reaches the water. A wave needs more than that: Glasstone & Dolan's relations are for a burst within the water, and a burst on a quay or a reef is not one, so it makes none. The harbour wave of about a metre seen at Beirut is therefore not drawn; its validation row accepts anything from nothing to two metres, because the record is that loose.",
        citation: leMehauteWang1996,
      },
    ],
  },
  {
    id: 'earthquake',
    title: 'Earthquakes',
    blurb:
      'Crustal and subduction earthquakes from moment magnitude Mw. Outputs include seismic moment, rupture length, peak ground acceleration at distance, felt intensity (California + European calibrations), and liquefaction.',
    entries: [
      {
        id: 'seismic-moment',
        name: 'Seismic moment (Hanks–Kanamori)',
        formula: 'M₀ = 10^(1.5·Mw + 9.1)   N·m',
        description:
          'SI form with the constant IASPEI (2013) standardised, 9.1. Hanks & Kanamori wrote M = ⅔·log₁₀M₀ − 10.7 with M₀ in dyne·cm, which is 9.05 in N·m: the same scale to within 12 % in moment.',
        citation: hanksKanamori1979,
      },
      {
        id: 'rupture-continental',
        name: 'Rupture length (continental)',
        formula:
          'log₁₀(L_km) = a + b · Mw      (per fault type, Wells & Coppersmith 1994 Table 2A)',
        description:
          'Wells & Coppersmith 1994 Table 2A surface-rupture-length regressions: 77 shallow continental events of M 5.2–8.1 (43 strike-slip, 19 reverse, 15 normal), from a 244-event database that leaves out subduction earthquakes.',
        citation: wellsCoppersmith1994,
      },
      {
        id: 'rupture-megathrust',
        name: 'Rupture length (subduction interface)',
        formula: 'log₁₀(L_km) = −2.477 + 0.585 · Mw',
        description:
          'Strasser et al. 2010 interface regression (σ = 0.18 in log₁₀ L), used for subduction-interface events. A preset may carry its observed length instead: Sumatra 2004 uses 1 300 km.',
        citation: strasser2010,
      },
      {
        id: 'pga-jb81',
        name: 'PGA attenuation (Joyner–Boore 1981)',
        formula: 'log₁₀(A/g) = −1.02 + 0.249 · Mw − log₁₀(D) − 0.00255·D ;  D = √(R² + 7.3²) km',
        description:
          'Joyner & Boore 1981, fitted on western North American records for 5.0 ≤ M ≤ 7.7. Not a legacy row: it is the attenuation behind the MMI VII–IX rings (with the Boore et al. 2014 site term), the epicentral intensity, the liquefaction radius and the aftershock rings. Beyond M 7.7 it is used outside its data.',
        citation: joynerBoore1981,
      },
      {
        id: 'pga-nga',
        name: 'PGA attenuation (NGA-West2, BSSA14)',
        formula: 'ln(PGA_g) = F_E(M, mech) + F_P(R, M) + F_S(Vs30, PGA_rock)',
        description:
          'Boore et al. 2014 NGA-West2 equation with magnitude-dependent spreading, the 4.5 km near-source term, fault-type constants and the published site term. Shown as PGA at 20 and 100 km and used for the uncertainty band; the MMI rings use Joyner–Boore 1981.',
        citation: boore2014,
      },
      {
        id: 'vs30',
        name: 'Vs30 site amplification',
        formula:
          'F_S = c·ln(min(Vs30, 1500)/760) + f₂·ln((PGA_r + 0.1)/0.1),  f₂ = −0.15·[e^(−0.00701·(min(Vs30,760)−360)) − e^(−0.00701·400)],  c = −0.6',
        description:
          'The Boore et al. 2014 PGA site term as published, linear and non-linear: soft ground amplifies weak shaking and saturates under strong shaking. Vs30 = 760 m/s returns 1.0; Vs30 = 300 m/s amplifies ≈ 1.75× under weak shaking and ≈ 1.18× at 0.5 g on rock.',
        citation: boore2014,
      },
      {
        id: 'mmi-ca',
        name: 'MMI from PGA (California)',
        formula: 'MMI = piecewise in log₁₀(PGA_cm/s²) ;  break at log₁₀ = 1.57',
        description: 'Worden 2012 Bi-linear GMICE, California dataset.',
        citation: worden2012,
      },
      {
        id: 'mmi-eu',
        name: 'MMI from PGA (Europe / Italy)',
        formula: 'MCS = 1.68 + 2.58 · log₁₀(PGA_cm/s²)',
        description:
          'Faenza & Michelini 2010 — calibrated on Italian ShakeMap data (a = 1.68, b = 2.58, σ = 0.35). Shown beside the California value for every event.',
        citation: faenzaMichelini2010,
      },
      {
        id: 'liquefaction',
        name: 'Liquefaction-radius threshold',
        formula:
          'PGA_thresh(M) = 0.10 g · MSF(M)⁻¹,  MSF = 10^2.24 / M^2.56 ;  radius = inverse PGA attenuation',
        description:
          "The 0.10 g threshold at Mw 7.5 is a simulator assumption for saturated sandy soil. It is scaled by the magnitude scaling factor Youd & Idriss 2001 give as Idriss's revised lower bound, MSF = 10^2.24/Mw^2.56 (their Eq. 24).",
        citation: youdIdriss2001,
      },
      {
        id: 'wald-allen-vs30',
        name: 'Site Vs30 from topographic slope',
        formula:
          'Vs30 = 180 m/s at slope 3×10⁻⁴ ; 240 at 3.5×10⁻³ ; 300 at 0.01 ; 360 at 0.018 ; 490 at 0.05 ; 620 at 0.10 ; 760 at ≥ 0.14  (log–log between edges)',
        description:
          "Wald & Allen 2007 proposed topographic slope as a proxy for Vs30; the active-tectonic table here is the one USGS uses, from Allen & Wald 2009, as coded in USGS's grad2vs30.c, interpolated in log slope and log Vs30 as that program does. Below 3×10⁻⁴ the site is held at 180 m/s, above 0.14 at 760. The slope is measured on the terrain tile under the click (~0.6 km a pixel at zoom 8), fetched for each scenario; the tiles require attribution to their sources. Until 14 September 2026 the table here matched neither paper, and every slope past 0.138 read 685 m/s.",
        citation: waldAllen2007,
      },
      {
        id: 'aftershock-bath',
        name: 'Båth law — magnitude gap',
        formula: 'M_max_aftershock ≈ M_main − 1.2',
        description:
          "The largest aftershock averages about 1.2 magnitude units below the mainshock whatever the mainshock's size, with a scatter of about half a unit. The simulator uses it as a hard ceiling on the sampled magnitudes.",
        citation: bath1965,
      },
      {
        id: 'aftershock-gutenberg-richter',
        name: 'Magnitude distribution',
        formula: 'log₁₀ N(M ≥ m) = a − b · m   (b = 0.91)',
        description:
          "Power-law magnitude-frequency distribution, sampled by inverse CDF, m = M_c − log₁₀(U) / b, and capped at the Båth ceiling. The b-value is Reasenberg & Jones's generic 0.91, the same one that sizes the count.",
        citation: gutenbergRichter1954,
      },
      {
        id: 'aftershock-omori-utsu',
        name: 'Omori-Utsu temporal decay',
        formula: 'n(t) ∝ (t + c)^(−p)   (p = 1.08, c = 0.05 d)',
        description:
          "The modified Omori decay. Utsu 1961 found p mostly between 1.1 and 1.4 across 41 sequences; the simulator uses Reasenberg & Jones's generic p = 1.08 and c = 0.05 d so that times and count come from one fitted model. Times are drawn by inverse CDF over the 30-day window.",
        citation: utsu1961,
      },
      {
        id: 'aftershock-reasenberg-jones',
        name: 'Aftershock count (Reasenberg & Jones)',
        formula:
          'N = 10^(a + b·(M_main − M_c)) · ∫₀ᵀ (t + c)^(−p) dt   (a = −1.67, b = 0.91, p = 1.08, c = 0.05 d)',
        description:
          'Reasenberg & Jones 1989 give the daily rate of aftershocks at or above M; the count over the window is that rate integrated, about 6.4 times the amplitude for 30 days. Until 14 September 2026 the amplitude alone was taken as the count, about six times too few. The simulator stops at 500 events for the renderer.',
        citation: reasenbergJones1989,
      },
      {
        id: 'aftershock-shaking-footprint',
        name: 'Per-aftershock MMI radii (click-through)',
        formula: 'r_MMI(M_event) = distanceForPga(M_event, pga(MMI))',
        description:
          "Each aftershock dot on the globe is clickable. The simulator re-uses the Joyner-Boore (1981) attenuation and Worden et al. (2012) MMI conversion at the aftershock's magnitude to produce three felt-intensity contours (V/VI/VII) around the picked event, plus the epicentral MMI shown in the detail card.",
        citation: worden2012,
      },
      {
        id: 'seismic-tsunami-source',
        name: 'Fault-style-aware tsunami source',
        formula:
          'D̄ = M₀ / (μ · L · W),  W from Strasser 2010 / Wells & Coppersmith 1994 (L / aspect if none),  A₀ = η · upliftFactor · D̄,  A(r) = A₀ · √(a / (a + 4√π·(r − a))),  a = max(W/2, 10 km)',
        description:
          'Hanks–Kanamori moment spread over the rupture area for the mean slip, lifted by a fault-style uplift factor and a coupling efficiency (both simulator values — see the next entries), then decayed from half the down-dip width with the energy normalisation of a Gaussian ring. The only buoy it is checked on is DART 21413 for Tōhoku 2011, where the uplift factor was set.',
        citation: satake2013,
      },
      {
        id: 'rupture-aspect-fault-style',
        name: 'Rupture aspect ratio L/W per fault style',
        formula:
          'aspect = { 2.5: subduction interface ; 1.5: continental normal ; 5: strike-slip ; 3: continental reverse / default }  — used only when no width is given',
        description:
          "Simulator defaults, not published values, used only when a rupture width is neither regressed nor given. For comparison, Strasser et al. 2010's own interface fits give L/W ≈ 1.1 at Mw 7 and ≈ 3.2 at Mw 9.",
        citation: strasser2010,
      },
      {
        id: 'dip-dependent-uplift',
        name: 'Dip-dependent uplift factor',
        formula:
          'upliftFactor = { 0.6: subduction interface ; 0.5: continental reverse / default ; 0.4: continental normal ; 0.05: strike-slip }',
        description:
          'Simulator-chosen ratios of mean sea-floor uplift to mean slip. The megathrust value, 0.6, was tuned against the Tōhoku 2011 record at DART 21413; 0.5, 0.4 and 0.05 are assumed. Tanioka & Satake 1996 show that the horizontal motion of a sloping sea floor adds to the wave, which is the reason a megathrust value above the others is plausible.',
        citation: taniokaSatake1996,
      },
      {
        id: 'wave-coupling-efficiency',
        name: 'Uplift → wave-amplitude efficiency',
        formula: 'A₀ = η · uplift,   η ≈ 0.7',
        description:
          "η = 0.7 is a simulator calibration against the Tōhoku 2011 and Sumatra records, not a published efficiency. Satake et al. 2013 find that horizontal displacement of the sea-floor slope accounts for 20–40 % of Tōhoku's tsunami amplitudes, a different quantity.",
        citation: satake2013,
      },
      {
        id: 'submarine-tsunami-trigger',
        name: 'Submarine earthquake auto-trigger',
        formula:
          'tsunami fires if subductionInterface OR (waterDepth > 0 AND Mw ≥ 6.5 AND faultType ∈ {reverse, normal})',
        description:
          'A simulator rule: an earthquake flagged as a subduction interface always makes a wave, and an unflagged one makes a wave when its epicentre is under water, its magnitude reaches 6.5 and its fault has a dip-slip component. The threshold is not taken from a source. The fault-style factors above apply to every event it lets through.',
        citation: bryant2014,
      },
    ],
  },
  {
    id: 'volcano',
    title: 'Volcanic eruptions',
    blurb:
      'Plinian / sub-Plinian eruptions driven by volume eruption rate and total ejecta volume. Outputs include plume height, VEI, pyroclastic runout (two models), climate cooling, ashfall footprint, and optional lahar runout.',
    entries: [
      {
        id: 'plume-height',
        name: 'Plinian plume height',
        formula: 'H (km) = 2.00 · V̇^0.241     (V̇ in m³/s)',
        description:
          'Mastin 2009 Eq. 1. Published ±factor-2 scatter; the simulator honours that band in its tests.',
        citation: mastin2009,
      },
      {
        id: 'vei',
        name: 'Volcanic Explosivity Index',
        formula: 'VEI = integer bin on log₁₀(V_ejecta)     (V in m³)',
        description:
          'Newhall & Self 1982 eight-level classification, from VEI 0 (non-explosive) to VEI 8 (supereruption).',
        citation: newhallSelf1982,
      },
      {
        id: 'pdc-sheridan',
        name: 'Pyroclastic runout (Sheridan)',
        formula: 'L = 10 · V_km3^(1/3)   km    (H/L ≈ 0.1)',
        description: 'Statistical median mobility for PDCs, retained as a conservative baseline.',
        citation: {
          authors: 'Sheridan, M. F.',
          year: 1979,
          title: 'Emplacement of pyroclastic flows: A review',
          venue: 'Geological Society of America Special Paper 180, 125–136',
        },
      },
      {
        id: 'pdc-energy-line',
        name: 'PDC runout (energy line)',
        formula: 'L = H_plume / slope     (slope ≈ 0.10 for dense flows)',
        description:
          'Dade & Huppert 1998 energy-line upper bound; the runout decreases along an effective H/L energy gradient.',
        citation: dadeHuppert1998,
      },
      {
        id: 'climate-cooling',
        name: 'Climate cooling from VEI',
        formula: 'ΔT(VEI) ≈ −0.03 · 2^(VEI − 3)   K',
        description:
          'Power-law fit against El Chichón / Pinatubo / Tambora anomalies (Robock 2000 dataset review).',
        citation: robock2000,
      },
      {
        id: 'ashfall',
        name: 'Ashfall 1-mm isopach area',
        formula: 'Area(1 mm) ≈ 3 000 · V_km3^0.8   km²',
        description:
          'Simplified Walker 1980 / Pyle 1989 exponential-thinning fit. Wind-independent envelope.',
        citation: {
          authors: 'Pyle, D. M.',
          year: 1989,
          title: 'The thickness, volume and grainsize of tephra fall deposits',
          venue: 'Bulletin of Volcanology 51 (1), 1–15',
          doi: '10.1007/BF01086757',
        },
      },
      {
        id: 'lahar',
        name: 'Lahar runout (Iverson / Vallance)',
        formula: 'L_km ≈ 0.05 · V_m³^0.38',
        description:
          'Iverson 1997 debris-flow volume-runout scaling; reproduces Mt St Helens 1980 within a factor of 2.',
        citation: iverson1997,
      },
      {
        id: 'ashfall-suzuki',
        name: 'Wind-advected ashfall (Suzuki column)',
        formula: 'f(z̃) = A · [(1 − z̃) · exp(λ·(z̃ − 1))]^k   ;   x_centre = u · z / v_t',
        description:
          'Suzuki 1983 vertical release-height distribution along the plume column (λ = 4, k = 1 per Bonadonna & Phillips 2003). Each mass-slice advects downwind at u · t_fall; the isopach elongates with wind speed while σ_x stays set by the source column and σ_y grows with Pasquill-Gifford turbulent diffusion.',
        citation: suzuki1983,
      },
      {
        id: 'ashfall-bonadonna',
        name: 'Analytical advection-diffusion sedimentation',
        formula: 'σ_y(x) = σ_y0 · √(1 + x / L_diff)   ;  L_diff ≈ 10·H',
        description:
          'Bonadonna & Phillips 2003 analytical closure for Plinian fallout. Deposit thickness at (x, y) integrates the Suzuki release weights × Gaussian cross-sections × grain-class mass fractions. Not a full ATM — for hazard mapping use HYSPLIT / FALL3D.',
        citation: bonadonnaPhillips2003,
      },
      {
        id: 'ganser-drag',
        name: 'Terminal velocity (Ganser drag)',
        formula:
          'C_d = (24/Re)·(1 + 0.1118·Re^0.6567) + 0.4305 / (1 + 3305/Re) ;  v_t = √(4·g·d·Δρ / (3·C_d·ρ_a))',
        description:
          'Ganser 1993 rational drag prediction covering Stokes → Newton regimes with one continuous formula. 8-iteration fixed point for the Re-dependent C_d. Applied here to 4 grain classes (32 µm → 8 mm) with the Pyle 1989 mass-fraction spectrum.',
        citation: ganser1993,
      },
      {
        id: 'lateral-blast-wedge',
        name: 'Flank lateral-blast envelope',
        formula:
          'directionDeg, sectorAngleDeg, runout = 0.4 · plumeHeight     (Glicken 1996 § Mt St Helens)',
        description:
          'Mt St Helens 1980 archetype: flank decompression releases a directional jet of pressurised gas + debris that flattens forests across a 180° sector for tens of km along the failure axis. The simulator paints a magenta-pink wedge at the user-specified azimuth + sector angle; runout scales with plume height as a first-order proxy for the blast energy.',
        citation: glicken1996,
      },
      {
        id: 'flank-collapse-tsunami',
        name: 'Volcano flank-collapse tsunami',
        formula:
          'A₀ = min(0.4 · (γ/γ_ref) · V^(1/3) · sin θ,  0.4 · h),  γ = ρ_s/ρ_w − 1,  travelTime = r / √(g · h)',
        description:
          "A Watts 2000-inspired calibrated form, not Watts' predictive equation, applied to volcano flank collapses entering the sea. Slide thickness and Froude number are folded into the prefactor 0.4, which is calibrated on the Anak Krakatau collapse of 22 December 2018 (V ≈ 0.27 km³, θ ≈ 20°): 88 m, against the ≈ 85 m source of Grilli et al. 2019's reconstruction, then held to 40 % of the 200 m of water, so 80 m. γ/γ_ref reads a slide density about the 2 500 kg/m³ of volcanic rock. Until 14 September 2026 this entry printed a prefactor of 0.1, which gives 22 m.",
        citation: grilli2019,
      },
    ],
  },
  {
    id: 'tsunami',
    title: 'Tsunami propagation',
    blurb:
      'Long-wave propagation shared by impact, seismic, and landslide-generated tsunamis. Modules include classical far-field decay, hydrocode damping, run-up, submarine-landslide sources, and dispersion.',
    entries: [
      {
        id: 'celerity',
        name: 'Long-wave celerity',
        formula: 'c = √(g · h)',
        description:
          'Shallow-water gravity-wave speed (Lamb 1932 §170). Drives the tsunami-travel-time calculation.',
        citation: {
          authors: 'Lamb, H.',
          year: 1932,
          title: 'Hydrodynamics (6th ed.), §170',
          venue: 'Cambridge University Press',
        },
      },
      {
        id: 'shoaling',
        name: "Green's law shoaling",
        formula: 'A_shore / A_deep = (h_deep / h_shallow)^(1/4)',
        description:
          'Amplification as a long wave climbs onto a shelf; a 1 m deep-ocean wave steepens to ~4 m at h=15 m.',
        citation: {
          authors: 'Green, G.',
          year: 1838,
          title: 'On the motion of waves in a variable canal',
          venue: 'Transactions of the Cambridge Philosophical Society 6, 457–462',
        },
      },
      {
        id: 'synolakis-runup',
        name: 'Plane-beach run-up (Synolakis)',
        formula: 'R_max = 2.831 · H · √(cot β) · (H / d)^(1/4)',
        description: 'Coastal-inundation height for a solitary long wave on a plane slope β.',
        citation: synolakis1987,
      },
      {
        id: 'submarine-landslide',
        name: 'Submarine-landslide source',
        formula:
          'open water: A₀ = min(K · (γ/γ_ref) · V^(1/3) · sin θ,  0.4 · h),  K = 0.4 above the water, 0.005 under it   ;   confined basin: A₀ = min(f · V / A_basin,  h),  f = 3',
        description:
          "A Watts 2000-inspired calibrated form, not Watts' predictive equation: slide thickness and Froude number are folded into a prefactor per regime. A rigid mass falling into the water, K = 0.4, is calibrated on Anak Krakatau 2018 (≈ 85 m, Grilli et al. 2019); sediment sliding on the sea floor, K = 0.005, on Storegga (5–10 m, Bondevik et al. 2005), so the same volume and slope make a wave up to 80 times taller falling in. γ = ρ_s/ρ_w − 1 is read about each regime's reference density (2 500 and 1 950 kg/m³). A reservoir or a fjord takes the basin-fill form instead, the volume spread over the surface and amplified by f, whose 3 reproduces the wave at the Vaiont dam. A slide footprint, when given, replaces V^(1/3) with √(A/π) as the radius the far field decays from. Treat it as an order of magnitude, a factor of 2 either way. Until 14 September 2026 this entry printed a single prefactor of 0.1, which no product path used.",
        citation: watts2000,
      },
      {
        id: 'dispersion',
        name: 'Far-field dispersion',
        formula: 'f_disp(r) = exp(−r / 2 500 km)',
        description:
          'Heidarzadeh & Satake 2015 empirical fit against DART-buoy records from Sumatra 2004 and Tōhoku 2011.',
        citation: heidarzadehSatake2015,
      },
      {
        id: 'fast-marching',
        name: 'Bathymetric arrival field (Fast Marching)',
        formula: '|∇T|² = 1 / c(x, y)²   ;   c = √(g · h(x, y))',
        description:
          'Sethian 1996 eikonal solver run on a DEM raster to produce true arrival-time isochrones. The tsunami slows onto continental shelves, refracts around islands, and is blocked by dry coastlines — producing the bent-contour maps NOAA WC/ATWC publishes for tsunami bulletins. Activates whenever a bathymetric grid is loaded; otherwise the uniform-depth Lamb 1932 travel-time falls back.',
        citation: sethian1996,
      },
      {
        id: 'tsunami-source-wavelength',
        name: 'Source-radiated wavelength',
        formula:
          'λ_cavity ≈ 2 · R_C   (impact / explosion);   λ_seismic ≈ 2 · L_rupture   (megathrust)',
        description:
          'Dominant Fourier mode of the source. Cavity-collapse waves carry λ ≈ 2 cavity diameters; finite line-source megathrusts carry λ ≈ 2 rupture lengths. For Tōhoku 2011 (L = 700 km) this gives λ ≈ 1 400 km, matching the dominant component observed at DART buoys (Satake et al. 2013).',
        citation: lamb1932,
      },
      {
        id: 'tsunami-period',
        name: 'Dominant wave period',
        formula: 'T = λ / c',
        description:
          'Period at the source. Tōhoku 2011 (λ ≈ 1 400 km, c ≈ 198 m/s) gives T ≈ 7 000 s ≈ 2 h, consistent with the 30 min – 2 h range reported at coastal tide gauges.',
        citation: lamb1932,
      },
      {
        id: 'inundation-distance',
        name: 'Inland inundation distance',
        formula: 'L_inland = R_runup / tan(β_beach)',
        description:
          'Geometric horizontal reach of the run-up wedge. On the textbook 1:100 reference beach this is 100× the run-up height; on a steep 1:30 dune face only 30×, on a gentle 1:300 mud-flat 300×. FEMA 55 §3.4 / Murata 2010 use the same envelope for first-order coastal hazard mapping. Order-of-magnitude only — site-specific topography, vegetation roughness and back-bay refraction can multiply or divide this by a factor of two on real coasts.',
        citation: fema55,
      },
      {
        id: 'coastal-damage-tier',
        name: 'Coastal damage from run-up height',
        formula:
          'Tier 0: < 0.3 m — tide-gauge only;  Tier 1: 0.3–1 m — light flooding;  Tier 2: 1–3 m — cars / single-storey;  Tier 3: 3–6 m — wood frames / harbours;  Tier 4: 6–10 m — concrete damaged;  Tier 5: > 10 m — Tōhoku-/Lituya-class destruction',
        description:
          'Six-tier damage assessment surfaced in the report panel under every run-up row. Boundaries from Bryant 2014 §10.5, FEMA P-646 §3 and the Imamura tsunami-intensity scale used in JMA / IUGG warnings.',
        citation: bryant2014,
      },
      {
        id: 'beach-slope-from-dem',
        name: 'Beach slope from on-site DEM',
        formula: 'β_beach = atan(|∇z(x, y)|)   when click on land AND atan(1/1000) ≤ β ≤ atan(1/3)',
        description:
          'When the user clicks a coastal cell with a real terrain gradient, the simulator samples the AWS Terrarium DEM tile around the click and feeds the local slope into the Synolakis (1987) run-up. Outside the [1:1000, 1:3] envelope (mud-flat / cliff face) the formula falls back to the 1:100 textbook reference. The result blob carries `beachSlopeRadUsed` and `beachSlopeFromDEM` so the UI can label the run-up as "DEM locale" or "1:100 riferimento".',
        citation: synolakis1987,
      },
    ],
  },
  {
    id: 'population',
    title: 'Population exposure and casualties',
    blurb:
      'Cross-event overlay: how many people sit inside each damage band, and how many of them the published vulnerability functions say would die. Population from WorldPop 2020 (zonal-statistics API) with a shipped 14 km GHS-POP aggregate for planetary rings; mortality from OTA 1979 for blast, USGS PAGER for shaking and Auker 2013 for pyroclastic flows, always with a low–high band.',
    entries: [
      {
        id: 'population-exposure-overlay',
        name: 'Population exposed inside damage radius',
        formula: 'exposed = Σ population(x, y) · 𝟙[(x − x_0)² + (y − y_0)² ≤ r²]',
        description:
          'Sum of the WorldPop 2020 population inside a circle. The browser asks the WorldPop zonal-statistics API (api.worldpop.org, free, no key, CORS-enabled) for every ring up to its 100 000 km² allowance — a circle of ≈ 178 km — and sums a shipped 0.125° (≈ 14 km) aggregate of the JRC GHS-POP 2020 grid (Schiavina 2023) for larger rings and when the API is unreachable. An operator may point `VITE_POPULATION_COG_URL` at a CORS-enabled Cloud-Optimised GeoTIFF (WorldPop or JRC GHSL R2023A, Schiavina 2023) for 1 km resolution on every ring. Cell centres decide membership; rim cells are the ±few-percent noise floor.',
        citation: tatem2017,
      },
      {
        id: 'casualties-blast',
        name: 'Blast casualties (impacts, explosions)',
        formula:
          'deaths = Σ_band pop(band) · m(band) ;  m = 98 % (≥ 12 psi), 50 % (5–12), 5 % (2–5), 0 % (1–2) ;  injured: 2 / 40 / 45 / 25 %',
        description:
          "Office of Technology Assessment 1979, The Effects of Nuclear War, ch. II table 2 — the Hiroshima/Nagasaki-derived mortality by peak overpressure. Prompt blast, thermal and collapse together, nobody evacuated. The 12 and 2 psi radii are derived from the drawn 5 and 1 psi contours with the Kinney–Graham curve ratio at the event's yield. Band = the factor-2 scatter between studies of the two cities (Glasstone & Dolan 1977 ch. XII).",
        citation: ota1979,
      },
      {
        id: 'casualties-shaking',
        name: 'Shaking casualties (earthquakes)',
        formula: 'ν(S) = Φ(ln(S / θ) / β) ;  deaths = Σ_band pop(band) · ν(S_mid)',
        description:
          'The USGS PAGER empirical fatality model: a log-normal fatality rate in shaking intensity, fitted per country on 1973–2007 events. The simulator is not a country: the central estimate uses an average-stock pair (θ = 13.5, β = 0.22) and the band spans the published national fits, from earthquake-engineered stocks (θ ≈ 14.5, β = 0.12 — a few deaths per million at MMI VIII, Japan, the United States) to unreinforced masonry (θ ≈ 11.5, β = 0.30 — tens of per cent at IX, Iran, Haiti): three orders of magnitude, which is what not knowing the houses under the ring costs. Applied to the MMI ≥ IX, VIII and VII annuli at their mid-band intensity.',
        citation: jaiswalWald2010,
      },
      {
        id: 'casualties-pyroclastic',
        name: 'Pyroclastic casualties (volcanoes)',
        formula: 'deaths = 0.9 · pop(runout) + 0.9 · (sector / 360°) · pop(lateral-blast annulus)',
        description:
          'Pyroclastic density currents are the deadliest volcanic hazard in the historical record and people caught inside one almost never survive (Saint-Pierre 1902, Merapi 2010). Mortality inside the runout without evacuation is taken as 90 % (band 50–100 %); a lateral blast counts the same inside its sector. Ashfall at the 1 mm isopach kills nobody; lahars and tsunamis are not converted.',
        citation: auker2013,
      },
      {
        id: 'casualties-honesty',
        name: 'What the death toll is not',
        formula: 'order of magnitude, low–high band, sources on the label',
        description:
          'Every figure assumes no evacuation, no warning and no care, and leaves out fallout, initial radiation, famine and disease ; the tsunami toll rests on a run-up height and a beach slope, not on an inundation map. Numbers are printed to two significant figures with their band, next to the vulnerability function and the population source that produced them.',
        citation: ota1979,
      },
      {
        id: 'casualties-burns',
        name: 'Burns',
        formula:
          'm = exposed × mortality = 0.25 (0.1–0.5) × 0.5 (0.3–0.8) inside the third-degree radius, on the blast survivors',
        description:
          'Only the people in sight of the fireball receive the pulse — outdoors, at a window; an urban population indoors is mostly shielded — and extensive third-degree burns are fatal without prompt care (Glasstone & Dolan ch. XII). Inside the second-degree radius the exposed survivors count as injured. The hazards of an annulus act in sequence on the survivors of the earlier ones, so the combined mortality is 1 − Π(1 − m) and nobody dies twice.',
        citation: glasstoneDolan1977,
      },
      {
        id: 'casualties-horizon',
        name: 'The flash stops at the horizon',
        formula:
          'd = R⊕ · arccos(R⊕ / (R⊕ + R_f)); R_f = 0.002 · E^(1/3) (impact), 55 · W^0.4 m (nuclear)',
        description:
          "A fluence radius says how much heat would arrive with nothing in the way, and for an impact-scale fireball it runs around the planet — a 15 km stone has a third-degree radius of 27 000 km on a globe 20 015 km across. Thermal radiation travels in straight lines, so burns and mass fire are cut where the fireball sets below the curve of the Earth, the cut the Earth Impact Effects Program makes. A 200 km fireball is seen to 1 590 km; Hiroshima's to 46 km, so no nuclear scenario is touched. Heat does reach the far side, from rock re-entering everywhere at once (the cascade says so at +30 min), but that is a diffuse bath where shelter decides and not a flash where sightlines do: it is described, drawn, and deliberately not converted into deaths — Goldin & Melosh 2009 argue the ejecta shield their own radiation enough that the global firestorm may fizzle.",
        citation: collins2005,
      },
      {
        id: 'casualties-firestorm',
        name: 'Mass fire',
        formula:
          'm = 0.3 (0.1–0.8) of the survivors inside the firestorm sustain radius, from +20 min to +6 h',
        description:
          'Where the thermal fluence can sustain a firestorm, a share of the blast and burn survivors dies in it: the Hamburg 1943 and Dresden 1945 record at the low end, Hiroshima in the middle, the near-total mortality Postol argued for a nuclear superfire at the high end. The Hiroshima fire storm began about twenty minutes after the burst and subsided after some six hours (Glasstone & Dolan ch. VII); the sweep dates the fire deaths in that window.',
        citation: postol1986,
      },
      {
        id: 'casualties-delayed',
        name: 'Later deaths',
        formula: 'delayed = 0.3 (0.1–0.6) × prompt injured, first day to first month',
        description:
          'OTA 1979 counts the injured and expects most of the seriously injured to die for lack of care — two thousand burn beds in the whole country against hundreds of thousands of burn casualties. A share of the prompt injured is counted as dying within the first month, shown apart from the prompt toll in the panel and dated in the sweep so the counter keeps rising for weeks.',
        citation: ota1979,
      },
      {
        id: 'casualties-tsunami',
        name: 'The coastal toll of the wave',
        formula:
          'H = √(A · min(R, A)); X = 0.06 · H^(4/3) / n², n = 0.03 (≤ 10 km); people = land density × X × coast; ν(h) = Φ(ln(h/θ)/β), h = H/2, θ = 8 m unwarned (≤ 30 min) → 16 m warned (≥ 3 h), 4 m Banda Aceh high, β = 0.8',
        description:
          'For every coastal cell the wave map reaches — the local grid and, beyond it, the planet at 40 km — the water height at the shore is the geometric mean of the arriving amplitude and the plane-beach run-up, with the run-up trusted only up to that amplitude — the McCowan breaking clamp saturates on 84 to 95 per cent of the coastal cells, and a saturated run-up is the ceiling rather than a measurement — the strip it crosses is the Bretschneider & Wybro inundation distance Hills & Mader used for impact tsunamis (1.3 km for 9 m, the Tōhoku mean), the 2.5′ population tiles give the land density around the cell, and the share of the people in the strip who die follows the mean flow depth through the log-normal form Koshimura fitted to Banda Aceh and Jonkman reviewed for floods. A coast reached within half an hour has no warning; from three hours on it has been warned and emptied, the thresholds shifting on a log scale in between, Banda Aceh the high end throughout. The toll is binned by arrival time and the counter rises as the wave lands, hours after the impact for a far coast. The run-up is a height, not an inundation map; the coast is where the rasters are coarsest; expect a factor of three either way.',
        citation: koshimura2009,
      },
      {
        id: 'casualties-sweep',
        name: 'When the deaths happen',
        formula:
          'deaths(t) = Σ deaths(band) · swept-area fraction at t; t(r) = shock integral | r / 3.5 km/s | r / 30 m/s | r / 400 m/s',
        description:
          'The counter in the bar sweeps the estimate with the hazard front: the Kinney–Graham shock integral for blast (the same energy the rings use), the crustal shear wave for shaking (PREM 3.2–3.9 km/s), 30 m/s for a pyroclastic current and 400 m/s for a lateral blast (Mt St Helens: 27 km in a minute). Deaths in a band accrue with the annulus area the front has swept, people being assumed evenly spread within the band as the estimate itself assumes. The animation compresses the physical time into five seconds on a log scale and prints the real elapsed time beside the figure; the first number comes from the shipped 0.125° raster and glides to the WorldPop figure when that lands.',
        citation: kinneyGraham1985,
      },
    ],
  },
  {
    id: 'monteCarlo',
    title: 'Uncertainty quantification (Monte Carlo)',
    blurb:
      'The "Run Monte Carlo" button re-runs the Layer-2 pipeline a few hundred times, sampling the known-uncertain inputs from distributions published alongside the underlying formulas. The resulting P10/P50/P90 bands are the honest way to present the factor-2 scatter that lives in the plume-height, firestorm-threshold, and liquefaction-radius literature.',
    entries: [
      {
        id: 'mulberry32',
        name: 'Deterministic seeded PRNG',
        formula: 'a ← a + 0x6d2b79f5;  t ← Math.imul(a ^ (a ≫ 15), a | 1); …',
        description:
          'Mulberry32 counter-based generator: 32-bit state, period 2³², high-quality output for a few million samples. Same seed ⇒ same percentiles, so an MC run is fully reproducible from the scenario URL.',
        citation: {
          authors: 'Termine, T. (as popularised by Bryc 2017 in the stdlib PRNG community)',
          year: 2017,
          title: 'Mulberry32 — a simple, high-quality 32-bit PRNG for JavaScript',
          venue: 'GitHub gist / documented in V8 engineering-blog discussions',
        },
      },
      {
        id: 'boxMuller',
        name: 'Normal / log-normal deviate',
        formula: 'z = √(−2 ln u) · cos(2π v)   (Box–Muller polar form)',
        description:
          'Box & Muller 1958 polar transform — two uniform deviates → one unit-normal deviate. Log-normal samples via exp(μ + σ · z) cover the factor-k scatter seen in Mastin 2009 plumes, Popova 2011 meteoroid strengths, and Iverson 1997 lahar runouts.',
        citation: {
          authors: 'Box, G. E. P. & Muller, M. E.',
          year: 1958,
          title: 'A note on the generation of random normal deviates',
          venue: 'Annals of Mathematical Statistics 29 (2), 610–611',
        },
      },
      {
        id: 'sin-weighted-angle',
        name: 'Random-impact angle distribution',
        formula: 'p(θ) dθ = sin(2θ) dθ   ;   θ = arcsin(√u)',
        description:
          'Melosh 1989 Ch. 5 — the canonical distribution of impact angles for randomly-incoming impactors on a flat surface. Peaks at 45°, under-weights both grazing and vertical incidence.',
        citation: melosh1989,
      },
      {
        id: 'toll-band',
        name: 'The death toll\u2019s 5\u201395\u2009% band',
        formula: 'deaths_low = toll(draw at P5),  deaths_high = toll(draw at P95),  N = 200',
        description:
          'The pair beside the casualty figure is not the gentlest and harshest settings of the vulnerability table \u2014 that pair spans three to five orders of magnitude and contains almost any number. It is the 5th and 95th percentile of 200 realisations of the same scenario, drawn from the input scatter above and, for shaking, dominated by the ground-motion residual \u03c3_lnY \u2248 0.5 that separates a median prediction from one draw of the earth. Each end is a whole realisation rather than a percentile taken column by column, so the per-band rows total to the figure above them. Two things are held fixed and are therefore not in the band: the population (the census has its own error) and the vulnerability functions themselves (published scatter, a factor of 2\u20135). The population inside every sampled radius is read off a curve measured at each damage ring plus two footprints bracketing the radii the draws reach, at one density per annulus; what that interpolation costs is measured against the raster in the calibration suite and is under 1.4\u00d7 on every comparable row.',
        citation: {
          authors: 'Jaiswal, K. & Wald, D.',
          year: 2010,
          title:
            'An empirical model for global earthquake fatality estimation (\u00a75, uncertainty)',
          venue: 'Earthquake Spectra 26 (4), 1017\u20131037',
        },
      },
      {
        id: 'percentile-band',
        name: 'Unweighted sample percentiles',
        formula: 'P_n = sort(samples)[⌊n · N / 100⌋]',
        description:
          'Simple order-statistic percentile estimator — sufficient at N ≥ 100 samples, where variance-weighted estimators offer no material gain. We render P10/P50/P90 rather than mean±σ because the underlying distributions are often log-normal (asymmetric band is more honest than ±σ).',
        citation: {
          authors: 'Koonin, S. E.',
          year: 1986,
          title: 'Computational Physics (Ch. 7 — Monte Carlo methods)',
          venue: 'Addison-Wesley',
        },
      },
    ],
  },
];

/**
 * Keyed registry of every citation used in the methodology page.
 * Consumed by the per-scenario Simulation Report, which filters this
 * map against the code paths actually triggered by a given run — so
 * an airburst run cites Chyba+Popova but not Longmire or Iverson.
 */
export const CITATIONS = {
  collins2005,
  chyba1993,
  popova2013,
  teanby2011,
  mcgetchin1973,
  ward2000,
  wunnemann2007,
  wunnemann2010,
  ota1979,
  jaiswalWald2010,
  auker2013,
  toon1997,
  prinn1987,
  brittConsolmagno2003,
  glasstoneDolan1977,
  postol1986,
  koshimura2009,
  jonkman2008,
  kinneyGraham1985,
  nordyke1962,
  needham2018,
  longmire1978,
  hanksKanamori1979,
  wellsCoppersmith1994,
  strasser2010,
  joynerBoore1981,
  boore2014,
  faenzaMichelini2010,
  worden2012,
  youdIdriss2001,
  mastin2009,
  newhallSelf1982,
  dadeHuppert1998,
  robock2000,
  iverson1997,
  synolakis1987,
  watts2000,
  heidarzadehSatake2015,
  pike1980,
  suzuki1983,
  bonadonnaPhillips2003,
  ganser1993,
  waldAllen2007,
  sethian1996,
  melosh1989,
  whitham1974,
  sachs1944,
  korobeinikov1991,
  ussa1976,
  brown2013,
  reVelle1976,
  reasenbergJones1989,
  bath1965,
  gutenbergRichter1954,
  utsu1961,
  okada1992,
  lamb1932,
  bryant2014,
  imamura2009,
  femaP646,
  fema55,
  leMehauteWang1996,
  glicken1996,
  grilli2019,
  schultzAnderson1996,
  boslough2008,
  tatem2017,
  schiavina2023,
  geistBilek2001,
  taniokaSatake1996,
  satake2013,
} as const;

export type CitationKey = keyof typeof CITATIONS;

export interface ValidationEntry {
  event: string;
  year: number;
  note: string;
}

export const VALIDATION_ROSTER: ValidationEntry[] = [
  // ─── Cosmic impacts ─────────────────────────────────────────────
  {
    event: 'Chicxulub',
    year: -66_000_000,
    note: 'Morgan et al. 2016 — 180 km rim, K-Pg extinction',
  },
  { event: 'Popigai', year: -35_700_000, note: 'Tagle & Hecht 2006 — 100 km Siberian crater' },
  {
    event: 'Boltysh',
    year: -65_400_000,
    note: 'Kelley & Gurov 2002 — 24 km, contemporaneous with Chicxulub',
  },
  { event: 'Meteor Crater', year: -50_000, note: 'Kring 2007 — iron impactor, 1.2 km crater' },
  { event: 'Tunguska', year: 1908, note: 'Boslough & Crawford 2008 — partial airburst ~8 km' },
  {
    event: 'Sikhote-Alin',
    year: 1947,
    note: 'Krinov 1966 — largest iron-meteorite shower on instrumental record',
  },
  {
    event: 'Chelyabinsk',
    year: 2013,
    note: 'Popova et al. 2013 / Brown et al. 2013 — burst 27 km, 0.44 Mt, 120 km window-breakage',
  },
  // ─── Explosions ─────────────────────────────────────────────────
  {
    event: 'Halifax',
    year: 1917,
    note: 'Bird & MacDonald 2001 — 2.9 kt SS Mont-Blanc cargo, largest pre-nuclear accident',
  },
  { event: 'Hiroshima', year: 1945, note: 'Airburst 580 m, 15 kt (Little Boy)' },
  { event: 'Nagasaki', year: 1945, note: 'Airburst 503 m, 21 kt (Fat Man)' },
  { event: 'Texas City', year: 1947, note: 'Marsh 2010 — 2.7 kt SS Grandcamp NH₄NO₃ detonation' },
  {
    event: 'Ivy Mike',
    year: 1952,
    note: 'LASL LA-1854 — first thermonuclear, 10.4 Mt, vapourised Elugelab',
  },
  { event: 'Castle Bravo', year: 1954, note: 'Bikini Atoll thermonuclear surface burst, 15 Mt' },
  { event: 'Tsar Bomba', year: 1961, note: 'Airburst 4 000 m, 50 Mt — largest human detonation' },
  {
    event: 'Starfish Prime',
    year: 1962,
    note: 'HEMP 400 km altitude, Oahu street-lamps at 1 450 km',
  },
  {
    event: 'Beirut port',
    year: 2020,
    note: 'Rigby 2020; Diaz 2021 — 0.5 kt NH₄NO₃ on portside quay',
  },
  // ─── Earthquakes ────────────────────────────────────────────────
  {
    event: 'Lisbon',
    year: 1755,
    note: 'Baptista & Miranda 2009 — Mw 8.7 Atlantic megathrust, trans-oceanic tsunami',
  },
  {
    event: 'Valdivia',
    year: 1960,
    note: 'Cifuentes 1989 — Mw 9.5, largest instrumentally recorded',
  },
  { event: 'Great Alaska', year: 1964, note: 'Plafker 1965 — Mw 9.2 Aleutian megathrust' },
  { event: 'Northridge', year: 1994, note: 'Blind-thrust reverse Mw 6.7, PGA 0.1–0.4 g observed' },
  { event: 'Kokoxili (Kunlun)', year: 2001, note: 'Strike-slip Mw 7.8 with ~400 km rupture' },
  {
    event: 'Sumatra–Andaman',
    year: 2004,
    note: 'Lay et al. 2005 — Mw 9.2 Sunda megathrust, 230 000 fatalities',
  },
  {
    event: "L'Aquila",
    year: 2009,
    note: 'Chiarabba 2009 — Mw 6.3 normal-fault on the Paganica system',
  },
  { event: 'Tōhoku', year: 2011, note: 'Mw 9.1 megathrust with basin-scale tsunami' },
  { event: 'Nepal Gorkha', year: 2015, note: 'Avouac 2015 — Mw 7.8 Main Himalayan Thrust' },
  {
    event: 'Amatrice',
    year: 2016,
    note: 'Chiaraluce 2017 — first main shock of the central-Italy sequence',
  },
  // ─── Volcanoes ──────────────────────────────────────────────────
  {
    event: 'Vesuvius',
    year: 79,
    note: 'Cioni 1992 — type Plinian eruption, buried Pompeii + Herculaneum',
  },
  { event: 'Etna', year: 1669, note: 'Branca 2013 — 5-month flank eruption, lava reached Catania' },
  { event: 'Tambora', year: 1815, note: "VEI 7 'year without a summer' climate event" },
  { event: 'Krakatau', year: 1883, note: 'Sunda Strait VEI 6 paroxysm + caldera-collapse tsunami' },
  {
    event: 'Mount Pelée',
    year: 1902,
    note: 'Lacroix 1904 — type "nuée ardente", Saint-Pierre incinerated',
  },
  {
    event: 'Mount St Helens',
    year: 1980,
    note: 'Cascade-arc VEI 5 lateral blast + Plinian column',
  },
  { event: 'Pinatubo', year: 1991, note: 'Best-instrumented VEI 6 — global ΔT ≈ −0.5 K' },
  {
    event: 'Eyjafjallajökull',
    year: 2010,
    note: 'Gudmundsson 2012 — subglacial eruption, grounded European aviation',
  },
  {
    event: 'Anak Krakatau',
    year: 2018,
    note: 'Grilli 2019 — flank-collapse tsunami, ≈ 0.27 km³ block',
  },
  {
    event: 'Hunga Tonga',
    year: 2022,
    note: 'Carr 2022 — 57 km plume into the mesosphere, global tsunami signal',
  },
  // ─── Submarine landslides ──────────────────────────────────────
  {
    event: 'Storegga slide',
    year: -8200,
    note: 'Norwegian continental margin, ≈ 3 000 km³, trans-Atlantic tsunami',
  },
  {
    event: 'Lituya Bay',
    year: 1958,
    note: 'Walder 2003 — sub-aerial fjord rockfall, 524 m run-up',
  },
  {
    event: 'Vaiont reservoir',
    year: 1963,
    note: 'Genevois & Ghirotti 2005 — 270 Mm³ rockslide, 250 m wave overtopped the dam',
  },
  {
    event: 'Elm rockslide',
    year: 1881,
    note: 'Heim 1932; Hsü 1975 — founding case for long-runout sturzstrom mobility',
  },
];
