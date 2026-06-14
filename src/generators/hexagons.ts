/**
 * Honeycomb: a grid of pointy-top hexagons packed in offset rows. Cells are
 * filled with two alternating palette colors, with occasional accent cells for
 * variety. All hex outlines are merged into a single stroke path.
 */
import {registerGenerator} from '../core/registry.js';
import {Color, DesignContext, Rect} from '../core/types.js';
import {baseFill, clipped, palettePair, svgEl} from './_generator.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng, palette} = ctx;
  const {bg, fg} = palettePair(ctx, rng);
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, bg);

  const accent = palette.accent;
  // Hex radius scaled to area, capped to keep node count tasteful.
  const cols = rng.int(4, 9);
  const r = bounds.w / (cols * Math.sqrt(3));
  const hexW = Math.sqrt(3) * r;
  const vStep = r * 1.5;
  const rows = Math.ceil(bounds.h / vStep) + 1;

  // Pointy-top hex corner offsets from center.
  const corners: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    corners.push([r * Math.cos(a), r * Math.sin(a)]);
  }

  const accentChance = rng.range(0.05, 0.18);
  for (let row = -1; row < rows; row++) {
    const offset = (row & 1) === 1 ? hexW / 2 : 0;
    const cx0 = bounds.x - hexW + offset;
    const cy = bounds.y + row * vStep;
    const cells = Math.ceil(bounds.w / hexW) + 2;
    for (let c = 0; c < cells; c++) {
      const cx = cx0 + c * hexW;
      let fill: Color = (row + c) % 2 === 0 ? fg : bg;
      if (rng.chance(accentChance)) fill = accent;
      let pts = '';
      for (const [dx, dy] of corners) {
        pts += `${(cx + dx).toFixed(2)},${(cy + dy).toFixed(2)} `;
      }
      g.appendChild(svgEl('polygon', {points: pts.trim(), fill}));
    }
  }
  return g;
}

registerGenerator({name: 'hexagons', category: 'tiling', weight: 2, render});
