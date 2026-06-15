/**
 * Cylinders: one to a few cylinders (columns / discs / cans) at a dramatic
 * angle, posterized onto the palette.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {Face, Vec3} from '../render3d/engine.js';
import {cylinder} from '../render3d/shapes.js';
import {drawObjects} from './_object3d.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const count = rng.int(2, 4);
  const seg = rng.int(18, 30);
  const faces: Face[] = [];
  let maxTop = 0;
  let r = 0;
  for (let i = 0; i < count; i++) {
    const rad = rng.range(1.6, 4);
    // Mix tall columns and squat discs.
    const h = rng.chance(0.5) ? rng.range(7, 16) : rng.range(1.5, 4);
    const x = rng.range(-7, 7);
    const z = rng.range(-5, 5);
    const center: Vec3 = [x, h / 2, z];
    faces.push(...cylinder(center, rad, h, seg));
    maxTop = Math.max(maxTop, h);
    r = Math.max(r, Math.hypot(x, z) + rad);
  }
  return drawObjects(ctx, bounds, faces, {center: [0, 0, 0], radius: Math.max(6, r), topY: maxTop});
}

registerGenerator({name: 'cylinders', category: 'object', weight: 2, render});
