/**
 * Cone field: a grid of cones -- a bed of spikes / mountain range receding in
 * perspective.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {Face, Vec3} from '../render3d/engine.js';
import {cone} from '../render3d/shapes.js';
import {drawObjects} from './_object3d.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const n = rng.int(3, 6);
  const r = 2;
  const step = r * rng.range(2.2, 3.2);
  const extent = n * step;
  const seg = rng.int(12, 22);
  const jitter = rng.chance(0.6);
  const faces: Face[] = [];
  let maxTop = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const h = jitter ? r * rng.range(1.4, 4) : r * 2.6;
      const x = (i - (n - 1) / 2) * step;
      const z = (j - (n - 1) / 2) * step;
      faces.push(...cone([x, h / 2, z] as Vec3, r, h, seg));
      maxTop = Math.max(maxTop, h);
    }
  }
  return drawObjects(ctx, bounds, faces, {center: [0, 0, 0], radius: extent * 0.6, topY: maxTop});
}

registerGenerator({name: 'cone-field', category: 'object', weight: 2, render});
