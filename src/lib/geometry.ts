export const BASE_ROW_H = 34;
export const MIN_ROW_H = 26;
export const MAX_ROW_H = 64;

const BASE_PX_PER_INCH = 24;
const BASE_MIN_WIDTH_PX = 180;
const BASE_MAX_WIDTH_PX = 960;

/** Pick a row height that fills the available vertical space, so a short
 * rack doesn't render tiny on a tall page while a long one still fits. */
export function fitRowH(heightU: number, availableHeight: number): number {
  if (!Number.isFinite(availableHeight) || availableHeight <= 0) return BASE_ROW_H;
  const fit = Math.floor(availableHeight / Math.max(1, heightU));
  return Math.min(MAX_ROW_H, Math.max(MIN_ROW_H, fit));
}

export function rackWidthPx(inches: number, rowH: number = BASE_ROW_H): number {
  const scale = rowH / BASE_ROW_H;
  const pxPerInch = BASE_PX_PER_INCH * scale;
  return Math.min(
    BASE_MAX_WIDTH_PX * scale,
    Math.max(BASE_MIN_WIDTH_PX * scale, inches * pxPerInch),
  );
}
