// Charts for the garden-path note. Each export is one chart: (data, ctx) → SVG element.
import type { ChartFn } from '../../../lib/chart';

// ---------------------------------------------------------------------------
// gardenTree: a syntax tree that grows word by word, breaks, and is rebuilt.
//
// Every piece (a node label, an edge, a word) is its own top-level <g> with a
// <desc> naming it, so lib/morph.ts can match it between scrolly steps: a piece
// that exists in both steps moves and recolours, a new one fades in, a gone one
// fades out. A label that changes (Adj → N) fades from the old to the new.
// ---------------------------------------------------------------------------

type Tone = 'ink' | 'muted' | 'faint' | 'accent' | 'accent2';

/** A tree node. With `word` it is a preterminal (Adj, N, V…) above that word. */
export interface TreeNode {
  id: string;
  label: string;
  kids?: TreeNode[];
  word?: string;
  /** Colour of the label. */
  tone?: Tone;
  /** Colour of the edge from the parent to this node. */
  edge?: Tone;
  /** Dashed edge from the parent (a guess, not a real branch). */
  dash?: boolean;
}

/** A word of the sentence. `hidden` = not read yet: it keeps its place (so the
 *  tree doesn't shift when it arrives) but isn't drawn. */
export interface Word { id: string; text: string; tone?: Tone; italic?: boolean; hidden?: boolean }

/** One scrolly step: the sentence and the tree(s) built so far. */
export interface TreeState {
  words: Word[];
  /** Top nodes with their depth (0 = top row), so a phrase keeps its row
   *  when the sentence node above it only arrives in a later step. */
  roots: { node: TreeNode; depth: number }[];
}

const SVG = 'http://www.w3.org/2000/svg';
const ROWS = 5; // phrase rows 0–3, word classes on row 4

function el(tag: string, attrs: Record<string, string | number>, text?: string) {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text !== undefined) e.textContent = text;
  return e;
}

/** One morphable piece: <g><desc>key</desc>child</g>. */
function piece(key: string, child: Element) {
  const g = el('g', {});
  g.append(el('desc', {}, key), child);
  return g;
}

export const gardenTree: ChartFn<TreeState[]> = (states, ctx) => {
  const state = states[Math.min(ctx.step, states.length - 1)];
  // On this site ink = accent and muted ≈ accent-2, so the plain parts are
  // muted/faint and only what is new in a step is in the accent.
  const color = (t: Tone = 'muted') => (t === 'accent2' ? ctx.colors.accent2 : ctx.colors[t]);
  const narrow = ctx.width < 520;
  const wordSize = narrow ? 15 : 17;
  const labelSize = narrow ? 12 : 13;
  const H = narrow ? 300 : 340;
  const top = 18;
  const wordY = H - 14;
  const preY = wordY - (narrow ? 42 : 50);
  const gap = (preY - top) / (ROWS - 1);
  const rowY = (depth: number) => top + depth * gap;

  // Words: spaced by their (estimated) widths, over at most 600 px, centred.
  const span = Math.min(ctx.width, 600) - 24;
  const widths = state.words.map((w) => w.text.length * wordSize * 0.56);
  const natural = widths.reduce((a, b) => a + b, 0);
  const space = Math.max(10, (span - natural) / Math.max(1, state.words.length - 1));
  const total = natural + space * (state.words.length - 1);
  let cursor = (ctx.width - total) / 2;
  const wordX = new Map<string, number>();
  state.words.forEach((w, i) => {
    wordX.set(w.id, cursor + widths[i] / 2);
    cursor += widths[i] + space;
  });

  // Tree layout: word classes above their word, phrases centred over their kids.
  type Placed = { node: TreeNode; x: number; y: number };
  const placed: Placed[] = [];
  const edges: { key: string; from: Placed; to: { x: number; y: number }; toWord: boolean; tone: Tone; dash: boolean }[] = [];
  const place = (n: TreeNode, depth: number): Placed => {
    let p: Placed;
    if (n.word) {
      p = { node: n, x: wordX.get(n.word)!, y: preY };
      edges.push({ key: `${n.id}>${n.word}`, from: p, to: { x: p.x, y: wordY }, toWord: true, tone: n.edge ?? 'faint', dash: false });
    } else {
      const kids = (n.kids ?? []).map((k) => place(k, depth + 1));
      p = { node: n, x: kids.reduce((a, k) => a + k.x, 0) / kids.length, y: rowY(depth) };
      kids.forEach((k) =>
        edges.push({ key: `${n.id}>${k.node.id}`, from: p, to: k, toWord: false, tone: k.node.edge ?? 'faint', dash: !!k.node.dash }),
      );
    }
    placed.push(p);
    return p;
  };
  state.roots.forEach((r) => place(r.node, r.depth));

  const svg = el('svg', {
    width: ctx.width, height: H, viewBox: `0 0 ${ctx.width} ${H}`,
    'font-family': ctx.font, 'text-anchor': 'middle',
  });
  svg.style.overflow = 'visible';

  // Edges first, so labels sit on top. They stop short of the text.
  const pad = labelSize * 0.85;
  for (const e of edges) {
    const line = el('line', {
      x1: e.from.x, y1: e.from.y + pad,
      x2: e.to.x, y2: e.to.y - (e.toWord ? wordSize * 0.95 : pad),
      stroke: color(e.tone), 'stroke-width': e.tone === 'faint' ? 1.25 : 1.75,
      'stroke-linecap': 'round', 'stroke-dasharray': e.dash ? '3 5' : 'none',
    });
    svg.append(piece(`e:${e.key}`, line));
  }
  for (const p of placed) {
    const t = el('text', {
      x: p.x, y: p.y, 'dominant-baseline': 'middle', fill: color(p.node.tone ?? 'muted'),
      'font-size': labelSize, 'font-weight': p.node.tone && p.node.tone !== 'muted' ? 600 : 400,
      'letter-spacing': '0.04em',
    }, p.node.label);
    svg.append(piece(`n:${p.node.id}`, t));
  }
  state.words.forEach((w) => {
    if (w.hidden) return;
    const t = el('text', {
      x: wordX.get(w.id)!, y: wordY, fill: color(w.tone ?? 'muted'), 'font-weight': w.tone === 'accent' ? 600 : 400,
      'font-size': wordSize, 'font-style': w.italic ? 'italic' : 'normal',
    }, w.text);
    svg.append(piece(`w:${w.id}`, t));
  });
  return svg;
};

