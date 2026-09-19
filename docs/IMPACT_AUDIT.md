# Audit degli impatti astronomici — 19 settembre 2026

Revisione di tutta la catena degli impatti: ogni formula, l'ordine in cui è
usata, e come il risultato arriva sul globo. Trentuno grandezze pubblicate,
undici moduli, cinque scenari sondati sul renderer vero.

Il metodo: per ogni grandezza, (a) la legge dichiarata contro la fonte,
(b) l'ingresso che riceve e il momento in cui è chiamata, (c) il confronto già
fatto contro l'**Earth Impact Effects Program** di Collins, Melosh & Marcus —
il programma del campo — dove esiste, (d) la resa sul globo.

---

## 1. Le formule: cosa è verificato contro il programma del campo

Questa è la parte forte. Nove famiglie su undici sono state eseguite contro
l'EIEP sulle stesse righe, e i verdetti sono nei file dei risultati:

| Grandezza                              | Confronto                               | Esito                                     |
| -------------------------------------- | --------------------------------------- | ----------------------------------------- |
| Ingresso in atmosfera (Eq. 8–20)       | 12 corpi, 60 punti al suolo, 4 airburst | **0 discordanze**                         |
| Quota di frammentazione                | 188 righe                               | 1,0005× · σ_ln 0,003 · 98,4 % entro l'1 % |
| Quota di scoppio                       | 80 righe                                | 1,0008× · σ_ln 0,004                      |
| Energia al suolo, velocità al suolo    | 108 righe                               | 1,0005× e 1,0008×                         |
| Cratere transitorio (Eq. 21\*)         | 81 righe                                | 0,9995× · σ_ln 0,014                      |
| Cratere finale (Eq. 22\*/27\*)         | 81 righe                                | 0,9953× · σ_ln 0,013                      |
| Raggio della palla di fuoco (Eq. 32\*) | 108 righe                               | 1,0002× · 100 % entro l'1 %               |
| Termico (Eq. 35, 36\*, 37\*)           | 16 corpi                                | **16 su 16 d'accordo**                    |
| Sismico (Eq. 40\*)                     | 16 corpi, 45 anelli                     | **0 scostamenti**                         |
| Blast al suolo                         | 12 corpi, 60 sovrapressioni             | **60 su 60**, peggiore ×1,0019            |
| Coltre di ejecta (Eq. 47\*)            | 405 righe                               | 0,997× · **100 % entro l'1 %**            |
| Tsunami da impatto                     | 13 corpi, 49 anelli                     | **0 scostamenti**                         |

Le equazioni che ho riletto riga per riga contro il paper — Eq. 1, 8, 9, 11,
12, 16, 17, 18, 21\*, 22\*, 27\*, 23\*–26\*, 28\*, 32\*, 35, 36\*, 37\*, 40\*,
47\* — corrispondono. Le convenzioni sono giuste: l'angolo è dall'orizzonte
(90° = verticale) in Collins e nel codice; la ramificazione semplice/complesso
usa lo stesso test del paper (D_tc > 2,56 km); Eq. 27\* ha esponenti che
sommano a uno, quindi vale in metri come stampata per i chilometri.

Tre scelte sono del progetto e sono dichiarate come tali nel codice: il ramo
del **campo di dispersione di ferro** (Sikhote-Alin, fattore 0,15 sul cratere
singolo — dà 26,7 m contro i 26 m osservati), la **partizione oceano/fondale**
`f^(1/3,4)` (l'esponente è quello canonico dello scaling in regime
gravitazionale), e l'**asimmetria obliqua** del disegno.

---

## 2. Quello che ho trovato

### 2.1 La tempesta di fuoco si sostiene dove niente si accende

`FLAMMABLE_IGNITION_FLUENCE` = 4,19 × 10⁵ J/m² (10 cal/cm²) e
`URBAN_FIRESTORM_FLUENCE` = 2,51 × 10⁵ J/m² (6 cal/cm²). Soglia più bassa
significa raggio più grande, quindi **il raggio della tempesta di fuoco supera
quello di accensione a ogni scala**:

| caso        | accensione |   tempesta |
| ----------- | ---------: | ---------: |
| ferro 50 m  |     8,5 km |    11,0 km |
| stony 300 m |    86,8 km |   106,0 km |
| stony 1 km  |   321,4 km |   345,4 km |
| Chicxulub   | 1 303,0 km | 1 308,1 km |

Fra i due raggi c'è una corona dove il modello dichiara una tempesta di fuoco
autosostenuta e insieme che nulla prende fuoco. Una tempesta di fuoco richiede
_più_ energia dell'accensione, non meno: la regione che si sostiene deve essere
un sottoinsieme di quella che si accende. Entrambe le costanti sono dichiarate
«valori del progetto» e nessuna delle due viene da Glasstone & Dolan, che
definiscono una tempesta di fuoco per combustibile, densità di incendi, vento e
area — non per un'esposizione. Le due aree pubblicate (`ignitionArea`,
`sustainArea`) ereditano l'inversione.

