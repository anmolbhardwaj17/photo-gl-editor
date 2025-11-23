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

  const handleExport = async () => {
    if (!imageMeta) return

    dispatch(setStatus('processing'))

    try {
      // In a real implementation, this would:
      // 1. Create an offscreen WebGL context
      // 2. Render the full-resolution image with all shader passes
      // 3. Read back the pixels
      // 4. Convert to Blob and download
      
      // For now, we'll create a simplified export
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageMeta.url
      })

      const canvas = document.createElement('canvas')
      canvas.width = imageMeta.width
      canvas.height = imageMeta.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not get canvas context')

      ctx.drawImage(img, 0, 0)

      // Apply basic adjustments (simplified - in production, use full shader pipeline)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        // Exposure
        const exposureMult = Math.pow(2, params.exposure)
        data[i] = Math.min(255, data[i] * exposureMult)
        data[i + 1] = Math.min(255, data[i + 1] * exposureMult)
        data[i + 2] = Math.min(255, data[i + 2] * exposureMult)

        // Contrast
        const contrast = params.contrast / 100
        data[i] = Math.min(255, Math.max(0, (data[i] - 128) * (1 + contrast) + 128))
        data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * (1 + contrast) + 128))
        data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * (1 + contrast) + 128))
      }

      ctx.putImageData(imageData, 0, 0)

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

