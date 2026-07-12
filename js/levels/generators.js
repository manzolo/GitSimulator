// Case builders. A case is a CONTENT ENVIRONMENT: { id, visible, content, check }.
// `content` binds tokens (A, B, M1…) to actual bytes. The first `visible` envs
// are shown in the panel (and are chosen so the naive approach seems to work);
// the hidden ones rebind the tokens to break any solution that isn't genuinely
// structural — the anti-cheat, exactly as in the sibling projects.

export function mkEnvs(visible, hidden, check) {
  const out = [];
  visible.forEach((content, i) => out.push({ id: `v${i}`, visible: true, content, check }));
  hidden.forEach((content, i) => out.push({ id: `h${i}`, visible: false, content, check }));
  return out;
}
