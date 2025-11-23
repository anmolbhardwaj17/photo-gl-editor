import { useRef, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateParams } from '../../store/editorSlice'
import { RootState } from '../../store'

export function ToneCurve() {
  const dispatch = useDispatch()
  const curvePoints = useSelector((state: RootState) => state.editor.params.curvePoints)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDragging = useRef(false)
  const dragIndex = useRef<number | null>(null)
  const handleMouseMoveRef = useRef<(e: MouseEvent) => void>()
  const handleMouseUpRef = useRef<() => void>()

  const drawCurve = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const padding = 20

    // Clear
    ctx.fillStyle = '#1F1F1F'
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = '#404040'
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const x = (width - padding * 2) * (i / 10) + padding
      const y = (height - padding * 2) * (i / 10) + padding
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height - padding)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Draw curve
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < curvePoints.length; i++) {
      const point = curvePoints[i]
      const x = padding + (width - padding * 2) * point.x
      const y = height - padding - (height - padding * 2) * point.y
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()

    // Draw points
    ctx.fillStyle = '#3b82f6'
    curvePoints.forEach((point: { x: number; y: number }) => {
      const x = padding + (width - padding * 2) * point.x
      const y = height - padding - (height - padding * 2) * point.y
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fill()
    })
  }, [curvePoints])

  useEffect(() => {
    drawCurve()
  }, [drawCurve])

  const getPointAt = useCallback((x: number, y: number): number | null => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const padding = 20
    const width = canvas.width
    const height = canvas.height

    // Find closest point
    let minDist = Infinity
    let closestIndex: number | null = null

    curvePoints.forEach((point, index) => {
      const px = padding + (width - padding * 2) * point.x
      const py = height - padding - (height - padding * 2) * point.y
      const dist = Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2))
      if (dist < minDist && dist < 20) {
        minDist = dist
        closestIndex = index
      }
    })

    return closestIndex
  }, [curvePoints])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current || dragIndex.current === null) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const padding = 20
      const width = canvas.width
      const height = canvas.height

      const x = Math.max(padding, Math.min(width - padding, e.clientX - rect.left))
      const y = Math.max(padding, Math.min(height - padding, e.clientY - rect.top))

      const relX = (x - padding) / (width - padding * 2)
      const relY = 1 - (y - padding) / (height - padding * 2)

      const newPoints = [...curvePoints]
      const originalIndex = dragIndex.current
      
      newPoints[originalIndex] = {
        x: Math.max(0, Math.min(1, relX)),
        y: Math.max(0, Math.min(1, relY)),
      }

      // Sort points by x and update dragIndex
      newPoints.sort((a, b) => a.x - b.x)
      const newIndex = newPoints.findIndex((p) => {
        return Math.abs(p.x - relX) < 0.001 && Math.abs(p.y - relY) < 0.001
      })

      if (newIndex !== -1) {
        dragIndex.current = newIndex
      }

      dispatch(updateParams({ curvePoints: newPoints }))
    },
    [curvePoints, dispatch]
  )

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    dragIndex.current = null
    if (handleMouseMoveRef.current) {
      window.removeEventListener('mousemove', handleMouseMoveRef.current)
    }
    if (handleMouseUpRef.current) {
      window.removeEventListener('mouseup', handleMouseUpRef.current)
    }
  }, [])

  // Update refs when handlers change
  useEffect(() => {
    handleMouseMoveRef.current = handleMouseMove
    handleMouseUpRef.current = handleMouseUp
  }, [handleMouseMove, handleMouseUp])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const index = getPointAt(x, y)
      if (index !== null) {
        isDragging.current = true
        dragIndex.current = index
        
        // Add window-level event listeners for proper dragging
        if (handleMouseMoveRef.current) {
          window.addEventListener('mousemove', handleMouseMoveRef.current)
        }
        if (handleMouseUpRef.current) {
          window.addEventListener('mouseup', handleMouseUpRef.current)
        }
      }
    },
    [getPointAt]
  )

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (handleMouseMoveRef.current) {
        window.removeEventListener('mousemove', handleMouseMoveRef.current)
      }
      if (handleMouseUpRef.current) {
        window.removeEventListener('mouseup', handleMouseUpRef.current)
      }
    }
  }, [])

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="w-full max-w-full h-auto border border-border rounded cursor-crosshair"
          style={{ maxWidth: '100%', height: 'auto' }}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseUp}
          aria-label="Tone curve editor"
        />
      </div>
    </div>
  )
}

