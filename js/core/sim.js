// GitSim: the stepper. Unlike EDU-REGEX's RegexSim it holds no mutable domain
// state — the whole action log is applied EAGERLY at build time (see engine.js),
// producing a flat, timestamped `trace`. GitSim is a pure CURSOR over that
// trace, yet plays the exact same protocol as its siblings — nextTime() /
// stepOnce()→{time,events} / advanceTo(t) / finalState(), with halted/error —
// so the same Player and headless verifier drive it. One step = one atomic delta
// (finest fidelity, so the dedup "object-reused" beat gets its own frame).

export class GitSim {
  constructor(trace, { repo }) {
    this.trace = trace;          // precomputed deltas, each carrying { time, seq }
    this.repo = repo;            // already fully mutated (eager)
    this.now = 0;
    this._cursor = 0;
    this.onEvent = null;
    this.halted = trace.length === 0;
    this.error = null;
  }

  get steps() { return this.trace.length; }

  nextTime() {
    if (this.halted || this.error) return null;
    return this._cursor < this.trace.length ? this.trace[this._cursor].time : null;
  }

  stepOnce() {
    if (this.halted || this.error) return null;
    if (this._cursor >= this.trace.length) { this.halted = true; return null; }
    const t = this.trace[this._cursor].time;
    const events = [];
    while (this._cursor < this.trace.length && this.trace[this._cursor].time === t) {
      const e = this.trace[this._cursor++];
      events.push(e);
      if (this.onEvent) this.onEvent(e);
    }
    this.now = t;
    if (this._cursor >= this.trace.length) this.halted = true;
    return { time: t, events };
  }

  advanceTo(target) {
    const all = [];
    let n = this.nextTime();
    while (n !== null && n <= target) {
      const d = this.stepOnce();
      if (!d) break;
      all.push(...d.events);
      n = this.nextTime();
    }
    return all;
  }

  finalState() {
    return {
      time: this.now,
      steps: this.trace.length,
      halted: this.halted,
      error: this.error,
      trace: this.trace,
      repo: this.repo.snapshot(),
    };
  }
}

export function runToCompletion(sim) {
  while (!sim.halted && !sim.error) {
    if (sim.stepOnce() === null) break;
  }
  return { state: sim.finalState(), error: sim.error };
}
