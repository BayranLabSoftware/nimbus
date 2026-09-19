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

**Corretta il 19 settembre 2026**, con le regole 227-234 di
`validation/massFireRules.ts`, scritte e spinte (6fdf58b) prima che il
candidato esistesse. Entrambe le soglie ora si leggono dalla Tabella 7.40 del
libro alla resa dello scenario — carta di giornale sminuzzata (4, 6, 11
cal/cm²) per l'accensione, compensato di abete douglas (9, 16, 20, «flaming
during exposure») per la tempesta di fuoco — e il §7.58 aggiunge il cancello
che mancava: sotto mezzo miglio quadrato di terreno in fiamme non c'è tempesta
di fuoco, cioè sotto circa 2 kt. L'ordinamento adesso regge per costruzione, in
tutte e due le famiglie.

A decidere è stato il terreno bruciato di Hiroshima, §7.62: 4,4 miglia
quadrate, raggio equivalente 1 904 m. Il modello ne disegna 2 020 — **1,06×** —
dentro la banda che la nota della tabella stessa implica. Prima ne disegnava
2 640, e il fuoco che la alimenta a 2 040, cioè dentro.

Il conto: il bilancio di Hiroshima scende da 109 102 a 93 466 su un record di
105 000, banda da 77 893 a 119 850, che il record lo contiene ancora. Il
rapporto passa da 1,04× a 0,89×, e la riga si aspetta un eccesso (il raster
conta 1,2 milioni di vivi dove la città ne aveva 350 000): la mortalità per
testa dentro il fuoco è quindi bassa più o meno quanto prima era alta. Non è
stata ritoccata — le regole 5, 6 e 234 lo vietano nello stesso round — ed è la
prossima cosa da guardare.

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

### 3.2 Il cratere è disegnato con sin^⅓θ due volte, e la didascalia sta al bordo esterno — **corretto**

`craterAsymmetry` dice nel proprio commento di tenere il semiasse maggiore «al
raggio nominale dell'impatto verticale». Ma il raggio nominale che riceve è
`D_fr/2`, e **D_fr contiene già sin^⅓θ** (Eq. 21). Il rapporto b/a che esce è
quello voluto — sin^⅓θ, 0,891 a 45° — perché entrambi gli assi scalano sullo
stesso nominale. Quello che non torna è dove cade la didascalia: per ogni altro
anello il numero scritto sta **in mezzo** ai due semiassi (maggiore ×1,088,
minore ×0,879), per il cratere sta **sul massimo** (maggiore ×1,000, minore
×0,891). Un lettore che misura il cratere nella direzione della traccia legge
il numero scritto; in ogni altra direzione legge meno, fino al 56 % a 5°.

### 3.3 Gli anelli sono disegnati più larghi del numero che portano — **corretto**

Chicxulub, semiasse maggiore contro raggio in didascalia:

| anello       |    modello | disegnato (maggiore) | rapporto |
| ------------ | ---------: | -------------------: | -------: |
| ustione III° | 1 305,4 km |           1 458,3 km |    1,117 |
| 5 psi        | 1 764,5 km |           1 919,5 km |    1,088 |
| 0,5 psi      | 7 969,0 km |           8 669,2 km |    1,088 |

La didascalia resta compresa fra i due semiassi — che è la regola che l'audit
del globo verifica — ma chi misura sulla mappa nella direzione più lunga trova
**il 9–12 % in più** di quanto c'è scritto.

### 3.4 La coltre di ejecta arriva più in là di quanto dichiara — **corretto in parte**

Per uno stony di 300 m a 30°, la coltre è un'ellisse di semiasse 102,2 km con il
centro spostato **9,0 km** sottovento alla traccia: il bordo lontano è a
**111,2 km** dal punto d'impatto, la didascalia dice **90,1 km** (+23 %). E
sopravvento l'ellisse arriva comunque a 93 km, dove la «farfalla» fisica
dovrebbe avere un settore vuoto: lo spostamento c'è, il vuoto no.

### 3.5 La riga «onda d'urto» prende l'anello più esterno qualunque esso sia — **corretto**

Per Chelyabinsk, che non produce alcun blast al suolo, la legenda riporta
«Shock front · travelling **1,7 km**» — il raggio dell'ustione di secondo grado,
l'unico anello rimasto. Una riga d'onda d'urto che riporta la misura di un
lampo.

### 3.6 «Crater rim 433 m» è un raggio — **corretto**

Tutte le voci sono raggi, e va bene. Ma i crateri, in letteratura e nel senso
comune, si citano per **diametro**: Meteor Crater «è 1,2 km». Un lettore che
legge «Crater rim 433 m» capirà 433 m di cratere, dove il modello dice 867 m di
diametro. È l'unica voce con un'aspettativa forte in senso contrario.

---

## 3bis. Cosa è stato corretto, e come si vede che è corretto

Il 19 settembre, subito dopo questo audit. Nessun numero del modello è cambiato:
sono cambiati il disegno e le parole.

**B-059 — la forma copre il terreno che il numero dichiara.** Un solo raggio va
alla didascalia, alla legenda, al tooltip e al conteggio dei morti, e il
conteggio prende le persone dentro un **cerchio** di quel raggio. Il renderer al
suo posto disegna un'ellisse. Ora i due moltiplicatori sono distribuiti attorno
a uno (`equalArea`), così `a·b = r²`: l'inviluppo b/a resta esattamente quello
dei papers, e il raggio della didascalia diventa la media geometrica dei
semiassi. Misurato sul renderer vero, su tre scenari e sette anelli ciascuno:

