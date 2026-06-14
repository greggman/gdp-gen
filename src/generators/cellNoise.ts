/**
 * Blocky value-noise grid: a coarse lattice of random values smoothed by bilinear
 * interpolation, sampled onto a finer block grid and quantized into a few palette
 * tones. The result is soft, cloudy banding rendered as blocks, batched into one
 * path per tone.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  // Ramp of tones from background through primary to accent.
  const tones: Color[] = [
    palette.background,
    palette.colors[0] ?? palette.primary,
    palette.primary,
    palette.colors[3] ?? palette.accent,
    palette.accent,
  ];

  // Coarse value lattice.
  const latW = rng.int(3, 6);
  const latH = rng.int(3, 6);
  const lattice: number[] = [];
  for (let i = 0; i < (latW + 1) * (latH + 1); i++) lattice.push(rng.next());
  const valAt = (c: number, r: number) => lattice[r * (latW + 1) + c];
  const smooth = (t: number) => t * t * (3 - 2 * t);

  const area = bounds.w * bounds.h;
  const blocks = Math.min(2200, Math.round(area / 100));
  const aspect = bounds.w / bounds.h;
  const gw = Math.max(12, Math.round(Math.sqrt(blocks * aspect)));
  const gh = Math.max(12, Math.round(blocks / gw));
  const bw = bounds.w / gw;
  const bh = bounds.h / gh;

  const paths = new Map<Color, string>();
  for (let r = 0; r < gh; r++) {
    const gy = (r + 0.5) / gh * latH;
    const r0 = Math.floor(gy);
    const fy = smooth(gy - r0);
    for (let c = 0; c < gw; c++) {
      const gx = (c + 0.5) / gw * latW;
      const c0 = Math.floor(gx);
      const fx = smooth(gx - c0);
      const v00 = valAt(c0, r0);
      const v10 = valAt(c0 + 1, r0);
      const v01 = valAt(c0, r0 + 1);
      const v11 = valAt(c0 + 1, r0 + 1);
      const top = v00 + (v10 - v00) * fx;
      const bot = v01 + (v11 - v01) * fx;
      const v = top + (bot - top) * fy;
      const tone = tones[Math.min(tones.length - 1, Math.floor(v * tones.length))];
      const x = (bounds.x + c * bw).toFixed(1);
      const y = (bounds.y + r * bh).toFixed(1);
      const w = (bw + 0.5).toFixed(1);
      const h = (bh + 0.5).toFixed(1);
      paths.set(tone, (paths.get(tone) ?? '') + `M${x} ${y}h${w}v${h}h${-w}z`);
    }
  }

  for (const [tone, d] of paths) {
    g.appendChild(svgEl('path', {d, fill: tone}));
  }
  return g;
}

registerGenerator({name: 'cell-noise', category: 'organic', weight: 2, render});
