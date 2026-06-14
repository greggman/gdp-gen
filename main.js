"use strict";
(() => {
  // src/core/renderer.ts
  var SVG_NS = "http://www.w3.org/2000/svg";
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
      preserveAspectRatio: "xMidYMid meet"
    });
    svg.setAttribute("xmlns", SVG_NS);
    return svg;
  }
  function mount(stage, svg) {
    stage.replaceChildren(svg);
  }

  // src/core/registry.ts
  var generators = [];
  function weightsOf(items) {
    return items.map((i) => i.weight ?? 1);
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

  // src/main.ts
  var WIDTH = 1e3;
  var HEIGHT = 1414;
  function newSeed() {
    return (Date.now() >>> 0).toString(36) + Math.floor(performance.now()).toString(36);
  }
  function placeholderPalette(rng) {
    const hue = rng.int(0, 359);
    const background = `hsl(${hue} 70% 92%)`;
    const primary = `hsl(${hue} 65% 35%)`;
    const accent = `hsl(${(hue + 150) % 360} 80% 50%)`;
    return {
      scheme: "placeholder",
      colors: [background, primary, accent],
      background,
      primary,
      accent,
      text: `hsl(${hue} 70% 12%)`,
      backgroundIsDark: false
    };
  }
  function placeholderText() {
    return {
      enabled: true,
      script: "latin",
      withEnglish: false,
      font: { family: "system-ui, sans-serif", weights: [400, 700], widthRatio: 0.5 }
    };
  }
  function generate(seed = newSeed()) {
    location.hash = seed;
    const rng = makeRng(seed);
    const root = createRoot(WIDTH, HEIGHT);
    const ctx = new Context({
      rng,
      width: WIDTH,
      height: HEIGHT,
      palette: placeholderPalette(rng),
      text: placeholderText(),
      root
    });
    root.appendChild(ctx.el("rect", { width: WIDTH, height: HEIGHT, fill: ctx.palette.background }));
    for (let i = 0; i < 3; i++) {
      root.appendChild(
        ctx.el("rect", {
          x: ctx.rng.range(60, 400),
          y: 200 + i * 260,
          width: ctx.rng.range(200, 700),
          height: ctx.rng.range(20, 120),
          fill: i === 1 ? ctx.palette.accent : ctx.palette.primary
        })
      );
    }
    const title = ctx.el("text", {
      x: 80,
      y: HEIGHT - 140,
      "font-family": ctx.text.font.family,
      "font-size": 120,
      "font-weight": 700,
      fill: ctx.palette.text
    });
    title.textContent = "POSTER";
    root.appendChild(title);
    const stage = document.getElementById("stage");
    if (stage) mount(stage, root);
  }
  function init() {
    const button = document.getElementById("refresh");
    button?.addEventListener("click", () => generate());
    const seed = location.hash.slice(1);
    generate(seed || void 0);
  }
  init();
})();
//# sourceMappingURL=main.js.map
