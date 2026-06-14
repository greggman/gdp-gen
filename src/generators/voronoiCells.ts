/**
 * Voronoi-like cell partition: scatter seed points, then assign every pixel of
 * a coarse sampling grid to its nearest seed, producing irregular organic cells.
 * Cells are emitted as filled grid quads grouped per color into single paths so
 * the DOM stays light even at high resolution.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const swatches: Color[] = [
    palette.primary,
    palette.accent,
    palette.background,
    palette.colors[0] ?? palette.primary,
    palette.colors[2] ?? palette.accent,
    palette.colors[4] ?? palette.primary,
  ];

  // Seed points, count scaled by area but capped for sanity.
  const area = bounds.w * bounds.h;
  const seedCount = Math.max(6, Math.min(40, Math.round(area / 9000)));
  const sx: number[] = [];
  const sy: number[] = [];
  const sColor: Color[] = [];
  for (let i = 0; i < seedCount; i++) {
    sx.push(bounds.x + rng.next() * bounds.w);
    sy.push(bounds.y + rng.next() * bounds.h);
    sColor.push(rng.pick(swatches));
  }

  // Sampling grid: keep total cells well under the node cap.
  const cells = Math.min(2400, Math.round(area / 90));
  const aspect = bounds.w / bounds.h;
  const gridW = Math.max(8, Math.round(Math.sqrt(cells * aspect)));
  const gridH = Math.max(8, Math.round(cells / gridW));
  const cw = bounds.w / gridW;
  const ch = bounds.h / gridH;

  // Accumulate quad rects per seed color into single path strings.
  const paths = new Map<Color, string>();
  for (let r = 0; r < gridH; r++) {
    const cy = bounds.y + (r + 0.5) * ch;
    for (let c = 0; c < gridW; c++) {
      const cx = bounds.x + (c + 0.5) * cw;
      let best = 0;
      let bestD = Infinity;
      for (let s = 0; s < seedCount; s++) {
        const dx = cx - sx[s];
        const dy = cy - sy[s];
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
      const color = sColor[best];
      const x = (bounds.x + c * cw).toFixed(1);
      const y = (bounds.y + r * ch).toFixed(1);
      const w = cw.toFixed(1);
      const h = ch.toFixed(1);
      paths.set(color, (paths.get(color) ?? '') + `M${x} ${y}h${w}v${h}h${-w}z`);
    }
  }

  for (const [color, d] of paths) {
    g.appendChild(svgEl('path', {d, fill: color}));
  }
  return g;
}

registerGenerator({name: 'voronoi-cells', category: 'organic', weight: 2, render});
