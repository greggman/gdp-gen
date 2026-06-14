/**
 * Shaded topographic relief: a value-noise height field is sliced into bands by
 * elevation. Each successive elevation band is filled with the foreground color
 * stacked at increasing opacity, so higher ground reads darker/heavier -- a
 * layered relief map with bold elevation steps.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  // Sum a few sine "ridges" at random orientations for a smooth height field.
  const waves = rng.int(4, 7);
  const wa: number[] = [];
  const wfx: number[] = [];
  const wfy: number[] = [];
  const wp: number[] = [];
  for (let i = 0; i < waves; i++) {
    const ang = rng.range(0, Math.PI * 2);
    const freq = rng.range(1.5, 5.5) / Math.max(bounds.w, bounds.h);
    wa.push(rng.range(0.5, 1));
    wfx.push(Math.cos(ang) * freq * Math.PI * 2);
    wfy.push(Math.sin(ang) * freq * Math.PI * 2);
    wp.push(rng.range(0, Math.PI * 2));
  }
  const height = (x: number, y: number): number => {
    let h = 0;
    for (let i = 0; i < waves; i++) h += wa[i] * Math.sin(x * wfx[i] + y * wfy[i] + wp[i]);
    return h;
  };

  const aspect = bounds.w / bounds.h;
  const gridW = Math.max(40, Math.round(Math.sqrt(2600 * aspect)));
  const gridH = Math.max(40, Math.round(2600 / gridW));
  const cw = bounds.w / gridW;
  const ch = bounds.h / gridH;

  let lo = Infinity;
  let hi = -Infinity;
  const field = new Float64Array(gridW * gridH);
  for (let r = 0; r < gridH; r++) {
    const y = bounds.y + (r + 0.5) * ch;
    for (let c = 0; c < gridW; c++) {
      const v = height(bounds.x + (c + 0.5) * cw, y);
      field[r * gridW + c] = v;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  }

  const levels = rng.int(6, 9);
  for (let lvl = 1; lvl < levels; lvl++) {
    const threshold = lo + ((hi - lo) * lvl) / levels;
    // Each band stacks fg on top of the one below it, so opacity accumulates.
    const opacity = (0.32 + 0.4 * (lvl / levels)).toFixed(2);
    let d = '';
    for (let r = 0; r < gridH; r++) {
      for (let c = 0; c < gridW; c++) {
        if (field[r * gridW + c] < threshold) continue;
        const x = (bounds.x + c * cw).toFixed(1);
        const y = (bounds.y + r * ch).toFixed(1);
        d += `M${x} ${y}h${(cw + 0.6).toFixed(1)}v${(ch + 0.6).toFixed(1)}h${(-cw - 0.6).toFixed(1)}z`;
      }
    }
    if (d) g.appendChild(svgEl('path', {d, fill: fg, 'fill-opacity': opacity}));
  }
  return g;
}

registerGenerator({name: 'topographic-relief', category: 'organic', weight: 2, render});
