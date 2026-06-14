/**
 * Radial focal: a central focal element (a textured disc or solid medallion)
 * with the headline anchored on it and supporting lines radiating outward to
 * the four edges. Inspired by record labels, festival hubs, and concentric
 * techno-cover artwork.
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext} from '../core/types.js';
import {center, inset} from '../layout/geometry.js';
import {drawHeadline} from '../typography/fitText.js';
import {
  block,
  displaySize,
  fillBackground,
  heavyWeight,
  isRtl,
  margin,
  textBundle,
  textStyle,
} from './_composition.js';

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  fillBackground(ctx);

  const c = center(ctx.bounds());
  const minDim = Math.min(ctx.width, ctx.height);
  // With no text the medallion is the whole show, so make it larger and bolder.
  const noText = !ctx.text.enabled;
  const radius = minDim * (noText ? rng.range(0.36, 0.46) : rng.range(0.26, 0.34));

  // Concentric ring backdrop for radiating energy (heavier when text-less).
  const rings = noText ? rng.int(4, 7) : rng.int(2, 4);
  for (let i = rings; i >= 1; i--) {
    const rr = radius * (1 + i * (noText ? 0.28 : 0.45));
    ctx.root.appendChild(
      ctx.el('circle', {
        cx: c.x,
        cy: c.y,
        r: rr,
        fill: 'none',
        stroke: i % 2 ? palette.accent : palette.primary,
        'stroke-width': Math.max(1, minDim * (noText ? 0.012 : 0.004)),
        opacity: noText ? 0.85 : 0.5,
      }),
    );
  }

  // Central focal disc: a clipped texture or a solid medallion (always textured
  // when there is no text, so the centre carries detail).
  const useTexture = noText ? true : rng.chance(0.6);
  if (useTexture) {
    const clipId = `focal-${ctx.rng.int(0, 1e9)}`;
    const clip = ctx.el('clipPath', {id: clipId});
    clip.appendChild(ctx.el('circle', {cx: c.x, cy: c.y, r: radius}));
    ctx.root.appendChild(clip);
    const g = ctx.group();
    g.setAttribute('clip-path', `url(#${clipId})`);
    ctx.fillRegion({x: c.x - radius, y: c.y - radius, w: radius * 2, h: radius * 2}, g);
  } else {
    ctx.root.appendChild(
      ctx.el('circle', {cx: c.x, cy: c.y, r: radius, fill: palette.primary}),
    );
  }

  const bundle = textBundle(ctx);
  if (!bundle) return; // The radial graphic is complete on its own.

  const rtl = isRtl(ctx);
  const discBg = useTexture ? palette.background : palette.primary;

  // Headline on the disc. Over texture it needs a solid backing band.
  drawHeadline(
    ctx,
    {x: c.x - radius, y: c.y - radius * 0.3, w: radius * 2, h: radius * 0.6},
    bundle.headline,
    textStyle(ctx, radius * 0.34, heavyWeight(ctx)),
    useTexture
      ? {mode: 'bleed', backing: true, bg: palette.background, align: 'middle'}
      : {bg: discBg, fill: palette.background, align: 'middle'},
  );

  // Radiating lines: top, bottom, plus a label.
  const m = margin(ctx, 0.06);
  const align = rtl ? 'end' : 'start';

  // Top line.
  drawHeadline(
    ctx,
    {x: m, y: m, w: ctx.width - m * 2, h: minDim * 0.07},
    bundle.sub,
    textStyle(ctx, displaySize(ctx, 0.04), heavyWeight(ctx)),
    {bg: palette.background, fill: palette.primary, align: 'middle'},
  );

  // Bottom line over an accent strip.
  const stripH = minDim * 0.09;
  const strip = {x: 0, y: ctx.height - stripH, w: ctx.width, h: stripH};
  block(ctx, strip, palette.accent);
  drawHeadline(
    ctx,
    inset(strip, m, stripH * 0.2),
    `${bundle.english ?? bundle.sub} · ${bundle.label}`,
    textStyle(ctx, stripH * 0.45, heavyWeight(ctx)),
    {bg: palette.accent, fill: palette.background, align},
  );
}

registerComposition({name: 'radial-focal', weight: 2, render});