// ---------------------------------------------------------------------------
// nextWords: the model reading the sentence word by word. At each word it
// lists its top guesses for the next word (bars = probability), then the word
// that actually comes lights up and drops into its slot in the sentence. Where
// the real word isn't among the guesses, it shows up below them, with how far
// down the list it was. Plays on its own (like a gif) while in view, and loops.
// ---------------------------------------------------------------------------

export interface NextWordStep {
  prefix: string;
  word: string;
  /** Probability of the word that actually comes. */
  p: number;
  /** Rank of its first token among all tokens (1 = top guess). */
  rank: number;
  inTop: boolean;
  candidates: { word: string; p: number }[];
  /** Words the model ranks above the real one, sampled in order (when far down). */
  reel?: { word: string; rank: number; p: number }[];
}
export interface NextWordData { sentence: string; steps: NextWordStep[] }

/** 0.26 → "26%", 0.0049 → "0.5%", 6e-8 → "1 in 16 million". */
function chance(p: number) {
  if (p >= 0.095) return `${Math.round(p * 100)}%`;
  if (p >= 0.001) return `${(p * 100).toFixed(1)}%`;
  const n = 1 / p;
  const sig = (x: number) => Number(x.toPrecision(2)).toLocaleString('en-GB');
  if (n >= 1e6) return `1 in ${sig(n / 1e6)} million`;
  return `1 in ${sig(n)}`;
}

