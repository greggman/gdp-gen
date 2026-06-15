/**
 * Cones: one to a few cones (peaks / spikes / traffic-cones) at a dramatic angle.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {Face, Vec3} from '../render3d/engine.js';
import {cone} from '../render3d/shapes.js';
import {drawObjects} from './_object3d.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const count = rng.int(1, 4);
  const seg = rng.int(16, 28);
  const faces: Face[] = [];
  let maxTop = 0;
  let r = 0;
  for (let i = 0; i < count; i++) {
    const rad = rng.range(2, 4.5);
    const h = rng.range(5, 14);
    const x = rng.range(-7, 7);
    const z = rng.range(-5, 5);
    faces.push(...cone([x, h / 2, z] as Vec3, rad, h, seg));
    maxTop = Math.max(maxTop, h);
    r = Math.max(r, Math.hypot(x, z) + rad);
  }
  return drawObjects(ctx, bounds, faces, {center: [0, 0, 0], radius: Math.max(6, r), topY: maxTop});
}

registerGenerator({name: 'cones', category: 'object', weight: 2, render});
