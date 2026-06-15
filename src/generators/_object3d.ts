/**
 * Shared scaffolding for the 3D "object" generators: clip + background, then
 * render a set of world-space faces through a dramatic perspective camera with
 * palette-mapped posterized shading.
 */
import {Color, DesignContext, Rect} from '../core/types.js';
import {Face, renderScene} from '../render3d/engine.js';
import {paletteRamp, pickCamera, pickLight, SceneInfo} from '../render3d/scene.js';
import {baseFill, clipped} from './_generator.js';

export interface ObjectOptions {
  /** Background ("sky") color; defaults to the palette background. */
  bg?: Color;
  /** Force/suppress edge outlines (default: random). */
  outline?: boolean;
}

/** Renders `faces` into `bounds` as a finished generator group. */
export function drawObjects(
  ctx: DesignContext,
  bounds: Rect,
  faces: Face[],
  info: SceneInfo,
  opts: ObjectOptions = {},
): SVGGElement {
  const {rng, palette} = ctx;
  const g = clipped(ctx, bounds);
  baseFill(g, bounds, opts.bg ?? palette.background);

  const ramp = paletteRamp(ctx, rng, rng.int(4, 6));
  const cam = pickCamera(rng, info);
  const light = pickLight(rng);
  const wantOutline = opts.outline ?? rng.chance(0.5);
  const outline = wantOutline ? palette.text : undefined;
  const outlineWidth = Math.max(1, Math.min(bounds.w, bounds.h) * 0.004);

  g.appendChild(
    renderScene(ctx, bounds, faces, cam, {
      ramp,
      light,
      outline,
      outlineWidth,
      ambient: rng.range(0.25, 0.4),
    }),
  );
  return g;
}
