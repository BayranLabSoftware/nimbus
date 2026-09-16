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

const collins2017: Citation = {
  authors: 'Collins, G. S., Lynch, E., McAdam, R. & Davison, T. M.',
  year: 2017,
  title: 'A numerical assessment of simple airblast models of impact airbursts',
  venue: 'Meteoritics & Planetary Science 52 (8), 1542–1560',
  doi: '10.1111/maps.12873',
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

const mcgetchin1973: Citation = {
  authors: 'McGetchin, T. R., Settle, M. & Head, J. W.',
  year: 1973,
  title:
    'Radial thickness variation in impact crater ejecta: implications for lunar basin deposits',
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
    "Impact of a cosmic body into Earth's ocean and the generation of large tsunami waves: Insight from numerical modeling",
  venue: 'Reviews of Geophysics 48, RG4006',
  doi: '10.1029/2009RG000308',
};

const ota1979: Citation = {
  authors: 'U.S. Congress, Office of Technology Assessment',
  year: 1979,
  title: 'The Effects of Nuclear War',
  venue: 'Washington, DC: U.S. Government Printing Office (NTIS PB-296946) — ch. II, fig. 1, p. 19',
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
  venue:
    'In Solomon, F. & Marston, R. Q. (eds.), The Medical Implications of Nuclear War, National Academy Press, pp. 15–72 (book DOI 10.17226/940)',
};
const kinneyGraham1985: Citation = {
  authors: 'Kinney, G. F. & Graham, K. J.',
  year: 1985,
  title: 'Explosive Shocks in Air (2nd ed.)',
  venue: 'Springer-Verlag',
  doi: '10.1007/978-3-642-86682-1',
};

const takazawa2023: Citation = {
  authors: 'Takazawa, S. K., Kim, K. & Garcés, M.',
  year: 2023,
  title: 'Chemical Blast Standard (1 kg)',
  venue: 'Seismological Research Letters 94 (5), 2514–2524',
  doi: '10.1785/0220230071',
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
  title: 'Blast Waves (2nd ed.), ch. 14 "Height of Burst Effects", pp. 227–281',
  venue: 'Springer',
  doi: '10.1007/978-3-319-65382-2',
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

const abrahamson2016: Citation = {
  authors: 'Abrahamson, N., Gregor, N. & Addo, K.',
  year: 2016,
  title: 'BC Hydro ground motion prediction equations for subduction earthquakes',
  venue: 'Earthquake Spectra 32 (1), 23–44',
};

const parker2022: Citation = {
  authors: 'Parker, G. A., Stewart, J. P., Boore, D. M., Atkinson, G. M. & Hassani, B.',
  year: 2022,
  title: 'NGA-subduction global ground motion models with regional adjustment factors',
  venue: 'Earthquake Spectra 38 (1), 456–493',
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
    'A multidisciplinary effort to assign realistic source parameters to models of volcanic ash-cloud transport and dispersion during eruptions',
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

const herrick1997: Citation = {
  authors: 'Herrick, R. R., Sharpton, V. L., Malin, M. C., Lyons, S. N. & Feely, K.',
  year: 1997,
  title: 'Morphology and morphometry of impact craters',
  venue:
    'In Bougher, S. W., Hunten, D. M. & Phillips, R. J. (eds.), Venus II, University of Arizona Press, 1015–1046',
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
  title: 'Impact Cratering: A Geologic Process',
  venue: 'Oxford University Press',
};

const whitham1974: Citation = {
  authors: 'Whitham, G. B.',
  year: 1974,
  title: 'Linear and Nonlinear Waves',
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
  title: 'Problems of Point Blast Theory',
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
  title: 'Hydrodynamics (6th ed.), Art. 170 (Long waves in canals)',
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

const hayashiSelf1992: Citation = {
  authors: 'Hayashi, J. N. & Self, S.',
  year: 1992,
  title: 'A comparison of pyroclastic flow and debris avalanche mobility',
  venue: 'Journal of Geophysical Research: Solid Earth 97 (B6), 9063–9071',
  doi: '10.1029/92JB00173',
};

const iverson1998: Citation = {
  authors: 'Iverson, R. M., Schilling, S. P. & Vallance, J. W.',
  year: 1998,
  title: 'Objective delineation of lahar-inundation hazard zones',
  venue: 'Geological Society of America Bulletin 110 (8), 972–984',
  doi: '10.1130/0016-7606(1998)110<0972:ODOLIH>2.3.CO;2',
};

const pfeiffer2005: Citation = {
  authors: 'Pfeiffer, T., Costa, A. & Macedonio, G.',
  year: 2005,
  title: 'A model for the numerical simulation of tephra fall deposits',
  venue: 'Journal of Volcanology and Geothermal Research 140 (4), 273–294',
  doi: '10.1016/j.jvolgeores.2004.09.001',
};

const crandellHoblitt1986: Citation = {
  authors: 'Crandell, D. R. & Hoblitt, R. P.',
  year: 1986,
  title: 'Lateral blasts at Mount St. Helens and hazard zonation',
  venue: 'Bulletin of Volcanology 48 (1), 27–37',
  doi: '10.1007/BF01073511',
};

const kajiura1963: Citation = {
  authors: 'Kajiura, K.',
  year: 1963,
  title: 'The leading wave of a tsunami',
  venue: 'Bulletin of the Earthquake Research Institute, University of Tokyo 41 (3), 535–571',
};

const jma2013: Citation = {
  authors: 'Japan Meteorological Agency',
  year: 2013,
  title: 'Tsunami Warnings/Advisories and Tsunami Information (leaflet, 7 March 2013)',
  venue: 'data.jma.go.jp/eqev/data/en/tsunami/tsunamiwarning-leaflet.pdf',
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
  title:
    'Modelling of the tsunami from the December 22, 2018 lateral collapse of Anak Krakatau volcano in the Sunda Straits, Indonesia',
  venue: 'Scientific Reports 9, 11946',
  doi: '10.1038/s41598-019-48327-6',
};

const schultzAnderson1996: Citation = {
  authors: 'Schultz, P. H. & Anderson, R. R.',
  year: 1996,
  title: 'Asymmetry of the Manson impact structure: Evidence for impact angle and direction',
  venue:
    'In Koeberl, C. & Anderson, R. R. (eds.), The Manson Impact Structure, Iowa: Anatomy of an Impact Crater, GSA Special Paper 302',
  doi: '10.1130/0-8137-2302-7.397',
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
        formula: 'D_tc = 1.161 · (ρ_i/ρ_t)^(1/3) · L^0.78 · v^0.44 · g^(−0.22) · sin^(1/3)(θ)',
        description:
          'π-group scaling, Collins et al. 2005 Eq. 21*: the diameter of the transient crater at the pre-impact surface, for solid rock where gravity stops the growth. The constant 1.161 is a best estimate within 0.8–1.5. Nimbus then scales D_tc by (gf · f_seafloor)^(1/3.4) for the energy an airburst or a water column keeps from the ground, and by 0.15 for the largest crater of an iron strewn field — both Nimbus steps, not in Collins et al.',
        citation: collins2005,
      },
      {
        id: 'final-crater',
        name: 'Final crater diameter',
        formula:
          'D_fr = { 1.25 · D_tc                (simple, Eq. 22*, D_tc ≤ 2.56 km)\n        1.17 · D_tc^1.13 / D_c^0.13 (complex, Eq. 27*, D_c = 3.2 km) }',
        description:
          'Rim-to-rim diameter of the fresh crater after collapse. The two fits do not join: at D_tc = 2.56 km the simple rule gives 3.20 km and the complex one 2.91 km.',
        citation: collins2005,
      },
      {
        id: 'crater-depth',
        name: 'Crater depth',
        formula:
          'simple: d_fr = d_tc + h_fr − t_br ≈ 0.213 · D_fr  (Eqs. 23*–26*, 48*)\ncomplex: d_fr = 0.4 · D_fr^0.3  (km, Eq. 28*)',
        description:
          'Rim-to-floor depth of the fresh crater, as Collins et al. (2005) estimate it. A simple crater is the transient bowl (d_tc = D_tc/2√2) plus its rim, less the breccia lens that slides back in, which comes to 0.213 of the diameter. For a complex crater Collins et al. take the fit Herrick et al. (1997) made to fresh complex craters on Venus, whose gravity is close to Earth’s, over the few, eroded terrestrial ones. The branches do not join: 681 m just below 3.2 km, 567 m at it.',
        citation: herrick1997,
      },
      {
        id: 'seismic-magnitude',
        name: 'Seismic magnitude',
        formula: 'M = 0.67 · log₁₀(E) − 5.87   (E in J; ±0.67 for efficiency 10⁻⁵–10⁻³)',
        description:
          'Collins et al. 2005 Eq. 40*: the Gutenberg–Richter magnitude–energy relation applied to a seismic efficiency of 10⁻⁴ (Schultz & Gault 1975), which Collins et al. give a range of 10⁻⁵–10⁻³; Teanby & Wookey (2011) assumed 2 × 10⁻⁵ for Mars and Teanby (2015) suggested 5 × 10⁻⁴. E is the energy delivered to the ground: all of it for an intact impactor, the ground-coupled fraction for an airburst (a Nimbus extension; Collins et al. give no seismic effects for airbursts). M is an energy magnitude: reading 10⁻⁴·E as a seismic moment instead would put every impact ≈ 2.9 units lower, because an earthquake’s moment is about 2 × 10⁴ times the energy it radiates (Kanamori 1977).',
        citation: collins2005,
      },
      {
        id: 'airburst',
        name: 'Atmospheric entry and airburst',
        formula:
          'I_f = 2 · 4.07 C_D H Y / (ρᵢ L₀ v₀² sin θ) ;  z* ≈ −H [ln(Y / ρ₀v₀²) + 1.308 − 0.314 I_f − 1.303 √(1 − I_f)] ;  z_b = z* − 2H ln(1 + (l / 2H) √(f_p² − 1))',
        description:
          "Collins et al. 2005 Eqs. 8–20, with their constants: H = 8 km, ρ₀ = 1 kg/m³, C_D = 2, pancake factor f_p = 7, and, when no strength class is chosen, Y from the impactor's density (their Eq. 9). A body with I_f ≥ 1 never breaks and strikes the ground slowed by drag. A broken body spreads as a pancake (Chyba, Thomas & Zahnle 1993) of dispersion length l = L₀ sin θ √(ρᵢ / C_D ρ(z*)); if it reaches seven times its size above the ground it airbursts at z_b and digs no crater, otherwise the swarm strikes the ground at the speed Eqs. 17 and 20 leave it. The crater is dug at that speed, and the fraction of the energy that reaches the ground is (v_end / v₀)². Against the Earth Impact Effects Program run by Collins et al., on a fixed grid of 81 impacts, the outcome agrees in every case and the speed at the ground within the program's rounding. Where the program parts from the paper, Nimbus follows the program, since 16 September 2026: it takes I_f at twice Eq. 12's, so bodies break up to 0.8 % lower and burst up to 4.7 % lower than the printed I_f gives, and its Eq. 20 has no −3(l/H)² term, which slows a body that breaks low; with both, the breakup and burst altitudes are the program's to 0.02 %. The printed I_f is the one whose Eq. 11 lands within 40 m of the altitude where the ram pressure first reaches the strength (Eq. 10), and it is used where the doubled I_f would keep a body whole, which the program cannot compute — Sikhote-Alin's body among them. Until 14 September 2026 this was a classifier tuned on Tunguska and Chelyabinsk that burst in the air bodies of 100 m to 1 km the equations bring to the ground.",
        citation: collins2005,
      },
      {
        id: 'chelyabinsk-validation',
        name: 'Chelyabinsk 2013 calibration anchor',
        formula:
          '19.8 m, 3.3 g/cm³, 19.16 km/s, 18.3°, Y = 2 MPa → burst at 27.1 km (observed 27.0 km)',
        description:
          'Popova et al. 2013 measured an entry at 19.16 ± 0.30 km/s and 18.3° and a burst at 27.0 km, and derived a diameter of 19.8 ± 4.6 m for their 590 ± 50 kt at the 3.3 g/cm³ of the recovered meteorites. The preset flies that body: on Collins et al.’s equations, which nothing here was tuned on, it bursts at 27.1 km, releasing 0.59 Mt; the strength class, S-type at 2 MPa, is the preset’s choice. Until 15 September 2026 the preset flew 17 m at 3.0 g/cm³, 0.33 Mt, bursting at 29.0 km (B-033); until 14 September the tuned classifier burst that body at 22.1 km.',
        citation: popova2013,
      },
      {
        id: 'taxonomy',
        name: 'Impactor taxonomy presets',
        formula: 'COMETARY (ρ=600), C-type (2000), S-type (3300), M-type (5300), Iron (7800)',
        description:
          'Nimbus preset densities in kg/m³. Two have near analogues in Britt & Consolmagno (2003), whose data are meteorites, not asteroids: C-type near the CI and CM carbonaceous chondrites (2.11–2.12 g/cm³, Table 2) and S-type near the ordinary chondrites (3.21–3.40 g/cm³, Table 4). The paper covers stony meteorites only; the M-type, iron and cometary values have no source here.',
        citation: brittConsolmagno2003,
      },
      {
        id: 'ejecta',
        name: 'Ejecta deposit thickness',
        formula: 't_e(r) = D_tc⁴ / (112 · r³)     (r ≥ D_fr / 2)',
        description:
          'Collins et al. 2005 Eq. 47*: as thick at the transient rim as the rim is high (D_tc/14.1), thinning as r⁻³ — the decay McGetchin, Settle & Head (1973) measured around explosion craters. Written with the transient diameter so that one law serves simple and complex craters, reported only outside the final rim, and a lower bound (no bulking, no ground swept up where the ejecta lands). Inverted for the 1 mm and 1 m edges. Collins et al. also stop the deposit at the fireball radius for impacts under 200 Mt; Nimbus does not, so a small impact’s 1 mm edge extends the law beyond what their program reports.',
        citation: collins2005,
      },
      {
        id: 'strat-dust',
        name: 'Stratospheric dust loading',
        formula: 'M_dust = 0.1 % · m_p ,   m_p ≈ 4 · Y · (25 km/s / v)^0.33  Tg   (Y in Mt)',
        description:
          'Toon et al. (1997) estimate the rock an impact pulverizes (eq. 10, about 300 times the impactor’s mass at 25 km/s) and take 0.1 % of it — some 30 % of the impactor’s mass — to reach the stratosphere as sub-micrometre dust (§8.2). Y is the energy that forms the crater, so an airburst lofts none. A Chicxulub-size impact, 10⁸ Mt at 20 km/s, gives ≈ 4 × 10¹⁴ kg.',
        citation: toon1997,
      },
      {
        id: 'acid-rain',
        name: 'Shock-produced HNO₃ mass',
        formula: 'M_HNO₃ ≲ 3.1 × 10¹³ · (E / 10²³ J)  kg',
        description:
          'Nitric acid from the air an impact shock-heats, as if every NO molecule became HNO₃ — an upper limit. Scaled from the asteroid of Prinn & Fegley (1987), 5 × 10¹⁴ kg at 20 km/s, whose entry and ejecta plume make 3 × 10³⁸ NO molecules; their comet, 260 times more energetic, makes about as many per joule. The ejecta plume’s shock makes most of the NO, so E is the energy delivered to the ground.',
        citation: prinn1987,
      },
      {
        id: 'impact-tsunami-cavity',
        name: 'Ocean-impact tsunami cavity',
        formula:
          'R_C = (3·E_c / (2π · ρ_w · g))^(1/4) ,  E_c = E · gf · f_water · f_sea ;  A₀ = 0.5·R_C·R_ref/(R_ref + R_C), R_ref = 3 km ;  A(r) = A₀ · R_C / r',
        description:
          'A reference row, not the model’s best estimate (that is the Earth Impact Effects Program’s wave below). The cavity is Ward & Asphaug’s (2000) eq. 12 for a cavity as deep as its radius, with half the energy in the water; they take about 15 % and a diameter 2.5–3 times the depth, which gives a cavity 9–17 % narrower. It is within 2 % of the Gault & Sonett law R_w = 121·E^(1/4) m (E in kt) that Wünnemann et al. (2010) quote. The source amplitude A₀ is a project calibration — Ward & Asphaug start the wave at min(D_C, h), the cavity depth or the water depth (eq. 18) — and 1/r simplifies their decay, which runs from r^−1/2 for a cavity much wider than the water is deep to r^−1.075 for a much narrower one (eq. 17).',
        citation: ward2000,
      },
      {
        id: 'impact-tsunami-program',
        name: 'Impact-tsunami far field',
        formula:
          'D_w = 0.82581965 · (ρᵢ / ρ_w)^(1/3) · L^0.78 · v^0.44 · sin^(1/3) θ  (SI) ;  A(r) = f_sea · min(0.07 · D_w, h) · D_w / r for r > D_w, its value at D_w nearer',
        description:
          'The wave of an impact in water as the Earth Impact Effects Program draws it, read off its wave rings: a crater in the water of the form of Collins et al.’s Eq. 21, v the speed at the water, and a wave that falls as the inverse of the range from one crater diameter out, no taller there than the water is deep. Asked, after the rules were written, about fourteen impacts it had not been asked about, it answered thirteen, and agreed at all 49 of their levels: 37 rings within 1 %, the worst to 7.8 × 10⁻⁵, and 12 levels where neither draws one (rules 150 to 153). It is the amplitude the run-up, the friction correction, the legend and the bathymetric veil on the globe start from, for any body that reaches the water; Kajiura’s dispersion is not put on top of a 1/r that already carries it. An inland strike keeps the project’s reach to the sea, f_sea. Where the crater would be wider than the Earth, what is reported of it stops at the antipode. Hydrocode fits make the wave fall faster in deep water (the rim wave below) and no ocean has recorded one: this is what the field’s tool draws, not a measurement.',
        citation: collins2005,
      },
      {
        id: 'impact-tsunami-wunnemann',
        name: 'Impact-tsunami far field (Wünnemann rim wave)',
        formula:
          'A_r(r) = min(0.14 R_w, h) · (R_w / r)^q_r ;  q_r = min(1.2, 0.5 + 2 e^(−1.75 L/h))',
        description:
          'Wünnemann, Collins & Weiss 2010 eqs. 9a/10a. The rim wave is the shallow-water-type wave that survives into the far field: pure r^−0.5 spreading when the impactor dwarfs the water depth, r^−1.2 for a deep-ocean strike. It was the amplitude the run-up, the dispersion correction and the veil on the globe started from until 16 September 2026, when the program’s wave above replaced it; it gives a deep-ocean strike a far field several times lower — a 1 km stone in 4 km of water, 6.9 m at 1 000 km where the program’s law gives 22.9.',
        citation: wunnemann2010,
      },
      {
        id: 'impact-tsunami-wunnemann-envelope',
        name: 'Impact-tsunami published envelope',
        formula:
          'A_up = min(0.28 R_w, h) · R_w / r ;  A_low = min{A_r, 0.06 · min(R_w/3, h) · (5R_w / r)^q_c},  q_c = 3 e^(−0.8 L/h) (h/L ≥ 2)',
        description:
          'Wünnemann, Collins & Weiss 2010 eqs. 7–8 and 9b/10b — the upper and lower bounds the Earth Impact Effects Program reports. The collapse wave breaks near the source and forms only in deeper water: the paper prints eq. 9b as valid for h/L < 2, which contradicts its own statement that no collapse wave forms in shallow water, and Nimbus reads it as h/L ≥ 2. (The paper’s text also gives the collapse-wave height as 0.06 · min(h, 2R_w), where eq. 9b has min(R_w/3, h); Nimbus follows the equation.) This is why the lower bound for a deep-ocean impact is decimetres at 1 000 km while the upper bound is tens of metres: the far-field hazard of impact tsunamis is still an open question (Wünnemann 2007, Melosh 2003).',
        citation: wunnemann2010,
      },
      {
        id: 'impact-sea-coupling',
        name: 'Inland impact: how the sea is reached',
        formula:
          'reach = max(R_rim, D_w / 2, r_ejecta(1 m)) ;  f_sea = 1 for d ≤ R₀ = max(R_rim, D_w / 2), R₀ / d beyond ;  A = f_sea · A_program',
        description:
          'An impact on land near a coast reaches the sea with its crater when the rim crosses the shoreline, or with the ejecta curtain falling into the water beyond it. The deposit thins as r⁻³ (McGetchin, Settle & Head 1973; Collins et al. 2005 Eq. 47*), so the ejecta mass landing beyond a distance d falls as 1/d, and R₀/d of it reaches the water. Scaling the wave by that fraction is a Nimbus assumption, which the Earth Impact Effects Program does not compute; it is continuous across the shoreline. (Until 16 September 2026 the fraction scaled the energy the water cavity formed with.) Beyond the 1 m isopach the sea is not moved and no tsunami is emitted. The propagation then starts from the nearest deep-enough water in every compass sector within that reach — for an impact in Florida, the Gulf and the Atlantic at once.',
        citation: mcgetchin1973,
      },
      {
        id: 'atmospheric-yield',
        name: 'Atmospheric airburst yield',
        formula: 'E_atm = (1 − gf) · E_kinetic',
        description:
          'Energy released in the air during entry: none counted for a body that stays whole, all of it for an airburst — the Tunguska preset’s 9.1 Mt and Chelyabinsk’s 0.59 Mt — and the share drag took for a swarm that still strikes the ground, 27 % for the Meteor Crater preset. gf = (v_end / v₀)² from Collins et al.’s entry equations. Drives the entry-damage radii below.',
        citation: collins2005,
      },
      {
        id: 'airburst-blast',
        name: 'Air blast of an airburst',
        formula:
          'W = E₀ · max(f, 1 − f),  f = (v_b / v₀)² ;  r₁ = r / W_kt^⅓,  z₁ = z_b / W_kt^⅓ ;  regular: p = 3.14 × 10¹¹ (r₁² + z₁²)^(−1.3) + 1.8 × 10⁷ (r₁² + z₁²)^(−0.565) ;  Mach (z₁ < 550 m, r₁ ≥ r_m1 + w): p = (p_x r_x / 4r₁)(1 + 3 (r_x / r₁)^1.3),  p_x = 75 kPa,  r_x = 290 + 0.65 z₁ ;  between (|r₁ − r_m1| < w,  r_m1 = 550 z₁ / 1.2(550 − z₁),  w = 0.00328 z₁²): p linear in r₁ from the regular value at r_m1 − w to the Mach value at r_m1 + w ;  within r < 3 z_b: p to 2p',
        description:
          'The Earth Impact Effects Program’s air blast, as the program computes it: a still source at the burst altitude, given the larger of the energy the body keeps there and the energy it has lost, scaled to one kiloton (Collins et al. 2005 Eq. 57) and read off fits to nuclear tests — the regular reflection region of Collins et al. 2017 Eq. 7, which replaced the 2005 Eqs. 55–56 because they attenuated high bursts too fast, and beyond the edge of the Mach region (2005 Eq. 58) the surface-burst relation with its crossover moved out by the burst altitude (Eq. 54). Between the two the program draws a straight line in range across the edge of the Mach region, rising where the Mach stem forms its knee — a passage neither paper prints, read off the program’s own overpressure and adopted when it held on 72 of 72 points of twelve bodies nobody had asked it about, where the published step missed by up to 43 %. Their shock-physics runs found a moving source up to twice as strong within three burst altitudes, printed as the upper figure. Nothing in it is Nimbus’s: held out, it reproduces the program’s printed overpressure within 1 % on 24 of 24 airbursts. For the Tunguska preset: 5 psi at 5.8 km (13.1 km moving), 1 psi at 26.4 km, 0.5 psi at 44.2 km; Chelyabinsk’s 0.30 Mt at 27 km raises 1.6 kPa under the burst and draws no 0.5 psi ring, and 0.7 kPa in the city 45 km away, where the broken windows put about 3 kPa (Brown et al. 2013) — a burst on a shallow path spreads its energy along a line and damages an ellipse that reaches farthest across it, which this round source does not draw. The only analytic line source, ReVelle’s weak shock, is largely inapplicable so close to such a trail (Gi, Brown & Aftosmis 2018); only three-dimensional hydrocodes have drawn the shape. Until 15 September 2026 the rings were a surface-burst reach times a fitted altitude factor, up to 15×.',
        citation: collins2017,
      },
      {
        id: 'entry-flash-shock',
        name: 'Atmospheric flash + shock damage radii',
        formula:
          'r_flash(Q) = R_thermal(η · E_atm, Q) ;   r_shock(p) = R_airburst(W, z_b, p) for an airburst',
        description:
          'Burn (1st, 2nd, 3rd degree) and shock (5, 1, 0.5 psi) radii at the ground from the energy left in the air. The flash takes the project’s burn fluences of 8, 5 and 2 cal/cm², as every impact does — Glasstone & Dolan’s yield-dependent curves are a nuclear fireball’s pulse — with the impact luminous efficiency η = 3 × 10⁻³ of Collins et al. (2005), and no gain for altitude. The shock of an airburst is the program’s air blast above. A broken swarm that still strikes the ground is blasted, since 16 September 2026, by the program’s blast of a ground impact below, which already counts the energy lost in the air; until then it blasted like a ground impact, Kinney–Graham on half that energy.',
        citation: collins2005,
      },
      {
        id: 'damage-rings-airburst-honest',
        name: 'Damage rings of an airburst',
        formula:
          'shock(p) = R_program(E_kinetic · max(gf, 1 − gf), z_b ≤ 0, p) for a body that reaches the ground ;  burn(Q): f(Δ) · η · gf · E / (2π Δ²) + η · (1 − gf) · E / (4π Δ²) = Q',
        description:
          'The blast of a body or swarm that reaches the ground is the Earth Impact Effects Program’s own: its airburst law read at the altitude Eq. 18 gives, which lies below the ground, with the energy E · max(gf, 1 − gf) — the Mach relation at every range, its crossover r_x = 290 + 0.65 z₁ shortened as a steeper entry puts that altitude deeper, so a steeper impact blasts less. It is what the program computes and not a physical source, and it reproduces the program within 1 % on every point read. Until 16 September 2026 each shock ring was the larger of a surface burst of the ground-coupled energy and an airburst of the atmospheric yield, which rose with a steeper impact where the program falls and parted from it by a quarter to eight times. The flashes are two, for an observer on the ground: the fireball of the ground-coupled energy gf · E and the flash of the atmospheric yield (1 − gf) · E, with no gain for altitude. The two flashes add, and the ring lies where their sum reaches the burn’s exposure. The fireball on the ground radiates as the program computes it, into the half-space above the ground and dimmed by the share of it still above an observer’s horizon (Collins et al.’s Eq. 36*), which draws the program’s ignition rings within 1 % on sixteen bodies it had not been asked about; the flash in the air, which the program does not compute, keeps the project’s sphere. Until 16 September 2026 the fireball on the ground was a sphere too, and a burn ring took the larger of the two flashes rather than their sum.',
        citation: collins2005,
      },
      {
        id: 'ejecta-asymmetry',
        name: 'Oblique-impact ejecta asymmetry',
        formula:
          'f = max(0, 1 − θ° / 45°);  semi-major × (1 + 0.4·f);  semi-minor × (1 − 0.25·f);  downrange offset = 0.3·f·blanketEdge',
        description:
          'A Nimbus heuristic for the shape of the ejecta blanket drawn on the globe: rotationally symmetric for impacts steeper than 45°, stretched and shifted downrange of the trajectory as the impact grows more grazing. The ramp and the factors are the project’s own, not a published fit. Schultz & Anderson (1996) read the angle and direction of the impact that made the Manson structure from its asymmetry. An airburst leaves no crater and no blanket is drawn.',
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
        formula:
          'ΔP/P₀ = 808·[1 + (Z/4.5)²] / √([1 + (Z/0.048)²]·[1 + (Z/0.32)²]·[1 + (Z/1.35)²]) ,   Z = R · W^(−1/3)  (m, kg TNT)',
        description:
          'The Kinney–Graham fit for a TNT charge in free air, inverted for the 5, 1 and 0.5 psi radii. A charge on the ground reflects its blast and, reflecting perfectly, acts like twice its yield in free air (Takazawa, Kim & Garcés 2023): a chemical charge, whose energy goes almost wholly into the blast (Glasstone & Dolan §1.23), enters the fit at twice its yield. A nuclear burst puts only about half its energy into the air shock (§1.25), which the reflection restores, so it enters at its yield. The height-of-burst factor below then scales the radii. Until 14 September 2026 a chemical charge entered at its yield, a quarter short in radius.',
        citation: kinneyGraham1985,
      },
      {
        id: 'blast-thresholds',
        name: 'Blast damage thresholds',
        formula: '5 psi ≈ 34.5 kPa  (residential collapse) ;  1 psi ≈ 6.9 kPa  (light damage)',
        description:
          'Glasstone & Dolan: the house tests expected almost complete destruction of wood-frame houses at 5 psi (§5.64), and light damage — windows and doors blown in, interior partitions cracked (Table 5.139a) — reaches out to about 1 psi (§5.143).',
        citation: glasstoneDolan1977,
      },
      {
        id: 'hob-correction',
        name: 'Height-of-burst correction',
        formula:
          'z = HOB · W^(−1/3) (m·kt^(−1/3)):  f = 1.00 (z < 50) → 1.50 (150 ≤ z < 300) → 0.70 (z = 700) → 0.70·e^(−(z−700)/1500) → 0.25 (z ≥ 1500)',
        description:
          'A piecewise factor on the Kinney–Graham radii, chosen by the project rather than read from a published curve: a burst near the optimum height reaches half as far again as one on the surface. Glasstone & Dolan’s height-of-burst curves (Figs. 3.73a–c) and Needham (2018, ch. 14) describe the effect; for comparison, Glasstone & Dolan scale the damage ranges of an air burst by three quarters for a surface burst (§5.140), where this factor gives two thirds.',
        citation: needham2018,
      },
      {
        id: 'thermal',
        name: 'Thermal fluence / burn radii',
        formula:
          'Q = f · τ(R) · W / (4π · R²) ,  f = 0.18 → 0.35 over 0 ≤ HOB ≤ 200·W^0.4 ft ,  τ = e^(−R/L) ,  L = 14 km · (1 + HOB / 4 km) ;  3rd-degree burn at 6.2 cal/cm² (1 kt) → 11.8 (10 Mt)',
        description:
          'The thermal energy spread over a sphere, as Glasstone & Dolan write it (§7.94–7.96). The partition f is 0.35 for a nuclear air burst (Table 7.88) and 0.18 for a contact surface burst (§7.101); the book interpolates between the two for bursts in between (Table 7.101), and Nimbus does so linearly in height up to 200·W^0.4 ft, the height of the book’s air-burst curves (§7.42). The exposure that burns is the book’s own, read off its Figure 12.65 — “skin burn probabilities for an average unshielded population taking no evasive action” — and a ring is drawn where half that population takes the burn: the figure’s solid 50 % line, growing with the yield because a larger explosion spreads its pulse over a longer time. Its broken lines at 18 % and 82 % (100 % for the third degree, the only upper curve the figure draws) bound the spread across people at one exposure; that spread is not an uncertainty in the ring. Until 16 September 2026 the rings were drawn at the neighbouring Figure 12.64, the exposure a burn needs for three skin pigmentations, which attaches no probability to any curve; the two differ by a few per cent, and not always in the same direction. An impact takes a luminous efficiency of 3 × 10⁻³ (Collins et al. 2005) and keeps the project’s fixed 8 and 5 cal/cm²: the figure’s curves are a nuclear fireball’s pulse. A chemical charge radiates comparatively little (§1.23) and has no burn radii. The transmittance τ and its length L are a project calibration.',
        citation: glasstoneDolan1977,
      },
      {
        id: 'firestorm',
        name: 'Firestorm ignition / sustain',
        formula: 'Ignition @ 4.19 × 10⁵ J/m² (10 cal/cm²) ;  Sustain @ 2.51 × 10⁵ J/m² (6 cal/cm²)',
        description:
          'Project thresholds, without attenuation, on the fluence of the thermal card — with its height-dependent partition — and none for a chemical charge. Glasstone & Dolan give ignition exposures that depend on material and yield — shredded newspaper, for instance, at a few to about ten cal/cm² from 35 kt to 20 Mt (Table 7.40) — and define a fire storm by its merged convective column and inward winds rather than by an exposure (§7.58).',
        citation: glasstoneDolan1977,
      },
      {
        id: 'crater',
        name: 'Surface-burst crater (ground-type dependent)',
        formula:
          'D_apparent = K · W_kt^0.3     (K = 29.87 hard rock, 37.19 firm and dry, 92 wet, 105 clay; metres)',
        description:
          'Because a crater’s size changes so fast as the burst passes through the surface, Glasstone & Dolan print the contact-surface-burst radius of a 1 kt explosion on Figures 6.72a and b themselves: 82, 61, 58 and 49 feet for wet soil or wet soft rock, dry soil or dry soft rock, wet hard rock and dry hard rock, with depths of 31, 28, 28 and 22 feet. Three of the five K here are twice those radii — 37.19 m for dry soil and firm ground, 29.87 for hard rock — and §6.72 scales every dimension by W^0.3, which the book’s own worked example confirms; Nordyke (1962) derived W^(1/3.4) for desert alluvium. Two are not the book’s. For saturated reef K = 92 stays, because the book’s 49.99 would put Castle Bravo and Ivy Mike at 0.89 and 0.80 km where 92 puts them at 1.6 and 1.5, the “mile-wide” craters they left (Kunkle & Ristvet 2013, DTRIAC SR-12-001), and the figure is drawn for 1 kt against their 15 and 10.4 Mt. Clay is a project value; the book has no clay. The depth the book gives is not drawn here. Until 16 September 2026 dry soil and firm ground were 36.6, read from §6.09’s sentence rather than the figure, and hard rock a project 0.8 of dry soil; until 14 September they were 75 and 60, twice the book.',
        citation: glasstoneDolan1977,
      },
      {
        id: 'radiation',
        name: 'Initial-radiation lethal-dose radii',
        formula:
          'dose = gamma (Figs. 8.33a/b) + neutron (Figs. 8.64a/b) at slant range ;  rings at 800 / 450 / 100 rads ;  R_ground = √(R_slant² − HOB²)',
        description:
          'The book’s own dose–range figures, traced from the page: 8.33a and b for gamma rays and 8.64a and b for neutrons, six curves apiece from 30 to 10 000 rads, the “a” of each pair for fission weapons to 100 kt and the “b” for thermonuclear weapons of 50 % fission yield to 20 Mt. The two doses are added, the figures are read for a burst at 290·W^0.4 ft and corrected towards a contact surface burst below 300 ft (Table 8.37 for gamma rays, one half for neutrons), and the slant range they give becomes a ring on the ground. The three doses the rings are drawn at are the project’s — 800, 450 and 100 rads, after OTA 1979, UNSCEAR and BEIR VII — not the book’s. The book gives its figures a reliability factor of 0.5 to 2 for a fission weapon and 0.25 to 1.5 for a thermonuclear one; outside 1 kt and 20 Mt they are held flat, and rads of neutrons are added as if worth the same as rads of gamma rays, which §8.65 says they are often not. Until 16 September 2026 these rings were a project fit, 700 m · W_kt^0.18 with LD₁₀₀ at 0.7 of it and the threshold at 1.4, whose own anchors cited a figure the book does not have. A chemical charge has none, and neither has a burst under the water or above the atmosphere.',
        citation: glasstoneDolan1977,
      },
      {
        id: 'emp',
        name: 'EMP regime + HEMP footprint',
        formula:
          'HEMP peak = min(50 kV/m, 50 kV/m · (W/1 Mt)^(1/3)) @ HOB > 30 km ;  footprint = √(2·R_E·h + h²)',
        description:
          'Longmire 1978 explains the high-altitude pulse by Compton currents. The 50 kV/m peak is the IEC 61000-2-9 waveform, which the standard gives without a yield (Savage, Gilbert & Radasky 2010, Meta-R-320, note the early pulse is not closely tied to yield); the cube-root roll-off below 1 Mt is a project assumption. The affected area is the Earth-tangent horizon disc of the burst.',
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
          'The panel puts a charge in the air, on the surface or under the water. Under the water, Glasstone & Dolan say much of the thermal radiation and of the initial nuclear radiation is absorbed within a short distance (§1.39), and the fireball of the BAKER shot was visible for a few thousandths of a second (§2.64): the model gives no burns, no fires and no initial radiation. The book adds that a shallow burst lets some escape and gives no amount, so this is the low end. For the air blast it gives the overpressure of a buried burst at an adjusted scaled distance, λ_x·e^(ρ·λ_d/126) (§6.81), and says an underwater burst attenuates "in a pattern similar" (§6.53): every overpressure is reached at the surface burst\'s range times e^(−ρ·λ_d/126) — taking the surface burst as the reference and water for the ground medium are the model\'s assumptions, since §6.81 is written for a burst buried in the ground — three quarters for BAKER, under a third past the 150 ft·kt^(−⅓) beyond which the spray dome makes no appreciable air shock. A charge below the sea floor or under land would be an underground burst, which the model does not have; it is drawn as a burst on the surface, and the panel says so.',
        citation: glasstoneDolan1977,
      },
      {
        id: 'contact-water-burst-flag',
        name: 'Contact-water burst flag (atmospheric ring dimming)',
        formula: 'isContactWaterBurst = (a wave exists) = 0 < burst depth ≤ water depth',
        description:
          "The flag follows the wave rather than the regime: a burst is a contact-water burst when it is within the water, which is when Glasstone & Dolan's relations give it a wave, and a SURFACE classification does not decide it. A 500 Mt device 580 m above 200 m of sea is SURFACE by scaled height and still makes no wave. Under the water the burns, fires, initial radiation and crater are zero, so the globe draws the overpressure rings, shortened for depth and dimmed (alpha 0.85 → 0.4) so the eye reads the wave as the story; the unscaled surface-burst radii are still emitted for callers that want the land-equivalent reference.",
        citation: glasstoneDolan1977,
      },
      {
        id: 'coastal-explosion-tsunami',
        name: 'Coastal-explosion sea search',
        formula:
          'nearestSea(local tile, planetary mosaic, click) → distance to the shore, basin depth (median of the sea around, ≤ 200 m)',
        description:
          "When a burst lands on a land cell near the coast (Beirut 2020 on Hangar 12, Castle Bravo on the Bikini reef), the simulator finds the nearest sea a wave could cross — not a lake or a river — and passes the burst its distance and depth, so the sea-coupling law can say whether the crater reaches the water. A wave needs more than that: Glasstone & Dolan's relations are for a burst within the water, and a burst on a quay or a reef is not one, so it makes none. A harbour wave at Beirut is therefore not drawn. Its validation row accepts anything from nothing to two metres, and the “about a metre” it describes has no source in this repository, so the row checks little.",
        citation: glasstoneDolan1977,
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
          'Joyner & Boore 1981, fitted on western North American records for 5.0 ≤ M ≤ 7.7. It draws the epicentral intensity, the liquefaction radius and the aftershock rings. Until 14 September 2026 it also drew the MMI VII–IX rings, and beyond M 7.7, outside its data, painted intensities no earthquake reached: 180 000 km² of Japan at IX for Tōhoku, whose ShakeMap never touched it.',
        citation: joynerBoore1981,
      },
      {
        id: 'pga-nga',
        name: 'PGA attenuation (NGA-West2, BSSA14)',
        formula: 'ln(PGA_g) = F_E(M, mech) + F_P(R, M) + F_S(Vs30, PGA_rock)',
        description:
          'Boore et al. 2014 NGA-West2 equation with magnitude-dependent spreading, the 4.5 km near-source term, fault-type constants and the published site term. Since 14 September 2026 it draws the MMI VII–IX rings of every scenario no deeper than 70 km, chosen by rules 17–19 of the validation on 370 USGS ShakeMaps against Joyner & Boore 1981 and checked on 406 held-out death tolls; it invents no intensity an earthquake never reached, and on reference rock draws moderate earthquakes’ MMI VII at about half the ShakeMaps’ radius, a declared gap. Also shown as PGA at 20 and 100 km, at every depth.',
        citation: boore2014,
      },
      {
        id: 'pga-slab',
        name: 'PGA of an earthquake deeper than 70 km (BC Hydro 2016, intraslab)',
        formula:
          'ln PGA_g = θ₁ + θ₄·ΔC₁ + f_M(M) + (θ₂ + θ₁₄ + θ₃·(M − 7.8))·ln(R_hyp + 10·e^(0.4·(M − 6))) + θ₆·R_hyp + θ₁₀ + θ₁₁·(min(Z_hyp, 120) − 60) + f_S(Vs30, PGA₁₀₀₀)',
        description:
          'Abrahamson, Gregor & Addo 2016, the BC Hydro model for earthquakes inside a subducting slab: the central magnitude scaling (ΔC₁ = −0.3), a forearc site, the ergodic model, the distance to the hypocentre and its depth, held to OpenQuake’s implementation within one part in a billion. Since 15 September 2026 it draws the MMI VII–IX rings of every scenario deeper than 70 km, as a disc about the epicentre at every magnitude, chosen by rules 66–70 of the validation on 618 USGS ShakeMaps of 1973–2025 no rule had read: a skill of 0.86 at MMI VII, where Boore et al. 2014, painting VII about every one of them, scored 0.00, and Parker et al. 2022 0.74. On the dead of 62 deep earthquakes it reads nearer the records than the rings it replaced, but its band holds fewer of them (38 against 58), a declared gap; deeper than 300 km nothing it was chosen on reaches.',
        citation: abrahamson2016,
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
          "The largest aftershock averages about 1.2 magnitude units below the mainshock whatever the mainshock's size, with a scatter of about half a unit. The simulator uses it as a hard ceiling: the catalogue holds the aftershocks between the completeness cutoff and the ceiling, and none for a mainshock whose ceiling is at or below the cutoff, Mw 3.7 and smaller.",
        citation: bath1965,
      },
      {
        id: 'aftershock-gutenberg-richter',
        name: 'Magnitude distribution',
        formula: 'log₁₀ N(M ≥ m) = a − b · m   (b = 0.91)',
        description:
          "Power-law magnitude-frequency distribution, cut to the cutoff and the Båth ceiling and sampled by inverse CDF on that window, m = M_c − log₁₀(1 − U·(1 − 10^(−b·(M_max − M_c)))) / b. The b-value is Reasenberg & Jones's generic 0.91, the same one that sizes the count. Until 15 September 2026 a magnitude above the ceiling was drawn again, and a mainshock of Mw 3.13 to 3.70, whose ceiling is under the cutoff, never finished.",
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
          'N = 10^(a + b·(M_main − M_c)) · ∫₀ᵀ (t + c)^(−p) dt · (1 − 10^(−b·(M_max − M_c)))   (a = −1.67, b = 0.91, p = 1.08, c = 0.05 d)',
        description:
          'Reasenberg & Jones 1989 give the daily rate of aftershocks at or above M; the count over the window is that rate integrated, about 6.4 times the amplitude for 30 days, and of those it keeps the share under the Båth ceiling: 99.7 % from Mw 6.5 up, half at Mw 4, none at Mw 3.7. Until 14 September 2026 the amplitude alone was taken as the count, about six times too few. The simulator stops at 500 events for the renderer.',
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
          "Hanks–Kanamori moment spread over the rupture area for the mean slip, lifted by a fault-style uplift factor and a coupling efficiency (both simulator values — see the next entries), then decayed from half the down-dip width with the energy normalisation of a Gaussian ring. It is checked on 113 deep-ocean buoy records of nine megathrusts, read to rules committed before it was run on them: 1.00× at the median event, the events scattered by a factor of 1.56 (docs/BENCHMARK_PROTOCOL.md, BM-05). The uplift factor was set at DART 21413 for Tōhoku 2011 on a record misread as 30 cm; the buoy's file crests at 0.81 m, where this law reads 0.30 m.",
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
          "Simulator-chosen ratios of mean sea-floor uplift to mean slip. The megathrust value, 0.6, was tuned at DART 21413 for Tōhoku 2011, on a record misread as 30 cm (the buoy's file crests at 0.81 m); it is not re-tuned, because the law it sits in reads 1.00× at the median of nine megathrusts' buoy records. 0.5, 0.4 and 0.05 are assumed. Tanioka & Satake 1996 show that the horizontal motion of a sloping sea floor adds to the wave, which is the reason a megathrust value above the others is plausible.",
        citation: taniokaSatake1996,
      },
      {
        id: 'wave-coupling-efficiency',
        name: 'Uplift → wave-amplitude efficiency',
        formula: 'A₀ = η · uplift,   η ≈ 0.7',
        description:
          "η = 0.7 is a simulator calibration against the Sumatra record and the Tōhoku 2011 buoy record as it was misread (30 cm, where the file crests at 0.81 m), not a published efficiency. Satake et al. 2013 find that horizontal displacement of the sea-floor slope accounts for 20–40 % of Tōhoku's tsunami amplitudes, a different quantity.",
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
          'Mastin et al. 2009, Eq. 1: H in km above the vent, V̇ in m³ of dense rock per second. Their 50 % confidence envelope spans a factor of four in eruption rate for a given height — about ±40 % in height; the tests accept ±50 %.',
        citation: mastin2009,
      },
      {
        id: 'vei',
        name: 'Volcanic Explosivity Index',
        formula: 'VEI = integer bin on log₁₀(V_ejecta)     (V in m³)',
        description:
          'The Newhall & Self 1982 index: nine classes, VEI 0 (under 10⁴ m³) to VEI 8 (10¹² m³ and more), binned here on the bulk ejecta volume alone; the published index also weighs column height and qualitative criteria.',
        citation: newhallSelf1982,
      },
      {
        id: 'pdc-sheridan',
        name: 'Pyroclastic runout (Sheridan)',
        formula: 'L = 10 · V_km3^(1/3)   km',
        description:
          'A Nimbus volume scaling for the reach of a pyroclastic density current, with K = 10 set in code against Mount St Helens, Krakatau and Tambora. Sheridan (1979) reviews how pyroclastic flows are emplaced and is background, not the source of the equation.',
        citation: {
          authors: 'Sheridan, M. F.',
          year: 1979,
          title: 'Emplacement of pyroclastic flows: A review',
          venue:
            'In Chapin, C. E. & Elston, W. E. (eds.), Ash-Flow Tuffs, GSA Special Paper 180, 125–136',
          doi: '10.1130/SPE180-p125',
        },
      },
      {
        id: 'pdc-energy-line',
        name: 'PDC runout (energy line)',
        formula: 'L = f_c · H_plume / (H/L)     (f_c = 0.25, H/L = 0.10)',
        description:
          'An energy-line upper bound: the current falls from a quarter of the Mastin plume top and runs out along a slope H/L = 0.1. Hayashi & Self (1992) show H/L decreasing with volume for pyroclastic flows; f_c and 0.1 are Nimbus choices.',
        citation: hayashiSelf1992,
      },
      {
        id: 'climate-cooling',
        name: 'Climate cooling from VEI',
        formula: 'ΔT(VEI) = max(−5, −0.05 · 2.2^(VEI − 3))   K   (0 below VEI 1)',
        description:
          'A Nimbus calibration, not a relation from Robock (2000): −0.24 K at VEI 5, −0.53 at 6, −1.17 at 7, −2.58 at 8. Robock cautions that VEI is a poor measure of the sulphur an eruption puts into the stratosphere, which is what cools the climate.',
        citation: robock2000,
      },
      {
        id: 'ashfall',
        name: 'Ashfall 1-mm isopach area',
        formula: 'Area(1 mm) ≈ 60 000 · V_km3^0.8   km²',
        description:
          'A wind-independent envelope fitted in Nimbus to the 1 mm isopach areas of Mount St Helens 1980, Pinatubo 1991 and Krakatau 1883, to a factor of 2. Pyle (1989) supplies the framework — deposits thinning exponentially with the square root of area — not this equation.',
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
          'A Nimbus length recast of Iverson et al. (1998), whose laws give the inundated cross-section (0.05 · V^(2/3)) and planimetric area (200 · V^(2/3)), not a length; 5 × 10⁷ m³ gives 42 km. Order of magnitude.',
        citation: iverson1998,
      },
      {
        id: 'ashfall-suzuki',
        name: 'Wind-advected ashfall (Suzuki column)',
        formula: 'f(z̃) = S₀ · [(1 − z̃) · exp(A · (z̃ − 1))]^λ   ;   x_centre = u · z / v_t',
        description:
          'Suzuki’s (1983) release profile along the plume column, in the two-parameter form of Pfeiffer et al. (2005), with A = 4 and λ = 1. Each mass slice lands at u · z / v_t downwind; the isopach elongates with wind speed, and since 16 September 2026 both spreads grow with the time a release spends falling (see the card below). The deposit along the wind is still a row of bands — the coarse classes near the vent, the finest far out — and the 1 mm edge is the far side of the farthest band above it, found by walking the axis in half-spread steps; until 15 September 2026 it was a bisection that could stop at a nearer band, so a larger eruption could report a shorter reach.',
        citation: pfeiffer2005,
      },
      {
        id: 'ashfall-bonadonna',
        name: 'Crosswind spreading closure',
        formula:
          'σ² = (8/5)·C·(t + (0.2·h²)^(2/5))^(5/2)  for t ≥ 288 s ;  σ² = 4·K·(t + 0.0032·h²/K)  below  (C = 0.04, K = 5 138 m²/s)',
        description:
          'The closure Tephra2 uses (Connor & Connor 2006, on Bonadonna et al. 2005 and Suzuki 1983), read from its own source and adopted on 16 September 2026: the spread a release gets is the one its fall time earns, so fine ash that takes a day to reach the ground spreads far more than a lapillus that takes four minutes, and it is that fine tail that makes a cloud wide. The spread is isotropic and already carries the plume’s own size in its diffusion time, so the source width is not added on top. The eddy constant C and the diffusion coefficient K are Tephra2’s example values, from one inversion of one eruption at Colima, carried here unchanged and declared as such. Its two branches do not meet at their own threshold, and the step is carried rather than smoothed. The thickness at (x, y) sums the Suzuki release weights × Gaussian footprints × grain-class mass fractions. Until this closure the spread grew with the downwind distance and the plume height alone — σ_y = max(0.3·H, 500 m)·√(1 + x/10H) — so every grain class spread alike and the cloud came out 0.008× Tephra2’s thirty kilometres off the axis, the worst number in the project; it is now 0.299×, and on the wind axis 0.69× against 0.47×. Agreeing with Tephra2 is not agreeing with a deposit: still not a full atmospheric transport model, and for hazard mapping use HYSPLIT or FALL3D.',
        citation: bonadonnaPhillips2003,
      },
      {
        id: 'ganser-drag',
        name: 'Terminal velocity (Ganser drag)',
        formula:
          'C_d = (24/Re)·(1 + 0.1118·Re^0.6567) + 0.4305 / (1 + 3305/Re) ;  v_t = √(4·g·d·Δρ / (3·C_d·ρ_a))',
        description:
          'Ganser 1993 drag for a sphere, covering the Stokes to Newton regimes with one formula; the coefficients match those Dioguardi et al. (2018) and Bagheri & Bonadonna (2016) give for a sphere below the critical Reynolds number. An 8-iteration fixed point solves for the Re-dependent C_d. Applied to 4 grain classes (8 mm, 1 mm, 125 µm, 32 µm) with a 40/30/20/10 % mass split chosen for Nimbus.',
        citation: ganser1993,
      },
      {
        id: 'lateral-blast-wedge',
        name: 'Flank lateral-blast envelope',
        formula: 'runout = 2.5 · L_Sheridan ;  directionDeg, sectorAngleDeg (default 180°)',
        description:
          'The Mount St Helens 1980 archetype: a directed blast over a sector up to 180° reaching about 28 km (Crandell & Hoblitt 1986). The runout is 2.5 times the Sheridan runout — about 27 km for the Mount St Helens preset — and is drawn as a wedge at the chosen azimuth and sector.',
        citation: crandellHoblitt1986,
      },
      {
        id: 'flank-collapse-tsunami',
        name: 'Volcano flank-collapse tsunami',
        formula:
          'A₀ = min(0.4 · (γ/γ_ref) · V^(1/3) · sin θ,  0.4 · h),  γ = ρ_s/ρ_w − 1,  travelTime = r / √(g · h)',
        description:
          "A Watts 2000-inspired calibrated form, not Watts' predictive equation, applied to volcano flank collapses entering the sea. Slide thickness and Froude number are folded into the prefactor 0.4, which is calibrated on the Anak Krakatau collapse of 22 December 2018 (V ≈ 0.27 km³, Grilli et al. 2019's best estimate; θ = 20° and 200 m of water are Nimbus inputs): 88 m, held to 40 % of the depth, so 80 m — above the leading wave of nearly 50 m that Grilli et al. simulate near the island. γ/γ_ref reads a slide density about the 2 500 kg/m³ of volcanic rock. Until 14 September 2026 this entry printed a prefactor of 0.1, which gives 22 m.",
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
          'Shallow-water gravity-wave speed (Lamb 1932, Art. 170). Drives the tsunami-travel-time calculation.',
        citation: lamb1932,
      },
      {
        id: 'shoaling',
        name: "Green's law shoaling",
        formula: 'A_shore / A_deep = (h_deep / h_shallow)^(1/4)',
        description:
          'Amplitude gain as a long wave climbs onto a shelf (Green 1838; Lamb 1932, Art. 185): 1 m over 4 000 m of water becomes ≈ 4 m at 15 m. The field on the globe applies A ∝ c^(−1/2), stops at 50 m of depth and caps the gain at 4×.',
        citation: {
          authors: 'Green, G.',
          year: 1838,
          title: 'On the motion of waves in a variable canal of small depth and width',
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
          'open water: A₀ = min(K · (γ/γ_ref) · V^(1/3) · sin θ,  0.4 · h),  K = 0.4 above the water, 0.005 under it   ;   confined basin: A₀ = min(f · V / A_basin,  h),  f = 1.8',
        description:
          "A Watts 2000-inspired calibrated form, not Watts' predictive equation: slide thickness and Froude number are folded into a prefactor per regime. A rigid mass falling into the water, K = 0.4, is calibrated on Anak Krakatau 2018 (0.27 km³, Grilli et al. 2019's best estimate); sediment sliding on the sea floor, K = 0.005, on Storegga, against a 5–10 m target Nimbus set for 3 000 km³ on a 5° slope (Bondevik et al. 2005 model 2 400 km³ and map run-up of 3–20 m), so the same volume and slope make a wave up to 80 times taller falling in. γ = ρ_s/ρ_w − 1 is read about each regime's reference density (2 500 and 1 950 kg/m³). A reservoir or a fjord takes the basin-fill form instead, the volume spread over the surface and amplified by f = 1.8, capped at the basin depth. f is set on Vaiont, where the wave crested 140 m above the top of a dam that stood 25 m above the lake (Genevois & Ghirotti 2005; ASDSO): 162 m against 165. It was 3 until 14 September 2026, tuned on a 250 m that is the slide's thickness in that paper. A slide footprint, when given, replaces V^(1/3) with √(A/π) as the radius the far field decays from. Treat it as an order of magnitude, a factor of 2 either way. Until 14 September 2026 this entry printed a single prefactor of 0.1, which no product path used.",
        citation: watts2000,
      },
      {
        id: 'dispersion',
        name: 'Far-field dispersion',
        formula: 'D = (4π²/6) · r · h² / λ³ ;   f_disp = (1 + D)^(−1/2)',
        description:
          'Dispersion of the leading wave on the source’s own wavelength λ and the depth h, after Kajiura (1963). 4π²/6 is the first correction to the long-wave speed, c ≈ √(gh)·(1 − (kh)²/6); the exponent ½ is a Nimbus closure that carries the decay from 1/√r toward 1/r. Explosion waves bypass it: Glasstone & Dolan’s relations already contain their dispersion.',
        citation: kajiura1963,
      },
      {
        id: 'fast-marching',
        name: 'Bathymetric arrival field (Fast Marching)',
        formula: '|∇T|² = 1 / c(x, y)²   ;   c = √(g · h(x, y))',
        description:
          'Sethian 1996 eikonal solver run on a DEM raster to produce true arrival-time isochrones. The tsunami slows onto continental shelves, refracts around islands, and is blocked by dry coastlines — the bent isochrones of NOAA’s published travel-time maps (NCEI, computed with the TTT software). A source that carries a period (an explosion) moves at that period’s group velocity instead of √(g·h). Activates whenever a bathymetric grid is loaded; otherwise the uniform-depth Lamb 1932 travel-time falls back.',
        citation: sethian1996,
      },
      {
        id: 'tsunami-source-wavelength',
        name: 'Source-radiated wavelength',
        formula: 'λ_impact ≈ 2 · R_C ;   λ_megathrust ≈ 2 · W ;   λ_explosion from its period',
        description:
          'A Nimbus heuristic: one cavity diameter for an impact, twice the down-dip width for a megathrust. Tōhoku 2011 (Mw 9.1, W ≈ 205 km from Strasser et al. 2010) gives λ ≈ 410 km. An explosion takes its wavelength from the period Glasstone & Dolan give it.',
        citation: strasser2010,
      },
      {
        id: 'tsunami-period',
        name: 'Dominant wave period',
        formula: 'T = λ / c',
        description:
          'Period at the source. Tōhoku 2011 (λ ≈ 410 km, c ≈ 198 m/s over 4 km of ocean) gives T ≈ 2 070 s ≈ 35 min. Explosion sources use their own period.',
        citation: lamb1932,
      },
      {
        id: 'inundation-distance',
        name: 'Inland inundation distance',
        formula: 'L_inland = R_runup / tan(β_beach)',
        description:
          'The geometric reach of a plane-beach run-up wedge, used for the readout: 100× the run-up on a 1:100 beach, 30× on 1:30, 300× on 1:300. A geometric identity, not a published hazard rule; order of magnitude only. The casualty estimate uses a separate roughness-based distance, X = 0.06 · H^(4/3) / n², capped at 10 km.',
        citation: synolakis1987,
      },
      {
        id: 'coastal-damage-tier',
        name: 'Coastal damage from run-up height',
        formula:
          'Tier 0: < 0.3 m — tide-gauge only;  Tier 1: 0.3–1 m — light flooding;  Tier 2: 1–3 m — cars / single-storey;  Tier 3: 3–6 m — wood frames / harbours;  Tier 4: 6–10 m — concrete damaged;  Tier 5: > 10 m — Tōhoku-/Lituya-class destruction',
        description:
          'Six damage labels chosen for Nimbus by run-up height, shown under every run-up row. The bands resemble, but are not, the height bands of Japan’s tsunami warnings (0.2–1, 1–3, 3–5, 5–10 and over 10 m); Bryant (2014, Fig. 10.13, after Shuto 1993) relates damage to flow depth by building type.',
        citation: jma2013,
      },
      {
        id: 'beach-slope-from-dem',
        name: 'Beach slope from on-site DEM',
        formula: 'β_beach = atan(|∇z(x, y)|)   when click on land AND atan(1/1000) ≤ β ≤ atan(1/3)',
        description:
          'When the user clicks a coastal cell with a real terrain gradient, the simulator samples the AWS Terrarium DEM tile around the click and feeds the local slope into the Synolakis (1987) run-up. Outside the [1:1000, 1:3] envelope (mud-flat / cliff face) the formula falls back to the 1:100 textbook reference. The result blob carries `beachSlopeRadUsed` and `beachSlopeFromDEM` so the UI can label the run-up as "DEM locale" or "riferimento 1:100". The coastal run-up field behind the casualty estimate uses its own per-cell slope, clamped to [1:2000, 1:2].',
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
          'Sum of the WorldPop 2020 population inside a circle. The browser asks the WorldPop zonal-statistics API (api.worldpop.org, free, no key, CORS-enabled) for every ring up to its 100 000 km² allowance — a circle of ≈ 178 km — and, for larger rings (up to 1 500 km) or when the API is unreachable, sums shipped 2.5′ tiles of the JRC GHS-POP 2020 grid (Schiavina 2023); planetary rings use a 0.125° (≈ 14 km) aggregate of the same grid. An operator may point `VITE_POPULATION_COG_URL` at a CORS-enabled Cloud-Optimised GeoTIFF (WorldPop or JRC GHSL R2023A) for 1 km resolution on every ring. A cell the ring’s edge crosses counts by the share of a 4 × 4 sub-grid inside it.',
        citation: tatem2017,
      },
      {
        id: 'casualties-blast',
        name: 'Blast casualties (impacts, explosions)',
        formula:
          'deaths = Σ_band pop(band) · m(band) ;  m = 98 % (≥ 12 psi), 50 % (5–12), 5 % (2–5), 0 % (1–2) ;  injured: 2 / 40 / 45 / 25 %',
        description:
          "Office of Technology Assessment 1979, The Effects of Nuclear War, ch. II fig. 1 (p. 19): mortality by peak overpressure, assumptions OTA calls relatively conservative and that Postol (1986) describes as the standard rules based on Hiroshima. Prompt blast, thermal and collapse together, nobody evacuated. The 12 and 2 psi radii are derived from the drawn 5 and 1 psi contours with the Kinney–Graham curve ratio at the event's yield. The band, a factor of 2 either way, is a project choice. A chemical explosion uses its own project rates instead — 20, 3, 0.5 and 0.05 % dead, a factor of 3 either way — because direct overpressure kills few people below the 40 psi Glasstone & Dolan give for the threshold of lethality (Table 12.38); the dead are under the buildings. When the Monte Carlo band has run, it replaces these table bands.",
        citation: ota1979,
      },
      {
        id: 'casualties-shaking',
        name: 'Shaking casualties (earthquakes)',
        formula: 'ν(S) = Φ(ln(S / θ) / β) ;  deaths = Σ_band pop(band) · ν(S_mid)',
        description:
          'The USGS PAGER empirical fatality model: a log-normal fatality rate in shaking intensity, fitted by hindcasting earthquakes of 1973–2007, per country or region. The central estimate uses the PAGER curve (fatality.xml) of the country inferred from the nearest city, or the median of its 252 curves (θ = 14.57, β = 0.205) where none is found; the band spans the best and the worst stock in that table (θ = 46.2, β = 0.43, the United States; θ = 8.32, β = 0.10) — orders of magnitude, which is what not knowing the houses under the ring costs. Applied to the MMI ≥ IX, VIII and VII annuli at their mid-band intensity. When the Monte Carlo band has run, it replaces this table band, and it draws the curve\u2019s own published scatter, PAGER\u2019s G for the country (see the toll band below).',
        citation: jaiswalWald2010,
      },
      {
        id: 'casualties-pyroclastic',
        name: 'Pyroclastic casualties (volcanoes)',
        formula:
          'deaths = m · pop(runout) + m · (sector / 360°) · pop(lateral-blast annulus) ;  m = 0.9 (0.01–1), or 367 / 410 388 (0–0.01) inside a cleared zone',
        description:
          'People caught inside a pyroclastic density current rarely survive. Where no evacuation was ordered, mortality inside the runout is taken as 90 % with a band of 1 to 100 % — project values; the Auker et al. (2013) abstract says pyroclastic currents and lahars caused half of all volcanic deaths, not what share of those inside die. Inside a zone ordered cleared, the measured Merapi 2010 ratio applies: 367 dead among 410 388 displaced (0 to 1 %). A lateral blast counts the same inside its sector. Ashfall at the 1 mm isopach kills nobody and lahars are not converted; a flank-collapse tsunami enters the coastal toll.',
        citation: auker2013,
      },
      {
        id: 'casualties-honesty',
        name: 'What the death toll is not',
        formula: 'order of magnitude, low–high band, sources on the label',
        description:
          'The blast, burn and fire figures assume no warning and no shelter; warning enters only the tsunami toll, and evacuation only a volcano’s cleared zone. Fallout, initial radiation, famine and disease are left out. The tsunami toll rests on a run-up height and a beach slope, not on an inundation map. Numbers are printed to two significant figures with their band, next to the vulnerability function and the population source that produced them.',
        citation: ota1979,
      },
      {
        id: 'casualties-burns',
        name: 'Burns',
        formula:
          'm = exposed × mortality = 0.25 (0.1–0.5) × 0.5 (0.3–0.8) inside the third-degree radius, on the blast survivors',
        description:
          'Only the people in sight of the fireball receive the pulse — outdoors, at a window; an urban population indoors is mostly shielded — and the flash burns in Japan were sharply limited to exposed skin facing the explosion (Glasstone & Dolan §12.70). The exposed share and the burn mortality are project estimates. Inside the second-degree radius the exposed survivors count as injured. The hazards of an annulus act in sequence on the survivors of the earlier ones, so the combined mortality is 1 − Π(1 − m) and nobody dies twice.',
        citation: glasstoneDolan1977,
      },
      {
        id: 'casualties-horizon',
        name: 'The flash stops at the horizon',
        formula:
          'd = R⊕ · arccos(1 − R_f / R⊕); R_f = 0.002 · E^(1/3) (impact, Collins et al. 2005 eq. 32*), 2 · 100 · W^0.4 ft ≈ 61 · W^0.4 m (nuclear, Glasstone & Dolan 1977 §2.127)',
        description:
          "A fluence radius says how much heat would arrive with nothing in the way, and for an impact-scale fireball it runs around the planet — a 15 km stone has a third-degree radius of 27 000 km on a globe whose farthest point is 20 015 km away. Thermal radiation travels in straight lines, so burns and mass fire are cut where the fireball sets below the curve of the Earth: the fireball is a sphere about ground zero, and some of it stays in sight until the curve of the Earth between it and the observer, (1 − cos Δ)·R⊕, reaches its radius — Collins et al. 2005 eq. 37*, the cut the Earth Impact Effects Program makes. The program also dims the flash before the cut by the share of the fireball still in sight (eq. 36*), and since 16 September 2026 an impact’s burn and fire rings are dimmed the same way, so the largest of them fade out just short of the cut (rules 146 to 149). Until 15 September 2026 the cut was the horizon of the fireball’s top, R⊕ · arccos(R⊕ / (R⊕ + R_f)), 1.6 % short for a 200 km fireball (B-037), and the burn rings were not cut at all: Boltysh’s third-degree burns reached 936 km, past the 523 km where its fireball sets (B-038). The nuclear radius is the maximum Glasstone & Dolan give, twice the breakaway radius of 100·W^0.4 ft (§2.127), and the same fireball the globe draws. A 200 km fireball is seen to 1 600 km; Hiroshima's to 48 km, so no nuclear scenario is touched. Heat does reach the far side, from rock re-entering everywhere at once (the cascade says so at +30 min), but that is a diffuse bath where shelter decides and not a flash where sightlines do: it is described, drawn, and deliberately not converted into deaths — Goldin & Melosh 2009 argue the ejecta shield their own radiation enough that the global firestorm may fizzle.",
        citation: collins2005,
      },
      {
        id: 'casualties-firestorm',
        name: 'Mass fire',
        formula:
          'm = 0.3 (0.1–0.8) of the survivors inside the firestorm sustain radius, from +20 min to +6 h',
        description:
          'Where the thermal fluence can sustain a firestorm, a share of the blast and burn survivors dies in it. The 10 % and 30 % are project estimates; the high end follows Postol (1986), for whom the fire zone of a nuclear superfire is likely to be lethal to all unprotected people. The Hiroshima fire storm began about twenty minutes after the burst and subsided after some six hours (Glasstone & Dolan §7.71); the sweep dates the fire deaths in that window.',
        citation: postol1986,
      },
      {
        id: 'casualties-delayed',
        name: 'Later deaths',
        formula: 'delayed = 0.3 (0.1–0.6) × prompt injured, first day to first month',
        description:
          'OTA 1979 expects many of the injured to die for lack of adequate care — burn victims in the tens of thousands against 1 000 to 2 000 specialised burn beds. The 30 % (10–60 %) is a project estimate; after a chemical explosion, which leaves a city’s medicine standing, it is 2 % (0.5–6 %). The share is counted as dying within the first month, shown apart from the prompt toll in the panel and dated in the sweep so the counter keeps rising for weeks.',
        citation: ota1979,
      },
      {
        id: 'casualties-tsunami',
        name: 'The coastal toll of the wave',
        formula:
          'H = min(R, (d·γ)^(1/5)·A^(4/5)), d = 50 m, γ = 0.78; X = 0.06 · H^(4/3) / n², n = 0.03 (≤ 10 km); people = land density × X × coast; ν(h) = Φ(ln(h/θ)/β), h = H/2, θ = 8·2^f m (low 16·2^f, high 4 m), β = 0.8, f: 0 → 1 as the lead time (arrival − 10 min) goes from 30 min to 3 h',
        description:
          'For every coastal cell the wave map reaches — the local grid and, beyond it, the planet at 40 km — the water height at the shore carries the arriving amplitude over the last fifty metres of water with Green’s law until it breaks at McCowan’s index, capped by the plane-beach run-up; the strip it crosses is the Bretschneider & Wybro inundation distance Hills & Mader used for impact tsunamis (1.3 km for 9 m, the Tōhoku mean), the 2.5′ population tiles give the land density around the cell, and the share of the people in the strip who die follows the mean flow depth through a log-normal form like the one Koshimura fitted to Banda Aceh and Jonkman reviewed for floods; θ and β are the project’s reading of Banda Aceh and Tōhoku, not their fits. A warning takes ten minutes to issue, and none comes where a basin has no system. A coast with under half an hour of lead has no warning; from three hours on it has been warned and emptied, the thresholds doubling on a log scale in between, Banda Aceh the high end throughout. The toll is binned by arrival time and the counter rises as the wave lands, hours after the impact for a far coast. The run-up is a height, not an inundation map; the coast is where the rasters are coarsest; expect a factor of three either way.',
        citation: koshimura2009,
      },
      {
        id: 'casualties-sweep',
        name: 'When the deaths happen',
        formula:
          'deaths(t) = Σ deaths(band) · swept-area fraction at t; t(r) = shock integral | r / 3.5 km/s | r / 30 m/s | r / 400 m/s',
        description:
          'The counter in the bar sweeps the estimate with the hazard front: the Kinney–Graham shock integral for blast (the same energy the rings use), the crustal shear wave for shaking (PREM 3.2–3.9 km/s), 30 m/s for a pyroclastic current and 400 m/s for a lateral blast — a project upper value; the US National Park Service gives the Mount St Helens blast speeds up to 1 080 km/h (300 m/s). Deaths in a band accrue with the annulus area the front has swept, people being assumed evenly spread within the band as the estimate itself assumes. The animation compresses the physical time into five seconds on a log scale and prints the real elapsed time beside the figure; the first number comes from the shipped 0.125° raster and glides to the WorldPop figure when that lands.',
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
          'Mulberry32, a counter-based generator with 32 bits of state and a period of exactly 2³² (Ettinger 2017). Its author has since noted that it cannot produce about a third of all 32-bit values — harmless for a few hundred draws. Same seed ⇒ same percentiles, so an MC run is fully reproducible from the scenario URL.',
        citation: {
          authors: 'Ettinger, T.',
          year: 2017,
          title: 'Mulberry32',
          venue: 'GitHub Gist, gist.github.com/tommyettinger/46a874533244883189143505d203312c',
        },
      },
      {
        id: 'boxMuller',
        name: 'Normal / log-normal deviate',
        formula:
          'z = √(−2 ln u) · cos(2π v)   (Box–Muller, basic form; the sine partner is discarded)',
        description:
          'Box & Muller 1958 — two uniform deviates → one unit-normal deviate. Log-normal samples via exp(μ + σ · z) for the impactor diameter and density, the explosion yield, the eruption rate, the ejecta and lahar volumes; normal samples for velocity, magnitude, depth, Vs30 and height of burst. Meteoroid strength is not sampled.',
        citation: {
          authors: 'Box, G. E. P. & Muller, M. E.',
          year: 1958,
          title: 'A note on the generation of random normal deviates',
          venue: 'Annals of Mathematical Statistics 29 (2), 610–611',
          doi: '10.1214/aoms/1177706645',
        },
      },
      {
        id: 'sin-weighted-angle',
        name: 'Random-impact angle distribution',
        formula: 'p(θ) dθ = sin(2θ) dθ   ;   θ = arcsin(√u)',
        description:
          'The distribution of impact angles for impactors arriving from random directions, drawn by inverting its cumulative sin²θ. It peaks at 45°, the angle Collins et al. (2005) give as most likely after Shoemaker (1962), and under-weights both grazing and vertical incidence. In the Monte Carlo it replaces the angle the user chose.',
        citation: collins2005,
      },
      {
        id: 'toll-band',
        name: 'The death toll\u2019s 5\u201395\u2009% band',
        formula:
          'deaths_low = toll(draw at P5),  deaths_high = toll(draw at P95),  N = 200 ;  shaking: m × exp(N(0, G_country))',
        description:
          'The pair beside the casualty figure is not the gentlest and harshest settings of the vulnerability table \u2014 that pair spans three to five orders of magnitude and contains almost any number. It is the 5th and 95th percentile of 200 realisations of the same scenario, drawn from the input scatter above and, for shaking, dominated by the ground-motion residual \u03c3_lnY = 0.6 that separates a median prediction from one draw of the earth \u2014 the total Boore et al. 2014 give for PGA at M \u2265 5.5 (0.5 until 14 September 2026). Each end is a whole realisation rather than a percentile taken column by column, so the per-band rows total to the figure above them. For shaking the fatality curve\u2019s own scatter is drawn too: each realisation scales its mortality by exp(N(0, G)), G being the country\u2019s gnormvalue in USGS PAGER\u2019s table, which PAGER\u2019s loss module uses as the standard deviation of ln(deaths) about the expected toll (1.0 for New Zealand and the United States, 1.46 for Japan, 2.5 for Nepal and Iran; the table\u2019s median, 1.73, where no country is found). G was measured on ShakeMap intensities, so it overlaps with the ground-motion residual by an amount not separated here. Held fixed, and so not in the band: the population (the census has its own error) and the blast and pyroclastic death rates, which publish no scatter. An impact\u2019s angle is redrawn from the distribution below, and a landslide keeps its table band. The procedure is the project\u2019s own. The population inside every sampled radius is read off a curve measured at each damage ring plus two footprints bracketing the radii the draws reach, at one density per annulus; what that interpolation costs is measured against the raster in the calibration suite and is under 1.4\u00d7 on every comparable row.',
        citation: boore2014,
      },
      {
        id: 'percentile-band',
        name: 'Unweighted sample percentiles',
        formula: 'P_n = sort(samples)[⌊n · N / 100⌋]',
        description:
          'Simple order-statistic percentile estimator. We render P10/P50/P90 rather than mean±σ because the underlying distributions are often log-normal (asymmetric band is more honest than ±σ). Koonin’s book is background on Monte Carlo methods, not the source of this estimator.',
        citation: {
          authors: 'Koonin, S. E.',
          year: 1986,
          title: 'Computational Physics (chapter "Monte Carlo Methods")',
          venue: 'Benjamin/Cummings, Menlo Park, CA',
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
  collins2017,
  chyba1993,
  popova2013,
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
  takazawa2023,
  nordyke1962,
  needham2018,
  longmire1978,
  hanksKanamori1979,
  wellsCoppersmith1994,
  strasser2010,
  joynerBoore1981,
  boore2014,
  abrahamson2016,
  parker2022,
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
  herrick1997,
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
  hayashiSelf1992,
  iverson1998,
  pfeiffer2005,
  crandellHoblitt1986,
  kajiura1963,
  jma2013,
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
    note: 'Morgan et al. 2016 — peak-ring impact crater, K-Pg extinction',
  },
  { event: 'Popigai', year: -35_700_000, note: 'Tagle & Hecht 2006 — 100 km Siberian crater' },
  {
    event: 'Boltysh',
    year: -65_400_000,
    note: 'Kelley & Gurov 2002 — 24 km; about 0.65 Myr after Chicxulub (Pickersgill et al. 2021)',
  },
  { event: 'Meteor Crater', year: -50_000, note: 'Kring 2007 — iron impactor, 1.2 km crater' },
  { event: 'Tunguska', year: 1908, note: 'Boslough & Crawford 2008 — low-altitude airburst' },
  {
    event: 'Sikhote-Alin',
    year: 1947,
    note: 'Krinov 1966 — largest iron-meteorite shower on instrumental record',
  },
  {
    event: 'Chelyabinsk',
    year: 2013,
    note: 'Popova et al. 2013 / Brown et al. 2013 — burst at 27 km, 400–600 kt, window damage modelled to 120 km',
  },
  // ─── Explosions ─────────────────────────────────────────────────
  {
    event: 'Halifax',
    year: 1917,
    note: 'Ruffman & Howell 1994 — ≈ 2.9 kt, the SS Mont-Blanc’s cargo',
  },
  {
    event: 'Hiroshima',
    year: 1945,
    note: 'Airburst ≈ 600 m, 16 kt in the DS02 dosimetry (Little Boy)',
  },
  { event: 'Nagasaki', year: 1945, note: 'Airburst 503 m, 21 kt (Fat Man)' },
  { event: 'Texas City', year: 1947, note: 'SS Grandcamp ammonium-nitrate detonation' },
  {
    event: 'Ivy Mike',
    year: 1952,
    note: 'DOE/NV-209 — first thermonuclear test, 10.4 Mt, vapourised Elugelab',
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
    note: 'Baptista & Miranda 2009 — Mw 8.5 ± 0.3 off SW Iberia, transatlantic tsunami',
  },
  {
    event: 'Valdivia',
    year: 1960,
    note: 'Kanamori 1977 — Mw 9.5, largest instrumentally recorded',
  },
  { event: 'Great Alaska', year: 1964, note: 'Plafker 1965; Kanamori 1977 — Mw 9.2 megathrust' },
  {
    event: 'Northridge',
    year: 1994,
    note: 'Blind thrust Mw 6.7; PGA ≈ 1 g near the fault, 1.82 g at Tarzana',
  },
  { event: 'Kokoxili (Kunlun)', year: 2001, note: 'Strike-slip Mw 7.8 with ~400 km rupture' },
  {
    event: 'Sumatra–Andaman',
    year: 2004,
    note: 'Lay et al. 2005 — Mw 9.1–9.3 Sunda megathrust, over 283 000 dead',
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
  { event: 'Etna', year: 1669, note: 'Branca 2013 — 4-month flank eruption, lava reached Catania' },
  { event: 'Tambora', year: 1815, note: "VEI 7 'year without a summer' climate event" },
  {
    event: 'Krakatau',
    year: 1883,
    note: 'Sunda Strait VEI 6 paroxysm and tsunami — source debated; Maeno & Imamura 2011 favour pyroclastic flows entering the sea',
  },
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
    note: 'Gudmundsson 2012 — ice-capped summit eruption, grounded European aviation',
  },
  {
    event: 'Anak Krakatau',
    year: 2018,
    note: 'Grilli 2019 — flank-collapse tsunami, ≈ 0.27 km³ block',
  },
  {
    event: 'Hunga Tonga',
    year: 2022,
    note: 'Proud et al. 2022 — 57 km plume into the mesosphere, global tsunami signal',
  },
  // ─── Landslides ─────────────────────────────────────────────────
  {
    event: 'Storegga slide',
    year: -8200,
    note: 'Norwegian continental margin, ≈ 2 400–3 200 km³, North-Atlantic tsunami',
  },
  {
    event: 'Lituya Bay',
    year: 1958,
    note: 'Miller 1960 — sub-aerial rockfall into a fjord, 524 m run-up',
  },
  {
    event: 'Vaiont reservoir',
    year: 1963,
    note: 'Genevois & Ghirotti 2005 — 270 Mm³ rockslide, wave crested 140 m above the dam',
  },
  {
    event: 'Elm rockslide',
    year: 1881,
    note: 'Heim 1932; Hsü 1975 — founding case for long-runout sturzstrom mobility',
  },
];
