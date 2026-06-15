/**
 * Block city: a grid of boxes at varied heights -- a tiny skyline. Shot from a
 * raised three-quarter or low angle so the massed blocks recede in perspective.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {Face, Vec3} from '../render3d/engine.js';
import {box} from '../render3d/shapes.js';
import {drawObjects} from './_object3d.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const n = rng.int(3, 6);
  const cell = 4;
  const gap = rng.range(0.4, 1.4);
  const step = cell + gap;
  const extent = n * step;
  const faces: Face[] = [];
  let maxTop = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (rng.chance(0.12)) continue; // a few empty lots
      const h = rng.range(2, 16);
      const w = cell * rng.range(0.6, 0.95);
      const d = cell * rng.range(0.6, 0.95);
      const x = (i - (n - 1) / 2) * step;
      const z = (j - (n - 1) / 2) * step;
      faces.push(...box([x, h / 2, z] as Vec3, w, h, d));
      maxTop = Math.max(maxTop, h);
    }
  }
  return drawObjects(ctx, bounds, faces, {center: [0, 0, 0], radius: extent * 0.62, topY: maxTop});
}

registerGenerator({name: 'block-city', category: 'object', weight: 2, render});