|                                  | prima                                                 | dopo                   |
| -------------------------------- | ----------------------------------------------------- | ---------------------- |
| area disegnata / πr²             | 0,891 (cratere) · 0,94–0,96 (anelli) · 1,039 (coltre) | **1,0000 ovunque**     |
| la didascalia sta fra i semiassi | no per il cratere (stava sul massimo)                 | **sì per ogni anello** |

La coltre di ejecta non seguiva, e il fatto che non seguisse è ciò che ha rivelato
il difetto sotto: il renderer **ricalcolava** i suoi fattori `(1 + 0,4 f)` e
`(1 − 0,25 f)` invece di leggere la coppia che la fisica pubblica. Una
espressione in due posti — è B-053 — rimasta muta finché una delle due non si è
mossa. Ora legge `damageAsymmetry.ejectaBlanket` come ogni altro anello.

**B-060 — un fronte d'urto è lungo quanto il proprio blast.** La riga prendeva
l'anello più esterno qualunque fosse. Chelyabinsk ora non ha più la riga: le sue
sovrapressioni al suolo sono tutte e tre zero, e una riga di legenda è la
promessa che qualcosa è disegnato. Per il ferro da 50 m la riga passa da 12,7 km
(la coltre di ejecta) a **8,4 km**, che è il suo anello da 0,5 psi.

**Il raggio chiamato raggio.** «Crater rim» → «Crater radius», «Cratere» →
«Raggio del cratere», e il tooltip dice in entrambe le lingue che il numero è il
raggio e che il cratere misura il doppio da un bordo all'altro.

**E il passo piatto del centro** (§3.4 e B-057): `computeAsymmetricGeometry`
sposta il centro di ogni anello di un impatto obliquo fino a un quinto del suo
raggio — per Chicxulub a 30° sono **799 km** — e lo faceva su 111 km/grado
piatti, mettendolo a **45,0 km** da dove lo mette la sfera. Ora passa per
`projectAlongAzimuth`.

Quello che **non** è stato corretto di §3.4: la coltre resta un'ellisse spostata,
non una farfalla con il settore vuoto sopravvento. Disegnare il vuoto è un
cambio di forma, non di convenzione, e vuole il suo round.

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

1. ~~L'inversione della tempesta di fuoco~~ (§2.1) — **fatto**, regole 227-234,
   B-061 e B-062: le soglie vengono dalla Tabella 7.40, il §7.58 mette il
   cancello dell'area, Hiroshima legge 1,06× il terreno che bruciò davvero.
2. ~~L'asimmetria obliqua sugli airburst~~ (§3.1) — **fatto**, regole 235-240 e
   B-067: dove nulla arriva a terra gli anelli sono cerchi attorno al punto
   sotto lo scoppio, e l'inviluppo resta dove un corpo il suolo lo tocca.
   Nessun raggio e nessun morto si è mosso: il report si rigenera identico.
3. ~~La didascalia del cratere al bordo esterno~~ (§3.2) — **fatto**, B-059.
4. ~~Gli anelli più larghi del numero~~ (§3.3) — **fatto**, B-059.
5. ~~La coltre oltre il numero~~ (§3.4) — **fatto in parte**: area e centro sì,
   il settore vuoto sopravvento no.
6. ~~La riga dell'onda d'urto~~ (§3.5) — **fatto**, B-060.
7. ~~Il raggio chiamato come un diametro~~ (§3.6) — **fatto**.
8. **L'orizzonte del lampo per un airburst** (§2.2) — latente, non morde.

Nessuno dei punti dell'elenco resta aperto. Quello che resta è più grande di
tutti loro e non è un difetto: **la forma vera di un airburst non è un
cerchio.** Tunguska stese 2 200 km² di foresta a farfalla; la strada è la
sorgente cilindrica di Collins et al. (2017) sulla deposizione del modello a
frittella, e vuole un round suo. La direzione, che era la prima domanda di quel
round, è **risolta**: Collins et al. (2017) la danno due volte citando Popova
et al. (2013) — «semimajor axes **perpendicular** to the trajectory» e
«~10 000 km² elongated in the direction **transverse** to the fireball
trajectory» — e ne danno il motivo fisico, l'interferenza distruttiva fra i
contributi della scia lungo la traccia. L'ellisse che avevamo era ruotata di
novanta gradi rispetto a quella misurata (B-072). Disegnare quella vera vuole
la sorgente cilindrica sulla deposizione del modello a frittella; disegnare
un'ellisse trasversale tarata sull'unico evento che c'è sarebbe lo stesso
errore nell'altro verso, e non si fa.

Il round del fuoco ha anche chiuso due silenzi della mappa che non erano
nell'elenco perché l'audit guardava gli impatti e non il globo: la vista
ravvicinata disegnava una sola zona di fuoco, al raggio di accensione, e la
chiamava tempesta di fuoco (B-063); e il globo non disegnava fuoco affatto,
mentre il modello vittime contava come presi dal fuoco tutti quelli dentro la
tempesta (B-064). Adesso gli anelli sono due, in tutte e due le viste, con
legenda, tooltip e contratto visivo.
