[🇮🇹 Italiano](README.md) · 🇬🇧 **English**

# EDU-GIT · Git Internals Playground

**▶ Try it online: <https://manzolo.github.io/GitSimulator/?lang=en>**

## What it is

An interactive learning path, a cousin of
[learngitbranching.js.org](https://learngitbranching.js.org) but with the
**opposite, complementary** angle. learngitbranching teaches the *commit graph*
and the commands (branch, merge, rebase) beautifully. EDU-GIT instead opens the
hood and shows the **content-addressed object store** — the repository's
"memory", `.git/objects`.

Two panels side by side: on the left the **working tree** (files you edit), on
the right the **object store**, a grid of type-coloured objects
(**blob** = yellow, **tree** = green, **commit** = red), each with its short
hash. When you act — write a file, stage, commit — the engine animates the
**birth of objects**: content is hashed, the object appears and lights up, edges
are drawn (tree→blob, commit→tree, commit→parent), refs slide onto the new
commit.

The key message: **Git is a content-addressed file system; the commands are just
sugar on top.**

Part of the **EDU-\*** collection of teaching simulators (vanilla HTML/CSS/JS,
ES modules, zero dependencies, zero build):

- [EDU-16 · ASM Playground](https://github.com/manzolo/SimulatoreAssembler) — from the transistor to the compiler
- [EDU-NET · TCP/IP Playground](https://github.com/manzolo/SimulatoreRete) — ARP, routing, DNS, TCP
- [EDU-REGEX · Regex Playground](https://github.com/manzolo/SimulatoreRegEx) — a regex engine drawn as an automaton
- **EDU-GIT** — this project

## The signature element: deduplication

Because an object is named by the **hash of its content**, two files with the
same bytes point to the **exact same blob**. Give two files identical content and
watch the second staging *reuse* the blob instead of creating a new one — the arc
converges, the object pulses. It is the insight that surprises everyone, and it
is this project's cover image.

The second "aha": **Merkle** propagation. Change one byte in a file and its blob
hash changes → the tree that holds it changes → the root tree changes → the
commit changes. Tampering ripples all the way up, visibly.

## The hashes are real

The core **does not use Git** and has no dependencies: it reimplements the object
model from scratch. But it computes **real SHA-1** over Git's exact preimage
(`<type> <length>\0<payload>`), so a blob's short hash **matches
`git hash-object`** in your terminal. Try it:

```sh
printf 'hello git\n' | git hash-object --stdin
# ...the same hash you see in level 1's object store.
```

## How verification works (anti-cheat)

Every level specifies a **state of the object store**, not commands ("bring the
repo to a state with two commits, the second sharing README's blob because it
didn't change"). Verification inspects the **resulting object graph**: which
blobs/trees/commits exist, who points to whom, which refs, what is reachable from
HEAD, and the deduplication facts.

The anti-cheat is natural: your actions are replayed on **several content sets** —
the shown ones *and* hidden ones that rebind the tokens to different bytes. A
structurally correct solution holds for any bytes; one that relies on the shown
content fails a hidden set.

## Curriculum

14 guided levels, from the first blob to rebuilding a branch-and-merge history by
hand:

1. **One file, one blob** — the hash is the content
2. **Two files, one blob** — deduplication
3. **The tree** — a directory snapshot
4. **Nested trees** — subfolders
5. **The first commit** — commit → tree → blob
6. **The second commit shares** — unchanged blobs
7. **HEAD & refs** — movable pointers over immutable objects
8. **A branch is a pointer** — two refs on one commit
9. **A merge has two parents**
10. **The index** — staging as an intermediate tree
11. **Lost objects & the garbage collector**
12. **Merkle** — the hash cascade
13. **Why the repo doesn't explode** — sharing & packfiles
14. **Capstone** — branch & merge from scratch

Plus a free **sandbox**, bilingual IT/EN, with progress and language saved in
`localStorage` and hash routing `#level-id`.

## "Basics" primer (from zero)

On the **first visit** a **"Basics"** primer opens automatically, explaining Git
from zero — what version control is, what a commit/snapshot is, and the lab's
reveal (blobs/trees/commits addressed by the SHA-1 of their content) with a
concrete example tied to level 1, a one-sentence-per-term glossary, and how to use
the lab. It assumes no prior knowledge and can be reopened anytime from the
**Basics** button in the header.

## Run locally

ES modules don't work over `file://`, so serve it with any static server:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Development & tests

```sh
npm test          # node --test: git-exact SHA-1/object hashes, repo, levels, anti-cheat, determinism
npm run e2e       # headless Chrome via CDP (Node built-ins only), drives the real UI
```

The tests verify that blob/tree/commit hashes **match Git**, that every level has
a **reference solution** solving it on all content sets, that a solution hardwired
to the visible cases is **rejected** by a hidden one, and that two runs produce
**identical** traces and objects (determinism — no `Date.now`/`Math.random` in the
core).

**Deploy**: everything lives at the root with relative paths and a `.nojekyll`
file; GitHub Pages from branch `main`, folder `/ (root)`. No GitHub Action, no
build.

## License

MIT. Made for learning: if you spot a mistake, open an issue.
