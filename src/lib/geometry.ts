export const ROW_H = 34;

const PX_PER_INCH = 24;
const MIN_WIDTH_PX = 180;
const MAX_WIDTH_PX = 960;

export function rackWidthPx(inches: number): number {
  return Math.min(MAX_WIDTH_PX, Math.max(MIN_WIDTH_PX, inches * PX_PER_INCH));
}
