/**
 * Oscilloscope: glowing traces sweeping across a dark screen. Each trace is a
 * smooth polyline built from summed sinusoids (a Lissajous-flavored signal),
 * drawn twice -- a thick translucent halo under a bright thin core -- to fake the
 * phosphor glow of a CRT scope. A faint center axis grounds the readout.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  // Faint axis line through the vertical center.
  const cy = bounds.y + bounds.h / 2;
  g.appendChild(
    svgEl('line', {
      x1: bounds.x,
      y1: cy,
      x2: bounds.x + bounds.w,
      y2: cy,
      stroke: fg,
      'stroke-width': Math.max(1, bounds.h * 0.004),
      'stroke-opacity': 0.18,
    }),
  );

  const traceCount = rng.int(1, 3);
  const steps = Math.min(220, Math.max(80, Math.round(bounds.w / 4)));
  const ampMax = bounds.h * 0.4;
  const haloW = Math.max(3, bounds.h * 0.02);
  const coreW = Math.max(1, bounds.h * 0.006);

  for (let s = 0; s < traceCount; s++) {
    const f1 = rng.int(1, 6);
    const f2 = rng.int(1, 4);
    const p1 = rng.range(0, Math.PI * 2);
    const p2 = rng.range(0, Math.PI * 2);
    const a1 = rng.range(0.5, 1);
    const a2 = rng.range(0, 0.5);
    const amp = ampMax * rng.range(0.55, 1);

    let d = '';
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = bounds.x + t * bounds.w;
      const y =
        cy +
        amp *
          (a1 * Math.sin(t * f1 * Math.PI * 2 + p1) +
            a2 * Math.sin(t * f2 * Math.PI * 2 + p2)) /
          (a1 + a2 || 1);
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    g.appendChild(
      svgEl('path', {
        d,
        fill: 'none',
        stroke: fg,
        'stroke-width': haloW,
        'stroke-opacity': 0.3,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }),
    );
    g.appendChild(
      svgEl('path', {
        d,
        fill: 'none',
        stroke: fg,
        'stroke-width': coreW,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }),
    );
  }
  return g;
}

registerGenerator({name: 'oscilloscope', category: 'digital', weight: 2, render});
