import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'

export function Histogram() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageMeta = useSelector((state: RootState) => state.editor.imageMeta)
  const params = useSelector((state: RootState) => state.editor.params)
  const activeSimulationId = useSelector((state: RootState) => state.editor.activeSimulationId)
  const simulations = useSelector((state: RootState) => state.simulations.simulations)
  const [histogramData, setHistogramData] = useState<{
    r: number[]
    g: number[]
    b: number[]
    luminance: number[]
  } | null>(null)

  // Get active simulation's LUT data
  const activeSimulation = simulations.find((p: { id: string }) => p.id === activeSimulationId)
  const lutData = activeSimulation?.lutData
  const lutSize = activeSimulation?.lutSize || 0

  useEffect(() => {
    if (!imageMeta) {
      setHistogramData(null)
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      // Use smaller size for histogram calculation for performance
      const maxSize = 800
      let width = img.width
      let height = img.height
      if (width > maxSize || height > maxSize) {
        const scale = Math.min(maxSize / width, maxSize / height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      ctx.drawImage(img, 0, 0, width, height)
      
      // Apply the same adjustments as EditorCanvas
      const hasAdjustments = params.exposure !== 0 || params.contrast !== 0 || params.wbTemp !== 5500 || params.wbTint !== 0
      const hasHSL = params.hsl.hue !== 0 || params.hsl.saturation !== 0 || params.hsl.luminance !== 0
      const hasLUT = lutData && lutSize > 0

      if (hasAdjustments || hasHSL || hasLUT) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Helper functions for RGB to HSL conversion
        const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
          r /= 255.0
          g /= 255.0
          b /= 255.0
          
          const max = Math.max(r, g, b)
          const min = Math.min(r, g, b)
          let h = 0, s = 0, l = (max + min) / 2.0
          
          if (max !== min) {
            const d = max - min
            s = l > 0.5 ? d / (2.0 - max - min) : d / (max + min)
            
            if (max === r) {
              h = ((g - b) / d + (g < b ? 6 : 0)) / 6.0
            } else if (max === g) {
              h = ((b - r) / d + 2) / 6.0
            } else {
              h = ((r - g) / d + 4) / 6.0
            }
          }
          
          return [h * 360, s, l]
        }
        
        // Helper function for HSL to RGB conversion
        const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
          h = h % 360
          if (h < 0) h += 360
          h /= 360.0
          
          let r, g, b
          
          if (s === 0) {
            r = g = b = l
          } else {
            const hue2rgb = (p: number, q: number, t: number) => {
              if (t < 0) t += 1
              if (t > 1) t -= 1
              if (t < 1/6) return p + (q - p) * 6 * t
              if (t < 1/2) return q
              if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
              return p
            }
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s
            const p = 2 * l - q
            r = hue2rgb(p, q, h + 1/3)
            g = hue2rgb(p, q, h)
            b = hue2rgb(p, q, h - 1/3)
          }
          
          return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
        }

        // Calculate white balance multipliers (same logic as EditorCanvas)
        let wbR = 1.0, wbG = 1.0, wbB = 1.0
        if (params.wbTemp !== 5500 || params.wbTint !== 0) {
          const tempToRGB = (temp: number) => {
            const t = temp / 100.0
            let r = 1.0, g = 1.0, b = 1.0
            
            if (t <= 66.0) {
              r = 1.0
              g = (99.4708025861 * Math.log(t) - 161.1195681661) / 255.0
              g = Math.max(0, Math.min(1, g))
              if (t <= 19.0) {
                b = 0.0
              } else {
                b = (138.5177312231 * Math.log(t - 10.0) - 305.0447927307) / 255.0
                b = Math.max(0, Math.min(1, b))
              }
            } else {
              r = (329.698727446 * Math.pow(t - 60.0, -0.1332047592)) / 255.0
              r = Math.max(0, Math.min(1, r))
              g = (288.1221695283 * Math.pow(t - 60.0, -0.0755148492)) / 255.0
              g = Math.max(0, Math.min(1, g))
              b = 1.0
            }
            return { r, g, b }
          }

          const targetRGB = tempToRGB(params.wbTemp)
          const neutralRGB = tempToRGB(5500)
          wbR = neutralRGB.r / targetRGB.r
          wbG = neutralRGB.g / targetRGB.g
          wbB = neutralRGB.b / targetRGB.b

          const tintFactor = params.wbTint / 100.0
          wbG -= tintFactor * 0.1
          wbR += tintFactor * 0.05
          wbB += tintFactor * 0.05
        }

        // LUT lookup function (same as EditorCanvas)
        const lookupLUT = (r: number, g: number, b: number, lut: Float32Array, size: number): [number, number, number] => {
          r = Math.max(0, Math.min(1, r))
          g = Math.max(0, Math.min(1, g))
          b = Math.max(0, Math.min(1, b))
          
          const scale = (size - 1) / size
          const offset = 1 / (2 * size)
          const rScaled = r * scale + offset
          const gScaled = g * scale + offset
          const bScaled = b * scale + offset
          
          const rIdx = rScaled * (size - 1)
          const gIdx = gScaled * (size - 1)
          const bIdx = bScaled * (size - 1)
          
          const r0 = Math.floor(rIdx)
          const g0 = Math.floor(gIdx)
          const b0 = Math.floor(bIdx)
          
          const r1 = Math.min(r0 + 1, size - 1)
          const g1 = Math.min(g0 + 1, size - 1)
          const b1 = Math.min(b0 + 1, size - 1)
          
          const rFrac = rIdx - r0
          const gFrac = gIdx - g0
          const bFrac = bIdx - b0
          
          const getLUTValue = (ri: number, gi: number, bi: number): [number, number, number] => {
            const index = (bi * size * size + gi * size + ri) * 3
            return [lut[index], lut[index + 1], lut[index + 2]]
          }
          
          const c000 = getLUTValue(r0, g0, b0)
          const c001 = getLUTValue(r0, g0, b1)
          const c010 = getLUTValue(r0, g1, b0)
          const c011 = getLUTValue(r0, g1, b1)
          const c100 = getLUTValue(r1, g0, b0)
          const c101 = getLUTValue(r1, g0, b1)
          const c110 = getLUTValue(r1, g1, b0)
          const c111 = getLUTValue(r1, g1, b1)
          
          const c00 = [
            c000[0] * (1 - rFrac) + c100[0] * rFrac,
            c000[1] * (1 - rFrac) + c100[1] * rFrac,
            c000[2] * (1 - rFrac) + c100[2] * rFrac,
          ]
          const c01 = [
            c001[0] * (1 - rFrac) + c101[0] * rFrac,
            c001[1] * (1 - rFrac) + c101[1] * rFrac,
            c001[2] * (1 - rFrac) + c101[2] * rFrac,
          ]
          const c10 = [
            c010[0] * (1 - rFrac) + c110[0] * rFrac,
            c010[1] * (1 - rFrac) + c110[1] * rFrac,
            c010[2] * (1 - rFrac) + c110[2] * rFrac,
          ]
          const c11 = [
            c011[0] * (1 - rFrac) + c111[0] * rFrac,
            c011[1] * (1 - rFrac) + c111[1] * rFrac,
            c011[2] * (1 - rFrac) + c111[2] * rFrac,
          ]
          
          const c0 = [
            c00[0] * (1 - gFrac) + c10[0] * gFrac,
            c00[1] * (1 - gFrac) + c10[1] * gFrac,
            c00[2] * (1 - gFrac) + c10[2] * gFrac,
          ]
          const c1 = [
            c01[0] * (1 - gFrac) + c11[0] * gFrac,
            c01[1] * (1 - gFrac) + c11[1] * gFrac,
            c01[2] * (1 - gFrac) + c11[2] * gFrac,
          ]
          
          return [
            c0[0] * (1 - bFrac) + c1[0] * bFrac,
            c0[1] * (1 - bFrac) + c1[1] * bFrac,
            c0[2] * (1 - bFrac) + c1[2] * bFrac,
          ]
        }

        // Process pixels
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i] / 255.0
          let g = data[i + 1] / 255.0
          let b = data[i + 2] / 255.0

          if (hasAdjustments) {
            r *= wbR
            g *= wbG
            b *= wbB

            r = Math.max(0, Math.min(1, r)) * 255.0
            g = Math.max(0, Math.min(1, g)) * 255.0
            b = Math.max(0, Math.min(1, b)) * 255.0

            const exposureMult = Math.pow(2, params.exposure)
            r = Math.min(255, r * exposureMult)
            g = Math.min(255, g * exposureMult)
            b = Math.min(255, b * exposureMult)

            const contrast = params.contrast / 100
            r = Math.min(255, Math.max(0, (r - 128) * (1 + contrast) + 128))
            g = Math.min(255, Math.max(0, (g - 128) * (1 + contrast) + 128))
            b = Math.min(255, Math.max(0, (b - 128) * (1 + contrast) + 128))
          } else {
            r = r * 255.0
            g = g * 255.0
            b = b * 255.0
          }
          
          // Apply HSL adjustments if needed
          if (hasHSL) {
            // Convert RGB to HSL
            const [h, s, l] = rgbToHsl(r, g, b)
            
            // Apply HSL adjustments
            let newH = h + params.hsl.hue
            // Saturation: multiplicative (0 = grayscale, 100 = 2x saturation)
            let newS = s * (1.0 + params.hsl.saturation / 100.0)
            // Luminance: additive
            let newL = l + (params.hsl.luminance / 100.0)
            
            // Clamp values
            newH = ((newH % 360) + 360) % 360 // Wrap hue
            newS = Math.max(0, Math.min(1, newS))
            newL = Math.max(0, Math.min(1, newL))
            
            // Convert back to RGB
            const [rNew, gNew, bNew] = hslToRgb(newH, newS, newL)
            r = rNew
            g = gNew
            b = bNew
          }

          if (lutData && lutSize > 0) {
            const rNorm = r / 255.0
            const gNorm = g / 255.0
            const bNorm = b / 255.0
            
            const [rLut, gLut, bLut] = lookupLUT(rNorm, gNorm, bNorm, lutData, lutSize)
            
            r = Math.max(0, Math.min(255, rLut * 255.0))
            g = Math.max(0, Math.min(255, gLut * 255.0))
            b = Math.max(0, Math.min(255, bLut * 255.0))
          }

          data[i] = r
          data[i + 1] = g
          data[i + 2] = b
        }

        ctx.putImageData(imageData, 0, 0)
      }

      // Calculate histogram from processed image
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      const r = new Array(256).fill(0)
      const g = new Array(256).fill(0)
      const b = new Array(256).fill(0)
      const luminance = new Array(256).fill(0)

      for (let i = 0; i < data.length; i += 4) {
        const rVal = Math.round(data[i])
        const gVal = Math.round(data[i + 1])
        const bVal = Math.round(data[i + 2])
        const lum = Math.round(0.299 * rVal + 0.587 * gVal + 0.114 * bVal)

        const rIdx = Math.max(0, Math.min(255, rVal))
        const gIdx = Math.max(0, Math.min(255, gVal))
        const bIdx = Math.max(0, Math.min(255, bVal))
        const lumIdx = Math.max(0, Math.min(255, lum))

        r[rIdx]++
        g[gIdx]++
        b[bIdx]++
        luminance[lumIdx]++
      }

      // Normalize
      const max = Math.max(...r, ...g, ...b, ...luminance)
      if (max > 0) {
        for (let i = 0; i < 256; i++) {
          r[i] /= max
          g[i] /= max
          b[i] /= max
          luminance[i] /= max
        }
      }

      setHistogramData({ r, g, b, luminance })
    }
    img.src = imageMeta.url
  }, [imageMeta, params.exposure, params.contrast, params.wbTemp, params.wbTint, params.hsl, activeSimulationId, lutData, lutSize])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !histogramData) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear - transparent background to match sidebar
    ctx.clearRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = '#404040'
    ctx.lineWidth = 0.5
    
    // Vertical grid lines (5 divisions)
    for (let i = 0; i <= 5; i++) {
      const x = (i / 5) * width
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    
    // Horizontal grid lines (4 divisions)
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * height
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Draw luminance histogram
    ctx.strokeStyle = '#999999'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i < 256; i++) {
      const x = (i / 255) * width
      const y = height - histogramData.luminance[i] * height
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()

    // Draw RGB parade
    const barWidth = width / 3
    const colors = [
      { data: histogramData.r, color: '#ff0000' },
      { data: histogramData.g, color: '#00ff00' },
      { data: histogramData.b, color: '#0000ff' },
    ]

    colors.forEach((channel, idx) => {
      ctx.strokeStyle = channel.color
      ctx.beginPath()
      for (let i = 0; i < 256; i++) {
        const x = idx * barWidth + (i / 255) * barWidth
        const y = height - channel.data[i] * height
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()
    })
  }, [histogramData])

  if (!imageMeta) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Upload an image to see histogram</p>
      </div>
    )
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        className="w-full rounded"
        aria-label="Image histogram"
      />
    </div>
  )
}

