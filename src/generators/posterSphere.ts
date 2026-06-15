/**
 * Poster sphere: one (or a few) faceted spheres rendered with posterized,
 * palette-mapped shading -- a bold graphic orb floating off-centre.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {Face, Vec3} from '../render3d/engine.js';
import {sphere} from '../render3d/shapes.js';
import {drawObjects} from './_object3d.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const faces: Face[] = [];
  // Chunky facets read more "graphic" than a smooth ball.
  const lat = rng.int(7, 12);
  const lon = rng.int(10, 18);

  if (rng.chance(0.6)) {
    faces.push(...sphere([0, 0, 0], 6, lat, lon));
    return drawObjects(ctx, bounds, faces, {center: [0, 0, 0], radius: 7, topY: 6});
  }
  // A small constellation of spheres.
  const n = rng.int(2, 4);
  let r = 0;
  for (let i = 0; i < n; i++) {
    const rad = rng.range(2.5, 5);
    const x = rng.range(-7, 7);
    const y = rng.range(-4, 4);
    const z = rng.range(-5, 5);
    faces.push(...sphere([x, y, z] as Vec3, rad, lat, lon));
    r = Math.max(r, Math.hypot(x, z) + rad);
  }
  return drawObjects(ctx, bounds, faces, {center: [0, 0, 0], radius: Math.max(7, r), topY: 6});
}

registerGenerator({name: 'poster-sphere', category: 'object', weight: 2, render});
