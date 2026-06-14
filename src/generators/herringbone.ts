/**
 * Herringbone parquet: rectangular planks laid in the classic interlocking
 * 90-degree zigzag. Built by walking diagonal bands and alternating each plank
 * between a horizontal-leaning and vertical-leaning orientation, drawn as a
 * rotated group so planks meet at right angles.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const tones: Color[] = [fg, palette.primary, palette.accent];
  // Plank length scaled to width; plank width is a third of that.
  const lengthDivs = rng.int(4, 8);
  const len = bounds.w / lengthDivs;
  const wid = len / rng.range(2.6, 3.4);
  const gap = Math.max(0.5, wid * rng.range(0.03, 0.08));

  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  // Rotate the whole field 45deg so the herringbone reads diagonally.
  const rot = svgEl('g', {transform: `rotate(45 ${cx} ${cy})`});
  const diag = Math.hypot(bounds.w, bounds.h);
  const step = wid + len; // a column of one H + one V plank repeats every step
  const cols = Math.ceil(diag / wid) + 2;
  const rows = Math.ceil(diag / step) + 2;
  let placed = 0;
  for (let r = -rows; r < rows && placed < 1400; r++) {
    for (let c = -cols; c < cols && placed < 1400; c++) {
      const baseX = cx - diag / 2 + c * wid;
      const baseY = cy - diag / 2 + r * step + (c & 1 ? len / 2 : 0);
      // Horizontal plank then vertical plank stacked.
      const fill = rng.pick(tones);
      rot.appendChild(
        svgEl('rect', {
          x: baseX + gap / 2,
          y: baseY + gap / 2,
          width: wid - gap,
          height: len - gap,
          fill,
        }),
      );
      placed++;
    }
  }
  g.appendChild(rot);
  return g;
}

registerGenerator({name: 'herringbone', category: 'tiling', weight: 2, render});
