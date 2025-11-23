import { useCallback, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { setImage } from '../store/editorSlice'
import { ImageMeta } from '../store/editorSlice'

export function UploadDropzone() {
  const dispatch = useDispatch()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const workerRef = useRef<Worker | null>(null)

  const processFile = useCallback(async (file: File) => {
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/i)) {
      alert('Please upload a JPEG or PNG image')
      return
    }

    setIsProcessing(true)

    try {
      // Create worker if needed
      if (!workerRef.current) {
        workerRef.current = new Worker(
          new URL('../workers/imageWorker.ts', import.meta.url),
          { type: 'module' }
        )
      }

      const worker = workerRef.current
      const id = `${Date.now()}-${Math.random()}`

      // Create promise to handle worker response
      const result = await new Promise<{ imageBitmap: ImageBitmap; width: number; height: number }>(
        (resolve, reject) => {
          const handleMessage = (event: MessageEvent) => {
            if (event.data.id === id) {
              worker.removeEventListener('message', handleMessage)
              if (event.data.type === 'decode-success') {
                resolve({
                  imageBitmap: event.data.imageBitmap,
                  width: event.data.width,
                  height: event.data.height,
                })
              } else {
                reject(new Error(event.data.error || 'Failed to decode image'))
              }
            }
          }

          worker.addEventListener('message', handleMessage)
          worker.postMessage({ type: 'decode', file, id })
        }
      )

      // Create object URL for the image
      const canvas = document.createElement('canvas')
      canvas.width = result.width
      canvas.height = result.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not get canvas context')

      ctx.drawImage(result.imageBitmap, 0, 0)
      const url = canvas.toDataURL('image/png')
      const originalUrl = URL.createObjectURL(file)

      const imageMeta: ImageMeta = {
        width: result.width,
        height: result.height,
        url,
        originalUrl,
      }

      dispatch(setImage(imageMeta))
      result.imageBitmap.close()
    } catch (error) {
      console.error('Error processing image:', error)
      alert(error instanceof Error ? error.message : 'Failed to process image')
    } finally {
      setIsProcessing(false)
    }
  }, [dispatch])

  const handleFileSelect = useCallback(
    (file: File) => {
      processFile(file)
    },
    [processFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
        isDragging
          ? 'bg-accent/10 border-primary'
          : 'bg-card border-border'
      } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Upload image"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="File input"
      />
      {isProcessing ? (
        <div className="flex flex-col gap-4 items-center">
          <div className="w-12 h-12 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground mt-2">Processing image...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 items-center">
          <div className="text-center">
            <p className="text-lg font-medium text-foreground mb-2">
              Drop an image here, or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Supports JPEG and PNG files
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

