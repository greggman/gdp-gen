/**
 * Waveform: an audio-style amplitude display. Evenly spaced vertical bars,
 * mirrored about a horizontal center line, with heights drawn from a smoothly
 * varying envelope so the silhouette reads as a recorded signal.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cy = bounds.y + bounds.h / 2;
  const count = rng.int(40, 90);
  const slot = bounds.w / count;
  const barW = slot * rng.range(0.45, 0.7);
  const gap = (slot - barW) / 2;
  const maxAmp = bounds.h * 0.46;

  // Smooth envelope: sum of a few sine components plus per-bar jitter.
  const f1 = rng.range(2, 5);
  const f2 = rng.range(6, 12);
  const phase1 = rng.range(0, Math.PI * 2);
  const phase2 = rng.range(0, Math.PI * 2);

  let d = '';
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const env =
      0.35 +
      0.4 * Math.abs(Math.sin(t * f1 * Math.PI + phase1)) +
      0.25 * Math.abs(Math.sin(t * f2 * Math.PI + phase2));
    const amp = Math.max(slot * 0.6, env * maxAmp * rng.range(0.7, 1));
    const x = (bounds.x + i * slot + gap).toFixed(2);
    const top = (cy - amp).toFixed(2);
    const fullH = (amp * 2).toFixed(2);
    d += `M${x} ${top}h${barW.toFixed(2)}v${fullH}h-${barW.toFixed(2)}z`;
  }
  g.appendChild(svgEl('path', {d, fill: fg}));
  return g;
}

registerGenerator({name: 'waveform', category: 'digital', weight: 2, render});
