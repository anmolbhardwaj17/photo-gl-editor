import { useMemo, useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { setImage } from '../store/editorSlice'
import { ActiveEdits } from './ActiveEdits'
import exifr from 'exifr'
import { useTheme } from './ThemeProvider'
import { X, Info } from 'lucide-react'
// Simplified canvas-based rendering for MVP
// WebGL shader pipeline will be added in a future update

// Helper function to apply sharpen using unsharp mask technique
function applySharpen(imageData: ImageData, amount: number, radius: number, width: number, height: number): ImageData {
  const inputData = imageData.data
  const outputData = new Uint8ClampedArray(imageData.data.length)
  const intensity = amount / 100.0
  
  // Create a blur kernel for unsharp mask
  const kernelSize = Math.max(3, Math.ceil(radius * 2) * 2 + 1)
  const kernelCenter = Math.floor(kernelSize / 2)
  const sigma = radius / 2.0
  const kernel: number[][] = []
  let kernelSum = 0
  
  // Create Gaussian blur kernel
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
  
  // Normalize kernel
  for (let y = 0; y < kernelSize; y++) {
    for (let x = 0; x < kernelSize; x++) {
      kernel[y][x] /= kernelSum
    }
  }
  
  // Apply blur to create the "unsharp" version
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
  
  // Apply unsharp mask: original + intensity * (original - blurred)
  for (let i = 0; i < inputData.length; i += 4) {
    const originalR = inputData[i]
    const originalG = inputData[i + 1]
    const originalB = inputData[i + 2]
    
    const blurredR = blurredData[i]
    const blurredG = blurredData[i + 1]
    const blurredB = blurredData[i + 2]
    
    // Unsharp mask formula
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

interface EditorCanvasProps {
  previewWidth?: number
  previewHeight?: number
}

export function EditorCanvas({ previewWidth, previewHeight }: EditorCanvasProps) {
  const dispatch = useDispatch()
  const imageMeta = useSelector((state: RootState) => state.editor.imageMeta)
  const params = useSelector((state: RootState) => state.editor.params)
  const activeSimulationId = useSelector((state: RootState) => state.editor.activeSimulationId)
  const simulations = useSelector((state: RootState) => state.simulations.simulations)
  const zoom = useSelector((state: RootState) => state.ui.zoom)
  const panX = useSelector((state: RootState) => state.ui.panX)
  const panY = useSelector((state: RootState) => state.ui.panY)
  const containerRef = useRef<HTMLDivElement>(null)
  const infoPanelRef = useRef<HTMLDivElement>(null)
  const [showInfo, setShowInfo] = useState(false)
  
  const handleRemoveImage = () => {
    dispatch(setImage(null))
  }
  const [imageMetadata, setImageMetadata] = useState<{
    dimensions: string
    aspectRatio: string
    fileSize?: string
    format?: string
    location?: string
    camera?: string
    lens?: string
    iso?: string
    aperture?: string
    shutterSpeed?: string
    focalLength?: string
    dateTaken?: string
  } | null>(null)
  const { theme } = useTheme()
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark')
  
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

  // Close info panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showInfo &&
        infoPanelRef.current &&
        !infoPanelRef.current.contains(event.target as Node)
      ) {
        setShowInfo(false)
      }
    }

    if (showInfo) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showInfo])

  // Toggle info panel on canvas double-click
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleDoubleClick = (e: MouseEvent) => {
      // Don't toggle if clicking on the remove button
      const target = e.target as HTMLElement
      if (target.closest('button[aria-label="Remove image"]')) {
        return
      }
      setShowInfo(!showInfo)
    }

    canvas.addEventListener('dblclick', handleDoubleClick)
    return () => {
      canvas.removeEventListener('dblclick', handleDoubleClick)
    }
  }, [showInfo])
  
  // Get active simulation's LUT data
  const activeSimulation = simulations.find((p: { id: string }) => p.id === activeSimulationId)
  const lutData = activeSimulation?.lutData
  const lutSize = activeSimulation?.lutSize || 0

  // Calculate preview dimensions
  const dimensions = useMemo(() => {
    if (!imageMeta) return { width: 800, height: 600 }
    
    const aspect = imageMeta.width / imageMeta.height
    const maxWidth = previewWidth || 1200
    const maxHeight = previewHeight || 800
    
    let width = Math.min(imageMeta.width, maxWidth)
    let height = width / aspect
    
    if (height > maxHeight) {
      height = maxHeight
      width = height * aspect
    }
    
    return { width: Math.round(width), height: Math.round(height) }
  }, [imageMeta, previewWidth, previewHeight])

  // Extract image metadata including EXIF
  useEffect(() => {
    if (!imageMeta) {
      setImageMetadata(null)
      return
    }

    const extractMetadata = async () => {
      const aspectRatio = (imageMeta.width / imageMeta.height).toFixed(2)
      
      // Try to get file size and EXIF from the original URL
      let fileSize: string | undefined
      let format: string | undefined
      let location: string | undefined
      let camera: string | undefined
      let lens: string | undefined
      let iso: string | undefined
      let aperture: string | undefined
      let shutterSpeed: string | undefined
      let focalLength: string | undefined
      let dateTaken: string | undefined
      
      try {
        const response = await fetch(imageMeta.originalUrl)
        const blob = await response.blob()
        const sizeInMB = blob.size / (1024 * 1024)
        fileSize = sizeInMB < 1 
          ? `${(blob.size / 1024).toFixed(2)} KB`
          : `${sizeInMB.toFixed(2)} MB`
        
        // Extract format from blob type or URL
        format = blob.type.split('/')[1]?.toUpperCase() || 
                 imageMeta.originalUrl.split('.').pop()?.toUpperCase() || 
                 'Unknown'

        // Extract EXIF data
        try {
          const exifData = await exifr.parse(blob, {
            gps: true,
            translateKeys: true,
            translateValues: true,
            reviveValues: true,
          })

          // Extract location (GPS coordinates)
          if (exifData?.latitude && exifData?.longitude) {
            const lat = exifData.latitude.toFixed(6)
            const lon = exifData.longitude.toFixed(6)
            location = `${lat}, ${lon}`
          } else if (exifData?.GPSLatitude && exifData?.GPSLongitude) {
            const lat = exifData.GPSLatitude.toFixed(6)
            const lon = exifData.GPSLongitude.toFixed(6)
            location = `${lat}, ${lon}`
          }

          // Extract camera make and model
          const make = exifData?.Make || exifData?.make
          const model = exifData?.Model || exifData?.model
          if (make || model) {
            camera = [make, model].filter(Boolean).join(' ')
          }

          // Extract lens information
          const lensModel = exifData?.LensModel || exifData?.lensModel || exifData?.Lens || exifData?.lens
          if (lensModel) {
            lens = lensModel
          } else {
            // Try to construct from lens make/model
            const lensMake = exifData?.LensMake || exifData?.lensMake
            const lensModel2 = exifData?.LensModel || exifData?.lensModel
            if (lensMake || lensModel2) {
              lens = [lensMake, lensModel2].filter(Boolean).join(' ')
            }
          }

          // Extract ISO
          const isoValue = exifData?.ISO || exifData?.iso || exifData?.ISOSpeedRatings
          if (isoValue) {
            iso = `ISO ${isoValue}`
          }

          // Extract aperture (f-number)
          const fNumber = exifData?.FNumber || exifData?.fNumber || exifData?.ApertureValue
          if (fNumber) {
            aperture = `f/${typeof fNumber === 'number' ? fNumber.toFixed(1) : fNumber}`
          }

          // Extract shutter speed
          const exposureTime = exifData?.ExposureTime || exifData?.exposureTime
          if (exposureTime) {
            if (exposureTime < 1) {
              shutterSpeed = `1/${Math.round(1 / exposureTime)}s`
            } else {
              shutterSpeed = `${exposureTime.toFixed(1)}s`
            }
          }

          // Extract focal length
          const focal = exifData?.FocalLength || exifData?.focalLength
          if (focal) {
            focalLength = `${typeof focal === 'number' ? focal.toFixed(0) : focal}mm`
          }

          // Extract date taken
          const dateTime = exifData?.DateTimeOriginal || exifData?.dateTimeOriginal || 
                          exifData?.DateTime || exifData?.dateTime ||
                          exifData?.CreateDate || exifData?.createDate
          if (dateTime) {
            try {
              const date = new Date(dateTime)
              if (!isNaN(date.getTime())) {
                dateTaken = date.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }
            } catch (e) {
              // Date parsing failed
            }
          }
        } catch (exifError) {
          // EXIF parsing failed, that's okay
          console.log('EXIF parsing failed:', exifError)
        }
      } catch (e) {
        // If we can't fetch, that's okay
      }

      setImageMetadata({
        dimensions: `${imageMeta.width} × ${imageMeta.height}`,
        aspectRatio: `${aspectRatio}:1`,
        fileSize,
        format,
        location,
        camera,
        lens,
        iso,
        aperture,
        shutterSpeed,
        focalLength,
        dateTaken,
      })
    }

    extractMetadata()
  }, [imageMeta])

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Render image with adjustments using canvas 2D context
  useEffect(() => {
    if (!imageMeta || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      canvas.width = dimensions.width
      canvas.height = dimensions.height
      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height)

      // Apply adjustments and LUT
      const hasAdjustments = params.exposure !== 0 || params.contrast !== 0 || params.wbTemp !== 5500 || params.wbTint !== 0
      const hasHSL = params.hsl.hue !== 0 || params.hsl.saturation !== 0 || params.hsl.luminance !== 0
      // Check if tone curve is non-linear (not the default linear curve from (0,0) to (1,1))
      // Sort curve points by x to ensure proper interpolation
      const sortedCurvePoints = [...params.curvePoints].sort((a, b) => a.x - b.x)
      const isDefaultCurve = sortedCurvePoints.length === 2 && 
        Math.abs(sortedCurvePoints[0].x - 0) < 0.001 && 
        Math.abs(sortedCurvePoints[0].y - 0) < 0.001 &&
        Math.abs(sortedCurvePoints[1].x - 1) < 0.001 && 
        Math.abs(sortedCurvePoints[1].y - 1) < 0.001
      const hasToneCurve = !isDefaultCurve && sortedCurvePoints.length >= 2
      const hasLUT = lutData && lutSize > 0
      const hasGrain = params.grain.amount > 0
      const hasVignette = params.vignette.amount > 0
      const hasSharpen = params.sharpen.amount > 0

      if (hasAdjustments || hasHSL || hasToneCurve || hasLUT || hasGrain || hasVignette || hasSharpen) {
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
        
        // Helper function to apply tone curve
        const applyToneCurve = (value: number, curvePoints: typeof params.curvePoints): number => {
          if (curvePoints.length < 2) return value
          
          // Clamp value to [0, 1]
          value = Math.max(0, Math.min(1, value))
          
          // Find the two points to interpolate between
          for (let i = 0; i < curvePoints.length - 1; i++) {
            const x0 = curvePoints[i].x
            const y0 = curvePoints[i].y
            const x1 = curvePoints[i + 1].x
            const y1 = curvePoints[i + 1].y
            
            if (value >= x0 && value <= x1) {
              // Linear interpolation
              if (x1 === x0) return y0
              const t = (value - x0) / (x1 - x0)
              return y0 + (y1 - y0) * t
            }
          }
          
          // Clamp to first/last point
          if (value <= curvePoints[0].x) {
            return curvePoints[0].y
          }
          if (value >= curvePoints[curvePoints.length - 1].x) {
            return curvePoints[curvePoints.length - 1].y
          }
          
          return value
        }
        
        // Calculate white balance multipliers (only if needed)
        let wbR = 1.0, wbG = 1.0, wbB = 1.0
        if (params.wbTemp !== 5500 || params.wbTint !== 0) {
          // Helper function to convert temperature to RGB
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

          // Get RGB for target temperature and neutral (5500K)
          const targetRGB = tempToRGB(params.wbTemp)
          const neutralRGB = tempToRGB(5500)

          // Calculate relative multipliers (invert to get compensation, not light color)
          wbR = neutralRGB.r / targetRGB.r
          wbG = neutralRGB.g / targetRGB.g
          wbB = neutralRGB.b / targetRGB.b

          // Tint adjustment (green-magenta shift)
          const tintFactor = params.wbTint / 100.0
          wbG -= tintFactor * 0.1
          wbR += tintFactor * 0.05
          wbB += tintFactor * 0.05
        }

        // Helper function for 3D LUT lookup with trilinear interpolation
        const lookupLUT = (r: number, g: number, b: number, lut: Float32Array, size: number): [number, number, number] => {
          // Clamp to [0, 1]
          r = Math.max(0, Math.min(1, r))
          g = Math.max(0, Math.min(1, g))
          b = Math.max(0, Math.min(1, b))
          
          // Scale to LUT grid coordinates
          const scale = (size - 1) / size
          const offset = 1 / (2 * size)
          const rScaled = r * scale + offset
          const gScaled = g * scale + offset
          const bScaled = b * scale + offset
          
          // Get integer and fractional parts
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
          
          // Helper to get LUT value at (r, g, b) index
          const getLUTValue = (ri: number, gi: number, bi: number): [number, number, number] => {
            const index = (bi * size * size + gi * size + ri) * 3
            return [lut[index], lut[index + 1], lut[index + 2]]
          }
          
          // Get 8 corner values
          const c000 = getLUTValue(r0, g0, b0)
          const c001 = getLUTValue(r0, g0, b1)
          const c010 = getLUTValue(r0, g1, b0)
          const c011 = getLUTValue(r0, g1, b1)
          const c100 = getLUTValue(r1, g0, b0)
          const c101 = getLUTValue(r1, g0, b1)
          const c110 = getLUTValue(r1, g1, b0)
          const c111 = getLUTValue(r1, g1, b1)
          
          // Trilinear interpolation
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

            // Convert back to 0-255 range
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
            // Convert to 0-255 range for LUT processing
            r = r * 255.0
            g = g * 255.0
            b = b * 255.0
          }
          
          // Apply tone curve if needed (before HSL, after basic adjustments)
          if (hasToneCurve) {
            // Convert to 0-1 range for curve application
            const rNorm = r / 255.0
            const gNorm = g / 255.0
            const bNorm = b / 255.0
            
            // Apply curve per channel using sorted points
            const rCurved = applyToneCurve(rNorm, sortedCurvePoints)
            const gCurved = applyToneCurve(gNorm, sortedCurvePoints)
            const bCurved = applyToneCurve(bNorm, sortedCurvePoints)
            
            // Convert back to 0-255 range
            r = Math.max(0, Math.min(255, rCurved * 255.0))
            g = Math.max(0, Math.min(255, gCurved * 255.0))
            b = Math.max(0, Math.min(255, bCurved * 255.0))
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

          // Apply 3D LUT if simulation is active
          if (lutData && lutSize > 0) {
            // Convert to 0-1 range for LUT lookup
            const rNorm = r / 255.0
            const gNorm = g / 255.0
            const bNorm = b / 255.0
            
            // Lookup in LUT
            const [rLut, gLut, bLut] = lookupLUT(rNorm, gNorm, bNorm, lutData, lutSize)
            
            // Convert back to 0-255 range
            r = Math.max(0, Math.min(255, rLut * 255.0))
            g = Math.max(0, Math.min(255, gLut * 255.0))
            b = Math.max(0, Math.min(255, bLut * 255.0))
          }

          data[i] = r
          data[i + 1] = g
          data[i + 2] = b
        }

        // Apply sharpen using unsharp mask technique
        if (hasSharpen) {
          const sharpenedData = applySharpen(imageData, params.sharpen.amount, params.sharpen.radius, canvas.width, canvas.height)
          ctx.putImageData(sharpenedData, 0, 0)
        } else {
          ctx.putImageData(imageData, 0, 0)
        }
      } else {
        // No adjustments, just draw the image
        ctx.putImageData(ctx.getImageData(0, 0, canvas.width, canvas.height), 0, 0)
      }

      // Apply grain and vignette as post-processing effects (after all pixel adjustments)
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
    img.src = imageMeta.url
  }, [imageMeta, params.exposure, params.contrast, params.wbTemp, params.wbTint, params.hsl, params.curvePoints, params.grain, params.vignette, params.sharpen, dimensions, activeSimulationId, lutData, lutSize])

  if (!imageMeta) {
    return (
      <div className="w-full h-screen bg-background flex items-center justify-center text-muted-foreground">
        <p>Upload an image to get started</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col m-4  rounded-3xl" style={{ width: 'calc(100% - 2rem)', height: 'calc(100% - 2rem)' }}>
      <div
        ref={containerRef}
        className="flex-1"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          className=" rounded-3xl p-3"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
            transformOrigin: 'center center',
          }}
        />
        
        {/* Info and Remove Buttons */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
            aria-label="Image information"
          >
            <Info className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={handleRemoveImage}
            className="flex items-center gap-2 p-2.5 bg-card border border-border rounded-lg text-sm hover:bg-accent transition-colors"
            aria-label="Remove image"
          >
            <X className="w-3 h-3 text-foreground" />
          </button>
        </div>
        
        {/* Info Panel */}
        {showInfo && imageMetadata && (
          <div 
            ref={infoPanelRef}
            className="absolute top-16 right-4 z-20 w-64 bg-card border border-border rounded-lg p-4 shadow-lg"
          >
            {/* Logo */}
            <div className="mb-4 flex justify-center">
              <img
                src={resolvedTheme === 'dark' 
                  ? '/images/clarity-small-dark.svg' 
                  : '/images/clarity-small-light.svg'}
                alt="Clarity"
                className="h-6"
              />
            </div>
            
            <h3 className="text-sm font-semibold text-foreground mb-3">Image Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dimensions:</span>
                <span className="text-foreground font-medium">{imageMetadata.dimensions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aspect Ratio:</span>
                <span className="text-foreground font-medium">{imageMetadata.aspectRatio}</span>
              </div>
              {imageMetadata.fileSize && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File Size:</span>
                  <span className="text-foreground font-medium">{imageMetadata.fileSize}</span>
                </div>
              )}
              {imageMetadata.format && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format:</span>
                  <span className="text-foreground font-medium">{imageMetadata.format}</span>
                </div>
              )}
              {imageMetadata.camera && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Camera:</span>
                  <span className="text-foreground font-medium">{imageMetadata.camera}</span>
                </div>
              )}
              {imageMetadata.lens && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lens:</span>
                  <span className="text-foreground font-medium">{imageMetadata.lens}</span>
                </div>
              )}
              {imageMetadata.location && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="text-foreground font-medium">{imageMetadata.location}</span>
                </div>
              )}
              {imageMetadata.dateTaken && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date Taken:</span>
                  <span className="text-foreground font-medium">{imageMetadata.dateTaken}</span>
                </div>
              )}
            </div>
            
            {/* Camera Settings Section */}
            {(imageMetadata.iso || imageMetadata.aperture || imageMetadata.shutterSpeed || imageMetadata.focalLength) && (
              <>
                <h3 className="text-sm font-semibold text-foreground mt-4 mb-3">Camera Settings</h3>
                <div className="space-y-2 text-sm">
                  {imageMetadata.iso && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ISO:</span>
                      <span className="text-foreground font-medium">{imageMetadata.iso}</span>
                    </div>
                  )}
                  {imageMetadata.aperture && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Aperture:</span>
                      <span className="text-foreground font-medium">{imageMetadata.aperture}</span>
                    </div>
                  )}
                  {imageMetadata.shutterSpeed && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shutter Speed:</span>
                      <span className="text-foreground font-medium">{imageMetadata.shutterSpeed}</span>
                    </div>
                  )}
                  {imageMetadata.focalLength && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Focal Length:</span>
                      <span className="text-foreground font-medium">{imageMetadata.focalLength}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div className="px-4 pb-4">
        <ActiveEdits />
      </div>
    </div>
  )
}

