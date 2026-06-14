/**
 * Polygon shatter: the region cracks into angular shards radiating from an impact
 * point, like shattered glass. Random rays from the impact define wedge sectors,
 * and each sector is sliced into nested rings, producing concentric bands of
 * triangular shards. Alternating fills make the fracture pattern pop.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const alt = palette.accent === fg ? palette.primary : palette.accent;
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cx = bounds.x + rng.range(0.3, 0.7) * bounds.w;
  const cy = bounds.y + rng.range(0.3, 0.7) * bounds.h;
  const reach = Math.hypot(bounds.w, bounds.h);

  // Random radial cracks: sorted angles around the impact.
  const rayCount = rng.int(9, 16);
  const angles: number[] = [];
  for (let i = 0; i < rayCount; i++) angles.push(rng.range(0, Math.PI * 2));
  angles.sort((a, b) => a - b);

  // Concentric crack rings (fractions of the reach) defining shard bands.
  const ringCount = rng.int(3, 6);
  const rings = [0];
  for (let i = 1; i <= ringCount; i++) {
    rings.push((i / ringCount) * reach * rng.range(0.85, 1.15));
  }

  const fills = [fg, alt];
  for (let a = 0; a < angles.length; a++) {
    const a0 = angles[a];
    const a1 = angles[(a + 1) % angles.length] + (a + 1 === angles.length ? Math.PI * 2 : 0);
    const j0 = a0 + rng.range(-0.05, 0.05);
    const j1 = a1 + rng.range(-0.05, 0.05);
    for (let ri = 0; ri < rings.length - 1; ri++) {
      const r0 = rings[ri];
      const r1 = rings[ri + 1] * rng.range(0.92, 1.06);
      const p1x = cx + Math.cos(j0) * r0;
      const p1y = cy + Math.sin(j0) * r0;
      const p2x = cx + Math.cos(j1) * r0;
      const p2y = cy + Math.sin(j1) * r0;
      const p3x = cx + Math.cos(j1) * r1;
      const p3y = cy + Math.sin(j1) * r1;
      const p4x = cx + Math.cos(j0) * r1;
      const p4y = cy + Math.sin(j0) * r1;
      const pts =
        r0 === 0
          ? `${cx.toFixed(1)},${cy.toFixed(1)} ${p3x.toFixed(1)},${p3y.toFixed(1)} ${p4x.toFixed(1)},${p4y.toFixed(1)}`
          : `${p1x.toFixed(1)},${p1y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)} ${p3x.toFixed(1)},${p3y.toFixed(1)} ${p4x.toFixed(1)},${p4y.toFixed(1)}`;
      g.appendChild(
        svgEl('polygon', {
          points: pts,
          fill: fills[(a + ri) % 2],
          stroke: bg,
          'stroke-width': Math.max(1, reach * 0.003),
        }),
      );
    }
  }
  return g;
}

registerGenerator({name: 'polygon-shatter', category: 'digital', weight: 2, render});
