/**
 * Spectrum bars: a graphic-equalizer display. Each frequency column is a stack
 * of small lit segments rising from the bottom to a per-column level, with a
 * detached "peak hold" segment floating just above -- the classic LED meter.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const peakColor = palette.accent === fg ? palette.primary : palette.accent;
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(10, 22);
  const slot = bounds.w / cols;
  const barW = slot * rng.range(0.55, 0.78);
  const colGap = (slot - barW) / 2;

  const segCount = rng.int(12, 22);
  const segGap = bounds.h * 0.012;
  const segH = (bounds.h - segGap * (segCount + 1)) / segCount;

  let bars = '';
  let peaks = '';
  for (let c = 0; c < cols; c++) {
    const level = Math.max(1, Math.round(rng.range(0.15, 1) * segCount));
    const x = bounds.x + c * slot + colGap;
    for (let s = 0; s < level; s++) {
      const y = bounds.y + bounds.h - segGap - (s + 1) * (segH + segGap) + segGap;
      bars += `M${x.toFixed(2)} ${y.toFixed(2)}h${barW.toFixed(2)}v${segH.toFixed(2)}h-${barW.toFixed(2)}z`;
    }
    // Peak-hold marker a couple segments above the live level.
    const peakSeg = Math.min(segCount, level + rng.int(1, 3));
    const py =
      bounds.y + bounds.h - segGap - peakSeg * (segH + segGap) + segGap;
    peaks += `M${x.toFixed(2)} ${py.toFixed(2)}h${barW.toFixed(2)}v${segH.toFixed(2)}h-${barW.toFixed(2)}z`;
  }
  g.appendChild(svgEl('path', {d: bars, fill: fg}));
  g.appendChild(svgEl('path', {d: peaks, fill: peakColor}));
  return g;
}

registerGenerator({name: 'spectrum-bars', category: 'digital', weight: 2, render});
