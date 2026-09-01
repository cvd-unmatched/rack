export const BASE_ROW_H = 34;
export const MIN_ROW_H = 22;
export const MAX_ROW_H = 150;

export const BASE_PX_PER_INCH = 24;
const MIN_PX_PER_INCH = 14;
const MAX_PX_PER_INCH = 90;

const OUTER_PADDING = 64; // px-8 on the RackView container, both sides
const PER_ELEVATION_CHROME_W = 50; // rails + U ruler + border, one elevation
const COLUMN_GAP = 40; // gap-10 between the two elevations, only when side by side
const MIN_COLUMN_WIDTH = 160; // below this a rack elevation stops being readable

const V_CHROME_PER_ELEVATION = 30; // "FRONT"/"REAR" label + its margin, one elevation
const INFO_LINE = 36; // the "My Rack · 12U · 19in rail" line, shown once regardless of columns
const BOTTOM_BREATHING_ROOM = 56; // deliberate gap so the rack doesn't butt against the edge

export function rackWidthPx(widthIn: number, pxPerInch: number = BASE_PX_PER_INCH): number {
  return widthIn * pxPerInch;
}

/** Front and rear render side by side (RackView.tsx uses flex-wrap) until
 * there isn't room for two readable columns, at which point they stack. Both
 * fit functions need to agree on this so height/width scale consistently. */
function columnCount(containerWidth: number): 1 | 2 {
  const twoColumnWidth = containerWidth - OUTER_PADDING - COLUMN_GAP - PER_ELEVATION_CHROME_W * 2;
  return twoColumnWidth >= MIN_COLUMN_WIDTH * 2 ? 2 : 1;
}

/** Row height that fills the available vertical space, accounting for
 * whether the two elevations are stacked (mobile) or side by side. */
export function fitRowH(heightU: number, containerWidth: number, containerHeight: number): number {
  const columns = columnCount(containerWidth);
  const rows = columns === 2 ? 1 : 2;
  const usableHeight = containerHeight - OUTER_PADDING - BOTTOM_BREATHING_ROOM - INFO_LINE;
  const available = usableHeight / rows - V_CHROME_PER_ELEVATION;
  const fit = available > 0 ? available / Math.max(1, heightU) : BASE_ROW_H;
  return Math.min(MAX_ROW_H, Math.max(MIN_ROW_H, Math.floor(fit)));
}

/** Pixels-per-inch that fills the available horizontal space, accounting for
 * whether the two elevations are stacked (mobile) or side by side. */
export function fitPxPerInch(widthIn: number, containerWidth: number): number {
  const columns = columnCount(containerWidth);
  const chrome = OUTER_PADDING + PER_ELEVATION_CHROME_W * columns + (columns === 2 ? COLUMN_GAP : 0);
  const widthPerElevation = (containerWidth - chrome) / columns;
  const fit = widthIn > 0 && widthPerElevation > 0 ? widthPerElevation / widthIn : BASE_PX_PER_INCH;
  return Math.min(MAX_PX_PER_INCH, Math.max(MIN_PX_PER_INCH, Math.floor(fit)));
}
