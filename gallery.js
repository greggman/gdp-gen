"use strict";
(() => {
  // src/color/colorSpaces.ts
  var clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  function hslToRgb({ h, s, l }) {
    const sn = s / 100;
    const ln = l / 100;
    const k = (n) => (n + h / 30) % 12;
    const a = sn * Math.min(ln, 1 - ln);
    const f = (n) => ln - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
  }
  function rgbToHsl({ r, g, b }) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === rn) h = (gn - bn) / d % 6;
      else if (max === gn) h = (bn - rn) / d + 2;
      else h = (rn - gn) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    const l = (max + min) / 2;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    return { h, s: s * 100, l: l * 100 };
  }
  function hslCss({ h, s, l }) {
    return `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`;
  }
  function srgbToLinear(c) {
    const cn = c / 255;
    return cn <= 0.04045 ? cn / 12.92 : ((cn + 0.055) / 1.055) ** 2.4;
  }
  function linearToSrgb(c) {
    const v = c <= 31308e-7 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
    return Math.round(clamp01(v) * 255);
  }
  function oklchToRgb({ l, c, h }) {
    const hr = h * Math.PI / 180;
    const a = c * Math.cos(hr);
    const b = c * Math.sin(hr);
    const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = l - 0.0894841775 * a - 1.291485548 * b;
    const lc = l_ ** 3;
    const mc = m_ ** 3;
    const sc = s_ ** 3;
    const r = 4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc;
    const g = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc;
    const bl = -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc;
    return { r: linearToSrgb(r), g: linearToSrgb(g), b: linearToSrgb(bl) };
  }
  function rgbToOklch({ r, g, b }) {
    const lr = srgbToLinear(r);
    const lg = srgbToLinear(g);
    const lb = srgbToLinear(b);
    const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
    const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
    const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
    const l = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
    const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
    const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
    const c = Math.hypot(a, bb);
    let h = Math.atan2(bb, a) * 180 / Math.PI;
    if (h < 0) h += 360;
    return { l, c, h };
  }
  function parseColor(css) {
    const s = css.trim().toLowerCase();
    const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
    if (hex) {
      const h = hex[1];
      const full = h.length === 3 ? h.replace(/./g, (ch) => ch + ch) : h;
      return {
        r: parseInt(full.slice(0, 2), 16),
        g: parseInt(full.slice(2, 4), 16),
        b: parseInt(full.slice(4, 6), 16)
      };
    }
    const rgb = s.match(/^rgba?\(([^)]+)\)$/);
    if (rgb) {
      const [r, g, b] = rgb[1].split(/[ ,/]+/).map(Number);
      return { r, g, b };
    }
    const hsl = s.match(/^hsla?\(([^)]+)\)$/);
    if (hsl) {
      const parts = hsl[1].split(/[ ,/]+/).map((p) => parseFloat(p));
      return hslToRgb({ h: parts[0], s: parts[1], l: parts[2] });
    }
    return null;
  }

  // src/color/contrast.ts
  var AA_NORMAL = 4.5;
  var AA_LARGE = 3;
  var BLACK = { r: 0, g: 0, b: 0 };
  var WHITE = { r: 255, g: 255, b: 255 };
  function channelLuminance(c) {
    const cn = c / 255;
    return cn <= 0.03928 ? cn / 12.92 : ((cn + 0.055) / 1.055) ** 2.4;
  }
  function relativeLuminance(rgb) {
    return 0.2126 * channelLuminance(rgb.r) + 0.7152 * channelLuminance(rgb.g) + 0.0722 * channelLuminance(rgb.b);
  }
  function toRgb(color) {
    if (typeof color !== "string") return color;
    return parseColor(color) ?? BLACK;
  }
  function contrastRatio(a, b) {
    const la = relativeLuminance(toRgb(a));
    const lb = relativeLuminance(toRgb(b));
    const hi = Math.max(la, lb);
    const lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }
  function isDark(color) {
    return relativeLuminance(toRgb(color)) < 0.4;
  }
  function meetsContrast(fg, bg, min = AA_NORMAL) {
    return contrastRatio(fg, bg) >= min;
  }
  function blackOrWhiteOn(bg) {
    return contrastRatio(WHITE, bg) >= contrastRatio(BLACK, bg) ? "#fff" : "#111";
  }
  function ensureContrast(fg, bg, min = AA_NORMAL) {
    if (meetsContrast(fg, bg, min)) return fg;
    const fgRgb = toRgb(fg);
    const bgDark = isDark(bg);
    const base = rgbToOklch(fgRgb);
    const target = bgDark ? 1 : 0;
    for (let t = 0.1; t <= 1.0001; t += 0.1) {
      const l = base.l + (target - base.l) * t;
      const candidate = oklchToRgb({ l, c: base.c * (1 - t * 0.5), h: base.h });
      if (contrastRatio(candidate, bg) >= min) {
        return `rgb(${candidate.r} ${candidate.g} ${candidate.b})`;
      }
    }
    return blackOrWhiteOn(bg);
  }

  // src/color/palette.ts
  var STRATEGIES = ["monochrome", "analogous", "muted-contrast", "bold-contrast"];
  var STRATEGY_WEIGHTS = [4, 6, 1, 1.8];
  var wrapHue = (h) => (h % 360 + 360) % 360;
  var clampN = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  function generatePalette(rng) {
    const strategy = rng.weighted(STRATEGIES, STRATEGY_WEIGHTS);
    const baseHue = rng.int(0, 359);
    const darkBackground = rng.chance(0.45);
    const bgSat = rng.chance(0.8) ? rng.range(3, 12) : rng.range(13, 24);
    const bgL = darkBackground ? rng.range(6, 15) : rng.range(89, 97);
    const background = hslCss({ h: baseHue, s: bgSat, l: bgL });
    const heroSat = rng.range(58, 90);
    const primaryL = darkBackground ? rng.range(52, 66) : rng.range(30, 44);
    const primary = ensureContrast(
      hslCss({ h: baseHue, s: heroSat, l: primaryL }),
      background,
      AA_LARGE
    );
    const sign = rng.chance(0.5) ? 1 : -1;
    const accentOffset = strategy === "monochrome" ? 0 : strategy === "analogous" ? rng.range(16, 46) * sign : strategy === "muted-contrast" ? rng.pick([150, 165, 195, 210]) : rng.pick([120, 150, 180, 210, 240]);
    const accentHue = wrapHue(baseHue + accentOffset);
    const accentSat = strategy === "muted-contrast" ? heroSat * rng.range(0.22, 0.4) : strategy === "monochrome" ? heroSat * rng.range(0.55, 0.8) : strategy === "bold-contrast" ? heroSat * rng.range(0.82, 1) : heroSat * rng.range(0.6, 0.9);
    const lgap = strategy === "bold-contrast" ? rng.range(22, 36) : rng.range(10, 22);
    const accentL = darkBackground ? clampN(primaryL + lgap, 48, 90) : clampN(primaryL - lgap, 10, 38);
    const accent = ensureContrast(
      hslCss({ h: accentHue, s: accentSat, l: accentL }),
      background,
      AA_LARGE
    );
    const textL = darkBackground ? rng.range(90, 98) : rng.range(6, 15);
    const textTint = { h: baseHue, s: rng.range(5, 16), l: textL };
    const text = ensureContrast(hslCss(textTint), background, AA_NORMAL);
    const swatches = [
      hslCss({ h: baseHue, s: heroSat * 0.85, l: clampN(primaryL + (darkBackground ? 14 : -12), 12, 86) }),
      hslCss({ h: accentHue, s: accentSat * 0.9, l: clampN(accentL + (darkBackground ? -12 : 12), 14, 84) }),
      hslCss({ h: baseHue, s: rng.range(18, 38), l: darkBackground ? rng.range(24, 38) : rng.range(64, 80) })
    ];
    return {
      scheme: strategy,
      colors: [background, primary, accent, ...swatches],
      background,
      primary,
      accent,
      text,
      backgroundIsDark: isDark(background)
    };
  }

  // src/core/renderer.ts
  var SVG_NS = "http://www.w3.org/2000/svg";
  var idCounter = 0;
  function uid(prefix = "id") {
    return `${prefix}-${(idCounter++).toString(36)}`;
  }
  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        el.setAttribute(k, String(v));
      }
    }
    return el;
  }
  function createRoot(width, height) {
    const svg = svgEl("svg", {
      viewBox: `0 0 ${width} ${height}`,
      // Cover the viewport (crop overflow) rather than letterbox, so a design
      // generated at one size still fills the page after a resize.
      preserveAspectRatio: "xMidYMid slice"
    });
    svg.setAttribute("xmlns", SVG_NS);
    return svg;
  }

  // src/core/registry.ts
  var compositions = [];
  var generators = [];
  function registerComposition(...items) {
    compositions.push(...items);
  }
  function registerGenerator(...items) {
    generators.push(...items);
  }
  function allCompositions() {
    return compositions;
  }
  function allGenerators() {
    return generators;
  }
  function weightsOf(items) {
    return items.map((i) => i.weight ?? 1);
  }
  function pickComposition(rng) {
    if (!compositions.length) throw new Error("no compositions registered");
    return rng.weighted(compositions, weightsOf(compositions));
  }
  function pickGenerator(rng, category) {
    const pool = category ? generators.filter((g) => g.category === category) : generators;
    if (!pool.length) throw new Error(`no generators${category ? ` in ${category}` : ""}`);
    return rng.weighted(pool, weightsOf(pool));
  }
  function getGenerator(name) {
    return generators.find((g) => g.name === name);
  }

  // src/core/context.ts
  var Context = class {
    constructor(opts) {
      this.rng = opts.rng;
      this.width = opts.width;
      this.height = opts.height;
      this.palette = opts.palette;
      this.text = opts.text;
      this.root = opts.root;
    }
    bounds() {
      return { x: 0, y: 0, w: this.width, h: this.height };
    }
    el(tag, attrs) {
      return svgEl(tag, attrs);
    }
    group(parent) {
      const g = svgEl("g");
      (parent ?? this.root).appendChild(g);
      return g;
    }
    fillRegion(bounds, parent, name) {
      const gen = name ? getGenerator(name) : safePick(this.rng);
      let node;
      if (gen) {
        node = gen.render(this, bounds);
      } else {
        node = svgEl("rect", {
          x: bounds.x,
          y: bounds.y,
          width: bounds.w,
          height: bounds.h,
          fill: this.palette.primary
        });
      }
      (parent ?? this.root).appendChild(node);
      return node;
    }
  };
  function safePick(rng) {
    try {
      return pickGenerator(rng);
    } catch {
      return void 0;
    }
  }

  // src/core/rng.ts
  function hashSeed(input) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  var Rng = class {
    constructor(seed) {
      this.seed = seed;
      this.state = seed >>> 0 || 1;
    }
    /** Returns a float in [0, 1). */
    next() {
      let t = this.state += 1831565813;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    /** Float in [min, max). */
    range(min, max) {
      return min + this.next() * (max - min);
    }
    /** Integer in [min, max] inclusive. */
    int(min, max) {
      return Math.floor(this.range(min, max + 1));
    }
    /** True with the given probability (default 0.5). */
    chance(probability = 0.5) {
      return this.next() < probability;
    }
    /** Returns a uniformly chosen element. */
    pick(items) {
      return items[Math.floor(this.next() * items.length)];
    }
    /** Returns an element chosen by relative weights (same length as items). */
    weighted(items, weights) {
      let total = 0;
      for (const w of weights) total += w;
      let r = this.next() * total;
      for (let i = 0; i < items.length; i++) {
        r -= weights[i];
        if (r < 0) return items[i];
      }
      return items[items.length - 1];
    }
    /** Approximately Gaussian value via the central-limit trick. */
    gaussian(mean = 0, stdDev = 1) {
      const u = (this.next() + this.next() + this.next() + this.next()) / 4;
      return mean + (u - 0.5) * 2 * Math.sqrt(3) * 2 * stdDev;
    }
    /** Fisher-Yates shuffle returning a new array. */
    shuffle(items) {
      const out = items.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(this.next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    }
    /** Picks `count` distinct elements (or all, if count exceeds length). */
    sample(items, count) {
      return this.shuffle(items).slice(0, Math.min(count, items.length));
    }
  };
  function makeRng(seed) {
    return new Rng(typeof seed === "number" ? seed >>> 0 : hashSeed(seed));
  }

  // src/generators/_generator.ts
  function clipped(ctx, bounds) {
    const id = uid("clip");
    const clip = svgEl("clipPath", { id });
    clip.appendChild(
      svgEl("rect", { x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h })
    );
    const defs = svgEl("defs");
    defs.appendChild(clip);
    const g = svgEl("g", { "clip-path": `url(#${id})` });
    g.appendChild(defs);
    return g;
  }
  function baseFill(g, bounds, color) {
    g.appendChild(
      svgEl("rect", { x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h, fill: color })
    );
  }
  function palettePair(ctx, rng) {
    const p = ctx.palette;
    const options = [
      { bg: p.background, fg: p.primary },
      { bg: p.primary, fg: p.background },
      { bg: p.primary, fg: p.accent },
      { bg: p.accent, fg: p.background },
      { bg: p.background, fg: p.accent },
      { bg: p.accent, fg: p.primary }
    ];
    const viable = options.filter((o) => contrastRatio(o.bg, o.fg) >= 2.8);
    if (viable.length) return rng.pick(viable);
    return options.reduce(
      (best, o) => contrastRatio(o.bg, o.fg) > contrastRatio(best.bg, best.fg) ? o : best
    );
  }

  // src/generators/angularSweep.ts
  function render(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const angle = rng.range(0, Math.PI * 2);
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const x1 = (0.5 - dx * 0.5).toFixed(3);
    const y1 = (0.5 - dy * 0.5).toFixed(3);
    const x2 = (0.5 + dx * 0.5).toFixed(3);
    const y2 = (0.5 + dy * 0.5).toFixed(3);
    const id = uid("sweep");
    const grad = svgEl("linearGradient", { id, x1, y1, x2, y2 });
    const ramp = rng.shuffle([fg, palette.accent, palette.primary, bg]);
    const stops = rng.int(3, ramp.length);
    let t = 0;
    for (let i = 0; i < stops; i++) {
      t = i === stops - 1 ? 1 : t + rng.range(0.5, 1.5) / stops;
      grad.appendChild(
        svgEl("stop", {
          offset: Math.min(1, t).toFixed(3),
          "stop-color": ramp[i % ramp.length]
        })
      );
    }
    const defs = svgEl("defs");
    defs.appendChild(grad);
    g.appendChild(defs);
    g.appendChild(
      svgEl("rect", {
        x: bounds.x,
        y: bounds.y,
        width: bounds.w,
        height: bounds.h,
        fill: `url(#${id})`
      })
    );
    return g;
  }
  registerGenerator({ name: "angular-sweep", category: "gradient", weight: 2, render });

  // src/generators/arcScatter.ts
  function render2(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const inks = [
      palette.primary,
      palette.accent,
      palette.colors[2] ?? palette.primary,
      palette.colors[4] ?? palette.accent
    ];
    const unit = Math.min(bounds.w, bounds.h);
    const area = bounds.w * bounds.h;
    const clusters = Math.min(40, Math.max(3, Math.round(area / (unit * unit * 0.25))));
    for (let c = 0; c < clusters; c++) {
      const cx = bounds.x + rng.next() * bounds.w;
      const cy = bounds.y + rng.next() * bounds.h;
      const angle = rng.int(0, 360);
      const bands = rng.int(3, 6);
      const outer = unit * rng.range(0.12, 0.28);
      const band2 = outer / (bands + 1);
      const node = svgEl("g", { transform: `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${angle})` });
      const order = rng.shuffle(inks);
      for (let b = 0; b < bands; b++) {
        const r = outer - b * band2;
        node.appendChild(
          svgEl("path", {
            d: `M ${(-r).toFixed(1)} 0 A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${r.toFixed(1)} 0`,
            fill: "none",
            stroke: order[b % order.length],
            "stroke-width": (band2 * 0.7).toFixed(1),
            "stroke-linecap": "butt"
          })
        );
      }
      g.appendChild(node);
    }
    return g;
  }
  registerGenerator({ name: "arc-scatter", category: "memphis", weight: 2, render: render2 });

  // src/generators/arrowTiles.ts
  function render3(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(3, 6);
    const w = bounds.w / cols;
    const h = w * 0.9;
    const rows2 = Math.ceil(bounds.h / h) + 2;
    const tip = w * 0.45;
    let d = "";
    for (let r = -1; r < rows2; r++) {
      const offset = r % 2 === 0 ? 0 : w / 2;
      for (let c = -1; c <= cols; c++) {
        const x = bounds.x + c * w + offset;
        const y = bounds.y + r * h;
        const my = y + h / 2;
        d += `M${x} ${y}`;
        d += `L${x + w - tip} ${y}`;
        d += `L${x + w} ${my}`;
        d += `L${x + w - tip} ${y + h}`;
        d += `L${x} ${y + h}`;
        d += `L${x + tip} ${my}`;
        d += "Z";
      }
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    return g;
  }
  registerGenerator({ name: "arrow-tiles", category: "geometric", weight: 2, render: render3 });

  // src/generators/artDecoChevron.ts
  function render4(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const alt = palette.accent === fg ? palette.primary : palette.accent;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const teeth = rng.int(3, 6);
    const toothW = bounds.w / teeth;
    const peak = toothW * rng.range(0.45, 0.8);
    const bandH = bounds.h / rng.int(6, 11);
    const bandsNeeded = Math.ceil((bounds.h + peak) / bandH) + 1;
    for (let b = 0; b < bandsNeeded; b++) {
      const yTop = bounds.y - peak + b * bandH;
      let d = `M${bounds.x.toFixed(1)} ${(yTop + peak).toFixed(1)}`;
      for (let i = 0; i < teeth; i++) {
        const x0 = bounds.x + i * toothW;
        const xm = x0 + toothW / 2;
        const x1 = x0 + toothW;
        d += `L${xm.toFixed(1)} ${yTop.toFixed(1)}`;
        d += `L${x1.toFixed(1)} ${(yTop + peak).toFixed(1)}`;
      }
      const yTopL = yTop + bandH;
      d += `L${(bounds.x + bounds.w).toFixed(1)} ${(yTopL + peak).toFixed(1)}`;
      for (let i = teeth - 1; i >= 0; i--) {
        const x0 = bounds.x + i * toothW;
        const xm = x0 + toothW / 2;
        d += `L${xm.toFixed(1)} ${yTopL.toFixed(1)}`;
        d += `L${x0.toFixed(1)} ${(yTopL + peak).toFixed(1)}`;
      }
      d += "Z";
      g.appendChild(svgEl("path", { d, fill: b % 2 === 0 ? fg : alt }));
    }
    return g;
  }
  registerGenerator({ name: "art-deco-chevron", category: "geometric", weight: 2, render: render4 });

  // src/generators/artDecoFan.ts
  function ring(cx, cy, rIn, rOut, a0, a1) {
    const x0o = cx + rOut * Math.cos(a0);
    const y0o = cy + rOut * Math.sin(a0);
    const x1o = cx + rOut * Math.cos(a1);
    const y1o = cy + rOut * Math.sin(a1);
    const x1i = cx + rIn * Math.cos(a1);
    const y1i = cy + rIn * Math.sin(a1);
    const x0i = cx + rIn * Math.cos(a0);
    const y0i = cy + rIn * Math.sin(a0);
    return `M${x0o.toFixed(1)} ${y0o.toFixed(1)}A${rOut.toFixed(1)} ${rOut.toFixed(1)} 0 0 1 ${x1o.toFixed(1)} ${y1o.toFixed(1)}L${x1i.toFixed(1)} ${y1i.toFixed(1)}A${rIn.toFixed(1)} ${rIn.toFixed(1)} 0 0 0 ${x0i.toFixed(1)} ${y0i.toFixed(1)}Z`;
  }
  function render5(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const mid = palette.accent === fg ? palette.primary : palette.accent;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(2, 4);
    const fanW = bounds.w / cols;
    const fanR = fanW * 0.62;
    const rows2 = Math.ceil(bounds.h / fanR) + 1;
    const bands = rng.int(4, 6);
    for (let row = 0; row < rows2; row++) {
      const offset = row % 2 * (fanW / 2);
      const cy = bounds.y + row * fanR;
      for (let col = -1; col <= cols; col++) {
        const cx = bounds.x + col * fanW + offset + fanW / 2;
        let dColor = "";
        for (let b = 0; b < bands; b++) {
          const rOut = fanR * ((bands - b) / bands);
          const rIn = fanR * ((bands - b - 1) / bands);
          const d = ring(cx, cy, rIn, rOut, 0, Math.PI);
          const color = b % 2 === 0 ? fg : mid;
          if (color === fg) dColor += d;
          else g.appendChild(svgEl("path", { d, fill: mid }));
        }
        if (dColor) g.appendChild(svgEl("path", { d: dColor, fill: fg }));
      }
    }
    return g;
  }
  registerGenerator({ name: "art-deco-fan", category: "geometric", weight: 2, render: render5 });

  // src/typography/cjk.ts
  var JAPANESE_KANJI = "\u65E5\u6708\u706B\u6C34\u6728\u91D1\u571F\u5E74\u6642\u9593\u5206\u4EBA\u5927\u4E2D\u5C0F\u5C71\u5DDD\u7530\u529B\u7537\u5973\u5B50\u76EE\u53E3\u624B\u8DB3\u8033\u5FC3\u4F53\u540D\u524D\u79C1\u5148\u751F\u5B66\u6821\u53CB\u7236\u6BCD\u5144\u5F1F\u5BB6\u56FD\u8A9E\u672C\u8AAD\u66F8\u898B\u805E\u8A00\u8A71\u884C\u6765\u5E30\u51FA\u5165\u7ACB\u4F11\u98DF\u98F2\u8CB7\u58F2\u6301\u5F85\u601D\u77E5\u4F1A\u793E\u54E1\u4ED5\u4E8B\u5E97\u5C4B\u9053\u8DEF\u99C5\u8ECA\u96FB\u6C17\u5929\u96E8\u96EA\u98A8\u7A7A\u6D77\u82B1\u8349\u6797\u68EE\u77F3\u753A\u6751\u5E02\u770C\u6771\u897F\u5357\u5317\u4E0A\u4E0B\u5DE6\u53F3\u5185\u5916\u591A\u5C11\u9AD8\u4F4E\u9577\u77ED\u65B0\u53E4\u660E\u6697\u767D\u9ED2\u8D64\u9752\u8272\u97F3\u697D\u7D75\u5730\u56F3\u5199\u771F\u7269\u4E8B\u6240\u5834\u65B9\u5411\u4ECA\u671D\u663C\u591C\u6625\u590F\u79CB\u51AC\u6570\u5B57\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B\u4E5D\u5341\u767E\u5343\u4E07\u5186";
  var CHINESE_SIMPLIFIED = "\u7684\u4E00\u662F\u4E0D\u4E86\u4EBA\u6211\u5728\u6709\u4ED6\u8FD9\u4E2D\u5927\u6765\u4E0A\u56FD\u4E2A\u5230\u8BF4\u4EEC\u4E3A\u5B50\u548C\u4F60\u5730\u51FA\u9053\u4E5F\u65F6\u5E74\u5F97\u5C31\u90A3\u8981\u4E0B\u4EE5\u751F\u4F1A\u81EA\u7740\u53BB\u4E4B\u8FC7\u5BB6\u5B66\u5BF9\u53EF\u5979\u91CC\u540E\u5C0F\u4E48\u5FC3\u591A\u5929\u800C\u80FD\u597D\u90FD\u7136\u6CA1\u65E5\u8D77\u6210\u4E8B\u53EA\u4F5C\u5F53\u60F3\u770B\u6587\u624B\u5341\u7528\u4E3B\u884C\u65B9\u53C8\u5982\u524D\u6240\u672C\u9762\u516C\u540C\u4E09\u5DF2\u8001\u4ECE\u6C11\u5206\u5916\u4F46\u8EAB\u9AD8\u7B49\u65B0\u793E\u6B63\u53CD\u9662\u6D77\u7269\u65E0\u5F00\u89C1\u7ECF\u5934\u52A8\u4E24\u957F\u6837\u73B0\u5C06\u4E0E\u5173\u70B9\u89C9\u8BE5\u8BDD\u8BB0\u5B9E\u4E1A\u5185\u6570\u9898\u95E8\u95EE\u95F4\u7ED9\u8FB9\u5E94\u98CE\u7535\u8F66\u533A\u5199\u5E08\u4E60\u4E66\u4E1C\u9A6C\u9E1F\u9C7C\u9F99\u7231\u53BF\u56ED\u56FE\u56E2\u62A5\u89C2\u96BE\u961F\u9633\u9645\u4E13\u8F6C\u7EED\u603B\u5386\u79F0\u4EF7\u94B1\u94F6\u94C1";
  var CHINESE_TRADITIONAL = "\u7684\u4E00\u662F\u4E0D\u4E86\u4EBA\u6211\u5728\u6709\u4ED6\u9019\u4E2D\u5927\u4F86\u4E0A\u570B\u500B\u5230\u8AAA\u5011\u70BA\u5B50\u548C\u4F60\u5730\u51FA\u9053\u4E5F\u6642\u5E74\u5F97\u5C31\u90A3\u8981\u4E0B\u4EE5\u751F\u6703\u81EA\u8457\u53BB\u4E4B\u904E\u5BB6\u5B78\u5C0D\u53EF\u5979\u88E1\u5F8C\u5C0F\u9EBC\u5FC3\u591A\u5929\u800C\u80FD\u597D\u90FD\u7136\u6C92\u65E5\u8D77\u6210\u4E8B\u53EA\u4F5C\u7576\u60F3\u770B\u6587\u624B\u5341\u7528\u4E3B\u884C\u65B9\u53C8\u5982\u524D\u6240\u672C\u9762\u516C\u540C\u4E09\u5DF2\u8001\u5F9E\u6C11\u5206\u5916\u4F46\u8EAB\u9AD8\u7B49\u65B0\u793E\u6B63\u53CD\u9662\u6D77\u7269\u7121\u958B\u898B\u7D93\u982D\u52D5\u5169\u9577\u6A23\u73FE\u5C07\u8207\u95DC\u9EDE\u89BA\u8A72\u8A71\u8A18\u5BE6\u696D\u5167\u6578\u984C\u9580\u554F\u9593\u7D66\u908A\u61C9\u98A8\u96FB\u8ECA\u5340\u5BEB\u5E2B\u7FD2\u66F8\u6771\u99AC\u9CE5\u9B5A\u9F8D\u611B\u7E23\u5712\u5716\u5718\u5831\u89C0\u96E3\u968A\u967D\u969B\u5C08\u8F49\u7E8C\u7E3D\u6B77\u7A31\u50F9\u9322\u9280\u9435";

  // src/typography/scripts.ts
  function simpleScript(name, ranges, len, extra = {}) {
    return {
      name,
      spaceWords: true,
      classes: [{ name: "base", ranges }],
      wordPatterns: [{ segments: [{ cls: "base", len }] }],
      ...extra
    };
  }
  var SCRIPTS = [
    // Latin is special-cased in textgen (syllable model); classes are unused but
    // present for shape consistency.
    {
      name: "latin",
      spaceWords: true,
      bicameral: true,
      weight: 36,
      classes: [{ name: "base", ranges: [[97, 122]] }],
      wordPatterns: [{ segments: [{ cls: "base", len: [3, 9] }] }]
    },
    // Chinese: Simplified and Traditional are SEPARATE scripts (different curated
    // pools) so a design never mixes the two writing standards.
    {
      name: "chinese",
      fullWidth: true,
      spaceWords: false,
      weight: 11,
      lang: "zh-Hans",
      classes: [{ name: "kanji", ranges: [], chars: CHINESE_SIMPLIFIED }],
      // Real Chinese words are mostly 1-2 characters; occasionally longer.
      wordPatterns: [
        { segments: [{ cls: "kanji", len: [2, 2] }], weight: 4 },
        { segments: [{ cls: "kanji", len: [1, 1] }], weight: 2 },
        { segments: [{ cls: "kanji", len: [3, 4] }], weight: 1 }
      ]
    },
    {
      name: "chinese-traditional",
      fullWidth: true,
      spaceWords: false,
      weight: 5,
      lang: "zh-Hant",
      classes: [{ name: "kanji", ranges: [], chars: CHINESE_TRADITIONAL }],
      wordPatterns: [
        { segments: [{ cls: "kanji", len: [2, 2] }], weight: 4 },
        { segments: [{ cls: "kanji", len: [1, 1] }], weight: 2 },
        { segments: [{ cls: "kanji", len: [3, 4] }], weight: 1 }
      ]
    },
    {
      name: "japanese",
      fullWidth: true,
      spaceWords: false,
      weight: 5,
      lang: "ja",
      classes: [
        { name: "hira", ranges: [[12353, 12438]] },
        { name: "kata", ranges: [[12449, 12538]] },
        // Curated Japanese kanji only -- never the raw CJK block.
        { name: "kanji", ranges: [], chars: JAPANESE_KANJI }
      ],
      // Plausible word shapes: hiragana word, katakana loanword, kanji compound,
      // or kanji stem + hiragana okurigana.
      wordPatterns: [
        { segments: [{ cls: "hira", len: [2, 4] }], weight: 3 },
        { segments: [{ cls: "kata", len: [3, 6] }], weight: 2 },
        { segments: [{ cls: "kanji", len: [2, 3] }], weight: 3 },
        { segments: [{ cls: "kanji", len: [1, 2] }, { cls: "hira", len: [1, 2] }], weight: 2 }
      ]
    },
    simpleScript("korean", [[44032, 55203]], [2, 4], { weight: 4, fullWidth: true }),
    // Thai consonants only (no lone combining marks); not space-separated.
    simpleScript("thai", [[3585, 3630]], [3, 8], { weight: 4, spaceWords: false }),
    {
      name: "arabic",
      rtl: true,
      spaceWords: true,
      weight: 7,
      classes: [{ name: "base", ranges: [[1569, 1594], [1601, 1610]] }],
      wordPatterns: [{ segments: [{ cls: "base", len: [3, 7] }] }]
    },
    simpleScript("devanagari", [[2309, 2361]], [3, 7], { weight: 7 }),
    simpleScript("hebrew", [[1488, 1514]], [3, 7], { rtl: true, weight: 3 }),
    // Bicameral: sample lowercase, case per phrase.
    simpleScript("greek", [[945, 969]], [3, 8], { bicameral: true, weight: 3 }),
    simpleScript("cyrillic", [[1072, 1103]], [3, 9], { bicameral: true, weight: 5 }),
    simpleScript("armenian", [[1377, 1414]], [3, 8], { bicameral: true, weight: 3 }),
    simpleScript("georgian", [[4304, 4346]], [3, 8], { weight: 3 }),
    // Tamil vowels + a contiguous run of consonants (avoids unassigned gaps).
    simpleScript("tamil", [[2949, 2954], [2990, 3001]], [2, 6], { weight: 4 })
  ];
  function scriptByName(name) {
    return SCRIPTS.find((s) => s.name === name) ?? SCRIPTS[0];
  }

  // src/typography/textgen.ts
  function glyphFrom(rng, cls) {
    if (cls.chars) {
      const pool = Array.from(cls.chars);
      return pool[rng.int(0, pool.length - 1)];
    }
    const [lo, hi] = rng.pick(cls.ranges);
    return String.fromCodePoint(rng.int(lo, hi));
  }
  var ONSETS = [
    "b",
    "c",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    "m",
    "n",
    "p",
    "r",
    "s",
    "t",
    "v",
    "w",
    "z",
    "br",
    "cr",
    "dr",
    "fl",
    "gr",
    "pl",
    "pr",
    "st",
    "tr",
    "th",
    "ch",
    "sh"
  ];
  var VOWELS = ["a", "e", "i", "o", "u", "ae", "ou", "ia", "eo"];
  var CODAS = ["", "", "", "n", "r", "s", "t", "m", "l", "x", "ng", "sk", "rt"];
  function latinWord(rng) {
    const syllables = rng.int(1, 3);
    let out = "";
    for (let i = 0; i < syllables; i++) {
      out += rng.pick(ONSETS) + rng.pick(VOWELS) + (rng.chance(0.4) ? rng.pick(CODAS) : "");
    }
    return out;
  }
  function classByName(script, name) {
    return script.classes.find((c) => c.name === name) ?? script.classes[0];
  }
  function makeWord(rng, script) {
    if (script.name === "latin") return latinWord(rng);
    const pattern = rng.weighted(
      script.wordPatterns,
      script.wordPatterns.map((p) => p.weight ?? 1)
    );
    let out = "";
    for (const seg of pattern.segments) {
      const cls = classByName(script, seg.cls);
      const len = rng.int(seg.len[0], seg.len[1]);
      for (let i = 0; i < len; i++) out += glyphFrom(rng, cls);
    }
    return out;
  }
  function applyCasing(words, casing) {
    const title = (w) => w ? w[0].toLocaleUpperCase() + w.slice(1).toLocaleLowerCase() : w;
    switch (casing) {
      case "lower":
        return words.map((w) => w.toLocaleLowerCase());
      case "upper":
        return words.map((w) => w.toLocaleUpperCase());
      case "title":
        return words.map(title);
      case "sentence":
        return words.map((w, i) => i === 0 ? title(w) : w.toLocaleLowerCase());
    }
  }
  function makePhrase(rng, script, opts = {}) {
    const count = opts.words ?? rng.int(1, 4);
    let words = [];
    for (let i = 0; i < count; i++) words.push(makeWord(rng, script));
    if (script.bicameral) {
      words = applyCasing(words, opts.casing ?? "lower");
    }
    return words.join(script.spaceWords ? " " : "");
  }
  function makeLabel(rng) {
    const kinds = [
      () => String(rng.int(1960, 2030)),
      () => `No.${rng.int(1, 99)}`,
      () => `${rng.int(1, 12)}/${rng.int(1, 28)}`,
      () => `Vol.${rng.int(1, 40)}`,
      () => rng.pick(["I", "II", "III", "IV", "V", "VI", "X"])
    ];
    return rng.pick(kinds)();
  }
  function displayCasing(rng) {
    return rng.weighted(["upper", "title", "lower"], [3, 2, 1]);
  }
  function makeBundle(rng, scriptName, withEnglish) {
    const script = scriptByName(scriptName);
    const bodyLines = rng.int(2, 5);
    const body = [];
    for (let i = 0; i < bodyLines; i++) {
      body.push(makePhrase(rng, script, { words: rng.int(3, 7), casing: "sentence" }));
    }
    const latin = scriptByName("latin");
    return {
      headline: makePhrase(rng, script, { words: rng.int(1, 3), casing: displayCasing(rng) }),
      sub: makePhrase(rng, script, { words: rng.int(2, 4), casing: "title" }),
      body,
      label: makeLabel(rng),
      english: withEnglish ? makePhrase(rng, latin, { words: rng.int(1, 3), casing: displayCasing(rng) }) : void 0
    };
  }

  // src/generators/asciiField.ts
  function render6(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const script = scriptByName(ctx.text.script);
    const family = ctx.text.font.family;
    const weight = rng.pick([400, 500]);
    const size = Math.min(bounds.w, bounds.h) * rng.range(0.018, 0.04);
    const lineH = size * rng.range(1.05, 1.25);
    const rows2 = Math.min(220, Math.ceil(bounds.h / lineH));
    const letterSpace = size * rng.range(0.05, 0.25);
    const perLine = Math.ceil(bounds.w / (size * 0.62) + 4);
    for (let r = 0; r < rows2; r++) {
      const y = bounds.y + (r + 1) * lineH;
      let line = makePhrase(rng, script, { words: rng.int(6, 14), casing: "sentence" });
      while (line.length < perLine) {
        line += (script.spaceWords ? " " : "") + makePhrase(rng, script, { words: rng.int(4, 9) });
      }
      const accent = rng.chance(0.12);
      const t = svgEl("text", {
        x: bounds.x.toFixed(1),
        y: y.toFixed(1),
        "font-family": family,
        "font-size": size.toFixed(2),
        "font-weight": weight,
        "text-anchor": "start",
        fill: accent ? palette.accent : fg,
        "letter-spacing": letterSpace.toFixed(2),
        "fill-opacity": rng.range(0.7, 1).toFixed(2)
      });
      t.textContent = line.slice(0, perLine + 8);
      g.appendChild(t);
    }
    return g;
  }
  registerGenerator({ name: "ascii-field", category: "type", weight: 2, render: render6 });

  // src/generators/barcode.ts
  function render7(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const margin2 = bounds.h * rng.range(0.04, 0.12);
    const barTop = bounds.y + margin2;
    const barH = bounds.h - margin2 * 2;
    const modules = rng.int(40, 90);
    const unit = bounds.w / modules;
    let d = "";
    let x = bounds.x;
    let drawBar = true;
    while (x < bounds.x + bounds.w) {
      const widthUnits = rng.int(1, 4);
      const w = widthUnits * unit;
      if (drawBar) {
        const fx = x.toFixed(2);
        const fw = Math.min(w, bounds.x + bounds.w - x).toFixed(2);
        d += `M${fx} ${barTop.toFixed(2)}h${fw}v${barH.toFixed(2)}h-${fw}z`;
      }
      x += w;
      drawBar = !drawBar;
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    return g;
  }
  registerGenerator({ name: "barcode", category: "digital", weight: 2, render: render7 });

  // src/generators/basketWeave.ts
  function render8(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const colorA = fg;
    const colorB = palette.accent;
    const cols = rng.int(3, 7);
    const cell = bounds.w / cols;
    const rows2 = Math.ceil(bounds.h / cell) + 1;
    const gap = cell * rng.range(0.06, 0.12);
    const straps = 2;
    const slat = (cell - gap * (straps + 1)) / straps;
    for (let r = 0; r < rows2; r++) {
      for (let c = 0; c < cols; c++) {
        const x = bounds.x + c * cell;
        const y = bounds.y + r * cell;
        const horizontal = (r + c) % 2 === 0;
        const fill = horizontal ? colorA : colorB;
        for (let s = 0; s < straps; s++) {
          if (horizontal) {
            g.appendChild(
              svgEl("rect", {
                x: x + gap,
                y: y + gap + s * (slat + gap),
                width: cell - gap * 2,
                height: slat,
                fill
              })
            );
          } else {
            g.appendChild(
              svgEl("rect", {
                x: x + gap + s * (slat + gap),
                y: y + gap,
                width: slat,
                height: cell - gap * 2,
                fill
              })
            );
          }
        }
      }
    }
    return g;
  }
  registerGenerator({ name: "basket-weave", category: "tiling", weight: 2, render: render8 });

  // src/generators/bauhaus.ts
  function render9(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const colors = [palette.primary, palette.accent, palette.colors[3] ?? palette.primary];
    const cols = rng.int(3, 5);
    const rows2 = Math.max(2, Math.round(cols * bounds.h / bounds.w));
    const cw = bounds.w / cols;
    const ch = bounds.h / rows2;
    for (let r = 0; r < rows2; r++) {
      for (let c = 0; c < cols; c++) {
        if (rng.chance(0.2)) continue;
        const x = bounds.x + c * cw;
        const y = bounds.y + r * ch;
        const fill = rng.pick(colors);
        const kind = rng.pick(["circle", "half", "triangle", "bar", "quarter"]);
        const cx = x + cw / 2;
        const cy = y + ch / 2;
        const rad = Math.min(cw, ch) / 2;
        switch (kind) {
          case "circle":
            g.appendChild(svgEl("circle", { cx, cy, r: rad, fill }));
            break;
          case "half":
            g.appendChild(
              svgEl("path", { d: `M ${cx - rad} ${cy} a ${rad} ${rad} 0 0 1 ${rad * 2} 0 Z`, fill })
            );
            break;
          case "triangle":
            g.appendChild(
              svgEl("polygon", { points: `${x} ${y + ch} ${x + cw} ${y + ch} ${cx} ${y}`, fill })
            );
            break;
          case "bar": {
            const vertical = rng.chance(0.5);
            g.appendChild(
              svgEl("rect", {
                x: vertical ? cx - cw * 0.18 : x,
                y: vertical ? y : cy - ch * 0.18,
                width: vertical ? cw * 0.36 : cw,
                height: vertical ? ch : ch * 0.36,
                fill
              })
            );
            break;
          }
          case "quarter":
            g.appendChild(
              svgEl("path", {
                d: `M ${x} ${y + ch} L ${x} ${y} A ${cw} ${ch} 0 0 1 ${x + cw} ${y + ch} Z`,
                fill
              })
            );
            break;
        }
      }
    }
    return g;
  }
  registerGenerator({ name: "bauhaus", category: "bauhaus", weight: 2, render: render9 });

  // src/generators/bayerDither.ts
  var BAYER4 = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ];
  function render10(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cells = rng.int(16, 40);
    const cw = bounds.w / cells;
    const rows2 = Math.max(1, Math.round(bounds.h / cw));
    const vertical = rng.chance(0.5);
    const flip = rng.chance(0.5);
    let d = "";
    for (let r = 0; r < rows2; r++) {
      for (let c = 0; c < cells; c++) {
        const t = vertical ? r / rows2 : c / cells;
        const ramp = flip ? 1 - t : t;
        const threshold = (BAYER4[r % 4][c % 4] + 0.5) / 16;
        if (ramp <= threshold) continue;
        const x = (bounds.x + c * cw).toFixed(2);
        const y = (bounds.y + r * cw).toFixed(2);
        d += `M${x} ${y}h${cw.toFixed(2)}v${cw.toFixed(2)}h${(-cw).toFixed(2)}z`;
      }
    }
    g.appendChild(svgEl("path", { d, fill: fg, "shape-rendering": "crispEdges" }));
    return g;
  }
  registerGenerator({ name: "bayer-dither", category: "dots", weight: 2, render: render10 });

  // src/generators/benDay.ts
  function render11(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const minDim = Math.min(bounds.w, bounds.h);
    const cols = rng.int(14, 28);
    const step = bounds.w / cols;
    const rows2 = Math.ceil(bounds.h / step) + 1;
    const radius = step * rng.range(0.28, 0.42);
    const stagger = rng.chance(0.5);
    let d = "";
    for (let r = 0; r < rows2; r++) {
      const offset = stagger && r % 2 === 1 ? step / 2 : 0;
      for (let c = -1; c <= cols; c++) {
        const cx = bounds.x + offset + (c + 0.5) * step;
        const cy = bounds.y + (r + 0.5) * step;
        d += `M${(cx - radius).toFixed(1)} ${cy.toFixed(1)}a${radius.toFixed(1)} ${radius.toFixed(1)} 0 1 0 ${(radius * 2).toFixed(1)} 0a${radius.toFixed(1)} ${radius.toFixed(1)} 0 1 0 ${(-radius * 2).toFixed(1)} 0z`;
      }
    }
    void minDim;
    g.appendChild(svgEl("path", { d, fill: fg }));
    return g;
  }
  registerGenerator({ name: "ben-day", category: "print", weight: 2, render: render11 });

  // src/generators/bigGlyph.ts
  function render12(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const script = scriptByName(ctx.text.script);
    const family = ctx.text.font.family;
    const glyphs = Array.from(makeWord(rng, script));
    const glyph = glyphs.length ? rng.pick(glyphs) : "A";
    const size = Math.max(bounds.w, bounds.h) * rng.range(1.1, 1.6);
    const cx = bounds.x + bounds.w / 2 + rng.range(-0.12, 0.12) * bounds.w;
    const cy = bounds.y + bounds.h / 2 + rng.range(-0.08, 0.08) * bounds.h;
    const weight = rng.pick([800, 900]);
    const make = (dx, dy, fill, op) => {
      const t = svgEl("text", {
        x: (cx + dx).toFixed(1),
        y: (cy + size * 0.36 + dy).toFixed(1),
        "font-family": family,
        "font-size": size.toFixed(1),
        "font-weight": weight,
        "text-anchor": "middle",
        fill,
        "fill-opacity": op.toFixed(2)
      });
      t.textContent = glyph;
      return t;
    };
    if (rng.chance(0.7)) {
      const off = size * rng.range(0.02, 0.06);
      g.appendChild(make(off, off, palette.accent, rng.range(0.5, 0.9)));
    }
    g.appendChild(make(0, 0, fg, 1));
    return g;
  }
  registerGenerator({ name: "big-glyph", category: "type", weight: 2, render: render12 });

  // src/generators/blobConfetti.ts
  function blobPath(cx, cy, r, lobes, wobble, rng) {
    const pts = [];
    for (let i = 0; i < lobes; i++) {
      const a = i / lobes * Math.PI * 2;
      const rr = r * (1 - wobble + rng.range(0, wobble * 2));
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    let d = "";
    for (let i = 0; i < lobes; i++) {
      const cur = pts[i];
      const next = pts[(i + 1) % lobes];
      const mx = (cur[0] + next[0]) / 2;
      const my = (cur[1] + next[1]) / 2;
      if (i === 0) d += `M ${mx.toFixed(1)} ${my.toFixed(1)}`;
      const after = pts[(i + 1) % lobes];
      const m2x = (after[0] + pts[(i + 2) % lobes][0]) / 2;
      const m2y = (after[1] + pts[(i + 2) % lobes][1]) / 2;
      d += ` Q ${after[0].toFixed(1)} ${after[1].toFixed(1)} ${m2x.toFixed(1)} ${m2y.toFixed(1)}`;
    }
    return d + " Z";
  }
  function render13(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const inks = [
      palette.primary,
      palette.accent,
      palette.colors[1] ?? palette.primary,
      palette.colors[2] ?? palette.accent,
      palette.colors[4] ?? palette.primary
    ];
    const unit = Math.min(bounds.w, bounds.h);
    const area = bounds.w * bounds.h;
    const count = Math.min(400, Math.max(10, Math.round(area / (unit * unit * 0.03))));
    for (let i = 0; i < count; i++) {
      const cx = bounds.x + rng.next() * bounds.w;
      const cy = bounds.y + rng.next() * bounds.h;
      const r = unit * rng.range(0.025, 0.08);
      const lobes = rng.int(5, 8);
      const wobble = rng.range(0.12, 0.32);
      g.appendChild(
        svgEl("path", { d: blobPath(cx, cy, r, lobes, wobble, rng), fill: rng.pick(inks) })
      );
    }
    return g;
  }
  registerGenerator({ name: "blob-confetti", category: "memphis", weight: 2, render: render13 });

  // src/generators/blueprintGrid.ts
  function render14(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const minor = Math.max(10, Math.min(bounds.w, bounds.h) / rng.int(18, 36));
    const major = minor * rng.pick([4, 5, 8]);
    const thin = Math.max(0.5, minor * 0.03);
    const thick = thin * rng.range(2.4, 3.6);
    let dMinor = "";
    for (let x = bounds.x; x <= bounds.x + bounds.w; x += minor) {
      dMinor += `M${x.toFixed(1)} ${bounds.y}V${(bounds.y + bounds.h).toFixed(1)}`;
    }
    for (let y = bounds.y; y <= bounds.y + bounds.h; y += minor) {
      dMinor += `M${bounds.x} ${y.toFixed(1)}H${(bounds.x + bounds.w).toFixed(1)}`;
    }
    g.appendChild(
      svgEl("path", {
        d: dMinor,
        fill: "none",
        stroke: fg,
        "stroke-width": thin.toFixed(2),
        "stroke-opacity": "0.3"
      })
    );
    let dMajor = "";
    for (let x = bounds.x; x <= bounds.x + bounds.w; x += major) {
      dMajor += `M${x.toFixed(1)} ${bounds.y}V${(bounds.y + bounds.h).toFixed(1)}`;
    }
    for (let y = bounds.y; y <= bounds.y + bounds.h; y += major) {
      dMajor += `M${bounds.x} ${y.toFixed(1)}H${(bounds.x + bounds.w).toFixed(1)}`;
    }
    g.appendChild(
      svgEl("path", {
        d: dMajor,
        fill: "none",
        stroke: fg,
        "stroke-width": thick.toFixed(2),
        "stroke-opacity": "0.65"
      })
    );
    const tick = minor * rng.range(0.16, 0.24);
    let dTick = "";
    for (let x = bounds.x; x <= bounds.x + bounds.w; x += minor) {
      for (let y = bounds.y; y <= bounds.y + bounds.h; y += minor) {
        dTick += `M${(x - tick).toFixed(1)} ${y.toFixed(1)}h${(tick * 2).toFixed(1)}`;
        dTick += `M${x.toFixed(1)} ${(y - tick).toFixed(1)}v${(tick * 2).toFixed(1)}`;
      }
    }
    g.appendChild(
      svgEl("path", {
        d: dTick,
        fill: "none",
        stroke: fg,
        "stroke-width": thin.toFixed(2),
        "stroke-opacity": "0.55"
      })
    );
    return g;
  }
  registerGenerator({ name: "blueprint-grid", category: "techno", weight: 2, render: render14 });

  // src/generators/brickWall.ts
  function render15(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const tones = [fg, palette.primary, palette.accent];
    const rows2 = rng.int(6, 16);
    const brickH = bounds.h / rows2;
    const bricksPerRow = rng.int(3, 7);
    const brickW = bounds.w / bricksPerRow;
    const mortar = Math.max(1, Math.min(brickW, brickH) * rng.range(0.04, 0.1));
    for (let r = 0; r < rows2; r++) {
      const y = bounds.y + r * brickH;
      const offset = (r & 1) === 1 ? brickW / 2 : 0;
      const start = bounds.x - brickW + offset;
      const cells = bricksPerRow + 2;
      for (let c = 0; c < cells; c++) {
        const x = start + c * brickW;
        g.appendChild(
          svgEl("rect", {
            x: x + mortar / 2,
            y: y + mortar / 2,
            width: brickW - mortar,
            height: brickH - mortar,
            fill: rng.pick(tones)
          })
        );
      }
    }
    return g;
  }
  registerGenerator({ name: "brick-wall", category: "tiling", weight: 2, render: render15 });

  // src/generators/bubbles.ts
  function render16(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const swatches = [
      palette.primary,
      palette.accent,
      palette.colors[1] ?? palette.primary,
      palette.colors[3] ?? palette.accent
    ];
    const minDim = Math.min(bounds.w, bounds.h);
    const area = bounds.w * bounds.h;
    const count = Math.max(20, Math.min(700, Math.round(area / 1400)));
    const opacity = rng.range(0.18, 0.4);
    const stroke = rng.chance(0.5);
    for (let i = 0; i < count; i++) {
      const cx = bounds.x + rng.next() * bounds.w;
      const cy = bounds.y + rng.next() * bounds.h;
      const t = Math.abs(rng.gaussian(0, 0.5));
      const r = minDim * (0.02 + t * 0.12);
      const fill = rng.pick(swatches);
      const attrs = {
        cx: cx.toFixed(1),
        cy: cy.toFixed(1),
        r: r.toFixed(1),
        fill,
        "fill-opacity": opacity.toFixed(2)
      };
      if (stroke) {
        attrs["stroke"] = fill;
        attrs["stroke-opacity"] = (opacity + 0.2).toFixed(2);
        attrs["stroke-width"] = Math.max(0.6, r * 0.04).toFixed(1);
      }
      g.appendChild(svgEl("circle", attrs));
    }
    return g;
  }
  registerGenerator({ name: "bubbles", category: "organic", weight: 2, render: render16 });

  // src/generators/cellNoise.ts
  function render17(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const tones = [
      palette.background,
      palette.colors[0] ?? palette.primary,
      palette.primary,
      palette.colors[3] ?? palette.accent,
      palette.accent
    ];
    const latW = rng.int(3, 6);
    const latH = rng.int(3, 6);
    const lattice = [];
    for (let i = 0; i < (latW + 1) * (latH + 1); i++) lattice.push(rng.next());
    const valAt = (c, r) => lattice[r * (latW + 1) + c];
    const smooth = (t) => t * t * (3 - 2 * t);
    const area = bounds.w * bounds.h;
    const blocks = Math.min(2200, Math.round(area / 100));
    const aspect = bounds.w / bounds.h;
    const gw = Math.max(12, Math.round(Math.sqrt(blocks * aspect)));
    const gh = Math.max(12, Math.round(blocks / gw));
    const bw = bounds.w / gw;
    const bh = bounds.h / gh;
    const paths = /* @__PURE__ */ new Map();
    for (let r = 0; r < gh; r++) {
      const gy = (r + 0.5) / gh * latH;
      const r0 = Math.floor(gy);
      const fy = smooth(gy - r0);
      for (let c = 0; c < gw; c++) {
        const gx = (c + 0.5) / gw * latW;
        const c0 = Math.floor(gx);
        const fx = smooth(gx - c0);
        const v00 = valAt(c0, r0);
        const v10 = valAt(c0 + 1, r0);
        const v01 = valAt(c0, r0 + 1);
        const v11 = valAt(c0 + 1, r0 + 1);
        const top = v00 + (v10 - v00) * fx;
        const bot = v01 + (v11 - v01) * fx;
        const v = top + (bot - top) * fy;
        const tone = tones[Math.min(tones.length - 1, Math.floor(v * tones.length))];
        const x = (bounds.x + c * bw).toFixed(1);
        const y = (bounds.y + r * bh).toFixed(1);
        const w = (bw + 0.5).toFixed(1);
        const h = (bh + 0.5).toFixed(1);
        paths.set(tone, (paths.get(tone) ?? "") + `M${x} ${y}h${w}v${h}h${-w}z`);
      }
    }
    for (const [tone, d] of paths) {
      g.appendChild(svgEl("path", { d, fill: tone }));
    }
    return g;
  }
  registerGenerator({ name: "cell-noise", category: "organic", weight: 2, render: render17 });

  // src/generators/charRain.ts
  function render18(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const script = scriptByName(ctx.text.script);
    const family = ctx.text.font.family;
    const cols = rng.int(8, 22);
    const cw = bounds.w / cols;
    const size = cw * rng.range(0.7, 0.95);
    const lineH = size * rng.range(1, 1.35);
    const maxRows = Math.ceil(bounds.h / lineH) + 1;
    for (let c = 0; c < cols; c++) {
      const cx = bounds.x + (c + 0.5) * cw;
      const phase = rng.range(0, lineH);
      const weight = rng.pick([400, 700]);
      const head = rng.range(0, maxRows);
      const glyphs = Array.from(makeWord(rng, script) + makeWord(rng, script));
      const pool = glyphs.length ? glyphs : ["0"];
      for (let r = 0; r < maxRows; r++) {
        const cy = bounds.y - phase + r * lineH + size;
        const dist = Math.abs(r - head);
        const op = Math.max(0.18, 1 - dist * 0.12);
        const fill = dist < 0.5 ? palette.accent : fg;
        const t = svgEl("text", {
          x: cx,
          y: cy.toFixed(1),
          "font-family": family,
          "font-size": size.toFixed(1),
          "font-weight": weight,
          "text-anchor": "middle",
          fill,
          "fill-opacity": op.toFixed(2)
        });
        t.textContent = pool[(r + c) % pool.length];
        g.appendChild(t);
      }
    }
    return g;
  }
  registerGenerator({ name: "char-rain", category: "type", weight: 2, render: render18 });

  // src/generators/checkerFloorPersp.ts
  function render19(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const horizonY = bounds.y + bounds.h * rng.range(0.02, 0.18);
    const vpx = bounds.x + bounds.w / 2;
    const bottom = bounds.y + bounds.h;
    const cols = rng.int(6, 12);
    const rows2 = rng.int(8, 16);
    const rowY = [];
    for (let r = 0; r <= rows2; r++) {
      const t = Math.pow(r / rows2, 2.4);
      rowY.push(bottom - t * (bottom - horizonY));
    }
    const colCount = cols * 2;
    const xAt = (c, y) => {
      const bottomX = bounds.x + c / colCount * bounds.w;
      const f = (bottom - y) / (bottom - horizonY);
      return bottomX + (vpx - bottomX) * f;
    };
    let d = "";
    for (let r = 0; r < rows2; r++) {
      const yTop = rowY[r + 1];
      const yBot = rowY[r];
      for (let c = 0; c < colCount; c++) {
        if ((r + c) % 2 !== 0) continue;
        const x0t = xAt(c, yTop);
        const x1t = xAt(c + 1, yTop);
        const x1b = xAt(c + 1, yBot);
        const x0b = xAt(c, yBot);
        d += `M${x0t.toFixed(1)} ${yTop.toFixed(1)}L${x1t.toFixed(1)} ${yTop.toFixed(1)}L${x1b.toFixed(1)} ${yBot.toFixed(1)}L${x0b.toFixed(1)} ${yBot.toFixed(1)}Z`;
      }
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    return g;
  }
  registerGenerator({ name: "checker-floor-persp", category: "geometric", weight: 2, render: render19 });

  // src/generators/checkerWarp.ts
  function render20(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const radius = Math.min(bounds.w, bounds.h) * rng.range(0.35, 0.5);
    const strength = rng.range(0.4, 0.7);
    const warp = (x, y) => {
      const dx = x - cx;
      const dy = y - cy;
      const d2 = Math.hypot(dx, dy);
      if (d2 >= radius || d2 < 1e-3) return [x, y];
      const t = d2 / radius;
      const f = 1 + strength * (1 - t * t);
      return [cx + dx * f, cy + dy * f];
    };
    const cols = rng.int(10, 16);
    const rows2 = Math.max(6, Math.round(cols * bounds.h / bounds.w));
    const pad = 1;
    const cw = (bounds.w + 2 * pad) / cols;
    const ch = (bounds.h + 2 * pad) / rows2;
    const px = (i) => bounds.x - pad + i * cw;
    const py = (j) => bounds.y - pad + j * ch;
    let d = "";
    for (let j = 0; j < rows2; j++) {
      for (let i = 0; i < cols; i++) {
        if ((i + j & 1) === 0) continue;
        const [ax, ay] = warp(px(i), py(j));
        const [bx, by] = warp(px(i + 1), py(j));
        const [ex, ey] = warp(px(i + 1), py(j + 1));
        const [hx, hy] = warp(px(i), py(j + 1));
        d += `M${ax.toFixed(1)} ${ay.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}L${hx.toFixed(1)} ${hy.toFixed(1)}z`;
      }
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    return g;
  }
  registerGenerator({ name: "checker-warp", category: "geometric", weight: 2, render: render20 });

  // src/generators/checkerboard.ts
  function render21(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(3, 12);
    const cell = bounds.w / cols;
    const rows2 = Math.ceil(bounds.h / cell) + 1;
    const angle = rng.chance(0.3) ? rng.pick([45, 30, 15]) : 0;
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const grid = svgEl(
      "g",
      angle ? { transform: `rotate(${angle} ${cx} ${cy})` } : {}
    );
    const pad = angle ? cell * 2 : 0;
    for (let r = -1; r < rows2 + 1; r++) {
      for (let c = -1; c < cols + 1; c++) {
        if ((r + c) % 2 !== 0) continue;
        grid.appendChild(
          svgEl("rect", {
            x: bounds.x + c * cell - pad,
            y: bounds.y + r * cell - pad,
            width: cell,
            height: cell,
            fill: fg
          })
        );
      }
    }
    g.appendChild(grid);
    return g;
  }
  registerGenerator({ name: "checkerboard", category: "geometric", weight: 2, render: render21 });

  // src/generators/chevron.ts
  function render22(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const tones = [fg, palette.primary, palette.accent];
    const cols = rng.int(3, 8);
    const w = bounds.w / cols;
    const amp = w * rng.range(0.5, 0.9);
    const strokeW = bounds.h / rng.int(8, 18);
    const vStep = strokeW * rng.range(1, 1.4);
    const rows2 = Math.ceil((bounds.h + amp) / vStep) + 2;
    const pointUp = rng.chance(0.5);
    let placed = 0;
    for (let row = -2; row < rows2 && placed < 1400; row++) {
      const fill = tones[(row % tones.length + tones.length) % tones.length];
      const yBase = bounds.y + row * vStep;
      let d = "";
      for (let c = -1; c <= cols; c++) {
        const x0 = bounds.x + c * w;
        const xMid = x0 + w / 2;
        const x1 = x0 + w;
        const yPeak = pointUp ? yBase - amp : yBase + amp;
        d += `M ${x0.toFixed(2)} ${yBase.toFixed(2)} L ${xMid.toFixed(2)} ${yPeak.toFixed(2)} L ${x1.toFixed(2)} ${yBase.toFixed(2)} `;
        placed++;
      }
      g.appendChild(
        svgEl("path", {
          d,
          fill: "none",
          stroke: fill,
          "stroke-width": strokeW.toFixed(2),
          "stroke-linejoin": "miter",
          "stroke-linecap": "butt"
        })
      );
    }
    return g;
  }
  registerGenerator({ name: "chevron", category: "tiling", weight: 2, render: render22 });

  // src/generators/chromaticBars.ts
  function render23(ctx, bounds) {
    const { rng } = ctx;
    const { bg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const vertical = rng.chance(0.5);
    const span = vertical ? bounds.w : bounds.h;
    const cross = vertical ? bounds.h : bounds.w;
    const bars = [];
    let cursor = 0;
    while (cursor < span) {
      const gap = span * rng.range(0.03, 0.09);
      const thick = span * rng.range(0.04, 0.12);
      cursor += gap;
      if (cursor + thick > span) break;
      bars.push({ pos: cursor, thick });
      cursor += thick;
      if (bars.length > 40) break;
    }
    const maxOff = span * 0.03;
    const channels = [
      ["#ff0000", rng.range(-maxOff, maxOff)],
      ["#00ff00", rng.range(-maxOff, maxOff)],
      ["#0000ff", rng.range(-maxOff, maxOff)]
    ];
    for (const [color, off] of channels) {
      let d = "";
      for (const b of bars) {
        const p = b.pos + off;
        if (vertical) {
          d += `M${(bounds.x + p).toFixed(1)} ${bounds.y.toFixed(1)}h${b.thick.toFixed(1)}v${cross.toFixed(1)}h${(-b.thick).toFixed(1)}z`;
        } else {
          d += `M${bounds.x.toFixed(1)} ${(bounds.y + p).toFixed(1)}h${cross.toFixed(1)}v${b.thick.toFixed(1)}h${(-cross).toFixed(1)}z`;
        }
      }
      g.appendChild(svgEl("path", { d, fill: color, style: "mix-blend-mode:screen" }));
    }
    return g;
  }
  registerGenerator({ name: "chromatic-bars", category: "gradient", weight: 2, render: render23 });

  // src/generators/circuitTraces.ts
  function render24(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cell = Math.max(14, Math.min(bounds.w, bounds.h) / rng.int(12, 22));
    const cols = Math.ceil(bounds.w / cell);
    const rows2 = Math.ceil(bounds.h / cell);
    const traceCount = Math.min(220, Math.round(cols * rows2 / rng.range(3, 6)));
    const stroke = Math.max(1.5, cell * rng.range(0.08, 0.16));
    const pads = [];
    let d = "";
    for (let t = 0; t < traceCount; t++) {
      let cx = rng.int(0, cols);
      let cy = rng.int(0, rows2);
      let px = bounds.x + cx * cell;
      let py = bounds.y + cy * cell;
      d += `M${px.toFixed(1)} ${py.toFixed(1)}`;
      pads.push([px, py]);
      const segs = rng.int(2, 5);
      for (let s = 0; s < segs; s++) {
        const dir = rng.pick(["h", "v", "d"]);
        const len = rng.int(1, 4);
        if (dir === "h") {
          cx = Math.max(0, Math.min(cols, cx + (rng.chance() ? len : -len)));
        } else if (dir === "v") {
          cy = Math.max(0, Math.min(rows2, cy + (rng.chance() ? len : -len)));
        } else {
          const sx = rng.chance() ? 1 : -1;
          const sy = rng.chance() ? 1 : -1;
          cx = Math.max(0, Math.min(cols, cx + sx * len));
          cy = Math.max(0, Math.min(rows2, cy + sy * len));
        }
        px = bounds.x + cx * cell;
        py = bounds.y + cy * cell;
        d += `L${px.toFixed(1)} ${py.toFixed(1)}`;
      }
      pads.push([px, py]);
    }
    g.appendChild(
      svgEl("path", {
        d,
        fill: "none",
        stroke: fg,
        "stroke-width": stroke.toFixed(2),
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-opacity": "0.85"
      })
    );
    const padR = stroke * rng.range(1.6, 2.4);
    let pd = "";
    const seen = /* @__PURE__ */ new Set();
    for (const [x, y] of pads) {
      const key = `${x.toFixed(0)},${y.toFixed(0)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pd += `M${(x - padR).toFixed(1)} ${y.toFixed(1)}a${padR.toFixed(1)} ${padR.toFixed(1)} 0 1 0 ${(padR * 2).toFixed(1)} 0a${padR.toFixed(1)} ${padR.toFixed(1)} 0 1 0 ${(-padR * 2).toFixed(1)} 0z`;
    }
    g.appendChild(svgEl("path", { d: pd, fill: fg }));
    return g;
  }
  registerGenerator({ name: "circuit-traces", category: "techno", weight: 2, render: render24 });

  // src/generators/colorBlendBlobs.ts
  function render25(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const defs = svgEl("defs");
    g.appendChild(defs);
    const swatches = [
      palette.primary,
      palette.accent,
      ...palette.colors
    ];
    const minDim = Math.min(bounds.w, bounds.h);
    const count = rng.int(6, 11);
    for (let i = 0; i < count; i++) {
      const color = rng.pick(swatches);
      const id = uid("blob");
      const grad = svgEl("radialGradient", { id });
      grad.appendChild(svgEl("stop", { offset: "0", "stop-color": color, "stop-opacity": "0.9" }));
      grad.appendChild(svgEl("stop", { offset: "0.55", "stop-color": color, "stop-opacity": "0.5" }));
      grad.appendChild(svgEl("stop", { offset: "1", "stop-color": color, "stop-opacity": "0" }));
      defs.appendChild(grad);
      const cx = bounds.x + rng.range(-0.1, 1.1) * bounds.w;
      const cy = bounds.y + rng.range(-0.1, 1.1) * bounds.h;
      const r = minDim * rng.range(0.3, 0.6);
      g.appendChild(svgEl("circle", { cx: cx.toFixed(1), cy: cy.toFixed(1), r: r.toFixed(1), fill: `url(#${id})` }));
    }
    return g;
  }
  registerGenerator({ name: "color-blend-blobs", category: "gradient", weight: 2, render: render25 });

  // src/generators/comicBurst.ts
  function render26(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const fx = bounds.x + bounds.w * rng.range(0.3, 0.7);
    const fy = bounds.y + bounds.h * rng.range(0.3, 0.7);
    const reach = Math.hypot(bounds.w, bounds.h) * 1.2;
    const spikes = rng.int(14, 26);
    const startA = rng.range(0, Math.PI * 2);
    let d = "";
    for (let i = 0; i < spikes; i++) {
      const a0 = startA + i / spikes * Math.PI * 2;
      const wedge = Math.PI * 2 / spikes;
      const half = wedge * rng.range(0.28, 0.44);
      const x1 = fx + Math.cos(a0 - half) * reach;
      const y1 = fy + Math.sin(a0 - half) * reach;
      const x2 = fx + Math.cos(a0 + half) * reach;
      const y2 = fy + Math.sin(a0 + half) * reach;
      d += `M${fx.toFixed(1)} ${fy.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}Z`;
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    const rings = rng.int(1, 3);
    const minDim = Math.min(bounds.w, bounds.h);
    for (let i = 0; i < rings; i++) {
      const rr = minDim * rng.range(0.04, 0.14) * (i + 1);
      g.appendChild(
        svgEl("circle", {
          cx: fx,
          cy: fy,
          r: rr,
          fill: "none",
          stroke: bg,
          "stroke-width": (minDim * 0.012).toFixed(1)
        })
      );
    }
    g.appendChild(svgEl("circle", { cx: fx, cy: fy, r: minDim * 0.03, fill: bg }));
    return g;
  }
  registerGenerator({ name: "comic-burst", category: "comic", weight: 2, render: render26 });

  // src/generators/comicTone.ts
  function render27(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(20, 36);
    const step = bounds.w / cols;
    const rows2 = Math.ceil(bounds.h / step) + 1;
    const angle = rng.pick([0, 45, 90, 135]);
    const mode = rng.int(0, 2);
    const cx0 = bounds.x + bounds.w / 2;
    const cy0 = bounds.y + bounds.h / 2;
    const maxR = step * 0.62;
    const flip = rng.chance(0.5);
    let d = "";
    for (let r = 0; r < rows2; r++) {
      for (let c = -1; c <= cols; c++) {
        const cx = bounds.x + (c + 0.5) * step;
        const cy = bounds.y + (r + 0.5) * step;
        let t;
        if (mode === 0) {
          t = (cx - bounds.x) / bounds.w;
        } else if (mode === 1) {
          t = (cy - bounds.y) / bounds.h;
        } else {
          t = Math.hypot(cx - cx0, cy - cy0) / (Math.hypot(bounds.w, bounds.h) / 2);
        }
        if (flip) t = 1 - t;
        const radius = maxR * Math.max(0, Math.min(1, t));
        if (radius < 0.4) continue;
        d += `M${(cx - radius).toFixed(1)} ${cy.toFixed(1)}a${radius.toFixed(1)} ${radius.toFixed(1)} 0 1 0 ${(radius * 2).toFixed(1)} 0a${radius.toFixed(1)} ${radius.toFixed(1)} 0 1 0 ${(-radius * 2).toFixed(1)} 0z`;
      }
    }
    const rotGroup = svgEl("g", {
      transform: `rotate(${angle} ${cx0.toFixed(1)} ${cy0.toFixed(1)})`
    });
    rotGroup.appendChild(svgEl("path", { d, fill: fg }));
    g.appendChild(rotGroup);
    return g;
  }
  registerGenerator({ name: "comic-tone", category: "print", weight: 2, render: render27 });

  // src/generators/concentricCircles.ts
  function render28(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w * rng.range(0.2, 0.8);
    const cy = bounds.y + bounds.h * rng.range(0.2, 0.8);
    const maxR = Math.hypot(bounds.w, bounds.h);
    const count = rng.int(6, 22);
    const step = maxR / count;
    const filled = rng.chance(0.5);
    for (let i = count; i >= 1; i--) {
      const r = i * step;
      if (filled) {
        g.appendChild(svgEl("circle", { cx, cy, r, fill: i % 2 === 0 ? fg : bg }));
      } else {
        g.appendChild(
          svgEl("circle", {
            cx,
            cy,
            r,
            fill: "none",
            stroke: fg,
            "stroke-width": step * rng.range(0.15, 0.4)
          })
        );
      }
    }
    return g;
  }
  registerGenerator({ name: "concentric-circles", category: "geometric", weight: 2, render: render28 });

  // src/generators/concentricHex.ts
  function render29(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const r0 = Math.hypot(bounds.w, bounds.h) * 0.62;
    const flat = rng.chance();
    const rings = rng.int(7, 13);
    const hex = (r) => {
      let d = "";
      for (let k = 0; k < 6; k++) {
        const a = k * Math.PI / 3 + (flat ? 0 : Math.PI / 6);
        const px = (cx + Math.cos(a) * r).toFixed(1);
        const py = (cy + Math.sin(a) * r).toFixed(1);
        d += (k === 0 ? "M" : "L") + px + " " + py;
      }
      return d + "z";
    };
    for (let i = 0; i < rings; i++) {
      const r = r0 * (1 - i / rings);
      if (r < 1) break;
      g.appendChild(svgEl("path", { d: hex(r), fill: i % 2 === 0 ? fg : bg }));
    }
    return g;
  }
  registerGenerator({ name: "concentric-hex", category: "geometric", weight: 2, render: render29 });

  // src/generators/concentricPolygons.ts
  function render30(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const maxR = Math.hypot(bounds.w, bounds.h) / 2;
    const sides = rng.int(3, 8);
    const count = rng.int(6, 18);
    const rotStep = rng.range(0.05, 0.4);
    const filled = rng.chance(0.4);
    const colors = [fg, palette.accent, palette.primary];
    const start = rng.range(0, Math.PI * 2);
    for (let i = 0; i < count; i++) {
      const t = 1 - i / count;
      const r = maxR * t;
      if (r < 1) continue;
      const rot = start + i * rotStep;
      let pts = "";
      for (let s = 0; s < sides; s++) {
        const a = rot + s / sides * Math.PI * 2;
        pts += `${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)} `;
      }
      const color = colors[i % colors.length];
      g.appendChild(
        filled ? svgEl("polygon", { points: pts.trim(), fill: color }) : svgEl("polygon", {
          points: pts.trim(),
          fill: "none",
          stroke: color,
          "stroke-width": (maxR * 0.012 + 0.5).toFixed(2)
        })
      );
    }
    return g;
  }
  registerGenerator({
    name: "concentric-polygons",
    category: "radial",
    weight: 2,
    render: render30
  });

  // src/generators/concentricSquares.ts
  function render31(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w * rng.range(0.3, 0.7);
    const cy = bounds.y + bounds.h * rng.range(0.3, 0.7);
    const reach = Math.max(
      Math.hypot(bounds.x - cx, bounds.y - cy),
      Math.hypot(bounds.x + bounds.w - cx, bounds.y - cy),
      Math.hypot(bounds.x - cx, bounds.y + bounds.h - cy),
      Math.hypot(bounds.x + bounds.w - cx, bounds.y + bounds.h - cy)
    );
    const stroke = Math.max(0.8, Math.min(bounds.w, bounds.h) * rng.range(4e-3, 0.01));
    const step = stroke * rng.range(3, 7);
    const count = Math.min(220, Math.ceil(reach / step));
    const aspect = rng.range(0.8, 1.25);
    let d = "";
    for (let i = count; i >= 1; i--) {
      const hw = i * step;
      const hh = i * step * aspect;
      const x0 = (cx - hw).toFixed(1);
      const y0 = (cy - hh).toFixed(1);
      const x1 = (cx + hw).toFixed(1);
      const y1 = (cy + hh).toFixed(1);
      d += `M${x0} ${y0}H${x1}V${y1}H${x0}Z`;
    }
    g.appendChild(
      svgEl("path", { d, stroke: fg, "stroke-width": stroke.toFixed(2), fill: "none" })
    );
    return g;
  }
  registerGenerator({ name: "concentric-squares", category: "lines", weight: 2, render: render31 });

  // src/generators/confetti.ts
  function render32(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const colors = [palette.primary, palette.accent, palette.colors[3] ?? palette.primary];
    const area = bounds.w * bounds.h;
    const count = Math.min(450, Math.round(area / rng.range(700, 2e3)));
    const base = Math.min(bounds.w, bounds.h);
    for (let i = 0; i < count; i++) {
      const x = bounds.x + rng.next() * bounds.w;
      const y = bounds.y + rng.next() * bounds.h;
      const s = base * rng.range(0.01, 0.05);
      const fill = rng.pick(colors);
      const shape = rng.pick(["circle", "rect", "line"]);
      if (shape === "circle") {
        g.appendChild(svgEl("circle", { cx: x, cy: y, r: s / 2, fill }));
      } else if (shape === "rect") {
        g.appendChild(
          svgEl("rect", {
            x,
            y,
            width: s,
            height: s,
            fill,
            transform: `rotate(${rng.int(0, 90)} ${x + s / 2} ${y + s / 2})`
          })
        );
      } else {
        const a = rng.range(0, Math.PI);
        g.appendChild(
          svgEl("line", {
            x1: x,
            y1: y,
            x2: x + Math.cos(a) * s * 2,
            y2: y + Math.sin(a) * s * 2,
            stroke: fill,
            "stroke-width": s * 0.4,
            "stroke-linecap": "round"
          })
        );
      }
    }
    return g;
  }
  registerGenerator({ name: "confetti", category: "scatter", weight: 2, render: render32 });

  // src/generators/conicGradient.ts
  function render33(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w * rng.range(0.4, 0.6);
    const cy = bounds.y + bounds.h * rng.range(0.4, 0.6);
    const reach = Math.hypot(bounds.w, bounds.h);
    const segments = rng.int(48, 120);
    const start = rng.range(0, Math.PI * 2);
    const ramp = [fg, palette.accent, palette.primary, bg, palette.primary, palette.accent];
    for (let i = 0; i < segments; i++) {
      const a0 = start + i / segments * Math.PI * 2;
      const a1 = start + (i + 1.02) / segments * Math.PI * 2;
      const col = ramp[Math.floor(i / segments * ramp.length) % ramp.length];
      const x0 = cx + Math.cos(a0) * reach;
      const y0 = cy + Math.sin(a0) * reach;
      const x1 = cx + Math.cos(a1) * reach;
      const y1 = cy + Math.sin(a1) * reach;
      g.appendChild(
        svgEl("polygon", {
          points: `${cx.toFixed(1)},${cy.toFixed(1)} ${x0.toFixed(1)},${y0.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`,
          fill: col
        })
      );
    }
    return g;
  }
  registerGenerator({ name: "conic-gradient", category: "gradient", weight: 2, render: render33 });

  // src/generators/contourLines.ts
  function render34(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const hills = [];
    const hillCount = rng.int(3, 6);
    const diag = Math.hypot(bounds.w, bounds.h);
    for (let i = 0; i < hillCount; i++) {
      hills.push({
        x: bounds.x + rng.range(0.05, 0.95) * bounds.w,
        y: bounds.y + rng.range(0.05, 0.95) * bounds.h,
        r: diag * rng.range(0.18, 0.45),
        s: rng.range(0.5, 1) * (rng.chance(0.85) ? 1 : -1)
      });
    }
    const field = (px, py) => {
      let v = 0;
      for (const h of hills) {
        const d2 = (px - h.x) ** 2 + (py - h.y) ** 2;
        v += h.s * Math.exp(-d2 / (2 * h.r * h.r));
      }
      return v;
    };
    const gx = Math.min(120, Math.max(40, Math.round(bounds.w / 10)));
    const gy = Math.min(120, Math.max(40, Math.round(bounds.h / 10)));
    const cw = bounds.w / gx;
    const ch = bounds.h / gy;
    const vals = new Array((gx + 1) * (gy + 1));
    let lo = Infinity;
    let hi = -Infinity;
    for (let j = 0; j <= gy; j++) {
      for (let i = 0; i <= gx; i++) {
        const v = field(bounds.x + i * cw, bounds.y + j * ch);
        vals[j * (gx + 1) + i] = v;
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
    const levels = rng.int(7, 14);
    const stroke = Math.max(0.7, Math.min(bounds.w, bounds.h) * rng.range(25e-4, 6e-3));
    const lerp2 = (a, b, va, vb, t) => a + (t - va) / (vb - va) * (b - a);
    let d = "";
    for (let k = 1; k <= levels; k++) {
      const t = lo + (hi - lo) * k / (levels + 1);
      for (let j = 0; j < gy; j++) {
        for (let i = 0; i < gx; i++) {
          const x0 = bounds.x + i * cw;
          const y0 = bounds.y + j * ch;
          const x1 = x0 + cw;
          const y1 = y0 + ch;
          const tl = vals[j * (gx + 1) + i];
          const tr = vals[j * (gx + 1) + i + 1];
          const br = vals[(j + 1) * (gx + 1) + i + 1];
          const bl = vals[(j + 1) * (gx + 1) + i];
          let idx = 0;
          if (tl > t) idx |= 8;
          if (tr > t) idx |= 4;
          if (br > t) idx |= 2;
          if (bl > t) idx |= 1;
          if (idx === 0 || idx === 15) continue;
          const top = { x: lerp2(x0, x1, tl, tr, t), y: y0 };
          const right = { x: x1, y: lerp2(y0, y1, tr, br, t) };
          const bottom = { x: lerp2(x0, x1, bl, br, t), y: y1 };
          const left = { x: x0, y: lerp2(y0, y1, tl, bl, t) };
          const seg = (a, b) => {
            d += `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
          };
          switch (idx) {
            case 1:
            case 14:
              seg(left, bottom);
              break;
            case 2:
            case 13:
              seg(bottom, right);
              break;
            case 3:
            case 12:
              seg(left, right);
              break;
            case 4:
            case 11:
              seg(top, right);
              break;
            case 6:
            case 9:
              seg(top, bottom);
              break;
            case 7:
            case 8:
              seg(top, left);
              break;
            case 5:
              seg(top, left);
              seg(bottom, right);
              break;
            case 10:
              seg(top, right);
              seg(left, bottom);
              break;
          }
        }
      }
    }
    g.appendChild(
      svgEl("path", { d, stroke: fg, "stroke-width": stroke.toFixed(2), fill: "none" })
    );
    return g;
  }
  registerGenerator({ name: "contour-lines", category: "lines", weight: 2, render: render34 });

  // src/generators/crosshatch.ts
  function render35(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const diag = Math.hypot(bounds.w, bounds.h);
    const layers = rng.int(2, 3);
    const baseAngle = rng.int(0, 180);
    const angleStep = rng.pick([45, 60, 90]);
    const stroke = Math.max(0.6, Math.min(bounds.w, bounds.h) * rng.range(3e-3, 8e-3));
    const spacing = stroke * rng.range(2.5, 5);
    const perLayer = Math.min(360, Math.ceil(diag / spacing) + 1);
    for (let l = 0; l < layers; l++) {
      const angle = baseAngle + l * angleStep + rng.range(-4, 4);
      const rot = svgEl("g", { transform: `rotate(${angle.toFixed(2)} ${cx} ${cy})` });
      let d = "";
      for (let i = 0; i < perLayer; i++) {
        const y = (cy - diag / 2 + i * spacing).toFixed(1);
        const x0 = (cx - diag / 2).toFixed(1);
        const x1 = (cx + diag / 2).toFixed(1);
        d += `M${x0} ${y}H${x1}`;
      }
      rot.appendChild(
        svgEl("path", {
          d,
          stroke: fg,
          "stroke-width": stroke.toFixed(2),
          fill: "none",
          "stroke-opacity": rng.range(0.45, 0.8).toFixed(2)
        })
      );
      g.appendChild(rot);
    }
    return g;
  }
  registerGenerator({ name: "crosshatch", category: "lines", weight: 2, render: render35 });

  // src/generators/crosshatchGradient.ts
  function rampHatch(bounds, angleDeg, lines, bias, startFrac) {
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const diag = Math.hypot(bounds.w, bounds.h);
    const a = angleDeg * Math.PI / 180;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const px = -sa;
    const py = ca;
    let d = "";
    for (let i = 0; i <= lines; i++) {
      const f = i / lines;
      if (f < startFrac) continue;
      const warped = Math.pow(f, bias);
      const off = (warped - 0.5) * diag;
      const ax = cx + px * off - ca * diag;
      const ay = cy + py * off - sa * diag;
      const bx = cx + px * off + ca * diag;
      const by = cy + py * off + sa * diag;
      d += `M${ax.toFixed(1)} ${ay.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}`;
    }
    return d;
  }
  function render36(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const base = rng.pick([0, 30, 45, 60]);
    const lines = rng.int(40, 70);
    const bias = rng.range(1.6, 2.6);
    const sw = Math.min(bounds.w, bounds.h) * rng.range(4e-3, 8e-3);
    const d1 = rampHatch(bounds, base, lines, bias, 0);
    g.appendChild(svgEl("path", { d: d1, fill: "none", stroke: fg, "stroke-width": sw.toFixed(2) }));
    const d2 = rampHatch(bounds, base + 90, lines, bias, 0.5);
    g.appendChild(svgEl("path", { d: d2, fill: "none", stroke: fg, "stroke-width": sw.toFixed(2) }));
    return g;
  }
  registerGenerator({ name: "crosshatch-gradient", category: "line", weight: 2, render: render36 });

  // src/generators/dataMatrix.ts
  function render37(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(16, 38);
    const cell = bounds.w / cols;
    const rows2 = Math.max(1, Math.round(bounds.h / cell));
    const useGlyphs = rng.chance(0.5);
    if (useGlyphs) {
      const fontSize = cell * rng.range(0.8, 1.05);
      const text = svgEl("text", {
        x: bounds.x,
        y: bounds.y,
        fill: fg,
        "font-family": "monospace",
        "font-size": fontSize.toFixed(2),
        "font-weight": "700"
      });
      for (let r = 0; r < rows2; r++) {
        const ty = bounds.y + (r + 0.85) * cell;
        const span = svgEl("tspan", { x: bounds.x + cell * 0.15, y: ty.toFixed(1) });
        let line = "";
        for (let c = 0; c < cols; c++) {
          line += rng.chance(0.5) ? "1" : "0";
        }
        span.textContent = line.split("").join("\u2009");
        span.setAttribute("fill-opacity", rng.range(0.55, 1).toFixed(2));
        text.appendChild(span);
      }
      g.appendChild(text);
    } else {
      const pad = cell * 0.12;
      const s = cell - pad * 2;
      let d = "";
      for (let r = 0; r < rows2; r++) {
        for (let c = 0; c < cols; c++) {
          if (!rng.chance(0.5)) continue;
          const x = bounds.x + c * cell + pad;
          const y = bounds.y + r * cell + pad;
          d += `M${x.toFixed(1)} ${y.toFixed(1)}h${s.toFixed(1)}v${s.toFixed(1)}h${(-s).toFixed(1)}z`;
        }
      }
      g.appendChild(svgEl("path", { d, fill: fg }));
    }
    return g;
  }
  registerGenerator({ name: "data-matrix", category: "techno", weight: 2, render: render37 });

  // src/generators/diagonalStripesGrad.ts
  function render38(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const flip = rng.chance(0.5);
    const maskId = uid("dsg-mask");
    const gradId = uid("dsg-g");
    const grad = svgEl("linearGradient", {
      id: gradId,
      x1: "0",
      y1: "0",
      x2: "1",
      y2: rng.chance(0.5) ? "1" : "0"
    });
    grad.appendChild(svgEl("stop", { offset: "0", "stop-color": flip ? "black" : "white" }));
    grad.appendChild(svgEl("stop", { offset: "1", "stop-color": flip ? "white" : "black" }));
    const mask = svgEl("mask", { id: maskId });
    mask.appendChild(
      svgEl("rect", { x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h, fill: `url(#${gradId})` })
    );
    const defs = svgEl("defs");
    defs.appendChild(grad);
    defs.appendChild(mask);
    g.appendChild(defs);
    const masked = svgEl("g", { mask: `url(#${maskId})` });
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const diag = Math.hypot(bounds.w, bounds.h);
    const angle = rng.pick([45, 135]);
    const count = rng.int(8, 22);
    const stepLen = diag / count;
    const stripeW = stepLen * rng.range(0.35, 0.6);
    const rot = svgEl("g", { transform: `rotate(${angle} ${cx} ${cy})` });
    for (let i = 0; i <= count; i++) {
      const x = cx - diag / 2 + i * stepLen;
      rot.appendChild(
        svgEl("rect", {
          x: x.toFixed(1),
          y: (cy - diag / 2).toFixed(1),
          width: stripeW.toFixed(2),
          height: diag.toFixed(1),
          fill: fg
        })
      );
    }
    masked.appendChild(rot);
    g.appendChild(masked);
    return g;
  }
  registerGenerator({ name: "diagonal-stripes-grad", category: "gradient", weight: 2, render: render38 });

  // src/generators/diamondGrid.ts
  function render39(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(5, 10);
    const dw = bounds.w / cols;
    const dh = dw * rng.range(0.8, 1.4);
    const hw = dw / 2;
    const hh = dh / 2;
    const sw = Math.max(1.5, dw * rng.range(0.06, 0.1));
    const filled = rng.chance(0.4);
    const rows2 = Math.ceil(bounds.h / hh) + 2;
    let d = "";
    for (let j = -1; j < rows2; j++) {
      const cyc = bounds.y + j * hh;
      const offset = (j & 1) === 1 ? hw : 0;
      for (let i = -1; i * dw + offset < bounds.w + dw; i++) {
        const cxc = bounds.x + i * dw + offset;
        d += `M${cxc.toFixed(1)} ${(cyc - hh).toFixed(1)}L${(cxc + hw).toFixed(1)} ${cyc.toFixed(1)}L${cxc.toFixed(1)} ${(cyc + hh).toFixed(1)}L${(cxc - hw).toFixed(1)} ${cyc.toFixed(1)}z`;
      }
    }
    g.appendChild(
      svgEl("path", {
        d,
        fill: filled ? fg : "none",
        stroke: fg,
        "stroke-width": sw,
        "stroke-linejoin": "round"
      })
    );
    return g;
  }
  registerGenerator({ name: "diamond-grid", category: "geometric", weight: 2, render: render39 });

  // src/generators/diamonds.ts
  function render40(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const accent = palette.accent;
    const cols = rng.int(3, 8);
    const dw = bounds.w / cols;
    const ratio = rng.range(1.1, 1.8);
    const dh = dw * ratio;
    const hw = dw / 2;
    const hh = dh / 2;
    const rows2 = Math.ceil(bounds.h / hh) + 2;
    const accentChance = rng.range(0.06, 0.2);
    for (let row = -1; row < rows2; row++) {
      const offset = (row & 1) === 1 ? hw : 0;
      const cy = bounds.y + row * hh;
      for (let c = -1; c <= cols; c++) {
        const cx = bounds.x + c * dw + offset;
        let fill = (row + c) % 2 === 0 ? fg : bg;
        if (rng.chance(accentChance)) fill = accent;
        const pts = `${cx},${(cy - hh).toFixed(2)} ${(cx + hw).toFixed(2)},${cy} ${cx},${(cy + hh).toFixed(2)} ${(cx - hw).toFixed(2)},${cy}`;
        g.appendChild(svgEl("polygon", { points: pts, fill }));
      }
    }
    return g;
  }
  registerGenerator({ name: "diamonds", category: "tiling", weight: 2, render: render40 });

  // src/generators/dotGrid.ts
  function render41(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(8, 22);
    const step = bounds.w / cols;
    const rows2 = Math.max(1, Math.round(bounds.h / step));
    const radius = step * rng.range(0.18, 0.42);
    const stagger = rng.chance(0.4);
    let d = "";
    for (let r = 0; r <= rows2; r++) {
      const offset = stagger && r % 2 === 1 ? step / 2 : 0;
      for (let c = 0; c <= cols; c++) {
        const cx = (bounds.x + offset + c * step).toFixed(1);
        const cy = (bounds.y + r * step).toFixed(1);
        d += `M${cx} ${cy}m${-radius} 0a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`;
      }
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    return g;
  }
  registerGenerator({ name: "dot-grid", category: "dots", weight: 2, render: render41 });

  // src/generators/dotMatrix.ts
  function render42(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const minDim = Math.min(bounds.w, bounds.h);
    const cell = minDim * rng.range(0.045, 0.08);
    const cols = Math.max(4, Math.ceil(bounds.w / cell));
    const rows2 = Math.max(4, Math.ceil(bounds.h / cell));
    const cw = bounds.w / cols;
    const ch = bounds.h / rows2;
    const r = Math.min(cw, ch) * 0.38;
    const bandCount = rng.int(1, 3);
    const bands = [];
    for (let i = 0; i < bandCount; i++) {
      const start = rng.int(0, rows2 - 2);
      bands.push([start, start + rng.int(1, Math.max(1, Math.floor(rows2 / 4)))]);
    }
    const noiseOn = rng.range(0.25, 0.5);
    let lit = "";
    let dim = "";
    for (let row = 0; row < rows2; row++) {
      let inBand = false;
      for (const [s, e] of bands) {
        if (row >= s && row <= e) inBand = true;
      }
      for (let col = 0; col < cols; col++) {
        const cx = bounds.x + (col + 0.5) * cw;
        const cy = bounds.y + (row + 0.5) * ch;
        const on = inBand ? rng.next() < 0.85 : rng.next() < noiseOn;
        const dot3 = `M${cx.toFixed(1)} ${cy.toFixed(1)}m${(-r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(r * 2).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-r * 2).toFixed(1)} 0`;
        if (on) lit += dot3;
        else dim += dot3;
      }
    }
    g.appendChild(svgEl("path", { d: dim, fill: fg, "fill-opacity": "0.18" }));
    g.appendChild(svgEl("path", { d: lit, fill: fg }));
    return g;
  }
  registerGenerator({ name: "dot-matrix", category: "grid", weight: 2, render: render42 });

  // src/generators/dotRadialRamp.ts
  function render43(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(12, 26);
    const step = bounds.w / cols;
    const rows2 = Math.max(1, Math.round(bounds.h / step));
    const fx = bounds.x + bounds.w * rng.range(0.2, 0.8);
    const fy = bounds.y + bounds.h * rng.range(0.2, 0.8);
    const maxDist = Math.hypot(bounds.w, bounds.h);
    const maxR = step * 0.48;
    const grow = rng.chance(0.5);
    const power = rng.range(1, 2.2);
    let d = "";
    for (let r = 0; r <= rows2; r++) {
      for (let c = 0; c <= cols; c++) {
        const cx = bounds.x + c * step;
        const cy = bounds.y + r * step;
        let t = Math.hypot(cx - fx, cy - fy) / maxDist;
        t = Math.min(1, t);
        t = Math.pow(t, power);
        const radius = (grow ? t : 1 - t) * maxR;
        if (radius < 0.4) continue;
        d += `M${cx.toFixed(1)} ${cy.toFixed(1)}m${-radius} 0a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`;
      }
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    return g;
  }
  registerGenerator({ name: "dot-radial-ramp", category: "dots", weight: 2, render: render43 });

  // src/generators/dotRings.ts
  function render44(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const maxR = Math.hypot(bounds.w, bounds.h) / 2;
    const rings = rng.int(8, 20);
    const ringStep = maxR / rings;
    const radius = ringStep * rng.range(0.16, 0.34);
    const jitterPhase = rng.chance(0.5);
    let d = "";
    for (let ring2 = 1; ring2 <= rings; ring2++) {
      const rr = ring2 * ringStep;
      const circ = 2 * Math.PI * rr;
      const n = Math.max(1, Math.round(circ / (ringStep * rng.range(0.7, 1))));
      const phase = jitterPhase ? rng.range(0, Math.PI * 2) : 0;
      for (let i = 0; i < n; i++) {
        const a = phase + i / n * Math.PI * 2;
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        d += `M${x.toFixed(1)} ${y.toFixed(1)}m${-radius} 0a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`;
      }
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    return g;
  }
  registerGenerator({ name: "dot-rings", category: "dots", weight: 2, render: render44 });

  // src/generators/dotSpiral.ts
  function render45(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const maxR = Math.hypot(bounds.w, bounds.h) / 2;
    const golden = rng.chance(0.5);
    const count = rng.int(300, 900);
    const angleStep = golden ? 2.399963 : rng.range(0.25, 0.6);
    const spacing = maxR / Math.sqrt(count);
    const minDot = Math.min(bounds.w, bounds.h) * 4e-3;
    const maxDot = Math.min(bounds.w, bounds.h) * rng.range(0.012, 0.03);
    const grow = rng.chance(0.6);
    let d = "";
    for (let i = 0; i < count; i++) {
      const r = golden ? spacing * Math.sqrt(i) : spacing * i * 0.5;
      if (r > maxR) break;
      const a = i * angleStep;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      const t = r / maxR;
      const radius = grow ? minDot + (maxDot - minDot) * t : maxDot - (maxDot - minDot) * t;
      d += `M${x.toFixed(1)} ${y.toFixed(1)}m${-radius} 0a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`;
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    return g;
  }
  registerGenerator({ name: "dot-spiral", category: "dots", weight: 2, render: render45 });

  // src/generators/dottedFlow.ts
  function render46(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const minDim = Math.min(bounds.w, bounds.h);
    const fa = rng.range(1.5, 4) / bounds.w;
    const fb = rng.range(1.5, 4) / bounds.h;
    const phase = rng.range(0, Math.PI * 2);
    const swirl = rng.range(0.3, 1.2);
    const angleAt = (x, y) => swirl * Math.PI * (Math.sin((x - bounds.x) * fa + phase) + Math.cos((y - bounds.y) * fb));
    const step = minDim * rng.range(0.012, 0.025);
    const dotR = Math.max(0.8, minDim * 4e-3);
    const stepsPerLine = rng.int(14, 30);
    const area = bounds.w * bounds.h;
    const seeds = Math.max(20, Math.min(120, Math.round(area / 7e3)));
    const dotPath = (px, py) => `M${(px - dotR).toFixed(1)} ${py.toFixed(1)}a${dotR.toFixed(1)} ${dotR.toFixed(1)} 0 1 0 ${(dotR * 2).toFixed(1)} 0a${dotR.toFixed(1)} ${dotR.toFixed(1)} 0 1 0 ${(-dotR * 2).toFixed(1)} 0`;
    let d = "";
    for (let s = 0; s < seeds; s++) {
      let x = bounds.x + rng.next() * bounds.w;
      let y = bounds.y + rng.next() * bounds.h;
      for (let k = 0; k < stepsPerLine; k++) {
        d += dotPath(x, y);
        const ang = angleAt(x, y);
        x += Math.cos(ang) * step;
        y += Math.sin(ang) * step;
        if (x < bounds.x || x > bounds.x + bounds.w || y < bounds.y || y > bounds.y + bounds.h) break;
      }
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    const accent = palette.accent;
    const lines = rng.int(6, 16);
    let ld = "";
    for (let s = 0; s < lines; s++) {
      let x = bounds.x + rng.next() * bounds.w;
      let y = bounds.y + rng.next() * bounds.h;
      ld += `M${x.toFixed(1)} ${y.toFixed(1)}`;
      for (let k = 0; k < stepsPerLine * 2; k++) {
        const ang = angleAt(x, y);
        x += Math.cos(ang) * step;
        y += Math.sin(ang) * step;
        if (x < bounds.x || x > bounds.x + bounds.w || y < bounds.y || y > bounds.y + bounds.h) break;
        ld += `L${x.toFixed(1)} ${y.toFixed(1)}`;
      }
    }
    g.appendChild(
      svgEl("path", {
        d: ld,
        stroke: accent,
        "stroke-width": Math.max(1, minDim * 5e-3).toFixed(1),
        "stroke-opacity": "0.8",
        "stroke-linecap": "round",
        fill: "none"
      })
    );
    return g;
  }
  registerGenerator({ name: "dotted-flow", category: "scatter", weight: 2, render: render46 });

  // src/generators/drips.ts
  function render47(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const dripColors = [fg, palette.accent, palette.primary];
    const paint = rng.pick(dripColors);
    const bandH = bounds.h * rng.range(0.08, 0.2);
    g.appendChild(
      svgEl("rect", {
        x: bounds.x,
        y: bounds.y,
        width: bounds.w,
        height: bandH.toFixed(1),
        fill: paint
      })
    );
    const count = Math.max(6, Math.min(60, Math.round(bounds.w / rng.range(18, 50))));
    const slot = bounds.w / count;
    for (let i = 0; i < count; i++) {
      if (rng.chance(0.2)) continue;
      const cx = bounds.x + (i + 0.5) * slot + rng.gaussian(0, slot * 0.15);
      const w = slot * rng.range(0.2, 0.6);
      const len = bandH + (bounds.h - bandH) * rng.range(0.05, 0.85);
      const top = bounds.y + bandH * 0.4;
      const dropR = w * rng.range(0.6, 1.1);
      const bulgeY = len - dropR;
      const color = rng.chance(0.85) ? paint : rng.pick(dripColors);
      const lx = (cx - w / 2).toFixed(1);
      const rx = (cx + w / 2).toFixed(1);
      const d = `M${lx} ${top.toFixed(1)}L${lx} ${bulgeY.toFixed(1)}A${dropR.toFixed(1)} ${dropR.toFixed(1)} 0 1 0 ${rx} ${bulgeY.toFixed(1)}L${rx} ${top.toFixed(1)}z`;
      g.appendChild(svgEl("path", { d, fill: color }));
    }
    return g;
  }
  registerGenerator({ name: "drips", category: "organic", weight: 2, render: render47 });

  // src/generators/duotoneFade.ts
  function render48(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const angle = rng.pick([0, Math.PI / 2, Math.PI / 4, 3 * Math.PI / 4]);
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const id = uid("duo");
    const grad = svgEl("linearGradient", {
      id,
      x1: (0.5 - dx * 0.5).toFixed(3),
      y1: (0.5 - dy * 0.5).toFixed(3),
      x2: (0.5 + dx * 0.5).toFixed(3),
      y2: (0.5 + dy * 0.5).toFixed(3)
    });
    const reverse = rng.chance(0.5);
    const a = reverse ? bg : fg;
    const b = reverse ? fg : bg;
    const mid = rng.range(0.4, 0.6).toFixed(3);
    grad.appendChild(svgEl("stop", { offset: "0", "stop-color": a }));
    grad.appendChild(svgEl("stop", { offset: mid, "stop-color": a, "stop-opacity": "0.7" }));
    grad.appendChild(svgEl("stop", { offset: "1", "stop-color": b }));
    const defs = svgEl("defs");
    defs.appendChild(grad);
    g.appendChild(defs);
    g.appendChild(
      svgEl("rect", { x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h, fill: b })
    );
    g.appendChild(
      svgEl("rect", { x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h, fill: `url(#${id})` })
    );
    return g;
  }
  registerGenerator({ name: "duotone-fade", category: "gradient", weight: 2, render: render48 });

  // src/generators/duotoneHalftone.ts
  function screen(bounds, angleDeg, cell, freq, phase) {
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const diag = Math.hypot(bounds.w, bounds.h);
    const a = angleDeg * Math.PI / 180;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const n = Math.ceil(diag / cell);
    const rMax = cell * 0.62;
    let d = "";
    for (let i = -n; i <= n; i++) {
      for (let j = -n; j <= n; j++) {
        const lx = i * cell;
        const ly = j * cell;
        const x = cx + lx * ca - ly * sa;
        const y = cy + lx * sa + ly * ca;
        const t = (Math.sin(lx * freq + phase) * Math.cos(ly * freq + phase) + 1) / 2;
        const r = rMax * (0.15 + 0.85 * t);
        if (r < 0.4) continue;
        d += `M${x.toFixed(1)} ${y.toFixed(1)}m${(-r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(r * 2).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-r * 2).toFixed(1)} 0`;
      }
    }
    return d;
  }
  function render49(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const second = fg === palette.accent ? palette.primary : palette.accent;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const minDim = Math.min(bounds.w, bounds.h);
    const cell = minDim * rng.range(0.05, 0.085);
    const freq = rng.range(2, 5) / minDim;
    const phase = rng.range(0, Math.PI * 2);
    const d1 = screen(bounds, rng.pick([15, 0, 45]), cell, freq, phase);
    g.appendChild(svgEl("path", { d: d1, fill: fg, "fill-opacity": "0.85" }));
    const d2 = screen(bounds, rng.pick([75, 45, 105]), cell, freq, phase + 1.3);
    g.appendChild(svgEl("path", { d: d2, fill: second, "fill-opacity": "0.7" }));
    return g;
  }
  registerGenerator({ name: "duotone-halftone", category: "halftone", weight: 2, render: render49 });

  // src/generators/engravingLines.ts
  function hatchPath(bounds, angleDeg, count, bow, bowFreq) {
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const diag = Math.hypot(bounds.w, bounds.h);
    const step = diag / count;
    const a = angleDeg * Math.PI / 180;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const px = -sa;
    const py = ca;
    const segs = 24;
    let d = "";
    for (let i = 0; i <= count; i++) {
      const off = -diag / 2 + i * step;
      let line = "";
      for (let s = 0; s <= segs; s++) {
        const along = -diag / 2 + diag * s / segs;
        const disp = bow * Math.sin(along / diag * Math.PI * bowFreq + i * 0.2);
        const bx = cx + ca * along + px * (off + disp);
        const by = cy + sa * along + py * (off + disp);
        line += `${s === 0 ? "M" : "L"}${bx.toFixed(1)} ${by.toFixed(1)}`;
      }
      d += line;
    }
    return d;
  }
  function render50(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const minDim = Math.min(bounds.w, bounds.h);
    const base = rng.pick([0, 30, 45, 60, 90]);
    const count = rng.int(36, 64);
    const bow = minDim * rng.range(0.04, 0.12);
    const bowFreq = rng.range(1, 2.5);
    const sw = Math.hypot(bounds.w, bounds.h) / count * rng.range(0.18, 0.32);
    const d1 = hatchPath(bounds, base, count, bow, bowFreq);
    g.appendChild(
      svgEl("path", { d: d1, fill: "none", stroke: fg, "stroke-width": sw.toFixed(2) })
    );
    const d2 = hatchPath(bounds, base + 90, Math.round(count * 0.6), bow, bowFreq);
    g.appendChild(
      svgEl("path", {
        d: d2,
        fill: "none",
        stroke: fg,
        "stroke-width": (sw * 0.85).toFixed(2),
        "stroke-opacity": "0.75"
      })
    );
    return g;
  }
  registerGenerator({ name: "engraving-lines", category: "line", weight: 2, render: render50 });

  // src/generators/fishScales.ts
  function render51(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const tones = [fg, palette.primary];
    const accent = palette.accent;
    const cols = rng.int(4, 10);
    const r = bounds.w / cols / 2;
    const vStep = r * rng.range(0.55, 0.8);
    const rows2 = Math.ceil(bounds.h / vStep) + 2;
    const accentChance = rng.range(0.04, 0.15);
    for (let row = -1; row < rows2; row++) {
      const cy = bounds.y + row * vStep;
      const offset = (row & 1) === 1 ? r : 0;
      const base = bounds.x - r + offset;
      const cells = cols + 2;
      for (let c = 0; c < cells; c++) {
        const cx = base + c * 2 * r;
        let fill = (row + c) % 2 === 0 ? tones[0] : tones[1];
        if (rng.chance(accentChance)) fill = accent;
        const d = `M ${(cx - r).toFixed(2)} ${cy.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 0 ${(cx + r).toFixed(2)} ${cy.toFixed(2)} Z`;
        g.appendChild(svgEl("path", { d, fill, stroke: bg, "stroke-width": (r * 0.04).toFixed(2) }));
      }
    }
    return g;
  }
  registerGenerator({ name: "fish-scales", category: "tiling", weight: 2, render: render51 });

  // src/generators/flagBars.ts
  function render52(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const inks = rng.shuffle([
      palette.primary,
      palette.accent,
      palette.colors[1] ?? palette.primary,
      palette.colors[2] ?? palette.accent,
      palette.colors[4] ?? palette.primary
    ]);
    const vertical = rng.chance(0.45);
    const bars = rng.int(3, 8);
    const span = vertical ? bounds.w : bounds.h;
    const cross = vertical ? bounds.h : bounds.w;
    const weights = [];
    let total = 0;
    for (let i = 0; i < bars; i++) {
      const w = rng.range(0.6, 1.8);
      weights.push(w);
      total += w;
    }
    let pos = 0;
    for (let i = 0; i < bars; i++) {
      const size = weights[i] / total * span;
      const a = (vertical ? bounds.x : bounds.y) + pos;
      const fill = inks[i % inks.length];
      if (vertical) {
        g.appendChild(svgEl("rect", { x: a, y: bounds.y, width: size, height: bounds.h, fill }));
      } else {
        g.appendChild(svgEl("rect", { x: bounds.x, y: a, width: bounds.w, height: size, fill }));
      }
      if (rng.chance(0.4)) {
        const subFill = inks[(i + 1 + rng.int(0, 1)) % inks.length];
        const subLen = cross * rng.range(0.15, 0.4);
        const atStart = rng.chance();
        if (vertical) {
          g.appendChild(
            svgEl("rect", {
              x: a,
              y: atStart ? bounds.y : bounds.y + bounds.h - subLen,
              width: size,
              height: subLen,
              fill: subFill
            })
          );
        } else {
          g.appendChild(
            svgEl("rect", {
              x: atStart ? bounds.x : bounds.x + bounds.w - subLen,
              y: a,
              width: subLen,
              height: size,
              fill: subFill
            })
          );
        }
      }
      pos += size;
    }
    return g;
  }
  registerGenerator({ name: "flag-bars", category: "memphis", weight: 2, render: render52 });

  // src/generators/glitchBars.ts
  function render53(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const accents = [fg, palette.accent, palette.primary, palette.colors[2] ?? fg];
    const slices = rng.int(14, 40);
    let y = bounds.y;
    for (let i = 0; i < slices && y < bounds.y + bounds.h; i++) {
      const h = bounds.h / slices * rng.range(0.5, 2.2);
      const off = rng.chance(0.55) ? bounds.w * rng.range(-0.25, 0.25) : 0;
      const w = bounds.w * rng.range(0.4, 1);
      const x = bounds.x + off + (off >= 0 ? 0 : 0);
      g.appendChild(
        svgEl("rect", {
          x: x.toFixed(1),
          y: y.toFixed(1),
          width: w.toFixed(1),
          height: (h + 1).toFixed(1),
          fill: rng.pick(accents),
          "fill-opacity": rng.range(0.55, 1).toFixed(2)
        })
      );
      if (rng.chance(0.3)) {
        g.appendChild(
          svgEl("rect", {
            x: (bounds.x + bounds.w * rng.range(-0.1, 0.6)).toFixed(1),
            y: y.toFixed(1),
            width: (bounds.w * rng.range(0.2, 0.5)).toFixed(1),
            height: Math.max(1, h * 0.3).toFixed(1),
            fill: rng.pick(accents),
            "fill-opacity": "0.5"
          })
        );
      }
      y += h;
    }
    return g;
  }
  registerGenerator({ name: "glitch-bars", category: "techno", weight: 2, render: render53 });

  // src/generators/glyphGrid.ts
  function render54(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const script = scriptByName(ctx.text.script);
    const family = ctx.text.font.family;
    const weight = rng.pick([400, 700, 900]);
    const cols = rng.int(4, 10);
    const cw = bounds.w / cols;
    const rows2 = Math.max(2, Math.round(bounds.h / cw));
    const ch = bounds.h / rows2;
    const size = Math.min(cw, ch) * rng.range(0.55, 0.78);
    const pool = Array.from(makeWord(rng, script) + makeWord(rng, script));
    const glyphs = pool.length ? pool : ["A"];
    const accent = palette.accent;
    const dropout = rng.range(0, 0.18);
    for (let r = 0; r < rows2; r++) {
      for (let c = 0; c < cols; c++) {
        if (rng.chance(dropout)) continue;
        const cx = bounds.x + (c + 0.5) * cw;
        const cy = bounds.y + (r + 0.5) * ch + size * 0.35;
        const fill = rng.chance(0.12) ? accent : fg;
        const t = svgEl("text", {
          x: cx,
          y: cy,
          "font-family": family,
          "font-size": size.toFixed(1),
          "font-weight": weight,
          "text-anchor": "middle",
          fill
        });
        t.textContent = rng.pick(glyphs);
        g.appendChild(t);
      }
    }
    return g;
  }
  registerGenerator({ name: "glyph-grid", category: "type", weight: 2, render: render54 });

  // src/generators/gradientBars.ts
  function render55(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const defs = svgEl("defs");
    g.appendChild(defs);
    const vertical = rng.chance(0.5);
    const count = rng.int(4, 12);
    const ramp = [fg, palette.accent, palette.primary, bg];
    const span = vertical ? bounds.h : bounds.w;
    const thickness = span / count;
    const alternate = rng.chance(0.6);
    for (let i = 0; i < count; i++) {
      const id = uid("bar");
      const flip = alternate && i % 2 === 1;
      const grad = svgEl("linearGradient", {
        id,
        x1: vertical ? "0" : flip ? "1" : "0",
        y1: vertical ? flip ? "1" : "0" : "0",
        x2: vertical ? "0" : flip ? "0" : "1",
        y2: vertical ? flip ? "0" : "1" : "0"
      });
      const c0 = ramp[i % ramp.length];
      const c1 = ramp[(i + rng.int(1, 2)) % ramp.length];
      grad.appendChild(svgEl("stop", { offset: "0", "stop-color": c0 }));
      grad.appendChild(svgEl("stop", { offset: "1", "stop-color": c1 }));
      defs.appendChild(grad);
      g.appendChild(
        svgEl("rect", {
          x: vertical ? bounds.x : bounds.x + i * thickness,
          y: vertical ? bounds.y + i * thickness : bounds.y,
          width: vertical ? bounds.w : thickness + 0.5,
          height: vertical ? thickness + 0.5 : bounds.h,
          fill: `url(#${id})`
        })
      );
    }
    return g;
  }
  registerGenerator({ name: "gradient-bars", category: "gradient", weight: 2, render: render55 });

  // src/generators/gradientChecker.ts
  function makeGrad(id, from, to, angle) {
    const rad = angle * Math.PI / 180;
    const x2 = (Math.cos(rad) * 0.5 + 0.5).toFixed(3);
    const y2 = (Math.sin(rad) * 0.5 + 0.5).toFixed(3);
    const x1 = (1 - Number(x2)).toFixed(3);
    const y1 = (1 - Number(y2)).toFixed(3);
    const grad = svgEl("linearGradient", { id, x1, y1, x2, y2 });
    grad.appendChild(svgEl("stop", { offset: "0", "stop-color": from }));
    grad.appendChild(svgEl("stop", { offset: "1", "stop-color": to }));
    return grad;
  }
  function render56(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const angle = rng.range(0, 360);
    const idA = uid("gc-a");
    const idB = uid("gc-b");
    const defs = svgEl("defs");
    defs.appendChild(makeGrad(idA, bg, fg, angle));
    defs.appendChild(makeGrad(idB, fg, bg, angle));
    g.appendChild(defs);
    const cols = rng.int(5, 12);
    const rows2 = Math.max(3, Math.round(cols * (bounds.h / bounds.w)));
    const cw = bounds.w / cols;
    const ch = bounds.h / rows2;
    for (let r = 0; r < rows2; r++) {
      for (let c = 0; c < cols; c++) {
        const fill = (r + c) % 2 === 0 ? `url(#${idA})` : `url(#${idB})`;
        g.appendChild(
          svgEl("rect", {
            x: (bounds.x + c * cw).toFixed(1),
            y: (bounds.y + r * ch).toFixed(1),
            width: (cw + 0.5).toFixed(1),
            height: (ch + 0.5).toFixed(1),
            fill
          })
        );
      }
    }
    return g;
  }
  registerGenerator({ name: "gradient-checker", category: "gradient", weight: 2, render: render56 });

  // src/generators/gradientGrid.ts
  function render57(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const defs = svgEl("defs");
    g.appendChild(defs);
    const cols = rng.int(4, 10);
    const rows2 = Math.max(2, Math.round(cols * bounds.h / bounds.w));
    const cw = bounds.w / cols;
    const ch = bounds.h / rows2;
    const ramp = [fg, palette.accent, palette.primary, bg];
    const swirl = rng.range(0.3, 1.2);
    for (let r = 0; r < rows2; r++) {
      for (let c = 0; c < cols; c++) {
        const id = uid("cell");
        const angle = (c + r) * swirl;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        const grad = svgEl("linearGradient", {
          id,
          x1: (0.5 - dx * 0.5).toFixed(3),
          y1: (0.5 - dy * 0.5).toFixed(3),
          x2: (0.5 + dx * 0.5).toFixed(3),
          y2: (0.5 + dy * 0.5).toFixed(3)
        });
        const idx = (c + r) % ramp.length;
        grad.appendChild(svgEl("stop", { offset: "0", "stop-color": ramp[idx] }));
        grad.appendChild(svgEl("stop", { offset: "1", "stop-color": ramp[(idx + 1) % ramp.length] }));
        defs.appendChild(grad);
        g.appendChild(
          svgEl("rect", {
            x: bounds.x + c * cw,
            y: bounds.y + r * ch,
            width: cw + 0.5,
            height: ch + 0.5,
            fill: `url(#${id})`
          })
        );
      }
    }
    return g;
  }
  registerGenerator({ name: "gradient-grid", category: "gradient", weight: 2, render: render57 });

  // src/generators/gradientHalftone.ts
  function render58(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const minDim = Math.min(bounds.w, bounds.h);
    const cell = minDim * rng.range(0.04, 0.07);
    const cols = Math.max(2, Math.ceil(bounds.w / cell));
    const rows2 = Math.max(2, Math.ceil(bounds.h / cell));
    const cw = bounds.w / cols;
    const ch = bounds.h / rows2;
    const rMax = Math.max(cw, ch) * 0.72;
    const ang = rng.pick([0, Math.PI / 2, Math.PI / 4, 3 * Math.PI / 4, rng.range(0, Math.PI * 2)]);
    const ax = Math.cos(ang);
    const ay = Math.sin(ang);
    const flip = rng.chance();
    let d = "";
    for (let r = 0; r < rows2; r++) {
      for (let c = 0; c < cols; c++) {
        const x = bounds.x + (c + 0.5) * cw;
        const y = bounds.y + (r + 0.5) * ch;
        const nx = (c + 0.5) / cols - 0.5;
        const ny = (r + 0.5) / rows2 - 0.5;
        let t = nx * ax + ny * ay + 0.5;
        if (flip) t = 1 - t;
        t = Math.max(0, Math.min(1, t));
        const rad = rMax * t * t;
        if (rad < 0.4) continue;
        d += `M${x.toFixed(1)} ${y.toFixed(1)}m${(-rad).toFixed(1)} 0a${rad.toFixed(1)} ${rad.toFixed(1)} 0 1 0 ${(rad * 2).toFixed(1)} 0a${rad.toFixed(1)} ${rad.toFixed(1)} 0 1 0 ${(-rad * 2).toFixed(1)} 0`;
      }
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    return g;
  }
  registerGenerator({ name: "gradient-halftone", category: "halftone", weight: 2, render: render58 });

  // src/generators/gradientMesh.ts
  function render59(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const defs = svgEl("defs");
    g.appendChild(defs);
    const colors = [fg, palette.accent, palette.primary, palette.colors[2] ?? fg];
    const blobs = rng.int(4, 8);
    const diag = Math.hypot(bounds.w, bounds.h);
    for (let i = 0; i < blobs; i++) {
      const id = uid("blob");
      const col = colors[i % colors.length];
      const grad = svgEl("radialGradient", { id, cx: "0.5", cy: "0.5", r: "0.5" });
      grad.appendChild(
        svgEl("stop", { offset: "0", "stop-color": col, "stop-opacity": rng.range(0.6, 0.9).toFixed(2) })
      );
      grad.appendChild(svgEl("stop", { offset: "0.6", "stop-color": col, "stop-opacity": "0.25" }));
      grad.appendChild(svgEl("stop", { offset: "1", "stop-color": col, "stop-opacity": "0" }));
      defs.appendChild(grad);
      const cx = bounds.x + rng.range(-0.1, 1.1) * bounds.w;
      const cy = bounds.y + rng.range(-0.1, 1.1) * bounds.h;
      const r = diag * rng.range(0.35, 0.7);
      g.appendChild(
        svgEl("circle", {
          cx: cx.toFixed(1),
          cy: cy.toFixed(1),
          r: r.toFixed(1),
          fill: `url(#${id})`
        })
      );
    }
    return g;
  }
  registerGenerator({ name: "gradient-mesh", category: "gradient", weight: 2, render: render59 });

  // src/generators/gradientRings.ts
  function render60(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w * rng.range(0.35, 0.65);
    const cy = bounds.y + bounds.h * rng.range(0.35, 0.65);
    const maxR = Math.hypot(bounds.w, bounds.h);
    const id = uid("rings");
    const grad = svgEl("radialGradient", { id, cx: "0.5", cy: "0.5", r: "0.7" });
    grad.appendChild(svgEl("stop", { offset: "0", "stop-color": fg }));
    grad.appendChild(svgEl("stop", { offset: "1", "stop-color": bg }));
    const defs = svgEl("defs");
    defs.appendChild(grad);
    g.appendChild(defs);
    g.appendChild(
      svgEl("rect", { x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h, fill: `url(#${id})` })
    );
    const ramp = [fg, palette.accent, palette.primary, bg];
    const count = rng.int(8, 20);
    const step = maxR / count;
    const stroke = step * rng.range(0.4, 0.85);
    for (let i = count; i >= 1; i--) {
      g.appendChild(
        svgEl("circle", {
          cx,
          cy,
          r: i * step,
          fill: "none",
          stroke: ramp[i % ramp.length],
          "stroke-width": stroke.toFixed(2),
          "stroke-opacity": "0.85"
        })
      );
    }
    return g;
  }
  registerGenerator({ name: "gradient-rings", category: "gradient", weight: 2, render: render60 });

  // src/generators/grain.ts
  function render61(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const area = bounds.w * bounds.h;
    const count = Math.min(5e3, Math.round(area / rng.range(40, 110)));
    const dot3 = Math.max(1.2, Math.min(bounds.w, bounds.h) * 8e-3);
    let d = "";
    for (let i = 0; i < count; i++) {
      const x = (bounds.x + rng.next() * bounds.w).toFixed(1);
      const y = (bounds.y + rng.next() * bounds.h).toFixed(1);
      d += `M${x} ${y}h${dot3}v${dot3}h${-dot3}z`;
    }
    g.appendChild(svgEl("path", { d, fill: fg, "fill-opacity": rng.range(0.5, 0.9).toFixed(2) }));
    return g;
  }
  registerGenerator({ name: "grain", category: "noise", weight: 1, render: render61 });

  // src/generators/gridGlitch.ts
  function render62(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const echo = palette.accent === fg ? palette.primary : palette.accent;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const aspect = bounds.w / bounds.h;
    const base = rng.int(8, 14);
    const cols = Math.max(5, Math.round(base * Math.sqrt(aspect)));
    const rows2 = Math.max(5, Math.round(base / Math.sqrt(aspect)));
    const cw = bounds.w / cols;
    const ch = bounds.h / rows2;
    const shift = [];
    for (let r = 0; r < rows2; r++) {
      shift[r] = rng.chance(0.3) ? rng.range(-0.5, 0.5) * cw * rng.int(1, 5) : 0;
    }
    let main = "";
    let echoes = "";
    for (let r = 0; r < rows2; r++) {
      const sy = bounds.y + r * ch;
      for (let c = 0; c < cols; c++) {
        if ((r + c) % 2 === 0 && !rng.chance(0.15)) {
          const x = bounds.x + c * cw + shift[r];
          main += `M${x.toFixed(2)} ${sy.toFixed(2)}h${cw.toFixed(2)}v${ch.toFixed(2)}h-${cw.toFixed(2)}z`;
        }
        if (rng.chance(0.06)) {
          const x = bounds.x + c * cw + rng.range(-1.5, 1.5) * cw;
          const y = sy + rng.range(-0.4, 0.4) * ch;
          echoes += `M${x.toFixed(2)} ${y.toFixed(2)}h${cw.toFixed(2)}v${ch.toFixed(2)}h-${cw.toFixed(2)}z`;
        }
      }
    }
    g.appendChild(svgEl("path", { d: main, fill: fg }));
    g.appendChild(svgEl("path", { d: echoes, fill: echo, "fill-opacity": 0.85 }));
    const slivers = rng.int(2, 5);
    for (let i = 0; i < slivers; i++) {
      const y = bounds.y + rng.range(0, 1) * bounds.h;
      const h = Math.max(1, ch * rng.range(0.08, 0.3));
      g.appendChild(
        svgEl("rect", {
          x: bounds.x,
          y,
          width: bounds.w,
          height: h,
          fill: rng.chance() ? fg : echo,
          "fill-opacity": rng.range(0.5, 0.9)
        })
      );
    }
    return g;
  }
  registerGenerator({ name: "grid-glitch", category: "digital", weight: 2, render: render62 });

  // src/generators/growthRings.ts
  function render63(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const accent = palette.accent === fg ? palette.primary : palette.accent;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const minDim = Math.min(bounds.w, bounds.h);
    const colonies = rng.int(4, 8);
    const segs = 48;
    let dMain = "";
    let dAccent = "";
    for (let cIdx = 0; cIdx < colonies; cIdx++) {
      const cx = bounds.x + rng.range(0.05, 0.95) * bounds.w;
      const cy = bounds.y + rng.range(0.05, 0.95) * bounds.h;
      const maxR = minDim * rng.range(0.18, 0.42);
      const lobes = rng.int(4, 9);
      const phase = rng.range(0, Math.PI * 2);
      const rings = rng.int(4, 8);
      const step = maxR / rings;
      for (let ri = 1; ri <= rings; ri++) {
        const baseR = ri * step;
        const wobble = 0.04 + 0.1 * (ri / rings);
        let ring2 = "";
        for (let i = 0; i <= segs; i++) {
          const a = i / segs * Math.PI * 2;
          const rr = baseR * (1 + wobble * Math.sin(a * lobes + phase));
          const x = cx + Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr;
          ring2 += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
        }
        ring2 += "Z";
        if (ri % 2 === 0) dAccent += ring2;
        else dMain += ring2;
      }
    }
    g.appendChild(svgEl("path", { d: dMain, fill: "none", stroke: fg, "stroke-width": 1.8 }));
    g.appendChild(svgEl("path", { d: dAccent, fill: "none", stroke: accent, "stroke-width": 1.4, "stroke-opacity": 0.85 }));
    return g;
  }
  registerGenerator({ name: "growth-rings", category: "organic", weight: 2, render: render63 });

  // src/layout/geometry.ts
  var GOLDEN = 1.618033988749895;
  function inset(r, amount, amountY = amount) {
    return {
      x: r.x + amount,
      y: r.y + amountY,
      w: r.w - amount * 2,
      h: r.h - amountY * 2
    };
  }
  function center(r) {
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  }
  function splitX(r, t) {
    const w = r.w * t;
    return [
      { x: r.x, y: r.y, w, h: r.h },
      { x: r.x + w, y: r.y, w: r.w - w, h: r.h }
    ];
  }
  function splitY(r, t) {
    const h = r.h * t;
    return [
      { x: r.x, y: r.y, w: r.w, h },
      { x: r.x, y: r.y + h, w: r.w, h: r.h - h }
    ];
  }
  function columns(r, n, gap = 0) {
    const w = (r.w - gap * (n - 1)) / n;
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push({ x: r.x + i * (w + gap), y: r.y, w, h: r.h });
    }
    return out;
  }
  function rows(r, n, gap = 0) {
    const h = (r.h - gap * (n - 1)) / n;
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push({ x: r.x, y: r.y + i * (h + gap), w: r.w, h });
    }
    return out;
  }
  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }
  function rectPath(r) {
    return `M${r.x} ${r.y} h${r.w} v${r.h} h${-r.w} Z`;
  }

  // src/generators/halftoneDots.ts
  function render64(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(10, 28);
    const cell = bounds.w / cols;
    const rows2 = Math.ceil(bounds.h / cell);
    const mode = rng.pick(["h", "v", "r"]);
    const maxR = cell * 0.52;
    for (let r = 0; r < rows2; r++) {
      for (let c = 0; c < cols; c++) {
        const x = bounds.x + (c + 0.5) * cell;
        const y = bounds.y + (r + 0.5) * cell;
        let t;
        if (mode === "h") t = c / (cols - 1);
        else if (mode === "v") t = r / (rows2 - 1);
        else {
          const dx = (x - (bounds.x + bounds.w / 2)) / bounds.w;
          const dy = (y - (bounds.y + bounds.h / 2)) / bounds.h;
          t = clamp(1 - Math.hypot(dx, dy) * 2, 0, 1);
        }
        const radius = maxR * t;
        if (radius < 0.4) continue;
        g.appendChild(svgEl("circle", { cx: x, cy: y, r: radius, fill: fg }));
      }
    }
    return g;
  }
  registerGenerator({ name: "halftone-dots", category: "halftone", weight: 3, render: render64 });

  // src/generators/halftoneLines.ts
  function render65(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const angle = rng.pick([0, 90, 45, 135]);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const diag = Math.hypot(bounds.w, bounds.h);
    const count = rng.int(20, 60);
    const step = diag / count;
    const minW = step * 0.04;
    const maxW = step * rng.range(0.7, 0.95);
    const flip = rng.chance(0.5);
    const rot = svgEl("g", { transform: `rotate(${angle} ${cx} ${cy})` });
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const ramp = flip ? 1 - t : t;
      const w = minW + (maxW - minW) * ramp;
      const x = cx - diag / 2 + i * step + (step - w) / 2;
      rot.appendChild(
        svgEl("rect", { x: x.toFixed(1), y: cy - diag / 2, width: w.toFixed(2), height: diag, fill: fg })
      );
    }
    g.appendChild(rot);
    return g;
  }
  registerGenerator({ name: "halftone-lines", category: "dots", weight: 2, render: render65 });

  // src/generators/herringbone.ts
  function render66(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const tones = [fg, palette.primary, palette.accent];
    const lengthDivs = rng.int(4, 8);
    const len = bounds.w / lengthDivs;
    const wid = len / rng.range(2.6, 3.4);
    const gap = Math.max(0.5, wid * rng.range(0.03, 0.08));
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const rot = svgEl("g", { transform: `rotate(45 ${cx} ${cy})` });
    const diag = Math.hypot(bounds.w, bounds.h);
    const step = wid + len;
    const cols = Math.ceil(diag / wid) + 2;
    const rows2 = Math.ceil(diag / step) + 2;
    let placed = 0;
    for (let r = -rows2; r < rows2 && placed < 1400; r++) {
      for (let c = -cols; c < cols && placed < 1400; c++) {
        const baseX = cx - diag / 2 + c * wid;
        const baseY = cy - diag / 2 + r * step + (c & 1 ? len / 2 : 0);
        const fill = rng.pick(tones);
        rot.appendChild(
          svgEl("rect", {
            x: baseX + gap / 2,
            y: baseY + gap / 2,
            width: wid - gap,
            height: len - gap,
            fill
          })
        );
        placed++;
      }
    }
    g.appendChild(rot);
    return g;
  }
  registerGenerator({ name: "herringbone", category: "tiling", weight: 2, render: render66 });

  // src/generators/hexagonTruncated.ts
  function render67(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const sq = fg === palette.accent ? palette.primary : palette.accent;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(3, 6);
    const step = bounds.w / cols;
    const rows2 = Math.ceil(bounds.h / step) + 2;
    const t = step * 0.3;
    const half = step / 2;
    const r = half - t * 0.15;
    let hexD = "";
    let sqD = "";
    for (let row = -1; row < rows2; row++) {
      const cy = bounds.y + row * step;
      for (let col = -1; col <= cols; col++) {
        const cx = bounds.x + col * step;
        const o = r - t;
        hexD += `M${cx - o} ${cy - r}L${cx + o} ${cy - r}L${cx + r} ${cy - o}L${cx + r} ${cy + o}L${cx + o} ${cy + r}L${cx - o} ${cy + r}L${cx - r} ${cy + o}L${cx - r} ${cy - o}Z`;
        const gx = cx + half;
        const gy = cy + half;
        const s = t * 0.9;
        sqD += `M${gx - s} ${gy - s}h${2 * s}v${2 * s}h${-2 * s}z`;
      }
    }
    g.appendChild(svgEl("path", { d: hexD, fill: fg }));
    g.appendChild(svgEl("path", { d: sqD, fill: sq }));
    return g;
  }
  registerGenerator({ name: "hexagon-truncated", category: "geometric", weight: 2, render: render67 });

  // src/generators/hexagons.ts
  function render68(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const accent = palette.accent;
    const cols = rng.int(4, 9);
    const r = bounds.w / (cols * Math.sqrt(3));
    const hexW = Math.sqrt(3) * r;
    const vStep = r * 1.5;
    const rows2 = Math.ceil(bounds.h / vStep) + 1;
    const corners = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 180 * (60 * i - 90);
      corners.push([r * Math.cos(a), r * Math.sin(a)]);
    }
    const accentChance = rng.range(0.05, 0.18);
    for (let row = -1; row < rows2; row++) {
      const offset = (row & 1) === 1 ? hexW / 2 : 0;
      const cx0 = bounds.x - hexW + offset;
      const cy = bounds.y + row * vStep;
      const cells = Math.ceil(bounds.w / hexW) + 2;
      for (let c = 0; c < cells; c++) {
        const cx = cx0 + c * hexW;
        let fill = (row + c) % 2 === 0 ? fg : bg;
        if (rng.chance(accentChance)) fill = accent;
        let pts = "";
        for (const [dx, dy] of corners) {
          pts += `${(cx + dx).toFixed(2)},${(cy + dy).toFixed(2)} `;
        }
        g.appendChild(svgEl("polygon", { points: pts.trim(), fill }));
      }
    }
    return g;
  }
  registerGenerator({ name: "hexagons", category: "tiling", weight: 2, render: render68 });

  // src/generators/houndstooth.ts
  function render69(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(6, 12);
    const s = bounds.w / cols;
    const rows2 = Math.ceil(bounds.h / s) + 1;
    let d = "";
    for (let r = 0; r < rows2; r += 2) {
      for (let c = -2; c < cols + 2; c += 2) {
        const x = bounds.x + c * s;
        const y = bounds.y + r * s;
        d += tooth(x, y, s);
      }
    }
    g.appendChild(svgEl("path", { d, fill: fg, "fill-rule": "nonzero" }));
    return g;
  }
  function tooth(x, y, s) {
    const p = (a, b) => `${(x + a * s).toFixed(1)} ${(y + b * s).toFixed(1)}`;
    return `M${p(0, 0)}L${p(2, 0)}L${p(2, 1)}L${p(1, 1)}L${p(1, 2)}L${p(0, 2)}ZM${p(2, 1)}L${p(3, 0)}L${p(3, 1)}L${p(2, 2)}ZM${p(-1, 2)}L${p(0, 2)}L${p(1, 3)}L${p(0, 3)}Z`;
  }
  registerGenerator({ name: "houndstooth", category: "retro", weight: 2, render: render69 });

  // src/generators/hudRings.ts
  function render70(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg } = palettePair(ctx, rng);
    const fg = [palette.primary, palette.accent, palette.text, palette.background].map((c) => ({ c, k: contrastRatio(c, bg) })).sort((a, b) => b.k - a.k)[0].c;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w * rng.range(0.35, 0.65);
    const cy = bounds.y + bounds.h * rng.range(0.35, 0.65);
    const maxR = Math.hypot(bounds.w, bounds.h) * rng.range(0.55, 0.8);
    const rings = rng.int(4, 8);
    const stroke = Math.max(1.2, Math.min(bounds.w, bounds.h) * 6e-3);
    let dRings = "";
    for (let i = 1; i <= rings; i++) {
      const r = maxR / rings * i;
      dRings += `M${(cx - r).toFixed(1)} ${cy.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(r * 2).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-r * 2).toFixed(1)} 0`;
    }
    g.appendChild(
      svgEl("path", { d: dRings, fill: "none", stroke: fg, "stroke-width": stroke.toFixed(2), "stroke-opacity": "0.85" })
    );
    const ticks = rng.pick([24, 36, 48, 60]);
    const innerR = maxR * rng.range(0.86, 0.94);
    let dTicks = "";
    for (let i = 0; i < ticks; i++) {
      const a = i / ticks * Math.PI * 2;
      const long = i % rng.pick([3, 4, 6]) === 0;
      const r0 = long ? innerR * 0.9 : innerR;
      dTicks += `M${(cx + Math.cos(a) * r0).toFixed(1)} ${(cy + Math.sin(a) * r0).toFixed(1)}L${(cx + Math.cos(a) * maxR).toFixed(1)} ${(cy + Math.sin(a) * maxR).toFixed(1)}`;
    }
    g.appendChild(svgEl("path", { d: dTicks, fill: "none", stroke: fg, "stroke-width": stroke.toFixed(2) }));
    g.appendChild(
      svgEl("path", {
        d: `M${(cx - maxR).toFixed(1)} ${cy.toFixed(1)}h${(maxR * 2).toFixed(1)}M${cx.toFixed(1)} ${(cy - maxR).toFixed(1)}v${(maxR * 2).toFixed(1)}`,
        fill: "none",
        stroke: fg,
        "stroke-width": (stroke * 0.7).toFixed(2),
        "stroke-opacity": "0.6"
      })
    );
    const accent = contrastRatio(palette.accent, bg) >= 2 ? palette.accent : fg;
    const arcs = rng.int(2, 4);
    for (let i = 0; i < arcs; i++) {
      const r = maxR / rings * rng.int(1, rings);
      const a0 = rng.next() * Math.PI * 2;
      const sweep = rng.range(0.4, 1.4);
      const a1 = a0 + sweep;
      g.appendChild(
        svgEl("path", {
          d: `M${(cx + Math.cos(a0) * r).toFixed(1)} ${(cy + Math.sin(a0) * r).toFixed(1)}A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(cx + Math.cos(a1) * r).toFixed(1)} ${(cy + Math.sin(a1) * r).toFixed(1)}`,
          fill: "none",
          stroke: accent,
          "stroke-width": (stroke * 2.6).toFixed(2),
          "stroke-linecap": "round"
        })
      );
    }
    return g;
  }
  registerGenerator({ name: "hud-rings", category: "techno", weight: 2, render: render70 });

  // src/generators/iridescentBands.ts
  function paletteHsls(ctx) {
    const p = ctx.palette;
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const c of [p.primary, p.accent, ...p.colors.slice(3)]) {
      if (seen.has(c)) continue;
      seen.add(c);
      const rgb = parseColor(c);
      if (rgb) out.push(rgbToHsl(rgb));
    }
    return out.length ? out : [{ h: 220, s: 60, l: 50 }];
  }
  function render71(ctx, bounds) {
    const { rng, palette } = ctx;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, palette.background);
    const hues = paletteHsls(ctx);
    const baseL = clamp(
      hues.reduce((s, h) => s + h.l, 0) / hues.length,
      40,
      62
    );
    const lAmp = rng.range(16, 30);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const diag = Math.hypot(bounds.w, bounds.h);
    const angle = rng.pick([0, 30, 45, 90, 135, rng.int(0, 180)]);
    const count = rng.int(40, 90);
    const step = diag / count;
    const huePeriod = rng.range(4, 9);
    const lightCycles = rng.range(4, 8);
    const rot = svgEl("g", { transform: `rotate(${angle} ${cx} ${cy})` });
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const base = hues[Math.floor(i / huePeriod) % hues.length];
      const l = clamp(baseL + Math.sin(t * Math.PI * lightCycles) * lAmp, 12, 94);
      const x = cx - diag / 2 + i * step;
      rot.appendChild(
        svgEl("rect", {
          x: x.toFixed(1),
          y: (cy - diag / 2).toFixed(1),
          width: (step + 0.6).toFixed(2),
          height: diag.toFixed(1),
          fill: hslCss({ h: base.h, s: Math.max(50, base.s), l })
        })
      );
    }
    g.appendChild(rot);
    return g;
  }
  registerGenerator({ name: "iridescent-bands", category: "gradient", weight: 2, render: render71 });

  // src/generators/isometricBlocks.ts
  function midColor(palette, bg, fg) {
    for (const c of [palette.accent, palette.primary, palette.background]) {
      if (c !== bg && c !== fg) return c;
    }
    return fg;
  }
  function render72(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const mid = midColor(palette, bg, fg);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(5, 10);
    const w = bounds.w / cols;
    const hw = w / 2;
    const qh = hw * 0.5774;
    const cubeH = hw * 1;
    const top = (x, y) => `M${x.toFixed(1)} ${y.toFixed(1)}l${hw.toFixed(1)} ${(-qh).toFixed(1)}l${hw.toFixed(1)} ${qh.toFixed(1)}l${(-hw).toFixed(1)} ${qh.toFixed(1)}z`;
    const left = (x, y) => `M${x.toFixed(1)} ${y.toFixed(1)}l${hw.toFixed(1)} ${qh.toFixed(1)}l0 ${cubeH.toFixed(1)}l${(-hw).toFixed(1)} ${(-qh).toFixed(1)}z`;
    const right = (x, y) => `M${(x + hw).toFixed(1)} ${(y + qh).toFixed(1)}l${hw.toFixed(1)} ${(-qh).toFixed(1)}l0 ${cubeH.toFixed(1)}l${(-hw).toFixed(1)} ${qh.toFixed(1)}z`;
    const stepX = hw;
    const stepY = qh + cubeH;
    let dTop = "";
    let dLeft = "";
    let dRight = "";
    for (let row = -2; row * (stepY / 2) < bounds.h + cubeH; row++) {
      const yBase = bounds.y + row * qh;
      const offset = (row & 1) === 1 ? hw : 0;
      for (let col = -1; col * w + offset < bounds.w + w; col++) {
        const x = bounds.x + col * w + offset - hw;
        const y = yBase;
        if (y > bounds.y + bounds.h + cubeH) continue;
        dTop += top(x, y);
        dLeft += left(x, y);
        dRight += right(x, y);
      }
    }
    void stepX;
    g.appendChild(svgEl("path", { d: dLeft, fill: fg }));
    g.appendChild(svgEl("path", { d: dRight, fill: mid }));
    g.appendChild(svgEl("path", { d: dTop, fill: bg, stroke: fg, "stroke-width": 1 }));
    return g;
  }
  registerGenerator({ name: "isometric-blocks", category: "geometric", weight: 2, render: render72 });

  // src/generators/isometricStairs.ts
  function midColor2(palette, bg, fg) {
    for (const c of [palette.accent, palette.primary, palette.background]) {
      if (c !== bg && c !== fg) return c;
    }
    return fg;
  }
  function render73(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const mid = midColor2(palette, bg, fg);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(5, 9);
    const u = bounds.w / cols;
    const hw = u / 2;
    const qh = hw * 0.5774;
    const rise = hw * 0.85;
    const topFace = (x, y) => `M${x.toFixed(1)} ${y.toFixed(1)}l${hw.toFixed(1)} ${(-qh).toFixed(1)}l${hw.toFixed(1)} ${qh.toFixed(1)}l${(-hw).toFixed(1)} ${qh.toFixed(1)}z`;
    const leftFace = (x, y) => `M${x.toFixed(1)} ${y.toFixed(1)}l${hw.toFixed(1)} ${qh.toFixed(1)}l0 ${rise.toFixed(1)}l${(-hw).toFixed(1)} ${(-qh).toFixed(1)}z`;
    const rightFace = (x, y) => `M${(x + hw).toFixed(1)} ${(y + qh).toFixed(1)}l${hw.toFixed(1)} ${(-qh).toFixed(1)}l0 ${rise.toFixed(1)}l${(-hw).toFixed(1)} ${qh.toFixed(1)}z`;
    let dTop = "";
    let dLeft = "";
    let dRight = "";
    const diagCount = cols + Math.ceil(bounds.h / (qh + rise)) + 4;
    for (let s = -diagCount; s < diagCount; s++) {
      const startX = bounds.x + s * u - bounds.w;
      const startY = bounds.y + bounds.h + 2 * (qh + rise);
      for (let step = 0; step < cols * 2 + 6; step++) {
        const x = startX + step * hw;
        const y = startY - step * (qh + rise);
        if (x > bounds.x + bounds.w + u) break;
        if (y < bounds.y - rise * 2) break;
        if (x < bounds.x - u || y > bounds.y + bounds.h + rise) continue;
        dLeft += leftFace(x, y);
        dRight += rightFace(x, y);
        dTop += topFace(x, y);
      }
    }
    g.appendChild(svgEl("path", { d: dRight, fill: mid }));
    g.appendChild(svgEl("path", { d: dLeft, fill: fg }));
    g.appendChild(svgEl("path", { d: dTop, fill: bg, stroke: fg, "stroke-width": 1 }));
    return g;
  }
  registerGenerator({ name: "isometric-stairs", category: "geometric", weight: 2, render: render73 });

  // src/generators/kaleidoWedges.ts
  function render74(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const maxR = Math.hypot(bounds.w, bounds.h) / 2;
    const segments = rng.int(6, 12);
    const wedge = Math.PI * 2 / segments;
    const colors = rng.sample(
      [fg, palette.accent, palette.primary, ...palette.colors],
      rng.int(2, 4)
    );
    const motif = [];
    const shapes = rng.int(3, 6);
    for (let i = 0; i < shapes; i++) {
      motif.push({
        a0: rng.range(0, wedge),
        r0: rng.range(0, maxR),
        a1: rng.range(0, wedge),
        r1: rng.range(0, maxR),
        a2: rng.range(0, wedge),
        r2: rng.range(0, maxR),
        color: rng.pick(colors)
      });
    }
    const start = rng.range(0, Math.PI * 2);
    for (let s = 0; s < segments; s++) {
      const base = start + s * wedge;
      const flip = s % 2 === 1;
      for (const t of motif) {
        const sign = flip ? -1 : 1;
        const a0 = base + sign * t.a0;
        const a1 = base + sign * t.a1;
        const a2 = base + sign * t.a2;
        const p = (a, r) => `${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`;
        g.appendChild(
          svgEl("polygon", {
            points: `${p(a0, t.r0)} ${p(a1, t.r1)} ${p(a2, t.r2)}`,
            fill: t.color,
            "fill-opacity": "0.85"
          })
        );
      }
    }
    return g;
  }
  registerGenerator({ name: "kaleido-wedges", category: "radial", weight: 2, render: render74 });

  // src/generators/kiteTiles.ts
  function render75(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const dart = fg === palette.accent ? palette.primary : palette.accent;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(3, 6);
    const cell = bounds.w / cols;
    const rows2 = Math.ceil(bounds.h / cell) + 1;
    const k = cell * 0.32;
    let kiteD = "";
    let dartD = "";
    for (let r = -1; r < rows2; r++) {
      for (let c = -1; c <= cols; c++) {
        const x = bounds.x + c * cell;
        const y = bounds.y + r * cell;
        const cx = x + cell / 2;
        const cy = y + cell / 2;
        const top = `${cx} ${y + cell * 0.05}`;
        const right = `${x + cell - k} ${cy}`;
        const bot = `${cx} ${y + cell - cell * 0.05}`;
        const left = `${x + k} ${cy}`;
        kiteD += `M${top}L${right}L${bot}L${left}Z`;
        dartD += `M${x} ${y}L${cx} ${y + cell * 0.05}L${x + k} ${cy}Z`;
        dartD += `M${x + cell} ${y}L${x + cell - k} ${cy}L${cx} ${y + cell * 0.05}Z`;
        dartD += `M${x + cell} ${y + cell}L${cx} ${y + cell - cell * 0.05}L${x + cell - k} ${cy}Z`;
        dartD += `M${x} ${y + cell}L${x + k} ${cy}L${cx} ${y + cell - cell * 0.05}Z`;
      }
    }
    g.appendChild(svgEl("path", { d: dartD, fill: dart }));
    g.appendChild(svgEl("path", { d: kiteD, fill: fg }));
    return g;
  }
  registerGenerator({ name: "kite-tiles", category: "geometric", weight: 2, render: render75 });

  // src/generators/letterCollage.ts
  function render76(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const script = scriptByName(ctx.text.script);
    const family = ctx.text.font.family;
    const palettePool = [fg, palette.accent, palette.primary, palette.colors[1] ?? fg];
    const glyphs = Array.from(makeWord(rng, script) + makeWord(rng, script));
    const pool = glyphs.length ? glyphs : ["A", "B", "C"];
    const base = Math.min(bounds.w, bounds.h);
    const count = rng.int(6, 14);
    for (let i = 0; i < count; i++) {
      const cx = bounds.x + rng.range(0.05, 0.95) * bounds.w;
      const cy = bounds.y + rng.range(0.05, 0.95) * bounds.h;
      const size = base * rng.range(0.35, 1.1);
      const angle = rng.chance(0.5) ? rng.range(-30, 30) : rng.pick([0, 90, -90]);
      const fill = rng.pick(palettePool);
      const t = svgEl("text", {
        x: cx.toFixed(1),
        y: (cy + size * 0.34).toFixed(1),
        "font-family": family,
        "font-size": size.toFixed(1),
        "font-weight": rng.pick([700, 900]),
        "text-anchor": "middle",
        fill,
        "fill-opacity": rng.range(0.6, 1).toFixed(2),
        transform: `rotate(${angle.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})`
      });
      t.textContent = rng.pick(pool);
      g.appendChild(t);
    }
    return g;
  }
  registerGenerator({ name: "letter-collage", category: "type", weight: 2, render: render76 });

  // src/generators/lightningBolts.ts
  function render77(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const segments = [];
    function bolt(a, b, displace, depth) {
      if (displace < 3 || depth > 7) {
        segments.push({ a, b, depth });
        return;
      }
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const off = rng.range(-displace, displace);
      const mid = { x: midX + -dy / len * off, y: midY + dx / len * off };
      bolt(a, mid, displace / 2, depth);
      bolt(mid, b, displace / 2, depth);
      if (depth < 4 && rng.chance(0.45)) {
        const ang = Math.atan2(dy, dx) + rng.range(-0.9, 0.9);
        const blen = len * rng.range(0.5, 0.9);
        const end = { x: mid.x + Math.cos(ang) * blen, y: mid.y + Math.sin(ang) * blen };
        bolt(mid, end, displace / 1.6, depth + 2);
      }
    }
    const startX = bounds.x + rng.range(0.3, 0.7) * bounds.w;
    const endX = bounds.x + rng.range(0.2, 0.8) * bounds.w;
    bolt({ x: startX, y: bounds.y }, { x: endX, y: bounds.y + bounds.h }, bounds.w * 0.32, 0);
    const buildPath = (maxDepth) => {
      let d = "";
      for (const s of segments) {
        if (s.depth > maxDepth) continue;
        d += `M${s.a.x.toFixed(1)} ${s.a.y.toFixed(1)}L${s.b.x.toFixed(1)} ${s.b.y.toFixed(1)}`;
      }
      return d;
    };
    const all = buildPath(99);
    g.appendChild(svgEl("path", { d: all, fill: "none", stroke: fg, "stroke-width": 7, "stroke-opacity": 0.25, "stroke-linecap": "round" }));
    g.appendChild(svgEl("path", { d: all, fill: "none", stroke: fg, "stroke-width": 3.4, "stroke-opacity": 0.55, "stroke-linecap": "round" }));
    g.appendChild(svgEl("path", { d: buildPath(3), fill: "none", stroke: fg, "stroke-width": 1.6, "stroke-linecap": "round" }));
    return g;
  }
  registerGenerator({ name: "lightning-bolts", category: "organic", weight: 2, render: render77 });

  // src/generators/lineScreen.ts
  function render78(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const angle = rng.pick([0, 90, 45, 135]);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const diag = Math.hypot(bounds.w, bounds.h);
    const count = rng.int(28, 56);
    const step = diag / count;
    const freq = rng.range(1.5, 4) * Math.PI / diag;
    const phase = rng.range(0, Math.PI * 2);
    const segs = 40;
    const x0 = cx - diag / 2;
    let d = "";
    for (let i = 0; i <= count; i++) {
      const yc = cy - diag / 2 + i * step;
      const halfWidths = [];
      for (let s = 0; s <= segs; s++) {
        const x = x0 + diag * s / segs;
        const t = (Math.sin(x * freq + i * 0.3 + phase) + 1) / 2;
        halfWidths.push(step * (0.08 + 0.42 * t) / 2);
      }
      for (let s = 0; s <= segs; s++) {
        const x = x0 + diag * s / segs;
        d += `${s === 0 ? "M" : "L"}${x.toFixed(1)} ${(yc - halfWidths[s]).toFixed(1)}`;
      }
      for (let s = segs; s >= 0; s--) {
        const x = x0 + diag * s / segs;
        d += `L${x.toFixed(1)} ${(yc + halfWidths[s]).toFixed(1)}`;
      }
      d += "Z";
    }
    const rot = svgEl("g", { transform: `rotate(${angle} ${cx} ${cy})` });
    rot.appendChild(svgEl("path", { d, fill: fg }));
    g.appendChild(rot);
    return g;
  }
  registerGenerator({ name: "line-screen", category: "halftone", weight: 2, render: render78 });

  // src/generators/lineWaveField.ts
  function render79(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const stroke = Math.max(0.8, Math.min(bounds.w, bounds.h) * rng.range(3e-3, 7e-3));
    const rows2 = Math.min(160, Math.max(12, Math.round(bounds.h / (stroke * rng.range(4, 9)))));
    const rowStep = bounds.h / rows2;
    const cycles = rng.range(1.2, 3.5);
    const omega = cycles * Math.PI * 2 / bounds.w;
    const amp = rowStep * rng.range(0.8, 2.2);
    const phaseDrift = rng.range(0.05, 0.25);
    const samples = Math.min(80, Math.max(24, Math.round(bounds.w / 12)));
    const dx = bounds.w / samples;
    let d = "";
    for (let r = 0; r <= rows2; r++) {
      const baseY = bounds.y + r * rowStep;
      const phase = r * phaseDrift;
      for (let s = 0; s <= samples; s++) {
        const x = bounds.x + s * dx;
        const y = baseY + amp * Math.sin(omega * (x - bounds.x) + phase);
        d += `${s === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      }
    }
    g.appendChild(
      svgEl("path", {
        d,
        stroke: fg,
        "stroke-width": stroke.toFixed(2),
        fill: "none",
        "stroke-linecap": "round"
      })
    );
    return g;
  }
  registerGenerator({ name: "line-wave-field", category: "lines", weight: 2, render: render79 });

  // src/generators/linearGradient.ts
  function render80(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const angle = rng.range(0, 360);
    const rad = angle * Math.PI / 180;
    const x2 = (Math.cos(rad) * 0.5 + 0.5).toFixed(3);
    const y2 = (Math.sin(rad) * 0.5 + 0.5).toFixed(3);
    const x1 = (1 - Number(x2)).toFixed(3);
    const y1 = (1 - Number(y2)).toFixed(3);
    const id = uid("grad");
    const grad = svgEl("linearGradient", { id, x1, y1, x2, y2 });
    const stops = rng.chance(0.5) ? [[0, bg], [1, fg]] : [[0, bg], [0.5, fg], [1, palette.accent]];
    for (const [offset, color] of stops) {
      grad.appendChild(svgEl("stop", { offset, "stop-color": color }));
    }
    const defs = svgEl("defs");
    defs.appendChild(grad);
    g.appendChild(defs);
    g.appendChild(
      svgEl("rect", { x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h, fill: `url(#${id})` })
    );
    return g;
  }
  registerGenerator({ name: "linear-gradient", category: "gradient", weight: 3, render: render80 });

  // src/generators/liquidSwirl.ts
  function render81(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const alt = palette.accent === fg ? palette.primary : palette.accent;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w / 2 + rng.range(-0.1, 0.1) * bounds.w;
    const cy = bounds.y + bounds.h / 2 + rng.range(-0.1, 0.1) * bounds.h;
    const maxR = Math.hypot(bounds.w, bounds.h) * 0.62;
    const turns = rng.range(3.5, 5.5);
    const dir = rng.chance() ? 1 : -1;
    const steps = 360;
    const total = turns * Math.PI * 2;
    const spiral = (phase, color, wScale) => {
      const inner = [];
      const outer = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const ang = dir * t * total + phase;
        const r = maxR * (1 - t) * (1 - t * 0.05);
        const w = (8 + 22 * (1 - t)) * wScale;
        const px = cx + Math.cos(ang) * r;
        const py = cy + Math.sin(ang) * r;
        const nx = -Math.sin(ang);
        const ny = Math.cos(ang);
        inner.push((i === 0 ? "M" : "L") + (px + nx * w).toFixed(1) + " " + (py + ny * w).toFixed(1));
        outer.push("L" + (px - nx * w).toFixed(1) + " " + (py - ny * w).toFixed(1));
      }
      outer.reverse();
      return inner.join("") + outer.join("") + "Z";
    };
    g.appendChild(svgEl("path", { d: spiral(0, fg, 1), fill: fg }));
    g.appendChild(svgEl("path", { d: spiral(Math.PI, alt, 0.6), fill: alt, "fill-opacity": 0.9 }));
    return g;
  }
  registerGenerator({ name: "liquid-swirl", category: "organic", weight: 2, render: render81 });

  // src/generators/logCabin.ts
  function render82(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const hearth = fg === palette.accent ? palette.primary : palette.accent;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(2, 4);
    const cell = bounds.w / cols;
    const rows2 = Math.ceil(bounds.h / cell) + 1;
    const logs = rng.int(3, 4);
    const lw = cell / (2 * logs + 1);
    let fgD = "";
    let hearthD = "";
    for (let r = -1; r < rows2; r++) {
      for (let c = -1; c <= cols; c++) {
        const bx = bounds.x + c * cell;
        const by = bounds.y + r * cell;
        const hx = bx + logs * lw;
        const hy = by + logs * lw;
        hearthD += `M${hx} ${hy}h${lw}v${lw}h${-lw}z`;
        for (let k = 0; k < logs; k++) {
          const lo = (logs - 1 - k) * lw;
          const x0 = bx + lo;
          const y0 = by + lo;
          const span = cell - 2 * lo;
          fgD += `M${x0} ${y0}h${span}v${lw}h${-span}z`;
          fgD += `M${x0 + span - lw} ${y0 + lw}h${lw}v${span - lw}h${-lw}z`;
        }
      }
    }
    g.appendChild(svgEl("path", { d: fgD, fill: fg }));
    g.appendChild(svgEl("path", { d: hearthD, fill: hearth }));
    return g;
  }
  registerGenerator({ name: "log-cabin", category: "geometric", weight: 2, render: render82 });

  // src/generators/lowPoly.ts
  function mix(a, b, t) {
    const pa = /^#([0-9a-f]{6})$/i.exec(a);
    const pb = /^#([0-9a-f]{6})$/i.exec(b);
    if (!pa || !pb) return a;
    const ai = parseInt(pa[1], 16);
    const bi = parseInt(pb[1], 16);
    const ch = (sh) => {
      const av = ai >> sh & 255;
      const bv = bi >> sh & 255;
      return Math.round(av + (bv - av) * t);
    };
    const to2 = (n) => n.toString(16).padStart(2, "0");
    return `#${to2(ch(16))}${to2(ch(8))}${to2(ch(0))}`;
  }
  function render83(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    const aspect = bounds.w / bounds.h;
    const target = rng.int(7, 12);
    const rows2 = Math.max(4, Math.round(target / Math.sqrt(aspect)));
    const cols = Math.max(4, Math.round(target * Math.sqrt(aspect)));
    const cw = bounds.w / cols;
    const ch = bounds.h / rows2;
    const px = [];
    const py = [];
    for (let r = 0; r <= rows2; r++) {
      px[r] = [];
      py[r] = [];
      for (let c = 0; c <= cols; c++) {
        const edge = r === 0 || c === 0 || r === rows2 || c === cols;
        const jx = edge ? 0 : rng.range(-0.4, 0.4) * cw;
        const jy = edge ? 0 : rng.range(-0.4, 0.4) * ch;
        px[r][c] = bounds.x + c * cw + jx;
        py[r][c] = bounds.y + r * ch + jy;
      }
    }
    const ldx = rng.range(-1, 1);
    const ldy = rng.range(-1, 1);
    const tri2 = (x1, y1, x2, y2, x3, y3) => {
      const cx = (x1 + x2 + x3) / 3;
      const cy = (y1 + y2 + y3) / 3;
      const u = (cx - bounds.x) / bounds.w;
      const v = (cy - bounds.y) / bounds.h;
      let t = (u * ldx + v * ldy + 1) / 2;
      t = Math.min(1, Math.max(0, t + rng.range(-0.08, 0.08)));
      g.appendChild(
        svgEl("polygon", {
          points: `${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)}`,
          fill: mix(bg, fg, t),
          stroke: mix(bg, fg, t),
          "stroke-width": 0.6
        })
      );
    };
    for (let r = 0; r < rows2; r++) {
      for (let c = 0; c < cols; c++) {
        const tl = [px[r][c], py[r][c]];
        const tr = [px[r][c + 1], py[r][c + 1]];
        const bl = [px[r + 1][c], py[r + 1][c]];
        const brc = [px[r + 1][c + 1], py[r + 1][c + 1]];
        if (rng.chance()) {
          tri2(tl[0], tl[1], tr[0], tr[1], brc[0], brc[1]);
          tri2(tl[0], tl[1], brc[0], brc[1], bl[0], bl[1]);
        } else {
          tri2(tl[0], tl[1], tr[0], tr[1], bl[0], bl[1]);
          tri2(tr[0], tr[1], brc[0], brc[1], bl[0], bl[1]);
        }
      }
    }
    return g;
  }
  registerGenerator({ name: "low-poly", category: "digital", weight: 2, render: render83 });

  // src/generators/mandalaRings.ts
  function render84(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const maxR = Math.hypot(bounds.w, bounds.h) / 2;
    const layers = rng.int(4, 8);
    const baseCount = rng.int(8, 16);
    const colors = [fg, palette.accent, palette.primary];
    for (let l = 1; l <= layers; l++) {
      const r = l / layers * maxR;
      const count = baseCount + l * rng.int(0, 4);
      const phase = rng.range(0, Math.PI * 2);
      const dot3 = maxR / layers * rng.range(0.15, 0.4);
      const color = colors[l % colors.length];
      const petal = rng.chance(0.5);
      let d = "";
      for (let i = 0; i < count; i++) {
        const a = phase + i / count * Math.PI * 2;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (petal) {
          const tip = dot3 * 1.8;
          const tx = (px + Math.cos(a) * tip).toFixed(2);
          const ty = (py + Math.sin(a) * tip).toFixed(2);
          const bx = (px - Math.cos(a) * tip).toFixed(2);
          const by = (py - Math.sin(a) * tip).toFixed(2);
          d += `M${bx} ${by}Q${(px + Math.cos(a + Math.PI / 2) * dot3).toFixed(2)} ${(py + Math.sin(a + Math.PI / 2) * dot3).toFixed(2)} ${tx} ${ty}Q${(px + Math.cos(a - Math.PI / 2) * dot3).toFixed(2)} ${(py + Math.sin(a - Math.PI / 2) * dot3).toFixed(2)} ${bx} ${by}Z`;
        } else {
          d += `M${px.toFixed(2)} ${py.toFixed(2)}m${-dot3.toFixed(2)} 0a${dot3.toFixed(
            2
          )} ${dot3.toFixed(2)} 0 1 0 ${(dot3 * 2).toFixed(2)} 0a${dot3.toFixed(2)} ${dot3.toFixed(
            2
          )} 0 1 0 ${(-dot3 * 2).toFixed(2)} 0z`;
        }
      }
      g.appendChild(svgEl("path", { d, fill: color }));
    }
    return g;
  }
  registerGenerator({ name: "mandala-rings", category: "radial", weight: 2, render: render84 });

  // src/generators/marble.ts
  function render85(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const vein = palette.accent === fg ? palette.primary : palette.accent;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const swirls = rng.int(2, 4);
    const sx = [];
    const sy = [];
    const sa = [];
    const sf = [];
    for (let i = 0; i < swirls; i++) {
      sx.push(bounds.x + rng.range(0.1, 0.9) * bounds.w);
      sy.push(bounds.y + rng.range(0.1, 0.9) * bounds.h);
      sa.push(rng.range(0.12, 0.3) * Math.min(bounds.w, bounds.h));
      sf.push(rng.range(2e-3, 6e-3));
    }
    const lines = rng.int(28, 46);
    const cols = 70;
    const step = bounds.w / cols;
    let dMain = "";
    let dVein = "";
    for (let i = 0; i <= lines; i++) {
      const baseY = bounds.y + i / lines * bounds.h;
      let path = "";
      for (let c = 0; c <= cols; c++) {
        const x = bounds.x + c * step;
        let y = baseY;
        for (let s = 0; s < swirls; s++) {
          const dx = x - sx[s];
          const dy = baseY - sy[s];
          const dist = Math.hypot(dx, dy) + 1;
          const pull = sa[s] * Math.exp(-dist * 4e-3);
          y += Math.sin(dist * sf[s] * 6) * pull * 0.35;
          y += (sy[s] - baseY) * Math.exp(-dist * 6e-3) * 0.25;
        }
        path += (c === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
      }
      if (i % 4 === 0) dVein += path;
      else dMain += path;
    }
    g.appendChild(svgEl("path", { d: dMain, fill: "none", stroke: fg, "stroke-width": 1.4, "stroke-opacity": 0.85 }));
    g.appendChild(svgEl("path", { d: dVein, fill: "none", stroke: vein, "stroke-width": 2.6 }));
    return g;
  }
  registerGenerator({ name: "marble", category: "organic", weight: 2, render: render85 });

  // src/generators/marqueeBulbs.ts
  function render86(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(8, 16);
    const step = bounds.w / cols;
    const rows2 = Math.max(1, Math.round(bounds.h / step));
    const rh = bounds.h / rows2;
    const bulbR = Math.min(step, rh) * rng.range(0.2, 0.3);
    const phase = rng.int(2, 3);
    const litChance = rng.range(0.55, 0.75);
    const halos = svgEl("g", { fill: fg, "fill-opacity": "0.22" });
    const bulbsLit = svgEl("g", { fill: fg });
    const bulbsDim = svgEl("g", { fill: fg, "fill-opacity": "0.4" });
    for (let r = 0; r < rows2; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = bounds.x + (c + 0.5) * step;
        const cy = bounds.y + (r + 0.5) * rh;
        const lit = (c + r) % phase === 0 ? true : rng.chance(litChance);
        if (lit) {
          halos.appendChild(circle(cx, cy, bulbR * 2));
          bulbsLit.appendChild(circle(cx, cy, bulbR));
        } else {
          bulbsDim.appendChild(circle(cx, cy, bulbR));
        }
      }
    }
    g.appendChild(halos);
    g.appendChild(bulbsDim);
    g.appendChild(bulbsLit);
    return g;
  }
  function circle(cx, cy, r) {
    return svgEl("circle", { cx: cx.toFixed(1), cy: cy.toFixed(1), r: r.toFixed(1) });
  }
  registerGenerator({ name: "marquee-bulbs", category: "retro", weight: 2, render: render86 });

  // src/generators/memphisShapes.ts
  function render87(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const inks = [palette.primary, palette.accent, palette.colors[2] ?? palette.primary];
    const area = bounds.w * bounds.h;
    const unit = Math.min(bounds.w, bounds.h);
    const count = Math.min(220, Math.max(12, Math.round(area / (unit * unit * 0.05))));
    for (let i = 0; i < count; i++) {
      const cx = bounds.x + rng.next() * bounds.w;
      const cy = bounds.y + rng.next() * bounds.h;
      const s = unit * rng.range(0.04, 0.12);
      const fill = rng.pick(inks);
      const stroke = rng.pick(inks);
      const angle = rng.int(0, 360);
      const node = svgEl("g", { transform: `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${angle})` });
      const kind = rng.weighted(
        ["dot", "triangle", "squiggle", "bar", "cross", "arc"],
        [3, 2, 2, 2, 1, 1]
      );
      switch (kind) {
        case "dot":
          node.appendChild(svgEl("circle", { cx: 0, cy: 0, r: s, fill }));
          break;
        case "triangle":
          node.appendChild(
            svgEl("polygon", { points: `0 ${-s} ${s} ${s} ${-s} ${s}`, fill })
          );
          break;
        case "squiggle":
          node.appendChild(
            svgEl("path", {
              d: `M ${-s * 1.6} 0 q ${s * 0.8} ${-s} ${s * 1.6} 0 t ${s * 1.6} 0`,
              fill: "none",
              stroke,
              "stroke-width": s * 0.45,
              "stroke-linecap": "round"
            })
          );
          break;
        case "bar":
          node.appendChild(
            svgEl("rect", { x: -s, y: -s * 0.32, width: s * 2, height: s * 0.64, fill })
          );
          break;
        case "cross":
          node.appendChild(
            svgEl("path", {
              d: `M ${-s} 0 H ${s} M 0 ${-s} V ${s}`,
              stroke: fill,
              "stroke-width": s * 0.4,
              "stroke-linecap": "round"
            })
          );
          break;
        case "arc":
          node.appendChild(
            svgEl("path", {
              d: `M ${-s} 0 A ${s} ${s} 0 0 1 ${s} 0`,
              fill: "none",
              stroke,
              "stroke-width": s * 0.4,
              "stroke-linecap": "round"
            })
          );
          break;
      }
      g.appendChild(node);
    }
    return g;
  }
  registerGenerator({ name: "memphis-shapes", category: "memphis", weight: 2, render: render87 });

  // src/generators/metaballs.ts
  function render88(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const core = palette.accent === fg ? palette.primary : palette.accent;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const minDim = Math.min(bounds.w, bounds.h);
    const ballCount = rng.int(5, 10);
    const bx = [];
    const by = [];
    const br = [];
    for (let i = 0; i < ballCount; i++) {
      bx.push(bounds.x + rng.range(0.12, 0.88) * bounds.w);
      by.push(bounds.y + rng.range(0.12, 0.88) * bounds.h);
      br.push(minDim * rng.range(0.08, 0.18));
    }
    const area = bounds.w * bounds.h;
    const cells = Math.min(4200, Math.round(area / 60));
    const aspect = bounds.w / bounds.h;
    const gridW = Math.max(20, Math.round(Math.sqrt(cells * aspect)));
    const gridH = Math.max(20, Math.round(cells / gridW));
    const cw = bounds.w / gridW;
    const ch = bounds.h / gridH;
    const field = new Float64Array(gridW * gridH);
    for (let r = 0; r < gridH; r++) {
      const cy = bounds.y + (r + 0.5) * ch;
      for (let c = 0; c < gridW; c++) {
        const cx = bounds.x + (c + 0.5) * cw;
        let sum = 0;
        for (let i = 0; i < ballCount; i++) {
          const dx = cx - bx[i];
          const dy = cy - by[i];
          sum += br[i] * br[i] / (dx * dx + dy * dy + 1);
        }
        field[r * gridW + c] = sum;
      }
    }
    const tBody = rng.range(0.8, 1.2);
    const tCore = rng.range(2.2, 3.6);
    const emit = (threshold, fill) => {
      let d = "";
      for (let r = 0; r < gridH; r++) {
        for (let c = 0; c < gridW; c++) {
          if (field[r * gridW + c] < threshold) continue;
          const x = (bounds.x + c * cw).toFixed(1);
          const y = (bounds.y + r * ch).toFixed(1);
          d += `M${x} ${y}h${(cw + 0.6).toFixed(1)}v${(ch + 0.6).toFixed(1)}h${(-cw - 0.6).toFixed(1)}z`;
        }
      }
      if (d) g.appendChild(svgEl("path", { d, fill }));
    };
    emit(tBody, fg);
    emit(tCore, core);
    return g;
  }
  registerGenerator({ name: "metaballs", category: "organic", weight: 2, render: render88 });

  // src/generators/mezzotint.ts
  function render89(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const ang = rng.range(0, Math.PI * 2);
    const ax = Math.cos(ang);
    const ay = Math.sin(ang);
    const flip = rng.chance();
    const minDim = Math.min(bounds.w, bounds.h);
    const rMax = minDim * rng.range(6e-3, 0.012);
    const attempts = 4500;
    let d = "";
    for (let i = 0; i < attempts; i++) {
      const x = bounds.x + rng.next() * bounds.w;
      const y = bounds.y + rng.next() * bounds.h;
      const u = ((x - bounds.x) / bounds.w - 0.5) * ax + ((y - bounds.y) / bounds.h - 0.5) * ay;
      let keep = u + 0.5;
      if (flip) keep = 1 - keep;
      if (rng.next() > keep * keep) continue;
      const r = rMax * rng.range(0.5, 1);
      d += `M${x.toFixed(1)} ${y.toFixed(1)}m${(-r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(r * 2).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-r * 2).toFixed(1)} 0`;
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    return g;
  }
  registerGenerator({ name: "mezzotint", category: "halftone", weight: 2, render: render89 });

  // src/generators/microdots.ts
  function render90(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = Math.min(46, rng.int(30, 46));
    const step = bounds.w / cols;
    const rows2 = Math.min(48, Math.max(1, Math.round(bounds.h / step)));
    const radius = Math.max(0.6, step * rng.range(0.12, 0.22));
    const stagger = rng.chance(0.6);
    let d = "";
    for (let r = 0; r <= rows2; r++) {
      const off = stagger && r % 2 === 1 ? step / 2 : 0;
      for (let c = 0; c <= cols; c++) {
        const cx = (bounds.x + off + c * step).toFixed(2);
        const cy = (bounds.y + r * step).toFixed(2);
        d += `M${cx} ${cy}m${-radius} 0a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`;
      }
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    return g;
  }
  registerGenerator({ name: "microdots", category: "dots", weight: 1, render: render90 });

  // src/generators/moire.ts
  function lineGrid(cx, cy, diag, angle, spacing, stroke, color, opacity) {
    const count = Math.min(420, Math.ceil(diag / spacing) + 1);
    let d = "";
    for (let i = 0; i < count; i++) {
      const y = (cy - diag / 2 + i * spacing).toFixed(1);
      d += `M${(cx - diag / 2).toFixed(1)} ${y}H${(cx + diag / 2).toFixed(1)}`;
    }
    const rot = svgEl("g", { transform: `rotate(${angle.toFixed(2)} ${cx} ${cy})` });
    rot.appendChild(
      svgEl("path", {
        d,
        stroke: color,
        "stroke-width": stroke.toFixed(2),
        fill: "none",
        "stroke-opacity": opacity.toFixed(2)
      })
    );
    return rot;
  }
  function render91(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const diag = Math.hypot(bounds.w, bounds.h);
    const stroke = Math.max(0.6, Math.min(bounds.w, bounds.h) * rng.range(4e-3, 9e-3));
    const spacing = stroke * rng.range(2.5, 4.5);
    const angleA = rng.int(0, 180);
    const angleB = angleA + rng.range(2, 12) * (rng.chance() ? 1 : -1);
    const second = ctx.palette.accent;
    g.appendChild(lineGrid(cx, cy, diag, angleA, spacing, stroke, fg, 0.85));
    g.appendChild(
      lineGrid(cx, cy, diag, angleB, spacing * rng.range(0.92, 1.08), stroke, second, 0.7)
    );
    return g;
  }
  registerGenerator({ name: "moire", category: "lines", weight: 2, render: render91 });

  // src/generators/neonTubes.ts
  function render92(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    const dark = palette.backgroundIsDark ? palette.background : bg;
    baseFill(g, bounds, dark);
    const tubes = rng.int(3, 6);
    const minDim = Math.min(bounds.w, bounds.h);
    const core = Math.max(2, minDim * rng.range(0.012, 0.02));
    const colors = [fg, palette.accent, palette.primary];
    for (let t = 0; t < tubes; t++) {
      const color = rng.pick(colors);
      const d = tubePath(rng, bounds);
      const common = {
        d,
        fill: "none",
        stroke: color,
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      };
      g.appendChild(svgEl("path", { ...common, "stroke-width": (core * 6).toFixed(1), "stroke-opacity": "0.18" }));
      g.appendChild(svgEl("path", { ...common, "stroke-width": (core * 3).toFixed(1), "stroke-opacity": "0.35" }));
      g.appendChild(svgEl("path", { ...common, "stroke-width": core.toFixed(1), "stroke-opacity": "0.95" }));
    }
    return g;
  }
  function tubePath(rng, bounds) {
    const segs = rng.int(2, 4);
    const horizontal = rng.chance(0.5);
    let x = bounds.x + rng.range(0.1, 0.4) * bounds.w;
    let y = bounds.y + rng.range(0.1, 0.4) * bounds.h;
    let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
    for (let i = 0; i < segs; i++) {
      const nx = bounds.x + rng.range(0.1, 0.9) * bounds.w;
      const ny = bounds.y + rng.range(0.1, 0.9) * bounds.h;
      const cx = horizontal ? nx : x;
      const cy = horizontal ? y : ny;
      d += `Q${cx.toFixed(1)} ${cy.toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)}`;
      x = nx;
      y = ny;
    }
    return d;
  }
  registerGenerator({ name: "neon-tubes", category: "retro", weight: 2, render: render92 });

  // src/generators/nestedArcs.ts
  function render93(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(2, 5);
    const cw = bounds.w / cols;
    const rows2 = Math.max(1, Math.round(bounds.h / cw));
    const ch = bounds.h / rows2;
    const cell = Math.min(cw, ch);
    const stroke = Math.max(0.8, cell * rng.range(0.012, 0.025));
    const arcsPer = Math.min(14, Math.max(3, Math.round(cell / (stroke * 3))));
    const step = cell * 0.95 / arcsPer;
    const corners = [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1]
    ];
    let d = "";
    for (let r = 0; r < rows2; r++) {
      for (let c = 0; c < cols; c++) {
        const ox = bounds.x + c * cw;
        const oy = bounds.y + r * ch;
        const corner = rng.pick(corners);
        const ax = ox + corner[0] * cw;
        const ay = oy + corner[1] * ch;
        const sweep = corner[0] === corner[1] ? 1 : 0;
        for (let i = 1; i <= arcsPer; i++) {
          const rad = i * step;
          const sx = (ax + (corner[0] ? -rad : rad)).toFixed(1);
          const sy = ay.toFixed(1);
          const ex = ax.toFixed(1);
          const ey = (ay + (corner[1] ? -rad : rad)).toFixed(1);
          d += `M${sx} ${sy}A${rad.toFixed(1)} ${rad.toFixed(1)} 0 0 ${sweep} ${ex} ${ey}`;
        }
      }
    }
    g.appendChild(
      svgEl("path", { d, stroke: fg, "stroke-width": stroke.toFixed(2), fill: "none" })
    );
    return g;
  }
  registerGenerator({ name: "nested-arcs", category: "lines", weight: 2, render: render93 });

  // src/generators/nestedSquares.ts
  function squarePoints(cx, cy, half, deg) {
    const a = deg * Math.PI / 180;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const corners = [
      [-half, -half],
      [half, -half],
      [half, half],
      [-half, half]
    ];
    return corners.map(
      ([dx, dy]) => `${(cx + dx * cos - dy * sin).toFixed(2)},${(cy + dx * sin + dy * cos).toFixed(2)}`
    ).join(" ");
  }
  function render94(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const tones = [fg, palette.primary, palette.accent, bg];
    const cols = rng.int(2, 6);
    const cell = bounds.w / cols;
    const rows2 = Math.ceil(bounds.h / cell);
    const depth = rng.int(4, 8);
    const shrink = rng.range(0.74, 0.86);
    const twist = rng.range(8, 22) * (rng.chance(0.5) ? 1 : -1);
    for (let r = 0; r < rows2; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = bounds.x + (c + 0.5) * cell;
        const cy = bounds.y + (r + 0.5) * cell;
        let half = cell / 2 * 0.96;
        let deg = (r + c) % 2 === 0 ? 0 : twist / 2;
        for (let d = 0; d < depth && half > 1; d++) {
          const fill = tones[d % tones.length];
          g.appendChild(svgEl("polygon", { points: squarePoints(cx, cy, half, deg), fill }));
          half *= shrink;
          deg += twist;
        }
      }
    }
    return g;
  }
  registerGenerator({ name: "nested-squares", category: "tiling", weight: 2, render: render94 });

  // src/generators/nestedTriangles.ts
  function render95(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const r0 = Math.hypot(bounds.w, bounds.h) * 0.75;
    const rot = (rng.int(0, 5) * 60 + (rng.chance() ? 30 : 0)) * (Math.PI / 180);
    const rings = rng.int(8, 16);
    const tri2 = (r) => {
      let d = "";
      for (let k = 0; k < 3; k++) {
        const a = rot + k * 2 * Math.PI / 3 - Math.PI / 2;
        const px = (cx + Math.cos(a) * r).toFixed(1);
        const py = (cy + Math.sin(a) * r).toFixed(1);
        d += (k === 0 ? "M" : "L") + px + " " + py;
      }
      return d + "z";
    };
    for (let i = 0; i < rings; i++) {
      const r = r0 * (1 - i / rings);
      if (r < 1) break;
      g.appendChild(svgEl("path", { d: tri2(r), fill: i % 2 === 0 ? fg : bg }));
    }
    return g;
  }
  registerGenerator({ name: "nested-triangles", category: "geometric", weight: 2, render: render95 });

  // src/generators/nodesEdges.ts
  function render96(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const area = bounds.w * bounds.h;
    const n = Math.min(140, Math.max(12, Math.round(area / rng.range(9e3, 22e3))));
    const nodes = [];
    for (let i = 0; i < n; i++) {
      nodes.push({
        x: bounds.x + rng.next() * bounds.w,
        y: bounds.y + rng.next() * bounds.h
      });
    }
    const k = rng.int(2, 3);
    const linkR = Math.hypot(bounds.w, bounds.h) * rng.range(0.18, 0.32);
    const linkR2 = linkR * linkR;
    let edges = "";
    for (let i = 0; i < n; i++) {
      const dists = [];
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 <= linkR2) dists.push({ j, d2 });
      }
      dists.sort((a, b) => a.d2 - b.d2);
      for (let m = 0; m < Math.min(k, dists.length); m++) {
        const j = dists[m].j;
        if (j < i) continue;
        edges += `M${nodes[i].x.toFixed(1)} ${nodes[i].y.toFixed(1)}L${nodes[j].x.toFixed(1)} ${nodes[j].y.toFixed(1)}`;
      }
    }
    const stroke = Math.max(0.6, Math.min(bounds.w, bounds.h) * 25e-4);
    g.appendChild(
      svgEl("path", {
        d: edges,
        fill: "none",
        stroke: fg,
        "stroke-width": stroke.toFixed(2),
        "stroke-opacity": "0.5"
      })
    );
    const nodeR = Math.max(2, Math.min(bounds.w, bounds.h) * rng.range(6e-3, 0.012));
    let dots = "";
    for (const p of nodes) {
      dots += `M${(p.x - nodeR).toFixed(1)} ${p.y.toFixed(1)}a${nodeR.toFixed(1)} ${nodeR.toFixed(1)} 0 1 0 ${(nodeR * 2).toFixed(1)} 0a${nodeR.toFixed(1)} ${nodeR.toFixed(1)} 0 1 0 ${(-nodeR * 2).toFixed(1)} 0z`;
    }
    g.appendChild(svgEl("path", { d: dots, fill: palette.accent }));
    return g;
  }
  registerGenerator({ name: "nodes-edges", category: "techno", weight: 2, render: render96 });

  // src/generators/noiseGradient.ts
  function render97(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const vertical = rng.chance(0.5);
    const id = uid("ng");
    const grad = svgEl("linearGradient", {
      id,
      x1: "0",
      y1: "0",
      x2: vertical ? "0" : "1",
      y2: vertical ? "1" : "0"
    });
    grad.appendChild(svgEl("stop", { offset: "0", "stop-color": bg }));
    grad.appendChild(svgEl("stop", { offset: "1", "stop-color": fg }));
    const defs = svgEl("defs");
    defs.appendChild(grad);
    g.appendChild(defs);
    g.appendChild(
      svgEl("rect", { x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h, fill: `url(#${id})` })
    );
    const cols = 60;
    const rows2 = Math.max(20, Math.round(cols * (bounds.h / bounds.w)));
    const cw = bounds.w / cols;
    const ch = bounds.h / rows2;
    const r = Math.min(cw, ch) * 0.42;
    let d = "";
    let count = 0;
    for (let ry = 0; ry < rows2 && count < 1400; ry++) {
      for (let cx2 = 0; cx2 < cols && count < 1400; cx2++) {
        const t = vertical ? ry / (rows2 - 1) : cx2 / (cols - 1);
        if (rng.next() > t) continue;
        const px = bounds.x + (cx2 + 0.5) * cw;
        const py = bounds.y + (ry + 0.5) * ch;
        d += `M${px.toFixed(1)} ${py.toFixed(1)}m${(-r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(r * 2).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-r * 2).toFixed(1)} 0z`;
        count++;
      }
    }
    if (d) g.appendChild(svgEl("path", { d, fill: fg, "fill-opacity": "0.8" }));
    return g;
  }
  registerGenerator({ name: "noise-gradient", category: "gradient", weight: 2, render: render97 });

  // src/generators/numberGrid.ts
  function digits(rng, n) {
    let s = "";
    for (let i = 0; i < n; i++) s += String(rng.int(0, 9));
    return s;
  }
  function render98(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const family = ctx.text.font.family;
    const weight = rng.pick([400, 500, 700]);
    const cols = rng.int(4, 9);
    const cw = bounds.w / cols;
    const rows2 = Math.max(3, Math.round(bounds.h / (cw * rng.range(0.32, 0.5))));
    const ch = bounds.h / rows2;
    const size = ch * rng.range(0.58, 0.78);
    const len = rng.int(2, 5);
    const pad = cw * 0.12;
    for (let r = 0; r < rows2; r++) {
      for (let c = 0; c < cols; c++) {
        if (rng.chance(0.05)) continue;
        const x = bounds.x + (c + 1) * cw - pad;
        const y = bounds.y + (r + 0.5) * ch + size * 0.35;
        const flagged = rng.chance(0.08);
        const t = svgEl("text", {
          x: x.toFixed(1),
          y: y.toFixed(1),
          "font-family": family,
          "font-size": size.toFixed(1),
          "font-weight": flagged ? 800 : weight,
          "text-anchor": "end",
          fill: flagged ? palette.accent : fg
        });
        t.textContent = digits(rng, rng.chance(0.85) ? len : rng.int(1, len + 2));
        g.appendChild(t);
      }
    }
    return g;
  }
  registerGenerator({ name: "number-grid", category: "type", weight: 2, render: render98 });

  // src/generators/opticalBulge.ts
  function render99(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w / 2 + rng.range(-0.15, 0.15) * bounds.w;
    const cy = bounds.y + bounds.h / 2 + rng.range(-0.15, 0.15) * bounds.h;
    const radius = Math.hypot(bounds.w, bounds.h) * rng.range(0.45, 0.65);
    const strength = rng.range(0.35, 0.6);
    const warp = (x, y) => {
      const dx = x - cx;
      const dy = y - cy;
      const d2 = Math.hypot(dx, dy);
      if (d2 >= radius || d2 < 1e-3) return [x, y];
      const t = d2 / radius;
      const f = 1 + strength * Math.sin(t * Math.PI) * (1 - t * 0.5);
      return [cx + dx * f, cy + dy * f];
    };
    const cols = rng.int(14, 22);
    const rows2 = Math.max(8, Math.round(cols * bounds.h / bounds.w));
    const sw = Math.min(bounds.w, bounds.h) / cols * 0.12;
    const pad = bounds.w / cols;
    const x0 = bounds.x - pad;
    const y0 = bounds.y - pad;
    const gw = bounds.w + 2 * pad;
    const gh = bounds.h + 2 * pad;
    const seg = 7;
    let d = "";
    for (let i = 0; i <= cols; i++) {
      const x = x0 + i / cols * gw;
      for (let j = 0; j <= rows2; j++) {
        const y = y0 + j / rows2 * gh;
        const [px, py] = warp(x, y);
        d += (j === 0 ? "M" : "L") + px.toFixed(1) + " " + py.toFixed(1);
        void seg;
      }
    }
    for (let j = 0; j <= rows2; j++) {
      const y = y0 + j / rows2 * gh;
      for (let i = 0; i <= cols; i++) {
        const x = x0 + i / cols * gw;
        const [px, py] = warp(x, y);
        d += (i === 0 ? "M" : "L") + px.toFixed(1) + " " + py.toFixed(1);
      }
    }
    g.appendChild(
      svgEl("path", { d, fill: "none", stroke: fg, "stroke-width": sw, "stroke-linecap": "round" })
    );
    return g;
  }
  registerGenerator({ name: "optical-bulge", category: "geometric", weight: 2, render: render99 });

  // src/generators/organicBlobs.ts
  function smoothClosedPath(pts) {
    const n = pts.length;
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const p3 = pts[(i + 2) % n];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d + "z";
  }
  function render100(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const swatches = [
      palette.primary,
      palette.accent,
      palette.colors[1] ?? palette.primary,
      palette.colors[4] ?? palette.accent
    ];
    const minDim = Math.min(bounds.w, bounds.h);
    const count = rng.int(4, 10);
    for (let b = 0; b < count; b++) {
      const cx = bounds.x + rng.range(0.05, 0.95) * bounds.w;
      const cy = bounds.y + rng.range(0.05, 0.95) * bounds.h;
      const baseR = minDim * rng.range(0.1, 0.32);
      const wobble = rng.range(0.15, 0.4);
      const verts = rng.int(6, 11);
      const pts = [];
      for (let i = 0; i < verts; i++) {
        const ang = i / verts * Math.PI * 2;
        const r = baseR * (1 + rng.gaussian(0, wobble));
        pts.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]);
      }
      g.appendChild(
        svgEl("path", {
          d: smoothClosedPath(pts),
          fill: rng.pick(swatches),
          "fill-opacity": rng.range(0.7, 1).toFixed(2)
        })
      );
    }
    return g;
  }
  registerGenerator({ name: "organic-blobs", category: "organic", weight: 2, render: render100 });

  // src/generators/ornamentGrid.ts
  function render101(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const accent = palette.accent === fg ? palette.primary : palette.accent;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(3, 7);
    const cell = bounds.w / cols;
    const rows2 = Math.ceil(bounds.h / cell) + 1;
    const r = cell * rng.range(0.28, 0.36);
    let petals = "";
    let bosses = "";
    for (let row = -1; row < rows2; row++) {
      for (let col = -1; col <= cols; col++) {
        const cx = bounds.x + (col + 0.5) * cell;
        const cy = bounds.y + (row + 0.5) * cell;
        const off = r * 0.95;
        const dirs = [
          [0, -off],
          [off, 0],
          [0, off],
          [-off, 0]
        ];
        for (const [dx, dy] of dirs) {
          const px = cx + dx;
          const py = cy + dy;
          petals += `M${(px - r).toFixed(1)} ${py.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(r * 2).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-r * 2).toFixed(1)} 0Z`;
        }
        const dR = cell * 0.18;
        petals += `M${cx.toFixed(1)} ${(cy - dR).toFixed(1)}L${(cx + dR).toFixed(1)} ${cy.toFixed(1)}L${cx.toFixed(1)} ${(cy + dR).toFixed(1)}L${(cx - dR).toFixed(1)} ${cy.toFixed(1)}Z`;
        const br = r * 0.55;
        bosses += `M${(cx - br).toFixed(1)} ${cy.toFixed(1)}a${br.toFixed(1)} ${br.toFixed(1)} 0 1 0 ${(br * 2).toFixed(1)} 0a${br.toFixed(1)} ${br.toFixed(1)} 0 1 0 ${(-br * 2).toFixed(1)} 0Z`;
      }
    }
    g.appendChild(svgEl("path", { d: petals, fill: fg, "fill-rule": "nonzero" }));
    g.appendChild(svgEl("path", { d: bosses, fill: accent }));
    return g;
  }
  registerGenerator({ name: "ornament-grid", category: "decorative", weight: 2, render: render101 });

  // src/generators/oscilloscope.ts
  function render102(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cy = bounds.y + bounds.h / 2;
    g.appendChild(
      svgEl("line", {
        x1: bounds.x,
        y1: cy,
        x2: bounds.x + bounds.w,
        y2: cy,
        stroke: fg,
        "stroke-width": Math.max(1, bounds.h * 4e-3),
        "stroke-opacity": 0.18
      })
    );
    const traceCount = rng.int(1, 3);
    const steps = Math.min(220, Math.max(80, Math.round(bounds.w / 4)));
    const ampMax = bounds.h * 0.4;
    const haloW = Math.max(3, bounds.h * 0.02);
    const coreW = Math.max(1, bounds.h * 6e-3);
    for (let s = 0; s < traceCount; s++) {
      const f1 = rng.int(1, 6);
      const f2 = rng.int(1, 4);
      const p1 = rng.range(0, Math.PI * 2);
      const p2 = rng.range(0, Math.PI * 2);
      const a1 = rng.range(0.5, 1);
      const a2 = rng.range(0, 0.5);
      const amp = ampMax * rng.range(0.55, 1);
      let d = "";
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = bounds.x + t * bounds.w;
        const y = cy + amp * (a1 * Math.sin(t * f1 * Math.PI * 2 + p1) + a2 * Math.sin(t * f2 * Math.PI * 2 + p2)) / (a1 + a2 || 1);
        d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
      }
      g.appendChild(
        svgEl("path", {
          d,
          fill: "none",
          stroke: fg,
          "stroke-width": haloW,
          "stroke-opacity": 0.3,
          "stroke-linecap": "round",
          "stroke-linejoin": "round"
        })
      );
      g.appendChild(
        svgEl("path", {
          d,
          fill: "none",
          stroke: fg,
          "stroke-width": coreW,
          "stroke-linecap": "round",
          "stroke-linejoin": "round"
        })
      );
    }
    return g;
  }
  registerGenerator({ name: "oscilloscope", category: "digital", weight: 2, render: render102 });

  // src/generators/parallelLineBands.ts
  function render103(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const horizontal = rng.chance();
    const bands = rng.int(3, 7);
    const along = horizontal ? bounds.h : bounds.w;
    const bandSize = along / bands;
    const diag = Math.hypot(bounds.w, bounds.h);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const stroke = Math.max(0.7, Math.min(bounds.w, bounds.h) * rng.range(3e-3, 7e-3));
    const angles = [0, 45, 90, 135];
    for (let b = 0; b < bands; b++) {
      const angle = rng.pick(angles) + rng.range(-3, 3);
      const spacing = stroke * rng.range(2.5, 6);
      const lines = Math.min(220, Math.ceil(diag / spacing));
      const band2 = horizontal ? { x: bounds.x, y: bounds.y + b * bandSize, w: bounds.w, h: bandSize } : { x: bounds.x + b * bandSize, y: bounds.y, w: bandSize, h: bounds.h };
      const id = `pl-${b}-${rng.int(0, 1e6)}`;
      const clip = svgEl("clipPath", { id });
      clip.appendChild(
        svgEl("rect", { x: band2.x, y: band2.y, width: band2.w, height: band2.h })
      );
      const defs = svgEl("defs");
      defs.appendChild(clip);
      g.appendChild(defs);
      const rot = svgEl("g", {
        "clip-path": `url(#${id})`,
        transform: `rotate(${angle.toFixed(2)} ${cx} ${cy})`
      });
      let d = "";
      for (let i = 0; i <= lines; i++) {
        const y = (cy - diag / 2 + i * spacing).toFixed(1);
        d += `M${(cx - diag / 2).toFixed(1)} ${y}H${(cx + diag / 2).toFixed(1)}`;
      }
      rot.appendChild(
        svgEl("path", { d, stroke: fg, "stroke-width": stroke.toFixed(2), fill: "none" })
      );
      g.appendChild(rot);
    }
    return g;
  }
  registerGenerator({ name: "parallel-line-bands", category: "lines", weight: 2, render: render103 });

  // src/generators/particleStreaks.ts
  function render104(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const minDim = Math.min(bounds.w, bounds.h);
    const baseAngle = rng.next() * Math.PI * 2;
    const angleJitter = rng.range(0.05, 0.4);
    const area = bounds.w * bounds.h;
    const count = Math.max(30, Math.min(900, Math.round(area / 1100)));
    const lenBase = minDim * rng.range(0.05, 0.16);
    let d = "";
    for (let i = 0; i < count; i++) {
      const x = bounds.x + rng.next() * bounds.w;
      const y = bounds.y + rng.next() * bounds.h;
      const ang = baseAngle + rng.gaussian(0, angleJitter);
      const len = lenBase * rng.range(0.4, 1.4);
      const ex = x + Math.cos(ang) * len;
      const ey = y + Math.sin(ang) * len;
      d += `M${x.toFixed(1)} ${y.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`;
    }
    g.appendChild(
      svgEl("path", {
        d,
        stroke: fg,
        "stroke-width": Math.max(0.8, minDim * 4e-3).toFixed(1),
        "stroke-opacity": rng.range(0.45, 0.8).toFixed(2),
        "stroke-linecap": "round",
        fill: "none"
      })
    );
    const accentColor = palette.accent;
    const bright = rng.int(8, 24);
    let bd = "";
    for (let i = 0; i < bright; i++) {
      const x = bounds.x + rng.next() * bounds.w;
      const y = bounds.y + rng.next() * bounds.h;
      const ang = baseAngle + rng.gaussian(0, angleJitter);
      const len = lenBase * rng.range(1, 2);
      const ex = x + Math.cos(ang) * len;
      const ey = y + Math.sin(ang) * len;
      bd += `M${x.toFixed(1)} ${y.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`;
    }
    g.appendChild(
      svgEl("path", {
        d: bd,
        stroke: accentColor,
        "stroke-width": Math.max(1.2, minDim * 7e-3).toFixed(1),
        "stroke-linecap": "round",
        fill: "none"
      })
    );
    return g;
  }
  registerGenerator({ name: "particle-streaks", category: "scatter", weight: 2, render: render104 });

  // src/generators/perforation.ts
  function render105(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(10, 24);
    const step = bounds.w / cols;
    const rows2 = Math.max(1, Math.round(bounds.h / step));
    const radius = step * rng.range(0.2, 0.36);
    const stagger = rng.chance(0.5);
    let d = `M${bounds.x} ${bounds.y}h${bounds.w}v${bounds.h}h${-bounds.w}z`;
    for (let r = 0; r <= rows2; r++) {
      const off = stagger && r % 2 === 1 ? step / 2 : 0;
      for (let c = 0; c <= cols; c++) {
        const cx = (bounds.x + off + c * step).toFixed(1);
        const cy = (bounds.y + r * step).toFixed(1);
        d += `M${cx} ${cy}m${-radius} 0a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`;
      }
    }
    g.appendChild(svgEl("path", { d, fill: fg, "fill-rule": "evenodd" }));
    return g;
  }
  registerGenerator({ name: "perforation", category: "dots", weight: 2, render: render105 });

  // src/generators/pinwheel.ts
  function render106(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const maxR = Math.hypot(bounds.w, bounds.h) / 2;
    const blades = rng.int(6, 16);
    const colors = rng.sample(
      [palette.primary, palette.accent, ...palette.colors],
      rng.int(2, 3)
    );
    const step = Math.PI * 2 / blades;
    const twist = step * rng.range(0.4, 0.95);
    const start = rng.range(0, Math.PI * 2);
    for (let i = 0; i < blades; i++) {
      const a0 = start + i * step;
      const a1 = a0 + twist;
      const x0 = (cx + Math.cos(a0) * maxR).toFixed(2);
      const y0 = (cy + Math.sin(a0) * maxR).toFixed(2);
      const x1 = (cx + Math.cos(a1) * maxR).toFixed(2);
      const y1 = (cy + Math.sin(a1) * maxR).toFixed(2);
      g.appendChild(
        svgEl("path", {
          d: `M${cx.toFixed(2)} ${cy.toFixed(2)}L${x0} ${y0}L${x1} ${y1}Z`,
          fill: colors[i % colors.length]
        })
      );
    }
    return g;
  }
  registerGenerator({ name: "pinwheel", category: "radial", weight: 2, render: render106 });

  // src/generators/pinwheelTiles.ts
  function render107(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(3, 7);
    const cell = bounds.w / cols;
    const rows2 = Math.ceil(bounds.h / cell) + 1;
    let d = "";
    for (let r = -1; r < rows2; r++) {
      for (let c = -1; c <= cols; c++) {
        const x = bounds.x + c * cell;
        const y = bounds.y + r * cell;
        const m = cell / 2;
        d += `M${x} ${y}L${x + m} ${y}L${x} ${y + m}Z`;
        d += `M${x + cell} ${y}L${x + cell} ${y + m}L${x + cell - m} ${y}Z`;
        d += `M${x + cell} ${y + cell}L${x + cell - m} ${y + cell}L${x + cell} ${y + cell - m}Z`;
        d += `M${x} ${y + cell}L${x} ${y + cell - m}L${x + m} ${y + cell}Z`;
      }
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    return g;
  }
  registerGenerator({ name: "pinwheel-tiles", category: "geometric", weight: 2, render: render107 });

  // src/generators/pixelBlocks.ts
  function render108(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(12, 32);
    const cw = bounds.w / cols;
    const rows2 = Math.max(1, Math.round(bounds.h / cw));
    const ch = bounds.h / rows2;
    const colors = [fg, palette.accent, palette.primary];
    const density = rng.range(0.35, 0.65);
    const dByColor = /* @__PURE__ */ new Map();
    for (let r = 0; r < rows2; r++) {
      for (let c = 0; c < cols; c++) {
        if (!rng.chance(density)) continue;
        const x = bounds.x + c * cw;
        const y = bounds.y + r * ch;
        const color = rng.weighted(colors, [3, 1.4, 1]);
        const prev = dByColor.get(color) ?? "";
        dByColor.set(
          color,
          prev + `M${x.toFixed(1)} ${y.toFixed(1)}h${cw.toFixed(1)}v${ch.toFixed(1)}h${(-cw).toFixed(1)}z`
        );
      }
    }
    for (const [color, d] of dByColor) {
      g.appendChild(svgEl("path", { d, fill: color }));
    }
    return g;
  }
  registerGenerator({ name: "pixel-blocks", category: "techno", weight: 2, render: render108 });

  // src/generators/plaid.ts
  function render109(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const tones = [fg, palette.primary, palette.accent];
    const settSize = rng.int(3, 6);
    const sett = [];
    for (let i2 = 0; i2 < settSize; i2++) {
      sett.push({ color: rng.pick(tones), w: rng.range(0.4, 2) });
    }
    const settTotal = sett.reduce((s, b) => s + b.w, 0);
    const baseUnit = bounds.w / rng.range(5, 12);
    const opacity = rng.range(0.45, 0.7).toFixed(2);
    let x = bounds.x;
    let i = 0;
    while (x < bounds.x + bounds.w) {
      const band2 = sett[i % sett.length];
      const w = band2.w / settTotal * settSize * baseUnit;
      g.appendChild(
        svgEl("rect", {
          x,
          y: bounds.y,
          width: w,
          height: bounds.h,
          fill: band2.color,
          "fill-opacity": opacity
        })
      );
      x += w;
      i++;
    }
    let y = bounds.y;
    i = 0;
    while (y < bounds.y + bounds.h) {
      const band2 = sett[i % sett.length];
      const h = band2.w / settTotal * settSize * baseUnit;
      g.appendChild(
        svgEl("rect", {
          x: bounds.x,
          y,
          width: bounds.w,
          height: h,
          fill: band2.color,
          "fill-opacity": opacity
        })
      );
      y += h;
      i++;
    }
    return g;
  }
  registerGenerator({ name: "plaid", category: "tiling", weight: 2, render: render109 });

  // src/generators/polkaDots.ts
  function render110(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(4, 9);
    const step = bounds.w / cols;
    const rows2 = Math.max(1, Math.round(bounds.h / step));
    const radius = step * rng.range(0.22, 0.36);
    const offset = step / 2;
    let d = "";
    for (let r = -1; r <= rows2 + 1; r++) {
      const shift = r % 2 === 0 ? 0 : offset;
      for (let c = -1; c <= cols + 1; c++) {
        const cx = (bounds.x + shift + c * step + offset).toFixed(1);
        const cy = (bounds.y + r * step + offset).toFixed(1);
        d += `M${cx} ${cy}m${-radius} 0a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`;
      }
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    return g;
  }
  registerGenerator({ name: "polka-dots", category: "dots", weight: 2, render: render110 });

  // src/generators/polygonShatter.ts
  function render111(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const alt = palette.accent === fg ? palette.primary : palette.accent;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + rng.range(0.3, 0.7) * bounds.w;
    const cy = bounds.y + rng.range(0.3, 0.7) * bounds.h;
    const reach = Math.hypot(bounds.w, bounds.h);
    const rayCount = rng.int(9, 16);
    const angles = [];
    for (let i = 0; i < rayCount; i++) angles.push(rng.range(0, Math.PI * 2));
    angles.sort((a, b) => a - b);
    const ringCount = rng.int(3, 6);
    const rings = [0];
    for (let i = 1; i <= ringCount; i++) {
      rings.push(i / ringCount * reach * rng.range(0.85, 1.15));
    }
    const fills = [fg, alt];
    for (let a = 0; a < angles.length; a++) {
      const a0 = angles[a];
      const a1 = angles[(a + 1) % angles.length] + (a + 1 === angles.length ? Math.PI * 2 : 0);
      const j0 = a0 + rng.range(-0.05, 0.05);
      const j1 = a1 + rng.range(-0.05, 0.05);
      for (let ri = 0; ri < rings.length - 1; ri++) {
        const r0 = rings[ri];
        const r1 = rings[ri + 1] * rng.range(0.92, 1.06);
        const p1x = cx + Math.cos(j0) * r0;
        const p1y = cy + Math.sin(j0) * r0;
        const p2x = cx + Math.cos(j1) * r0;
        const p2y = cy + Math.sin(j1) * r0;
        const p3x = cx + Math.cos(j1) * r1;
        const p3y = cy + Math.sin(j1) * r1;
        const p4x = cx + Math.cos(j0) * r1;
        const p4y = cy + Math.sin(j0) * r1;
        const pts = r0 === 0 ? `${cx.toFixed(1)},${cy.toFixed(1)} ${p3x.toFixed(1)},${p3y.toFixed(1)} ${p4x.toFixed(1)},${p4y.toFixed(1)}` : `${p1x.toFixed(1)},${p1y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)} ${p3x.toFixed(1)},${p3y.toFixed(1)} ${p4x.toFixed(1)},${p4y.toFixed(1)}`;
        g.appendChild(
          svgEl("polygon", {
            points: pts,
            fill: fills[(a + ri) % 2],
            stroke: bg,
            "stroke-width": Math.max(1, reach * 3e-3)
          })
        );
      }
    }
    return g;
  }
  registerGenerator({ name: "polygon-shatter", category: "digital", weight: 2, render: render111 });

  // src/generators/posterizedGradient.ts
  function lerpColor(a, b, t) {
    const ra = parseColor(a) ?? { r: 0, g: 0, b: 0 };
    const rb = parseColor(b) ?? { r: 255, g: 255, b: 255 };
    const ha = rgbToHsl(ra);
    const hb = rgbToHsl(rb);
    let dh = hb.h - ha.h;
    if (dh > 180) dh -= 360;
    if (dh < -180) dh += 360;
    return hslCss({
      h: (ha.h + dh * t + 360) % 360,
      s: ha.s + (hb.s - ha.s) * t,
      l: ha.l + (hb.l - ha.l) * t
    });
  }
  function render112(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const vertical = rng.chance(0.55);
    const steps = rng.int(4, 9);
    for (let i = 0; i < steps; i++) {
      const t = steps === 1 ? 0 : i / (steps - 1);
      const fill = lerpColor(bg, fg, t);
      const rect = vertical ? {
        x: bounds.x,
        y: bounds.y + i / steps * bounds.h,
        width: bounds.w,
        height: bounds.h / steps + 0.5
      } : {
        x: bounds.x + i / steps * bounds.w,
        y: bounds.y,
        width: bounds.w / steps + 0.5,
        height: bounds.h
      };
      const el = ctx.el("rect", { ...rect, fill });
      g.appendChild(el);
    }
    return g;
  }
  registerGenerator({ name: "posterized-gradient", category: "gradient", weight: 2, render: render112 });

  // src/generators/postmodernCollage.ts
  function render113(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const inks = rng.shuffle([
      palette.primary,
      palette.accent,
      palette.colors[1] ?? palette.primary,
      palette.colors[3] ?? palette.accent,
      palette.colors[4] ?? palette.primary
    ]);
    const unit = Math.min(bounds.w, bounds.h);
    const pieces = rng.int(5, 9);
    const cyB = bounds.y + bounds.h / 2;
    for (let i = 0; i < pieces; i++) {
      const cx = bounds.x + rng.range(0.1, 0.9) * bounds.w;
      const cy = bounds.y + rng.range(0.1, 0.9) * bounds.h;
      const angle = rng.int(0, 360);
      const fill = inks[i % inks.length];
      const opacity = rng.range(0.7, 1).toFixed(2);
      const node = svgEl("g", {
        transform: `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${angle})`,
        "fill-opacity": opacity
      });
      const kind = rng.weighted(["slab", "wedge", "disc", "grid", "circleOutline"], [3, 2, 2, 1, 1]);
      switch (kind) {
        case "slab": {
          const w = unit * rng.range(0.4, 1.1);
          const h = unit * rng.range(0.12, 0.35);
          node.appendChild(svgEl("rect", { x: -w / 2, y: -h / 2, width: w, height: h, fill }));
          break;
        }
        case "wedge": {
          const r = unit * rng.range(0.35, 0.8);
          node.appendChild(svgEl("polygon", { points: `0 0 ${r} ${-r * 0.4} ${r} ${r * 0.4}`, fill }));
          break;
        }
        case "disc": {
          const r = unit * rng.range(0.18, 0.45);
          node.appendChild(svgEl("circle", { cx: 0, cy: 0, r, fill }));
          break;
        }
        case "grid": {
          const w = unit * rng.range(0.4, 0.8);
          const lines = rng.int(4, 9);
          const gap = w / lines;
          let d = "";
          for (let k = 0; k <= lines; k++) {
            const o = -w / 2 + k * gap;
            d += `M ${(-w / 2).toFixed(1)} ${o.toFixed(1)} H ${(w / 2).toFixed(1)} `;
            d += `M ${o.toFixed(1)} ${(-w / 2).toFixed(1)} V ${(w / 2).toFixed(1)} `;
          }
          node.appendChild(
            svgEl("path", { d, fill: "none", stroke: fill, "stroke-width": (gap * 0.18).toFixed(1) })
          );
          break;
        }
        case "circleOutline": {
          const r = unit * rng.range(0.2, 0.5);
          node.appendChild(
            svgEl("circle", { cx: 0, cy: 0, r, fill: "none", stroke: fill, "stroke-width": (r * 0.12).toFixed(1) })
          );
          break;
        }
      }
      g.appendChild(node);
    }
    g.appendChild(
      svgEl("line", {
        x1: bounds.x,
        y1: cyB + rng.gaussian(0, bounds.h * 0.2),
        x2: bounds.x + bounds.w,
        y2: cyB + rng.gaussian(0, bounds.h * 0.2),
        stroke: inks[0],
        "stroke-width": unit * 0.02
      })
    );
    return g;
  }
  registerGenerator({ name: "postmodern-collage", category: "memphis", weight: 2, render: render113 });

  // src/generators/punctuationField.ts
  var MARKS = ["!", "?", ";", ":", ",", ".", '"', "'", "(", ")", "&", "@", "%", "*", "/", "\u2014", "\xB7"];
  function render114(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const family = ctx.text.font.family;
    const palettePool = [fg, fg, palette.accent, palette.primary];
    const base = Math.min(bounds.w, bounds.h);
    const area = bounds.w * bounds.h;
    const count = Math.min(900, Math.round(area / rng.range(2200, 5e3)));
    for (let i = 0; i < count; i++) {
      const cx = bounds.x + rng.next() * bounds.w;
      const cy = bounds.y + rng.next() * bounds.h;
      const size = rng.chance(0.08) ? base * rng.range(0.18, 0.4) : base * rng.range(0.03, 0.09);
      const angle = rng.chance(0.4) ? rng.range(-45, 45) : 0;
      const t = svgEl("text", {
        x: cx.toFixed(1),
        y: cy.toFixed(1),
        "font-family": family,
        "font-size": size.toFixed(1),
        "font-weight": rng.pick([400, 700, 900]),
        "text-anchor": "middle",
        fill: rng.pick(palettePool),
        "fill-opacity": rng.range(0.7, 1).toFixed(2),
        transform: angle ? `rotate(${angle.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})` : ""
      });
      t.textContent = rng.pick(MARKS);
      g.appendChild(t);
    }
    return g;
  }
  registerGenerator({ name: "punctuation-field", category: "type", weight: 2, render: render114 });

  // src/generators/qrBlocks.ts
  function render115(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const modules = rng.pick([21, 25, 29, 33]);
    const margin2 = 2;
    const total = modules + margin2 * 2;
    const cell = Math.min(bounds.w, bounds.h) / total;
    const gridSize = cell * modules;
    const ox = bounds.x + (bounds.w - gridSize) / 2;
    const oy = bounds.y + (bounds.h - gridSize) / 2;
    const finders = [
      [0, 0],
      [modules - 7, 0],
      [0, modules - 7]
    ];
    const inFinder = (r, c) => {
      for (const [fr, fc] of finders) {
        if (r >= fr - 1 && r <= fr + 7 && c >= fc - 1 && c <= fc + 7) return true;
      }
      return false;
    };
    const density = rng.range(0.42, 0.55);
    let d = "";
    const addCell = (r, c) => {
      const x = (ox + c * cell).toFixed(2);
      const y = (oy + r * cell).toFixed(2);
      const s = cell.toFixed(2);
      d += `M${x} ${y}h${s}v${s}h-${s}z`;
    };
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if (inFinder(r, c)) continue;
        if (rng.chance(density)) addCell(r, c);
      }
    }
    for (const [fr, fc] of finders) {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const ring2 = r === 0 || r === 6 || c === 0 || c === 6;
          const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          if (ring2 || core) addCell(fr + r, fc + c);
        }
      }
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    return g;
  }
  registerGenerator({ name: "qr-blocks", category: "digital", weight: 2, render: render115 });

  // src/generators/radialChecker.ts
  function render116(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const maxR = Math.hypot(bounds.w, bounds.h) / 2;
    const rings = rng.int(4, 9);
    const sectors = rng.int(8, 20);
    const phase = rng.range(0, Math.PI * 2);
    const ringStep = maxR / rings;
    const secStep = Math.PI * 2 / sectors;
    let d = "";
    for (let r = 0; r < rings; r++) {
      for (let s = 0; s < sectors; s++) {
        if ((r + s) % 2 === 0) continue;
        const r0 = r * ringStep;
        const r1 = (r + 1) * ringStep;
        const a0 = phase + s * secStep;
        const a1 = a0 + secStep;
        const x0o = (cx + Math.cos(a0) * r1).toFixed(2);
        const y0o = (cy + Math.sin(a0) * r1).toFixed(2);
        const x1o = (cx + Math.cos(a1) * r1).toFixed(2);
        const y1o = (cy + Math.sin(a1) * r1).toFixed(2);
        const x1i = (cx + Math.cos(a1) * r0).toFixed(2);
        const y1i = (cy + Math.sin(a1) * r0).toFixed(2);
        const x0i = (cx + Math.cos(a0) * r0).toFixed(2);
        const y0i = (cy + Math.sin(a0) * r0).toFixed(2);
        d += `M${x0o} ${y0o}A${r1.toFixed(2)} ${r1.toFixed(2)} 0 0 1 ${x1o} ${y1o}L${x1i} ${y1i}A${r0.toFixed(2)} ${r0.toFixed(2)} 0 0 0 ${x0i} ${y0i}Z`;
      }
    }
    g.appendChild(svgEl("path", { d, fill: fg, "fill-rule": "evenodd" }));
    return g;
  }
  registerGenerator({ name: "radial-checker", category: "radial", weight: 2, render: render116 });

  // src/generators/radialDots.ts
  function render117(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const maxR = Math.hypot(bounds.w, bounds.h) / 2;
    const spokes = rng.int(8, 28);
    const rings = rng.int(5, 16);
    const grow = rng.chance(0.6);
    const baseDot = maxR / rings * rng.range(0.12, 0.3);
    const phase = rng.range(0, Math.PI * 2);
    let d = "";
    for (let s = 0; s < spokes; s++) {
      const a = phase + s / spokes * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      for (let i = 1; i <= rings; i++) {
        const t = i / rings;
        const r = t * maxR;
        const dot3 = grow ? baseDot * (0.4 + t) : baseDot * (1.4 - t);
        const x = (cx + ca * r).toFixed(2);
        const y = (cy + sa * r).toFixed(2);
        d += `M${x} ${y}m${-dot3.toFixed(2)} 0a${dot3.toFixed(2)} ${dot3.toFixed(
          2
        )} 0 1 0 ${(dot3 * 2).toFixed(2)} 0a${dot3.toFixed(2)} ${dot3.toFixed(2)} 0 1 0 ${(-dot3 * 2).toFixed(2)} 0z`;
      }
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    return g;
  }
  registerGenerator({ name: "radial-dots", category: "radial", weight: 2, render: render117 });

  // src/generators/radialGradient.ts
  function render118(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const id = uid("rad");
    const cx = rng.range(0.25, 0.75);
    const cy = rng.range(0.25, 0.75);
    const radius = rng.range(0.7, 1.2);
    const grad = svgEl("radialGradient", {
      id,
      cx: cx.toFixed(3),
      cy: cy.toFixed(3),
      r: radius.toFixed(3),
      fx: (cx + rng.range(-0.1, 0.1)).toFixed(3),
      fy: (cy + rng.range(-0.1, 0.1)).toFixed(3)
    });
    const stops = rng.int(2, 3);
    for (let i = 0; i <= stops; i++) {
      const t = i / stops;
      grad.appendChild(
        svgEl("stop", {
          offset: t.toFixed(3),
          "stop-color": i % 2 === 0 ? fg : bg
        })
      );
    }
    const defs = svgEl("defs");
    defs.appendChild(grad);
    g.appendChild(defs);
    g.appendChild(
      svgEl("rect", {
        x: bounds.x,
        y: bounds.y,
        width: bounds.w,
        height: bounds.h,
        fill: `url(#${id})`
      })
    );
    return g;
  }
  registerGenerator({ name: "radial-gradient", category: "gradient", weight: 2, render: render118 });

  // src/generators/radialLines.ts
  function render119(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const ox = bounds.x + bounds.w * rng.range(-0.1, 1.1);
    const oy = bounds.y + bounds.h * rng.range(-0.1, 1.1);
    const reach = Math.hypot(bounds.w, bounds.h) * 1.6;
    const count = Math.min(720, rng.int(80, 360));
    const stroke = Math.max(0.5, Math.min(bounds.w, bounds.h) * rng.range(2e-3, 5e-3));
    const start = rng.range(0, Math.PI * 2);
    const span = rng.pick([Math.PI * 2, Math.PI, Math.PI * 1.5]);
    const jitter = span / count * rng.range(0, 0.3);
    let d = "";
    for (let i = 0; i < count; i++) {
      const a = start + span * i / count + rng.range(-jitter, jitter);
      const ex = (ox + Math.cos(a) * reach).toFixed(1);
      const ey = (oy + Math.sin(a) * reach).toFixed(1);
      d += `M${ox.toFixed(1)} ${oy.toFixed(1)}L${ex} ${ey}`;
    }
    g.appendChild(
      svgEl("path", { d, stroke: fg, "stroke-width": stroke.toFixed(2), fill: "none" })
    );
    return g;
  }
  registerGenerator({ name: "radial-lines", category: "lines", weight: 2, render: render119 });

  // src/generators/rayGradient.ts
  function render120(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const maxR = Math.hypot(bounds.w, bounds.h) / 2;
    const rays = rng.int(12, 40);
    const bands = rng.int(4, 8);
    const phase = rng.range(0, Math.PI * 2);
    const step = Math.PI * 2 / rays;
    const fade = rng.chance(0.7);
    for (let b = 0; b < bands; b++) {
      const r0 = b / bands * maxR;
      const r1 = (b + 1) / bands * maxR;
      const t = b / (bands - 1 || 1);
      const opacity = fade ? (1 - t) * 0.9 + 0.05 : t * 0.9 + 0.05;
      let d = "";
      for (let i = 0; i < rays; i += 2) {
        const a0 = phase + i * step;
        const a1 = a0 + step;
        const x0o = (cx + Math.cos(a0) * r1).toFixed(2);
        const y0o = (cy + Math.sin(a0) * r1).toFixed(2);
        const x1o = (cx + Math.cos(a1) * r1).toFixed(2);
        const y1o = (cy + Math.sin(a1) * r1).toFixed(2);
        const x1i = (cx + Math.cos(a1) * r0).toFixed(2);
        const y1i = (cy + Math.sin(a1) * r0).toFixed(2);
        const x0i = (cx + Math.cos(a0) * r0).toFixed(2);
        const y0i = (cy + Math.sin(a0) * r0).toFixed(2);
        d += `M${x0i} ${y0i}L${x0o} ${y0o}L${x1o} ${y1o}L${x1i} ${y1i}Z`;
      }
      g.appendChild(svgEl("path", { d, fill: fg, "fill-opacity": opacity.toFixed(2) }));
    }
    return g;
  }
  registerGenerator({ name: "ray-gradient", category: "radial", weight: 2, render: render120 });

  // src/generators/repeatedWord.ts
  function render121(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const script = scriptByName(ctx.text.script);
    const family = ctx.text.font.family;
    const weight = rng.pick([700, 800, 900]);
    const word = makePhrase(rng, script, { words: 1, casing: "upper" }) || "TYPE";
    const angle = rng.pick([0, 0, -8, 8, -4]);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const diag = Math.hypot(bounds.w, bounds.h);
    const rows2 = rng.int(5, 16);
    const size = diag / rows2 * rng.range(0.55, 0.8);
    const lineH = diag / rows2;
    const sep = rng.pick(["  ", " ", " \xB7 ", "/"]);
    const line = (word + sep).repeat(40);
    const rot = svgEl("g", { transform: `rotate(${angle} ${cx} ${cy})` });
    for (let r = 0; r <= rows2; r++) {
      const y = cy - diag / 2 + r * lineH + size;
      const shift = r % 2 * size * rng.range(0.3, 1.2);
      const fill = rng.chance(0.15) ? palette.accent : fg;
      const t = svgEl("text", {
        x: (cx - diag / 2 - shift).toFixed(1),
        y: y.toFixed(1),
        "font-family": family,
        "font-size": size.toFixed(1),
        "font-weight": weight,
        "text-anchor": "start",
        fill,
        "letter-spacing": (size * rng.range(-0.02, 0.06)).toFixed(2)
      });
      t.textContent = line;
      rot.appendChild(t);
    }
    g.appendChild(rot);
    return g;
  }
  registerGenerator({ name: "repeated-word", category: "type", weight: 2, render: render121 });

  // src/generators/ribbonBands.ts
  function render122(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const inks = rng.shuffle([
      palette.primary,
      palette.accent,
      palette.colors[1] ?? palette.primary,
      palette.colors[3] ?? palette.accent
    ]);
    const bands = rng.int(4, 9);
    const slot = bounds.h / bands;
    const thickness = slot * rng.range(1.05, 1.5);
    const amp = slot * rng.range(0.25, 0.6);
    const segs = Math.max(3, Math.min(24, Math.round(bounds.w / (slot * 1.2))));
    const stepX = bounds.w / segs;
    const freq = rng.range(0.6, 1.4);
    for (let i = bands - 1; i >= 0; i--) {
      const yc = bounds.y + slot * (i + 0.5);
      const phase = rng.next() * Math.PI * 2;
      const half = thickness / 2;
      const yAt = (xi) => yc + amp * Math.sin(phase + xi * freq);
      let top = `M ${(bounds.x - stepX).toFixed(1)} ${(yAt(0) - half).toFixed(1)}`;
      for (let s = 0; s <= segs; s++) {
        const x0 = bounds.x + (s - 1) * stepX;
        const cx = x0 + stepX / 2;
        const ex = x0 + stepX;
        top += ` Q ${cx.toFixed(1)} ${(yAt(s) - half).toFixed(1)} ${ex.toFixed(1)} ${(yAt(s + 1) - half).toFixed(1)}`;
      }
      let bottom = ` L ${(bounds.x + bounds.w + stepX).toFixed(1)} ${(yAt(segs + 1) + half).toFixed(1)}`;
      for (let s = segs; s >= 0; s--) {
        const x0 = bounds.x + (s - 1) * stepX;
        const cx = x0 + stepX / 2;
        const sx = x0;
        bottom += ` Q ${cx.toFixed(1)} ${(yAt(s) + half).toFixed(1)} ${sx.toFixed(1)} ${(yAt(s - 1) + half).toFixed(1)}`;
      }
      g.appendChild(svgEl("path", { d: top + bottom + " Z", fill: inks[i % inks.length] }));
    }
    return g;
  }
  registerGenerator({ name: "ribbon-bands", category: "memphis", weight: 2, render: render122 });

  // src/generators/risoOverlap.ts
  function blobLayer(rng, bounds, color, dx, dy) {
    const layer = svgEl("g", {
      transform: `translate(${dx.toFixed(1)} ${dy.toFixed(1)})`,
      fill: color,
      "fill-opacity": "0.75"
    });
    const cols = 3;
    const rows2 = Math.max(2, Math.round(cols * bounds.h / bounds.w));
    const cw = bounds.w / cols;
    const ch = bounds.h / rows2;
    for (let r = 0; r < rows2; r++) {
      for (let c = 0; c < cols; c++) {
        if (rng.chance(0.25)) continue;
        const cx = bounds.x + (c + 0.5) * cw + rng.gaussian(0, cw * 0.12);
        const cy = bounds.y + (r + 0.5) * ch + rng.gaussian(0, ch * 0.12);
        const rad = Math.min(cw, ch) * rng.range(0.34, 0.55);
        layer.appendChild(svgEl("circle", { cx: cx.toFixed(1), cy: cy.toFixed(1), r: rad.toFixed(1) }));
      }
    }
    return layer;
  }
  function render123(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const second = palette.accent === fg ? palette.primary : palette.accent;
    const off = Math.min(bounds.w, bounds.h) * rng.range(0.02, 0.05);
    g.appendChild(blobLayer(rng, bounds, fg, -off, -off * rng.range(0.4, 1)));
    g.appendChild(blobLayer(rng, bounds, second, off, off * rng.range(0.4, 1)));
    return g;
  }
  registerGenerator({ name: "riso-overlap", category: "print", weight: 2, render: render123 });

  // src/generators/scallopTiles.ts
  function render124(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(3, 6);
    const r = bounds.w / cols / 2;
    const rowStep = r;
    const rows2 = Math.ceil(bounds.h / rowStep) + 2;
    let d = "";
    for (let row = -1; row < rows2; row++) {
      const cy = bounds.y + row * rowStep;
      const offset = row % 2 === 0 ? 0 : r;
      for (let col = -1; col <= cols; col++) {
        const cx = bounds.x + col * 2 * r + offset + r;
        d += `M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}L${cx + r} ${cy + r}L${cx - r} ${cy + r}Z`;
      }
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    return g;
  }
  registerGenerator({ name: "scallop-tiles", category: "geometric", weight: 2, render: render124 });

  // src/generators/scanlines.ts
  function render125(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const step = Math.max(2.5, bounds.h / rng.int(60, 160));
    const lineH = step * rng.range(0.35, 0.55);
    const right = bounds.x + bounds.w;
    let d = "";
    for (let y = bounds.y; y < bounds.y + bounds.h; y += step) {
      d += `M${bounds.x} ${y.toFixed(1)}H${right.toFixed(1)}v${lineH.toFixed(2)}H${bounds.x}z`;
    }
    g.appendChild(svgEl("path", { d, fill: fg, "fill-opacity": rng.range(0.4, 0.7).toFixed(2) }));
    const bands = rng.int(2, 5);
    for (let i = 0; i < bands; i++) {
      const by = bounds.y + rng.next() * bounds.h;
      const bh = step * rng.range(3, 9);
      g.appendChild(
        svgEl("rect", {
          x: bounds.x,
          y: by.toFixed(1),
          width: bounds.w,
          height: bh.toFixed(1),
          fill: fg,
          "fill-opacity": rng.range(0.1, 0.22).toFixed(2)
        })
      );
    }
    return g;
  }
  registerGenerator({ name: "scanlines", category: "techno", weight: 2, render: render125 });

  // src/generators/screenprintOffset.ts
  function render126(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(2, 4);
    const cw = bounds.w / cols;
    const rows2 = Math.max(2, Math.round(bounds.h / cw));
    const ch = bounds.h / rows2;
    const shapes = [];
    for (let r = 0; r < rows2; r++) {
      for (let c = 0; c < cols; c++) {
        if (rng.chance(0.15)) continue;
        shapes.push({
          kind: rng.pick(["circle", "rect", "tri"]),
          cx: bounds.x + (c + 0.5) * cw,
          cy: bounds.y + (r + 0.5) * ch,
          r: Math.min(cw, ch) * rng.range(0.32, 0.46),
          rot: rng.int(0, 90)
        });
      }
    }
    const inks = rng.sample(
      [fg, palette.accent, palette.primary, palette.colors[2] ?? fg],
      rng.int(2, 3)
    );
    const reg = Math.min(cw, ch) * rng.range(0.04, 0.09);
    inks.forEach((ink, idx) => {
      const ang = idx / inks.length * Math.PI * 2 + rng.range(0, 1);
      const dx = Math.cos(ang) * reg;
      const dy = Math.sin(ang) * reg;
      const layer = svgEl("g", {
        transform: `translate(${dx.toFixed(1)} ${dy.toFixed(1)})`,
        fill: ink,
        "fill-opacity": idx === inks.length - 1 ? "0.85" : "0.7"
      });
      for (const s of shapes) layer.appendChild(shapeEl(s));
      g.appendChild(layer);
    });
    return g;
  }
  function shapeEl(s) {
    if (s.kind === "circle") {
      return svgEl("circle", { cx: s.cx.toFixed(1), cy: s.cy.toFixed(1), r: s.r.toFixed(1) });
    }
    if (s.kind === "rect") {
      return svgEl("rect", {
        x: (s.cx - s.r).toFixed(1),
        y: (s.cy - s.r).toFixed(1),
        width: (s.r * 2).toFixed(1),
        height: (s.r * 2).toFixed(1),
        transform: `rotate(${s.rot} ${s.cx.toFixed(1)} ${s.cy.toFixed(1)})`
      });
    }
    const a = `${s.cx.toFixed(1)} ${(s.cy - s.r).toFixed(1)}`;
    const b = `${(s.cx - s.r).toFixed(1)} ${(s.cy + s.r).toFixed(1)}`;
    const c = `${(s.cx + s.r).toFixed(1)} ${(s.cy + s.r).toFixed(1)}`;
    return svgEl("polygon", {
      points: `${a} ${b} ${c}`,
      transform: `rotate(${s.rot} ${s.cx.toFixed(1)} ${s.cy.toFixed(1)})`
    });
  }
  registerGenerator({ name: "screenprint-offset", category: "print", weight: 2, render: render126 });

  // src/generators/seventiesRainbow.ts
  function band(cx, cy, rIn, rOut, a0, a1) {
    const p = (r, a) => `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M${p(rOut, a0)}A${rOut.toFixed(1)} ${rOut.toFixed(1)} 0 ${large} 1 ${p(rOut, a1)}L${p(rIn, a1)}A${rIn.toFixed(1)} ${rIn.toFixed(1)} 0 ${large} 0 ${p(rIn, a0)}Z`;
  }
  function render127(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cycle = palette.colors.filter((c) => c !== bg);
    const ramp = cycle.length >= 2 ? cycle : [palette.primary, palette.accent, palette.text];
    const corners = [
      { cx: bounds.x, cy: bounds.y, a0: 0, a1: Math.PI / 2 },
      { cx: bounds.x + bounds.w, cy: bounds.y, a0: Math.PI / 2, a1: Math.PI },
      { cx: bounds.x + bounds.w, cy: bounds.y + bounds.h, a0: Math.PI, a1: Math.PI * 1.5 },
      { cx: bounds.x, cy: bounds.y + bounds.h, a0: Math.PI * 1.5, a1: Math.PI * 2 },
      // Bottom-center half arc.
      { cx: bounds.x + bounds.w / 2, cy: bounds.y + bounds.h, a0: Math.PI, a1: Math.PI * 2 }
    ];
    const o = rng.pick(corners);
    const maxR = Math.hypot(bounds.w, bounds.h) * (o.a1 - o.a0 > Math.PI / 2 + 0.1 ? 0.85 : 1.05);
    const count = rng.int(5, 9);
    const ringW = maxR / count;
    for (let i = 0; i < count; i++) {
      const rOut = maxR - i * ringW;
      const rIn = Math.max(0, rOut - ringW * rng.range(0.78, 0.95));
      g.appendChild(
        svgEl("path", { d: band(o.cx, o.cy, rIn, rOut, o.a0, o.a1), fill: ramp[i % ramp.length] })
      );
    }
    return g;
  }
  registerGenerator({ name: "seventies-rainbow", category: "retro", weight: 2, render: render127 });

  // src/generators/shapeStamps.ts
  function iconPath(icon, s) {
    switch (icon) {
      case "star": {
        let d = "";
        for (let i = 0; i < 10; i++) {
          const a = i / 10 * Math.PI * 2 - Math.PI / 2;
          const r = i % 2 === 0 ? s : s * 0.45;
          d += (i === 0 ? "M" : "L") + (Math.cos(a) * r).toFixed(1) + " " + (Math.sin(a) * r).toFixed(1);
        }
        return { tag: "path", attrs: { d: d + "Z" } };
      }
      case "plus":
        return {
          tag: "path",
          attrs: { d: `M ${-s} ${-s * 0.34} H ${-s * 0.34} V ${-s} H ${s * 0.34} V ${-s * 0.34} H ${s} V ${s * 0.34} H ${s * 0.34} V ${s} H ${-s * 0.34} V ${s * 0.34} H ${-s} Z` }
        };
      case "drop":
        return { tag: "path", attrs: { d: `M 0 ${-s} C ${s} ${-s * 0.2} ${s * 0.7} ${s} 0 ${s} C ${-s * 0.7} ${s} ${-s} ${-s * 0.2} 0 ${-s} Z` } };
      case "lozenge":
        return { tag: "polygon", attrs: { points: `0 ${-s} ${s * 0.7} 0 0 ${s} ${-s * 0.7} 0` } };
      case "ring":
        return { tag: "circle", attrs: { cx: 0, cy: 0, r: s * 0.75 } };
      case "spark":
        return { tag: "path", attrs: { d: `M 0 ${-s} L ${s * 0.18} ${-s * 0.18} L ${s} 0 L ${s * 0.18} ${s * 0.18} L 0 ${s} L ${-s * 0.18} ${s * 0.18} L ${-s} 0 L ${-s * 0.18} ${-s * 0.18} Z` } };
    }
  }
  function render128(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const inks = [palette.primary, palette.accent, palette.colors[2] ?? palette.primary];
    const icon = rng.pick(["star", "plus", "drop", "lozenge", "ring", "spark"]);
    const cols = rng.int(4, 10);
    const cw = bounds.w / cols;
    const rows2 = Math.max(2, Math.round(bounds.h / cw));
    const rh = bounds.h / rows2;
    const s = Math.min(cw, rh) * rng.range(0.26, 0.4);
    const stroke = icon === "ring";
    const sw = s * rng.range(0.2, 0.35);
    const jitter = Math.min(cw, rh) * 0.12;
    if (cols * rows2 > 1400) return g;
    for (let r = 0; r < rows2; r++) {
      for (let c = 0; c < cols; c++) {
        if (rng.chance(0.06)) continue;
        const cx = bounds.x + cw * (c + 0.5) + rng.gaussian(0, jitter);
        const cy = bounds.y + rh * (r + 0.5) + rng.gaussian(0, jitter);
        const rot = rng.int(0, 360);
        const color = rng.pick(inks);
        const spec = iconPath(icon, s);
        const attrs = { ...spec.attrs };
        if (stroke) {
          attrs.fill = "none";
          attrs.stroke = color;
          attrs["stroke-width"] = sw.toFixed(1);
        } else {
          attrs.fill = color;
        }
        const node = svgEl("g", { transform: `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})` });
        node.appendChild(svgEl(spec.tag, attrs));
        g.appendChild(node);
      }
    }
    return g;
  }
  registerGenerator({ name: "shape-stamps", category: "memphis", weight: 2, render: render128 });

  // src/generators/smokeWisps.ts
  function render129(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const wisps = rng.int(4, 7);
    const steps = 60;
    for (let w = 0; w < wisps; w++) {
      const baseX = bounds.x + rng.range(0.1, 0.9) * bounds.w;
      const baseW = bounds.w * rng.range(0.04, 0.1);
      const driftAmp = bounds.w * rng.range(0.08, 0.22);
      const freq1 = rng.range(1.2, 2.6);
      const freq2 = rng.range(3, 5.5);
      const phase1 = rng.range(0, Math.PI * 2);
      const phase2 = rng.range(0, Math.PI * 2);
      const rise = rng.range(0.85, 1.05);
      const left = [];
      const right = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const y = bounds.y + bounds.h * (1 - t * rise);
        const cx = baseX + driftAmp * (Math.sin(t * Math.PI * freq1 + phase1) * 0.7 + Math.sin(t * Math.PI * freq2 + phase2) * 0.3) * t;
        const ww = baseW * (1 - t) * (0.5 + 0.5 * Math.sin(t * Math.PI));
        left.push((i === 0 ? "M" : "L") + (cx - ww).toFixed(1) + " " + y.toFixed(1));
        right.push("L" + (cx + ww).toFixed(1) + " " + y.toFixed(1));
      }
      right.reverse();
      const d = left.join("") + right.join("") + "Z";
      g.appendChild(svgEl("path", { d, fill: fg, "fill-opacity": rng.range(0.18, 0.4).toFixed(2) }));
    }
    return g;
  }
  registerGenerator({ name: "smoke-wisps", category: "organic", weight: 2, render: render129 });

  // src/generators/spectrumBands.ts
  function paletteHsls2(ctx) {
    const p = ctx.palette;
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const c of [p.primary, p.accent, ...p.colors.slice(3)]) {
      if (seen.has(c)) continue;
      seen.add(c);
      const rgb = parseColor(c);
      if (rgb) out.push(rgbToHsl(rgb));
    }
    return out.length ? out : [{ h: 220, s: 60, l: 50 }];
  }
  function render130(ctx, bounds) {
    const { rng, palette } = ctx;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, palette.background);
    const hsls = paletteHsls2(ctx);
    const vertical = rng.chance(0.5);
    const count = rng.int(7, 16);
    const span = vertical ? bounds.w : bounds.h;
    const bandW = span / count;
    const lightStep = rng.range(8, 16);
    for (let i = 0; i < count; i++) {
      const base = hsls[i % hsls.length];
      const cycle = Math.floor(i / hsls.length);
      const dir = cycle % 2 === 0 ? 1 : -1;
      const l = clamp(base.l + dir * Math.ceil(cycle / 2) * lightStep, 12, 90);
      const fill = hslCss({ h: base.h, s: base.s, l });
      const rect = vertical ? { x: bounds.x + i * bandW, y: bounds.y, width: bandW + 0.6, height: bounds.h } : { x: bounds.x, y: bounds.y + i * bandW, width: bounds.w, height: bandW + 0.6 };
      g.appendChild(svgEl("rect", { ...rect, fill }));
    }
    return g;
  }
  registerGenerator({ name: "spectrum-bands", category: "gradient", weight: 2, render: render130 });

  // src/generators/spectrumBars.ts
  function render131(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const peakColor = palette.accent === fg ? palette.primary : palette.accent;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(10, 22);
    const slot = bounds.w / cols;
    const barW = slot * rng.range(0.55, 0.78);
    const colGap = (slot - barW) / 2;
    const segCount = rng.int(12, 22);
    const segGap = bounds.h * 0.012;
    const segH = (bounds.h - segGap * (segCount + 1)) / segCount;
    let bars = "";
    let peaks = "";
    for (let c = 0; c < cols; c++) {
      const level = Math.max(1, Math.round(rng.range(0.15, 1) * segCount));
      const x = bounds.x + c * slot + colGap;
      for (let s = 0; s < level; s++) {
        const y = bounds.y + bounds.h - segGap - (s + 1) * (segH + segGap) + segGap;
        bars += `M${x.toFixed(2)} ${y.toFixed(2)}h${barW.toFixed(2)}v${segH.toFixed(2)}h-${barW.toFixed(2)}z`;
      }
      const peakSeg = Math.min(segCount, level + rng.int(1, 3));
      const py = bounds.y + bounds.h - segGap - peakSeg * (segH + segGap) + segGap;
      peaks += `M${x.toFixed(2)} ${py.toFixed(2)}h${barW.toFixed(2)}v${segH.toFixed(2)}h-${barW.toFixed(2)}z`;
    }
    g.appendChild(svgEl("path", { d: bars, fill: fg }));
    g.appendChild(svgEl("path", { d: peaks, fill: peakColor }));
    return g;
  }
  registerGenerator({ name: "spectrum-bars", category: "digital", weight: 2, render: render131 });

  // src/generators/spiral.ts
  function render132(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const maxR = Math.hypot(bounds.w, bounds.h) / 2;
    const turns = rng.range(4, 11);
    const dir = rng.chance() ? 1 : -1;
    const phase = rng.range(0, Math.PI * 2);
    const totalAngle = turns * Math.PI * 2;
    const steps = Math.min(1400, Math.round(turns * 90));
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = dir * t * totalAngle + phase;
      const r = t * maxR;
      const x = (cx + Math.cos(a) * r).toFixed(2);
      const y = (cy + Math.sin(a) * r).toFixed(2);
      d += i === 0 ? `M${x} ${y}` : `L${x} ${y}`;
    }
    const strokeW = maxR / turns * rng.range(0.18, 0.5);
    g.appendChild(
      svgEl("path", {
        d,
        fill: "none",
        stroke: fg,
        "stroke-width": strokeW.toFixed(2),
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      })
    );
    return g;
  }
  registerGenerator({ name: "spiral", category: "radial", weight: 2, render: render132 });

  // src/generators/spiralTiles.ts
  function render133(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const maxR = Math.hypot(bounds.w, bounds.h) * 0.6;
    const turns = rng.range(3, 5);
    const growth = rng.range(0.16, 0.24);
    const dir = rng.chance() ? 1 : -1;
    let d = "";
    let theta = 0;
    let r = Math.min(bounds.w, bounds.h) * 0.02;
    const totalTheta = turns * 2 * Math.PI;
    let guard = 0;
    while (r < maxR && guard < 1400) {
      guard++;
      const x = cx + Math.cos(theta * dir) * r;
      const y = cy + Math.sin(theta * dir) * r;
      const size = Math.max(2, r * 0.5);
      const half = size / 2;
      const a = theta * dir + r * 0.01;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const corner = (sx, sy) => `${(x + sx * ca - sy * sa).toFixed(1)} ${(y + sx * sa + sy * ca).toFixed(1)}`;
      d += `M${corner(-half, -half)}L${corner(half, -half)}L${corner(half, half)}L${corner(-half, half)}z`;
      const dTheta = Math.min(0.5, size * 0.5 / (r + 1));
      theta += dTheta;
      r *= 1 + growth * dTheta;
      if (theta > totalTheta) r = maxR;
    }
    g.appendChild(svgEl("path", { d, fill: fg, stroke: bg, "stroke-width": 1 }));
    return g;
  }
  registerGenerator({ name: "spiral-tiles", category: "geometric", weight: 2, render: render133 });

  // src/generators/splatter.ts
  function render134(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const inkColors = [fg, palette.accent, palette.primary];
    const minDim = Math.min(bounds.w, bounds.h);
    const blots = rng.int(3, 6);
    for (let b = 0; b < blots; b++) {
      const ink = rng.pick(inkColors);
      const ox = bounds.x + rng.range(0.1, 0.9) * bounds.w;
      const oy = bounds.y + rng.range(0.1, 0.9) * bounds.h;
      const coreR = minDim * rng.range(0.04, 0.11);
      g.appendChild(svgEl("circle", { cx: ox.toFixed(1), cy: oy.toFixed(1), r: coreR.toFixed(1), fill: ink }));
      const specks = rng.int(20, 60);
      const spread = coreR * rng.range(4, 9);
      let d = "";
      for (let s = 0; s < specks; s++) {
        const ang = rng.next() * Math.PI * 2;
        const dist = coreR + Math.abs(rng.gaussian(0, spread * 0.4));
        const px = ox + Math.cos(ang) * dist;
        const py = oy + Math.sin(ang) * dist;
        const dotR = Math.max(0.8, coreR * rng.range(0.06, 0.35));
        d += `M${px.toFixed(1)} ${(py - dotR).toFixed(1)}`;
        d += `l${dotR.toFixed(1)} ${dotR.toFixed(1)}l${(-dotR).toFixed(1)} ${dotR.toFixed(1)}l${(-dotR).toFixed(1)} ${(-dotR).toFixed(1)}z`;
      }
      const drips = rng.int(2, 5);
      for (let k = 0; k < drips; k++) {
        const ang = rng.next() * Math.PI * 2;
        const len = coreR * rng.range(3, 8);
        const ex = ox + Math.cos(ang) * len;
        const ey = oy + Math.sin(ang) * len;
        const wdt = coreR * rng.range(0.12, 0.3);
        const nx = -Math.sin(ang) * wdt;
        const ny = Math.cos(ang) * wdt;
        d += `M${(ox + nx).toFixed(1)} ${(oy + ny).toFixed(1)}`;
        d += `L${(ox - nx).toFixed(1)} ${(oy - ny).toFixed(1)}`;
        d += `L${ex.toFixed(1)} ${ey.toFixed(1)}z`;
      }
      g.appendChild(svgEl("path", { d, fill: ink }));
    }
    return g;
  }
  registerGenerator({ name: "splatter", category: "organic", weight: 2, render: render134 });

  // src/generators/squareSpiral.ts
  function render135(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const stroke = Math.max(1, Math.min(bounds.w, bounds.h) * rng.range(4e-3, 0.012));
    const step = stroke * rng.range(3, 8);
    const limit = Math.max(bounds.w, bounds.h) / 2 + step;
    const cap = 900;
    const pts = [[cx, cy]];
    const dirs = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1]
    ];
    let x = cx;
    let y = cy;
    let leg = step;
    let di = 0;
    while (pts.length < cap) {
      for (let twice = 0; twice < 2; twice++) {
        const [dx, dy] = dirs[di % 4];
        x += dx * leg;
        y += dy * leg;
        pts.push([x, y]);
        di++;
      }
      leg += step;
      if (leg > limit * 2) break;
    }
    let d = "";
    for (let i = pts.length - 1; i >= 0; i--) {
      const [px, py] = pts[i];
      d += `${i === pts.length - 1 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`;
    }
    g.appendChild(
      svgEl("path", {
        d,
        stroke: fg,
        "stroke-width": stroke.toFixed(2),
        fill: "none",
        "stroke-linejoin": "miter"
      })
    );
    return g;
  }
  registerGenerator({ name: "square-spiral", category: "lines", weight: 2, render: render135 });

  // src/generators/squiggles.ts
  function render136(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const inks = [fg, palette.accent, palette.colors[2] ?? fg];
    const rows2 = rng.int(5, 14);
    const rowH = bounds.h / rows2;
    const amp = rowH * rng.range(0.18, 0.42);
    const bumps = Math.max(3, Math.min(40, Math.round(bounds.w / (rowH * 0.9))));
    const stepX = (bounds.w + amp * 4) / bumps;
    const stroke = Math.max(1.5, rowH * rng.range(0.1, 0.22));
    for (let r = 0; r < rows2; r++) {
      const yBase = bounds.y + rowH * (r + 0.5);
      const phase = rng.next() * Math.PI * 2;
      const a = amp * rng.range(0.7, 1.2);
      let d = `M ${(bounds.x - amp * 2).toFixed(1)} ${yBase.toFixed(1)}`;
      let dir = rng.chance() ? 1 : -1;
      for (let i = 0; i < bumps; i++) {
        const x0 = bounds.x - amp * 2 + i * stepX;
        const cx = x0 + stepX / 2;
        const ex = x0 + stepX;
        const cy = yBase + dir * a * Math.sin(phase + i);
        d += ` Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${yBase.toFixed(1)}`;
        dir = -dir;
      }
      g.appendChild(
        svgEl("path", {
          d,
          fill: "none",
          stroke: rng.pick(inks),
          "stroke-width": stroke,
          "stroke-linecap": "round"
        })
      );
    }
    return g;
  }
  registerGenerator({ name: "squiggles", category: "memphis", weight: 2, render: render136 });

  // src/generators/stampGrid.ts
  function render137(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(2, 4);
    const cw = bounds.w / cols;
    const rows2 = Math.max(2, Math.round(bounds.h / cw));
    const ch = bounds.h / rows2;
    const pad = Math.min(cw, ch) * rng.range(0.1, 0.16);
    const perfR = Math.min(cw, ch) * rng.range(0.025, 0.04);
    const ink = [fg, palette.accent, palette.primary];
    let perf = "";
    for (let r = 0; r < rows2; r++) {
      for (let c = 0; c < cols; c++) {
        const x = bounds.x + c * cw + pad;
        const y = bounds.y + r * ch + pad;
        const w = cw - pad * 2;
        const h = ch - pad * 2;
        g.appendChild(
          svgEl("rect", {
            x: x.toFixed(1),
            y: y.toFixed(1),
            width: w.toFixed(1),
            height: h.toFixed(1),
            fill: rng.pick(ink),
            rx: (perfR * 0.5).toFixed(1)
          })
        );
        const along = Math.max(3, Math.round(w / (perfR * 3)));
        const down = Math.max(3, Math.round(h / (perfR * 3)));
        for (let i = 0; i <= along; i++) {
          const px = x + w * i / along;
          perf += dot(px, y, perfR) + dot(px, y + h, perfR);
        }
        for (let j = 0; j <= down; j++) {
          const py = y + h * j / down;
          perf += dot(x, py, perfR) + dot(x + w, py, perfR);
        }
      }
    }
    g.appendChild(svgEl("path", { d: perf, fill: bg }));
    return g;
  }
  function dot(cx, cy, r) {
    return `M${(cx - r).toFixed(1)} ${cy.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(r * 2).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-r * 2).toFixed(1)} 0z`;
  }
  registerGenerator({ name: "stamp-grid", category: "print", weight: 2, render: render137 });

  // src/generators/starburstDeco.ts
  function render138(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const alt = palette.accent === fg ? palette.primary : palette.accent;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const outer = Math.hypot(bounds.w, bounds.h) * 0.62;
    const points = rng.int(10, 18);
    const total = points * 2;
    const step = Math.PI * 2 / total;
    const start = -Math.PI / 2;
    const inner = outer * rng.range(0.32, 0.5);
    let star = "";
    for (let i = 0; i <= total; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = start + i * step;
      const x = (cx + r * Math.cos(a)).toFixed(1);
      const y = (cy + r * Math.sin(a)).toFixed(1);
      star += `${i === 0 ? "M" : "L"}${x} ${y}`;
    }
    star += "Z";
    g.appendChild(svgEl("path", { d: star, fill: fg }));
    const rings = rng.int(3, 5);
    const stroke = Math.max(1.5, outer * 0.012);
    for (let i = 1; i <= rings; i++) {
      const r = inner * (i / (rings + 1));
      g.appendChild(svgEl("circle", { cx, cy, r, fill: "none", stroke: alt, "stroke-width": stroke }));
    }
    g.appendChild(svgEl("circle", { cx, cy, r: inner * 0.28, fill: alt }));
    return g;
  }
  registerGenerator({ name: "starburst-deco", category: "geometric", weight: 2, render: render138 });

  // src/generators/starburstThin.ts
  function render139(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + bounds.w * (rng.chance(0.6) ? 0.5 : rng.range(0.2, 0.8));
    const cy = bounds.y + bounds.h * (rng.chance(0.6) ? 0.5 : rng.range(0.2, 0.8));
    const maxR = Math.hypot(bounds.w, bounds.h);
    const lines = rng.int(40, 160);
    const phase = rng.range(0, Math.PI * 2);
    const jitter = rng.range(0, 0.4);
    let d = "";
    for (let i = 0; i < lines; i++) {
      const a = phase + i / lines * Math.PI * 2 + rng.range(-jitter, jitter) / lines;
      const x = (cx + Math.cos(a) * maxR).toFixed(2);
      const y = (cy + Math.sin(a) * maxR).toFixed(2);
      d += `M${cx.toFixed(2)} ${cy.toFixed(2)}L${x} ${y}`;
    }
    g.appendChild(
      svgEl("path", {
        d,
        stroke: fg,
        "stroke-width": (Math.min(bounds.w, bounds.h) * rng.range(2e-3, 6e-3)).toFixed(2),
        fill: "none"
      })
    );
    return g;
  }
  registerGenerator({ name: "starburst-thin", category: "radial", weight: 2, render: render139 });

  // src/generators/starfield.ts
  function render140(ctx, bounds) {
    const { rng, palette } = ctx;
    const pair = palettePair(ctx, rng);
    const dark = palette.backgroundIsDark ? palette.background : pair.bg;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, dark);
    const starColors = [
      palette.primary,
      palette.accent,
      palette.colors[2] ?? palette.primary
    ];
    const minDim = Math.min(bounds.w, bounds.h);
    const area = bounds.w * bounds.h;
    const dust = Math.min(1e3, Math.round(area / 600));
    let dustD = "";
    for (let i = 0; i < dust; i++) {
      const x = (bounds.x + rng.next() * bounds.w).toFixed(1);
      const y = (bounds.y + rng.next() * bounds.h).toFixed(1);
      const r = (minDim * 15e-4).toFixed(2);
      dustD += `M${x} ${y}m${-r} 0a${r} ${r} 0 1 0 ${Number(r) * 2} 0a${r} ${r} 0 1 0 ${-Number(r) * 2} 0`;
    }
    g.appendChild(svgEl("path", { d: dustD, fill: rng.pick(starColors), "fill-opacity": "0.5" }));
    const mid = Math.min(300, Math.round(area / 4e3));
    let midD = "";
    for (let i = 0; i < mid; i++) {
      const x = bounds.x + rng.next() * bounds.w;
      const y = bounds.y + rng.next() * bounds.h;
      const r = minDim * rng.range(2e-3, 6e-3);
      midD += `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(r * 2).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-r * 2).toFixed(1)} 0`;
    }
    g.appendChild(svgEl("path", { d: midD, fill: rng.pick(starColors) }));
    const bright = rng.int(4, 14);
    for (let i = 0; i < bright; i++) {
      const cx = bounds.x + rng.next() * bounds.w;
      const cy = bounds.y + rng.next() * bounds.h;
      const r = minDim * rng.range(0.01, 0.03);
      const r2 = r * 0.28;
      const d = `M${cx.toFixed(1)} ${(cy - r).toFixed(1)}L${(cx + r2).toFixed(1)} ${(cy - r2).toFixed(1)}L${(cx + r).toFixed(1)} ${cy.toFixed(1)}L${(cx + r2).toFixed(1)} ${(cy + r2).toFixed(1)}L${cx.toFixed(1)} ${(cy + r).toFixed(1)}L${(cx - r2).toFixed(1)} ${(cy + r2).toFixed(1)}L${(cx - r).toFixed(1)} ${cy.toFixed(1)}L${(cx - r2).toFixed(1)} ${(cy - r2).toFixed(1)}z`;
      g.appendChild(svgEl("path", { d, fill: rng.pick(starColors) }));
    }
    return g;
  }
  registerGenerator({ name: "starfield", category: "scatter", weight: 2, render: render140 });

  // src/generators/stipple.ts
  function render141(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const area = bounds.w * bounds.h;
    const attempts = Math.min(3e3, Math.round(area / rng.range(60, 140)));
    const radius = Math.max(1, Math.min(bounds.w, bounds.h) * rng.range(4e-3, 0.012));
    const angle = rng.range(0, Math.PI * 2);
    const ax = Math.cos(angle);
    const ay = Math.sin(angle);
    const flip = rng.chance(0.5) ? 1 : -1;
    let d = "";
    for (let i = 0; i < attempts; i++) {
      const x = rng.next();
      const y = rng.next();
      let p = (x * ax + y * ay) * 0.5 + 0.5;
      if (flip < 0) p = 1 - p;
      if (rng.next() > p * p) continue;
      const px = (bounds.x + x * bounds.w).toFixed(1);
      const py = (bounds.y + y * bounds.h).toFixed(1);
      d += `M${px} ${py}m${-radius} 0a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`;
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    return g;
  }
  registerGenerator({ name: "stipple", category: "dots", weight: 2, render: render141 });

  // src/generators/stripes.ts
  function render142(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const angle = rng.pick([0, 45, 90, 135, rng.int(0, 180)]);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const diag = Math.hypot(bounds.w, bounds.h);
    const count = rng.int(5, 24);
    const step = diag / count;
    const stripeW = step * rng.range(0.3, 0.6);
    const rot = svgEl("g", { transform: `rotate(${angle} ${cx} ${cy})` });
    for (let i = 0; i <= count; i++) {
      const x = cx - diag / 2 + i * step;
      rot.appendChild(
        svgEl("rect", { x, y: cy - diag / 2, width: stripeW, height: diag, fill: fg })
      );
    }
    g.appendChild(rot);
    return g;
  }
  registerGenerator({ name: "stripes", category: "geometric", weight: 3, render: render142 });

  // src/generators/sunburst.ts
  function onRay(c, angle, len) {
    return `${c.x + Math.cos(angle) * len} ${c.y + Math.sin(angle) * len}`;
  }
  function render143(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const c = {
      x: bounds.x + bounds.w * rng.range(0.3, 0.7),
      y: bounds.y + bounds.h * rng.range(0.2, 0.8)
    };
    const len = Math.hypot(bounds.w, bounds.h);
    const wedges = rng.int(8, 32) * 2;
    const step = Math.PI * 2 / wedges;
    const phase = rng.range(0, Math.PI);
    for (let i = 0; i < wedges; i += 2) {
      const a0 = phase + i * step;
      const a1 = a0 + step;
      g.appendChild(
        svgEl("polygon", {
          points: `${c.x} ${c.y} ${onRay(c, a0, len)} ${onRay(c, a1, len)}`,
          fill: fg
        })
      );
    }
    return g;
  }
  registerGenerator({ name: "sunburst", category: "rays", weight: 2, render: render143 });

  // src/generators/sunsetBands.ts
  function render144(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const id = uid("sky");
    const grad = svgEl("linearGradient", { id, x1: "0", y1: "0", x2: "0", y2: "1" });
    grad.appendChild(svgEl("stop", { offset: "0", "stop-color": fg }));
    grad.appendChild(svgEl("stop", { offset: "1", "stop-color": bg }));
    const defs = svgEl("defs");
    defs.appendChild(grad);
    g.appendChild(defs);
    g.appendChild(
      svgEl("rect", { x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h, fill: `url(#${id})` })
    );
    const ramp = [fg, palette.accent, palette.primary, bg];
    const count = rng.int(6, 16);
    const bandH = bounds.h / count;
    for (let i = 0; i < count; i++) {
      const col = ramp[Math.min(ramp.length - 1, Math.floor(i / count * ramp.length))];
      const opacity = (0.35 + i / count * 0.5).toFixed(2);
      g.appendChild(
        svgEl("rect", {
          x: bounds.x,
          y: bounds.y + i * bandH,
          width: bounds.w,
          height: bandH + 0.5,
          fill: col,
          "fill-opacity": opacity
        })
      );
    }
    return g;
  }
  registerGenerator({ name: "sunset-bands", category: "gradient", weight: 2, render: render144 });

  // src/generators/symbolTiling.ts
  var SYMBOLS = ["*", "+", "\xD7", "/", "\\", "\xB7", "\u2022", "\u25E6", "\xB7", "\u203B", "#", "~", "=", "\u2234", "\xB0"];
  function render145(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const family = ctx.text.font.family;
    const weight = rng.pick([400, 700, 900]);
    const primary = rng.pick(SYMBOLS);
    const secondary = rng.chance(0.6) ? rng.pick(SYMBOLS) : primary;
    const checker = rng.chance(0.5);
    const cols = rng.int(6, 16);
    const cw = bounds.w / cols;
    const rows2 = Math.max(2, Math.round(bounds.h / cw));
    const ch = bounds.h / rows2;
    const size = Math.min(cw, ch) * rng.range(0.7, 1.05);
    const rowRotate = rng.chance(0.4);
    for (let r = 0; r < rows2; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = bounds.x + (c + 0.5) * cw;
        const cy = bounds.y + (r + 0.5) * ch;
        const odd = (r + c) % 2 === 1;
        const sym = checker && odd ? secondary : primary;
        const fill = checker && odd ? palette.accent : fg;
        const rot = rowRotate && r % 2 === 1 ? 45 : 0;
        const t = svgEl("text", {
          x: cx,
          y: (cy + size * 0.34).toFixed(1),
          "font-family": family,
          "font-size": size.toFixed(1),
          "font-weight": weight,
          "text-anchor": "middle",
          fill,
          transform: rot ? `rotate(${rot} ${cx} ${cy})` : ""
        });
        t.textContent = sym;
        g.appendChild(t);
      }
    }
    return g;
  }
  registerGenerator({ name: "symbol-tiling", category: "type", weight: 2, render: render145 });

  // src/generators/targetRings.ts
  function render146(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, fg);
    const cx = bounds.x + bounds.w * (rng.chance(0.7) ? 0.5 : rng.range(0.25, 0.75));
    const cy = bounds.y + bounds.h * (rng.chance(0.7) ? 0.5 : rng.range(0.25, 0.75));
    const maxR = Math.hypot(
      Math.max(cx - bounds.x, bounds.x + bounds.w - cx),
      Math.max(cy - bounds.y, bounds.y + bounds.h - cy)
    );
    const rings = rng.int(4, 10);
    const colors = [bg, fg];
    for (let i = rings; i >= 1; i--) {
      const r = i / rings * maxR;
      g.appendChild(
        svgEl("circle", {
          cx: cx.toFixed(2),
          cy: cy.toFixed(2),
          r: r.toFixed(2),
          fill: colors[(rings - i) % 2]
        })
      );
    }
    return g;
  }
  registerGenerator({ name: "target-rings", category: "radial", weight: 2, render: render146 });

  // src/generators/tartan.ts
  function render147(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const colors = [fg, palette.accent, palette.primary];
    const unit = Math.min(bounds.w, bounds.h) / rng.int(5, 9);
    const sett = [];
    const settLen = rng.int(3, 5);
    for (let i = 0; i < settLen; i++) {
      sett.push({
        color: rng.pick(colors),
        width: unit * rng.range(0.4, 1.4),
        opacity: rng.range(0.35, 0.6)
      });
    }
    const thin = { color: rng.pick(colors), width: Math.max(1, unit * 0.12), opacity: 0.8 };
    layBands(g, bounds, sett, thin, false);
    layBands(g, bounds, sett, thin, true);
    return g;
  }
  function layBands(g, bounds, sett, thin, horizontal) {
    const span = horizontal ? bounds.h : bounds.w;
    const cross = horizontal ? bounds.w : bounds.h;
    const start = horizontal ? bounds.y : bounds.x;
    const crossStart = horizontal ? bounds.x : bounds.y;
    let pos = start;
    let i = 0;
    while (pos < start + span) {
      const band2 = sett[i % sett.length];
      const w = Math.min(band2.width, start + span - pos);
      const attrs = {
        fill: band2.color,
        "fill-opacity": band2.opacity.toFixed(2)
      };
      if (horizontal) {
        Object.assign(attrs, {
          x: crossStart,
          y: pos.toFixed(1),
          width: cross,
          height: w.toFixed(1)
        });
      } else {
        Object.assign(attrs, {
          x: pos.toFixed(1),
          y: crossStart,
          width: w.toFixed(1),
          height: cross
        });
      }
      g.appendChild(svgEl("rect", attrs));
      if (i % sett.length === 0) {
        const lineAttrs = {
          fill: thin.color,
          "fill-opacity": thin.opacity.toFixed(2)
        };
        if (horizontal) {
          Object.assign(lineAttrs, { x: crossStart, y: pos.toFixed(1), width: cross, height: thin.width.toFixed(1) });
        } else {
          Object.assign(lineAttrs, { x: pos.toFixed(1), y: crossStart, width: thin.width.toFixed(1), height: cross });
        }
        g.appendChild(svgEl("rect", lineAttrs));
      }
      pos += w;
      i++;
    }
  }
  registerGenerator({ name: "tartan", category: "retro", weight: 2, render: render147 });

  // src/generators/terminalGrid.ts
  var GLYPHS = "#%&$@*+=-_/\\|<>[]{}01.:;".split("");
  function render148(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(20, 44);
    const cellW = bounds.w / cols;
    const cellH = cellW * rng.range(1.5, 1.9);
    const rows2 = Math.max(1, Math.floor(bounds.h / cellH));
    const fontSize = cellH * 0.82;
    const density = rng.range(0.55, 0.85);
    const text = svgEl("text", {
      x: bounds.x,
      y: bounds.y,
      fill: fg,
      "font-family": "monospace",
      "font-size": fontSize.toFixed(2),
      "xml:space": "preserve"
    });
    for (let r = 0; r < rows2; r++) {
      const ty = bounds.y + (r + 0.85) * cellH;
      const span = svgEl("tspan", {
        x: bounds.x + cellW * 0.1,
        y: ty.toFixed(1),
        "fill-opacity": rng.range(0.4, 1).toFixed(2)
      });
      let line = "";
      for (let c = 0; c < cols; c++) {
        line += rng.chance(density) ? rng.pick(GLYPHS) : " ";
      }
      span.textContent = line;
      text.appendChild(span);
    }
    g.appendChild(text);
    return g;
  }
  registerGenerator({ name: "terminal-grid", category: "techno", weight: 2, render: render148 });

  // src/generators/terrazzo.ts
  function render149(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const inks = [
      palette.primary,
      palette.accent,
      palette.colors[1] ?? palette.primary,
      palette.colors[3] ?? palette.accent
    ];
    const area = bounds.w * bounds.h;
    const unit = Math.min(bounds.w, bounds.h);
    const count = Math.min(900, Math.max(40, Math.round(area / (unit * unit * 0.012))));
    const paths = {};
    for (let i = 0; i < count; i++) {
      const cx = bounds.x + rng.next() * bounds.w;
      const cy = bounds.y + rng.next() * bounds.h;
      const r = unit * rng.range(0.01, 0.035);
      const sides = rng.int(3, 6);
      const ci = rng.int(0, inks.length - 1);
      let d = "";
      const start = rng.next() * Math.PI * 2;
      for (let s = 0; s < sides; s++) {
        const a = start + s / sides * Math.PI * 2;
        const rr = r * rng.range(0.6, 1.1);
        const px = (cx + Math.cos(a) * rr).toFixed(1);
        const py = (cy + Math.sin(a) * rr).toFixed(1);
        d += (s === 0 ? "M" : "L") + px + " " + py;
      }
      d += "Z";
      paths[ci] = (paths[ci] ?? "") + d;
    }
    for (const key of Object.keys(paths)) {
      g.appendChild(svgEl("path", { d: paths[Number(key)], fill: inks[Number(key)] }));
    }
    return g;
  }
  registerGenerator({ name: "terrazzo", category: "memphis", weight: 2, render: render149 });

  // src/generators/ticketEdge.ts
  function render150(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, fg);
    const tickets = rng.int(3, 6);
    const th = bounds.h / tickets;
    const notch = Math.min(th, bounds.w) * rng.range(0.04, 0.07);
    const dash = th * rng.range(0.06, 0.1);
    const stroke = Math.max(1, th * 0.02);
    const innerInset = bounds.w * rng.range(0.04, 0.08);
    let notches = "";
    for (let i = 1; i < tickets; i++) {
      const y = bounds.y + i * th;
      notches += dot2(bounds.x, y, notch) + dot2(bounds.x + bounds.w, y, notch);
      g.appendChild(
        svgEl("line", {
          x1: (bounds.x + notch).toFixed(1),
          y1: y.toFixed(1),
          x2: (bounds.x + bounds.w - notch).toFixed(1),
          y2: y.toFixed(1),
          stroke: bg,
          "stroke-width": stroke.toFixed(2),
          "stroke-dasharray": `${dash.toFixed(1)} ${(dash * 0.8).toFixed(1)}`
        })
      );
    }
    for (let i = 0; i < tickets; i++) {
      const y = bounds.y + i * th;
      g.appendChild(
        svgEl("line", {
          x1: (bounds.x + innerInset).toFixed(1),
          y1: (y + th * 0.18).toFixed(1),
          x2: (bounds.x + innerInset).toFixed(1),
          y2: (y + th * 0.82).toFixed(1),
          stroke: bg,
          "stroke-width": stroke.toFixed(2),
          "stroke-dasharray": `${(dash * 0.5).toFixed(1)} ${(dash * 0.5).toFixed(1)}`
        })
      );
    }
    g.appendChild(svgEl("path", { d: notches, fill: bg }));
    return g;
  }
  function dot2(cx, cy, r) {
    return `M${(cx - r).toFixed(1)} ${cy.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(r * 2).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-r * 2).toFixed(1)} 0z`;
  }
  registerGenerator({ name: "ticket-edge", category: "print", weight: 1, render: render150 });

  // src/generators/topographicRelief.ts
  function render151(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const waves = rng.int(4, 7);
    const wa = [];
    const wfx = [];
    const wfy = [];
    const wp = [];
    for (let i = 0; i < waves; i++) {
      const ang = rng.range(0, Math.PI * 2);
      const freq = rng.range(1.5, 5.5) / Math.max(bounds.w, bounds.h);
      wa.push(rng.range(0.5, 1));
      wfx.push(Math.cos(ang) * freq * Math.PI * 2);
      wfy.push(Math.sin(ang) * freq * Math.PI * 2);
      wp.push(rng.range(0, Math.PI * 2));
    }
    const height = (x, y) => {
      let h = 0;
      for (let i = 0; i < waves; i++) h += wa[i] * Math.sin(x * wfx[i] + y * wfy[i] + wp[i]);
      return h;
    };
    const aspect = bounds.w / bounds.h;
    const gridW = Math.max(40, Math.round(Math.sqrt(2600 * aspect)));
    const gridH = Math.max(40, Math.round(2600 / gridW));
    const cw = bounds.w / gridW;
    const ch = bounds.h / gridH;
    let lo = Infinity;
    let hi = -Infinity;
    const field = new Float64Array(gridW * gridH);
    for (let r = 0; r < gridH; r++) {
      const y = bounds.y + (r + 0.5) * ch;
      for (let c = 0; c < gridW; c++) {
        const v = height(bounds.x + (c + 0.5) * cw, y);
        field[r * gridW + c] = v;
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
    const levels = rng.int(6, 9);
    for (let lvl = 1; lvl < levels; lvl++) {
      const threshold = lo + (hi - lo) * lvl / levels;
      const opacity = (0.32 + 0.4 * (lvl / levels)).toFixed(2);
      let d = "";
      for (let r = 0; r < gridH; r++) {
        for (let c = 0; c < gridW; c++) {
          if (field[r * gridW + c] < threshold) continue;
          const x = (bounds.x + c * cw).toFixed(1);
          const y = (bounds.y + r * ch).toFixed(1);
          d += `M${x} ${y}h${(cw + 0.6).toFixed(1)}v${(ch + 0.6).toFixed(1)}h${(-cw - 0.6).toFixed(1)}z`;
        }
      }
      if (d) g.appendChild(svgEl("path", { d, fill: fg, "fill-opacity": opacity }));
    }
    return g;
  }
  registerGenerator({ name: "topographic-relief", category: "organic", weight: 2, render: render151 });

  // src/generators/triangles.ts
  function tri(points, fill) {
    return svgEl("polygon", { points: points.join(" "), fill });
  }
  function render152(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(3, 9);
    const cell = bounds.w / cols;
    const rows2 = Math.ceil(bounds.h / cell);
    const colors = [fg, palette.accent, bg];
    for (let r = 0; r < rows2; r++) {
      for (let c = 0; c < cols; c++) {
        const x = bounds.x + c * cell;
        const y = bounds.y + r * cell;
        if (rng.chance(0.5)) {
          g.appendChild(tri([x, y, x + cell, y, x, y + cell], rng.pick(colors)));
          g.appendChild(tri([x + cell, y, x + cell, y + cell, x, y + cell], rng.pick(colors)));
        } else {
          g.appendChild(tri([x, y, x + cell, y, x + cell, y + cell], rng.pick(colors)));
          g.appendChild(tri([x, y, x + cell, y + cell, x, y + cell], rng.pick(colors)));
        }
      }
    }
    return g;
  }
  registerGenerator({ name: "triangles", category: "geometric", weight: 2, render: render152 });

  // src/generators/truchet.ts
  function render153(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(4, 12);
    const cell = bounds.w / cols;
    const rows2 = Math.ceil(bounds.h / cell);
    const sw = cell * rng.range(0.12, 0.3);
    const r = cell / 2;
    for (let row = 0; row < rows2; row++) {
      for (let c = 0; c < cols; c++) {
        const x = bounds.x + c * cell;
        const y = bounds.y + row * cell;
        const arc = (cx, cy, sx, sy, ex, ey) => g.appendChild(
          svgEl("path", {
            d: `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`,
            fill: "none",
            stroke: fg,
            "stroke-width": sw
          })
        );
        if (rng.chance(0.5)) {
          arc(x, y, x + r, y, x, y + r);
          arc(x + cell, y + cell, x + cell - r, y + cell, x + cell, y + cell - r);
        } else {
          arc(x + cell, y, x + cell - r, y, x + cell, y + r);
          arc(x, y + cell, x + r, y + cell, x, y + cell - r);
        }
      }
    }
    return g;
  }
  registerGenerator({ name: "truchet", category: "geometric", weight: 2, render: render153 });

  // src/generators/vaporwaveGrid.ts
  function render154(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const neon = palette.accent === fg ? palette.primary : palette.accent;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const horizonY = bounds.y + bounds.h * rng.range(0.28, 0.42);
    const vpx = bounds.x + bounds.w / 2;
    const bottom = bounds.y + bounds.h;
    const stroke = Math.max(1, Math.min(bounds.w, bounds.h) * 4e-3);
    g.appendChild(
      svgEl("line", {
        x1: bounds.x,
        y1: horizonY,
        x2: bounds.x + bounds.w,
        y2: horizonY,
        stroke: neon,
        "stroke-width": stroke * 2
      })
    );
    let dV = "";
    const cols = rng.int(8, 16);
    for (let i = 0; i <= cols; i++) {
      const bx = bounds.x + i / cols * bounds.w;
      dV += `M${bx.toFixed(1)} ${bottom.toFixed(1)}L${vpx.toFixed(1)} ${horizonY.toFixed(1)}`;
    }
    g.appendChild(svgEl("path", { d: dV, stroke: fg, "stroke-width": stroke, fill: "none" }));
    let dH = "";
    const rowsN = rng.int(8, 14);
    for (let i = 1; i <= rowsN; i++) {
      const t = Math.pow(i / rowsN, 2.2);
      const y = horizonY + t * (bottom - horizonY);
      dH += `M${bounds.x.toFixed(1)} ${y.toFixed(1)}h${bounds.w.toFixed(1)}`;
    }
    g.appendChild(svgEl("path", { d: dH, stroke: fg, "stroke-width": stroke, fill: "none" }));
    const sunR = bounds.w * rng.range(0.1, 0.18);
    g.appendChild(
      svgEl("circle", {
        cx: vpx,
        cy: horizonY - sunR * rng.range(0.2, 0.9),
        r: sunR,
        fill: neon
      })
    );
    return g;
  }
  registerGenerator({ name: "vaporwave-grid", category: "retro", weight: 2, render: render154 });

  // src/generators/verticalTextStripes.ts
  function render155(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const script = scriptByName(ctx.text.script);
    const family = ctx.text.font.family;
    const weight = rng.pick([500, 700, 900]);
    const cols = rng.int(4, 12);
    const cw = bounds.w / cols;
    const size = cw * rng.range(0.55, 0.85);
    for (let c = 0; c < cols; c++) {
      const cx = bounds.x + (c + 0.5) * cw;
      const up = rng.chance(0.5);
      const angle = up ? -90 : 90;
      const fill = rng.chance(0.18) ? palette.accent : fg;
      const phrase = makePhrase(rng, script, { words: rng.int(4, 9), casing: "upper" });
      const cy = bounds.y + bounds.h / 2;
      const t = svgEl("text", {
        x: 0,
        y: 0,
        dy: (size * 0.34).toFixed(1),
        "font-family": family,
        "font-size": size.toFixed(1),
        "font-weight": weight,
        "text-anchor": "middle",
        fill,
        "letter-spacing": (size * rng.range(0, 0.08)).toFixed(2),
        transform: `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${angle})`
      });
      t.textContent = phrase || "TYPE";
      g.appendChild(t);
    }
    return g;
  }
  registerGenerator({ name: "vertical-text-stripes", category: "type", weight: 2, render: render155 });

  // src/generators/vignette.ts
  function render156(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, fg);
    const id = uid("vig");
    const cx = rng.range(0.4, 0.6);
    const cy = rng.range(0.4, 0.6);
    const grad = svgEl("radialGradient", {
      id,
      cx: cx.toFixed(3),
      cy: cy.toFixed(3),
      r: rng.range(0.6, 0.85).toFixed(3)
    });
    const edge = rng.chance(0.5) ? bg : palette.accent;
    const inner = rng.range(0, 0.15).toFixed(2);
    const mid = rng.range(0.5, 0.7).toFixed(2);
    grad.appendChild(svgEl("stop", { offset: "0", "stop-color": edge, "stop-opacity": inner }));
    grad.appendChild(svgEl("stop", { offset: mid, "stop-color": edge, "stop-opacity": "0.1" }));
    grad.appendChild(
      svgEl("stop", { offset: "1", "stop-color": edge, "stop-opacity": rng.range(0.75, 0.95).toFixed(2) })
    );
    const defs = svgEl("defs");
    defs.appendChild(grad);
    g.appendChild(defs);
    g.appendChild(
      svgEl("rect", { x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h, fill: `url(#${id})` })
    );
    return g;
  }
  registerGenerator({ name: "vignette", category: "gradient", weight: 1, render: render156 });

  // src/generators/vintageSunrays.ts
  function render157(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + rng.range(0.3, 0.7) * bounds.w;
    const cy = bounds.y + rng.pick([0, 1, 0.5]) * bounds.h;
    const radius = Math.hypot(bounds.w, bounds.h) * 1.3;
    const rays = rng.int(14, 28) * 2;
    const step = Math.PI * 2 / rays;
    const start = rng.range(0, step * 2);
    let d = "";
    for (let i = 0; i < rays; i += 2) {
      const a0 = start + i * step;
      const a1 = a0 + step;
      const x0 = cx + radius * Math.cos(a0);
      const y0 = cy + radius * Math.sin(a0);
      const x1 = cx + radius * Math.cos(a1);
      const y1 = cy + radius * Math.sin(a1);
      d += `M${cx.toFixed(1)} ${cy.toFixed(1)}L${x0.toFixed(1)} ${y0.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}Z`;
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    return g;
  }
  registerGenerator({ name: "vintage-sunrays", category: "retro", weight: 2, render: render157 });

  // src/generators/voronoiCells.ts
  function render158(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const swatches = [
      palette.primary,
      palette.accent,
      palette.background,
      palette.colors[0] ?? palette.primary,
      palette.colors[2] ?? palette.accent,
      palette.colors[4] ?? palette.primary
    ];
    const area = bounds.w * bounds.h;
    const seedCount = Math.max(6, Math.min(40, Math.round(area / 9e3)));
    const sx = [];
    const sy = [];
    const sColor = [];
    for (let i = 0; i < seedCount; i++) {
      sx.push(bounds.x + rng.next() * bounds.w);
      sy.push(bounds.y + rng.next() * bounds.h);
      sColor.push(rng.pick(swatches));
    }
    const cells = Math.min(2400, Math.round(area / 90));
    const aspect = bounds.w / bounds.h;
    const gridW = Math.max(8, Math.round(Math.sqrt(cells * aspect)));
    const gridH = Math.max(8, Math.round(cells / gridW));
    const cw = bounds.w / gridW;
    const ch = bounds.h / gridH;
    const paths = /* @__PURE__ */ new Map();
    for (let r = 0; r < gridH; r++) {
      const cy = bounds.y + (r + 0.5) * ch;
      for (let c = 0; c < gridW; c++) {
        const cx = bounds.x + (c + 0.5) * cw;
        let best = 0;
        let bestD = Infinity;
        for (let s = 0; s < seedCount; s++) {
          const dx = cx - sx[s];
          const dy = cy - sy[s];
          const d = dx * dx + dy * dy;
          if (d < bestD) {
            bestD = d;
            best = s;
          }
        }
        const color = sColor[best];
        const x = (bounds.x + c * cw).toFixed(1);
        const y = (bounds.y + r * ch).toFixed(1);
        const w = cw.toFixed(1);
        const h = ch.toFixed(1);
        paths.set(color, (paths.get(color) ?? "") + `M${x} ${y}h${w}v${h}h${-w}z`);
      }
    }
    for (const [color, d] of paths) {
      g.appendChild(svgEl("path", { d, fill: color }));
    }
    return g;
  }
  registerGenerator({ name: "voronoi-cells", category: "organic", weight: 2, render: render158 });

  // src/generators/warpedGrid.ts
  function render159(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(8, 18);
    const rows2 = rng.int(8, 18);
    const cw = bounds.w / cols;
    const ch = bounds.h / rows2;
    const stroke = Math.max(0.7, Math.min(bounds.w, bounds.h) * rng.range(25e-4, 6e-3));
    const amp = Math.min(cw, ch) * rng.range(0.6, 1.4);
    const fx = rng.range(1.5, 4) * Math.PI * 2 / bounds.w;
    const fy = rng.range(1.5, 4) * Math.PI * 2 / bounds.h;
    const phase = rng.range(0, Math.PI * 2);
    const warpX = (x, y) => x + amp * Math.sin(fy * (y - bounds.y) + phase);
    const warpY = (x, y) => y + amp * Math.cos(fx * (x - bounds.x) + phase);
    const samples = 4;
    let d = "";
    for (let c = 0; c <= cols; c++) {
      const x = bounds.x + c * cw;
      for (let s = 0; s <= rows2 * samples; s++) {
        const y = bounds.y + s / samples * ch;
        const px = warpX(x, y).toFixed(1);
        const py = warpY(x, y).toFixed(1);
        d += `${s === 0 ? "M" : "L"}${px} ${py}`;
      }
    }
    for (let r = 0; r <= rows2; r++) {
      const y = bounds.y + r * ch;
      for (let s = 0; s <= cols * samples; s++) {
        const x = bounds.x + s / samples * cw;
        const px = warpX(x, y).toFixed(1);
        const py = warpY(x, y).toFixed(1);
        d += `${s === 0 ? "M" : "L"}${px} ${py}`;
      }
    }
    g.appendChild(
      svgEl("path", { d, stroke: fg, "stroke-width": stroke.toFixed(2), fill: "none" })
    );
    return g;
  }
  registerGenerator({ name: "warped-grid", category: "lines", weight: 2, render: render159 });

  // src/generators/waterRipple.ts
  function render160(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const accent = palette.accent === fg ? palette.primary : palette.accent;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const diag = Math.hypot(bounds.w, bounds.h);
    const drops = rng.int(1, 2);
    const colors = [fg, accent];
    for (let dpi = 0; dpi < drops; dpi++) {
      const cx = bounds.x + rng.range(0.15, 0.85) * bounds.w;
      const cy = bounds.y + rng.range(0.15, 0.85) * bounds.h;
      const maxR = diag * 1.1;
      const spacing = maxR / rng.int(16, 26);
      const color = colors[dpi % colors.length];
      let i = 0;
      for (let r = spacing; r < maxR; r += spacing) {
        const t = r / maxR;
        const w = (1 + 4 * Math.exp(-t * 2.2)) * (0.6 + 0.4 * Math.sin(i * 0.9));
        g.appendChild(svgEl("circle", {
          cx,
          cy,
          r: r.toFixed(1),
          fill: "none",
          stroke: color,
          "stroke-width": Math.max(0.6, w).toFixed(2),
          "stroke-opacity": (0.9 - t * 0.45).toFixed(2)
        }));
        i++;
      }
    }
    return g;
  }
  registerGenerator({ name: "water-ripple", category: "organic", weight: 2, render: render160 });

  // src/generators/waveform.ts
  function render161(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cy = bounds.y + bounds.h / 2;
    const count = rng.int(40, 90);
    const slot = bounds.w / count;
    const barW = slot * rng.range(0.45, 0.7);
    const gap = (slot - barW) / 2;
    const maxAmp = bounds.h * 0.46;
    const f1 = rng.range(2, 5);
    const f2 = rng.range(6, 12);
    const phase1 = rng.range(0, Math.PI * 2);
    const phase2 = rng.range(0, Math.PI * 2);
    let d = "";
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const env = 0.35 + 0.4 * Math.abs(Math.sin(t * f1 * Math.PI + phase1)) + 0.25 * Math.abs(Math.sin(t * f2 * Math.PI + phase2));
      const amp = Math.max(slot * 0.6, env * maxAmp * rng.range(0.7, 1));
      const x = (bounds.x + i * slot + gap).toFixed(2);
      const top = (cy - amp).toFixed(2);
      const fullH = (amp * 2).toFixed(2);
      d += `M${x} ${top}h${barW.toFixed(2)}v${fullH}h-${barW.toFixed(2)}z`;
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    return g;
  }
  registerGenerator({ name: "waveform", category: "digital", weight: 2, render: render161 });

  // src/generators/waves.ts
  function render162(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const bands = rng.int(4, 12);
    const bandH = bounds.h / bands;
    const amp = bandH * rng.range(0.4, 1.1);
    const periods = rng.range(1, 4);
    const phase = rng.range(0, Math.PI * 2);
    const steps = 40;
    for (let i = 0; i <= bands; i++) {
      const baseY = bounds.y + i * bandH;
      let d = `M ${bounds.x} ${bounds.y + bounds.h} L ${bounds.x} ${baseY}`;
      for (let s = 0; s <= steps; s++) {
        const x = bounds.x + s / steps * bounds.w;
        const y = baseY + Math.sin(s / steps * periods * Math.PI * 2 + phase + i) * amp;
        d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      d += ` L ${bounds.x + bounds.w} ${bounds.y + bounds.h} Z`;
      g.appendChild(svgEl("path", { d, fill: i % 2 === 0 ? fg : bg }));
    }
    return g;
  }
  registerGenerator({ name: "waves", category: "waves", weight: 2, render: render162 });

  // src/generators/weaveThick.ts
  function render163(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const vColor = fg === palette.accent ? palette.primary : palette.accent;
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(3, 6);
    const pitch = bounds.w / cols;
    const band2 = pitch * 0.62;
    const rows2 = Math.ceil(bounds.h / pitch) + 1;
    const gap = (pitch - band2) / 2;
    const hY = (r) => bounds.y + r * pitch + gap;
    const vX = (c) => bounds.x + c * pitch + gap;
    let hD = "";
    for (let r = -1; r < rows2; r++) {
      hD += `M${bounds.x} ${hY(r)}h${bounds.w}v${band2}h${-bounds.w}z`;
    }
    g.appendChild(svgEl("path", { d: hD, fill: fg }));
    let vD = "";
    for (let c = -1; c <= cols; c++) {
      vD += `M${vX(c)} ${bounds.y}v${bounds.h}h${band2}v${-bounds.h}z`;
    }
    g.appendChild(svgEl("path", { d: vD, fill: vColor }));
    let overD = "";
    for (let r = -1; r < rows2; r++) {
      for (let c = -1; c <= cols; c++) {
        if ((r + c & 1) === 0) continue;
        const y = hY(r);
        const x = vX(c) - gap;
        overD += `M${x} ${y}h${pitch}v${band2}h${-pitch}z`;
      }
    }
    g.appendChild(svgEl("path", { d: overD, fill: fg }));
    let shD = "";
    const sh = Math.max(1, band2 * 0.12);
    for (let r = -1; r < rows2; r++) {
      for (let c = -1; c <= cols; c++) {
        if ((r + c & 1) === 0) continue;
        const y = hY(r);
        const x = vX(c);
        shD += `M${x} ${y}h${sh}v${band2}h${-sh}z`;
        shD += `M${x + band2 - sh} ${y}h${sh}v${band2}h${-sh}z`;
      }
    }
    g.appendChild(svgEl("path", { d: shD, fill: bg, opacity: 0.28 }));
    return g;
  }
  registerGenerator({ name: "weave-thick", category: "geometric", weight: 2, render: render163 });

  // src/generators/windmillTiles.ts
  function render164(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cols = rng.int(3, 6);
    const cell = bounds.w / cols;
    const rows2 = Math.ceil(bounds.h / cell) + 1;
    const m = cell / 2;
    let d = "";
    for (let r = -1; r < rows2; r++) {
      for (let c = -1; c <= cols; c++) {
        const x = bounds.x + c * cell;
        const y = bounds.y + r * cell;
        d += `M${x} ${y}L${x + m} ${y}L${x + m} ${y + m}L${x} ${y + m}Z`;
        d += `M${x + m} ${y}L${x + cell} ${y}L${x + cell} ${y + m}Z`;
        d += `M${x + cell} ${y + cell}L${x + m} ${y + cell}L${x + m} ${y + m}L${x + cell} ${y + m}Z`;
        d += `M${x + m} ${y + cell}L${x} ${y + cell}L${x} ${y + m}Z`;
      }
    }
    g.appendChild(svgEl("path", { d, fill: fg }));
    return g;
  }
  registerGenerator({ name: "windmill-tiles", category: "geometric", weight: 2, render: render164 });

  // src/generators/wireframeMesh.ts
  function render165(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const horizonY = bounds.y + bounds.h * rng.range(0.25, 0.45);
    const vpX = bounds.x + bounds.w * rng.range(0.4, 0.6);
    const floorBottom = bounds.y + bounds.h;
    const cols = rng.int(8, 18);
    const rows2 = rng.int(8, 16);
    const stroke = Math.max(1, Math.min(bounds.w, bounds.h) * 35e-4);
    let d = "";
    for (let c = 0; c <= cols; c++) {
      const t = c / cols;
      const bx = bounds.x + t * bounds.w;
      d += `M${vpX.toFixed(1)} ${horizonY.toFixed(1)}L${bx.toFixed(1)} ${floorBottom.toFixed(1)}`;
    }
    const power = rng.range(2, 3.4);
    for (let r = 1; r <= rows2; r++) {
      const t = r / rows2;
      const y = horizonY + Math.pow(t, power) * (floorBottom - horizonY);
      d += `M${bounds.x} ${y.toFixed(1)}H${(bounds.x + bounds.w).toFixed(1)}`;
    }
    g.appendChild(
      svgEl("path", {
        d,
        fill: "none",
        stroke: fg,
        "stroke-width": stroke.toFixed(2),
        "stroke-opacity": "0.75"
      })
    );
    g.appendChild(
      svgEl("rect", {
        x: bounds.x,
        y: (horizonY - stroke).toFixed(1),
        width: bounds.w,
        height: (stroke * 2.4).toFixed(2),
        fill: fg
      })
    );
    if (rng.chance(0.5)) {
      let sky = "";
      const skyRows = rng.int(3, 6);
      for (let r = 1; r <= skyRows; r++) {
        const y = horizonY - r / skyRows * (horizonY - bounds.y);
        sky += `M${bounds.x} ${y.toFixed(1)}H${(bounds.x + bounds.w).toFixed(1)}`;
      }
      g.appendChild(
        svgEl("path", {
          d: sky,
          fill: "none",
          stroke: fg,
          "stroke-width": (stroke * 0.7).toFixed(2),
          "stroke-opacity": "0.25"
        })
      );
    }
    return g;
  }
  registerGenerator({ name: "wireframe-mesh", category: "techno", weight: 2, render: render165 });

  // src/generators/woodGrain.ts
  function render166(ctx, bounds) {
    const { rng } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const cx = bounds.x + rng.range(-0.2, 0.3) * bounds.w;
    const cy = bounds.y + rng.range(0.2, 0.8) * bounds.h;
    const maxR = Math.hypot(bounds.w, bounds.h) * 1.15;
    const lobes = rng.int(3, 6);
    const phase = rng.range(0, Math.PI * 2);
    const lobeAmt = rng.range(0.06, 0.16);
    const stretch = rng.range(1.2, 2);
    const tilt = rng.range(0, Math.PI);
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);
    const segs = 80;
    const ringStep = maxR / rng.int(22, 34);
    let d = "";
    for (let r = ringStep; r < maxR; r += ringStep * rng.range(0.7, 1.3)) {
      let ring2 = "";
      for (let i = 0; i <= segs; i++) {
        const a = i / segs * Math.PI * 2;
        const wob = 1 + lobeAmt * Math.sin(a * lobes + phase + r * 0.01);
        const rr = r * wob;
        const ex = Math.cos(a) * rr * stretch;
        const ey = Math.sin(a) * rr;
        const x = cx + ex * cosT - ey * sinT;
        const y = cy + ex * sinT + ey * cosT;
        ring2 += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
      }
      d += ring2 + "Z";
    }
    g.appendChild(svgEl("path", { d, fill: "none", stroke: fg, "stroke-width": rng.range(1.4, 2.6) }));
    return g;
  }
  registerGenerator({ name: "wood-grain", category: "organic", weight: 2, render: render166 });

  // src/generators/zigzagRibbons.ts
  function render167(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const inks = rng.shuffle([
      palette.primary,
      palette.accent,
      palette.colors[1] ?? palette.primary,
      palette.colors[3] ?? palette.accent
    ]);
    const bands = rng.int(4, 10);
    const slot = bounds.h / bands;
    const thickness = slot * rng.range(1.05, 1.6);
    const amp = slot * rng.range(0.5, 1.1);
    const teeth = Math.max(2, Math.min(16, rng.int(3, 10)));
    const stepX = bounds.w / teeth;
    for (let i = bands - 1; i >= 0; i--) {
      const yc = bounds.y + slot * (i + 0.5);
      const up = rng.chance();
      const half = thickness / 2;
      const yAt = (k) => yc + (k % 2 === 0 === up ? -1 : 1) * amp / 2;
      let top = `M ${(bounds.x - stepX).toFixed(1)} ${(yAt(0) - half).toFixed(1)}`;
      for (let k = 0; k <= teeth + 1; k++) {
        const x = bounds.x + (k - 1) * stepX;
        top += ` L ${x.toFixed(1)} ${(yAt(k) - half).toFixed(1)}`;
      }
      let bottom = "";
      for (let k = teeth + 1; k >= 0; k--) {
        const x = bounds.x + (k - 1) * stepX;
        bottom += ` L ${x.toFixed(1)} ${(yAt(k) + half).toFixed(1)}`;
      }
      g.appendChild(svgEl("path", { d: top + bottom + " Z", fill: inks[i % inks.length] }));
    }
    return g;
  }
  registerGenerator({ name: "zigzag-ribbons", category: "memphis", weight: 2, render: render167 });

  // src/generators/zigzagTiles.ts
  function render168(ctx, bounds) {
    const { rng, palette } = ctx;
    const { bg, fg } = palettePair(ctx, rng);
    const g = clipped(ctx, bounds);
    baseFill(g, bounds, bg);
    const tones = [fg, palette.primary, palette.accent];
    const teeth = rng.int(4, 12);
    const toothW = bounds.w / teeth;
    const bandH = bounds.h / rng.int(4, 10);
    const amp = bandH * rng.range(0.35, 0.6);
    const rows2 = Math.ceil(bounds.h / bandH) + 2;
    for (let row = -1; row < rows2; row++) {
      const yTop = bounds.y + row * bandH;
      const fill = tones[(row % tones.length + tones.length) % tones.length];
      let d = `M ${bounds.x} ${(yTop + amp).toFixed(2)}`;
      for (let i = 0; i <= teeth + 1; i++) {
        const x = bounds.x + i * toothW;
        const y = i % 2 === 0 ? yTop + amp : yTop - amp;
        d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
      }
      for (let i = teeth + 1; i >= 0; i--) {
        const x = bounds.x + i * toothW;
        const y = (i % 2 === 0 ? yTop + amp : yTop - amp) + bandH;
        d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
      }
      d += " Z";
      g.appendChild(svgEl("path", { d, fill }));
    }
    return g;
  }
  registerGenerator({ name: "zigzag-tiles", category: "tiling", weight: 2, render: render168 });

  // src/typography/fitText.ts
  var measureSvg = null;
  var measureText = null;
  function measurer() {
    if (!measureText) {
      measureSvg = svgEl("svg", { width: 0, height: 0 });
      measureSvg.style.cssText = "position:absolute;left:-9999px;top:-9999px;visibility:hidden;width:0;height:0";
      measureText = svgEl("text");
      measureSvg.appendChild(measureText);
      document.body.appendChild(measureSvg);
    }
    return measureText;
  }
  function applyStyle(el, style) {
    el.setAttribute("font-family", style.family);
    el.setAttribute("font-size", String(style.size));
    el.setAttribute("font-weight", String(style.weight));
    if (style.letterSpacing) el.setAttribute("letter-spacing", String(style.letterSpacing));
  }
  function measureWidth(text, style) {
    const node = measurer();
    applyStyle(node, style);
    node.textContent = text;
    return node.getComputedTextLength();
  }
  function fitSizeToWidth(text, maxWidth, style, min = 6) {
    const w = measureWidth(text, style);
    if (w <= maxWidth || w === 0) return style.size;
    return Math.max(min, style.size * maxWidth / w);
  }
  function wrapText(text, maxWidth, style) {
    const hasSpaces = text.includes(" ");
    const tokens = hasSpaces ? text.split(/\s+/) : Array.from(text);
    const sep = hasSpaces ? " " : "";
    const lines = [];
    let line = "";
    for (const tok of tokens) {
      const candidate = line ? line + sep + tok : tok;
      if (line && measureWidth(candidate, style) > maxWidth) {
        lines.push(line);
        line = tok;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines;
  }
  function resolveFill(opts, fallback) {
    const preferred = opts.fill ?? fallback;
    return opts.bg ? ensureContrast(preferred, opts.bg, opts.minContrast ?? AA_NORMAL) : preferred;
  }
  function drawLine(ctx, x, y, text, style, opts = {}) {
    const el = ctx.el("text", {
      x,
      y,
      "font-family": style.family,
      "font-size": style.size,
      "font-weight": style.weight,
      "text-anchor": opts.anchor ?? (style.rtl ? "end" : "start"),
      fill: resolveFill(opts, ctx.palette.text)
    });
    if (style.letterSpacing) el.setAttribute("letter-spacing", String(style.letterSpacing));
    if (style.lang) el.setAttribute("xml:lang", style.lang);
    el.textContent = text;
    (opts.parent ?? ctx.root).appendChild(el);
    return el;
  }
  function drawHeadline(ctx, rect, text, style, opts = {}) {
    const g = ctx.group(opts.parent);
    const mode = opts.mode ?? "shrink";
    const size = mode === "shrink" ? fitSizeToWidth(text, rect.w, style) : style.size;
    const drawStyle = { ...style, size };
    const align = opts.align ?? (style.rtl ? "end" : "start");
    const width = measureWidth(text, drawStyle);
    const x = align === "middle" ? rect.x + rect.w / 2 : align === "end" ? rect.x + rect.w : rect.x;
    const y = rect.y + rect.h / 2 + size * 0.35;
    if (mode === "bleed" && opts.backing && opts.bg) {
      const left = align === "middle" ? x - width / 2 : align === "end" ? x - width : x;
      const pad = size * 0.14;
      const ascent = size * 0.9;
      const descent = size * 0.22;
      g.appendChild(
        ctx.el("rect", {
          x: left - pad,
          y: y - ascent - pad,
          width: width + pad * 2,
          height: ascent + descent + pad * 2,
          fill: opts.bg
        })
      );
    }
    drawLine(ctx, x, y, text, drawStyle, {
      ...opts,
      anchor: align,
      minContrast: opts.minContrast ?? AA_LARGE,
      parent: g
    });
    return g;
  }
  function drawParagraph(ctx, rect, text, style, opts = {}) {
    const g = ctx.group(opts.parent);
    const lh = opts.lineHeight ?? 1.3;
    const lines = wrapText(text, rect.w, style);
    const fill = resolveFill(opts, ctx.palette.text);
    const align = opts.anchor ?? (style.rtl ? "end" : "start");
    const x = align === "middle" ? rect.x + rect.w / 2 : align === "end" ? rect.x + rect.w : rect.x;
    let y = rect.y + style.size;
    const maxY = rect.y + rect.h;
    for (const line of lines) {
      if (y > maxY) break;
      drawLine(ctx, x, y, line, style, { ...opts, anchor: align, fill, parent: g });
      y += style.size * lh;
    }
    return g;
  }

  // src/compositions/_composition.ts
  function fillBackground(ctx, color = ctx.palette.background) {
    ctx.root.appendChild(
      ctx.el("rect", { x: 0, y: 0, width: ctx.width, height: ctx.height, fill: color })
    );
  }
  function block(ctx, r, fill, parent) {
    const el = ctx.el("rect", { x: r.x, y: r.y, width: r.w, height: r.h, fill });
    (parent ?? ctx.root).appendChild(el);
    return el;
  }
  function isRtl(ctx) {
    return !!scriptByName(ctx.text.script).rtl;
  }
  function textStyle(ctx, size, weight = 400) {
    const script = scriptByName(ctx.text.script);
    return { family: ctx.text.font.family, weight, size, rtl: script.rtl, lang: script.lang };
  }
  function heavyWeight(ctx) {
    const w = ctx.text.font.weights;
    return w[w.length - 1];
  }
  function textBundle(ctx) {
    if (!ctx.text.enabled) return null;
    return makeBundle(ctx.rng, ctx.text.script, ctx.text.withEnglish);
  }
  function margin(ctx, frac = 0.06) {
    return Math.min(ctx.width, ctx.height) * frac;
  }
  function displaySize(ctx, frac) {
    return Math.min(ctx.width, ctx.height) * frac;
  }
  function regionFill(ctx, rng) {
    return rng.weighted(
      [ctx.palette.primary, ctx.palette.accent, ctx.palette.colors[3] ?? ctx.palette.primary],
      [4, 2, 2]
    );
  }

  // src/compositions/asymmetricThirds.ts
  function render169(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx);
    const landscape = ctx.width >= ctx.height;
    const rtl = isRtl(ctx);
    let big;
    let band2;
    const bigFirst = rtl ? false : rng.chance(0.6);
    if (landscape) {
      const t = bigFirst ? 2 / 3 : 1 / 3;
      const [a, b] = splitX(ctx.bounds(), t);
      [big, band2] = bigFirst ? [a, b] : [b, a];
    } else {
      const t = bigFirst ? 2 / 3 : 1 / 3;
      const [a, b] = splitY(ctx.bounds(), t);
      [big, band2] = bigFirst ? [a, b] : [b, a];
    }
    ctx.fillRegion(big);
    block(ctx, band2, regionFill(ctx, rng));
    const bundle = textBundle(ctx);
    if (!bundle) return;
    const align = rtl ? "end" : "start";
    const padX = big.w * 0.06;
    const padY = big.h * 0.06;
    const tw = big.w * (landscape ? 0.5 : 0.85);
    const th = big.h * (landscape ? 0.42 : 0.32);
    const tx = rtl ? big.x + big.w - padX - tw : big.x + padX;
    const ty = big.y + big.h - padY - th;
    const backing = { x: tx, y: ty, w: tw, h: th };
    block(ctx, backing, palette.background);
    const ip = Math.min(backing.w, backing.h) * 0.08;
    const inner = { x: backing.x + ip, y: backing.y + ip, w: backing.w - ip * 2, h: backing.h - ip * 2 };
    drawHeadline(
      ctx,
      { x: inner.x, y: inner.y, w: inner.w, h: inner.h * 0.5 },
      bundle.headline,
      textStyle(ctx, displaySize(ctx, 0.075), heavyWeight(ctx)),
      { bg: palette.background, fill: palette.primary, align }
    );
    drawHeadline(
      ctx,
      { x: inner.x, y: inner.y + inner.h * 0.52, w: inner.w, h: inner.h * 0.18 },
      bundle.sub,
      textStyle(ctx, displaySize(ctx, 0.032), heavyWeight(ctx)),
      { bg: palette.background, fill: palette.accent, align }
    );
    drawParagraph(
      ctx,
      { x: inner.x, y: inner.y + inner.h * 0.74, w: inner.w, h: inner.h * 0.26 },
      `${bundle.label} \xB7 ${bundle.body[0]}`,
      textStyle(ctx, displaySize(ctx, 0.019)),
      { bg: palette.background, fill: palette.text, anchor: align, lineHeight: 1.35 }
    );
  }
  registerComposition({ name: "asymmetric-thirds", weight: 2, render: render169 });

  // src/compositions/bigType.ts
  function render170(ctx) {
    const { rng, palette } = ctx;
    const bgIsColor = rng.chance(0.5);
    fillBackground(ctx, bgIsColor ? palette.primary : palette.background);
    const bg = bgIsColor ? palette.primary : palette.background;
    const bundle = textBundle(ctx);
    if (!bundle) {
      ctx.fillRegion(ctx.bounds());
      const bars = rng.int(2, 4);
      for (let i = 0; i < bars; i++) {
        const y = ctx.height * rng.range(0.1, 0.85);
        ctx.root.appendChild(
          ctx.el("rect", {
            x: -20,
            y,
            width: ctx.width + 40,
            height: ctx.height * rng.range(0.04, 0.12),
            fill: i % 2 ? palette.accent : palette.primary
          })
        );
      }
      return;
    }
    const words = bundle.headline.split(/\s+/).filter(Boolean);
    const lines = words.length >= 2 ? words : [bundle.headline];
    const m = margin(ctx, 0.04);
    const lineH = ctx.height / (lines.length + 0.4);
    const weight = heavyWeight(ctx);
    const fill = bgIsColor ? palette.background : palette.primary;
    lines.forEach((line, i) => {
      const probe = textStyle(ctx, ctx.height, weight);
      const target = ctx.width * rng.range(1.02, 1.25);
      const size = Math.min(lineH * 1.15, fitSizeToWidth(line, target, probe, 8));
      const style = textStyle(ctx, size, weight);
      const w = measureWidth(line, style);
      const x = rng.chance(0.5) ? m : ctx.width - m - w;
      const y = lineH * (i + 1);
      drawLine(ctx, x, y, line, style, { bg, fill, minContrast: 3, anchor: "start" });
    });
    drawLine(
      ctx,
      m,
      ctx.height - m,
      `${bundle.sub} \xB7 ${bundle.label}`,
      textStyle(ctx, displaySize(ctx, 0.022), weight),
      { bg, fill, anchor: "start" }
    );
  }
  registerComposition({ name: "big-type", weight: 3, render: render170 });

  // src/compositions/centered.ts
  function render171(ctx) {
    const { rng, palette } = ctx;
    const full = ctx.bounds();
    const weight = heavyWeight(ctx);
    const bundle = textBundle(ctx);
    if (!bundle) {
      fillBackground(ctx, palette.background);
      ctx.fillRegion(full);
      const bw = ctx.width * rng.range(0.46, 0.66);
      const bh = ctx.height * rng.range(0.42, 0.66);
      const bx = (ctx.width - bw) / 2;
      const by = (ctx.height - bh) / 2;
      const frame = Math.min(ctx.width, ctx.height) * rng.range(0.02, 0.04);
      block(ctx, { x: bx - frame, y: by - frame, w: bw + frame * 2, h: bh + frame * 2 }, regionFill(ctx, rng));
      ctx.fillRegion({ x: bx, y: by, w: bw, h: bh });
      const barH = ctx.height * rng.range(0.05, 0.09);
      const barY = rng.chance(0.5) ? ctx.height * rng.range(0.08, 0.16) : ctx.height * rng.range(0.78, 0.88);
      block(ctx, { x: 0, y: barY, w: ctx.width, h: barH }, palette.accent);
      return;
    }
    const head = bundle.headline;
    const overGenerator = rng.chance(0.55);
    if (overGenerator) {
      const fieldColor = rng.chance(0.5) ? palette.primary : palette.accent;
      fillBackground(ctx, fieldColor);
      const pad = margin(ctx, rng.range(0.05, 0.1));
      ctx.fillRegion({ x: pad, y: pad, w: ctx.width - pad * 2, h: ctx.height - pad * 2 });
      const bandColor = fieldColor === palette.primary ? palette.accent : palette.primary;
      const m2 = margin(ctx, 0.03);
      const target2 = ctx.width - m2 * 2;
      const probe2 = textStyle(ctx, ctx.height, weight);
      const bandH = ctx.height * rng.range(0.28, 0.4);
      const bandY = ctx.height * rng.range(0.3, 0.5) - bandH / 2;
      block(ctx, { x: 0, y: bandY, w: ctx.width, h: bandH }, bandColor);
      const size2 = Math.min(bandH * 0.86, fitSizeToWidth(head, target2 * 1.04, probe2, 8));
      const style2 = { ...textStyle(ctx, size2, weight), letterSpacing: -size2 * 0.02 };
      drawHeadline(
        ctx,
        { x: 0, y: bandY, w: ctx.width, h: bandH },
        head,
        style2,
        { bg: bandColor, fill: palette.background, align: "middle", mode: "bleed" }
      );
      const subSize2 = displaySize(ctx, 0.026);
      const chip = { x: m2, y: bandY + bandH + ctx.height * 0.03, w: ctx.width - m2 * 2, h: subSize2 * 1.9 };
      block(ctx, chip, fieldColor);
      drawHeadline(
        ctx,
        chip,
        `${bundle.sub} \xB7 ${bundle.label}`,
        textStyle(ctx, subSize2, weight),
        { bg: fieldColor, fill: palette.background, align: "middle" }
      );
      return;
    }
    const bgPlane = palette.background;
    fillBackground(ctx, bgPlane);
    const t = rng.range(0.42, 0.62);
    const [top, bottom] = splitY(full, t);
    const topColor = rng.chance(0.5) ? palette.primary : palette.accent;
    const bottomColor = topColor === palette.primary ? palette.accent : palette.primary;
    const textureTop = rng.chance(0.5);
    if (textureTop) ctx.fillRegion(top);
    else block(ctx, top, topColor);
    if (textureTop) block(ctx, bottom, bottomColor);
    else ctx.fillRegion(bottom);
    const m = margin(ctx, 0.03);
    const target = ctx.width - m * 2;
    const probe = textStyle(ctx, ctx.height, weight);
    const headH = ctx.height * 0.34;
    const headY = top.h - headH / 2;
    block(ctx, { x: 0, y: headY, w: ctx.width, h: headH }, bgPlane);
    const size = Math.min(headH * 0.82, fitSizeToWidth(head, target * 1.04, probe, 8));
    const style = { ...textStyle(ctx, size, weight), letterSpacing: -size * 0.02 };
    drawHeadline(
      ctx,
      { x: 0, y: headY, w: ctx.width, h: headH },
      head,
      style,
      { bg: bgPlane, fill: palette.text, align: "middle", mode: "bleed" }
    );
    const subSize = displaySize(ctx, 0.026);
    const subChip = { x: m, y: top.h * 0.18, w: ctx.width - m * 2, h: subSize * 1.8 };
    if (textureTop) block(ctx, subChip, topColor);
    drawHeadline(ctx, subChip, bundle.sub, textStyle(ctx, subSize, weight), {
      bg: topColor,
      fill: palette.background,
      align: "middle"
    });
    const labelSize = displaySize(ctx, 0.022);
    const labelChip = {
      x: m,
      y: bottom.y + bottom.h - margin(ctx, 0.05) - labelSize * 1.4,
      w: ctx.width - m * 2,
      h: labelSize * 1.8
    };
    if (!textureTop) block(ctx, labelChip, bottomColor);
    drawHeadline(ctx, labelChip, bundle.label, { ...textStyle(ctx, labelSize, weight), letterSpacing: labelSize * 0.12 }, {
      bg: bottomColor,
      fill: palette.background,
      align: "middle"
    });
  }
  registerComposition({ name: "centered", weight: 2, render: render171 });

  // src/compositions/circularText.ts
  function render172(ctx) {
    const { rng, palette } = ctx;
    const planeColor = rng.chance(0.5) ? palette.primary : palette.accent;
    fillBackground(ctx, planeColor);
    const minDim = Math.min(ctx.width, ctx.height);
    const radius = minDim * rng.range(0.31, 0.46);
    const cx = ctx.width * rng.range(0.34, 0.66);
    const cy = ctx.height * rng.range(0.36, 0.64);
    const clipId = `medallion-${rng.int(1, 1e9)}`;
    const defs = ctx.el("defs");
    const clip = ctx.el("clipPath", { id: clipId });
    clip.appendChild(ctx.el("circle", { cx, cy, r: radius }));
    defs.appendChild(clip);
    ctx.root.appendChild(defs);
    const discRect = { x: cx - radius, y: cy - radius, w: radius * 2, h: radius * 2 };
    const disc = ctx.group();
    disc.setAttribute("clip-path", `url(#${clipId})`);
    ctx.fillRegion(discRect, disc);
    const bundle = textBundle(ctx);
    if (!bundle) {
      const rings = rng.int(2, 4);
      for (let i = 0; i < rings; i++) {
        ctx.root.appendChild(
          ctx.el("circle", {
            cx,
            cy,
            r: radius + minDim * 0.02 * (i + 1),
            fill: "none",
            stroke: i % 2 ? palette.background : planeColor === palette.primary ? palette.accent : palette.primary,
            "stroke-width": minDim * 0.012
          })
        );
      }
      return;
    }
    const rtl = isRtl(ctx);
    const ringColor = planeColor === palette.primary ? palette.accent : palette.primary;
    const bandText = ensureContrast(palette.background, ringColor, AA_LARGE);
    const fontSize = radius * rng.range(0.1, 0.14);
    const bandW = fontSize * 1.7;
    const annInner = radius;
    const annOuter = radius + bandW;
    const pathR = radius + bandW / 2;
    const annPath = `M${cx - annOuter} ${cy} a${annOuter} ${annOuter} 0 1 0 ${annOuter * 2} 0 a${annOuter} ${annOuter} 0 1 0 ${-annOuter * 2} 0 Z M${cx - annInner} ${cy} a${annInner} ${annInner} 0 1 0 ${annInner * 2} 0 a${annInner} ${annInner} 0 1 0 ${-annInner * 2} 0 Z`;
    ctx.root.appendChild(ctx.el("path", { d: annPath, fill: ringColor, "fill-rule": "evenodd" }));
    const rimStyle = textStyle(ctx, fontSize, heavyWeight(ctx));
    const ringPathId = `ring-${rng.int(1, 1e9)}`;
    const ringDefs = ctx.el("defs");
    ringDefs.appendChild(
      ctx.el("path", {
        id: ringPathId,
        d: `M${cx} ${cy - pathR} A${pathR} ${pathR} 0 1 1 ${cx} ${cy + pathR} A${pathR} ${pathR} 0 1 1 ${cx} ${cy - pathR}`,
        fill: "none"
      })
    );
    ctx.root.appendChild(ringDefs);
    const unit = `${bundle.sub} \xB7 ${bundle.label} \xB7 `;
    const circumference = 2 * Math.PI * pathR;
    const unitW = Math.max(1, measureWidth(unit, rimStyle));
    const reps = Math.max(1, Math.round(circumference / unitW));
    const textEl = ctx.el("text", {
      "font-family": rimStyle.family,
      "font-size": rimStyle.size,
      "font-weight": rimStyle.weight,
      fill: bandText,
      "letter-spacing": fontSize * 0.04,
      "dominant-baseline": "central"
    });
    if (rimStyle.lang) textEl.setAttribute("xml:lang", rimStyle.lang);
    const tp = ctx.el("textPath", {});
    tp.setAttribute("href", `#${ringPathId}`);
    tp.setAttribute("startOffset", "0");
    tp.textContent = unit.repeat(reps);
    textEl.appendChild(tp);
    ctx.root.appendChild(textEl);
    const head = bundle.headline.split(/\s+/)[0] || bundle.headline;
    const corner = rng.chance(0.5);
    const hw = ctx.width * 0.96;
    drawHeadline(
      ctx,
      {
        x: corner ? ctx.width * 0.04 : ctx.width * 0,
        y: ctx.height * 0.82,
        w: hw,
        h: ctx.height * 0.16
      },
      head,
      textStyle(ctx, displaySize(ctx, rng.range(0.14, 0.2)), heavyWeight(ctx)),
      {
        mode: "bleed",
        backing: true,
        bg: palette.background,
        align: rtl ? "end" : corner ? "start" : "middle"
      }
    );
  }
  registerComposition({ name: "circular-text", weight: 2, render: render172 });

  // src/compositions/colorField.ts
  function render173(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx, palette.backgroundIsDark ? palette.background : palette.text);
    const landscape = ctx.width >= ctx.height;
    const n = rng.int(2, 3);
    const gap = Math.min(ctx.width, ctx.height) * rng.range(0.01, 0.03);
    const weights = [];
    for (let i = 0; i < n; i++) weights.push(rng.range(0.6, 1));
    const big = rng.int(0, n - 1);
    weights[big] *= rng.range(1.8, 2.6);
    const total = weights.reduce((a, b) => a + b, 0);
    const splitVertical = landscape ? rng.chance(0.4) : false;
    const full = ctx.bounds();
    const fields = [];
    if (splitVertical) {
      let x = 0;
      for (let i = 0; i < n; i++) {
        const w = (full.w - gap * (n - 1)) * (weights[i] / total);
        fields.push({ x, y: 0, w, h: full.h });
        x += w + gap;
      }
    } else {
      let y = 0;
      for (let i = 0; i < n; i++) {
        const h = (full.h - gap * (n - 1)) * (weights[i] / total);
        fields.push({ x: 0, y, w: full.w, h });
        y += h + gap;
      }
    }
    const fieldColors = rng.shuffle([palette.primary, palette.accent, palette.colors[3] ?? palette.primary]);
    const fieldSolid = [];
    fields.forEach((f2, i) => {
      const color = fieldColors[i % fieldColors.length];
      fieldSolid[i] = color;
      block(ctx, f2, color);
      if (rng.chance(0.75)) {
        const pad = Math.min(f2.w, f2.h) * rng.range(0.04, 0.1);
        ctx.fillRegion(inset(f2, pad));
      }
    });
    const bundle = textBundle(ctx);
    if (!bundle) return;
    const rtl = isRtl(ctx);
    const heavy = heavyWeight(ctx);
    const m = margin(ctx, 0.06);
    const hf = fields[big];
    const hSize = displaySize(ctx, rng.range(0.07, 0.12));
    drawHeadline(
      ctx,
      { x: hf.x + m, y: hf.y + hf.h - hSize * 1.8, w: hf.w - m * 2, h: hSize * 1.2 },
      bundle.headline,
      textStyle(ctx, hSize, heavy),
      { mode: "bleed", backing: true, bg: fieldSolid[big], align: rtl ? "end" : "start" }
    );
    const lf = (big + 1) % fields.length;
    const f = fields[lf];
    drawLine(
      ctx,
      rtl ? f.x + f.w - m : f.x + m,
      f.y + m + displaySize(ctx, 0.024),
      `${bundle.label}  \xB7  ${bundle.sub}`,
      textStyle(ctx, displaySize(ctx, 0.024), heavy),
      { bg: fieldSolid[lf], anchor: rtl ? "end" : "start", minContrast: 4.5 }
    );
  }
  registerComposition({ name: "color-field", weight: 2, render: render173 });

  // src/compositions/comicPanels.ts
  function carve(ctx, r, count) {
    if (count <= 1) return [r];
    const { rng } = ctx;
    const vertical = r.w >= r.h ? rng.chance(0.78) : rng.chance(0.22);
    const t = rng.range(0.34, 0.66);
    const [a, b] = vertical ? splitX(r, t) : splitY(r, t);
    const left = Math.max(1, Math.round((count - 1) * rng.range(0.35, 0.65)));
    const right = count - left;
    return [...carve(ctx, a, left), ...carve(ctx, b, right)];
  }
  function render174(ctx) {
    const { rng, palette } = ctx;
    const ink = palette.backgroundIsDark ? palette.background : palette.text;
    fillBackground(ctx, ink);
    const gutter = Math.min(ctx.width, ctx.height) * rng.range(0.02, 0.04);
    const count = rng.int(4, 6);
    const panels = carve(ctx, inset(ctx.bounds(), gutter * 0.5), count).map((p) => inset(p, gutter * 0.5));
    const bundle = textBundle(ctx);
    if (!bundle) {
      for (const p of panels) ctx.fillRegion(p);
      return;
    }
    const rtl = isRtl(ctx);
    const align = rtl ? "end" : "start";
    const weight = heavyWeight(ctx);
    const byArea = panels.map((p, i) => ({ p, i, area: p.w * p.h })).sort((x, y) => y.area - x.area);
    const headlineIdx = byArea[0].i;
    const subIdx = panels.length > 4 ? byArea[1].i : -1;
    panels.forEach((p, i) => {
      if (i === headlineIdx) {
        const fieldColor = regionFill(ctx, rng);
        block(ctx, p, fieldColor);
        const pad = Math.min(p.w, p.h) * 0.08;
        const clipId = `panel-${rng.int(1, 1e9)}`;
        const defs = ctx.el("defs");
        const cp = ctx.el("clipPath", { id: clipId });
        cp.appendChild(ctx.el("rect", { x: p.x, y: p.y, width: p.w, height: p.h }));
        defs.appendChild(cp);
        ctx.root.appendChild(defs);
        const clipped2 = ctx.group();
        clipped2.setAttribute("clip-path", `url(#${clipId})`);
        drawHeadline(
          ctx,
          inset(p, pad),
          bundle.headline,
          textStyle(ctx, displaySize(ctx, rng.range(0.14, 0.22)), weight),
          { mode: "bleed", backing: false, bg: fieldColor, fill: palette.background, align, parent: clipped2 }
        );
        return;
      }
      if (i === subIdx) {
        const fieldColor = palette.background;
        block(ctx, p, fieldColor);
        const pad = Math.min(p.w, p.h) * 0.1;
        drawHeadline(
          ctx,
          inset(p, pad),
          rng.chance(0.5) ? bundle.sub : bundle.label,
          textStyle(ctx, displaySize(ctx, rng.range(0.05, 0.08)), weight),
          { bg: fieldColor, fill: palette.primary, minContrast: 4.5, align }
        );
        return;
      }
      ctx.fillRegion(p);
    });
  }
  registerComposition({ name: "comic-panels", weight: 2, render: render174 });

  // src/compositions/concertDense.ts
  function render175(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx);
    ctx.fillRegion(ctx.bounds());
    const bandTop = ctx.height * rng.range(0.1, 0.25);
    const bandH = ctx.height * rng.range(0.25, 0.4);
    ctx.fillRegion({ x: 0, y: bandTop, w: ctx.width, h: bandH });
    const bundle = textBundle(ctx);
    if (!bundle) {
      const bars = rng.int(3, 6);
      for (let i = 0; i < bars; i++) {
        const y = ctx.height * (0.15 + i * 0.13);
        const h = ctx.height * rng.range(0.02, 0.05);
        block(
          ctx,
          { x: 0, y, w: ctx.width * rng.range(0.4, 1), h },
          i % 2 ? palette.accent : palette.primary
        );
      }
      return;
    }
    const rtl = isRtl(ctx);
    const align = rtl ? "end" : rng.pick(["start", "middle"]);
    const m = margin(ctx, 0.05);
    drawHeadline(
      ctx,
      { x: m, y: ctx.height * 0.36, w: ctx.width - m * 2, h: ctx.height * 0.2 },
      bundle.headline,
      textStyle(ctx, displaySize(ctx, rng.range(0.16, 0.24)), heavyWeight(ctx)),
      { mode: "bleed", backing: true, bg: palette.primary, align }
    );
    const subBands = [
      { y: ctx.height * 0.22, text: bundle.sub, color: palette.accent },
      { y: ctx.height * 0.6, text: bundle.english ?? bundle.body[0] ?? bundle.sub, color: palette.background }
    ];
    for (const b of subBands) {
      drawHeadline(
        ctx,
        { x: m, y: b.y, w: ctx.width - m * 2, h: ctx.height * 0.08 },
        b.text,
        textStyle(ctx, displaySize(ctx, rng.range(0.05, 0.08)), heavyWeight(ctx)),
        { mode: "bleed", backing: true, bg: b.color, align }
      );
    }
    const footH = ctx.height * 0.16;
    const foot = { x: 0, y: ctx.height - footH, w: ctx.width, h: footH };
    block(ctx, foot, palette.background);
    const inner = inset(foot, m, footH * 0.12);
    const detailLines = [...bundle.body, bundle.label].slice(0, 4);
    const rowH = inner.h / detailLines.length;
    detailLines.forEach((line, i) => {
      drawHeadline(
        ctx,
        { x: inner.x, y: inner.y + i * rowH, w: inner.w, h: rowH },
        line,
        textStyle(ctx, rowH * 0.62, heavyWeight(ctx)),
        { bg: palette.background, fill: palette.primary, minContrast: 4.5, align: rtl ? "end" : "start" }
      );
    });
  }
  registerComposition({ name: "concert-dense", weight: 2, render: render175 });

  // src/compositions/contourPoster.ts
  function render176(ctx) {
    const { rng, palette } = ctx;
    const { width: W, height: H } = ctx;
    fillBackground(ctx, palette.background);
    const contourGen = rng.pick([
      "contour-lines",
      "topographic-relief",
      "concentric-circles",
      "nested-arcs",
      "line-wave-field",
      "waves",
      "concentric-hex",
      "water-ripple",
      "radial-lines"
    ]);
    ctx.fillRegion(ctx.bounds(), void 0, contourGen);
    const bundle = textBundle(ctx);
    if (!bundle) {
      const horiz = W >= H;
      const t = rng.range(0.25, 0.45);
      const [a, b] = horiz ? splitX(ctx.bounds(), t) : splitY(ctx.bounds(), t);
      const field = rng.chance(0.5) ? a : b;
      block(ctx, field, rng.chance(0.5) ? palette.primary : palette.accent);
      return;
    }
    const rtl = isRtl(ctx);
    const weight = heavyWeight(ctx);
    const m = margin(ctx, 0.06);
    const fieldColor = rng.chance(0.5) ? palette.primary : palette.accent;
    const edge = rng.pick(["bottom", "top", "left"]);
    const tall = H >= W;
    if (edge === "left" && !tall) {
      const sw = W * rng.range(0.32, 0.46);
      const x = rtl ? W - sw : 0;
      const field = { x, y: 0, w: sw, h: H };
      block(ctx, field, fieldColor);
      drawHeadline(
        ctx,
        { x: field.x + m * 0.6, y: H * 0.5 - H * 0.18, w: field.w - m * 1.2, h: H * 0.36 },
        bundle.headline,
        textStyle(ctx, displaySize(ctx, rng.range(0.13, 0.18)), weight),
        { bg: fieldColor, fill: palette.background, align: rtl ? "end" : "start" }
      );
      drawLine(
        ctx,
        rtl ? field.x + field.w - m * 0.6 : field.x + m * 0.6,
        H - m,
        `${bundle.sub} \xB7 ${bundle.label}`,
        textStyle(ctx, displaySize(ctx, 0.026), weight),
        { bg: fieldColor, fill: palette.background, anchor: rtl ? "end" : "start" }
      );
      return;
    }
    const bandH = H * rng.range(0.26, 0.36);
    const bandY = edge === "top" ? 0 : H - bandH;
    const band2 = { x: 0, y: bandY, w: W, h: bandH };
    block(ctx, band2, fieldColor);
    const align = rtl ? "end" : rng.pick(["start", "middle"]);
    drawHeadline(
      ctx,
      { x: m, y: bandY + bandH * 0.08, w: W - m * 2, h: bandH * 0.62 },
      bundle.headline,
      textStyle(ctx, displaySize(ctx, rng.range(0.16, 0.24)), weight),
      { mode: "shrink", bg: fieldColor, fill: palette.background, align }
    );
    drawLine(
      ctx,
      align === "end" ? W - m : align === "middle" ? W / 2 : m,
      bandY + bandH * 0.88,
      `${bundle.sub} \u2014 ${bundle.label}`,
      textStyle(ctx, displaySize(ctx, 0.028), weight),
      { bg: fieldColor, fill: palette.background, anchor: align }
    );
  }
  registerComposition({ name: "contour-poster", weight: 3, render: render176 });

  // src/compositions/cornerAnchored.ts
  function render177(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx);
    const rtl = isRtl(ctx);
    const m = margin(ctx, 0.07);
    const right = rtl ? true : rng.chance(0.5);
    const bottom = rng.chance(0.5);
    const align = right ? "end" : "start";
    const bundle = textBundle(ctx);
    if (!bundle) {
      const bw = ctx.width * rng.range(0.62, 0.8);
      const bh = ctx.height * rng.range(0.6, 0.82);
      ctx.fillRegion({
        x: right ? ctx.width - m - bw : m,
        y: bottom ? ctx.height - m - bh : m,
        w: bw,
        h: bh
      });
      return;
    }
    const blockW = Math.min(ctx.width, ctx.height) * rng.range(0.28, 0.42);
    const blockH = blockW;
    const counter = {
      x: right ? m : ctx.width - m - blockW,
      y: bottom ? m : ctx.height - m - blockH,
      w: blockW,
      h: blockH
    };
    ctx.fillRegion(counter);
    const colW = Math.min(ctx.width - m * 2, ctx.width * rng.range(0.45, 0.6));
    const colX = right ? ctx.width - m - colW : m;
    const headH = ctx.height * 0.26;
    const headY = bottom ? ctx.height - m - headH : m;
    drawHeadline(
      ctx,
      { x: colX, y: headY, w: colW, h: headH * 0.6 },
      bundle.headline,
      textStyle(ctx, displaySize(ctx, 0.11), heavyWeight(ctx)),
      { bg: palette.background, fill: palette.primary, align }
    );
    drawHeadline(
      ctx,
      { x: colX, y: headY + headH * 0.62, w: colW, h: headH * 0.2 },
      bundle.sub,
      textStyle(ctx, displaySize(ctx, 0.04), heavyWeight(ctx)),
      { bg: palette.background, fill: palette.accent, align }
    );
    drawParagraph(
      ctx,
      { x: colX, y: headY + headH * 0.88, w: colW, h: ctx.height * 0.16 },
      `${bundle.label} \xB7 ${bundle.english ?? bundle.body[0]}`,
      textStyle(ctx, displaySize(ctx, 0.02)),
      { bg: palette.background, fill: palette.text, anchor: align, lineHeight: 1.4 }
    );
  }
  registerComposition({ name: "corner-anchored", weight: 2, render: render177 });

  // src/compositions/cornerBurst.ts
  function render178(ctx) {
    const { rng, palette } = ctx;
    const rtl = isRtl(ctx);
    const corners = [
      { x: 0, y: 0 },
      { x: ctx.width, y: 0 },
      { x: 0, y: ctx.height },
      { x: ctx.width, y: ctx.height }
    ];
    const corner = rtl ? rng.pick([corners[1], corners[3]]) : rng.pick(corners);
    const cA = palette.primary;
    const cB = rng.chance(0.5) ? palette.accent : palette.background;
    fillBackground(ctx, cB);
    const R = Math.hypot(ctx.width, ctx.height) * 1.05;
    const burst = ctx.group();
    const intoX = corner.x === 0 ? 1 : -1;
    const intoY = corner.y === 0 ? 1 : -1;
    const baseAngle = Math.atan2(intoY, intoX);
    const span = Math.PI / 2 + 0.25;
    const start = baseAngle - span / 2;
    const rays = rng.int(9, 15) * 2;
    const step = span / rays;
    for (let i = 0; i < rays; i++) {
      const a0 = start + i * step;
      const a1 = start + (i + 1) * step;
      const p0 = { x: corner.x + R * Math.cos(a0), y: corner.y + R * Math.sin(a0) };
      const p1 = { x: corner.x + R * Math.cos(a1), y: corner.y + R * Math.sin(a1) };
      if (i % 2 === 0) {
        burst.appendChild(
          ctx.el("path", {
            d: `M${corner.x} ${corner.y} L${p0.x} ${p0.y} L${p1.x} ${p1.y} Z`,
            fill: cA
          })
        );
      }
    }
    const bundle = textBundle(ctx);
    const bandVertical = ctx.height >= ctx.width;
    const bandThick = (bandVertical ? ctx.height : ctx.width) * rng.range(0.28, 0.4);
    const band2 = bandVertical ? { x: 0, y: ctx.height * rng.range(0.34, 0.5), w: ctx.width, h: bandThick } : { x: 0, y: 0, w: ctx.width, h: 0 };
    if (bandVertical) {
      band2.y = Math.min(band2.y, ctx.height - bandThick);
    } else {
      band2.h = ctx.height;
      band2.w = bandThick;
      band2.x = ctx.width * rng.range(0.32, 0.5);
      band2.x = Math.min(band2.x, ctx.width - bandThick);
    }
    ctx.fillRegion(band2);
    if (!bundle) {
      const hubR = Math.min(ctx.width, ctx.height) * rng.range(0.1, 0.18);
      burst.appendChild(
        ctx.el("circle", { cx: corner.x, cy: corner.y, r: hubR, fill: cB === palette.background ? palette.accent : palette.background })
      );
      return;
    }
    const align = rtl ? "end" : rng.chance(0.6) ? "start" : "middle";
    const headBg = palette.primary === cA ? palette.accent : palette.primary;
    drawHeadline(
      ctx,
      {
        x: ctx.width * 0.04,
        y: bandVertical ? band2.y + band2.h / 2 : ctx.height * 0.5,
        w: ctx.width * 0.92,
        h: bandVertical ? band2.h : ctx.height * 0.3
      },
      bundle.headline,
      textStyle(ctx, displaySize(ctx, rng.range(0.16, 0.24)), heavyWeight(ctx)),
      { mode: "bleed", backing: true, bg: headBg, align }
    );
    const oppX = corner.x === 0 ? ctx.width : 0;
    const oppY = corner.y === 0 ? ctx.height : 0;
    const m = Math.min(ctx.width, ctx.height) * 0.05;
    const labelStyle = textStyle(ctx, displaySize(ctx, 0.026), heavyWeight(ctx));
    const labelText = `${bundle.sub} \xB7 ${bundle.label}`;
    const chipH = labelStyle.size * 1.6;
    const chipW = ctx.width * 0.5;
    const chipX = oppX === 0 ? m : oppX - m - chipW;
    const chipY = oppY === 0 ? m : oppY - m - chipH;
    block(ctx, { x: chipX, y: chipY, w: chipW, h: chipH }, cB === palette.background ? palette.primary : palette.background);
    const chipColor = cB === palette.background ? palette.primary : palette.background;
    drawLine(
      ctx,
      rtl ? chipX + chipW - chipH * 0.3 : chipX + chipH * 0.3,
      chipY + chipH * 0.68,
      labelText,
      labelStyle,
      { bg: chipColor, anchor: rtl ? "end" : "start" }
    );
  }
  registerComposition({ name: "corner-burst", weight: 2, render: render178 });

  // src/layout/grid.ts
  function gridCells(r, cols, rowCount, gap = 0) {
    const cells = [];
    for (const row of rows(r, rowCount, gap)) {
      cells.push(...columns(row, cols, gap));
    }
    return cells;
  }

  // src/compositions/diagonalGrid.ts
  function render179(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx);
    const cx = ctx.width / 2;
    const cy = ctx.height / 2;
    const angle = rng.range(-28, 28);
    const span = Math.hypot(ctx.width, ctx.height) * 1.25;
    const field = { x: cx - span / 2, y: cy - span / 2, w: span, h: span };
    const n = rng.int(5, 8);
    const gap = span * rng.range(4e-3, 0.012);
    const cells = gridCells(field, n, n, gap);
    const g = ctx.group();
    g.setAttribute("transform", `rotate(${angle} ${cx} ${cy})`);
    cells.forEach((cell) => {
      if (rng.chance(0.5)) {
        ctx.fillRegion(cell, g);
      } else {
        block(ctx, cell, regionFill(ctx, rng), g);
      }
    });
    const bundle = textBundle(ctx);
    if (!bundle) return;
    const m = margin(ctx, 0.07);
    const panelH = ctx.height * rng.range(0.22, 0.32);
    const panel = { x: m, y: cy - panelH / 2, w: ctx.width - m * 2, h: panelH };
    block(ctx, panel, palette.background);
    const pad = Math.min(panel.w, panel.h) * 0.08;
    const align = isRtl(ctx) ? "end" : "start";
    drawHeadline(
      ctx,
      { x: panel.x + pad, y: panel.y + pad, w: panel.w - pad * 2, h: panel.h * 0.55 },
      bundle.headline,
      textStyle(ctx, displaySize(ctx, 0.08), heavyWeight(ctx)),
      { bg: palette.background, fill: palette.primary, align }
    );
    drawHeadline(
      ctx,
      {
        x: panel.x + pad,
        y: panel.y + panel.h * 0.6,
        w: panel.w - pad * 2,
        h: panel.h * 0.3
      },
      `${bundle.sub} \xB7 ${bundle.label}`,
      textStyle(ctx, displaySize(ctx, 0.032), heavyWeight(ctx)),
      { bg: palette.background, fill: palette.accent, align }
    );
  }
  registerComposition({ name: "diagonal-grid", weight: 2, render: render179 });

  // src/compositions/diagonalSplit.ts
  function render180(ctx) {
    const { rng, palette } = ctx;
    const { width: W, height: H } = ctx;
    const leftY = H * rng.range(0.15, 0.45);
    const rightY = H * rng.range(0.55, 0.85);
    const goingDown = rng.chance(0.5);
    const y0 = goingDown ? leftY : rightY;
    const y1 = goingDown ? rightY : leftY;
    const angle = Math.atan2(y1 - y0, W) * 180 / Math.PI;
    const fieldColor = regionFill(ctx, rng);
    const baseColor = rng.chance(0.5) ? palette.background : palette.primary;
    fillBackground(ctx, baseColor);
    const upper = `0,0 ${W},0 ${W},${y1} 0,${y0}`;
    const lower = `0,${y0} ${W},${y1} ${W},${H} 0,${H}`;
    ctx.root.appendChild(ctx.el("polygon", { points: upper, fill: fieldColor }));
    const clipId = `diag-${rng.int(0, 1e9)}`;
    const defs = ctx.el("defs");
    const clip = ctx.el("clipPath", { id: clipId });
    clip.appendChild(ctx.el("polygon", { points: lower }));
    defs.appendChild(clip);
    ctx.root.appendChild(defs);
    const texGroup = ctx.group();
    texGroup.setAttribute("clip-path", `url(#${clipId})`);
    ctx.fillRegion(ctx.bounds(), texGroup);
    ctx.root.appendChild(
      ctx.el("line", {
        x1: 0,
        y1: y0,
        x2: W,
        y2: y1,
        stroke: palette.accent,
        "stroke-width": Math.max(2, Math.min(W, H) * 8e-3)
      })
    );
    const bundle = textBundle(ctx);
    if (!bundle) return;
    const rtl = isRtl(ctx);
    const m = margin(ctx, 0.05);
    const cx = 0;
    const cy = (y0 + y1) / 2;
    const g = ctx.group();
    g.setAttribute("transform", `rotate(${angle.toFixed(3)} ${cx} ${cy})`);
    const headStyle = textStyle(ctx, displaySize(ctx, rng.range(0.1, 0.15)), heavyWeight(ctx));
    drawHeadline(
      ctx,
      { x: m, y: cy - H * 0.07, w: W - m * 2, h: H * 0.14 },
      bundle.headline,
      headStyle,
      {
        mode: "bleed",
        backing: true,
        bg: palette.accent,
        align: rtl ? "end" : "start",
        parent: g
      }
    );
    const labelStyle = textStyle(ctx, displaySize(ctx, 0.028), heavyWeight(ctx));
    const lx = rtl ? W - m : m;
    drawLine(ctx, lx, m + displaySize(ctx, 0.028), `${bundle.sub} \xB7 ${bundle.label}`, labelStyle, {
      bg: fieldColor,
      fill: palette.text,
      anchor: rtl ? "end" : "start"
    });
  }
  registerComposition({ name: "diagonal-split", weight: 3, render: render180 });

  // src/compositions/diptych.ts
  function render181(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx);
    const landscape = ctx.width >= ctx.height;
    const t = rng.range(0.42, 0.58);
    const [first, second] = landscape ? splitX(ctx.bounds(), t) : splitY(ctx.bounds(), t);
    const rtl = isRtl(ctx);
    const textFirst = rtl ? !landscape : rng.chance(0.5);
    const textPanel = textFirst ? first : second;
    const texPanel = textFirst ? second : first;
    const panelColor = rng.chance(0.5) ? palette.primary : palette.accent;
    ctx.fillRegion(texPanel);
    block(ctx, textPanel, panelColor);
    const bundle = textBundle(ctx);
    if (!bundle) {
      return;
    }
    const align = rtl ? "end" : "start";
    const pad = Math.min(textPanel.w, textPanel.h) * 0.1;
    const inner = inset(textPanel, pad);
    drawHeadline(
      ctx,
      { x: inner.x, y: inner.y, w: inner.w, h: inner.h * 0.4 },
      bundle.headline,
      textStyle(ctx, displaySize(ctx, rng.range(0.08, 0.13)), heavyWeight(ctx)),
      { bg: panelColor, fill: palette.background, align }
    );
    drawHeadline(
      ctx,
      { x: inner.x, y: inner.y + inner.h * 0.44, w: inner.w, h: inner.h * 0.1 },
      bundle.sub,
      textStyle(ctx, displaySize(ctx, 0.035), heavyWeight(ctx)),
      { bg: panelColor, fill: palette.background, align }
    );
    drawParagraph(
      ctx,
      { x: inner.x, y: inner.y + inner.h * 0.58, w: inner.w, h: inner.h * 0.34 },
      bundle.body.join("  "),
      textStyle(ctx, displaySize(ctx, 0.02)),
      { bg: panelColor, fill: palette.background, anchor: align, lineHeight: 1.4 }
    );
    const chipW = Math.min(texPanel.w, texPanel.h) * 0.5;
    const chipH = Math.min(texPanel.w, texPanel.h) * 0.12;
    const chip = {
      x: texPanel.x + texPanel.w - chipW - pad,
      y: texPanel.y + texPanel.h - chipH - pad,
      w: chipW,
      h: chipH
    };
    block(ctx, chip, palette.background);
    drawHeadline(
      ctx,
      inset(chip, chipH * 0.18),
      bundle.label,
      textStyle(ctx, chipH * 0.5, heavyWeight(ctx)),
      { bg: palette.background, fill: palette.primary, align: "middle" }
    );
  }
  registerComposition({ name: "diptych", weight: 2, render: render181 });

  // src/compositions/explodedGrid.ts
  function render182(ctx) {
    const { rng, palette } = ctx;
    const { width: W, height: H } = ctx;
    fillBackground(ctx, palette.background);
    const landscape = W >= H;
    const cols = landscape ? rng.int(4, 6) : rng.int(3, 4);
    const rows2 = landscape ? rng.int(3, 4) : rng.int(4, 6);
    const gap = Math.min(W, H) * rng.range(6e-3, 0.018);
    const cells = gridCells(ctx.bounds(), cols, rows2, gap);
    const bw = Math.min(cols - 1, rng.int(2, Math.max(2, cols - 1)));
    const bh = Math.min(rows2 - 1, rng.int(2, Math.max(2, rows2 - 1)));
    const startCol = rng.int(0, cols - bw);
    const startRow = rng.int(0, rows2 - bh);
    const swallowed = /* @__PURE__ */ new Set();
    for (let r = startRow; r < startRow + bh; r++) {
      for (let c = startCol; c < startCol + bw; c++) {
        swallowed.add(r * cols + c);
      }
    }
    cells.forEach((cell, i) => {
      if (swallowed.has(i)) return;
      if (rng.chance(0.32)) {
        block(ctx, cell, rng.chance(0.5) ? palette.primary : palette.accent);
      } else {
        ctx.fillRegion(cell);
      }
    });
    const tl = cells[startRow * cols + startCol];
    const br = cells[(startRow + bh - 1) * cols + (startCol + bw - 1)];
    const boom = { x: tl.x, y: tl.y, w: br.x + br.w - tl.x, h: br.y + br.h - tl.y };
    const bundle = textBundle(ctx);
    const plateColor = bundle ? rng.weighted([palette.primary, palette.accent, palette.background], [3, 3, 2]) : regionFill(ctx, rng);
    if (!bundle) {
      ctx.fillRegion(boom);
      return;
    }
    block(ctx, boom, plateColor);
    const rtl = isRtl(ctx);
    const pad = Math.min(boom.w, boom.h) * 0.08;
    const inner = { x: boom.x + pad, y: boom.y + pad, w: boom.w - pad * 2, h: boom.h - pad * 2 };
    const headSize = Math.min(inner.h * 0.62, displaySize(ctx, rng.range(0.16, 0.26)));
    drawHeadline(
      ctx,
      { x: inner.x, y: inner.y, w: inner.w, h: inner.h * 0.66 },
      bundle.headline,
      textStyle(ctx, headSize, heavyWeight(ctx)),
      { mode: "bleed", backing: false, bg: plateColor, align: rtl ? "end" : "start", minContrast: 3 }
    );
    const subSize = displaySize(ctx, 0.026);
    drawLine(
      ctx,
      rtl ? inner.x + inner.w : inner.x,
      inner.y + inner.h - subSize * 0.2,
      `${bundle.sub} \xB7 ${bundle.label}`,
      textStyle(ctx, subSize, heavyWeight(ctx)),
      { bg: plateColor, fill: palette.text, minContrast: 4.5, anchor: rtl ? "end" : "start" }
    );
  }
  registerComposition({ name: "exploded-grid", weight: 2, render: render182 });

  // src/compositions/frameInFrame.ts
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function render183(ctx) {
    const { rng, palette } = ctx;
    const { width: W, height: H } = ctx;
    const fx = W * rng.range(0.3, 0.7);
    const fy = H * rng.range(0.32, 0.68);
    const baseColor = regionFill(ctx, rng);
    const altColor = baseColor === palette.primary ? palette.accent : palette.primary;
    fillBackground(ctx, rng.chance(0.5) ? baseColor : palette.background);
    const rings = rng.int(4, 6);
    const texRing = rng.int(0, Math.max(0, rings - 3));
    let cur = { x: 0, y: 0, w: W, h: H };
    const frames = [];
    for (let i = 0; i < rings; i++) {
      frames.push(cur);
      const k = rng.range(0.6, 0.74);
      const nw = cur.w * k;
      const nh = cur.h * k;
      const rxFrac = (fx - cur.x) / cur.w;
      const ryFrac = (fy - cur.y) / cur.h;
      cur = {
        x: lerp(cur.x, cur.x + cur.w - nw, rxFrac),
        y: lerp(cur.y, cur.y + cur.h - nh, ryFrac),
        w: nw,
        h: nh
      };
    }
    frames.forEach((f, i) => {
      if (i === texRing) {
        ctx.fillRegion(f);
        return;
      }
      const c = i % 2 === 0 ? baseColor : altColor;
      block(ctx, f, c);
    });
    const inner = frames[frames.length - 1];
    const bundle = textBundle(ctx);
    if (!bundle) {
      ctx.fillRegion(inner);
      return;
    }
    const panelColor = (rings - 1) % 2 === 0 ? baseColor : altColor;
    const needsPlate = texRing === rings - 1;
    const plateColor = needsPlate ? palette.background : panelColor;
    if (needsPlate) block(ctx, inner, plateColor);
    const rtl = isRtl(ctx);
    const align = rtl ? "end" : "middle";
    const pad = Math.min(inner.w, inner.h) * 0.08;
    const tf = { x: inner.x + pad, y: inner.y + pad, w: inner.w - pad * 2, h: inner.h - pad * 2 };
    drawHeadline(
      ctx,
      { x: tf.x, y: tf.y, w: tf.w, h: tf.h * 0.62 },
      bundle.headline,
      textStyle(ctx, Math.min(tf.w, tf.h) * 0.5, heavyWeight(ctx)),
      { bg: plateColor, fill: palette.text, minContrast: 4.5, align }
    );
    drawHeadline(
      ctx,
      { x: tf.x, y: tf.y + tf.h * 0.68, w: tf.w, h: tf.h * 0.3 },
      `${bundle.sub} \xB7 ${bundle.label}`,
      textStyle(ctx, Math.min(tf.w, tf.h) * 0.14, heavyWeight(ctx)),
      { bg: plateColor, fill: palette.text, minContrast: 4.5, align }
    );
  }
  registerComposition({ name: "frame-in-frame", weight: 2, render: render183 });

  // src/compositions/framedBorder.ts
  function render184(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx);
    const border = Math.min(ctx.width, ctx.height) * rng.range(0.06, 0.11);
    const frameTextured = rng.chance(0.5);
    if (frameTextured) {
      ctx.fillRegion(ctx.bounds());
    } else {
      block(ctx, ctx.bounds(), regionFill(ctx, rng));
    }
    const panel = inset(ctx.bounds(), border);
    const weight = heavyWeight(ctx);
    const bundle = textBundle(ctx);
    if (!bundle) {
      ctx.fillRegion(panel);
      const barH = panel.h * rng.range(0.12, 0.2);
      block(
        ctx,
        { x: panel.x, y: panel.y + panel.h * rng.range(0.28, 0.6), w: panel.w, h: barH },
        rng.chance(0.5) ? palette.primary : palette.accent
      );
      return;
    }
    const panelTextured = rng.chance(0.55);
    const fieldColor = rng.chance(0.5) ? palette.primary : palette.accent;
    if (panelTextured) ctx.fillRegion(panel);
    else block(ctx, panel, fieldColor);
    const m = Math.min(panel.w, panel.h) * 0.07;
    const bandColor = fieldColor === palette.primary ? palette.accent : palette.primary;
    const bandH = panel.h * rng.range(0.3, 0.4);
    const bandY = panel.y + panel.h * rng.range(0.18, 0.4);
    block(ctx, { x: panel.x, y: bandY, w: panel.w, h: bandH }, bandColor);
    const align = isRtl(ctx) ? "end" : rng.pick(["start", "middle"]);
    drawHeadline(
      ctx,
      { x: panel.x + m, y: bandY, w: panel.w - m * 2, h: bandH },
      bundle.headline,
      textStyle(ctx, bandH * 0.72, weight),
      { bg: bandColor, fill: palette.background, align, minContrast: 3, mode: "shrink" }
    );
    const subSize = Math.min(panel.w, panel.h) * 0.05;
    const chip = {
      x: panel.x + m,
      y: panel.y + panel.h - m - subSize * 1.9,
      w: panel.w - m * 2,
      h: subSize * 1.9
    };
    block(ctx, chip, fieldColor);
    drawHeadline(
      ctx,
      chip,
      `${bundle.sub} \xB7 ${bundle.label}`,
      textStyle(ctx, subSize, weight),
      { bg: fieldColor, fill: palette.background, align: "middle", minContrast: 3 }
    );
  }
  registerComposition({ name: "framed-border", weight: 2, render: render184 });

  // src/compositions/fullBleed.ts
  function render185(ctx) {
    const { rng, palette } = ctx;
    ctx.fillRegion(ctx.bounds());
    const bundle = textBundle(ctx);
    if (!bundle) return;
    const m = margin(ctx, 0.07);
    const align = isRtl(ctx) ? "end" : rng.pick(["start", "middle"]);
    const bandColor = rng.chance(0.5) ? palette.background : palette.primary;
    const y = ctx.height * rng.range(0.3, 0.6);
    drawHeadline(
      ctx,
      { x: m, y, w: ctx.width - m * 2, h: ctx.height * 0.16 },
      bundle.headline,
      textStyle(ctx, displaySize(ctx, rng.range(0.1, 0.16)), heavyWeight(ctx)),
      { mode: "bleed", backing: true, bg: bandColor, align }
    );
    drawHeadline(
      ctx,
      { x: m, y: y + ctx.height * 0.16, w: ctx.width - m * 2, h: ctx.height * 0.07 },
      `${bundle.sub} \xB7 ${bundle.label}`,
      textStyle(ctx, displaySize(ctx, 0.035), heavyWeight(ctx)),
      { mode: "bleed", backing: true, bg: bandColor, align }
    );
  }
  registerComposition({ name: "full-bleed", weight: 3, render: render185 });

  // src/compositions/giantQuote.ts
  function render186(ctx) {
    const { rng, palette } = ctx;
    const onColor = rng.chance(0.5);
    const ground = onColor ? regionFill(ctx, rng) : palette.background;
    fillBackground(ctx, ground);
    const fill = onColor ? palette.background : palette.text;
    const bundle = textBundle(ctx);
    if (!bundle) {
      const region = {
        x: 0,
        y: ctx.height * rng.range(0.3, 0.5),
        w: ctx.width,
        h: ctx.height * rng.range(0.4, 0.6)
      };
      ctx.fillRegion(region);
      const qs = Math.min(ctx.width, ctx.height) * 0.4;
      for (let i = 0; i < 2; i++) {
        block(
          ctx,
          { x: ctx.width * (0.08 + i * 0.16), y: ctx.height * 0.06, w: qs * 0.18, h: qs * 0.5 },
          i % 2 ? palette.accent : palette.primary
        );
      }
      return;
    }
    const rtl = isRtl(ctx);
    const anchor = rtl ? "end" : "start";
    const weight = heavyWeight(ctx);
    const m = margin(ctx, 0.06);
    const quoteSource = bundle.body.join(" ").trim() || `${bundle.headline} ${bundle.sub}`;
    const markSize = displaySize(ctx, rng.range(0.5, 0.75));
    const markColor = onColor ? palette.background : regionFill(ctx, rng);
    const markX = rtl ? ctx.width - m * 0.4 : m * 0.4;
    drawLine(
      ctx,
      markX,
      m + markSize * 0.78,
      "\u201C",
      textStyle(ctx, markSize, weight),
      { bg: ground, fill: markColor, anchor, minContrast: 1 }
    );
    const quoteTop = ctx.height * rng.range(0.28, 0.36);
    const quoteArea = inset(
      { x: 0, y: quoteTop, w: ctx.width, h: ctx.height - quoteTop - m },
      0,
      0
    );
    const textX = rtl ? ctx.width - m : m;
    const colW = ctx.width - m * 2;
    const lineCount = rng.int(3, 5);
    let size = quoteArea.h / (lineCount * 1.12);
    let style = textStyle(ctx, size, weight);
    let lines = wrapText(quoteSource, colW, style);
    if (lines.length <= 1) {
      size = fitSizeToWidth(quoteSource, colW, textStyle(ctx, ctx.height, weight), 12);
      style = textStyle(ctx, size, weight);
      lines = [quoteSource];
    } else {
      const fit = quoteArea.h / (lines.length * 1.1);
      size = Math.min(size, fit);
      style = textStyle(ctx, size, weight);
      lines = wrapText(quoteSource, colW, style);
    }
    const lineH = size * 1.06;
    let y = quoteArea.y + quoteArea.h - (lines.length - 1) * lineH - size * 0.1;
    for (const line of lines) {
      drawLine(ctx, textX, y, line, style, { bg: ground, fill, anchor, minContrast: 3 });
      y += lineH;
    }
    const attrStyle = textStyle(ctx, displaySize(ctx, 0.024), weight);
    const attr = `\u2014 ${bundle.sub}, ${bundle.label}`;
    const attrW = measureWidth(attr, attrStyle);
    const attrX = rtl ? m + attrW : ctx.width - m;
    drawLine(ctx, attrX, ctx.height - m * 0.55, attr, attrStyle, {
      bg: ground,
      fill,
      anchor: rtl ? "start" : "end"
    });
  }
  registerComposition({ name: "giant-quote", weight: 2, render: render186 });

  // src/compositions/goldenSpiral.ts
  function spiralSquares(r, steps) {
    const squares = [];
    let rect = r;
    for (let i = 0; i < steps; i++) {
      const horizontal = rect.w >= rect.h;
      const dir = i % 4;
      if (horizontal) {
        const s = rect.h;
        if (dir === 0) {
          squares.push({ x: rect.x, y: rect.y, w: s, h: s });
          rect = { x: rect.x + s, y: rect.y, w: rect.w - s, h: rect.h };
        } else {
          squares.push({ x: rect.x + rect.w - s, y: rect.y, w: s, h: s });
          rect = { x: rect.x, y: rect.y, w: rect.w - s, h: rect.h };
        }
      } else {
        const s = rect.w;
        if (dir === 1) {
          squares.push({ x: rect.x, y: rect.y, w: s, h: s });
          rect = { x: rect.x, y: rect.y + s, w: rect.w, h: rect.h - s };
        } else {
          squares.push({ x: rect.x, y: rect.y + rect.h - s, w: s, h: s });
          rect = { x: rect.x, y: rect.y, w: rect.w, h: rect.h - s };
        }
      }
    }
    return { squares, eye: rect };
  }
  function render187(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx);
    const landscape = ctx.width >= ctx.height;
    let base;
    if (landscape) {
      const h = ctx.height;
      const w = Math.min(ctx.width, h * GOLDEN);
      base = { x: (ctx.width - w) / 2, y: 0, w, h };
    } else {
      const w = ctx.width;
      const h = Math.min(ctx.height, w * GOLDEN);
      base = { x: 0, y: (ctx.height - h) / 2, w, h };
    }
    if (base.w < ctx.width || base.h < ctx.height) ctx.fillRegion(ctx.bounds());
    const { squares, eye } = spiralSquares(base, rng.int(5, 7));
    squares.forEach((sq, i) => {
      if (i < 2 || rng.chance(0.5)) {
        ctx.fillRegion(sq);
      } else {
        block(ctx, sq, regionFill(ctx, rng));
      }
    });
    const bundle = textBundle(ctx);
    if (!bundle) return;
    const panelW = Math.max(eye.w, Math.min(ctx.width, ctx.height) * 0.4);
    const panelH = Math.max(eye.h, Math.min(ctx.width, ctx.height) * 0.22);
    const panel = {
      x: Math.min(eye.x, ctx.width - panelW),
      y: Math.min(eye.y, ctx.height - panelH),
      w: panelW,
      h: panelH
    };
    block(ctx, panel, palette.background);
    const pad = Math.min(panel.w, panel.h) * 0.1;
    const inner = { x: panel.x + pad, y: panel.y + pad, w: panel.w - pad * 2, h: panel.h - pad * 2 };
    const align = isRtl(ctx) ? "end" : "start";
    drawHeadline(
      ctx,
      { x: inner.x, y: inner.y, w: inner.w, h: inner.h * 0.6 },
      bundle.headline,
      textStyle(ctx, displaySize(ctx, 0.055), heavyWeight(ctx)),
      { bg: palette.background, fill: palette.primary, align }
    );
    drawHeadline(
      ctx,
      { x: inner.x, y: inner.y + inner.h * 0.64, w: inner.w, h: inner.h * 0.32 },
      `${bundle.sub} \xB7 ${bundle.label}`,
      textStyle(ctx, displaySize(ctx, 0.026), heavyWeight(ctx)),
      { bg: palette.background, fill: palette.accent, align }
    );
  }
  registerComposition({ name: "golden-spiral", weight: 2, render: render187 });

  // src/compositions/horizontalBands.ts
  function unevenWeights(ctx, count) {
    const { rng } = ctx;
    const weights = [];
    for (let i = 0; i < count; i++) weights.push(rng.range(0.18, 0.5));
    const dom = rng.int(0, count - 1);
    weights[dom] = rng.range(3.5, 6.5);
    if (count >= 4 && rng.chance(0.6)) {
      let second = rng.int(0, count - 1);
      if (second === dom) second = (second + 1) % count;
      weights[second] = rng.range(1.4, 2.6);
    }
    return weights;
  }
  function render188(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx);
    const hasText = ctx.text.enabled;
    const count = rng.int(4, 7);
    const weights = unevenWeights(ctx, count);
    const total = weights.reduce((a, b) => a + b, 0);
    let domIdx = 0;
    for (let i = 1; i < count; i++) if (weights[i] > weights[domIdx]) domIdx = i;
    const bands = [];
    let y = 0;
    for (let i = 0; i < count; i++) {
      const h = weights[i] / total * ctx.height;
      const isDom = i === domIdx;
      const isThin = h < ctx.height * 0.12;
      let rect = { x: 0, y, w: ctx.width, h };
      if (isThin && !isDom && rng.chance(0.55)) {
        const w = ctx.width * rng.range(0.4, 0.82);
        const x = rng.chance(0.5) ? 0 : ctx.width - w;
        rect = { x, y, w, h };
      }
      const color = regionFill(ctx, rng);
      const textured = isDom ? hasText ? rng.chance(0.4) : true : rng.chance(hasText ? 0.7 : 0.85);
      if (textured) {
        ctx.fillRegion(rect);
      } else {
        block(ctx, rect, color);
      }
      bands.push({ rect, color, textured });
      y += h;
    }
    const bundle = textBundle(ctx);
    if (!bundle) {
      const d = bands[domIdx];
      const ry = d.rect.y + d.rect.h * rng.range(0.3, 0.7);
      block(
        ctx,
        { x: -2, y: ry, w: ctx.width + 4, h: ctx.height * rng.range(0.012, 0.03) },
        rng.chance(0.5) ? palette.accent : palette.primary
      );
      return;
    }
    const rtl = isRtl(ctx);
    const align = rtl ? "end" : rng.pick(["start", "middle"]);
    const m = margin(ctx, 0.05);
    const dom = bands[domIdx];
    if (dom.textured) {
      drawHeadline(
        ctx,
        { x: m, y: dom.rect.y, w: ctx.width - m * 2, h: dom.rect.h },
        bundle.headline,
        textStyle(ctx, displaySize(ctx, rng.range(0.18, 0.28)), heavyWeight(ctx)),
        { mode: "bleed", backing: true, bg: palette.primary, align }
      );
    } else {
      drawHeadline(
        ctx,
        { x: m, y: dom.rect.y, w: ctx.width - m * 2, h: dom.rect.h },
        bundle.headline,
        textStyle(ctx, displaySize(ctx, rng.range(0.16, 0.24)), heavyWeight(ctx)),
        { bg: dom.color, fill: palette.background, minContrast: 4.5, align }
      );
    }
    const subSize = displaySize(ctx, 0.022);
    const subStyle = textStyle(ctx, subSize, heavyWeight(ctx));
    const subText = `${bundle.sub} \xB7 ${bundle.label}`;
    const subBg = dom.textured ? palette.primary : dom.color;
    const subFill = dom.textured ? palette.background : palette.background;
    const subY = dom.rect.y + dom.rect.h - subSize * 0.6;
    if (dom.textured) {
      const sw = measureWidth(subText, subStyle);
      const pad = subSize * 0.4;
      const sx = rtl ? ctx.width - m - sw : m;
      block(
        ctx,
        { x: sx - pad, y: subY - subSize, w: sw + pad * 2, h: subSize * 1.5 },
        palette.primary
      );
    }
    drawLine(
      ctx,
      rtl ? ctx.width - m : m,
      subY,
      subText,
      subStyle,
      { bg: subBg, fill: subFill, minContrast: 4.5, anchor: rtl ? "end" : "start" }
    );
    const second = bands.map((b, i) => ({ b, i })).filter((o) => o.i !== domIdx && !o.b.textured && o.b.rect.h > ctx.height * 0.1).sort((a, c) => c.b.rect.h - a.b.rect.h)[0];
    if (second) {
      const text = bundle.english ?? bundle.body[0] ?? bundle.sub;
      drawHeadline(
        ctx,
        { x: second.b.rect.x + m, y: second.b.rect.y, w: second.b.rect.w - m * 2, h: second.b.rect.h },
        text,
        textStyle(ctx, displaySize(ctx, rng.range(0.05, 0.09)), heavyWeight(ctx)),
        { bg: second.b.color, fill: palette.background, minContrast: 4.5, align: rtl ? "end" : "start" }
      );
    }
  }
  registerComposition({ name: "horizontal-bands", weight: 2, render: render188 });

  // src/compositions/isometricStack.ts
  function poly(pts) {
    return pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  }
  function render189(ctx) {
    const { rng, palette } = ctx;
    const { width: W, height: H } = ctx;
    const bgIsDark = rng.chance(0.5);
    const bg = bgIsDark ? palette.primary : palette.background;
    fillBackground(ctx, bg);
    const tall = H >= W;
    const cubeW = tall ? W * rng.range(0.32, 0.46) : Math.min(W, H) * rng.range(0.32, 0.44);
    const depth = cubeW * 0.5;
    const cubeH = cubeW * rng.range(0.34, 0.5);
    const count = rng.int(3, tall ? 6 : 4);
    const fromLeft = rng.chance(0.5);
    const baseX = fromLeft ? W * rng.range(-0.04, 0.12) : W * rng.range(0.5, 0.66);
    const baseY = H * rng.range(0.78, 0.96);
    const topFill = regionFill(ctx, rng);
    const sideFill = bgIsDark ? palette.background : palette.primary;
    const stack = ctx.group();
    for (let i = 0; i < count; i++) {
      const fx = baseX + (fromLeft ? 0 : 0);
      const fy = baseY - i * cubeH - i * 0;
      const frontTopY = fy - cubeH;
      const front = { x: fx, y: frontTopY, w: cubeW, h: cubeH };
      ctx.fillRegion(front, stack);
      const topPts = [
        [fx, frontTopY],
        [fx + depth, frontTopY - depth],
        [fx + cubeW + depth, frontTopY - depth],
        [fx + cubeW, frontTopY]
      ];
      stack.appendChild(
        ctx.el("polygon", {
          points: poly(topPts),
          fill: i % 2 ? topFill : palette.accent
        })
      );
      const sideX = fx + cubeW;
      const sidePts = [
        [sideX, frontTopY],
        [sideX + depth, frontTopY - depth],
        [sideX + depth, frontTopY - depth + cubeH],
        [sideX, frontTopY + cubeH]
      ];
      stack.appendChild(
        ctx.el("polygon", { points: poly(sidePts), fill: sideFill })
      );
      const edge = bgIsDark ? palette.background : palette.primary;
      stack.appendChild(
        ctx.el("rect", {
          x: front.x,
          y: front.y,
          width: front.w,
          height: front.h,
          fill: "none",
          stroke: edge,
          "stroke-width": Math.max(1.5, cubeW * 0.012)
        })
      );
    }
    const bundle = textBundle(ctx);
    if (!bundle) return;
    const rtl = isRtl(ctx);
    const bandColor = rng.chance(0.5) ? palette.accent : sideFill;
    const headSize = displaySize(ctx, rng.range(0.18, 0.28));
    const headY = fromLeft ? H * rng.range(0.1, 0.24) : H * rng.range(0.62, 0.8);
    drawHeadline(
      ctx,
      { x: -W * 0.05, y: headY, w: W * 1.1, h: headSize * 1.3 },
      bundle.headline,
      textStyle(ctx, headSize, heavyWeight(ctx)),
      { mode: "bleed", backing: true, bg: bandColor, align: rtl ? "end" : "start" }
    );
    const m = margin(ctx, 0.05);
    const labelSize = displaySize(ctx, 0.03);
    const lx = fromLeft ? W - m : m;
    const cy = H * 0.5;
    const lg = ctx.group();
    lg.setAttribute("transform", `rotate(${fromLeft ? -90 : 90} ${lx} ${cy})`);
    drawLine(ctx, lx, cy, `${bundle.label} \xB7 ${bundle.sub}`, textStyle(ctx, labelSize, heavyWeight(ctx)), {
      bg,
      fill: palette.text,
      minContrast: 4.5,
      anchor: "middle",
      parent: lg
    });
  }
  registerComposition({ name: "isometric-stack", weight: 2, render: render189 });

  // src/compositions/magazineCover.ts
  function render190(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx);
    const rtl = isRtl(ctx);
    const align = rtl ? "end" : "start";
    const [masthead, lower] = splitY(ctx.bounds(), rng.range(0.14, 0.2));
    ctx.fillRegion(lower);
    const bundle = textBundle(ctx);
    if (!bundle) {
      block(ctx, masthead, palette.accent);
      return;
    }
    block(ctx, masthead, palette.primary);
    const mPad = masthead.h * 0.18;
    drawHeadline(
      ctx,
      inset(masthead, mPad),
      bundle.headline,
      textStyle(ctx, masthead.h * 0.7, heavyWeight(ctx)),
      { bg: palette.primary, fill: palette.background, align: "middle" }
    );
    const m = margin(ctx, 0.05);
    const colW = lower.w * rng.range(0.34, 0.46);
    const colX = rtl ? lower.x + lower.w - m - colW : lower.x + m;
    const lines = [bundle.sub, ...bundle.body].slice(0, 4);
    let y = lower.y + m;
    const lineH = lower.h * 0.13;
    for (const line of lines) {
      const lh = lineH * rng.range(0.85, 1);
      const lw = colW * rng.range(0.7, 1);
      const lx = rtl ? colX + colW - lw : colX;
      block(ctx, { x: lx, y, w: lw, h: lh }, palette.background);
      drawHeadline(
        ctx,
        inset({ x: lx, y, w: lw, h: lh }, lh * 0.16),
        line,
        textStyle(ctx, lh * 0.5, heavyWeight(ctx)),
        { bg: palette.background, fill: palette.primary, align }
      );
      y += lh + m * 0.5;
    }
    const labelH = lower.h * 0.09;
    const footer = { x: lower.x, y: lower.y + lower.h - labelH, w: lower.w, h: labelH };
    block(ctx, footer, palette.accent);
    drawHeadline(
      ctx,
      inset(footer, m * 0.5, labelH * 0.18),
      `${bundle.label} \xB7 ${bundle.english ?? bundle.sub}`,
      textStyle(ctx, labelH * 0.45, heavyWeight(ctx)),
      { bg: palette.accent, fill: palette.background, align }
    );
  }
  registerComposition({ name: "magazine-cover", weight: 2, render: render190 });

  // src/compositions/manuscriptBlock.ts
  function render191(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx);
    const rtl = isRtl(ctx);
    const tall = ctx.height > ctx.width * 1.15;
    const sideFrac = rng.range(0.3, 0.42);
    const full = { x: 0, y: 0, w: ctx.width, h: ctx.height };
    let spine;
    let typeField;
    if (tall) {
      const [topSlab, body] = splitY(full, rng.range(0.3, 0.42));
      spine = topSlab;
      typeField = body;
    } else {
      const [left, right] = splitX(full, sideFrac);
      if (rtl) {
        spine = right;
        typeField = left;
      } else {
        spine = left;
        typeField = right;
      }
    }
    ctx.fillRegion(spine);
    const footColor = rng.chance(0.5) ? palette.primary : palette.accent;
    const bundle = textBundle(ctx);
    if (!bundle) {
      block(ctx, typeField, palette.primary);
      const barH = Math.min(typeField.w, typeField.h) * rng.range(0.12, 0.22);
      const cx = typeField.x + typeField.w / 2;
      const cy = typeField.y + typeField.h * rng.range(0.4, 0.7);
      const g = ctx.group();
      g.setAttribute("transform", `rotate(${rng.range(-18, 18)} ${cx} ${cy})`);
      block(
        ctx,
        { x: typeField.x - typeField.w, y: cy - barH / 2, w: typeField.w * 3, h: barH },
        palette.accent,
        g
      );
      return;
    }
    const weight = heavyWeight(ctx);
    const anchor = rtl ? "end" : "start";
    const pad = Math.min(ctx.width, ctx.height) * 0.05;
    const tf = {
      x: typeField.x + pad,
      y: typeField.y + pad,
      w: typeField.w - pad * 2,
      h: typeField.h - pad * 2
    };
    const initial = Array.from(bundle.headline.replace(/\s+/g, ""))[0] ?? bundle.headline[0];
    const restHeadline = bundle.headline.slice(initial.length).trim() || bundle.headline;
    const initSize = Math.min(tf.h * 0.46, tf.w * 0.55);
    const initBoxW = initSize * 0.92;
    const initBoxH = initSize * 0.92;
    const initBoxX = rtl ? tf.x + tf.w - initBoxW : tf.x;
    const initBoxY = tf.y;
    block(ctx, { x: initBoxX, y: initBoxY, w: initBoxW, h: initBoxH }, footColor);
    drawHeadline(
      ctx,
      { x: initBoxX, y: initBoxY, w: initBoxW, h: initBoxH },
      initial,
      textStyle(ctx, initSize, weight),
      { bg: footColor, fill: palette.background, align: "middle" }
    );
    const restWords = restHeadline.split(/\s+/).filter(Boolean);
    const restLines = restWords.length >= 2 ? restWords : [restHeadline];
    const restTop = initBoxY + initBoxH * 0.18;
    const restX = rtl ? tf.x + tf.w - initBoxW - pad : initBoxX + initBoxW + pad * 0.6;
    const restW = rtl ? restX - tf.x : tf.x + tf.w - restX;
    const lineH = initBoxH * 0.82 / restLines.length;
    const restStyle = textStyle(ctx, lineH * 0.86, weight);
    restLines.forEach((line, i) => {
      const y = restTop + lineH * (i + 0.5);
      drawLine(ctx, restX, y + restStyle.size * 0.3, line, restStyle, {
        bg: palette.background,
        fill: palette.text,
        anchor,
        minContrast: 3
      });
    });
    const ruleY = initBoxY + initBoxH + pad * 0.6;
    const ruleH = Math.max(4, ctx.height * 0.012);
    block(ctx, { x: tf.x, y: ruleY, w: tf.w, h: ruleH }, palette.accent);
    drawHeadline(
      ctx,
      { x: tf.x, y: ruleY + ruleH + pad * 0.3, w: tf.w, h: tf.h * 0.08 },
      bundle.sub,
      textStyle(ctx, displaySize(ctx, 0.034), weight),
      { bg: palette.background, fill: palette.primary, align: anchor }
    );
    const bodyY = ruleY + ruleH + pad * 0.3 + tf.h * 0.1;
    const bodyW = tf.w * rng.range(0.6, 0.78);
    const bodyX = rtl ? tf.x + tf.w - bodyW : tf.x;
    const bodyH = tf.y + tf.h - bodyY - tf.h * 0.06;
    if (bodyH > tf.h * 0.1) {
      drawParagraph(
        ctx,
        { x: bodyX, y: bodyY, w: bodyW, h: bodyH },
        bundle.body.join("  "),
        textStyle(ctx, displaySize(ctx, 0.021)),
        { bg: palette.background, fill: palette.text, anchor, lineHeight: 1.45 }
      );
    }
    const fh = tall ? spine.h * 0.26 : spine.h * 0.12;
    const footRect = { x: spine.x, y: spine.y + spine.h - fh, w: spine.w, h: fh };
    block(ctx, footRect, footColor);
    drawHeadline(
      ctx,
      { x: footRect.x + pad * 0.5, y: footRect.y, w: footRect.w - pad, h: footRect.h },
      bundle.label,
      textStyle(ctx, displaySize(ctx, 0.03), weight),
      { bg: footColor, fill: palette.background, align: "middle" }
    );
  }
  registerComposition({ name: "manuscript-block", weight: 2, render: render191 });

  // src/compositions/marqueeStack.ts
  function repeatToWidth(text, sep, width, style) {
    const unit = text + sep;
    const unitW = Math.max(1, measureWidth(unit, style));
    const times = Math.ceil(width / unitW) + 1;
    return new Array(times).fill(text).join(sep);
  }
  function render192(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx);
    const bundle = textBundle(ctx);
    const weight = heavyWeight(ctx);
    if (!bundle) {
      const n = rng.int(4, 7);
      let y2 = 0;
      for (let i = 0; i < n; i++) {
        const h = ctx.height * (i === rng.int(0, n - 1) ? rng.range(0.28, 0.4) : rng.range(0.07, 0.16));
        const band2 = { x: 0, y: y2, w: ctx.width, h: Math.min(h, ctx.height - y2) };
        if (rng.chance(0.6)) ctx.fillRegion(band2);
        else block(ctx, band2, i % 2 ? regionFill(ctx, rng) : palette.background);
        y2 += band2.h;
        if (y2 >= ctx.height) break;
      }
      return;
    }
    const rtl = isRtl(ctx);
    const sep = "  /  ";
    const heroFrac = rng.range(0.34, 0.46);
    const heroIndex = rng.int(1, 3);
    const supportCount = rng.int(4, 6);
    const supportFrac = (1 - heroFrac) / supportCount;
    const repeated = [bundle.sub, bundle.label, bundle.english ?? bundle.body[0] ?? bundle.sub, bundle.body[1] ?? bundle.label];
    let y = 0;
    let supportSeen = 0;
    const totalBands = supportCount + 1;
    for (let i = 0; i < totalBands; i++) {
      const isHero = i === heroIndex;
      const h = (isHero ? heroFrac : supportFrac) * ctx.height;
      const band2 = { x: 0, y, w: ctx.width, h };
      y += h;
      if (isHero) {
        const heroBg = rng.chance(0.5) ? palette.primary : palette.accent;
        block(ctx, band2, heroBg);
        drawHeadline(
          ctx,
          { x: ctx.width * 0.03, y: band2.y, w: ctx.width * 0.94, h: band2.h },
          bundle.headline,
          textStyle(ctx, band2.h * rng.range(0.78, 0.98), weight),
          { mode: "bleed", bg: heroBg, fill: palette.background, align: rng.pick(["start", "middle", "end"]) }
        );
        continue;
      }
      const textured = rng.chance(0.4);
      if (textured) {
        ctx.fillRegion(band2);
        const stripH = band2.h * 0.6;
        const strip = { x: 0, y: band2.y + (band2.h - stripH) / 2, w: ctx.width, h: stripH };
        const stripBg = palette.background;
        block(ctx, strip, stripBg);
        const style = textStyle(ctx, strip.h * 0.62, weight);
        const phrase = repeated[supportSeen % repeated.length];
        const line = repeatToWidth(phrase, sep, ctx.width * 1.2, style);
        drawHeadline(ctx, { x: -ctx.width * 0.05, y: strip.y, w: ctx.width * 1.1, h: strip.h }, line, style, {
          mode: "bleed",
          bg: stripBg,
          fill: palette.primary,
          align: rtl ? "end" : "start"
        });
      } else {
        const bandBg = supportSeen % 2 ? palette.background : regionFill(ctx, rng);
        block(ctx, band2, bandBg);
        const style = textStyle(ctx, band2.h * rng.range(0.5, 0.66), weight);
        const phrase = repeated[supportSeen % repeated.length];
        const line = repeatToWidth(phrase, sep, ctx.width * 1.2, style);
        drawHeadline(ctx, { x: -ctx.width * 0.05, y: band2.y, w: ctx.width * 1.1, h: band2.h }, line, style, {
          mode: "bleed",
          bg: bandBg,
          fill: bandBg === palette.background ? palette.primary : palette.background,
          align: rtl ? "end" : "start"
        });
      }
      supportSeen++;
    }
  }
  registerComposition({ name: "marquee-stack", weight: 2, render: render192 });

  // src/compositions/masthead.ts
  function render193(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx);
    const rtl = isRtl(ctx);
    const heavy = heavyWeight(ctx);
    const bandColor = rng.chance(0.55) ? palette.primary : palette.text;
    const bundle = textBundle(ctx);
    if (!bundle) {
      const headH2 = ctx.height * rng.range(0.26, 0.36);
      ctx.fillRegion({ x: 0, y: 0, w: ctx.width, h: headH2 });
      block(ctx, { x: 0, y: headH2, w: ctx.width, h: ctx.height * 0.02 }, palette.accent);
      ctx.fillRegion({ x: 0, y: headH2 + ctx.height * 0.02, w: ctx.width, h: ctx.height - headH2 });
      return;
    }
    const headH = ctx.height * rng.range(0.24, 0.32);
    block(ctx, { x: 0, y: 0, w: ctx.width, h: headH }, bandColor);
    drawHeadline(
      ctx,
      { x: 0, y: headH * 0.5 - headH * 0.18, w: ctx.width, h: headH * 0.64 },
      bundle.headline,
      textStyle(ctx, headH * 0.9, heavy),
      { mode: "bleed", backing: false, bg: bandColor, fill: palette.background, align: "middle" }
    );
    const stripY = headH * 0.86;
    const m = margin(ctx, 0.045);
    drawLine(
      ctx,
      rtl ? ctx.width - m : m,
      stripY,
      bundle.label,
      textStyle(ctx, displaySize(ctx, 0.022), heavy),
      { bg: bandColor, fill: palette.background, anchor: rtl ? "end" : "start" }
    );
    drawLine(
      ctx,
      rtl ? m : ctx.width - m,
      stripY,
      bundle.sub,
      textStyle(ctx, displaySize(ctx, 0.022), heavy),
      { bg: bandColor, fill: palette.background, anchor: rtl ? "start" : "end" }
    );
    block(ctx, { x: 0, y: headH, w: ctx.width, h: ctx.height * 0.012 }, palette.accent);
    const bodyTop = headH + ctx.height * 0.012;
    const body = { x: 0, y: bodyTop, w: ctx.width, h: ctx.height - bodyTop };
    const inner = inset(body, m, m * 0.7);
    const landscape = ctx.width >= ctx.height;
    const nCols = landscape ? rng.int(3, 4) : rng.int(2, 3);
    const gap = inner.w * 0.03;
    const cols = columns(inner, nCols, gap);
    const texCol = rng.chance(0.5) ? 0 : nCols - 1;
    const subhead = bundle.english ?? bundle.sub;
    cols.forEach((col, i) => {
      if (i === texCol) {
        ctx.fillRegion(col);
        const chipH = col.h * 0.16;
        const chip = { x: col.x, y: col.y + col.h - chipH, w: col.w, h: chipH };
        block(ctx, chip, palette.accent);
        drawHeadline(
          ctx,
          inset(chip, col.w * 0.08, chipH * 0.18),
          bundle.label,
          textStyle(ctx, chipH * 0.4, heavy),
          { bg: palette.accent, fill: palette.background, align: rtl ? "end" : "start" }
        );
        return;
      }
      let y = col.y;
      if (i === (texCol === 0 ? 1 : 0)) {
        const shH = col.h * 0.22;
        drawHeadline(
          ctx,
          { x: col.x, y, w: col.w, h: shH * 0.6 },
          subhead,
          textStyle(ctx, displaySize(ctx, 0.04), heavy),
          { bg: palette.background, fill: palette.primary, align: rtl ? "end" : "start" }
        );
        y += shH;
        block(ctx, { x: col.x, y: y - shH * 0.18, w: col.w, h: ctx.height * 6e-3 }, palette.text);
      }
      const copy = bundle.body.concat(bundle.body).join("  ");
      drawParagraph(
        ctx,
        { x: col.x, y, w: col.w, h: col.y + col.h - y },
        copy,
        textStyle(ctx, displaySize(ctx, 0.016)),
        { bg: palette.background, fill: palette.text, anchor: rtl ? "end" : "start", lineHeight: 1.35 }
      );
    });
  }
  registerComposition({ name: "masthead", weight: 2, render: render193 });

  // src/compositions/megaNumeral.ts
  function pickGlyph(ctx, label) {
    const digits2 = label ? label.replace(/[^0-9]/g, "") : "";
    if (digits2.length >= 1) {
      if (digits2.length >= 2 && ctx.rng.chance(0.5)) {
        const i = ctx.rng.int(0, digits2.length - 2);
        return digits2.slice(i, i + 2);
      }
      return digits2[ctx.rng.int(0, digits2.length - 1)];
    }
    return String(ctx.rng.int(0, 9));
  }
  function render194(ctx) {
    const { rng, palette } = ctx;
    const bundle = textBundle(ctx);
    const fieldColor = regionFill(ctx, rng);
    const bgColor = rng.chance(0.55) ? palette.background : fieldColor;
    fillBackground(ctx, bgColor);
    const bandFromLeft = rng.chance(0.5);
    const bandFrac = rng.range(0.45, 0.7);
    const bandW = ctx.width * bandFrac;
    const bandX = bandFromLeft ? 0 : ctx.width - bandW;
    ctx.fillRegion({ x: bandX, y: 0, w: bandW, h: ctx.height });
    const glyph = pickGlyph(ctx, bundle ? bundle.label : null);
    const weight = heavyWeight(ctx);
    const probe = textStyle(ctx, ctx.height, weight);
    const targetH = ctx.height * rng.range(1.02, 1.22);
    const byWidth = fitSizeToWidth(glyph, ctx.width * rng.range(0.95, 1.3), probe);
    const size = Math.min(targetH, byWidth);
    const glyphStyle = textStyle(ctx, size, weight);
    const glyphW = measureWidth(glyph, glyphStyle);
    const overhang = size * rng.range(0.04, 0.16);
    const glyphX = bandFromLeft ? ctx.width - overhang : overhang;
    const anchor = bandFromLeft ? "end" : "start";
    const glyphY = ctx.height * 0.5 + size * 0.36;
    const plateColor = rng.chance(0.5) ? fieldColor : palette.primary;
    const plateW = glyphW + size * 0.3;
    const plateX = anchor === "end" ? glyphX - plateW + overhang * 0.5 : glyphX - overhang * 0.5;
    block(
      ctx,
      { x: plateX, y: 0, w: plateW, h: ctx.height },
      plateColor
    );
    const glyphFill = rng.chance(0.5) ? palette.background : palette.accent;
    drawLine(ctx, glyphX, glyphY, glyph, glyphStyle, {
      bg: plateColor,
      fill: glyphFill,
      minContrast: 3,
      anchor
    });
    if (!bundle) return;
    const rtl = isRtl(ctx);
    const m = margin(ctx, 0.05);
    const cornerTop = rng.chance(0.5);
    const tx = rtl ? ctx.width - m : m;
    const tAnchor = rtl ? "end" : "start";
    const small = displaySize(ctx, 0.03);
    const lineH = small * 1.35;
    const lines = [bundle.headline, bundle.sub, bundle.label].filter(Boolean);
    let ty = cornerTop ? m + small : ctx.height - m - lineH * (lines.length - 1);
    lines.forEach((line, i) => {
      const s = textStyle(ctx, i === 0 ? small * 1.15 : small * 0.8, i === 0 ? weight : 400);
      drawLine(ctx, tx, ty, line, s, { bg: bgColor, fill: palette.text, anchor: tAnchor });
      ty += lineH;
    });
  }
  registerComposition({ name: "mega-numeral", weight: 3, render: render194 });

  // src/compositions/modularGrid.ts
  function render195(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx);
    const landscape = ctx.width >= ctx.height;
    const cols = landscape ? rng.int(4, 6) : rng.int(3, 4);
    const rowCount = landscape ? rng.int(3, 4) : rng.int(4, 6);
    const gap = Math.min(ctx.width, ctx.height) * rng.range(8e-3, 0.02);
    const cells = gridCells(ctx.bounds(), cols, rowCount, gap);
    const bundle = textBundle(ctx);
    let textPanel = null;
    const skip = /* @__PURE__ */ new Set();
    if (bundle) {
      const spanCols = Math.min(cols, rng.int(2, 3));
      const spanRows = Math.min(rowCount, rng.int(1, 2));
      const startCol = rng.int(0, cols - spanCols);
      const startRow = rng.int(0, rowCount - spanRows);
      const tl = cells[startRow * cols + startCol];
      const br = cells[(startRow + spanRows - 1) * cols + (startCol + spanCols - 1)];
      textPanel = { x: tl.x, y: tl.y, w: br.x + br.w - tl.x, h: br.y + br.h - tl.y };
      for (let r = startRow; r < startRow + spanRows; r++) {
        for (let c = startCol; c < startCol + spanCols; c++) skip.add(r * cols + c);
      }
    }
    cells.forEach((cell, i) => {
      if (skip.has(i)) return;
      if (rng.chance(0.55)) {
        ctx.fillRegion(cell);
      } else {
        block(ctx, cell, regionFill(ctx, rng));
      }
    });
    if (!bundle || !textPanel) return;
    block(ctx, textPanel, palette.background);
    const pad = Math.min(textPanel.w, textPanel.h) * 0.1;
    const inner = {
      x: textPanel.x + pad,
      y: textPanel.y + pad,
      w: textPanel.w - pad * 2,
      h: textPanel.h - pad * 2
    };
    const align = isRtl(ctx) ? "end" : "start";
    drawHeadline(
      ctx,
      { x: inner.x, y: inner.y, w: inner.w, h: inner.h * 0.6 },
      bundle.headline,
      textStyle(ctx, displaySize(ctx, 0.06), heavyWeight(ctx)),
      { bg: palette.background, fill: palette.primary, align }
    );
    drawParagraph(
      ctx,
      { x: inner.x, y: inner.y + inner.h * 0.62, w: inner.w, h: inner.h * 0.38 },
      `${bundle.sub} \xB7 ${bundle.label}`,
      textStyle(ctx, displaySize(ctx, 0.022)),
      { bg: palette.background, fill: palette.text, anchor: align }
    );
  }
  registerComposition({ name: "modular-grid", weight: 2, render: render195 });

  // src/compositions/museumAiry.ts
  function render196(ctx) {
    const { rng, palette } = ctx;
    const bg = palette.background;
    fillBackground(ctx, bg);
    const rtl = isRtl(ctx);
    const startAlign = rtl ? "end" : "start";
    const m = margin(ctx, 0.06);
    const weight = heavyWeight(ctx);
    const bundle = textBundle(ctx);
    if (!bundle) {
      const full2 = ctx.bounds();
      const vertical = ctx.width >= ctx.height;
      const t2 = rng.range(0.62, 0.78);
      const [a, b] = vertical ? splitX(full2, t2) : splitY(full2, t2);
      const field = rng.chance(0.5) ? a : b;
      ctx.fillRegion(field);
      const empty = field === a ? b : a;
      const barThick = Math.min(ctx.width, ctx.height) * rng.range(0.06, 0.1);
      if (vertical) {
        const by = empty.y + empty.h * rng.range(0.3, 0.6);
        block(ctx, { x: empty.x, y: by, w: empty.w, h: barThick }, palette.accent);
      } else {
        const bx = empty.x + empty.w * rng.range(0.3, 0.6);
        block(ctx, { x: bx, y: empty.y, w: barThick, h: empty.h }, palette.accent);
      }
      return;
    }
    const numeral = String(rng.int(1, 9));
    const headlineLed = rng.chance(0.6);
    if (headlineLed) {
      const fieldFrac = rng.range(0.28, 0.42);
      const fieldOnRight = rtl ? rng.chance(0.35) : rng.chance(0.65);
      const fieldW = ctx.width * fieldFrac;
      const fieldRect2 = {
        x: fieldOnRight ? ctx.width - fieldW : 0,
        y: 0,
        w: fieldW,
        h: ctx.height
      };
      ctx.fillRegion(fieldRect2);
      const words = bundle.headline.split(/\s+/).filter(Boolean);
      const lines = words.length >= 2 ? words : [bundle.headline];
      const lineH = (ctx.height - m * 2) / (lines.length + 0.3);
      const flushRight = !fieldOnRight;
      const align2 = flushRight ? "end" : "start";
      lines.forEach((line, i) => {
        const probe = textStyle(ctx, ctx.height, weight);
        const target = ctx.width * rng.range(1.05, 1.28);
        const size = Math.min(lineH * 1.18, fitSizeToWidth(line, target, probe, 8));
        const style = textStyle(ctx, size, weight);
        const y = m + lineH * (i + 0.85);
        const rect = { x: m, y: y - lineH, w: ctx.width - m * 2, h: lineH };
        drawHeadline(ctx, rect, line, style, {
          mode: "bleed",
          backing: true,
          bg,
          fill: palette.primary,
          align: align2,
          minContrast: 3
        });
      });
      const barY = ctx.height * rng.range(0.06, 0.16);
      const barH = Math.min(ctx.width, ctx.height) * rng.range(0.02, 0.035);
      block(ctx, { x: -10, y: barY, w: ctx.width + 20, h: barH }, palette.accent);
      const labelY = ctx.height - m;
      const labelStyle2 = textStyle(ctx, displaySize(ctx, 0.024), weight);
      const labelText = `${bundle.sub} \xB7 ${bundle.label}`;
      if (flushRight) {
        const w = measureWidth(labelText, labelStyle2);
        drawLine(ctx, ctx.width - m - w, labelY, labelText, labelStyle2, {
          bg,
          fill: palette.text,
          anchor: "start"
        });
      } else {
        drawLine(ctx, m, labelY, labelText, labelStyle2, {
          bg,
          fill: palette.text,
          anchor: "start"
        });
      }
      return;
    }
    const full = ctx.bounds();
    const t = rng.chance(0.5) ? 1 / GOLDEN : rng.range(0.55, 0.7);
    const [left, right] = splitX(full, t);
    const big = left.w >= right.w ? left : right;
    const small = big === left ? right : left;
    const fieldRect = big;
    ctx.fillRegion(fieldRect);
    const numChip = {
      x: fieldRect.x + fieldRect.w * 0.06,
      y: fieldRect.y + fieldRect.h * (rng.chance(0.5) ? 0.06 : 0.62),
      w: fieldRect.w * 0.5,
      h: fieldRect.h * 0.32
    };
    block(ctx, numChip, palette.primary);
    drawHeadline(
      ctx,
      numChip,
      numeral,
      textStyle(ctx, displaySize(ctx, 0.5), weight),
      { bg: palette.primary, fill: palette.background, align: "middle", mode: "shrink" }
    );
    const tf = { x: small.x + m, y: m, w: small.w - m * 2, h: ctx.height - m * 2 };
    const align = rtl ? "end" : "start";
    const headWords = bundle.headline.split(/\s+/).filter(Boolean);
    const headLines = headWords.length >= 2 ? headWords : [bundle.headline];
    const hLineH = tf.h * 0.7 / (headLines.length + 0.3);
    headLines.forEach((line, i) => {
      const size = Math.min(
        hLineH * 1.1,
        fitSizeToWidth(line, tf.w, textStyle(ctx, ctx.height, weight), 8)
      );
      const style = textStyle(ctx, size, weight);
      const rect = { x: tf.x, y: tf.y + hLineH * i, w: tf.w, h: hLineH };
      drawHeadline(ctx, rect, line, style, {
        bg,
        fill: palette.primary,
        align,
        mode: "shrink"
      });
    });
    const labelStyle = textStyle(ctx, displaySize(ctx, 0.026), weight);
    drawHeadline(
      ctx,
      { x: tf.x, y: ctx.height - m - ctx.height * 0.08, w: tf.w, h: ctx.height * 0.05 },
      bundle.sub,
      labelStyle,
      { bg, fill: palette.accent, align, mode: "shrink" }
    );
    drawHeadline(
      ctx,
      { x: tf.x, y: ctx.height - m - ctx.height * 0.03, w: tf.w, h: ctx.height * 0.03 },
      bundle.label,
      textStyle(ctx, displaySize(ctx, 0.02), weight),
      { bg, fill: palette.text, align, mode: "shrink" }
    );
  }
  registerComposition({ name: "museum-airy", weight: 2, render: render196 });

  // src/compositions/overprint.ts
  function render197(ctx) {
    const { rng, palette } = ctx;
    const { width: W, height: H } = ctx;
    fillBackground(ctx, palette.background);
    const inkA = palette.primary;
    const inkB = palette.accent;
    const off = Math.min(W, H) * rng.range(0.012, 0.03);
    const dir = rng.pick([
      { x: 1, y: 1 },
      { x: -1, y: 1 },
      { x: 1, y: -1 },
      { x: -1, y: -1 }
    ]);
    const rw = W * rng.range(0.62, 0.82);
    const rh = H * rng.range(0.62, 0.82);
    const rx = rng.range(0, W - rw);
    const ry = rng.range(0, H - rh);
    const region = { x: rx, y: ry, w: rw, h: rh };
    const plate = ctx.group();
    block(ctx, region, inkA, plate);
    ctx.fillRegion(region, plate);
    const plate2 = ctx.group();
    plate2.setAttribute("transform", `translate(${(off * dir.x).toFixed(2)} ${(off * dir.y).toFixed(2)})`);
    plate2.setAttribute("opacity", "0.55");
    const tint = ctx.el("rect", { x: region.x, y: region.y, width: region.w, height: region.h, fill: inkB });
    plate2.appendChild(tint);
    ctx.fillRegion(region, plate2);
    const bundle = textBundle(ctx);
    if (!bundle) {
      const barH = H * rng.range(0.1, 0.18);
      const by = H * rng.range(0.4, 0.7);
      block(ctx, { x: -off, y: by, w: W + off * 2, h: barH }, inkA);
      const g = ctx.group();
      g.setAttribute("transform", `translate(${(-off * dir.x * 2).toFixed(2)} ${(-off * dir.y * 2).toFixed(2)})`);
      g.setAttribute("opacity", "0.6");
      block(ctx, { x: -off, y: by, w: W + off * 2, h: barH }, inkB, g);
      return;
    }
    const rtl = isRtl(ctx);
    const align = rtl ? "end" : rng.pick(["start", "middle"]);
    const m = margin(ctx, 0.04);
    const headStyle = textStyle(ctx, displaySize(ctx, rng.range(0.18, 0.26)), heavyWeight(ctx));
    const headRect = { x: m, y: H * rng.range(0.34, 0.5), w: W - m * 2, h: H * 0.2 };
    const ghost = ctx.group();
    ghost.setAttribute("transform", `translate(${(off * dir.x * 1.6).toFixed(2)} ${(off * dir.y * 1.6).toFixed(2)})`);
    ghost.setAttribute("opacity", "0.7");
    drawHeadline(ctx, headRect, bundle.headline, headStyle, {
      mode: "bleed",
      backing: true,
      bg: inkB,
      align,
      parent: ghost
    });
    drawHeadline(ctx, headRect, bundle.headline, headStyle, {
      mode: "bleed",
      backing: true,
      bg: inkA,
      align
    });
    const labelH = displaySize(ctx, 0.07);
    const labelRect = { x: m, y: H - labelH - m, w: W * 0.5, h: labelH };
    const lghost = ctx.group();
    lghost.setAttribute("transform", `translate(${(off * dir.x).toFixed(2)} ${(off * dir.y).toFixed(2)})`);
    lghost.setAttribute("opacity", "0.65");
    drawHeadline(ctx, labelRect, `${bundle.sub} \xB7 ${bundle.label}`, textStyle(ctx, labelH * 0.6, heavyWeight(ctx)), {
      mode: "bleed",
      backing: true,
      bg: inkB,
      align: rtl ? "end" : "start",
      parent: lghost
    });
    drawHeadline(ctx, labelRect, `${bundle.sub} \xB7 ${bundle.label}`, textStyle(ctx, labelH * 0.6, heavyWeight(ctx)), {
      mode: "bleed",
      backing: true,
      bg: inkA,
      align: rtl ? "end" : "start"
    });
  }
  registerComposition({ name: "overprint", weight: 2, render: render197 });

  // src/compositions/radialFocal.ts
  function render198(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx);
    const c = center(ctx.bounds());
    const minDim = Math.min(ctx.width, ctx.height);
    const noText = !ctx.text.enabled;
    const radius = minDim * (noText ? rng.range(0.36, 0.46) : rng.range(0.26, 0.34));
    const rings = noText ? rng.int(4, 7) : rng.int(2, 4);
    for (let i = rings; i >= 1; i--) {
      const rr = radius * (1 + i * (noText ? 0.28 : 0.45));
      ctx.root.appendChild(
        ctx.el("circle", {
          cx: c.x,
          cy: c.y,
          r: rr,
          fill: "none",
          stroke: i % 2 ? palette.accent : palette.primary,
          "stroke-width": Math.max(1, minDim * (noText ? 0.012 : 4e-3)),
          opacity: noText ? 0.85 : 0.5
        })
      );
    }
    const useTexture = noText ? true : rng.chance(0.6);
    if (useTexture) {
      const clipId = `focal-${ctx.rng.int(0, 1e9)}`;
      const clip = ctx.el("clipPath", { id: clipId });
      clip.appendChild(ctx.el("circle", { cx: c.x, cy: c.y, r: radius }));
      ctx.root.appendChild(clip);
      const g = ctx.group();
      g.setAttribute("clip-path", `url(#${clipId})`);
      ctx.fillRegion({ x: c.x - radius, y: c.y - radius, w: radius * 2, h: radius * 2 }, g);
    } else {
      ctx.root.appendChild(
        ctx.el("circle", { cx: c.x, cy: c.y, r: radius, fill: palette.primary })
      );
    }
    const bundle = textBundle(ctx);
    if (!bundle) return;
    const rtl = isRtl(ctx);
    const discBg = useTexture ? palette.background : palette.primary;
    drawHeadline(
      ctx,
      { x: c.x - radius, y: c.y - radius * 0.3, w: radius * 2, h: radius * 0.6 },
      bundle.headline,
      textStyle(ctx, radius * 0.34, heavyWeight(ctx)),
      useTexture ? { mode: "bleed", backing: true, bg: palette.background, align: "middle" } : { bg: discBg, fill: palette.background, align: "middle" }
    );
    const m = margin(ctx, 0.06);
    const align = rtl ? "end" : "start";
    drawHeadline(
      ctx,
      { x: m, y: m, w: ctx.width - m * 2, h: minDim * 0.07 },
      bundle.sub,
      textStyle(ctx, displaySize(ctx, 0.04), heavyWeight(ctx)),
      { bg: palette.background, fill: palette.primary, align: "middle" }
    );
    const stripH = minDim * 0.09;
    const strip = { x: 0, y: ctx.height - stripH, w: ctx.width, h: stripH };
    block(ctx, strip, palette.accent);
    drawHeadline(
      ctx,
      inset(strip, m, stripH * 0.2),
      `${bundle.english ?? bundle.sub} \xB7 ${bundle.label}`,
      textStyle(ctx, stripH * 0.45, heavyWeight(ctx)),
      { bg: palette.accent, fill: palette.background, align }
    );
  }
  registerComposition({ name: "radial-focal", weight: 2, render: render198 });

  // src/compositions/ransomNote.ts
  function chunks(text) {
    const words = text.split(/\s+/).filter(Boolean);
    const out = [];
    for (const w of words) {
      if (w.length <= 2) {
        out.push(w);
      } else {
        for (let i = 0; i < w.length; ) {
          const take = w.length - i <= 3 ? w.length - i : 1 + i % 2;
          out.push(w.slice(i, i + take));
          i += take;
        }
      }
    }
    return out.length ? out : [text];
  }
  function render199(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx);
    ctx.fillRegion(ctx.bounds());
    const heavy = heavyWeight(ctx);
    const bundle = textBundle(ctx);
    if (!bundle) {
      const chipColors2 = [palette.primary, palette.accent, palette.background];
      const n = rng.int(7, 14);
      for (let i = 0; i < n; i++) {
        const w = ctx.width * rng.range(0.08, 0.22);
        const h = w * rng.range(0.7, 1.3);
        const r = { x: rng.range(0, ctx.width - w), y: rng.range(0, ctx.height - h), w, h };
        const g = ctx.group();
        block(ctx, r, rng.pick(chipColors2), g);
        g.setAttribute(
          "transform",
          `rotate(${rng.range(-14, 14).toFixed(1)} ${(r.x + r.w / 2).toFixed(1)} ${(r.y + r.h / 2).toFixed(1)})`
        );
      }
      return;
    }
    const rtl = isRtl(ctx);
    const pieces = chunks(bundle.headline);
    const m = margin(ctx, 0.05);
    const bandTop = ctx.height * rng.range(0.14, 0.22);
    const bandH = ctx.height * rng.range(0.5, 0.6);
    const avail = ctx.width - m * 2;
    const chipColors = [palette.primary, palette.accent, palette.background, palette.text];
    const rows2 = Math.max(1, Math.round(Math.sqrt(pieces.length) * rng.range(0.8, 1.2)));
    const rowH = bandH / rows2;
    const ordered = rtl ? pieces.slice().reverse() : pieces;
    let cx = m;
    let row = 0;
    const gap = rowH * 0.08;
    for (const piece of ordered) {
      const scale = rng.weighted([0.5, 0.8, 1.1, 1.6], [2, 3, 2, 1]);
      const size = rowH * scale * 0.78;
      const style = textStyle(ctx, size, heavy);
      const tw = measureWidth(piece, style);
      const chipW = tw + size * 0.36;
      const chipH = size * 1.18;
      if (cx + chipW > m + avail && cx > m) {
        row += 1;
        cx = m;
        if (row >= rows2) break;
      }
      const cy = bandTop + row * rowH + (rowH - chipH) / 2 + rng.range(-rowH * 0.12, rowH * 0.12);
      const chipColor = rng.pick(chipColors);
      const g = ctx.group();
      const r = { x: cx, y: cy, w: chipW, h: chipH };
      block(ctx, r, chipColor, g);
      drawLine(ctx, r.x + chipW / 2, r.y + chipH * 0.5 + size * 0.35, piece, style, {
        bg: chipColor,
        anchor: "middle",
        minContrast: 4.5,
        parent: g
      });
      g.setAttribute(
        "transform",
        `rotate(${rng.range(-9, 9).toFixed(1)} ${(r.x + chipW / 2).toFixed(1)} ${(r.y + chipH / 2).toFixed(1)})`
      );
      cx += chipW + gap;
    }
    const footY = bandTop + bandH + ctx.height * 0.02;
    const footH = ctx.height - footY - m * 0.5;
    if (footH > ctx.height * 0.06) {
      const subColor = palette.primary;
      const subChip = { x: m, y: footY, w: avail * rng.range(0.55, 0.7), h: footH * 0.5 };
      block(ctx, subChip, subColor);
      drawHeadline(
        ctx,
        { x: subChip.x + footH * 0.12, y: subChip.y, w: subChip.w - footH * 0.24, h: subChip.h },
        bundle.sub,
        textStyle(ctx, displaySize(ctx, 0.045), heavy),
        { bg: subColor, fill: palette.background, align: rtl ? "end" : "start" }
      );
      const labelChip = {
        x: rtl ? m : ctx.width - m - avail * 0.3,
        y: footY + footH * 0.55,
        w: avail * 0.3,
        h: footH * 0.4
      };
      block(ctx, labelChip, palette.accent);
      drawHeadline(
        ctx,
        labelChip,
        bundle.label,
        textStyle(ctx, labelChip.h * 0.5, heavy),
        { bg: palette.accent, fill: palette.background, align: "middle" }
      );
    }
  }
  registerComposition({ name: "ransom-note", weight: 2, render: render199 });

  // src/compositions/rotatedHeadline.ts
  function render200(ctx) {
    const { rng, palette } = ctx;
    const { width: W, height: H } = ctx;
    const fieldColor = regionFill(ctx, rng);
    fillBackground(ctx, rng.chance(0.5) ? palette.background : fieldColor);
    ctx.fillRegion(ctx.bounds());
    const bundle = textBundle(ctx);
    if (!bundle) {
      const cx2 = W / 2;
      const cy2 = H / 2;
      const ang = rng.range(-32, -18) * (rng.chance(0.5) ? 1 : -1);
      const g2 = ctx.group();
      g2.setAttribute("transform", `rotate(${ang.toFixed(2)} ${cx2} ${cy2})`);
      const span = Math.hypot(W, H);
      const bars = rng.int(3, 6);
      for (let i = 0; i < bars; i++) {
        const h = H * rng.range(0.04, 0.12);
        const y = cy2 - span / 2 + span / bars * (i + rng.range(0.1, 0.5));
        block(
          ctx,
          { x: cx2 - span / 2, y, w: span, h },
          i % 2 ? palette.accent : palette.primary,
          g2
        );
      }
      return;
    }
    const rtl = isRtl(ctx);
    const sign = rng.chance(0.5) ? 1 : -1;
    const angle = rng.range(18, 34) * sign;
    const cx = W * rng.range(0.42, 0.58);
    const cy = H * rng.range(0.4, 0.6);
    const g = ctx.group();
    g.setAttribute("transform", `rotate(${angle.toFixed(3)} ${cx} ${cy})`);
    const bandColor = rng.chance(0.5) ? palette.primary : palette.accent;
    const m = margin(ctx, 0.03);
    const headStyle = textStyle(ctx, displaySize(ctx, rng.range(0.16, 0.24)), heavyWeight(ctx));
    drawHeadline(
      ctx,
      { x: cx - W * 0.7, y: cy - H * 0.1, w: W * 1.4, h: H * 0.2 },
      bundle.headline,
      headStyle,
      {
        mode: "bleed",
        backing: true,
        bg: bandColor,
        align: "middle",
        parent: g
      }
    );
    const subColor = bandColor === palette.primary ? palette.accent : palette.primary;
    drawHeadline(
      ctx,
      { x: cx - W * 0.5, y: cy + H * 0.13, w: W, h: H * 0.09 },
      bundle.sub,
      textStyle(ctx, displaySize(ctx, rng.range(0.06, 0.09)), heavyWeight(ctx)),
      {
        mode: "bleed",
        backing: true,
        bg: subColor,
        align: "middle",
        parent: g
      }
    );
    const labelStyle = textStyle(ctx, displaySize(ctx, 0.026), heavyWeight(ctx));
    const labelBg = palette.background;
    block(
      ctx,
      { x: 0, y: H - displaySize(ctx, 0.07), w: W, h: displaySize(ctx, 0.07) },
      labelBg
    );
    drawHeadline(
      ctx,
      { x: m * 2, y: H - displaySize(ctx, 0.065), w: W - m * 4, h: displaySize(ctx, 0.06) },
      `${bundle.label} \xB7 ${bundle.body[0] ?? bundle.sub}`,
      labelStyle,
      { bg: labelBg, fill: palette.text, minContrast: 4.5, align: rtl ? "end" : "start" }
    );
  }
  registerComposition({ name: "rotated-headline", weight: 3, render: render200 });

  // src/compositions/scatteredCollage.ts
  function tilted(ctx, r, angle) {
    const g = ctx.group();
    g.setAttribute(
      "transform",
      `rotate(${angle.toFixed(1)} ${(r.x + r.w / 2).toFixed(1)} ${(r.y + r.h / 2).toFixed(1)})`
    );
    return g;
  }
  function render201(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx);
    const colors = [palette.primary, palette.accent, palette.colors[3] ?? palette.primary];
    const minDim = Math.min(ctx.width, ctx.height);
    const texScraps = rng.int(3, 5);
    for (let i = 0; i < texScraps; i++) {
      const w = minDim * rng.range(0.22, 0.42);
      const h = minDim * rng.range(0.18, 0.36);
      const r = {
        x: rng.range(-w * 0.1, ctx.width - w * 0.9),
        y: rng.range(-h * 0.1, ctx.height - h * 0.9),
        w,
        h
      };
      const g = tilted(ctx, r, rng.range(-18, 18));
      block(ctx, inset(r, -minDim * 0.012), palette.background, g);
      ctx.fillRegion(r, g);
    }
    const bundle = textBundle(ctx);
    if (!bundle) return;
    const rtl = isRtl(ctx);
    const lines = [
      { text: bundle.headline, size: 0.1 },
      { text: bundle.sub, size: 0.05 },
      { text: bundle.english ?? bundle.body[0] ?? bundle.sub, size: 0.045 },
      { text: bundle.label, size: 0.06 }
    ];
    lines.forEach((ln, i) => {
      const fontSize = displaySize(ctx, ln.size);
      const h = fontSize * 1.5;
      const w = ctx.width * rng.range(0.45, 0.85);
      const r = {
        x: rng.range(ctx.width * 0.03, ctx.width * 0.97 - w),
        y: ctx.height * (0.1 + i * 0.21) + rng.range(-ctx.height * 0.04, ctx.height * 0.04),
        w,
        h
      };
      const cardColor = i === 0 ? palette.background : rng.pick(colors);
      const g = tilted(ctx, r, rng.range(-12, 12));
      block(ctx, r, cardColor, g);
      drawHeadline(
        ctx,
        inset(r, h * 0.18),
        ln.text,
        textStyle(ctx, fontSize, heavyWeight(ctx)),
        { bg: cardColor, fill: i === 0 ? palette.primary : palette.background, align: rtl ? "end" : "start", parent: g }
      );
    });
  }
  registerComposition({ name: "scattered-collage", weight: 2, render: render201 });

  // src/compositions/specSheet.ts
  function bigCode(ctx, label) {
    const digits2 = label ? label.replace(/[^0-9A-Za-z]/g, "") : "";
    if (digits2.length >= 2) return digits2.slice(0, ctx.rng.int(2, 3)).toUpperCase();
    return String(ctx.rng.int(10, 99));
  }
  function render202(ctx) {
    const { rng, palette } = ctx;
    const { width: W, height: H } = ctx;
    const rtl = isRtl(ctx);
    const bgIsDark = rng.chance(0.55);
    const bg = bgIsDark ? palette.primary : palette.background;
    fillBackground(ctx, bg);
    const colFrac = rng.range(0.26, 0.36);
    const colLeft = rtl ? !rng.chance(0.7) : rng.chance(0.4);
    const [a, b] = splitX(ctx.bounds(), colLeft ? colFrac : 1 - colFrac);
    const specCol = colLeft ? a : b;
    const stage = colLeft ? b : a;
    const fieldFromTop = rng.chance(0.5);
    const fieldH = stage.h * rng.range(0.5, 0.75);
    const fieldRect = {
      x: stage.x,
      y: fieldFromTop ? stage.y : stage.y + stage.h - fieldH,
      w: stage.w,
      h: fieldH
    };
    ctx.fillRegion(fieldRect);
    const colColor = bgIsDark ? palette.background : palette.primary;
    block(ctx, specCol, colColor);
    const bundle = textBundle(ctx);
    const glyph = bigCode(ctx, bundle ? bundle.label : null);
    const weight = heavyWeight(ctx);
    const probe = textStyle(ctx, H, weight);
    const targetH = H * rng.range(0.85, 1.08);
    const byWidth = fitSizeToWidth(glyph, stage.w * rng.range(1, 1.35), probe);
    const size = Math.min(targetH, byWidth);
    const glyphStyle = textStyle(ctx, size, weight);
    const glyphW = measureWidth(glyph, glyphStyle);
    const plateColor = rng.chance(0.5) ? regionFill(ctx, rng) : palette.accent;
    const overhang = size * rng.range(0.06, 0.18);
    const glyphRight = colLeft;
    const glyphX = glyphRight ? stage.x + stage.w - overhang : stage.x + overhang;
    const anchor = glyphRight ? "end" : "start";
    const glyphY = stage.y + stage.h * 0.5 + size * 0.36;
    const plateW = glyphW + size * 0.34;
    const plateX = anchor === "end" ? glyphX - plateW + overhang * 0.5 : glyphX - overhang * 0.5;
    block(ctx, { x: plateX, y: stage.y, w: plateW, h: stage.h }, plateColor);
    drawLine(ctx, glyphX, glyphY, glyph, glyphStyle, {
      bg: plateColor,
      fill: rng.chance(0.5) ? palette.background : palette.primary,
      minContrast: 3,
      anchor
    });
    if (!bundle) return;
    const m = margin(ctx, 0.025);
    const inner = { x: specCol.x + m, y: specCol.y + m, w: specCol.w - m * 2, h: specCol.h - m * 2 };
    const align = rtl ? "end" : "start";
    const rowAnchorX = rtl ? inner.x + inner.w : inner.x;
    const headSize = Math.min(inner.w * 0.16, displaySize(ctx, 0.04));
    let y = inner.y + headSize;
    drawLine(ctx, rowAnchorX, y, bundle.sub, textStyle(ctx, headSize, weight), {
      bg: colColor,
      fill: palette.text,
      minContrast: 4.5,
      anchor: align
    });
    y += headSize * 0.6;
    block(ctx, { x: inner.x, y, w: inner.w, h: Math.max(2, headSize * 0.08) }, palette.accent);
    y += headSize * 0.9;
    const rowLabels = [...bundle.body, bundle.sub, bundle.headline];
    const rowSize = Math.min(inner.w * 0.085, displaySize(ctx, 0.02));
    const rowH = rowSize * 1.85;
    const maxRows = Math.floor((inner.y + inner.h - y) / rowH);
    const codes = ["REV", "STD", "CAT", "SEQ", "DIM", "LOT", "VER", "IDX"];
    for (let i = 0; i < Math.min(maxRows, rowLabels.length, 8); i++) {
      const ry = y + rowSize + i * rowH;
      const labelText = rowLabels[i];
      const half = inner.w * 0.6;
      const ls = textStyle(ctx, rowSize, 400);
      const fitSize = Math.min(rowSize, fitSizeToWidth(labelText, half, ls));
      drawLine(ctx, rowAnchorX, ry, labelText, textStyle(ctx, fitSize, 400), {
        bg: colColor,
        fill: palette.text,
        minContrast: 4.5,
        anchor: align
      });
      const valX = rtl ? inner.x : inner.x + inner.w;
      drawLine(
        ctx,
        valX,
        ry,
        `${codes[i % codes.length]}\xB7${rng.int(10, 99)}`,
        textStyle(ctx, rowSize * 0.9, weight),
        { bg: colColor, fill: palette.accent, minContrast: 3, anchor: rtl ? "start" : "end" }
      );
      if (i < Math.min(maxRows, rowLabels.length) - 1) {
        block(
          ctx,
          { x: inner.x, y: ry + rowH * 0.32, w: inner.w, h: 1 },
          palette.text
        ).setAttribute("opacity", "0.3");
      }
    }
  }
  registerComposition({ name: "spec-sheet", weight: 2, render: render202 });

  // src/compositions/splitDuotone.ts
  function render203(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx);
    const vertical = ctx.width >= ctx.height ? rng.chance(0.7) : rng.chance(0.3);
    const t = rng.chance(0.5) ? 0.5 : rng.chance(0.5) ? 1 / GOLDEN : 1 - 1 / GOLDEN;
    const full = { x: 0, y: 0, w: ctx.width, h: ctx.height };
    const [a, b] = vertical ? splitX(full, t) : splitY(full, t);
    const colorFirst = rng.chance(0.5);
    const colorField = colorFirst ? a : b;
    const textField = colorFirst ? b : a;
    const fieldColor = rng.chance(0.5) ? palette.primary : palette.accent;
    const textured = rng.chance(0.82);
    if (textured) {
      ctx.fillRegion(colorField);
    } else {
      ctx.root.appendChild(
        ctx.el("rect", {
          x: colorField.x,
          y: colorField.y,
          width: colorField.w,
          height: colorField.h,
          fill: fieldColor
        })
      );
    }
    const bundle = textBundle(ctx);
    if (!bundle) return;
    const m = margin(ctx, 0.05);
    const tf = { x: textField.x + m, y: textField.y + m, w: textField.w - m * 2, h: textField.h - m * 2 };
    const rtl = isRtl(ctx);
    const anchor = rtl ? "end" : "start";
    drawHeadline(
      ctx,
      { x: tf.x, y: tf.y, w: tf.w, h: tf.h * 0.4 },
      bundle.headline,
      textStyle(ctx, displaySize(ctx, rng.range(0.12, 0.18)), heavyWeight(ctx)),
      { bg: palette.background, fill: palette.text, align: anchor }
    );
    drawParagraph(
      ctx,
      { x: tf.x, y: tf.y + tf.h * 0.5, w: tf.w, h: tf.h * 0.45 },
      bundle.body.join("  "),
      textStyle(ctx, displaySize(ctx, 0.02)),
      { bg: palette.background, fill: palette.text, anchor }
    );
    const labelBandH = ctx.height * 0.1;
    const labelBandY = colorField.y + colorField.h - labelBandH;
    if (textured) {
      block(ctx, { x: colorField.x, y: labelBandY, w: colorField.w, h: labelBandH }, fieldColor);
    }
    drawHeadline(
      ctx,
      { x: colorField.x + m, y: labelBandY + labelBandH * 0.2, w: colorField.w - m * 2, h: labelBandH * 0.6 },
      bundle.sub,
      textStyle(ctx, displaySize(ctx, 0.03), heavyWeight(ctx)),
      { bg: fieldColor, fill: palette.background, align: "middle" }
    );
  }
  registerComposition({ name: "split-duotone", weight: 3, render: render203 });

  // src/compositions/spotlightCorner.ts
  var BURSTS = ["sunburst", "rayGradient", "radialLines", "starburstThin", "radialGradient", "radialDots"];
  function render204(ctx) {
    const { rng, palette } = ctx;
    const burstBg = rng.chance(0.5) ? palette.primary : palette.background;
    fillBackground(ctx, burstBg);
    const corner = rng.pick(["tl", "tr", "bl", "br"]);
    const cx = corner === "tl" || corner === "bl" ? 0 : ctx.width;
    const cy = corner === "tl" || corner === "tr" ? 0 : ctx.height;
    const reach = Math.hypot(ctx.width, ctx.height) * rng.range(1.3, 1.7);
    const region = { x: cx - reach, y: cy - reach, w: reach * 2, h: reach * 2 };
    const cid = `sc${rng.int(0, 1e7).toString(36)}`;
    const defs = ctx.el("defs");
    const clip = ctx.el("clipPath", { id: cid });
    clip.appendChild(ctx.el("rect", { x: 0, y: 0, width: ctx.width, height: ctx.height }));
    defs.appendChild(clip);
    ctx.root.appendChild(defs);
    const burstG = ctx.group();
    burstG.setAttribute("clip-path", `url(#${cid})`);
    ctx.root.appendChild(burstG);
    ctx.fillRegion(region, burstG, rng.pick(BURSTS));
    const bundle = textBundle(ctx);
    if (!bundle) return;
    const rtl = isRtl(ctx);
    const m = margin(ctx, 0.06);
    const weight = heavyWeight(ctx);
    const near = corner === "tl" || corner === "tr";
    const headBg = rng.chance(0.5) ? palette.accent : palette.text;
    const headRect = {
      x: m,
      y: near ? ctx.height * 0.18 : ctx.height * 0.5,
      w: ctx.width - m * 2,
      h: ctx.height * 0.32
    };
    const align = corner === "tr" || corner === "br" ? rtl ? "start" : "end" : rtl ? "end" : "start";
    drawHeadline(
      ctx,
      headRect,
      bundle.headline,
      textStyle(ctx, displaySize(ctx, rng.range(0.16, 0.24)), weight),
      { mode: "bleed", backing: true, bg: headBg, fill: palette.background, align }
    );
    const oppRight = corner === "tl" || corner === "bl";
    const oppBottom = corner === "tl" || corner === "tr";
    const subW = ctx.width * 0.46;
    const subX = oppRight ? ctx.width - m - subW : m;
    const subY = oppBottom ? ctx.height - m - ctx.height * 0.2 : m;
    const subAlign = oppRight ? rtl ? "start" : "end" : rtl ? "end" : "start";
    const chipBg = palette.background;
    const chip = { x: subX - m * 0.4, y: subY - m * 0.4, w: subW + m * 0.8, h: ctx.height * 0.22 + m * 0.8 };
    block(ctx, { x: Math.max(0, chip.x), y: Math.max(0, chip.y), w: chip.w, h: chip.h }, chipBg);
    drawHeadline(
      ctx,
      { x: subX, y: subY, w: subW, h: ctx.height * 0.08 },
      bundle.sub,
      textStyle(ctx, displaySize(ctx, 0.04), weight),
      { bg: chipBg, fill: palette.primary, align: subAlign }
    );
    drawParagraph(
      ctx,
      { x: subX, y: subY + ctx.height * 0.09, w: subW, h: ctx.height * 0.12 },
      `${bundle.body[0] ?? bundle.label}  \xB7  ${bundle.label}`,
      textStyle(ctx, displaySize(ctx, 0.018)),
      { bg: chipBg, fill: palette.text, anchor: subAlign }
    );
  }
  registerComposition({ name: "spotlight-corner", weight: 2, render: render204 });

  // src/compositions/stackedBlocks.ts
  function render205(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx);
    const rtl = isRtl(ctx);
    const align = rtl ? "end" : rng.pick(["start", "middle"]);
    const colors = [palette.primary, palette.accent, palette.colors[3] ?? palette.primary];
    const bundle = textBundle(ctx);
    if (!bundle) {
      const count2 = rng.int(4, 7);
      const bands = rows(ctx.bounds(), count2);
      bands.forEach((b, i) => {
        if (rng.chance(0.4)) ctx.fillRegion(b);
        else block(ctx, b, colors[i % colors.length]);
      });
      return;
    }
    const lines = [bundle.headline, bundle.sub, bundle.english ?? bundle.body[0] ?? bundle.sub, bundle.label];
    const count = lines.length;
    const weights = [2.2, 1, 1, 0.9];
    const totalW = weights.reduce((a, b) => a + b, 0);
    const texBand = rng.int(0, count - 1);
    let y = 0;
    lines.forEach((line, i) => {
      const h = ctx.height * weights[i] / totalW;
      const band2 = { x: 0, y, w: ctx.width, h };
      y += h;
      const bandColor = colors[i % colors.length];
      let bg = bandColor;
      if (i === texBand) {
        ctx.fillRegion(band2);
        bg = palette.background;
      } else {
        block(ctx, band2, bandColor);
      }
      const pad = h * 0.16;
      const fontSize = i === 0 ? h * 0.6 : h * 0.5;
      drawHeadline(
        ctx,
        inset(band2, h * 0.4, pad),
        line,
        textStyle(ctx, fontSize, heavyWeight(ctx)),
        i === texBand ? { mode: "bleed", backing: true, bg, align } : { bg, fill: palette.background, align }
      );
    });
  }
  registerComposition({ name: "stacked-blocks", weight: 2, render: render205 });

  // src/compositions/staircase.ts
  function render206(ctx) {
    const { rng, palette } = ctx;
    const baseBg = rng.chance(0.5) ? palette.background : palette.primary;
    fillBackground(ctx, baseBg);
    const altPlane = baseBg === palette.background ? palette.primary : palette.background;
    const bundle = textBundle(ctx);
    const rtl = isRtl(ctx);
    const descendRight = rtl ? false : rng.chance(0.6);
    const steps = rng.int(4, 6);
    const stepH = ctx.height / steps;
    const treadW = ctx.width * rng.range(0.5, 0.72);
    const overflow = ctx.width - treadW;
    const shiftPer = steps > 1 ? overflow / (steps - 1) : 0;
    const headStep = rng.int(1, steps - 2);
    let texStep = rng.int(0, steps - 1);
    if (texStep === headStep) texStep = (texStep + 1) % steps;
    const headPlane = rng.chance(0.5) ? palette.primary : palette.accent;
    const treads = [];
    const treadColor = [];
    for (let i = 0; i < steps; i++) {
      const baseX = i * shiftPer;
      const x = descendRight ? baseX : ctx.width - treadW - baseX;
      const r = { x, y: i * stepH, w: treadW, h: stepH };
      treads.push(r);
      if (i === texStep) {
        ctx.fillRegion(r);
        treadColor.push(null);
      } else {
        const fill = i === headStep ? headPlane : i % 2 === 0 ? regionFill(ctx, rng) : altPlane;
        block(ctx, r, fill);
        treadColor.push(fill);
      }
    }
    if (!bundle) {
      for (let i = 0; i < steps - 1; i++) {
        const a = treads[i];
        const riserX = descendRight ? a.x + a.w - ctx.width * 0.02 : a.x;
        block(
          ctx,
          { x: riserX, y: a.y + a.h * 0.5, w: ctx.width * 0.02, h: a.h * 0.5 },
          palette.accent
        );
      }
      return;
    }
    const align = rtl ? "end" : descendRight ? "start" : "end";
    const detail = [bundle.sub, bundle.label, ...bundle.body, bundle.english ?? bundle.sub];
    let di = 0;
    treads.forEach((r, i) => {
      const padX = r.w * 0.05;
      const inner = { x: r.x + padX, y: r.y, w: r.w - padX * 2, h: r.h };
      let under;
      if (treadColor[i] === null) {
        const band2 = altPlane;
        const bandH = stepH * 0.62;
        const bandY = r.y + (stepH - bandH) / 2;
        block(ctx, { x: r.x, y: bandY, w: r.w, h: bandH }, band2);
        under = band2;
        inner.y = bandY;
        inner.h = bandH;
      } else {
        under = treadColor[i];
      }
      if (i === headStep) {
        drawHeadline(
          ctx,
          { x: inner.x, y: inner.y, w: inner.w, h: stepH },
          bundle.headline,
          textStyle(ctx, stepH * rng.range(0.78, 0.95), heavyWeight(ctx)),
          { mode: "bleed", backing: true, bg: under, align }
        );
      } else {
        const line = detail[di % detail.length];
        di++;
        drawHeadline(
          ctx,
          inner,
          line,
          textStyle(ctx, Math.min(inner.h, stepH) * 0.42, heavyWeight(ctx)),
          { bg: under, fill: palette.text, minContrast: 4.5, align }
        );
      }
    });
  }
  registerComposition({ name: "staircase", weight: 2, render: render206 });

  // src/compositions/stickerBomb.ts
  function render207(ctx) {
    const { rng, palette } = ctx;
    const groundColor = rng.chance(0.5) ? palette.primary : palette.background;
    fillBackground(ctx, groundColor);
    const minDim = Math.min(ctx.width, ctx.height);
    const borders = [palette.background, palette.primary, palette.accent, palette.text];
    const count = rng.int(9, 14);
    const uid2 = `sb${(ctx.rng.seed ?? 0).toString(36)}${rng.int(0, 1e6).toString(36)}`;
    for (let i = 0; i < count; i++) {
      const s = minDim * rng.range(0.22, 0.46);
      const w = s;
      const h = s * rng.range(0.7, 1.3);
      const r = {
        x: ctx.width * rng.range(-0.05, 0.85),
        y: ctx.height * rng.range(-0.05, 0.85),
        w,
        h
      };
      const rot = rng.range(-28, 28);
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      const g = ctx.group();
      g.setAttribute("transform", `rotate(${rot.toFixed(2)} ${cx.toFixed(1)} ${cy.toFixed(1)})`);
      ctx.root.appendChild(g);
      const bw = minDim * 0.012;
      const border = rng.pick(borders);
      g.appendChild(
        ctx.el("rect", { x: r.x - bw, y: r.y - bw, width: r.w + bw * 2, height: r.h + bw * 2, fill: border })
      );
      const cid = `${uid2}c${i}`;
      const clip = ctx.el("clipPath", { id: cid });
      clip.appendChild(ctx.el("path", { d: rectPath(r) }));
      const defs = ctx.el("defs");
      defs.appendChild(clip);
      g.appendChild(defs);
      const inner = ctx.group(g);
      inner.setAttribute("clip-path", `url(#${cid})`);
      ctx.fillRegion(r, inner);
    }
    const bundle = textBundle(ctx);
    if (!bundle) return;
    const rtl = isRtl(ctx);
    const align = rtl ? "end" : "start";
    const weight = heavyWeight(ctx);
    const hw = ctx.width * rng.range(0.62, 0.82);
    const hh = ctx.height * rng.range(0.2, 0.32);
    const hx = (ctx.width - hw) / 2 + ctx.width * rng.range(-0.08, 0.08);
    const hy = ctx.height * rng.range(0.32, 0.5);
    const heroRot = rng.range(-10, 10);
    const heroBg = rng.chance(0.5) ? palette.accent : palette.primary;
    const heroBorder = palette.background;
    const hcx = hx + hw / 2;
    const hcy = hy + hh / 2;
    const hg = ctx.group();
    hg.setAttribute("transform", `rotate(${heroRot.toFixed(2)} ${hcx.toFixed(1)} ${hcy.toFixed(1)})`);
    ctx.root.appendChild(hg);
    const hbw = minDim * 0.02;
    hg.appendChild(
      ctx.el("rect", { x: hx - hbw, y: hy - hbw, width: hw + hbw * 2, height: hh + hbw * 2, fill: heroBorder })
    );
    hg.appendChild(ctx.el("rect", { x: hx, y: hy, width: hw, height: hh, fill: heroBg }));
    const pad = hh * 0.16;
    drawHeadline(
      ctx,
      { x: hx + pad, y: hy + pad, w: hw - pad * 2, h: hh - pad * 2 },
      bundle.headline,
      textStyle(ctx, displaySize(ctx, rng.range(0.12, 0.18)), weight),
      { bg: heroBg, fill: palette.background, align: "middle", parent: hg }
    );
    const lw = ctx.width * rng.range(0.26, 0.4);
    const lh = ctx.height * rng.range(0.08, 0.12);
    const lx = rng.chance(0.5) ? ctx.width * 0.04 : ctx.width * 0.96 - lw;
    const ly = rng.chance(0.5) ? ctx.height * 0.05 : ctx.height * 0.95 - lh;
    const lRot = rng.range(-18, 18);
    const lBg = rng.chance(0.5) ? palette.primary : palette.text;
    const lg = ctx.group();
    lg.setAttribute(
      "transform",
      `rotate(${lRot.toFixed(2)} ${(lx + lw / 2).toFixed(1)} ${(ly + lh / 2).toFixed(1)})`
    );
    ctx.root.appendChild(lg);
    const lbw = minDim * 0.01;
    lg.appendChild(
      ctx.el("rect", { x: lx - lbw, y: ly - lbw, width: lw + lbw * 2, height: lh + lbw * 2, fill: palette.background })
    );
    lg.appendChild(ctx.el("rect", { x: lx, y: ly, width: lw, height: lh, fill: lBg }));
    const lp = lh * 0.18;
    drawHeadline(
      ctx,
      { x: lx + lp, y: ly + lp, w: lw - lp * 2, h: lh - lp * 2 },
      `${bundle.sub} \xB7 ${bundle.label}`,
      textStyle(ctx, displaySize(ctx, 0.03), weight),
      { bg: lBg, fill: palette.background, align, parent: lg }
    );
  }
  registerComposition({ name: "sticker-bomb", weight: 2, render: render207 });

  // src/compositions/swissGrid.ts
  function render208(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx);
    const m = margin(ctx, rng.range(0.045, 0.07));
    const content = { x: m, y: m, w: ctx.width - m * 2, h: ctx.height - m * 2 };
    const colCount = rng.weighted([4, 6, 12], [3, 4, 2]);
    const gap = m * 0.35;
    const cols = columns(content, colCount, gap);
    const rtl = isRtl(ctx);
    const anchor = rtl ? "end" : "start";
    const weight = heavyWeight(ctx);
    const panelColor = regionFill(ctx, rng);
    const panelCols = rng.int(Math.ceil(colCount * 0.45), Math.max(2, colCount - 1));
    const panelStart = rtl ? colCount - panelCols : 0;
    const panelTopAnchored = rng.chance(0.5);
    const panelFrac = rng.range(0.34, 0.6);
    const panelH = content.h * panelFrac;
    const panelY = panelTopAnchored ? content.y : content.y + content.h - panelH;
    const lead = cols[panelStart];
    const trail = cols[panelStart + panelCols - 1];
    const panel = {
      x: lead.x,
      y: panelY,
      w: trail.x + trail.w - lead.x,
      h: panelH
    };
    ctx.fillRegion(panel);
    const bundle = textBundle(ctx);
    if (!bundle) {
      const restCols = cols.filter((_, i) => i < panelStart || i >= panelStart + panelCols);
      const otherH = content.h - panelH - gap;
      const otherY = panelTopAnchored ? panelY + panelH + gap : content.y;
      for (const col of restCols) {
        if (rng.chance(0.55)) {
          ctx.fillRegion({ x: col.x, y: otherY, w: col.w, h: otherH });
        } else {
          block(ctx, { x: col.x, y: otherY, w: col.w, h: otherH }, regionFill(ctx, rng));
        }
      }
      const barRows = rows(content, rng.int(5, 9), 0);
      for (let i = 0; i < 2; i++) {
        const r = rng.pick(barRows);
        block(
          ctx,
          { x: content.x, y: r.y, w: content.w, h: r.h },
          rng.chance(0.5) ? palette.primary : palette.accent
        );
      }
      return;
    }
    const textY = panelTopAnchored ? panel.y + panel.h + gap : content.y;
    const textH = content.h - panel.h - gap;
    const glyph = (bundle.label.match(/\d+/)?.[0] ?? bundle.label).slice(0, 3);
    const glyphSize = panel.h * rng.range(0.85, 1.05);
    const glyphStyle = textStyle(ctx, glyphSize, weight);
    const glyphPad = m * 0.4;
    const glyphX = rtl ? panel.x + glyphPad : panel.x + panel.w - glyphPad;
    const glyphY = panel.y + panel.h * 0.5 + glyphSize * 0.35;
    drawLine(ctx, glyphX, glyphY, glyph, glyphStyle, {
      bg: panelColor,
      fill: palette.background,
      anchor: rtl ? "start" : "end",
      minContrast: 1.5
    });
    const headStyle = textStyle(ctx, displaySize(ctx, rng.range(0.18, 0.26)), weight);
    drawHeadline(
      ctx,
      { x: content.x, y: textY, w: content.w, h: textH * 0.66 },
      bundle.headline,
      headStyle,
      {
        mode: "bleed",
        backing: true,
        bg: palette.background,
        fill: palette.primary,
        align: anchor,
        minContrast: 2
      }
    );
    const barH = Math.max(textH * 0.18, displaySize(ctx, 0.06));
    const barY = textY + textH - barH;
    const barColor = panelColor === palette.accent ? palette.primary : palette.accent;
    const barCols = rng.int(Math.ceil(colCount * 0.5), colCount);
    const barStart = rtl ? 0 : colCount - barCols;
    const bLead = cols[barStart];
    const bTrail = cols[barStart + barCols - 1];
    const bar = { x: bLead.x, y: barY, w: bTrail.x + bTrail.w - bLead.x, h: barH };
    block(ctx, bar, barColor);
    drawHeadline(
      ctx,
      { x: bar.x + m * 0.3, y: bar.y, w: bar.w - m * 0.6, h: bar.h },
      bundle.sub,
      textStyle(ctx, Math.min(displaySize(ctx, 0.05), bar.h * 0.55), weight),
      { bg: barColor, fill: palette.background, align: anchor, minContrast: 2 }
    );
    const bodyCol = rtl ? cols[colCount - 1] : cols[0];
    const bodyTop = textY + textH * 0.68;
    if (barY - bodyTop > displaySize(ctx, 0.04)) {
      drawParagraph(
        ctx,
        { x: bodyCol.x, y: bodyTop, w: bodyCol.w, h: barY - bodyTop - gap },
        bundle.body.join("  "),
        textStyle(ctx, displaySize(ctx, 0.016)),
        { bg: palette.background, fill: palette.text, anchor }
      );
    }
  }
  registerComposition({ name: "swiss-grid", weight: 3, render: render208 });

  // src/compositions/tileGrid.ts
  function render209(ctx) {
    const { rng, palette } = ctx;
    const landscape = ctx.width >= ctx.height;
    const cols = landscape ? rng.int(3, 5) : rng.int(2, 3);
    const rows2 = landscape ? rng.int(2, 3) : rng.int(3, 5);
    const gap = rng.chance(0.5) ? Math.min(ctx.width, ctx.height) * rng.range(5e-3, 0.02) : 0;
    const cells = gridCells(ctx.bounds(), cols, rows2, gap);
    const bundle = textBundle(ctx);
    const textCell = bundle ? rng.pick([0, cols - 1, cells.length - cols, cells.length - 1]) : -1;
    cells.forEach((cell, i) => {
      if (i === textCell) {
        block(ctx, cell, palette.background);
        return;
      }
      ctx.fillRegion(cell);
    });
    if (bundle && textCell >= 0) {
      const cell = cells[textCell];
      const pad = Math.min(cell.w, cell.h) * 0.08;
      drawHeadline(
        ctx,
        { x: cell.x + pad, y: cell.y + pad, w: cell.w - pad * 2, h: cell.h - pad * 2 },
        bundle.headline,
        textStyle(ctx, displaySize(ctx, 0.05), heavyWeight(ctx)),
        { bg: palette.background, fill: palette.primary, align: isRtl(ctx) ? "end" : "start" }
      );
    }
  }
  registerComposition({ name: "tile-grid", weight: 2, render: render209 });

  // src/compositions/tornCollage.ts
  function tornPoints(ctx, r) {
    const { rng } = ctx;
    const jag = Math.min(r.w, r.h) * 0.06;
    const pts = [];
    const push = (x, y) => pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    const stepsX = 7;
    const stepsY = 5;
    for (let i = 0; i <= stepsX; i++) {
      const x = r.x + r.w * i / stepsX;
      push(x, r.y + rng.range(0, jag));
    }
    for (let i = 1; i <= stepsY; i++) {
      const y = r.y + r.h * i / stepsY;
      push(r.x + r.w - rng.range(0, jag), y);
    }
    for (let i = stepsX - 1; i >= 0; i--) {
      const x = r.x + r.w * i / stepsX;
      push(x, r.y + r.h - rng.range(0, jag));
    }
    for (let i = stepsY - 1; i >= 1; i--) {
      const y = r.y + r.h * i / stepsY;
      push(r.x + rng.range(0, jag), y);
    }
    return pts.join(" ");
  }
  function tilted2(ctx, r, angle, parent) {
    const g = ctx.group(parent);
    g.setAttribute(
      "transform",
      `rotate(${angle.toFixed(2)} ${(r.x + r.w / 2).toFixed(1)} ${(r.y + r.h / 2).toFixed(1)})`
    );
    return g;
  }
  function tornScrap(ctx, r, angle, paper) {
    const g = tilted2(ctx, r, angle);
    const pts = tornPoints(ctx, inset(r, Math.min(r.w, r.h) * 0.04));
    g.appendChild(ctx.el("polygon", { points: pts, fill: paper }));
    const clipId = `torn-${ctx.rng.int(0, 1e9)}`;
    const defs = ctx.el("defs");
    const clip = ctx.el("clipPath", { id: clipId });
    clip.appendChild(ctx.el("polygon", { points: pts }));
    defs.appendChild(clip);
    g.appendChild(defs);
    const texG = ctx.group(g);
    texG.setAttribute("clip-path", `url(#${clipId})`);
    ctx.fillRegion(inset(r, -Math.min(r.w, r.h) * 0.02), texG);
  }
  function render210(ctx) {
    const { rng, palette } = ctx;
    const { width: W, height: H } = ctx;
    fillBackground(ctx, rng.chance(0.5) ? palette.primary : palette.background);
    const minDim = Math.min(W, H);
    const paper = palette.background;
    const anchorW = W * rng.range(0.55, 0.78);
    const anchorH = H * rng.range(0.55, 0.78);
    const anchor = {
      x: rng.range(-W * 0.08, W - anchorW * 0.85),
      y: rng.range(-H * 0.08, H - anchorH * 0.85),
      w: anchorW,
      h: anchorH
    };
    tornScrap(ctx, anchor, rng.range(-10, 10), paper);
    const extra = rng.int(2, 3);
    for (let i = 0; i < extra; i++) {
      const w = minDim * rng.range(0.34, 0.5);
      const h = minDim * rng.range(0.3, 0.46);
      const r = {
        x: rng.range(-w * 0.15, W - w * 0.8),
        y: rng.range(-h * 0.15, H - h * 0.8),
        w,
        h
      };
      tornScrap(ctx, r, rng.range(-22, 22), paper);
    }
    const bundle = textBundle(ctx);
    if (!bundle) return;
    const rtl = isRtl(ctx);
    const weight = heavyWeight(ctx);
    const m = margin(ctx, 0.05);
    const cardColor = rng.pick([palette.accent, palette.primary]);
    const subLines = [bundle.sub, bundle.english ?? bundle.body[0] ?? bundle.label];
    subLines.forEach((text, i) => {
      const fontSize = displaySize(ctx, i === 0 ? 0.05 : 0.038);
      const ch = fontSize * 1.6;
      const cw = W * rng.range(0.4, 0.62);
      const cr = {
        x: rng.range(W * 0.04, W * 0.96 - cw),
        y: i === 0 ? H * rng.range(0.06, 0.2) : H * rng.range(0.72, 0.86),
        w: cw,
        h: ch
      };
      const col = i === 0 ? cardColor : palette.background;
      const g = tilted2(ctx, cr, rng.range(-9, 9));
      block(ctx, cr, col, g);
      drawHeadline(
        ctx,
        inset(cr, ch * 0.2),
        text,
        textStyle(ctx, fontSize, weight),
        { bg: col, fill: i === 0 ? palette.background : palette.primary, align: rtl ? "end" : "start", parent: g }
      );
    });
    const hr = { x: m, y: H * rng.range(0.38, 0.52), w: W - m * 2, h: H * 0.2 };
    const hg = tilted2(ctx, hr, rng.range(-6, 6));
    drawHeadline(
      ctx,
      { x: hr.x, y: hr.y, w: hr.w, h: hr.h },
      bundle.headline,
      textStyle(ctx, displaySize(ctx, rng.range(0.15, 0.22)), weight),
      { mode: "bleed", backing: true, bg: palette.primary, align: rtl ? "end" : rng.pick(["start", "middle"]), parent: hg }
    );
  }
  registerComposition({ name: "torn-collage", weight: 2, render: render210 });

  // src/compositions/tracklist.ts
  function render211(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx);
    const rtl = isRtl(ctx);
    const artFirst = rtl ? rng.chance(0.3) : rng.chance(0.6);
    const full = { x: 0, y: 0, w: ctx.width, h: ctx.height };
    const [first, second] = splitX(full, 1 / GOLDEN);
    const artSide = artFirst ? first : second;
    const listSide = artFirst ? second : first;
    ctx.fillRegion(artSide);
    const bundle = textBundle(ctx);
    if (!bundle) {
      block(ctx, listSide, regionFill(ctx, rng));
      const bars = rng.int(3, 5);
      for (let i = 0; i < bars; i++) {
        const y = listSide.y + listSide.h * (0.12 + i * 0.18);
        block(
          ctx,
          { x: listSide.x, y, w: listSide.w * rng.range(0.4, 0.95), h: listSide.h * 0.05 },
          i % 2 ? palette.background : palette.accent
        );
      }
      return;
    }
    const weight = heavyWeight(ctx);
    const align = rtl ? "end" : "start";
    const m = margin(ctx, 0.045);
    const titleColor = regionFill(ctx, rng);
    const words = bundle.headline.split(/\s+/).filter(Boolean);
    const titleLines = words.length >= 2 ? words.slice(0, 3) : [bundle.headline];
    const bandH = artSide.h * Math.min(0.74, 0.2 * titleLines.length + 0.12);
    const bandY = artSide.y + artSide.h - bandH;
    block(ctx, { x: artSide.x, y: bandY, w: artSide.w, h: bandH }, titleColor);
    const titleArea = inset(
      { x: artSide.x, y: bandY, w: artSide.w, h: bandH },
      m,
      bandH * 0.06
    );
    const lineH = titleArea.h / titleLines.length;
    titleLines.forEach((line, i) => {
      drawHeadline(
        ctx,
        { x: titleArea.x, y: titleArea.y + i * lineH, w: titleArea.w, h: lineH },
        line,
        textStyle(ctx, lineH * 0.96, weight),
        { bg: titleColor, fill: palette.background, minContrast: 3.5, align }
      );
    });
    const list = inset(listSide, m, m * 1.1);
    const script = scriptByName(ctx.text.script);
    const trackCount = rng.int(8, 12);
    const headStyle = textStyle(ctx, displaySize(ctx, 0.022), weight);
    const headY = list.y + headStyle.size;
    drawLine(
      ctx,
      rtl ? list.x + list.w : list.x,
      headY,
      bundle.sub,
      { ...headStyle, letterSpacing: headStyle.size * 0.06 },
      { bg: palette.background, fill: palette.primary, anchor: align }
    );
    const top = headY + headStyle.size * 1.4;
    const rowH = (list.y + list.h - top) / trackCount;
    const numStyle = textStyle(ctx, rowH * 0.78, weight);
    const titleStyle = textStyle(ctx, rowH * 0.42, 400);
    const numCol = measureWidth("00", numStyle);
    const gap = rowH * 0.3;
    const titleMaxW = Math.max(rowH, list.w - numCol - gap);
    for (let i = 0; i < trackCount; i++) {
      const rowY = top + i * rowH;
      const baseline = rowY + rowH * 0.72;
      const num = String(i + 1).padStart(2, "0");
      const trackTitle = makePhrase(rng, script, {
        words: rng.int(1, 3),
        casing: "title"
      });
      const tStyle = {
        ...titleStyle,
        size: Math.min(titleStyle.size, fitSizeToWidth(trackTitle, titleMaxW, titleStyle, rowH * 0.3))
      };
      if (rtl) {
        drawLine(ctx, list.x + list.w, baseline, num, numStyle, {
          bg: palette.background,
          fill: palette.accent,
          anchor: "end"
        });
        drawLine(ctx, list.x + list.w - numCol - gap, baseline, trackTitle, tStyle, {
          bg: palette.background,
          fill: palette.text,
          anchor: "end"
        });
      } else {
        drawLine(ctx, list.x, baseline, num, numStyle, {
          bg: palette.background,
          fill: palette.accent,
          anchor: "start"
        });
        drawLine(ctx, list.x + numCol + gap, baseline, trackTitle, tStyle, {
          bg: palette.background,
          fill: palette.text,
          anchor: "start"
        });
      }
      block(
        ctx,
        { x: list.x, y: rowY + rowH - 1, w: list.w, h: Math.max(1, rowH * 0.012) },
        palette.primary
      );
    }
  }
  registerComposition({ name: "tracklist", weight: 2, render: render211 });

  // src/compositions/triptychPanels.ts
  function render212(ctx) {
    const { rng, palette } = ctx;
    const { width: W, height: H } = ctx;
    fillBackground(ctx, palette.background);
    const wideIdx = rng.int(0, 2);
    const wWeights = [1, 1, 1];
    wWeights[wideIdx] = rng.range(1.8, 2.6);
    const total = wWeights[0] + wWeights[1] + wWeights[2];
    const widths = wWeights.map((w) => w / total * W);
    const xs = [0, widths[0], widths[0] + widths[1]];
    const panels = widths.map((w, i) => ({ x: xs[i], y: 0, w, h: H }));
    const texIdx = wideIdx;
    const flat = rng.shuffle([palette.primary, palette.accent, palette.colors[3] ?? palette.primary]);
    let flatI = 0;
    panels.forEach((p, i) => {
      if (i === texIdx) {
        ctx.fillRegion(p);
      } else {
        block(ctx, p, flat[flatI++ % flat.length]);
      }
    });
    const seam = Math.max(2, Math.min(W, H) * 6e-3);
    for (let i = 1; i < 3; i++) {
      block(ctx, { x: xs[i] - seam / 2, y: 0, w: seam, h: H }, palette.background);
    }
    const bundle = textBundle(ctx);
    if (!bundle) {
      panels.forEach((p, i) => {
        if (i === texIdx) return;
        const bars = rng.int(2, 4);
        for (let b = 0; b < bars; b++) {
          const y = p.h * rng.range(0.12, 0.85);
          block(
            ctx,
            { x: p.x, y, w: p.w, h: H * rng.range(0.03, 0.08) },
            b % 2 ? palette.background : palette.accent
          );
        }
      });
      return;
    }
    const rtl = isRtl(ctx);
    const weight = heavyWeight(ctx);
    const m = margin(ctx, 0.04);
    if (rng.chance(0.55)) {
      const tall = H > W * 1.2;
      const g = ctx.group();
      if (tall) {
        const cx = W / 2;
        const cy = H / 2;
        g.setAttribute("transform", `rotate(-90 ${cx} ${cy})`);
      }
      const longSide = tall ? H : W;
      drawHeadline(
        ctx,
        tall ? { x: (W - H) / 2 + m, y: (H - W) / 2 + H / 2 - W * 0.08, w: H - m * 2, h: W * 0.16 } : { x: m, y: H * 0.5 - H * 0.11, w: W - m * 2, h: H * 0.22 },
        bundle.headline,
        textStyle(ctx, longSide * rng.range(0.16, 0.22), weight),
        { mode: "bleed", backing: true, bg: palette.background, align: rtl ? "end" : "middle", parent: g }
      );
      const tp = panels[texIdx];
      const labelH = H * 0.09;
      block(ctx, { x: tp.x, y: H - labelH, w: tp.w, h: labelH }, palette.background);
      drawHeadline(
        ctx,
        { x: tp.x + m * 0.5, y: H - labelH + labelH * 0.18, w: tp.w - m, h: labelH * 0.6 },
        `${bundle.sub} \xB7 ${bundle.label}`,
        textStyle(ctx, displaySize(ctx, 0.026), weight),
        { bg: palette.background, fill: palette.primary, align: rtl ? "end" : "start" }
      );
      return;
    }
    const words = bundle.headline.split(/\s+/).filter(Boolean);
    const fills = [bundle.sub, bundle.headline, bundle.label];
    panels.forEach((p, i) => {
      const onTexture = i === texIdx;
      const fieldColor = onTexture ? palette.background : flat[(i < texIdx ? i : i - 1) % flat.length];
      const word = words[i] ?? fills[i] ?? bundle.label;
      const stripH = H * rng.range(0.22, 0.34);
      const stripY = H * rng.range(0.1, 0.55);
      block(ctx, { x: p.x, y: stripY, w: p.w, h: stripH }, fieldColor);
      drawHeadline(
        ctx,
        { x: p.x + m * 0.5, y: stripY, w: p.w - m, h: stripH },
        word,
        textStyle(ctx, displaySize(ctx, 0.13), weight),
        { bg: fieldColor, fill: palette.primary, align: "middle" }
      );
    });
    const footH = H * 0.08;
    block(ctx, { x: 0, y: H - footH, w: W, h: footH }, palette.primary);
    drawLine(
      ctx,
      rtl ? W - m : m,
      H - footH + footH * 0.66,
      `${bundle.sub} \u2014 ${bundle.label}`,
      textStyle(ctx, displaySize(ctx, 0.028), weight),
      { bg: palette.primary, fill: palette.background, anchor: rtl ? "end" : "start" }
    );
  }
  registerComposition({ name: "triptych-panels", weight: 3, render: render212 });

  // src/compositions/verticalColumns.ts
  function render213(ctx) {
    const { rng, palette } = ctx;
    fillBackground(ctx);
    const n = ctx.width >= ctx.height ? rng.int(5, 8) : rng.int(3, 5);
    const gap = ctx.width * rng.range(4e-3, 0.012);
    const cols = columns(ctx.bounds(), n, gap);
    const bundle = textBundle(ctx);
    const rtl = isRtl(ctx);
    const textCol = bundle ? rtl ? n - 1 : 0 : -1;
    cols.forEach((col2, i) => {
      if (i === textCol) {
        block(ctx, col2, palette.background);
        return;
      }
      if (rng.chance(0.6)) {
        ctx.fillRegion(col2);
      } else {
        block(ctx, col2, regionFill(ctx, rng));
      }
    });
    if (!bundle || textCol < 0) return;
    const col = cols[textCol];
    const g = ctx.group();
    const cx = col.x + col.w / 2;
    const cy = col.y + col.h / 2;
    g.setAttribute("transform", `rotate(-90 ${cx} ${cy})`);
    const rect = { x: cx - col.h / 2, y: cy - col.w / 2, w: col.h, h: col.w };
    const pad = col.h * 0.04;
    drawHeadline(
      ctx,
      { x: rect.x + pad, y: rect.y, w: rect.w - pad * 2, h: rect.h * 0.6 },
      bundle.headline,
      textStyle(ctx, col.w * 0.4, heavyWeight(ctx)),
      { bg: palette.background, fill: palette.primary, align: "middle", parent: g }
    );
    drawHeadline(
      ctx,
      { x: rect.x + pad, y: rect.y + rect.h * 0.62, w: rect.w - pad * 2, h: rect.h * 0.3 },
      `${bundle.sub} \xB7 ${bundle.label}`,
      textStyle(ctx, col.w * 0.16, heavyWeight(ctx)),
      { bg: palette.background, fill: palette.accent, align: "middle", parent: g }
    );
  }
  registerComposition({ name: "vertical-columns", weight: 2, render: render213 });

  // src/compositions/verticalMegatype.ts
  function render214(ctx) {
    const { rng, palette } = ctx;
    const { width: W, height: H } = ctx;
    const fieldColor = regionFill(ctx, rng);
    const bgIsColor = rng.chance(0.45);
    const bg = bgIsColor ? fieldColor : palette.background;
    fillBackground(ctx, bg);
    const bundle = textBundle(ctx);
    if (!bundle) {
      const slabW = W * rng.range(0.4, 0.6);
      const slabX = rng.chance(0.5) ? 0 : W - slabW;
      ctx.fillRegion({ x: slabX, y: 0, w: slabW, h: H });
      block(ctx, { x: slabX === 0 ? slabW : 0, y: H * rng.range(0.3, 0.6), w: W - slabW, h: H * 0.12 }, palette.accent);
      return;
    }
    const rtl = isRtl(ctx);
    const colFrac = rng.range(0.5, 0.66);
    const colW = W * colFrac;
    const colLeft = rtl;
    const colX = colLeft ? 0 : W - colW;
    const bandX = colLeft ? colW : 0;
    const bandW = W - colW;
    ctx.fillRegion({ x: bandX, y: 0, w: bandW, h: H });
    const plateColor = bgIsColor ? palette.background : fieldColor;
    block(ctx, { x: colX, y: 0, w: colW, h: H }, plateColor);
    const g = ctx.group();
    const cx = colX + colW / 2;
    const cy = H / 2;
    g.setAttribute("transform", `rotate(-90 ${cx} ${cy})`);
    const m = margin(ctx, 0.04);
    const headSize = colW * rng.range(0.62, 0.82);
    const headRect = {
      x: cx - H / 2 + m,
      y: cy - colW * 0.32,
      w: H - m * 2,
      h: colW * 0.7
    };
    drawHeadline(ctx, headRect, bundle.headline, textStyle(ctx, headSize, heavyWeight(ctx)), {
      mode: "bleed",
      backing: false,
      bg: plateColor,
      align: "middle",
      minContrast: 4.5,
      parent: g
    });
    const labelH = displaySize(ctx, 0.05);
    const labelBg = palette.primary;
    const labelRect = { x: bandX, y: H - labelH, w: bandW, h: labelH };
    block(ctx, labelRect, labelBg);
    drawHeadline(
      ctx,
      { x: labelRect.x + m, y: labelRect.y, w: labelRect.w - m * 2, h: labelH },
      `${bundle.sub} \xB7 ${bundle.label}`,
      textStyle(ctx, labelH * 0.42, heavyWeight(ctx)),
      { bg: labelBg, fill: palette.background, minContrast: 4.5, align: rtl ? "end" : "start" }
    );
  }
  registerComposition({ name: "vertical-megatype", weight: 2, render: render214 });

  // src/compositions/zPattern.ts
  function diagonalBand(ctx, from, to, thickness, fill) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const g = ctx.group();
    g.setAttribute("transform", `rotate(${angle} ${from.x} ${from.y})`);
    block(
      ctx,
      { x: from.x - len * 0.15, y: from.y - thickness / 2, w: len * 1.3, h: thickness },
      fill,
      g
    );
    return g;
  }
  function render215(ctx) {
    const { rng, palette } = ctx;
    const dark = palette.backgroundIsDark;
    fillBackground(ctx);
    const rtl = isRtl(ctx);
    const full = ctx.bounds();
    const W = ctx.width;
    const H = ctx.height;
    const [topBand, rest] = splitY(full, rng.range(0.3, 0.4));
    const botBandH = H * rng.range(0.18, 0.26);
    const botBand = { x: 0, y: H - botBandH, w: W, h: botBandH };
    const leadX = rtl ? W : 0;
    const trailX = rtl ? 0 : W;
    const startAlign = rtl ? "end" : "start";
    const endAlign = rtl ? "start" : "end";
    const diagThick = Math.min(W, H) * rng.range(0.07, 0.11);
    const accent = regionFill(ctx, rng);
    diagonalBand(
      ctx,
      { x: trailX, y: topBand.y + topBand.h * 0.5 },
      { x: leadX, y: botBand.y + botBand.h * 0.5 },
      diagThick,
      accent
    );
    const texW = topBand.w * rng.range(0.55, 0.72);
    const texX = rtl ? 0 : W - texW;
    ctx.fillRegion({ x: texX, y: topBand.y, w: texW, h: topBand.h });
    block(ctx, botBand, palette.primary);
    const bundle = textBundle(ctx);
    if (!bundle) {
      const bw = W * rng.range(0.42, 0.56);
      const bh = (botBand.y - topBand.h) * rng.range(0.7, 0.95);
      const bx = rtl ? W - bw : 0;
      ctx.fillRegion({ x: bx, y: topBand.y + topBand.h + (botBand.y - topBand.h - bh) * 0.5, w: bw, h: bh });
      block(
        ctx,
        { x: rtl ? botBand.x : W - W * 0.3, y: botBand.y, w: W * 0.3, h: botBand.h },
        accent
      );
      return;
    }
    const weight = heavyWeight(ctx);
    const m = Math.min(W, H) * 0.05;
    drawHeadline(
      ctx,
      { x: rtl ? texX - m : m, y: topBand.y + topBand.h * 0.12, w: topBand.w * 0.6, h: topBand.h * 0.62 },
      bundle.headline,
      textStyle(ctx, displaySize(ctx, rng.range(0.16, 0.22)), weight),
      {
        mode: "bleed",
        backing: true,
        bg: palette.background,
        fill: palette.primary,
        align: startAlign
      }
    );
    drawLine(
      ctx,
      rtl ? texX - m : m,
      topBand.y + topBand.h * 0.92,
      `${bundle.sub} \xB7 ${bundle.label}`,
      textStyle(ctx, displaySize(ctx, 0.022), weight),
      { bg: palette.background, fill: palette.text, anchor: startAlign }
    );
    const midBand = { x: 0, y: topBand.y + topBand.h, w: W, h: botBand.y - (topBand.y + topBand.h) };
    const copyW = midBand.w * 0.42;
    const copyX = rtl ? midBand.x + m : midBand.x + midBand.w - copyW - m;
    const copyRect = {
      x: copyX,
      y: midBand.y + midBand.h * 0.18,
      w: copyW,
      h: midBand.h * 0.64
    };
    block(ctx, inset(copyRect, -m * 0.4), palette.background);
    drawParagraph(
      ctx,
      copyRect,
      bundle.body.join("  "),
      textStyle(ctx, displaySize(ctx, 0.02)),
      { bg: palette.background, fill: palette.text, anchor: rtl ? "end" : "start", lineHeight: 1.4 }
    );
    const cta = `${bundle.english ?? bundle.sub} ${bundle.label}`;
    drawHeadline(
      ctx,
      { x: botBand.x + m, y: botBand.y + botBand.h * 0.12, w: botBand.w - m * 2, h: botBand.h * 0.76 },
      cta,
      textStyle(ctx, displaySize(ctx, 0.07), weight),
      { bg: palette.primary, fill: palette.background, align: endAlign }
    );
  }
  registerComposition({ name: "z-pattern", weight: 2, render: render215 });

  // src/typography/fonts.ts
  var SANS = [
    { family: "Helvetica, Arial, sans-serif", weights: [400, 700], widthRatio: 0.52 },
    { family: '"Arial Narrow", Arial, sans-serif', weights: [400, 700], widthRatio: 0.42 },
    { family: "Verdana, Geneva, sans-serif", weights: [400, 700], widthRatio: 0.6 },
    { family: '"Trebuchet MS", sans-serif', weights: [400, 700], widthRatio: 0.5 },
    { family: "system-ui, sans-serif", weights: [400, 600, 800], widthRatio: 0.52 },
    { family: 'Impact, "Haettenschweiler", sans-serif', weights: [400], widthRatio: 0.45 }
  ];
  var SERIF = [
    { family: 'Georgia, "Times New Roman", serif', weights: [400, 700], widthRatio: 0.5 },
    { family: '"Times New Roman", Times, serif', weights: [400, 700], widthRatio: 0.48 },
    { family: '"Palatino Linotype", Palatino, serif', weights: [400, 700], widthRatio: 0.52 },
    { family: 'Didot, "Bodoni MT", Georgia, serif', weights: [400, 700], widthRatio: 0.5 }
  ];
  var MONO = [
    { family: '"Courier New", Courier, monospace', weights: [400, 700], widthRatio: 0.6 },
    { family: '"Lucida Console", Monaco, monospace', weights: [400], widthRatio: 0.6 },
    { family: "ui-monospace, monospace", weights: [400, 700], widthRatio: 0.6 }
  ];
  var GENERIC_SANS = { family: "sans-serif", weights: [400, 700], widthRatio: 0.95 };
  var GENERIC_SERIF = { family: "serif", weights: [400, 700], widthRatio: 0.95 };
  function pickFont(rng, script) {
    if (script.name === "latin") {
      const group = rng.weighted([SANS, SERIF, MONO], [5, 3, 1]);
      return rng.pick(group);
    }
    const base = rng.chance(0.6) ? GENERIC_SANS : GENERIC_SERIF;
    return { ...base, widthRatio: script.fullWidth ? 1 : 0.7 };
  }

  // src/design.ts
  function chooseText(rng) {
    const script = rng.weighted(
      SCRIPTS,
      SCRIPTS.map((s) => s.weight ?? 1)
    );
    return {
      enabled: rng.chance(0.9),
      script: script.name,
      withEnglish: script.name !== "latin" && rng.chance(0.4),
      font: pickFont(rng, script)
    };
  }
  function buildDesign(seed, width, height) {
    const rng = makeRng(seed);
    const root = createRoot(width, height);
    const ctx = new Context({
      rng,
      width,
      height,
      palette: generatePalette(rng),
      text: chooseText(rng),
      root
    });
    const composition = pickComposition(rng);
    root.setAttribute("data-composition", composition.name);
    composition.render(ctx);
    return root;
  }

  // src/gallery.ts
  function param(name, fallback) {
    const v = new URLSearchParams(location.search).get(name);
    const n = v === null ? NaN : Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  function showcaseGenerators(w, h, cols) {
    const grid = document.createElement("div");
    grid.style.cssText = `display:grid;gap:10px;padding:10px;grid-template-columns:repeat(${cols}, ${w}px);background:#222`;
    const from = param("from", 0);
    const count = param("count", 1e3);
    for (const gen of allGenerators().slice(from, from + count)) {
      const rng = makeRng(`gen-${gen.name}`);
      const root = createRoot(w, h);
      const ctx = new Context({
        rng,
        width: w,
        height: h,
        palette: generatePalette(rng),
        text: { enabled: false, script: "latin", withEnglish: false, font: pickFont(rng, scriptByName("latin")) },
        root
      });
      root.appendChild(ctx.fillRegion({ x: 0, y: 0, w, h }, void 0, gen.name));
      root.setAttribute("width", String(w));
      root.setAttribute("height", String(h));
      const cell = document.createElement("div");
      cell.style.cssText = "position:relative;outline:1px solid #444";
      cell.appendChild(root);
      const tag = document.createElement("div");
      tag.textContent = `${gen.name} (${gen.category})`;
      tag.style.cssText = "position:absolute;bottom:2px;left:4px;font:10px monospace;color:#fff;background:rgba(0,0,0,.6);padding:0 3px";
      cell.appendChild(tag);
      grid.appendChild(cell);
    }
    document.body.appendChild(grid);
  }
  function showcaseCompositions(w, h, cols, textEnabled) {
    const grid = document.createElement("div");
    grid.style.cssText = `display:grid;gap:10px;padding:10px;grid-template-columns:repeat(${cols}, ${w}px);background:#222`;
    const from = param("from", 0);
    const count = param("count", 1e3);
    for (const comp of allCompositions().slice(from, from + count)) {
      const rng = makeRng(`comp-${comp.name}`);
      const root = createRoot(w, h);
      const ctx = new Context({
        rng,
        width: w,
        height: h,
        palette: generatePalette(rng),
        text: { enabled: textEnabled, script: "japanese", withEnglish: false, font: pickFont(rng, scriptByName("japanese")) },
        root
      });
      comp.render(ctx);
      root.setAttribute("width", String(w));
      root.setAttribute("height", String(h));
      const cell = document.createElement("div");
      cell.style.cssText = "position:relative;outline:1px solid #444";
      cell.appendChild(root);
      const tag = document.createElement("div");
      tag.textContent = comp.name + (textEnabled ? "" : " (no text)");
      tag.style.cssText = "position:absolute;bottom:2px;left:4px;font:10px monospace;color:#fff;background:rgba(0,0,0,.6);padding:0 3px";
      cell.appendChild(tag);
      grid.appendChild(cell);
    }
    document.body.appendChild(grid);
  }
  function init() {
    const params = new URLSearchParams(location.search);
    const w = param("w", 420);
    const h = param("h", 300);
    const shot = params.get("shot");
    if (shot) {
      document.body.style.margin = "0";
      const svg = buildDesign(shot, w, h);
      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.style.display = "block";
      document.body.appendChild(svg);
      return;
    }
    if (params.get("gens") !== null) {
      showcaseGenerators(w, h, param("cols", 4));
      return;
    }
    if (params.get("comps") !== null) {
      showcaseCompositions(w, h, param("cols", 4), params.get("notext") === null);
      return;
    }
    const exacts = params.get("exacts");
    if (exacts) {
      const cols2 = param("cols", 2);
      const grid2 = document.createElement("div");
      grid2.style.cssText = `display:grid;gap:10px;padding:10px;grid-template-columns:repeat(${cols2}, ${w}px);background:#222`;
      for (const seed of exacts.split(",")) {
        const svg = buildDesign(seed, w, h);
        svg.setAttribute("width", String(w));
        svg.setAttribute("height", String(h));
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        const cell = document.createElement("div");
        cell.style.cssText = "position:relative;outline:1px solid #444";
        cell.appendChild(svg);
        const tag = document.createElement("div");
        tag.textContent = `${seed}  [${svg.getAttribute("data-composition") ?? "?"}]`;
        tag.style.cssText = "position:absolute;bottom:2px;right:4px;font:11px monospace;color:#fff;background:rgba(0,0,0,.6);padding:0 3px";
        cell.appendChild(tag);
        grid2.appendChild(cell);
      }
      document.body.appendChild(grid2);
      return;
    }
    const exact = params.get("exact");
    const cols = exact ? 1 : param("cols", 4);
    const rows2 = exact ? 1 : param("rows", 3);
    const seedBase = params.get("seed") ?? "gallery";
    const grid = document.createElement("div");
    grid.style.cssText = `display:grid;gap:10px;padding:10px;grid-template-columns:repeat(${cols}, ${w}px);background:#222`;
    for (let i = 0; i < cols * rows2; i++) {
      const seed = exact ?? `${seedBase}-${i}`;
      const svg = buildDesign(seed, w, h);
      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      const cell = document.createElement("div");
      cell.style.cssText = "position:relative;outline:1px solid #444";
      cell.appendChild(svg);
      const tag = document.createElement("div");
      tag.textContent = seed;
      tag.style.cssText = "position:absolute;bottom:2px;right:4px;font:10px monospace;color:#fff;background:rgba(0,0,0,.5);padding:0 3px";
      cell.appendChild(tag);
      grid.appendChild(cell);
    }
    document.body.appendChild(grid);
  }
  init();
})();
//# sourceMappingURL=gallery.js.map