export const nextWords: ChartFn<NextWordData> = async (data, ctx) => {
  const { gsap, MOVE, LEAVE } = await import('../../../lib/motion');
  const c = ctx.colors;
  const narrow = ctx.width < 520;
  const words = data.sentence.split(' ');
  const steps = data.steps;
  // Same scale in every step, so a low bar means an unsure model.
  const max = Math.max(...steps.flatMap((s) => s.candidates.map((x) => x.p)), ...steps.map((s) => s.p));
  const ROW = narrow ? 30 : 32;
  const ROWS = Math.max(...steps.map((s) => s.candidates.length + (s.inTop ? 0 : 2)));
  const wordCol = narrow ? 104 : 128;
  const pctCol = narrow ? 112 : 132;

  const div = (css: Partial<CSSStyleDeclaration>, text?: string) => {
    const d = document.createElement('div');
    Object.assign(d.style, css);
    if (text !== undefined) d.textContent = text;
    return d;
  };

  const root = div({ fontFamily: ctx.font, maxWidth: '880px', margin: '0 auto', color: c.muted, position: 'relative' });

  // The sentence, every word in its final place from the start (no jumps).
  const sent = div({
    fontSize: narrow ? '22px' : '26px', lineHeight: '1.3', textAlign: 'center',
    margin: '4px 0 22px', whiteSpace: 'nowrap',
  });
  const wordEls = words.map((w, i) => {
    const s = document.createElement('span');
    s.textContent = w;
    Object.assign(s.style, {
      display: 'inline-block', margin: '0 0.18em', color: c.muted,
      borderBottom: `2px dashed transparent`, transition: 'none',
    });
    if (i > 0) s.style.color = 'transparent';
    sent.append(s);
    return s;
  });
  root.append(sent);

  const label = div({ fontSize: '13px', letterSpacing: '0.04em', margin: '0 0 8px', color: c.muted },
    'The model’s guesses for the next word');
  root.append(label);

  // One panel of guesses per step, stacked in the same spot.
  const stage = div({ position: 'relative', height: `${ROWS * ROW}px` });
  root.append(stage);

  const row = (word: string, p: number, top: number) => {
    const r = div({
      position: 'absolute', left: '0', right: '0', top: `${top}px`, height: `${ROW}px`,
      display: 'grid', gridTemplateColumns: `${wordCol}px 1fr ${pctCol}px`, alignItems: 'center', gap: '10px',
      fontSize: narrow ? '15px' : '16px',
    });
    const w = div({ textAlign: 'right', color: c.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }, word);
    const track = div({ height: '12px', position: 'relative' });
    const bar = div({
      position: 'absolute', left: '0', top: '0', bottom: '0',
      width: `${Math.max(0.4, (p / max) * 100)}%`, minWidth: '2px',
      background: c.faint, borderRadius: '0 2px 2px 0', transformOrigin: 'left center',
    });
    track.append(bar);
    const pct = div({ fontSize: '13px', color: c.muted, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }, chance(p));
    r.append(w, track, pct);
    return { r, w, bar, pct };
  };

  // Vertical-only blur for the fast scroll down the list (motion blur).
  const blurId = `nw-blur-${Math.random().toString(36).slice(2)}`;
  const fsvg = document.createElementNS(SVG, 'svg');
  fsvg.setAttribute('width', '0');
  fsvg.setAttribute('height', '0');
  fsvg.style.position = 'absolute';
  fsvg.innerHTML = `<filter id="${blurId}" x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur stdDeviation="0 0" /></filter>`;
  root.append(fsvg);
  const blur = fsvg.querySelector('feGaussianBlur')!;

  const panels = steps.map((s) => {
    const panel = div({ position: 'absolute', inset: '0', opacity: '0' });
    const rows = s.candidates.map((x, i) => row(x.word, x.p, i * ROW));
    rows.forEach((x) => panel.append(x.r));
    let hit = rows[s.candidates.findIndex((x) => x.word === s.word)];
    let reel: { win: HTMLElement; inner: HTMLElement; n: number } | null = null;
    if (!s.inTop) {
      // The real word is further down: a window under the guesses that
      // scrolls through the words the model ranks above it.
      const seen = new Set(s.candidates.map((x) => x.word));
      const above = (s.reel ?? []).filter((x) => !seen.has(x.word) && x.rank > s.candidates.length);
      const win = div({
        position: 'absolute', left: '0', right: '0', top: `${s.candidates.length * ROW}px`, height: `${2 * ROW}px`,
        overflow: 'hidden', opacity: '0',
        maskImage: 'linear-gradient(to bottom, transparent, #000 45%)',
        webkitMaskImage: 'linear-gradient(to bottom, transparent, #000 45%)',
      } as Partial<CSSStyleDeclaration>);
      const inner = div({ position: 'relative', height: `${(above.length + 1) * ROW}px`, filter: `url(#${blurId})` });
      above.forEach((x, j) => {
        const r = row(x.word, x.p, j * ROW);
        r.w.style.color = c.faint;
        r.pct.textContent = `no. ${x.rank.toLocaleString('en-GB')}`;
        r.pct.style.color = c.faint;
        inner.append(r.r);
      });
      hit = row(s.word, s.p, above.length * ROW);
      inner.append(hit.r);
      if (!above.length) win.style.maskImage = win.style.webkitMaskImage = 'none';
      win.append(inner);
      panel.append(win);
      reel = { win, inner, n: above.length };
    }
    stage.append(panel);
    return { panel, rows, hit, reel };
  });

  const finalState = () => {
    wordEls.forEach((w, i) => { w.style.color = i === words.length - 1 ? c.accent : c.muted; });
    const last = panels[panels.length - 1];
    panels.forEach((p) => { p.panel.style.opacity = p === last ? '1' : '0'; });
    if (last.reel) {
      last.reel.win.style.opacity = '1';
      last.reel.inner.style.transform = `translateY(${(1 - last.reel.n) * ROW}px)`;
    }
    last.hit.w.style.color = c.accent;
    last.hit.w.style.fontWeight = '600';
    last.hit.bar.style.background = c.accent;
    last.hit.pct.style.color = c.accent;
  };

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finalState();
    return root;
  }

  // Timeline: per step, guesses grow in, the real word lights up and lands
  // in the sentence, the guesses leave. Built once, then looped.
  const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1 });
  const slot = (i: number) => wordEls[i];
  tl.set(wordEls.slice(1), { color: 'transparent', borderBottomColor: 'transparent', y: 0 })
    .set(wordEls[0], { color: c.muted })
    .set(panels.map((p) => p.panel), { opacity: 0 });
  panels.forEach((p, k) => {
    const i = k + 1; // the word being guessed
    const last = k === panels.length - 1;
    // Each word is its own small timeline; the easy words before the trap
    // play faster, the trap word at full speed.
    const st = gsap.timeline();
    const t = 0;
    st
      .set(slot(i), { borderBottomColor: c.faint }, t)
      .set(p.rows.map((r) => r.bar), { scaleX: 0 }, t)
      .set(p.rows.map((r) => [r.w, r.pct]).flat(), { opacity: 0 }, t)
      .set([p.hit.w, p.hit.pct], { color: c.muted, fontWeight: 400 }, t)
      .set(p.hit.bar, { background: c.faint }, t)
      .to(p.panel, { opacity: 1, duration: 0.3 }, t)
      .to(p.rows.map((r) => [r.w, r.pct]).flat(), { opacity: 1, duration: 0.4, stagger: 0.08 }, t)
      .to(p.rows.map((r) => r.bar), { scaleX: 1, duration: 0.9, stagger: 0.14 }, 0.1);
    // Offsets (s) from the start of this step.
    const at = (sec: number) => sec;
    let hit = 2.4;
    if (p.reel && p.reel.n === 0) {
      // Just below the top guesses: no list to scroll through.
      st.set(p.reel.inner, { y: ROW }, t)
        .set(p.reel.win, { opacity: 0 }, t)
        .to(p.reel.win, { opacity: 1, duration: 0.4 }, at(1.8));
      hit = 2.6;
    } else if (p.reel) {
      // Longer list, longer scroll: about a second per factor ten.
      const dur = Math.min(5, 1.2 + Math.log10(p.reel.n * 10));
      const go = 2.2;
      // Blur follows the speed: none at the ends, most in the middle.
      const mb = { v: 0 };
      const setBlur = () => blur.setAttribute('stdDeviation', `0 ${mb.v.toFixed(2)}`);
      st.set(p.reel.inner, { y: 0 }, t)
        .set(p.reel.win, { opacity: 0 }, t)
        .to(p.reel.win, { opacity: 1, duration: 0.4 }, at(1.8))
        .to(p.reel.inner, { y: -(p.reel.n - 1) * ROW, duration: dur, ease: 'power3.inOut' }, at(go))
        .to(mb, { v: 7, duration: dur / 2, ease: 'power3.in', onUpdate: setBlur }, at(go))
        .to(mb, { v: 0, duration: dur / 2, ease: 'power3.out', onUpdate: setBlur }, at(go + dur / 2));
      hit = go + dur + 0.3;
    }
    st.to([p.hit.w, p.hit.pct], { color: c.accent, fontWeight: 600, duration: 0.3 }, at(hit))
      .to(p.hit.bar, { background: c.accent, duration: 0.3 }, at(hit))
      .to(wordEls.slice(0, i), { color: c.muted, duration: 0.4 }, at(hit + 0.8))
      .fromTo(slot(i), { color: 'transparent', y: 10 }, { color: c.accent, y: 0, borderBottomColor: 'transparent', duration: 0.7, ease: MOVE }, at(hit + 0.8));
    const hold = last ? 6 : 2.6;
    st.to(p.panel, { opacity: 0, duration: 0.45, ease: LEAVE }, at(hit + hold));
    tl.add(st.timeScale(last ? 1 : 1.7));
  });
  tl.to(wordEls, { color: 'transparent', duration: 0.4, ease: LEAVE }, '>-0.1');

  // Play only while on screen; stop for good once this render is replaced.
  const io = new IntersectionObserver(([e]) => {
    if (!root.isConnected) { tl.kill(); io.disconnect(); return; }
    if (e.isIntersecting) tl.play(); else tl.pause();
  }, { threshold: 0.5 });
  requestAnimationFrame(() => io.observe(root));
  return root;
};

