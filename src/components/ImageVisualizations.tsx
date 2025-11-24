import { useEffect, useLayoutEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'

type VisualizationType =
  | 'histogram-luminance'
  | 'histogram-rgb'
  | 'histogram-channels'
  | 'waveform-luma'
  | 'waveform-rgb'
  | 'vectorscope'
  | 'scatter-3d'
  | 'entropy'

interface ProcessedImageData {
  data: Uint8ClampedArray
  width: number
  height: number
  r: number[]
  g: number[]
  b: number[]
  luminance: number[]
  hue: number[]
  saturation: number[]
  value: number[]
}

export function ImageVisualizations() {
  const imageMeta = useSelector((state: RootState) => state.editor.imageMeta)
  const params = useSelector((state: RootState) => state.editor.params)
  const activeSimulationId = useSelector((state: RootState) => state.editor.activeSimulationId)
  const simulations = useSelector((state: RootState) => state.simulations.simulations)
  const mobileBottomSheetOpen = useSelector((state: RootState) => state.ui.mobileBottomSheetOpen)
  const mobileBottomSheetHeight = useSelector((state: RootState) => state.ui.mobileBottomSheetHeight)
  const [processedData, setProcessedData] = useState<ProcessedImageData | null>(null)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 768)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(400)

  // Get active simulation's LUT data
  const activeSimulation = simulations.find((p: { id: string }) => p.id === activeSimulationId)
  const lutData = activeSimulation?.lutData
  const lutSize = activeSimulation?.lutSize || 0

  // Track window resize and container size for responsive canvas sizing
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }
    window.addEventListener('resize', handleResize)
    
    // Use ResizeObserver to track container size changes
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width)
        }
      })
      resizeObserver.observe(containerRef.current)
      
      // Initial measurement
      setContainerWidth(containerRef.current.offsetWidth)
      
      return () => {
        window.removeEventListener('resize', handleResize)
        resizeObserver.disconnect()
      }
    }
    
    return () => window.removeEventListener('resize', handleResize)
  }, [mobileBottomSheetOpen, mobileBottomSheetHeight])

  // Process image and extract all data needed for visualizations
  useEffect(() => {
    if (!imageMeta) {
      setProcessedData(null)
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
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

      // Apply adjustments (same logic as EditorCanvas)
      const hasAdjustments = params.exposure !== 0 || params.contrast !== 0 || params.wbTemp !== 5500 || params.wbTint !== 0
      const hasHSL = params.hsl.hue !== 0 || params.hsl.saturation !== 0 || params.hsl.luminance !== 0
      const hasLUT = lutData && lutSize > 0

      if (hasAdjustments || hasHSL || hasLUT) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // RGB to HSL conversion
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

        // HSL to RGB conversion
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

        // White balance
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

        // LUT lookup
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

          if (hasHSL) {
            const [h, s, l] = rgbToHsl(r, g, b)
            let newH = h + params.hsl.hue
            let newS = s * (1.0 + params.hsl.saturation / 100.0)
            let newL = l + (params.hsl.luminance / 100.0)
            newH = ((newH % 360) + 360) % 360
            newS = Math.max(0, Math.min(1, newS))
            newL = Math.max(0, Math.min(1, newL))
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

      // Extract all histogram data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      const r = new Array(256).fill(0)
      const g = new Array(256).fill(0)
      const b = new Array(256).fill(0)
      const luminance = new Array(256).fill(0)
      const hue = new Array(360).fill(0)
      const saturation = new Array(101).fill(0)
      const value = new Array(256).fill(0)

      // RGB to HSV conversion for hue/saturation/value histograms
      const rgbToHsv = (r: number, g: number, b: number): [number, number, number] => {
        r /= 255.0
        g /= 255.0
        b /= 255.0
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const d = max - min
        let h = 0
        const s = max === 0 ? 0 : d / max
        const v = max
        if (d !== 0) {
          if (max === r) {
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6.0
          } else if (max === g) {
            h = ((b - r) / d + 2) / 6.0
          } else {
            h = ((r - g) / d + 4) / 6.0
          }
        }
        return [h * 360, s, v]
      }

      for (let i = 0; i < data.length; i += 4) {
        const rVal = Math.round(data[i])
        const gVal = Math.round(data[i + 1])
        const bVal = Math.round(data[i + 2])
        const lum = Math.round(0.299 * rVal + 0.587 * gVal + 0.114 * bVal)
        const [h, s, v] = rgbToHsv(rVal, gVal, bVal)

        const rIdx = Math.max(0, Math.min(255, rVal))
        const gIdx = Math.max(0, Math.min(255, gVal))
        const bIdx = Math.max(0, Math.min(255, bVal))
        const lumIdx = Math.max(0, Math.min(255, lum))
        const hIdx = Math.max(0, Math.min(359, Math.round(h)))
        const sIdx = Math.max(0, Math.min(100, Math.round(s * 100)))
        const vIdx = Math.max(0, Math.min(255, Math.round(v * 255)))

        r[rIdx]++
        g[gIdx]++
        b[bIdx]++
        luminance[lumIdx]++
        hue[hIdx]++
        saturation[sIdx]++
        value[vIdx]++
      }

      // Normalize histograms
      const maxRgb = Math.max(...r, ...g, ...b, ...luminance)
      const maxHsv = Math.max(...hue, ...saturation, ...value)
      if (maxRgb > 0) {
        for (let i = 0; i < 256; i++) {
          r[i] /= maxRgb
          g[i] /= maxRgb
          b[i] /= maxRgb
          luminance[i] /= maxRgb
        }
      }
      if (maxHsv > 0) {
        for (let i = 0; i < 360; i++) hue[i] /= maxHsv
        for (let i = 0; i < 101; i++) saturation[i] /= maxHsv
        for (let i = 0; i < 256; i++) value[i] /= maxHsv
      }

      setProcessedData({
        data: new Uint8ClampedArray(data),
        width: canvas.width,
        height: canvas.height,
        r,
        g,
        b,
        luminance,
        hue,
        saturation,
        value,
      })
    }
    img.src = imageMeta.url
  }, [imageMeta, params.exposure, params.contrast, params.wbTemp, params.wbTint, params.hsl, activeSimulationId, lutData, lutSize])

  // Helper function to render a single visualization
  const renderVisualization = (
    canvas: HTMLCanvasElement,
    type: VisualizationType,
    data: ProcessedImageData
  ) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    // Draw grid - more lines with reduced opacity
    ctx.strokeStyle = 'rgba(64, 64, 64, 0.3)'
    ctx.lineWidth = 0.5
    // Vertical lines (10 divisions instead of 5)
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    // Horizontal lines (8 divisions instead of 4)
    for (let i = 0; i <= 8; i++) {
      const y = (i / 8) * height
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Render based on visualization type
    switch (type) {
      case 'histogram-luminance':
        drawLuminanceHistogram(ctx, width, height, data)
        break
      case 'histogram-rgb':
        drawRGBHistogram(ctx, width, height, data)
        break
      case 'histogram-channels':
        drawChannelHistograms(ctx, width, height, data)
        break
      case 'waveform-luma':
        drawLumaWaveform(ctx, width, height, data)
        break
      case 'waveform-rgb':
        drawRGBWaveform(ctx, width, height, data)
        break
      case 'vectorscope':
        drawVectorscope(ctx, width, height, data)
        break
      case 'scatter-3d':
        draw3DScatter(ctx, width, height, data)
        break
      case 'entropy':
        drawEntropy(ctx, width, height, data)
        break
    }
  }

  if (!imageMeta) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Upload an image to see visualizations</p>
      </div>
    )
  }

  const visualizationOptions: { value: VisualizationType; label: string }[] = [
    { value: 'histogram-rgb', label: 'RGB Histogram' },
    { value: 'waveform-rgb', label: 'RGB Waveform' },
    { value: 'vectorscope', label: 'Vectorscope' },
    { value: 'scatter-3d', label: '3D Scatter' },
    { value: 'histogram-luminance', label: 'Luminance Histogram' },
    { value: 'histogram-channels', label: 'Color Channels' },
    { value: 'waveform-luma', label: 'Luma Waveform' },
    { value: 'entropy', label: 'Entropy' },
  ]

  // Render all visualizations when processedData changes or window size/bottom sheet changes
  useLayoutEffect(() => {
    if (!processedData) return

    // Wait for bottom sheet to be fully visible and container to have proper width
    const renderVisualizations = () => {
      visualizationOptions.forEach((opt) => {
        const canvas = document.getElementById(`viz-${opt.value}`) as HTMLCanvasElement
        if (canvas && canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
          // Ensure canvas has proper dimensions
          const actualWidth = canvas.offsetWidth
          const actualHeight = canvasDimensions.height
          if (canvas.width !== actualWidth || canvas.height !== actualHeight) {
            canvas.width = actualWidth
            canvas.height = actualHeight
          }
          renderVisualization(canvas, opt.value, processedData)
        }
      })
    }

    // Delay to ensure DOM is ready and bottom sheet is visible
    const timeoutId = setTimeout(() => {
      renderVisualizations()
      // Also try after a longer delay in case the bottom sheet is still animating
      setTimeout(renderVisualizations, 300)
    }, mobileBottomSheetOpen ? 200 : 100)

    return () => clearTimeout(timeoutId)
  }, [processedData, windowWidth, mobileBottomSheetOpen, mobileBottomSheetHeight, containerWidth])

  // Calculate responsive canvas dimensions based on actual container width
  const isMobile = windowWidth < 768
  const effectiveWidth = containerWidth > 0 ? containerWidth - 32 : (isMobile ? windowWidth - 32 : 400) // Account for padding
  const canvasDimensions = {
    width: isMobile ? Math.max(300, Math.min(effectiveWidth, 400)) : 400,
    height: isMobile ? Math.max(150, Math.round(effectiveWidth * 0.5)) : 200, // Maintain aspect ratio
  }

  return (
    <div ref={containerRef} className="space-y-6 pb-4">
      {visualizationOptions.map((opt) => {
        const canvasKey = `${opt.value}-${canvasDimensions.width}-${canvasDimensions.height}`
        return (
          <div key={canvasKey} className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">{opt.label}</h3>
            <div className="w-full bg-card/50 rounded p-2">
              <canvas
                id={`viz-${opt.value}`}
                width={canvasDimensions.width}
                height={canvasDimensions.height}
                className="w-full rounded"
                style={{ 
                  height: 'auto',
                  display: 'block',
                  maxWidth: '100%',
                }}
                aria-label={opt.label}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Drawing functions for each visualization type
function drawLuminanceHistogram(ctx: CanvasRenderingContext2D, width: number, height: number, data: ProcessedImageData) {
  ctx.strokeStyle = '#999999'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let i = 0; i < 256; i++) {
    const x = (i / 255) * width
    const y = height - data.luminance[i] * height
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
}

function drawRGBHistogram(ctx: CanvasRenderingContext2D, width: number, height: number, data: ProcessedImageData) {
  const colors = [
    { data: data.r, color: '#ff0000' },
    { data: data.g, color: '#00ff00' },
    { data: data.b, color: '#0000ff' },
  ]
  colors.forEach((channel) => {
    ctx.strokeStyle = channel.color
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i < 256; i++) {
      const x = (i / 255) * width
      const y = height - channel.data[i] * height
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  })
}

function drawChannelHistograms(ctx: CanvasRenderingContext2D, width: number, height: number, data: ProcessedImageData) {
  const channels = [
    { data: data.r, color: '#ff0000', label: 'R' },
    { data: data.g, color: '#00ff00', label: 'G' },
    { data: data.b, color: '#0000ff', label: 'B' },
    { data: data.hue, color: '#ffff00', label: 'H', max: 360 },
    { data: data.saturation, color: '#ff00ff', label: 'S', max: 101 },
    { data: data.value, color: '#00ffff', label: 'V' },
  ]
  const cols = 3
  const rows = 2
  const cellWidth = width / cols
  const cellHeight = height / rows

  channels.forEach((channel, idx) => {
    const col = idx % cols
    const row = Math.floor(idx / cols)
    const x = col * cellWidth
    const y = row * cellHeight
    const max = channel.max || 256

    ctx.strokeStyle = channel.color
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i < max; i++) {
      const px = x + (i / (max - 1)) * cellWidth
      const py = y + cellHeight - channel.data[i] * cellHeight
      if (i === 0) ctx.moveTo(px, y + cellHeight)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
  })
}

function drawLumaWaveform(ctx: CanvasRenderingContext2D, width: number, height: number, data: ProcessedImageData) {
  // Waveform shows brightness by vertical position
  const waveform = new Array(data.height).fill(0).map(() => new Array(256).fill(0))
  
  for (let y = 0; y < data.height; y++) {
    for (let x = 0; x < data.width; x++) {
      const idx = (y * data.width + x) * 4
      const r = data.data[idx]
      const g = data.data[idx + 1]
      const b = data.data[idx + 2]
      const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
      waveform[y][lum]++
    }
  }

  // Normalize - find max by iterating instead of using spread operator
  let max = 0
  for (let y = 0; y < data.height; y++) {
    for (let i = 0; i < 256; i++) {
      if (waveform[y][i] > max) {
        max = waveform[y][i]
      }
    }
  }
  
  if (max > 0) {
    for (let y = 0; y < data.height; y++) {
      for (let i = 0; i < 256; i++) {
        waveform[y][i] /= max
      }
    }
  }

  // Draw - sample to avoid drawing too many points
  const sampleY = Math.max(1, Math.floor(data.height / 400))
  ctx.strokeStyle = '#999999'
  ctx.lineWidth = 0.5
  for (let y = 0; y < data.height; y += sampleY) {
    for (let i = 0; i < 256; i++) {
      if (waveform[y][i] > 0.01) {
        const x = (i / 255) * width
        const py = (y / data.height) * height
        ctx.globalAlpha = waveform[y][i]
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(x, py, 1, 1)
      }
    }
  }
  ctx.globalAlpha = 1
}

function drawRGBWaveform(ctx: CanvasRenderingContext2D, width: number, height: number, data: ProcessedImageData) {
  const channels = [
    { offset: 0, color: '#ff0000' },
    { offset: width / 3, color: '#00ff00' },
    { offset: (width / 3) * 2, color: '#0000ff' },
  ]

  channels.forEach((channel, chIdx) => {
    const waveform = new Array(data.height).fill(0).map(() => new Array(256).fill(0))
    
    for (let y = 0; y < data.height; y++) {
      for (let x = 0; x < data.width; x++) {
        const idx = (y * data.width + x) * 4
        const val = data.data[idx + chIdx]
        waveform[y][val]++
      }
    }

    // Find max by iterating instead of using spread operator
    let max = 0
    for (let y = 0; y < data.height; y++) {
      for (let i = 0; i < 256; i++) {
        if (waveform[y][i] > max) {
          max = waveform[y][i]
        }
      }
    }
    
    if (max > 0) {
      for (let y = 0; y < data.height; y++) {
        for (let i = 0; i < 256; i++) {
          waveform[y][i] /= max
        }
      }
    }

    // Draw - sample to avoid drawing too many points
    const sampleY = Math.max(1, Math.floor(data.height / 400))
    ctx.strokeStyle = channel.color
    ctx.lineWidth = 0.5
    for (let y = 0; y < data.height; y += sampleY) {
      for (let i = 0; i < 256; i++) {
        if (waveform[y][i] > 0.01) {
          const x = channel.offset + (i / 255) * (width / 3)
          const py = (y / data.height) * height
          ctx.globalAlpha = waveform[y][i]
          ctx.fillStyle = channel.color
          ctx.fillRect(x, py, 1, 1)
        }
      }
    }
  })
  ctx.globalAlpha = 1
}

function drawVectorscope(ctx: CanvasRenderingContext2D, width: number, height: number, data: ProcessedImageData) {
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 2 - 10

  // Draw circle
  ctx.strokeStyle = '#404040'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  ctx.stroke()

  // Draw color wheel reference
  const sectors = ['R', 'Y', 'G', 'C', 'B', 'M']
  sectors.forEach((label, i) => {
    const angle = (i / sectors.length) * Math.PI * 2 - Math.PI / 2
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    ctx.fillStyle = '#666666'
    ctx.font = '10px sans-serif'
    ctx.fillText(label, x - 5, y + 5)
  })

  // Plot hue vs saturation
  const scope = new Array(360).fill(0).map(() => new Array(101).fill(0))
  
  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i]
    const g = data.data[i + 1]
    const b = data.data[i + 2]
    
    // RGB to HSV
    const rNorm = r / 255.0
    const gNorm = g / 255.0
    const bNorm = b / 255.0
    const max = Math.max(rNorm, gNorm, bNorm)
    const min = Math.min(rNorm, gNorm, bNorm)
    const d = max - min
    let h = 0
    const s = max === 0 ? 0 : d / max
    
    if (d !== 0) {
      if (max === rNorm) {
        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6.0
      } else if (max === gNorm) {
        h = ((bNorm - rNorm) / d + 2) / 6.0
      } else {
        h = ((rNorm - gNorm) / d + 4) / 6.0
      }
    }
    
    const hIdx = Math.round(h * 360) % 360
    const sIdx = Math.round(s * 100)
    scope[hIdx][sIdx]++
  }

  const max = Math.max(...scope.flat())
  if (max > 0) {
    for (let h = 0; h < 360; h++) {
      for (let s = 0; s <= 100; s++) {
        if (scope[h][s] > 0) {
          const angle = (h / 360) * Math.PI * 2 - Math.PI / 2
          const dist = (s / 100) * radius
          const x = centerX + Math.cos(angle) * dist
          const y = centerY + Math.sin(angle) * dist
          const intensity = scope[h][s] / max
          ctx.globalAlpha = Math.min(1, intensity * 10)
          ctx.fillStyle = `hsl(${h}, ${s}%, 50%)`
          ctx.fillRect(x - 1, y - 1, 2, 2)
        }
      }
    }
  }
  ctx.globalAlpha = 1
}

function draw3DScatter(ctx: CanvasRenderingContext2D, width: number, height: number, data: ProcessedImageData) {
  // Sample pixels for performance
  const sampleRate = Math.max(1, Math.floor((data.width * data.height) / 10000))
  const points: { r: number; g: number; b: number }[] = []
  
  for (let i = 0; i < data.data.length; i += 4 * sampleRate) {
    points.push({
      r: data.data[i],
      g: data.data[i + 1],
      b: data.data[i + 2],
    })
  }

  // Project 3D RGB to 2D (using R-G plane)
  points.forEach((point) => {
    const x = (point.r / 255) * width
    const y = (point.g / 255) * height
    ctx.fillStyle = `rgb(${point.r}, ${point.g}, ${point.b})`
    ctx.fillRect(x - 0.5, y - 0.5, 1, 1)
  })
}

function drawEntropy(ctx: CanvasRenderingContext2D, width: number, height: number, data: ProcessedImageData) {
  // Calculate local entropy using 8x8 blocks
  const blockSize = 8
  const entropies: number[] = []
  
  for (let by = 0; by < Math.floor(data.height / blockSize); by++) {
    for (let bx = 0; bx < Math.floor(data.width / blockSize); bx++) {
      const histogram = new Array(256).fill(0)
      let pixelCount = 0
      
      for (let y = 0; y < blockSize && by * blockSize + y < data.height; y++) {
        for (let x = 0; x < blockSize && bx * blockSize + x < data.width; x++) {
          const idx = ((by * blockSize + y) * data.width + (bx * blockSize + x)) * 4
          const gray = Math.round((data.data[idx] + data.data[idx + 1] + data.data[idx + 2]) / 3)
          histogram[gray]++
          pixelCount++
        }
      }
      
      // Calculate entropy
      let entropy = 0
      for (let i = 0; i < 256; i++) {
        if (histogram[i] > 0) {
          const p = histogram[i] / pixelCount
          entropy -= p * Math.log2(p)
        }
      }
      entropies.push(entropy)
    }
  }

  // Create histogram of entropies
  const entropyHist = new Array(100).fill(0)
  const maxEntropy = Math.max(...entropies)
  if (maxEntropy > 0) {
    entropies.forEach((e) => {
      const idx = Math.min(99, Math.round((e / maxEntropy) * 99))
      entropyHist[idx]++
    })
  }

  const max = Math.max(...entropyHist)
  if (max > 0) {
    ctx.strokeStyle = '#999999'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i < 100; i++) {
      const x = (i / 99) * width
      const y = height - (entropyHist[i] / max) * height
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
}

