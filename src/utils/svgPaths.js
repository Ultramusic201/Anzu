// SVG path helpers for arcs and donut segments
// Applies SRP: math and path generation only; no rendering concerns

/** Convert polar coordinates to cartesian */
export function polarToCartesian(cx, cy, r, angle) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

/** Create a filled arc path from center */
export function arcPath(cx, cy, r, start, end) {
  const startP = polarToCartesian(cx, cy, r, start);
  const endP = polarToCartesian(cx, cy, r, end);
  const largeArc = end - start > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${startP.x} ${startP.y} A ${r} ${r} 0 ${largeArc} 1 ${endP.x} ${endP.y} Z`;
}

/** Create a stroked arc path (no center lines) */
export function arcStroke(cx, cy, r, start, end) {
  const startP = polarToCartesian(cx, cy, r, start);
  const endP = polarToCartesian(cx, cy, r, end);
  const largeArc = end - start > Math.PI ? 1 : 0;
  return `M ${startP.x} ${startP.y} A ${r} ${r} 0 ${largeArc} 1 ${endP.x} ${endP.y}`;
}

/**
 * Build a donut segment path between outer and inner radii
 * Ensures correct winding and arc flags to draw a ring slice
 */
export function donutSegmentPath(cx, cy, rOuter, rInner, start, end) {
  const largeArc = end - start > Math.PI ? 1 : 0;
  const oStart = polarToCartesian(cx, cy, rOuter, start);
  const oEnd = polarToCartesian(cx, cy, rOuter, end);
  const iEnd = polarToCartesian(cx, cy, rInner, end);
  const iStart = polarToCartesian(cx, cy, rInner, start);
  return [
    `M ${oStart.x} ${oStart.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${oEnd.x} ${oEnd.y}`,
    `L ${iEnd.x} ${iEnd.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${iStart.x} ${iStart.y}`,
    "Z",
  ].join(" ");
}
