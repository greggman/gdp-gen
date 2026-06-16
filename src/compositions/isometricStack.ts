/**
 * Isometric stack: a tower of stacked isometric blocks (a generator texture skews
 * into each face) climbs the canvas off-centre, dwarfed by a colossal headline
 * that bleeds across the field. Bauhaus-meets-Designers-Republic dimensional
 * blocking: bold flat planes, extreme scale contrast, deliberate asymmetry.
 */
import {registerComposition} from '../core/registry.js';
import {Color, DesignContext} from '../core/types.js';
import {drawHeadlineFit, drawLine} from '../typography/fitText.js';
import {
  displaySize,
  fillBackground,
  heavyWeight,
  isRtl,
  margin,
  regionFill,
  textBundle,
  textStyle,
} from './_composition.js';

/** Builds an SVG polygon points string. */
function poly(pts: Array<[number, number]>): string {
  return pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

function render(ctx: DesignContext): void {
  const {rng, palette} = ctx;
  const {width: W, height: H} = ctx;

  const bgIsDark = rng.chance(0.5);
  const bg: Color = bgIsDark ? palette.primary : palette.background;
  fillBackground(ctx, bg);

  // Geometry of the isometric tower: an off-centre column of cubes.
  const tall = H >= W;
  const cubeW = (tall ? W * rng.range(0.32, 0.46) : Math.min(W, H) * rng.range(0.32, 0.44));
  const depth = cubeW * 0.5; // isometric run for top/side faces.
  const cubeH = cubeW * rng.range(0.34, 0.5); // front-face height.
  const count = rng.int(3, tall ? 6 : 4);

  // Anchor the stack hard to one side, biting the edge.
  const fromLeft = rng.chance(0.5);
  const baseX = fromLeft ? W * rng.range(-0.04, 0.12) : W * rng.range(0.5, 0.66);
  // Base of the lowest cube sits low; stack climbs upward.
  const baseY = H * rng.range(0.78, 0.96);

  const topFill: Color = regionFill(ctx, rng);
  const sideFill: Color = bgIsDark ? palette.background : palette.primary;

  // Stamp the tower from bottom to top so upper cubes overlap lower ones.
  const stack = ctx.group();
  for (let i = 0; i < count; i++) {
    // Each cube rises by its full front height (minus the depth so faces meet).
    const fx = baseX + (fromLeft ? 0 : 0);
    const fy = baseY - i * cubeH - i * 0; // front-top-left of cube i.
    const frontTopY = fy - cubeH;
    // Front face rectangle: the generator protagonist fills it.
    const front = {x: fx, y: frontTopY, w: cubeW, h: cubeH};
    ctx.fillRegion(front, stack);

    // Top face: a skewed parallelogram receding back-and-up.
    const topPts: Array<[number, number]> = [
      [fx, frontTopY],
      [fx + depth, frontTopY - depth],
      [fx + cubeW + depth, frontTopY - depth],
      [fx + cubeW, frontTopY],
    ];
    stack.appendChild(
      ctx.el('polygon', {
        points: poly(topPts),
        fill: i % 2 ? topFill : palette.accent,
      }),
    );

    // Side face on the receding edge.
    const sideX = fx + cubeW;
    const sidePts: Array<[number, number]> = [
      [sideX, frontTopY],
      [sideX + depth, frontTopY - depth],
      [sideX + depth, frontTopY - depth + cubeH],
      [sideX, frontTopY + cubeH],
    ];
    stack.appendChild(
      ctx.el('polygon', {points: poly(sidePts), fill: sideFill}),
    );

    // A thin contour keeps the cube edges crisp against the texture.
    const edge = bgIsDark ? palette.background : palette.primary;
    stack.appendChild(
      ctx.el('rect', {
        x: front.x,
        y: front.y,
        width: front.w,
        height: front.h,
        fill: 'none',
        stroke: edge,
        'stroke-width': Math.max(1.5, cubeW * 0.012),
      }),
    );
  }

  const bundle = textBundle(ctx);
  if (!bundle) return;

  const rtl = isRtl(ctx);

  // Colossal headline bleeds across the canvas, overlapping the tower, backed by
  // a solid band so it cuts cleanly through both texture and flat planes.
  const bandColor: Color = rng.chance(0.5) ? palette.accent : sideFill;
  // A generous box on a backing band; fit-to-box wraps the headline to fill it so
  // it stays huge AND readable in any aspect. The box is wider than the canvas so
  // the type still bleeds to the edges.
  const headBandH = H * rng.range(0.3, 0.42);
  const headY = fromLeft ? H * rng.range(0.06, 0.16) : H - headBandH - H * rng.range(0.06, 0.16);
  drawHeadlineFit(
    ctx,
    {x: -W * 0.05, y: headY, w: W * 1.1, h: headBandH},
    bundle.headline,
    textStyle(ctx, H * 0.32, heavyWeight(ctx)),
    {backing: true, bg: bandColor, align: rtl ? 'end' : 'start'},
  );

  // Vertical edition label stamped up the empty flank -- active negative space.
  const m = margin(ctx, 0.05);
  const labelSize = displaySize(ctx, 0.03);
  const lx = fromLeft ? W - m : m;
  const cy = H * 0.5;
  const lg = ctx.group();
  lg.setAttribute('transform', `rotate(${fromLeft ? -90 : 90} ${lx} ${cy})`);
  drawLine(ctx, lx, cy, `${bundle.label} · ${bundle.sub}`, textStyle(ctx, labelSize, heavyWeight(ctx)), {
    bg,
    fill: palette.text,
    minContrast: 4.5,
    anchor: 'middle',
    parent: lg,
  });
}

registerComposition({name: 'isometric-stack', weight: 2, render});
