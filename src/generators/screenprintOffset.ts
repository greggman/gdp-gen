/**
 * Misregistered screenprint: bold geometric shapes printed in several ink
 * layers that don't quite line up. Each layer is the same shape set nudged by a
 * small offset in its own spot color, mimicking off-register screenprinting.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

interface Shape {
  kind: 'circle' | 'rect' | 'tri';
  cx: number;
  cy: number;
  r: number;
  rot: number;
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const cols = rng.int(2, 4);
  const cw = bounds.w / cols;
  const rows = Math.max(2, Math.round(bounds.h / cw));
  const ch = bounds.h / rows;
  const shapes: Shape[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rng.chance(0.15)) continue;
      shapes.push({
        kind: rng.pick(['circle', 'rect', 'tri'] as const),
        cx: bounds.x + (c + 0.5) * cw,
        cy: bounds.y + (r + 0.5) * ch,
        r: Math.min(cw, ch) * rng.range(0.32, 0.46),
        rot: rng.int(0, 90),
      });
    }
  }

  // Two or three offset ink layers in distinct colors.
  const inks: Color[] = rng.sample(
    [fg, palette.accent, palette.primary, palette.colors[2] ?? fg],
    rng.int(2, 3),
  );
  const reg = Math.min(cw, ch) * rng.range(0.04, 0.09);
  inks.forEach((ink, idx) => {
    const ang = (idx / inks.length) * Math.PI * 2 + rng.range(0, 1);
    const dx = Math.cos(ang) * reg;
    const dy = Math.sin(ang) * reg;
    const layer = svgEl('g', {
      transform: `translate(${dx.toFixed(1)} ${dy.toFixed(1)})`,
      fill: ink,
      'fill-opacity': idx === inks.length - 1 ? '0.85' : '0.7',
    });
    for (const s of shapes) layer.appendChild(shapeEl(s));
    g.appendChild(layer);
  });
  return g;
}

function shapeEl(s: Shape): SVGElement {
  if (s.kind === 'circle') {
    return svgEl('circle', {cx: s.cx.toFixed(1), cy: s.cy.toFixed(1), r: s.r.toFixed(1)});
  }
  if (s.kind === 'rect') {
    return svgEl('rect', {
      x: (s.cx - s.r).toFixed(1),
      y: (s.cy - s.r).toFixed(1),
      width: (s.r * 2).toFixed(1),
      height: (s.r * 2).toFixed(1),
      transform: `rotate(${s.rot} ${s.cx.toFixed(1)} ${s.cy.toFixed(1)})`,
    });
  }
  const a = `${s.cx.toFixed(1)} ${(s.cy - s.r).toFixed(1)}`;
  const b = `${(s.cx - s.r).toFixed(1)} ${(s.cy + s.r).toFixed(1)}`;
  const c = `${(s.cx + s.r).toFixed(1)} ${(s.cy + s.r).toFixed(1)}`;
  return svgEl('polygon', {
    points: `${a} ${b} ${c}`,
    transform: `rotate(${s.rot} ${s.cx.toFixed(1)} ${s.cy.toFixed(1)})`,
  });
}

registerGenerator({name: 'screenprint-offset', category: 'print', weight: 2, render});
