// Git object serialization — the exactness layer. Every object is hashed over
// the SAME preimage real Git uses: `<type> <length>\0` followed by the payload
// bytes. So a blob/tree sha computed here equals `git hash-object` on the same
// content, and a curious user can verify it in their own terminal — the whole
// didactic point.
//
// blob  : payload = the file content bytes, verbatim.
// tree  : payload = concat of entries, each `<mode> <name>\0` ++ raw-20-byte-sha,
//         entries sorted by name (subtrees compared as if the name ended in '/').
// commit: payload = `tree <hex>\n` (+ `parent <hex>\n` per parent) + author +
//         committer lines + blank line + message. Commit metadata is FIXED
//         (author/committer/epoch/tz constants) so runs stay deterministic;
//         levels never assert a commit sha, only its structure.

import { sha1hex } from './sha1.js';

const enc = new TextEncoder();

// Fixed identity + time so commit hashes are deterministic across runs. Real
// git commits differ only because of the varying committer timestamp; blobs and
// trees match unconditionally.
export const AUTHOR = 'EDU <edu@edu>';
export const EPOCH = '0 +0000';

// Git tree modes (as ASCII, exactly as they appear on disk).
export const MODE_FILE = '100644';
export const MODE_EXEC = '100755';
export const MODE_TREE = '40000';

export function bytesOf(str) { return enc.encode(str); }

function concat(chunks) {
  let len = 0;
  for (const c of chunks) len += c.length;
  const out = new Uint8Array(len);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

function hexToRaw(hex) {
  const out = new Uint8Array(20);
  for (let i = 0; i < 20; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

// The one hashing chokepoint: prepend Git's `<type> <len>\0` header.
export function gitHashHex(type, payload) {
  const header = bytesOf(`${type} ${payload.length}\0`);
  return sha1hex(concat([header, payload]));
}

// A blob is just its bytes. `content` may be a string (utf-8 encoded) or bytes.
export function makeBlob(content) {
  const payload = typeof content === 'string' ? bytesOf(content) : content;
  return { type: 'blob', payload, size: payload.length, sha: gitHashHex('blob', payload) };
}

// entries: [{ mode, name, sha (40-hex), type:'blob'|'tree' }]. Returns the tree
// object; `entries` is normalized (sorted) on the returned object too.
export function serializeTree(entries) {
  const sorted = [...entries].sort((a, b) => {
    const ka = a.name + (a.type === 'tree' ? '/' : '');
    const kb = b.name + (b.type === 'tree' ? '/' : '');
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
  const chunks = [];
  for (const e of sorted) {
    chunks.push(bytesOf(`${e.mode} ${e.name}\0`));
    chunks.push(hexToRaw(e.sha));
  }
  const payload = concat(chunks);
  return { type: 'tree', payload, size: payload.length, sha: gitHashHex('tree', payload),
    entries: sorted };
}

// { tree (hex), parents:[hex], message } → commit object with fixed identity/time.
export function serializeCommit({ tree, parents = [], message = '' }) {
  const lines = [`tree ${tree}`];
  for (const p of parents) lines.push(`parent ${p}`);
  lines.push(`author ${AUTHOR} ${EPOCH}`);
  lines.push(`committer ${AUTHOR} ${EPOCH}`);
  const text = `${lines.join('\n')}\n\n${message}\n`;
  const payload = bytesOf(text);
  return { type: 'commit', payload, size: payload.length, sha: gitHashHex('commit', payload),
    tree, parents: [...parents], message };
}

// Short hash for the UI (Git's default abbreviation is 7 chars).
export function shortSha(sha) { return sha.slice(0, 7); }
