🇮🇹 **Italiano** · [🇬🇧 English](README.en.md)

# EDU-GIT · Git Internals Playground

**▶ Provalo online: <https://manzolo.github.io/GitSimulator/?lang=it>**

## Cos'è

Un percorso didattico interattivo, cugino di
[learngitbranching.js.org](https://learngitbranching.js.org) ma con l'angolazione
**opposta e complementare**. learngitbranching insegna benissimo il *grafo dei
commit* e i comandi (branch, merge, rebase). EDU-GIT apre invece il cofano e
mostra **l'object store indirizzato dal contenuto** — la "memoria" del
repository, `.git/objects`.

Due riquadri affiancati: a sinistra il **working tree** (i file che modifichi), a
destra l'**object store**, una griglia di oggetti colorati per tipo
(**blob** = giallo, **tree** = verde, **commit** = rosso), ognuno col suo hash
abbreviato. Quando compi un'azione — scrivi un file, fai staging, committi — il
motore anima la **nascita degli oggetti**: il contenuto viene hashato, l'oggetto
appare e si illumina, gli archi si disegnano (tree→blob, commit→tree,
commit→parent), i ref scivolano sul nuovo commit.

Il messaggio chiave: **Git è un file system indirizzato dal contenuto; i comandi
sono solo zucchero sopra.**

Fa parte della collana **EDU-\*** di simulatori didattici (vanilla HTML/CSS/JS,
moduli ES, zero dipendenze, zero build):

- [EDU-16 · ASM Playground](https://github.com/manzolo/SimulatoreAssembler) — dal transistor al compilatore
- [EDU-NET · TCP/IP Playground](https://github.com/manzolo/SimulatoreRete) — ARP, routing, DNS, TCP
- [EDU-REGEX · Regex Playground](https://github.com/manzolo/SimulatoreRegEx) — un motore regex disegnato come automa
- **EDU-GIT** — questo progetto

## L'elemento firma: la deduplicazione

Poiché un oggetto è nominato dall'**hash del suo contenuto**, due file con gli
stessi byte puntano allo **stesso identico blob**. Dai a due file lo stesso
contenuto e guarda il secondo staging *riutilizzare* il blob invece di crearne
uno nuovo — l'arco converge, l'oggetto pulsa. È l'intuizione che spiazza tutti,
ed è la copertina di questo progetto.

Il secondo momento "aha": la propagazione **Merkle**. Cambia un byte in un file e
il suo hash di blob cambia → cambia il tree che lo contiene → cambia il tree
radice → cambia il commit. La manomissione è visibile a cascata.

## Gli hash sono veri

Il core **non usa Git** e non ha dipendenze: reimplementa il modello a oggetti da
zero. Ma calcola lo **SHA-1 reale** sulla preimmagine esatta di Git
(`<tipo> <lunghezza>\0<payload>`), quindi l'hash breve di un blob **coincide con
`git hash-object`** nel tuo terminale. Provalo:

```sh
printf 'hello git\n' | git hash-object --stdin
# ...lo stesso hash che vedi nell'object store del livello 1.
```

## Come funziona la verifica (anti-trucco)

Ogni livello dà una specifica sullo **stato dell'object store**, non sui comandi
(«porta il repo in uno stato con due commit, il secondo condivide il blob di
README perché non è cambiato»). La verifica ispeziona il **grafo di oggetti
risultante**: quali blob/tree/commit esistono, chi punta a chi, quali ref, cosa è
raggiungibile da HEAD, e i fatti di deduplicazione.

L'anti-trucco è naturale: le tue azioni vengono ri-eseguite su **più set di
contenuti** — quelli mostrati *e* altri nascosti che rilegano i token a byte
diversi. Una soluzione strutturalmente corretta vale per qualsiasi byte; una che
si affida ai contenuti mostrati fallisce su quelli nascosti.

## Curriculum

14 livelli guidati, dal primo blob alla ricostruzione a mano di una storia con
branch e merge:

1. **Un file, un blob** — l'hash è il contenuto
2. **Due file, un blob** — la deduplicazione
3. **Il tree** — lo snapshot di una cartella
4. **Tree annidati** — le sottocartelle
5. **Il primo commit** — commit → tree → blob
6. **Il secondo commit condivide** — i blob invariati
7. **HEAD e i ref** — puntatori mobili su oggetti immutabili
8. **Un branch è un puntatore** — due ref sullo stesso commit
9. **Un merge ha due parent**
10. **L'index** — lo staging come tree intermedio
11. **Oggetti persi e il garbage collector**
12. **Merkle** — la cascata di hash
13. **Perché il repo non esplode** — condivisione e packfile
14. **Capstone** — branch e merge da zero

Più una **sandbox** libera, bilingue IT/EN, con progressi e lingua salvati in
`localStorage` e routing con hash `#id-livello`.

## Avvio locale

I moduli ES non funzionano da `file://`, serve un server statico qualsiasi:

```sh
python3 -m http.server 8000
# poi apri http://localhost:8000
```

## Sviluppo e test

```sh
npm test          # node --test: SHA-1 e hash git-esatti, repo, livelli, anti-trucco, determinismo
npm run e2e       # Chrome headless via CDP (solo built-in Node), pilota la UI vera
```

I test verificano che gli hash di blob/tree/commit **coincidano con Git**, che
ogni livello abbia una **soluzione di riferimento** che lo risolve su tutti i set
di contenuti, che un tentativo cablato sui casi visibili venga **respinto** da
uno nascosto, e che due run producano trace e oggetti **identici** (determinismo,
niente `Date.now`/`Math.random` nel core).

**Deploy**: tutto sta nella root con percorsi relativi e un file `.nojekyll`;
GitHub Pages da branch `main`, cartella `/ (root)`. Nessuna GitHub Action,
nessun build.

## Licenza

MIT. Fatto per imparare: se trovi un errore, apri pure una issue.