// ---------------------------------------------------------------------------
// attentionArcs: what the model looks back at, word by word. Two sentences:
// the garden path (accent) and the version with "that" (accent2). In each
// step one word is being read; arcs run from it back to every earlier word,
// thicker = more attention. Every arc and label is a <desc>-keyed piece that
// exists in every step (invisible when unused), so the arcs morph from one
// reading word to the next instead of popping in.
// ---------------------------------------------------------------------------

export interface AttnSentence { words: string[]; att: number[][] }
export interface AttnData { gp: AttnSentence; ctrl: AttnSentence; steps: string[] }

export const attentionArcs: ChartFn<AttnData> = (data, ctx) => {
  const c = ctx.colors;
  const narrow = ctx.width < 520;
  const shown = data.steps[Math.min(ctx.step, data.steps.length - 1)];

  // Font size: as big as fits the longer sentence, at most 24 px.
  const measure = document.createElement('canvas').getContext('2d')!;
  const longest = [data.gp, data.ctrl].reduce((a, b) => (a.words.length > b.words.length ? a : b));
  const widthAt = (fs: number) => {
    measure.font = `${fs}px ${ctx.font}`;
    return longest.words.reduce((a, w) => a + measure.measureText(w).width, 0) + fs * 0.45 * (longest.words.length - 1);
  };
  const usable = Math.min(ctx.width, 640) - 28;
  const fs = Math.max(12, Math.min(24, 24 * (usable / widthAt(24))));
  const gapW = fs * 0.45;
  const arcMax = narrow ? 62 : 86;
  const block = arcMax + fs + 64;
  const H = 2 * block + 8;
  measure.font = `${fs}px ${ctx.font}`;
  const left = (ctx.width - widthAt(fs)) / 2;

  const svg = el('svg', { width: ctx.width, height: H, viewBox: `0 0 ${ctx.width} ${H}`, 'font-family': ctx.font });
  svg.style.overflow = 'visible';

  const rows = [
    { key: 'gp', s: data.gp, tone: c.accent, label: 'garden path' },
    { key: 'ctrl', s: data.ctrl, tone: c.accent2, label: 'with “that”' },
  ];
  rows.forEach((r, ri) => {
    const y = ri * block + 18 + arcMax + fs; // word baseline
    const cur = r.s.words.indexOf(shown);
    // Word centres, left-aligned on the same start so "Fat" lines up.
    const xs: number[] = [];
    let x = left;
    r.s.words.forEach((w) => {
      const wd = measure.measureText(w).width;
      xs.push(x + wd / 2);
      x += wd + (w === '.' ? 0 : gapW);
    });

    svg.append(piece(`l:${r.key}`, el('text', {
      x: left, y: ri * block + 12, fill: r.tone, 'font-size': 12, 'font-weight': 600, 'letter-spacing': '0.04em',
    }, r.label)));

    const top = y - fs * 0.95;
    r.s.words.forEach((_, j) => {
      const w = j < cur ? r.s.att[cur][j] : 0;
      const on = j < cur && w >= 0.03;
      const x1 = on ? xs[cur] : xs[j], x2 = xs[j];
      const h = on ? Math.min(arcMax, 14 + Math.abs(x1 - x2) * 0.42) : 0;
      const path = el('path', {
        d: `M${x1},${top} C${x1},${top - h} ${x2},${top - h} ${x2},${top}`,
        fill: 'none', stroke: r.tone, 'stroke-linecap': 'round',
        'stroke-width': on ? 1.2 + w * 22 : 1, opacity: on ? Math.min(1, 0.3 + w * 1.6) : 0,
      });
      svg.append(piece(`a:${r.key}:${j}`, path));
      svg.append(piece(`p:${r.key}:${j}`, el('text', {
        x: xs[j], y: y + 20, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 600,
        fill: r.tone, opacity: j < cur ? 1 : 0, 'font-variant-numeric': 'tabular-nums',
      }, j < cur ? `${Math.round(w * 100)}%` : '')));
    });
    r.s.words.forEach((w, j) => {
      svg.append(piece(`w:${r.key}:${j}`, el('text', {
        x: xs[j], y, 'text-anchor': 'middle', 'font-size': fs,
        fill: j === cur ? r.tone : j < cur ? c.muted : c.faint,
        'font-weight': j === cur ? 600 : 400,
      }, w)));
    });
  });
  return svg;
};
