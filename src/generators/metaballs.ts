/**
 * Metaballs: a scalar field summed from several circular charges and thresholded
 * twice -- an outer body and an inner core -- so the result reads as distinct
 * blobs gooey-ly merging, with a highlighted center, rather than one flat mass.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const core = palette.accent === fg ? palette.primary : palette.accent;
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const minDim = Math.min(bounds.w, bounds.h);
  const ballCount = rng.int(5, 10);
  const bx: number[] = [];
  const by: number[] = [];
  const br: number[] = [];
  for (let i = 0; i < ballCount; i++) {
    bx.push(bounds.x + rng.range(0.12, 0.88) * bounds.w);
    by.push(bounds.y + rng.range(0.12, 0.88) * bounds.h);
    // Smaller radii so blobs stay separate enough to read as several shapes.
    br.push(minDim * rng.range(0.08, 0.18));
  }

  const area = bounds.w * bounds.h;
  const cells = Math.min(4200, Math.round(area / 60));
  const aspect = bounds.w / bounds.h;
  const gridW = Math.max(20, Math.round(Math.sqrt(cells * aspect)));
  const gridH = Math.max(20, Math.round(cells / gridW));
  const cw = bounds.w / gridW;
  const ch = bounds.h / gridH;

  // Field: sum of r^2/(d^2+1). A single ball contributes ~1 at its own radius,
  // so an absolute threshold near 1 yields blobs of about that size that merge
  // where they overlap; a higher threshold carves out the inner core.
  const field = new Float64Array(gridW * gridH);
  for (let r = 0; r < gridH; r++) {
    const cy = bounds.y + (r + 0.5) * ch;
    for (let c = 0; c < gridW; c++) {
      const cx = bounds.x + (c + 0.5) * cw;
      let sum = 0;
      for (let i = 0; i < ballCount; i++) {
        const dx = cx - bx[i];
        const dy = cy - by[i];
        sum += (br[i] * br[i]) / (dx * dx + dy * dy + 1);
      }
      field[r * gridW + c] = sum;
    }
  }

  const tBody = rng.range(0.8, 1.2);
  const tCore = rng.range(2.2, 3.6);
  const emit = (threshold: number, fill: string) => {
    let d = '';
    for (let r = 0; r < gridH; r++) {
      for (let c = 0; c < gridW; c++) {
        if (field[r * gridW + c] < threshold) continue;
        const x = (bounds.x + c * cw).toFixed(1);
        const y = (bounds.y + r * ch).toFixed(1);
        d += `M${x} ${y}h${(cw + 0.6).toFixed(1)}v${(ch + 0.6).toFixed(1)}h${(-cw - 0.6).toFixed(1)}z`;
      }
    }
    if (d) g.appendChild(svgEl('path', {d, fill}));
  };

  emit(tBody, fg);
  emit(tCore, core);
  return g;
}

registerGenerator({name: 'metaballs', category: 'organic', weight: 2, render});
