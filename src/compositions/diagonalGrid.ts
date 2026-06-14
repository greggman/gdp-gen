/**
 * Diagonal grid: a regular grid of textured tiles rotated as a whole around the
 * canvas center, so the modules slice across the frame at an angle. The grid is
 * oversized to cover the corners after rotation. Text sits upright on a solid
 * panel so it stays readable against the tilted field. Inspired by dynamic
 * concert and techno posters.
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext} from '../core/types.js';
import {gridCells} from '../layout/grid.js';
import {drawHeadline} from '../typography/fitText.js';
import {
  block,
  displaySize,
  fillBackground,
  heavyWeight,
  isRtl,
  margin,
  regionFill,
  textBundle,
  textStyle,
} from './_composition.js';

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  fillBackground(ctx);

  const cx = ctx.width / 2;
  const cy = ctx.height / 2;
  const angle = rng.range(-28, 28);

  // Oversize the grid so rotation never reveals the background at the corners.
  const span = Math.hypot(ctx.width, ctx.height) * 1.25;
  const field = {x: cx - span / 2, y: cy - span / 2, w: span, h: span};
  const n = rng.int(5, 8);
  const gap = span * rng.range(0.004, 0.012);
  const cells = gridCells(field, n, n, gap);

  const g = ctx.group();
  g.setAttribute('transform', `rotate(${angle} ${cx} ${cy})`);

  cells.forEach(cell => {
    if (rng.chance(0.5)) {
      ctx.fillRegion(cell, g);
    } else {
      block(ctx, cell, regionFill(ctx, rng), g);
    }
  });

  const bundle = textBundle(ctx);
  if (!bundle) return;

  // Upright text panel near the center for legibility over the tilt.
  const m = margin(ctx, 0.07);
  const panelH = ctx.height * rng.range(0.22, 0.32);
  const panel = {x: m, y: cy - panelH / 2, w: ctx.width - m * 2, h: panelH};
  block(ctx, panel, palette.background);

  const pad = Math.min(panel.w, panel.h) * 0.08;
  const align = isRtl(ctx) ? 'end' : 'start';

  drawHeadline(
    ctx,
    {x: panel.x + pad, y: panel.y + pad, w: panel.w - pad * 2, h: panel.h * 0.55},
    bundle.headline,
    textStyle(ctx, displaySize(ctx, 0.08), heavyWeight(ctx)),
    {bg: palette.background, fill: palette.primary, align},
  );

  drawHeadline(
    ctx,
    {
      x: panel.x + pad,
      y: panel.y + panel.h * 0.6,
      w: panel.w - pad * 2,
      h: panel.h * 0.3,
    },
    `${bundle.sub} · ${bundle.label}`,
    textStyle(ctx, displaySize(ctx, 0.032), heavyWeight(ctx)),
    {bg: palette.background, fill: palette.accent, align},
  );
}

registerComposition({name: 'diagonal-grid', weight: 2, render});
