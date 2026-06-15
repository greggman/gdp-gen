/**
 * A tiny perspective 3D engine that renders flat-shaded faceted solids as SVG
 * polygons. No external libraries, no GPU -- just vector math, a pinhole camera,
 * painter's-algorithm depth sorting, and quantized (posterized) shading mapped
 * onto the design's palette.
 *
 * Real perspective (not isometric) is the point: a low camera looking up a stack
 * of tall boxes gives the dramatic converging verticals that read as graphic
 * design rather than a technical diagram.
 */
import {Color, DesignContext, Rect} from '../core/types.js';
import {svgEl} from '../core/renderer.js';

export type Vec3 = [number, number, number];

/** A flat polygon in world space (vertex winding doesn't matter -- shading
 * orients the normal toward the camera, and depth sort handles occlusion). */
export interface Face {
  pts: Vec3[];
}

export interface Camera {
  eye: Vec3;
  target: Vec3;
  /** Vertical field of view in radians. Small = telephoto, large = wide-angle. */
  fovY: number;
  up?: Vec3;
}

export interface SceneOptions {
  /** Direction the light travels FROM (world space); shading uses its inverse. */
  light?: Vec3;
  /** Color ramp from shadow (index 0) to highlight (last); shading is quantized
   * into these steps -- this is the posterize + gradient-map in one. */
  ramp: Color[];
  /** Optional edge outline color for a bold graphic silhouette. */
  outline?: Color;
  outlineWidth?: number;
  /** Ambient floor so shadowed faces aren't pure ramp[0]. 0..1. */
  ambient?: number;
}

/* ----------------------------- vector math ----------------------------- */

export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export function normalize(a: Vec3): Vec3 {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

/* ------------------------------ rendering ------------------------------ */

interface Projected {
  x: number;
  y: number;
  inFront: boolean;
}

interface CamBasis {
  eye: Vec3;
  right: Vec3;
  up: Vec3;
  forward: Vec3;
  f: number; // focal length factor = 1 / tan(fovY/2)
  aspect: number;
}

function basis(cam: Camera, bounds: Rect): CamBasis {
  const forward = normalize(sub(cam.target, cam.eye));
  const worldUp = cam.up ?? [0, 1, 0];
  let right = cross(forward, worldUp);
  if (Math.hypot(...right) < 1e-6) right = [1, 0, 0]; // looking straight up/down
  right = normalize(right);
  const up = cross(right, forward);
  return {
    eye: cam.eye,
    right,
    up,
    forward,
    f: 1 / Math.tan(cam.fovY / 2),
    aspect: bounds.w / bounds.h,
  };
}

/** Projects a world point to screen pixels within `bounds`. */
function project(p: Vec3, cb: CamBasis, bounds: Rect): Projected {
  const rel = sub(p, cb.eye);
  const depth = dot(rel, cb.forward); // distance in front of the camera
  if (depth <= 0.02) return {x: 0, y: 0, inFront: false};
  const vx = dot(rel, cb.right);
  const vy = dot(rel, cb.up);
  const ndcX = ((cb.f / cb.aspect) * vx) / depth;
  const ndcY = (cb.f * vy) / depth;
  return {
    x: bounds.x + (ndcX * 0.5 + 0.5) * bounds.w,
    y: bounds.y + (1 - (ndcY * 0.5 + 0.5)) * bounds.h,
    inFront: true,
  };
}

/** Average camera-space depth of a face (smaller = closer). */
function faceDepth(face: Face, cb: CamBasis): number {
  let s = 0;
  for (const p of face.pts) s += dot(sub(p, cb.eye), cb.forward);
  return s / face.pts.length;
}

function faceCenter(face: Face): Vec3 {
  let c: Vec3 = [0, 0, 0];
  for (const p of face.pts) c = add(c, p);
  return scale(c, 1 / face.pts.length);
}

/**
 * Renders `faces` through the camera into an SVG <g> (caller clips/positions).
 * Faces are sorted far-to-near and flat-shaded into the quantized palette ramp.
 */
export function renderScene(
  ctx: DesignContext,
  bounds: Rect,
  faces: Face[],
  cam: Camera,
  opts: SceneOptions,
): SVGGElement {
  const cb = basis(cam, bounds);
  const lightDir = normalize(opts.light ?? [-0.4, -0.8, -0.5]);
  const toLight = scale(lightDir, -1);
  const ramp = opts.ramp;
  const ambient = opts.ambient ?? 0.3;

  interface Drawable {
    pts: Projected[];
    depth: number;
    fill: Color;
  }
  const drawables: Drawable[] = [];

  for (const face of faces) {
    const pts = face.pts.map(p => project(p, cb, bounds));
    if (pts.some(p => !p.inFront)) continue; // simple near-plane cull
    // Orient the normal toward the camera so shading is winding-independent.
    let n = normalize(
      cross(sub(face.pts[1], face.pts[0]), sub(face.pts[2], face.pts[0])),
    );
    const toCam = normalize(sub(cb.eye, faceCenter(face)));
    if (dot(n, toCam) < 0) n = scale(n, -1);
    const lit = Math.max(0, dot(n, toLight));
    const intensity = ambient + (1 - ambient) * lit;
    const idx = Math.min(ramp.length - 1, Math.max(0, Math.round(intensity * (ramp.length - 1))));
    drawables.push({pts, depth: faceDepth(face, cb), fill: ramp[idx]});
  }

  drawables.sort((a, b) => b.depth - a.depth); // far first

  const g = svgEl('g');
  for (const d of drawables) {
    const points = d.pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const attrs: Record<string, string | number> = {points, fill: d.fill};
    if (opts.outline) {
      attrs.stroke = opts.outline;
      attrs['stroke-width'] = opts.outlineWidth ?? 1;
      attrs['stroke-linejoin'] = 'round';
    }
    g.appendChild(svgEl('polygon', attrs));
  }
  return g;
}
