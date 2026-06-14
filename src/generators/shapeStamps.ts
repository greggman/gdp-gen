/**
 * Shape stamps: a single repeated icon (star, plus, drop, lozenge, ring)
 * stamped on a jittered grid, like rubber-stamp wrapping paper. One motif per
 * design keeps it graphic and cohesive.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

type Icon = 'star' | 'plus' | 'drop' | 'lozenge' | 'ring' | 'spark';

type IconTag = 'path' | 'polygon' | 'circle';

function iconPath(icon: Icon, s: number): {tag: IconTag; attrs: Record<string, string | number>} {
  switch (icon) {
    case 'star': {
      let d = '';
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? s : s * 0.45;
        d += (i === 0 ? 'M' : 'L') + (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r).toFixed(1);
      }
      return {tag: 'path', attrs: {d: d + 'Z'}};
    }
    case 'plus':
      return {
        tag: 'path',
        attrs: {d: `M ${-s} ${-s * 0.34} H ${-s * 0.34} V ${-s} H ${s * 0.34} V ${-s * 0.34} H ${s} V ${s * 0.34} H ${s * 0.34} V ${s} H ${-s * 0.34} V ${s * 0.34} H ${-s} Z`},
      };
    case 'drop':
      return {tag: 'path', attrs: {d: `M 0 ${-s} C ${s} ${-s * 0.2} ${s * 0.7} ${s} 0 ${s} C ${-s * 0.7} ${s} ${-s} ${-s * 0.2} 0 ${-s} Z`}};
    case 'lozenge':
      return {tag: 'polygon', attrs: {points: `0 ${-s} ${s * 0.7} 0 0 ${s} ${-s * 0.7} 0`}};
    case 'ring':
      return {tag: 'circle', attrs: {cx: 0, cy: 0, r: s * 0.75}};
    case 'spark':
      return {tag: 'path', attrs: {d: `M 0 ${-s} L ${s * 0.18} ${-s * 0.18} L ${s} 0 L ${s * 0.18} ${s * 0.18} L 0 ${s} L ${-s * 0.18} ${s * 0.18} L ${-s} 0 L ${-s * 0.18} ${-s * 0.18} Z`}};
  }
}

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const inks: Color[] = [palette.primary, palette.accent, palette.colors[2] ?? palette.primary];
  const icon = rng.pick(['star', 'plus', 'drop', 'lozenge', 'ring', 'spark'] as const);
  const cols = rng.int(4, 10);
  const cw = bounds.w / cols;
  const rows = Math.max(2, Math.round(bounds.h / cw));
  const rh = bounds.h / rows;
  const s = Math.min(cw, rh) * rng.range(0.26, 0.4);
  const stroke = icon === 'ring';
  const sw = s * rng.range(0.2, 0.35);
  const jitter = Math.min(cw, rh) * 0.12;
  if (cols * rows > 1400) return g;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rng.chance(0.06)) continue;
      const cx = bounds.x + cw * (c + 0.5) + rng.gaussian(0, jitter);
      const cy = bounds.y + rh * (r + 0.5) + rng.gaussian(0, jitter);
      const rot = rng.int(0, 360);
      const color = rng.pick(inks);
      const spec = iconPath(icon, s);
      const attrs: Record<string, string | number> = {...spec.attrs};
      if (stroke) {
        attrs.fill = 'none';
        attrs.stroke = color;
        attrs['stroke-width'] = sw.toFixed(1);
      } else {
        attrs.fill = color;
      }
      const node = svgEl('g', {transform: `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})`});
      node.appendChild(svgEl(spec.tag, attrs));
      g.appendChild(node);
    }
  }
  return g;
}

registerGenerator({name: 'shape-stamps', category: 'memphis', weight: 2, render});
