import { useState, useRef, useEffect, ReactNode } from 'react'
import { useDispatch } from 'react-redux'
import { setMobileBottomSheetHeight } from '../store/uiSlice'

interface DraggableBottomSheetProps {
  children: ReactNode
  isOpen: boolean
  onClose?: () => void
  minHeight?: number // Minimum height in pixels (collapsed state)
  maxHeight?: number // Maximum height in pixels (expanded state)
}

export function DraggableBottomSheet({
  children,
  isOpen,
  onClose,
  minHeight = 120,
  maxHeight,
}: DraggableBottomSheetProps) {
  const dispatch = useDispatch()
  const [height, setHeight] = useState(minHeight)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [startHeight, setStartHeight] = useState(minHeight)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragHandleRef = useRef<HTMLDivElement>(null)

  // Calculate max height based on viewport if not provided
  const calculatedMaxHeight = maxHeight || (typeof window !== 'undefined' ? window.innerHeight * 0.9 : 600)

  useEffect(() => {
    if (isOpen) {
      // Set initial height to a reasonable default (about 40% of screen)
      const initialHeight = typeof window !== 'undefined' ? window.innerHeight * 0.4 : minHeight
      const newHeight = Math.max(minHeight, Math.min(calculatedMaxHeight, initialHeight))
      setHeight(newHeight)
      dispatch(setMobileBottomSheetHeight(newHeight))
    } else {
      setHeight(minHeight)
      dispatch(setMobileBottomSheetHeight(0))
    }
  }, [isOpen, minHeight, calculatedMaxHeight, dispatch])

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartY(e.touches[0].clientY)
    setStartHeight(height)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartY(e.clientY)
    setStartHeight(height)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMove = (clientY: number) => {
      const delta = startY - clientY // Positive when dragging up
      let newHeight = startHeight + delta

      // Clamp between min and max
      newHeight = Math.max(minHeight, Math.min(calculatedMaxHeight, newHeight))

      setHeight(newHeight)
      dispatch(setMobileBottomSheetHeight(newHeight))
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      handleMove(e.touches[0].clientY)
    }

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientY)
    }

    const handleEnd = () => {
      setIsDragging(false)
      
      // Snap to min or max if close enough
      const threshold = 50
      if (height < minHeight + threshold) {
        const finalHeight = minHeight
        setHeight(finalHeight)
        dispatch(setMobileBottomSheetHeight(finalHeight))
        if (onClose && height < minHeight + 20) {
          onClose()
        }
      } else if (height > calculatedMaxHeight - threshold) {
        const finalHeight = calculatedMaxHeight
        setHeight(finalHeight)
        dispatch(setMobileBottomSheetHeight(finalHeight))
      }
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleEnd)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleEnd)

    return () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleEnd)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleEnd)
    }
  }, [isDragging, startY, startHeight, height, minHeight, calculatedMaxHeight, onClose, dispatch])

  if (!isOpen) return null

  return (
    <div
      ref={sheetRef}
      className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 md:hidden rounded-t-2xl shadow-2xl"
      style={{
        height: `${height}px`,
        transition: isDragging ? 'none' : 'height 0.3s ease-out',
      }}
    >
        {/* Drag Handle */}
        <div
          ref={dragHandleRef}
          className="w-full flex justify-center py-3 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onMouseDown={handleMouseDown}
        >
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>

      {/* Content */}
      <div className="h-[calc(100%-3rem)] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

