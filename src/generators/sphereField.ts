/**
 * Sphere field: a grid of faceted spheres, either resting on the ground or
 * floating on a plane, receding in perspective.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {Face, Vec3} from '../render3d/engine.js';
import {sphere} from '../render3d/shapes.js';
import {drawObjects} from './_object3d.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const n = rng.int(3, 6);
  const r = 2.2;
  const step = r * rng.range(2.4, 3.4);
  const extent = n * step;
  const lat = rng.int(7, 10);
  const lon = rng.int(10, 16);
  const yc = r; // rest on the ground plane
  const faces: Face[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x = (i - (n - 1) / 2) * step;
      const z = (j - (n - 1) / 2) * step;
      faces.push(...sphere([x, yc, z] as Vec3, r, lat, lon));
    }
  }
  return drawObjects(ctx, bounds, faces, {center: [0, 0, 0], radius: extent * 0.6, topY: r * 2});
}

registerGenerator({name: 'sphere-field', category: 'object', weight: 2, render});