**Non l'ho corretta**: cambiare una costante è un cambio di modello e vuole
regole pre-registrate.

### 2.2 L'orizzonte del lampo è quello di una palla di fuoco a terra, applicato a scoppi in quota

Il taglio del lampo è `thermalHorizonRadius(impactFireballRadius(E_totale))` —
l'orizzonte di una palla di fuoco appoggiata al suolo. Per un airburst la
sorgente è chilometri più in alto e si vede molto più lontano:

| caso             | quota di scoppio | orizzonte usato | orizzonte vero della quota | rapporto |
| ---------------- | ---------------: | --------------: | -------------------------: | -------: |
| Chelyabinsk      |          31,4 km |         57,3 km |                   631,4 km |     0,09 |
| Tunguska         |           9,3 km |        103,5 km |                   343,6 km |     0,30 |
| stony 80 m a 30° |           5,7 km |        117,7 km |                   269,7 km |     0,44 |

**Latente, non attivo**: in nessuno dei casi provati il taglio morde, perché
gli anelli di ustione di un airburst sono molto più corti. Ma è una
disuguaglianza costruita nel modello, e il verso dell'errore è
_sottostimare_. Va notato anche che la frazione visibile della palla di fuoco
usata dentro la fluenza al suolo si riferisce all'energia _al suolo_, mentre il
taglio usa l'energia _totale_: due palle di fuoco per lo stesso evento, diverse
di un fattore (1/gf)^⅓.

### 2.3 Il bilancio energetico non è chiuso, ed è quello del riferimento

Il cratere prende `E·gf·f_fondale`, le polveri lo stesso, la pioggia acida e le
soglie termiche/blast prendono `E·gf` intero, lo tsunami prende `f_acqua`. Per
un impatto oceanico la stessa energia che scava la cavità d'acqua disegna anche
il lampo e l'onda d'urto. **È la contabilità del programma di riferimento**, non
un'invenzione: η = 3 × 10⁻³ e l'accoppiamento del blast sono frazioni piccole e
indipendenti, non un partizionamento. Ma non è un bilancio chiuso, e va detto.

### 2.4 Due documenti dicevano il falso sul modello in vigore

`groundBlastRules.ts` chiudeva con «`project` resta il default e BM-21 resta
aperto». È vero per le regole 138–140, che rifiutarono il blast del programma
**sulle equazioni d'ingresso del paper**. Le regole 141–144, lo stesso giorno,
lo hanno riprovato **sulle equazioni d'ingresso del programma**: 60 su 60,
peggiore ×1,0019, adottato in `9cd0935`, BM-21 chiuso. Il file non lo diceva, e
stamattina la contract dell'anello dei 5 psi è stata scritta da quel testo:
diceva al lettore del globo che Kinney & Graham è il modello in vigore per un
impatto, quando non lo è. **Entrambi corretti.**

Sono scaduti anche due righe del rapporto benchmark: **BM-06** (profondità del
cratere complesso ×1,31) è chiusa da B-040, e **BM-19** (il cancello dell'acqua
aperta che lasciava in piedi `firestorm.sustainArea`) è chiusa da B-031.

---

## 3. La mappa: modello ↔ entità ↔ etichetta ↔ legenda

Sondati cinque scenari sul renderer vero, leggendo le entità che Cesium riceve.

**Quello che è coerente.** Per ogni scenario, ogni grandezza sopra zero ha la
sua entità; ogni etichetta sul globo riporta **esattamente** il numero del
modello; la legenda riporta **esattamente** gli stessi numeri delle etichette;
gli anelli di raggio zero non compaiono né sul globo né in legenda (Chelyabinsk
non elenca tre righe di blast a zero); l'ordine sullo schermo segue l'ordine dei
raggi; il faro di quota riporta la quota di scoppio giusta («31 km», «9.3 km»);
i raggi planetari sono tagliati all'antipode e segnalati oltre il 90 %.

### 3.1 L'asimmetria da impatto obliquo è applicata anche agli airburst

Chelyabinsk scoppia a **31,4 km di quota** e i suoi due anelli di ustione sono
disegnati con **b/a = 0,675** — un'ellisse schiacciata del 33 %. Ma una sorgente
a 31 km che irraggia isotropicamente illumina a terra un **cerchio**: non c'è
traccia al suolo da allungare. L'inviluppo applicato è quello di Pierazzo &
Melosh, che descrive la sorte del _proiettile_ in un cratere obliquo. Un
airburst non scava.

