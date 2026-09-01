export const BASE_ROW_H = 34;
export const MIN_ROW_H = 22;
export const MAX_ROW_H = 150;

export const BASE_PX_PER_INCH = 24;
const MIN_PX_PER_INCH = 14;
const MAX_PX_PER_INCH = 90;

// Chrome outside the U rows themselves, so the fit calculations below can
// work in terms of the raw RackView container size.
const V_CHROME = 130; // outer padding + info line + elevation label
const H_CHROME = 200; // outer padding + gap between elevations + rails/ruler/borders, both elevations

/** Row height that fills the available vertical space. Independent of width
 * so a narrow rack doesn't get squat rows just because it's narrow. */
export function fitRowH(heightU: number, containerHeight: number): number {
  const fit =
    containerHeight > 0 ? (containerHeight - V_CHROME) / Math.max(1, heightU) : BASE_ROW_H;
  return Math.min(MAX_ROW_H, Math.max(MIN_ROW_H, Math.floor(fit)));
}

/** Pixels-per-inch that fills the available horizontal space (split between
 * the two elevations shown side by side). Independent of row height so a
 * short rack doesn't get narrow panels just because it's short. */
export function fitPxPerInch(widthIn: number, containerWidth: number): number {
  const widthPerElevation = (containerWidth - H_CHROME) / 2;
  const fit = widthIn > 0 && widthPerElevation > 0 ? widthPerElevation / widthIn : BASE_PX_PER_INCH;
  return Math.min(MAX_PX_PER_INCH, Math.max(MIN_PX_PER_INCH, Math.floor(fit)));
}

export function rackWidthPx(widthIn: number, pxPerInch: number = BASE_PX_PER_INCH): number {
  return widthIn * pxPerInch;
}
