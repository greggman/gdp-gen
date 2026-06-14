/** Low-level SVG element creation and mounting. */

const SVG_NS = 'http://www.w3.org/2000/svg';

let idCounter = 0;

/** A short unique id for clip paths, gradients, etc. within the document. */
export function uid(prefix = 'id'): string {
  return `${prefix}-${(idCounter++).toString(36)}`;
}

/** Creates an SVG element of the given tag with attributes applied. */
export function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, String(v));
    }
  }
  return el;
}

/** Creates a root <svg> sized to a viewBox of width x height. */
export function createRoot(width: number, height: number): SVGSVGElement {
  const svg = svgEl('svg', {
    viewBox: `0 0 ${width} ${height}`,
    // Cover the viewport (crop overflow) rather than letterbox, so a design
    // generated at one size still fills the page after a resize.
    preserveAspectRatio: 'xMidYMid slice',
  });
  svg.setAttribute('xmlns', SVG_NS);
  return svg;
}

/** Replaces the contents of the stage element with `svg`. */
export function mount(stage: Element, svg: SVGSVGElement): void {
  stage.replaceChildren(svg);
}
