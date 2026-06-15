/**
 * Faceted-solid builders. Each returns world-space Faces (y is up). Objects that
 * "stand" on the ground are centred so the caller sets center.y = height / 2.
 */
import {Face, Vec3} from './engine.js';

/** Axis-aligned box centred at `c` with full size [w, h, d]. */
export function box(c: Vec3, w: number, h: number, d: number): Face[] {
  const x0 = c[0] - w / 2;
  const x1 = c[0] + w / 2;
  const y0 = c[1] - h / 2;
  const y1 = c[1] + h / 2;
  const z0 = c[2] - d / 2;
  const z1 = c[2] + d / 2;
  const v = (x: number, y: number, z: number): Vec3 => [x, y, z];
  return [
    {pts: [v(x0, y1, z0), v(x1, y1, z0), v(x1, y1, z1), v(x0, y1, z1)]}, // top
    {pts: [v(x0, y0, z1), v(x1, y0, z1), v(x1, y0, z0), v(x0, y0, z0)]}, // bottom
    {pts: [v(x0, y0, z1), v(x0, y1, z1), v(x1, y1, z1), v(x1, y0, z1)]}, // front +z
    {pts: [v(x1, y0, z0), v(x1, y1, z0), v(x0, y1, z0), v(x0, y0, z0)]}, // back -z
    {pts: [v(x1, y0, z1), v(x1, y1, z1), v(x1, y1, z0), v(x1, y0, z0)]}, // right +x
    {pts: [v(x0, y0, z0), v(x0, y1, z0), v(x0, y1, z1), v(x0, y0, z1)]}, // left -x
  ];
}

function ring(cx: number, cz: number, r: number, y: number, seg: number): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    out.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]);
  }
  return out;
}

/** Cylinder centred at `c`, given radius/height and side facets. */
export function cylinder(c: Vec3, r: number, h: number, seg = 24): Face[] {
  const yb = c[1] - h / 2;
  const yt = c[1] + h / 2;
  const bottom = ring(c[0], c[2], r, yb, seg);
  const top = ring(c[0], c[2], r, yt, seg);
  const faces: Face[] = [];
  for (let i = 0; i < seg; i++) {
    const j = (i + 1) % seg;
    faces.push({pts: [bottom[i], bottom[j], top[j], top[i]]});
  }
  faces.push({pts: top});
  faces.push({pts: bottom.slice().reverse()});
  return faces;
}

/** Cone centred at `c` (apex up), given base radius/height and facets. */
export function cone(c: Vec3, r: number, h: number, seg = 24): Face[] {
  const yb = c[1] - h / 2;
  const apex: Vec3 = [c[0], c[1] + h / 2, c[2]];
  const base = ring(c[0], c[2], r, yb, seg);
  const faces: Face[] = [];
  for (let i = 0; i < seg; i++) {
    const j = (i + 1) % seg;
    faces.push({pts: [base[i], base[j], apex]});
  }
  faces.push({pts: base.slice().reverse()});
  return faces;
}

/** Faceted UV sphere centred at `c`. */
export function sphere(c: Vec3, r: number, latSeg = 10, lonSeg = 16): Face[] {
  const faces: Face[] = [];
  const at = (lat: number, lon: number): Vec3 => {
    const theta = (lat / latSeg) * Math.PI; // 0..pi
    const phi = (lon / lonSeg) * Math.PI * 2;
    return [
      c[0] + r * Math.sin(theta) * Math.cos(phi),
      c[1] + r * Math.cos(theta),
      c[2] + r * Math.sin(theta) * Math.sin(phi),
    ];
  };
  for (let i = 0; i < latSeg; i++) {
    for (let j = 0; j < lonSeg; j++) {
      const a = at(i, j);
      const b = at(i, j + 1);
      const cc = at(i + 1, j + 1);
      const d = at(i + 1, j);
      if (i === 0) faces.push({pts: [a, cc, d]}); // top cap triangle
      else if (i === latSeg - 1) faces.push({pts: [a, b, d]}); // bottom cap
      else faces.push({pts: [a, b, cc, d]});
    }
  }
  return faces;
}
