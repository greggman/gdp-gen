/**
 * HUD rings: concentric circles with tick marks, arc segments and crosshairs,
 * like a sci-fi heads-up display or targeting reticle.
 */
import {registerGenerator} from '../core/registry.js';
import {contrastRatio} from '../color/contrast.js';
import {DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg} = palettePair(ctx, rng);
  // Pick the highest-contrast line color against the chosen background so the
  // fine reticle reads clearly rather than washing out.
  const fg = [palette.primary, palette.accent, palette.text, palette.background]
    .map(c => ({c, k: contrastRatio(c, bg)}))
    .sort((a, b) => b.k - a.k)[0].c;
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cx = bounds.x + bounds.w * rng.range(0.35, 0.65);
  const cy = bounds.y + bounds.h * rng.range(0.35, 0.65);
  const maxR = Math.hypot(bounds.w, bounds.h) * rng.range(0.55, 0.8);
  const rings = rng.int(4, 8);
  const stroke = Math.max(1.2, Math.min(bounds.w, bounds.h) * 0.006);

  let dRings = '';
  for (let i = 1; i <= rings; i++) {
    const r = (maxR / rings) * i;
    dRings += `M${(cx - r).toFixed(1)} ${cy.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(r * 2).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-r * 2).toFixed(1)} 0`;
  }
  g.appendChild(
    svgEl('path', {d: dRings, fill: 'none', stroke: fg, 'stroke-width': stroke.toFixed(2), 'stroke-opacity': '0.85'}),
  );

  // Radial ticks around the outer ring.
  const ticks = rng.pick([24, 36, 48, 60]);
  const innerR = maxR * rng.range(0.86, 0.94);
  let dTicks = '';
  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * Math.PI * 2;
    const long = i % rng.pick([3, 4, 6]) === 0;
    const r0 = long ? innerR * 0.9 : innerR;
    dTicks += `M${(cx + Math.cos(a) * r0).toFixed(1)} ${(cy + Math.sin(a) * r0).toFixed(1)}L${(cx + Math.cos(a) * maxR).toFixed(1)} ${(cy + Math.sin(a) * maxR).toFixed(1)}`;
  }
  g.appendChild(svgEl('path', {d: dTicks, fill: 'none', stroke: fg, 'stroke-width': stroke.toFixed(2)}));

  // Crosshair lines through the center.
  g.appendChild(
    svgEl('path', {
      d: `M${(cx - maxR).toFixed(1)} ${cy.toFixed(1)}h${(maxR * 2).toFixed(1)}M${cx.toFixed(1)} ${(cy - maxR).toFixed(1)}v${(maxR * 2).toFixed(1)}`,
      fill: 'none',
      stroke: fg,
      'stroke-width': (stroke * 0.7).toFixed(2),
      'stroke-opacity': '0.6',
    }),
  );

  // Bright accent arc segments.
  const accent = contrastRatio(palette.accent, bg) >= 2 ? palette.accent : fg;
  const arcs = rng.int(2, 4);
  for (let i = 0; i < arcs; i++) {
    const r = (maxR / rings) * rng.int(1, rings);
    const a0 = rng.next() * Math.PI * 2;
    const sweep = rng.range(0.4, 1.4);
    const a1 = a0 + sweep;
    g.appendChild(
      svgEl('path', {
        d: `M${(cx + Math.cos(a0) * r).toFixed(1)} ${(cy + Math.sin(a0) * r).toFixed(1)}A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(cx + Math.cos(a1) * r).toFixed(1)} ${(cy + Math.sin(a1) * r).toFixed(1)}`,
        fill: 'none',
        stroke: accent,
        'stroke-width': (stroke * 2.6).toFixed(2),
        'stroke-linecap': 'round',
      }),
    );
  }
  return g;
}

registerGenerator({name: 'hud-rings', category: 'techno', weight: 2, render});
