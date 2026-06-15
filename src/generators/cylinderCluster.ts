/**
 * Cylinder cluster: a tight pack of cylinders at varied heights and radii -- a
 * pipe-organ / bar-chart / column-hall composition, shot in perspective.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {Face, Vec3} from '../render3d/engine.js';
import {cylinder} from '../render3d/shapes.js';
import {drawObjects} from './_object3d.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const seg = rng.int(16, 26);
  const faces: Face[] = [];
  let maxTop = 0;
  let r = 0;
  // Either a packed row (organ pipes) or a small cluster.
  const row = rng.chance(0.5);
  const count = rng.int(5, 9);
  for (let i = 0; i < count; i++) {
    const rad = rng.range(1, 2.2);
    const h = rng.range(4, 16);
    let x: number;
    let z: number;
    if (row) {
      x = (i - (count - 1) / 2) * rng.range(2.4, 3);
      z = rng.range(-0.6, 0.6);
    } else {
      x = rng.range(-7, 7);
      z = rng.range(-5, 5);
    }
    faces.push(...cylinder([x, h / 2, z] as Vec3, rad, h, seg));
    maxTop = Math.max(maxTop, h);
    r = Math.max(r, Math.hypot(x, z) + rad);
  }
  return drawObjects(ctx, bounds, faces, {center: [0, 0, 0], radius: Math.max(7, r), topY: maxTop});
}

registerGenerator({name: 'cylinder-cluster', category: 'object', weight: 2, render});
