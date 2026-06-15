/**
 * Scene helpers shared by the 3D object generators: building a posterized color
 * ramp from the palette (so rendered solids harmonize), and picking dramatic
 * perspective cameras (worm's-eye, wide-angle) that make the objects read as
 * graphic design rather than technical diagrams.
 */
import {hslCss, parseColor, rgbToHsl} from '../color/colorSpaces.js';
import {Rng} from '../core/rng.js';
import {Color, DesignContext} from '../core/types.js';
import {Camera, Vec3} from './engine.js';

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * A quantized shadow->highlight ramp on a single palette hue. Feeding shading
 * through this posterizes AND gradient-maps the solid onto the palette in one
 * step, so 3D objects never clash with the design's colors.
 */
export function paletteRamp(ctx: DesignContext, rng: Rng, steps: number): Color[] {
  const p = ctx.palette;
  const src = rng.chance(0.5) ? p.primary : p.accent;
  const base = parseColor(src) ?? {r: 110, g: 110, b: 190};
  const {h, s} = rgbToHsl(base);
  const sat = clamp(s, 32, 85);
  const loL = rng.range(13, 26);
  const hiL = rng.range(74, 92);
  const out: Color[] = [];
  for (let i = 0; i < steps; i++) {
    const t = steps === 1 ? 0.5 : i / (steps - 1);
    // Desaturate the highlights slightly -- a more natural, less plasticky ramp.
    out.push(hslCss({h, s: sat * (1 - t * 0.35), l: loL + (hiL - loL) * t}));
  }
  return out;
}

/** Horizontal extent and top height of the scene, for camera placement. */
export interface SceneInfo {
  center: Vec3; // use x/z; y is ignored
  radius: number; // horizontal radius
  topY: number; // tallest point
}

type Style = 'worm' | 'low3q' | 'high3q' | 'wide';

/** Picks a dramatic perspective camera around the scene. */
export function pickCamera(rng: Rng, s: SceneInfo): Camera {
  const az = rng.range(0, Math.PI * 2);
  const style = rng.weighted<Style>(['worm', 'low3q', 'high3q', 'wide'], [3, 3, 2, 2]);
  const R = s.radius;
  const big = Math.max(s.topY, R);

  let dist: number;
  let eyeY: number;
  let targetY: number;
  let fovY: number;
  switch (style) {
    case 'worm': // low, looking up -> converging verticals
      dist = R * rng.range(1.1, 1.8);
      eyeY = big * rng.range(0.02, 0.22);
      targetY = s.topY * rng.range(0.6, 0.95);
      fovY = rad(rng.range(62, 86));
      break;
    case 'wide': // close + very wide angle -> exaggerated perspective
      dist = R * rng.range(0.9, 1.4);
      eyeY = big * rng.range(0.1, 0.5);
      targetY = s.topY * rng.range(0.35, 0.7);
      fovY = rad(rng.range(78, 98));
      break;
    case 'high3q': // raised, looking down
      dist = R * rng.range(1.7, 2.5);
      eyeY = big * rng.range(1.0, 1.9);
      targetY = s.topY * rng.range(0.2, 0.45);
      fovY = rad(rng.range(40, 56));
      break;
    default: // low3q: classic three-quarter
      dist = R * rng.range(1.6, 2.4);
      eyeY = big * rng.range(0.25, 0.6);
      targetY = s.topY * rng.range(0.35, 0.6);
      fovY = rad(rng.range(38, 56));
  }

  const eye: Vec3 = [s.center[0] + Math.cos(az) * dist, eyeY, s.center[2] + Math.sin(az) * dist];
  const target: Vec3 = [s.center[0], targetY, s.center[2]];
  return {eye, target, fovY};
}

/** A light direction biased to come from above-and-to-one-side. */
export function pickLight(rng: Rng): Vec3 {
  return [rng.range(-0.7, 0.7), -rng.range(0.5, 1), rng.range(-0.7, 0.7)];
}
