// Pure SHA-1 in ~50 lines, operating on bytes (Uint8Array). No dependencies,
// no Web Crypto (which is async and unavailable off a secure context) — we want
// a synchronous, deterministic hash the whole engine can call inline. This is
// the real SHA-1 Git uses; feed it Git's object preimage and you get the same
// 40-hex digest as `git hash-object` (see objects.js).

function rotl(n, s) { return ((n << s) | (n >>> (32 - s))) >>> 0; }

// SHA-1 of a byte array → Uint8Array(20).
export function sha1raw(bytes) {
  const ml = bytes.length;
  // Padded message: original ++ 0x80 ++ 0x00* ++ 64-bit big-endian bit length.
  const withOne = ml + 1;
  const total = withOne + ((56 - (withOne % 64) + 64) % 64) + 8;
  const msg = new Uint8Array(total);
  msg.set(bytes);
  msg[ml] = 0x80;
  const bitLen = ml * 8;
  // JS bitwise is 32-bit; split the 64-bit length into hi/lo 32-bit words.
  const hi = Math.floor(bitLen / 0x100000000);
  const lo = bitLen >>> 0;
  const dv = new DataView(msg.buffer);
  dv.setUint32(total - 8, hi);
  dv.setUint32(total - 4, lo);

  let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;
  const w = new Uint32Array(80);

  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 80; i++) w[i] = rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);

    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let i = 0; i < 80; i++) {
      let f, k;
      if (i < 20) { f = (b & c) | (~b & d); k = 0x5A827999; }
      else if (i < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1; }
      else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
      else { f = b ^ c ^ d; k = 0xCA62C1D6; }
      const t = (rotl(a, 5) + f + e + k + w[i]) >>> 0;
      e = d; d = c; c = rotl(b, 30); b = a; a = t;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
  }

  const out = new Uint8Array(20);
  const odv = new DataView(out.buffer);
  odv.setUint32(0, h0); odv.setUint32(4, h1); odv.setUint32(8, h2);
  odv.setUint32(12, h3); odv.setUint32(16, h4);
  return out;
}

const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));

export function toHex(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += HEX[bytes[i]];
  return s;
}

// SHA-1 of bytes → 40-char lowercase hex.
export function sha1hex(bytes) {
  return toHex(sha1raw(bytes));
}
