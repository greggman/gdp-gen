/**
 * Entry point: wires the refresh button and renders a viewport-sized design on
 * load. The actual design pipeline lives in design.ts.
 */
import {buildDesign, parseTextParams} from './design.js';
import {mount} from './core/renderer.js';

function newSeed(): string {
  return (Date.now() >>> 0).toString(36) + Math.floor(performance.now()).toString(36);
}

// Non-visual SVG nodes that shouldn't be animated (and don't render).
const SKIP_TAGS = new Set(['defs', 'clippath', 'filter', 'style', 'lineargradient', 'radialgradient']);

// Reveal tuning.
const ANIM_DUR = 0.5; // per-element duration (s)
const ANIM_WINDOW = 0.75; // total span the staggered starts are spread across (s)

/**
 * Reveals the design by sliding + scaling + fading elements in, staggered, so it
 * "assembles" over ~1.2s. It recurses INTO every layer so the patterns/textures
 * themselves build up shape-by-shape -- a dense halftone's dots and a few bold
 * blocks alike -- like a print being composed.
 *
 * The stagger is spread across a fixed WINDOW regardless of how many shapes
 * there are, so dense and sparse patterns both cascade over the same span (a
 * 784-dot field just cascades faster, it doesn't lag for seconds).
 *
 * Structural rules only: the page background (first child) stays solid; each
 * pattern's own base fill (a leading <rect>) stays put so its shapes assemble
 * onto it; groups containing text reveal as one unit so a headline never
 * separates from its backing.
 *
 * Math.random here is intentional: the reveal is presentational, not part of the
 * seed-deterministic design output.
 */
function animateIn(svg: SVGSVGElement): void {
  const W = svg.viewBox.baseVal.width || 1000;
  const H = svg.viewBox.baseVal.height || 1000;
  const reach = Math.min(W, H) * 0.05;

  const startTransform = (): string => {
    const r = Math.random();
    let dx = 0;
    let dy = 0;
    if (r < 0.22) dx = -reach;
    else if (r < 0.44) dx = reach;
    else if (r < 0.6) dy = -reach;
    else if (r < 0.76) dy = reach;
    const s = 0.72 + Math.random() * 0.2;
    return `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${s.toFixed(3)})`;
  };

  const visualChildren = (p: Element): Element[] =>
    Array.from(p.children).filter(c => !SKIP_TAGS.has(c.tagName.toLowerCase()));

  const containsText = (g: Element): boolean =>
    Array.from(g.children).some(c => {
      const t = c.tagName.toLowerCase();
      return t === 'text' || t === 'textpath';
    });

  // Collect every element to animate, in document (assembly) order.
  const units: SVGElement[] = [];

  // Recurse a container's children. `skipLeadingRect` keeps a leading <rect>
  // static (a background / a generator's base fill) so the rest assemble onto it.
  const collectContainer = (container: Element, skipLeadingRect: boolean): void => {
    const kids = visualChildren(container);
    const start = skipLeadingRect && kids.length && kids[0].tagName.toLowerCase() === 'rect' ? 1 : 0;
    for (let k = start; k < kids.length; k++) collect(kids[k]);
  };

  const collect = (node: Element): void => {
    if (SKIP_TAGS.has(node.tagName.toLowerCase())) return;
    if (node.tagName.toLowerCase() === 'g' && !containsText(node) && visualChildren(node).length >= 1) {
      // Recurse so the pattern's shapes assemble. Skip the base fill only on a
      // clip-path region group (where the base fill lives); plain wrapper groups
      // (transforms/nesting) pass straight through.
      collectContainer(node, node.hasAttribute('clip-path'));
      return;
    }
    units.push(node as SVGElement);
  };

  // Root: skip the composition's leading background rect so the page never gaps.
  collectContainer(svg, true);

  // Spread the staggered starts across a fixed window, independent of count.
  const total = units.length;
  units.forEach((el, idx) => {
    el.style.transformBox = 'fill-box'; // transforms relative to the element's own box
    el.style.transformOrigin = 'center';
    el.style.setProperty('--t0', startTransform());
    const delay = total <= 1 ? 0 : (idx / (total - 1)) * ANIM_WINDOW;
    el.style.animation = `design-in ${ANIM_DUR}s cubic-bezier(.2, .7, .25, 1) ${delay.toFixed(3)}s both`;
  });
}

/**
 * Renders a design. The hash is `#<seed>`, or `#<seed>~<composition>` to force a
 * specific composition (used by the debug gallery's "open full page" links).
 */
function generate(hash = newSeed()): void {
  location.hash = hash;
  const [seed, composition] = hash.split('~');
  // Text/script can be pinned via query params (e.g. ?title=My%20Book&byline=...)
  // so a design can be previewed with specific copy. These persist across the
  // refresh button (the seed changes; the query string stays).
  const {text, script} = parseTextParams(new URLSearchParams(location.search));
  const svg = buildDesign(seed, window.innerWidth, window.innerHeight, {
    composition,
    text,
    script,
  });
  animateIn(svg);
  const stage = document.getElementById('stage');
  if (stage) mount(stage, svg);
}

function init(): void {
  const button = document.getElementById('refresh');
  // Refresh always makes a fresh random design (no forced composition).
  button?.addEventListener('click', () => generate());
  const hash = location.hash.slice(1);
  generate(hash || undefined);
}

init();
