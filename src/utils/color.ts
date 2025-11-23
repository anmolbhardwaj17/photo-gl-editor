/**
 * Color space conversion utilities
 */

/**
 * Convert sRGB to linear RGB
 */
export function srgbToLinear(c: number): number {
  if (c <= 0.04045) {
    return c / 12.92
  }
  return Math.pow((c + 0.055) / 1.055, 2.4)
}

/**
 * Convert linear RGB to sRGB
 */
export function linearToSrgb(c: number): number {
  if (c <= 0.0031308) {
    return 12.92 * c
  }
  return 1.055 * Math.pow(c, 1.0 / 2.4) - 0.055
}

/**
 * Convert RGB array from sRGB to linear
 */
export function srgbToLinearArray(rgb: [number, number, number]): [number, number, number] {
  return [
    srgbToLinear(rgb[0]),
    srgbToLinear(rgb[1]),
    srgbToLinear(rgb[2]),
  ]
}

/**
 * Convert RGB array from linear to sRGB
 */
export function linearToSrgbArray(rgb: [number, number, number]): [number, number, number] {
  return [
    linearToSrgb(rgb[0]),
    linearToSrgb(rgb[1]),
    linearToSrgb(rgb[2]),
  ]
}

/**
 * Clamp value between 0 and 1
 */
export function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Apply ordered dithering to reduce banding
 * Simple Bayer matrix dithering
 */
export function dither(value: number, x: number, y: number, strength = 0.5): number {
  const bayerMatrix = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ]
  const threshold = (bayerMatrix[y % 4][x % 4] / 16 - 0.5) * strength
  return clamp(value + threshold)
}

/**
 * White balance temperature to RGB multiplier
 * Based on approximate color temperature conversion
 */
export function temperatureToRGB(temp: number): [number, number, number] {
  const t = temp / 100.0
  let r = 0
  let g = 0
  let b = 0

  // Red
  if (t <= 66) {
    r = 255
  } else {
    r = t - 60
    r = 329.698727446 * Math.pow(r, -0.1332047592)
    r = Math.max(0, Math.min(255, r))
  }

  // Green
  if (t <= 66) {
    g = t
    g = 99.4708025861 * Math.log(g) - 161.1195681661
    g = Math.max(0, Math.min(255, g))
  } else {
    g = t - 60
    g = 288.1221695283 * Math.pow(g, -0.0755148492)
    g = Math.max(0, Math.min(255, g))
  }

  // Blue
  if (t >= 66) {
    b = 255
  } else {
    if (t <= 19) {
      b = 0
    } else {
      b = t - 10
      b = 138.5177312231 * Math.log(b) - 305.0447927307
      b = Math.max(0, Math.min(255, b))
    }
  }

  return [r / 255, g / 255, b / 255]
}

