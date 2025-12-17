/**
 * Label Processing Utilities
 * DPI calculations and size conversions
 */

/**
 * Target label size in millimeters
 */
export const TARGET_SIZE_MM = {
  width: 100,
  height: 150,
} as const;

/**
 * Target DPI for label rendering
 */
export const TARGET_DPI = 300;

/**
 * Convert millimeters to pixels at given DPI
 */
export function mmToPixels(mm: number, dpi: number = TARGET_DPI): number {
  // 1 inch = 25.4 mm
  return Math.round((mm / 25.4) * dpi);
}

/**
 * Convert pixels to millimeters at given DPI
 */
export function pixelsToMm(pixels: number, dpi: number = TARGET_DPI): number {
  return (pixels * 25.4) / dpi;
}

/**
 * Get target label dimensions in pixels
 */
export function getTargetPixelDimensions(): {
  width: number;
  height: number;
} {
  return {
    width: mmToPixels(TARGET_SIZE_MM.width),
    height: mmToPixels(TARGET_SIZE_MM.height),
  };
}

/**
 * Calculate scaling factor to fit source dimensions into target
 * while maintaining aspect ratio
 */
export function calculateFitScale(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): number {
  const widthScale = targetWidth / sourceWidth;
  const heightScale = targetHeight / sourceHeight;

  // Use the smaller scale to ensure it fits
  return Math.min(widthScale, heightScale);
}

/**
 * Calculate centered position for scaled content
 */
export function calculateCenteredPosition(
  scaledWidth: number,
  scaledHeight: number,
  targetWidth: number,
  targetHeight: number
): { x: number; y: number } {
  return {
    x: (targetWidth - scaledWidth) / 2,
    y: (targetHeight - scaledHeight) / 2,
  };
}

/**
 * Footer height in millimeters
 */
export const FOOTER_HEIGHT_MM = 10;

/**
 * Get footer height in pixels
 */
export function getFooterHeightPixels(): number {
  return mmToPixels(FOOTER_HEIGHT_MM);
}

/**
 * Get content area height (label height minus footer)
 */
export function getContentHeightPixels(): number {
  const totalHeight = mmToPixels(TARGET_SIZE_MM.height);
  const footerHeight = getFooterHeightPixels();
  return totalHeight - footerHeight;
}
