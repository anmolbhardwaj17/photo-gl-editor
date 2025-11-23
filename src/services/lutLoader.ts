/**
 * 3D LUT loader and parser for .cube format
 */

export interface LUTData {
  data: Float32Array
  size: number
}

/**
 * Parse a .cube LUT file
 * Returns a Float32Array of RGB values in linear space
 */
export async function parseCubeLUT(cubeText: string): Promise<LUTData> {
  const lines = cubeText.split('\n').map((line) => line.trim())
  let lutSize = 0
  const data: number[] = []

  // Parse header
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('LUT_3D_SIZE')) {
      const match = line.match(/LUT_3D_SIZE\s+(\d+)/)
      if (match) {
        lutSize = parseInt(match[1], 10)
      }
    }
    if (line.startsWith('0.') || line.startsWith('1.') || line.match(/^\d+\.\d+/)) {
      // Parse RGB values
      const values = line.split(/\s+/).filter((v) => v.length > 0)
      if (values.length >= 3) {
        const r = parseFloat(values[0])
        const g = parseFloat(values[1])
        const b = parseFloat(values[2])
        // Assume values are in sRGB, convert to linear
        data.push(r, g, b)
      }
    }
  }

  if (lutSize === 0) {
    // Try to infer from data length
    lutSize = Math.round(Math.pow(data.length / 3, 1 / 3))
  }

  if (data.length !== lutSize * lutSize * lutSize * 3) {
    throw new Error(`Invalid LUT data: expected ${lutSize * lutSize * lutSize * 3} values, got ${data.length}`)
  }

  return {
    data: new Float32Array(data),
    size: lutSize,
  }
}

/**
 * Load a .cube LUT file from URL
 */
export async function loadCubeLUT(url: string): Promise<LUTData> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load LUT: ${response.statusText}`)
  }
  const text = await response.text()
  return parseCubeLUT(text)
}

/**
 * Convert LUT data to 2D texture format for WebGL
 * Flattens 3D LUT into 2D texture: size² × size
 */
export function lutTo2DTexture(lutData: LUTData): {
  data: Float32Array
  width: number
  height: number
} {
  const { data, size } = lutData
  const width = size * size
  const height = size
  const textureData = new Float32Array(width * height * 3)

  for (let b = 0; b < size; b++) {
    for (let g = 0; g < size; g++) {
      for (let r = 0; r < size; r++) {
        const srcIndex = (b * size * size + g * size + r) * 3
        const dstX = g * size + r
        const dstY = b
        const dstIndex = (dstY * width + dstX) * 3

        textureData[dstIndex] = data[srcIndex]
        textureData[dstIndex + 1] = data[srcIndex + 1]
        textureData[dstIndex + 2] = data[srcIndex + 2]
      }
    }
  }

  return {
    data: textureData,
    width,
    height,
  }
}

/**
 * Create WebGL texture from LUT data
 */
export function createLUTTexture(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  lutData: LUTData
): WebGLTexture | null {
  const texture = gl.createTexture()
  if (!texture) return null

  const { data, width, height } = lutTo2DTexture(lutData)

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.FLOAT, data)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  return texture
}