E il caso peggiore è sistematico: l'inviluppo è più forte agli angoli bassi, che
sono esattamente gli angoli a cui un corpo finisce in airburst.

### 3.2 Il cratere è disegnato con sin^⅓θ due volte, e la didascalia sta al bordo esterno

`craterAsymmetry` dice nel proprio commento di tenere il semiasse maggiore «al
raggio nominale dell'impatto verticale». Ma il raggio nominale che riceve è
`D_fr/2`, e **D_fr contiene già sin^⅓θ** (Eq. 21). Il rapporto b/a che esce è
quello voluto — sin^⅓θ, 0,891 a 45° — perché entrambi gli assi scalano sullo
stesso nominale. Quello che non torna è dove cade la didascalia: per ogni altro
anello il numero scritto sta **in mezzo** ai due semiassi (maggiore ×1,088,
minore ×0,879), per il cratere sta **sul massimo** (maggiore ×1,000, minore
×0,891). Un lettore che misura il cratere nella direzione della traccia legge
il numero scritto; in ogni altra direzione legge meno, fino al 56 % a 5°.

### 3.3 Gli anelli sono disegnati più larghi del numero che portano

Chicxulub, semiasse maggiore contro raggio in didascalia:

| anello       |    modello | disegnato (maggiore) | rapporto |
| ------------ | ---------: | -------------------: | -------: |
| ustione III° | 1 305,4 km |           1 458,3 km |    1,117 |
| 5 psi        | 1 764,5 km |           1 919,5 km |    1,088 |
| 0,5 psi      | 7 969,0 km |           8 669,2 km |    1,088 |

La didascalia resta compresa fra i due semiassi — che è la regola che l'audit
del globo verifica — ma chi misura sulla mappa nella direzione più lunga trova
**il 9–12 % in più** di quanto c'è scritto.

### 3.4 La coltre di ejecta arriva più in là di quanto dichiara

Per uno stony di 300 m a 30°, la coltre è un'ellisse di semiasse 102,2 km con il
centro spostato **9,0 km** sottovento alla traccia: il bordo lontano è a
**111,2 km** dal punto d'impatto, la didascalia dice **90,1 km** (+23 %). E
sopravvento l'ellisse arriva comunque a 93 km, dove la «farfalla» fisica
dovrebbe avere un settore vuoto: lo spostamento c'è, il vuoto no.

### 3.5 La riga «onda d'urto» prende l'anello più esterno qualunque esso sia

Per Chelyabinsk, che non produce alcun blast al suolo, la legenda riporta
«Shock front · travelling **1,7 km**» — il raggio dell'ustione di secondo grado,
l'unico anello rimasto. Una riga d'onda d'urto che riporta la misura di un
lampo.

### 3.6 «Crater rim 433 m» è un raggio

Tutte le voci sono raggi, e va bene. Ma i crateri, in letteratura e nel senso
comune, si citano per **diametro**: Meteor Crater «è 1,2 km». Un lettore che
legge «Crater rim 433 m» capirà 433 m di cratere, dove il modello dice 867 m di
diametro. È l'unica voce con un'aspettativa forte in senso contrario.

---

## 4. Cosa resta senza un riferimento

Nessun confronto contro uno strumento del campo, e nessuno è dichiarato
altrimenti: i raggi di ustione del lampo d'ingresso (fluenze del progetto, per
scelta dichiarata: le curve di Glasstone sono l'impulso di una palla di fuoco
nucleare), il raggio di liquefazione (Youd & Idriss invertito su Joyner–Boore
1981, estrapolato a M 9,87 dove la legge è tarata fino a 7,7 — per Chicxulub dà
185,9 km), le polveri stratosferiche, la massa di pioggia acida, il livello
climatico, la tempesta di fuoco, e gli inviluppi di asimmetria.

---

## 5. In ordine di importanza

1. **L'inversione della tempesta di fuoco** (§2.1) — incoerenza interna del
   modello, a ogni scala. Vuole un round con regole.
2. **L'asimmetria obliqua sugli airburst** (§3.1) — un'ellisse al 67 % dove la
   fisica dà un cerchio, e proprio sui casi più probabili.
3. **La didascalia del cratere al bordo esterno** (§3.2) e **il raggio chiamato
   come un diametro** (§3.6) — due correzioni di presentazione, piccole.
4. **La coltre di ejecta oltre il numero dichiarato** (§3.4).
5. **L'orizzonte del lampo per un airburst** (§2.2) — latente.
6. **La riga dell'onda d'urto** (§3.5).

I punti 1 e 2 cambiano numeri o forme che un visitatore legge, quindi vogliono
il protocollo: regole scritte e spinte prima della misura. I punti 3, 4 e 6 sono
presentazione e si possono fare subito.
