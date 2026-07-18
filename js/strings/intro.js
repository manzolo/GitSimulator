// The beginner's primer — "what you need to know BEFORE level 1", assuming
// zero prior knowledge of Git. Shown automatically on the first visit and
// always available from the header. One {it, en} object, same tr() convention
// as the level content.

export const INTRO = {
  it: `
<p>Benvenuto! Questa pagina spiega <b>da zero</b> le idee che incontrerai nei
livelli. Non serve saper usare Git: cinque minuti di lettura e sei pronto.
Puoi riaprirla quando vuoi dal bottone <b>Basi</b> in alto.</p>

<h3>Che cos'è il controllo di versione?</h3>
<p>È una <b>macchina del tempo</b> per un progetto. Mentre lavori ai tuoi file
crei dei <b>punti di salvataggio</b>: in qualsiasi momento puoi tornare a com'era
il progetto in uno di quei punti, confrontare due momenti, o ripartire da lì.
Pensa ai <b>salvataggi con nome</b> di un videogioco, o a un diario fotografico
che scatta una foto di <i>tutti</i> i file a ogni tappa importante. Git è lo
strumento più usato al mondo per fare questo. Questo laboratorio non ti insegna
i comandi a memoria: ti mostra <b>cosa succede dentro</b>, al rallentatore.</p>

<h3>Che cos'è un commit?</h3>
<p>Un <b>commit</b> è una di quelle foto: una <b>istantanea completa</b> di tutti
i tuoi file in un preciso istante, con un'etichetta (chi, quando, un messaggio) e
un <b>puntatore al commit precedente</b>, il suo <b>parent</b>. Ogni commit punta
al padre, quello al nonno, e così via: la catena di puntatori <i>è</i> la
<b>storia</b> del progetto. Non ci sono "differenze" da ricostruire: ogni foto è
intera, e Git è furbo abbastanza da non sprecare spazio (lo scoprirai fra poco).</p>

<h3>La rivelazione del laboratorio: tutto è un oggetto con un nome-hash</h3>
<p>Ecco il cuore, la cosa che questo laboratorio ti fa <i>vedere</i>. Git
conserva ogni cosa come <b>oggetti</b> in un magazzino (l'<b>object store</b>), e
il <b>nome</b> di ogni oggetto è lo <b>SHA-1</b> — un'impronta digitale di 40
cifre calcolata <i>dal suo stesso contenuto</i>. Stesso contenuto ⇒ stesso hash,
sempre e su qualsiasi computer. Ci sono tre tipi di oggetto:</p>
<table>
<tr><th>oggetto</th><th>che cos'è</th></tr>
<tr><td><b>blob</b></td><td>i <i>byte</i> di un file — solo il contenuto, senza nome</td></tr>
<tr><td><b>tree</b></td><td>l'elenco di una cartella: nomi → blob (file) e altri tree (sottocartelle)</td></tr>
<tr><td><b>commit</b></td><td>un'istantanea = un tree radice + metadati + il parent</td></tr>
</table>
<p>E un <b>branch</b> (ramo)? Non è una copia: è solo un'<b>etichetta mobile</b>
appiccicata a un commit. <b>HEAD</b> è l'etichetta speciale che dice "sei qui".
Fare un commit sposta l'etichetta in avanti sul commit nuovo. Tutto qui.</p>

<h3>Un esempio concreto (il livello 1)</h3>
<p>Crei un file <code>README</code> con dentro il testo <code>hello git</code> (e
un a capo). Nel momento in cui lo metti in <b>staging</b>, Git prende quei byte,
ci mette davanti una piccola intestazione <code>blob &lt;lunghezza&gt;\\0</code>,
e ne calcola lo SHA-1:</p>
<pre>contenuto:  "hello git\\n"   (10 byte)
preimmagine: blob 10\\0hello git\\n
SHA-1:       8d0e41234f24b6da002d962a26c2495ea16a425f
                └─ nell'object store lo vedi abbreviato: 8d0e412</pre>
<p>Nasce così un <b>blob</b> con quel nome. Il <b>commit</b> poi crea un
<b>tree</b> (la cartella: "README → quel blob") e si punta addosso. Nello store
vedrai comparire e illuminarsi tre oggetti: blob, tree, commit. E non è un
trucco: apri un terminale e digita
<code>printf 'hello git\\n' | git hash-object --stdin</code> — otterrai
<i>esattamente</i> lo stesso hash.</p>

<h3>Cosa vuol dire "eseguire" qui</h3>
<p>Non scrivi codice. Modifichi il <b>working tree</b> (i file, a sinistra) e
premi le <b>azioni</b>: <i>stage</i>, <i>commit</i>, <i>branch</i>,
<i>checkout</i>, <i>merge</i>. Ogni azione viene registrata in un <b>log</b> — un
piccolo programma ri-eseguibile — e premendo <b>Avvia</b> (o <b>Passo</b>, un
oggetto alla volta) il motore la <b>ri-esegue animandola</b>: gli oggetti nascono,
si deduplicano se il contenuto è già visto, e si collegano con archi
(tree→blob, commit→tree, commit→parent). Guarda crescere il <b>grafo</b>.</p>

<h3>Piccolo glossario</h3>
<table>
<tr><th>parola</th><th>in una frase</th></tr>
<tr><td><b>repository</b></td><td>il progetto e tutta la sua storia — il magazzino degli oggetti</td></tr>
<tr><td><b>commit</b></td><td>un'istantanea completa dei file in un istante, con un parent (livello 5)</td></tr>
<tr><td><b>snapshot</b></td><td>la "foto" che un commit rappresenta: non differenze, ma lo stato intero</td></tr>
<tr><td><b>blob</b></td><td>i byte di un file, senza nome, nominati dal loro hash (livello 1)</td></tr>
<tr><td><b>tree</b></td><td>l'elenco di una cartella: nomi → blob e sottotree (livelli 3–4)</td></tr>
<tr><td><b>ref / branch</b></td><td>un'etichetta mobile che punta a un commit (livelli 7–8)</td></tr>
<tr><td><b>HEAD</b></td><td>l'etichetta "sei qui": il commit su cui ti trovi ora (livello 7)</td></tr>
<tr><td><b>SHA-1 / hash</b></td><td>l'impronta di 40 cifre del contenuto: è il nome dell'oggetto</td></tr>
<tr><td><b>object store</b></td><td><code>.git/objects</code>: dove vivono blob, tree e commit</td></tr>
<tr><td><b>parent</b></td><td>il commit precedente; un merge ne ha due (livello 9)</td></tr>
<tr><td><b>staging / index</b></td><td>la "sala d'attesa": ciò che finirà nel prossimo commit (livello 10)</td></tr>
<tr><td><b>deduplicazione</b></td><td>stesso contenuto ⇒ stesso blob condiviso, mai due copie (livello 2)</td></tr>
</table>

<h3>Come si usa il laboratorio</h3>
<p>In ogni livello: leggi la lezione e l'<b>obiettivo</b> a sinistra, agisci sul
working tree e con i bottoni delle azioni, poi premi <b>Avvia</b> per animare, o
<b>Passo</b> per avanzare un oggetto alla volta. Clicca un oggetto nello store per
<b>ispezionarlo</b> (tipo, hash, contenuto). Se ti blocchi ci sono i
<b>suggerimenti</b>, uno alla volta. Non puoi rompere niente: <b>Reset</b> riporta
sempre allo stato di partenza.</p>
<p>La verifica ri-esegue le tue azioni su più <b>set di contenuti</b>, alcuni
<b>nascosti</b> con byte diversi: passa una soluzione <i>strutturalmente</i>
corretta, non una che indovina i byte mostrati. Buon viaggio nel cofano di Git!</p>`,

  en: `
<p>Welcome! This page explains <b>from zero</b> the ideas you will meet in the
levels. You don't need to know Git already: five minutes of reading and you are
ready. You can reopen it anytime from the <b>Basics</b> button in the header.</p>

<h3>What is version control?</h3>
<p>It is a <b>time machine</b> for a project. As you work on your files you make
<b>save points</b>: at any moment you can go back to how the project looked at one
of them, compare two moments, or restart from there. Think of a video game's
<b>named save-games</b>, or a photo log that snaps a picture of <i>all</i> your
files at every milestone. Git is the world's most used tool for this. This lab
does not drill commands into you: it shows you <b>what happens inside</b>, in slow
motion.</p>

<h3>What is a commit?</h3>
<p>A <b>commit</b> is one of those photos: a <b>complete snapshot</b> of all your
files at one instant, with a label (who, when, a message) and a <b>pointer to the
previous commit</b>, its <b>parent</b>. Each commit points to its parent, that one
to its grandparent, and so on: the chain of pointers <i>is</i> the project's
<b>history</b>. There are no "diffs" to reconstruct — each photo is whole, and Git
is clever enough not to waste space (you'll discover how shortly).</p>

<h3>The lab's reveal: everything is an object named by a hash</h3>
<p>Here is the heart of it, the thing this lab lets you <i>see</i>. Git keeps
everything as <b>objects</b> in a warehouse (the <b>object store</b>), and the
<b>name</b> of every object is its <b>SHA-1</b> — a 40-digit fingerprint computed
<i>from its own content</i>. Same content ⇒ same hash, always, on any machine.
There are three kinds of object:</p>
<table>
<tr><th>object</th><th>what it is</th></tr>
<tr><td><b>blob</b></td><td>the <i>bytes</i> of a file — content only, no name</td></tr>
<tr><td><b>tree</b></td><td>a directory listing: names → blobs (files) and other trees (subfolders)</td></tr>
<tr><td><b>commit</b></td><td>a snapshot = one root tree + metadata + the parent</td></tr>
</table>
<p>And a <b>branch</b>? It is not a copy: it is just a <b>movable label</b> stuck
onto a commit. <b>HEAD</b> is the special label saying "you are here". Making a
commit slides the label forward onto the new commit. That's all.</p>

<h3>A concrete example (level 1)</h3>
<p>You create a file <code>README</code> containing the text <code>hello git</code>
(plus a newline). The moment you <b>stage</b> it, Git takes those bytes, prepends
a tiny header <code>blob &lt;length&gt;\\0</code>, and computes the SHA-1:</p>
<pre>content:   "hello git\\n"   (10 bytes)
preimage:  blob 10\\0hello git\\n
SHA-1:     8d0e41234f24b6da002d962a26c2495ea16a425f
              └─ in the object store you see it abbreviated: 8d0e412</pre>
<p>A <b>blob</b> is born with that name. The <b>commit</b> then builds a
<b>tree</b> (the folder: "README → that blob") and points at it. In the store
you'll watch three objects appear and light up: blob, tree, commit. And it is not
a trick: open a terminal and type
<code>printf 'hello git\\n' | git hash-object --stdin</code> — you'll get
<i>exactly</i> the same hash.</p>

<h3>What "running" means here</h3>
<p>You don't write code. You edit the <b>working tree</b> (the files, on the left)
and press <b>actions</b>: <i>stage</i>, <i>commit</i>, <i>branch</i>,
<i>checkout</i>, <i>merge</i>. Each action is recorded in a <b>log</b> — a small
replayable program — and pressing <b>Run</b> (or <b>Step</b>, one object at a
time) makes the engine <b>replay it with animation</b>: objects are born,
deduplicated when the content was already seen, and linked with edges
(tree→blob, commit→tree, commit→parent). Watch the <b>graph</b> grow.</p>

<h3>A small glossary</h3>
<table>
<tr><th>word</th><th>in one sentence</th></tr>
<tr><td><b>repository</b></td><td>the project and its whole history — the warehouse of objects</td></tr>
<tr><td><b>commit</b></td><td>a complete snapshot of the files at one instant, with a parent (level 5)</td></tr>
<tr><td><b>snapshot</b></td><td>the "photo" a commit represents: not diffs, but the whole state</td></tr>
<tr><td><b>blob</b></td><td>a file's bytes, nameless, named by their hash (level 1)</td></tr>
<tr><td><b>tree</b></td><td>a directory listing: names → blobs and subtrees (levels 3–4)</td></tr>
<tr><td><b>ref / branch</b></td><td>a movable label pointing at a commit (levels 7–8)</td></tr>
<tr><td><b>HEAD</b></td><td>the "you are here" label: the commit you are on now (level 7)</td></tr>
<tr><td><b>SHA-1 / hash</b></td><td>the 40-digit fingerprint of the content: it is the object's name</td></tr>
<tr><td><b>object store</b></td><td><code>.git/objects</code>: where blobs, trees and commits live</td></tr>
<tr><td><b>parent</b></td><td>the previous commit; a merge has two of them (level 9)</td></tr>
<tr><td><b>staging / index</b></td><td>the "waiting room": what will go into the next commit (level 10)</td></tr>
<tr><td><b>deduplication</b></td><td>same content ⇒ same shared blob, never two copies (level 2)</td></tr>
</table>

<h3>How to use the lab</h3>
<p>In every level: read the lesson and the <b>goal</b> on the left, act on the
working tree and the action buttons, then press <b>Run</b> to animate, or
<b>Step</b> to advance one object at a time. Click an object in the store to
<b>inspect</b> it (type, hash, content). If you get stuck there are <b>hints</b>,
one at a time. You cannot break anything: <b>Reset</b> always returns to the
starting state.</p>
<p>Verification re-runs your actions on several <b>content sets</b>, some
<b>hidden</b> with different bytes: a <i>structurally</i> correct solution passes,
one that guesses the shown bytes does not. Enjoy the trip under Git's hood!</p>`,
};
