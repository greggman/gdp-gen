/**
 * Cube field: a regular grid of cubes (optionally with slight height jitter)
 * receding in perspective -- ordered, rhythmic, op-art-meets-3D.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {Face, Vec3} from '../render3d/engine.js';
import {box} from '../render3d/shapes.js';
import {drawObjects} from './_object3d.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const n = rng.int(4, 7);
  const size = 3;
  const step = size * rng.range(1.4, 2.2);
  const extent = n * step;
  const jitter = rng.chance(0.5);
  const faces: Face[] = [];
  let maxTop = size;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const h = jitter ? size * rng.range(0.5, 2.2) : size;
      const x = (i - (n - 1) / 2) * step;
      const z = (j - (n - 1) / 2) * step;
      faces.push(...box([x, h / 2, z] as Vec3, size, h, size));
      maxTop = Math.max(maxTop, h);
    }
  }
  return drawObjects(ctx, bounds, faces, {center: [0, 0, 0], radius: extent * 0.6, topY: maxTop});
}

registerGenerator({name: 'cube-field', category: 'object', weight: 2, render});
