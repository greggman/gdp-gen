/**
 * Circular text: a large generator medallion dominates the canvas, off-centre,
 * with supporting text running around its rim on a circular <textPath>. A giant
 * label sits in a corner and a bold color plane backs the whole thing -- a
 * stamp / seal / record-label look (Reid Miles meets Designers Republic).
 */
import {registerComposition} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {drawHeadline, measureWidth} from '../typography/fitText.js';
import {AA_LARGE, ensureContrast} from '../color/contrast.js';
import {
  displaySize,
  fillBackground,
  heavyWeight,
  isRtl,
  textBundle,
  textStyle,
} from './_composition.js';

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;

  // Bold full-bleed color plane behind everything.
  const planeColor = rng.chance(0.5) ? palette.primary : palette.accent;
  fillBackground(ctx, planeColor);

  // The medallion: huge, between 62% and 92% of the smaller dimension, pushed
  // off-centre to create asymmetric tension and active negative space.
  const minDim = Math.min(ctx.width, ctx.height);
  const radius = minDim * rng.range(0.31, 0.46);
  const cx = ctx.width * rng.range(0.34, 0.66);
  const cy = ctx.height * rng.range(0.36, 0.64);

  // Clip a generator texture into the disc -- the generator is the protagonist.
  const clipId = `medallion-${rng.int(1, 1e9)}`;
  const defs = ctx.el('defs');
  const clip = ctx.el('clipPath', {id: clipId});
  clip.appendChild(ctx.el('circle', {cx, cy, r: radius}));
  defs.appendChild(clip);
  ctx.root.appendChild(defs);

  const discRect: Rect = {x: cx - radius, y: cy - radius, w: radius * 2, h: radius * 2};
  const disc = ctx.group();
  disc.setAttribute('clip-path', `url(#${clipId})`);
  ctx.fillRegion(discRect, disc);

  const bundle = textBundle(ctx);
  if (!bundle) {
    // No text: ring the disc with bold concentric rings for graphic punch.
    const rings = rng.int(2, 4);
    for (let i = 0; i < rings; i++) {
      ctx.root.appendChild(
        ctx.el('circle', {
          cx,
          cy,
          r: radius + minDim * 0.02 * (i + 1),
          fill: 'none',
          stroke: i % 2 ? palette.background : planeColor === palette.primary ? palette.accent : palette.primary,
          'stroke-width': minDim * 0.012,
        }),
      );
    }
    return;
  }

  const rtl = isRtl(ctx);

  // A solid ring band, concentric with the disc, that the rim text sits in. The
  // band width and the text's path radius are chosen so the glyphs are vertically
  // centred within the band and fully contained -- never poking past either edge.
  const ringColor = planeColor === palette.primary ? palette.accent : palette.primary;
  const bandText = ensureContrast(palette.background, ringColor, AA_LARGE);
  const fontSize = radius * rng.range(0.1, 0.14);
  const bandW = fontSize * 1.7;
  const annInner = radius;
  const annOuter = radius + bandW;
  // Put the text path on the band's mid-line and let dominant-baseline="central"
  // centre the glyph box on it -- font/script independent (Latin caps and CJK
  // full-em glyphs both end up vertically centred in the band).
  const pathR = radius + bandW / 2;

  const annPath =
    `M${cx - annOuter} ${cy} a${annOuter} ${annOuter} 0 1 0 ${annOuter * 2} 0 a${annOuter} ${annOuter} 0 1 0 ${-annOuter * 2} 0 Z ` +
    `M${cx - annInner} ${cy} a${annInner} ${annInner} 0 1 0 ${annInner * 2} 0 a${annInner} ${annInner} 0 1 0 ${-annInner * 2} 0 Z`;
  ctx.root.appendChild(ctx.el('path', {d: annPath, fill: ringColor, 'fill-rule': 'evenodd'}));

  // One continuous circular path (clockwise, starting at the top) carrying the
  // rim text repeated enough times to fill the ring evenly.
  const rimStyle = textStyle(ctx, fontSize, heavyWeight(ctx));
  const ringPathId = `ring-${rng.int(1, 1e9)}`;
  const ringDefs = ctx.el('defs');
  ringDefs.appendChild(
    ctx.el('path', {
      id: ringPathId,
      d:
        `M${cx} ${cy - pathR} A${pathR} ${pathR} 0 1 1 ${cx} ${cy + pathR} ` +
        `A${pathR} ${pathR} 0 1 1 ${cx} ${cy - pathR}`,
      fill: 'none',
    }),
  );
  ctx.root.appendChild(ringDefs);

  const unit = `${bundle.sub} · ${bundle.label} · `;
  const circumference = 2 * Math.PI * pathR;
  const unitW = Math.max(1, measureWidth(unit, rimStyle));
  const reps = Math.max(1, Math.round(circumference / unitW));
  const textEl = ctx.el('text', {
    'font-family': rimStyle.family,
    'font-size': rimStyle.size,
    'font-weight': rimStyle.weight,
    fill: bandText,
    'letter-spacing': fontSize * 0.04,
    'dominant-baseline': 'central',
  });
  if (rimStyle.lang) textEl.setAttribute('xml:lang', rimStyle.lang);
  const tp = ctx.el('textPath', {});
  tp.setAttribute('href', `#${ringPathId}`);
  tp.setAttribute('startOffset', '0');
  tp.textContent = unit.repeat(reps);
  textEl.appendChild(tp);
  ctx.root.appendChild(textEl);

  // EXTREME SCALE CONTRAST: a giant headline word bleeding off a bottom corner,
  // overlapping the plane for type x graphic interaction.
  const head = bundle.headline.split(/\s+/)[0] || bundle.headline;
  const corner = rng.chance(0.5);
  const hw = ctx.width * 0.96;
  drawHeadline(
    ctx,
    {
      x: corner ? ctx.width * 0.04 : ctx.width * 0.0,
      y: ctx.height * 0.82,
      w: hw,
      h: ctx.height * 0.16,
    },
    head,
    textStyle(ctx, displaySize(ctx, rng.range(0.14, 0.2)), heavyWeight(ctx)),
    {
      mode: 'bleed',
      backing: true,
      bg: palette.background,
      align: rtl ? 'end' : corner ? 'start' : 'middle',
    },
  );
}

registerComposition({name: 'circular-text', weight: 2, render});
