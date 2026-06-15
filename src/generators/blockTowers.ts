/**
 * Block towers: a few tall boxes ("buildings") shot with a perspective camera --
 * usually a worm's-eye view looking up, so the verticals converge dramatically.
 * The quintessential "this is graphic design, not a diagram" 3D object.
 */
import {registerGenerator} from '../core/registry.js';
import {DesignContext, Rect} from '../core/types.js';
import {Face, Vec3} from '../render3d/engine.js';
import {box} from '../render3d/shapes.js';
import {drawObjects} from './_object3d.js';

function render(ctx: DesignContext, bounds: Rect): SVGElement {
  const {rng} = ctx;
  const count = rng.int(2, 5);
  const spread = 10;
  const faces: Face[] = [];
  let maxTop = 0;
  let sx = 0;
  let sz = 0;
  for (let i = 0; i < count; i++) {
    const w = rng.range(2, 4);
    const d = rng.range(2, 4);
    const h = rng.range(8, 20); // tall
    const x = rng.range(-spread / 2, spread / 2);
    const z = rng.range(-spread / 2, spread / 2);
    const center: Vec3 = [x, h / 2, z];
    faces.push(...box(center, w, h, d));
    maxTop = Math.max(maxTop, h);
    sx += x;
    sz += z;
  }
  return drawObjects(ctx, bounds, faces, {
    center: [sx / count, 0, sz / count],
    radius: spread * 0.8,
    topY: maxTop,
  });
}

registerGenerator({name: 'block-towers', category: 'object', weight: 2, render});
