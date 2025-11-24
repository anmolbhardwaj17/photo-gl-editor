import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { useDispatch, useSelector } from 'react-redux'
import { setStatus, setFormat, setQuality, setExportUrl } from '../store/exportSlice'
import { RootState } from '../store'
import { useTheme } from './ThemeProvider'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const dispatch = useDispatch()
  const format = useSelector((state: RootState) => state.export.format)
  const quality = useSelector((state: RootState) => state.export.quality)
  const status = useSelector((state: RootState) => state.export.status)
  const imageMeta = useSelector((state: RootState) => state.editor.imageMeta)
  const params = useSelector((state: RootState) => state.editor.params)
  const activeSimulationId = useSelector((state: RootState) => state.editor.activeSimulationId)
  const simulations = useSelector((state: RootState) => state.simulations.simulations)
  
  // Generate a random filename
  const generateRandomFilename = () => {
    const randomStr = Math.random().toString(36).substring(2, 8)
    const timestamp = Date.now().toString(36)
    return `image-${randomStr}-${timestamp}`
  }
  
  const [filename, setFilename] = useState(generateRandomFilename())
  const { theme } = useTheme()
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark')
  
  // Regenerate filename when modal opens
  useEffect(() => {
    if (isOpen) {
      setFilename(generateRandomFilename())
    }
  }, [isOpen])
  
  // Resolve theme for logo
  useEffect(() => {
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setResolvedTheme(systemTheme)
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light')
      }
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      setResolvedTheme(theme)
    }
  }, [theme])

  // Helper function to apply sharpen using unsharp mask technique
  const applySharpen = (imageData: ImageData, amount: number, radius: number, width: number, height: number): ImageData => {
    const inputData = imageData.data
    const outputData = new Uint8ClampedArray(imageData.data.length)
    const intensity = amount / 100.0
    
    const kernelSize = Math.max(3, Math.ceil(radius * 2) * 2 + 1)
    const kernelCenter = Math.floor(kernelSize / 2)
    const sigma = radius / 2.0
    const kernel: number[][] = []
    let kernelSum = 0
    
    for (let y = 0; y < kernelSize; y++) {
      kernel[y] = []
      for (let x = 0; x < kernelSize; x++) {
        const dx = x - kernelCenter
        const dy = y - kernelCenter
        const distSq = dx * dx + dy * dy
        const value = Math.exp(-distSq / (2 * sigma * sigma))
        kernel[y][x] = value
        kernelSum += value
      }
    }
    
    for (let y = 0; y < kernelSize; y++) {
      for (let x = 0; x < kernelSize; x++) {
        kernel[y][x] /= kernelSum
      }
    }
    
    const blurredData = new Uint8ClampedArray(inputData.length)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0
        
        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const px = x + kx - kernelCenter
            const py = y + ky - kernelCenter
            
            if (px >= 0 && px < width && py >= 0 && py < height) {
              const idx = (py * width + px) * 4
              const weight = kernel[ky][kx]
              r += inputData[idx] * weight
              g += inputData[idx + 1] * weight
              b += inputData[idx + 2] * weight
            }
          }
        }
        
        const idx = (y * width + x) * 4
        blurredData[idx] = Math.round(r)
        blurredData[idx + 1] = Math.round(g)
        blurredData[idx + 2] = Math.round(b)
        blurredData[idx + 3] = inputData[idx + 3]
      }
    }
    
    for (let i = 0; i < inputData.length; i += 4) {
      const originalR = inputData[i]
      const originalG = inputData[i + 1]
      const originalB = inputData[i + 2]
      
      const blurredR = blurredData[i]
      const blurredG = blurredData[i + 1]
      const blurredB = blurredData[i + 2]
      
      const sharpR = originalR + intensity * (originalR - blurredR)
      const sharpG = originalG + intensity * (originalG - blurredG)
      const sharpB = originalB + intensity * (originalB - blurredB)
      
      outputData[i] = Math.max(0, Math.min(255, Math.round(sharpR)))
      outputData[i + 1] = Math.max(0, Math.min(255, Math.round(sharpG)))
      outputData[i + 2] = Math.max(0, Math.min(255, Math.round(sharpB)))
      outputData[i + 3] = inputData[i + 3]
    }
    
    return new ImageData(outputData, width, height)
  }

  const handleExport = async () => {
    if (!imageMeta) return

    dispatch(setStatus('processing'))

    try {
      // Get active simulation's LUT data
      const activeSimulation = simulations.find((p: { id: string }) => p.id === activeSimulationId)
      const lutData = activeSimulation?.lutData
      const lutSize = activeSimulation?.lutSize || 0

      // Load original image
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageMeta.originalUrl || imageMeta.url
      })

      const canvas = document.createElement('canvas')
      canvas.width = imageMeta.width
      canvas.height = imageMeta.height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('Could not get canvas context')

      ctx.drawImage(img, 0, 0)

      // Check what adjustments need to be applied
      const hasAdjustments = params.exposure !== 0 || params.contrast !== 0 || params.wbTemp !== 5500 || params.wbTint !== 0
      const hasHSL = params.hsl.hue !== 0 || params.hsl.saturation !== 0 || params.hsl.luminance !== 0
      const hasHighlightsShadows = params.highlights !== 0 || params.shadows !== 0
      const hasLUT = lutData && lutSize > 0
      const hasGrain = params.grain.amount > 0
      const hasVignette = params.vignette.amount > 0
      const hasSharpen = params.sharpen.amount > 0

      if (hasAdjustments || hasHSL || hasHighlightsShadows || hasLUT || hasGrain || hasVignette || hasSharpen) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Helper functions (same as EditorCanvas)
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
        
        const applyHighlightsShadows = (luminance: number, highlights: number, shadows: number): number => {
          let value = Math.max(0, Math.min(1, luminance))
          
          const smoothstep = (edge0: number, edge1: number, x: number): number => {
            const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
            return t * t * (3 - 2 * t)
          }
          
          if (shadows !== 0) {
            const shadowMask = 1.0 - smoothstep(0.2, 0.5, value)
            const shadowAmount = (shadows / 100) * 0.5
            value = value + (shadowAmount * shadowMask)
          }
          
          if (highlights !== 0) {
            const highlightMask = smoothstep(0.5, 0.8, value)
            const highlightAmount = (highlights / 100) * 0.5
            value = value + (highlightAmount * highlightMask)
          }
          
          return Math.max(0, Math.min(1, value))
        }
        
        // Calculate white balance multipliers
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

        // Helper function for 3D LUT lookup with trilinear interpolation
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

        // Process all pixels
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i] / 255.0
          let g = data[i + 1] / 255.0
          let b = data[i + 2] / 255.0

          // Apply adjustments if needed
          if (hasAdjustments) {
            // White balance
            r *= wbR
            g *= wbG
            b *= wbB

            r = Math.max(0, Math.min(1, r)) * 255.0
            g = Math.max(0, Math.min(1, g)) * 255.0
            b = Math.max(0, Math.min(1, b)) * 255.0

            // Exposure
            const exposureMult = Math.pow(2, params.exposure)
            r = Math.min(255, r * exposureMult)
            g = Math.min(255, g * exposureMult)
            b = Math.min(255, b * exposureMult)

            // Contrast
            const contrast = params.contrast / 100
            r = Math.min(255, Math.max(0, (r - 128) * (1 + contrast) + 128))
            g = Math.min(255, Math.max(0, (g - 128) * (1 + contrast) + 128))
            b = Math.min(255, Math.max(0, (b - 128) * (1 + contrast) + 128))
          } else {
            r = r * 255.0
            g = g * 255.0
            b = b * 255.0
          }
          
          // Apply highlights and shadows
          if (hasHighlightsShadows) {
            const rNorm = r / 255.0
            const gNorm = g / 255.0
            const bNorm = b / 255.0
            
            const luminance = (rNorm * 0.299 + gNorm * 0.587 + bNorm * 0.114)
            const adjustedLuminance = applyHighlightsShadows(luminance, params.highlights, params.shadows)
            const luminanceDelta = adjustedLuminance - luminance
            
            r = Math.max(0, Math.min(255, (rNorm + luminanceDelta) * 255.0))
            g = Math.max(0, Math.min(255, (gNorm + luminanceDelta) * 255.0))
            b = Math.max(0, Math.min(255, (bNorm + luminanceDelta) * 255.0))
          }
          
          // Apply HSL adjustments
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

          // Apply 3D LUT if simulation is active
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

        // Apply sharpen
        if (hasSharpen) {
          const sharpenedData = applySharpen(imageData, params.sharpen.amount, params.sharpen.radius, canvas.width, canvas.height)
          ctx.putImageData(sharpenedData, 0, 0)
        } else {
          ctx.putImageData(imageData, 0, 0)
        }

        // Apply grain and vignette as post-processing
        if (hasGrain || hasVignette) {
          const finalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const finalData = finalImageData.data
          const centerX = canvas.width / 2
          const centerY = canvas.height / 2
          
          for (let i = 0; i < finalData.length; i += 4) {
            const x = (i / 4) % canvas.width
            const y = Math.floor((i / 4) / canvas.width)
            
            // Apply grain
            if (hasGrain) {
              const grainAmount = params.grain.amount / 100.0
              const noise = (Math.random() - 0.5) * 2 * grainAmount * 255
              finalData[i] = Math.max(0, Math.min(255, finalData[i] + noise))
              finalData[i + 1] = Math.max(0, Math.min(255, finalData[i + 1] + noise))
              finalData[i + 2] = Math.max(0, Math.min(255, finalData[i + 2] + noise))
            }
            
            // Apply vignette
            if (hasVignette) {
              const dx = (x - centerX) / canvas.width
              const dy = (y - centerY) / canvas.height
              const dist = Math.sqrt(dx * dx + dy * dy)
              const normalizedDist = dist / (params.vignette.size * 0.5)
              const vignetteAmount = params.vignette.amount / 100.0
              const roundness = params.vignette.roundness
              const vignetteFactor = 1.0 - Math.pow(Math.min(1, normalizedDist), roundness * 2 + 0.5) * vignetteAmount
              
              finalData[i] = Math.max(0, Math.min(255, finalData[i] * vignetteFactor))
              finalData[i + 1] = Math.max(0, Math.min(255, finalData[i + 1] * vignetteFactor))
              finalData[i + 2] = Math.max(0, Math.min(255, finalData[i + 2] * vignetteFactor))
            }
          }
          
          ctx.putImageData(finalImageData, 0, 0)
        }
      }

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Failed to create blob'))
          },
          format === 'jpeg' ? 'image/jpeg' : 'image/png',
          format === 'jpeg' ? quality : undefined
        )
      })

      const url = URL.createObjectURL(blob)
      dispatch(setExportUrl(url))

      // Trigger download
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      dispatch(setStatus('error'))
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full rounded-2xl bg-background p-6 border border-border">
          {/* Logo */}
          <div className="mb-4 flex justify-center">
            <img
              src={resolvedTheme === 'dark'
                ? '/images/clarity-dark.svg'
                : '/images/clarity-light.svg'}
              alt="Clarity"
              className="h-12"
            />
          </div>
      

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                File Name
              </label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Export filename"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => dispatch(setFormat(e.target.value as 'png' | 'jpeg'))}
                className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Export format"
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
              </select>
            </div>

            {format === 'jpeg' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Quality: {Math.round(quality * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.01"
                  value={quality}
                  onChange={(e) => dispatch(setQuality(parseFloat(e.target.value)))}
                  className="w-full"
                  aria-label="JPEG quality"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={status === 'processing'}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {status === 'processing' ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

