import { useEffect, useRef, useState, useCallback } from 'react'

interface RotaryDialProps {
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  className?: string
  'aria-label'?: string
}

// Function to play a short tick sound
function playTickSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.05)
    
    oscillator.onended = () => {
      audioContext.close()
    }
  } catch (error) {
    console.debug('Audio context not available:', error)
  }
}

export function RotaryDial({ min, max, step, value, onChange, className = '', 'aria-label': ariaLabel }: RotaryDialProps) {
  const dialRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const startValueRef = useRef(0)
  const previousValueRef = useRef(value)
  const [rotation, setRotation] = useState(0)

  // Calculate rotation angle from value (horizontal rotation)
  useEffect(() => {
    const percentage = (value - min) / (max - min)
    const angle = percentage * 180 - 90 // -90 to 90 degrees (180 degree range for horizontal)
    setRotation(angle)
    previousValueRef.current = value
  }, [value, min, max])

  // Convert rotation angle to value
  const angleToValue = useCallback((angle: number) => {
    // Normalize angle to -90 to 90 range
    let normalizedAngle = angle
    if (normalizedAngle < -90) normalizedAngle = -90
    if (normalizedAngle > 90) normalizedAngle = 90
    
    const percentage = (normalizedAngle + 90) / 180
    const rawValue = min + percentage * (max - min)
    
    // Round to nearest step
    return Math.round(rawValue / step) * step
  }, [min, max, step])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingRef.current = true
    startXRef.current = e.clientX
    startValueRef.current = value
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !dialRef.current) return
      
      const deltaX = e.clientX - startXRef.current
      const sensitivity = 2 // pixels per degree
      const angleDelta = deltaX / sensitivity
      const newAngle = rotation + angleDelta
      const newValue = angleToValue(newAngle)
      
      if (newValue !== previousValueRef.current) {
        playTickSound()
        previousValueRef.current = newValue
      }
      
      onChange(newValue)
      startXRef.current = e.clientX
    }
    
    const handleMouseUp = () => {
      isDraggingRef.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [rotation, value, angleToValue, onChange])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -step : step
    const newValue = Math.max(min, Math.min(max, value + delta))
    
    if (newValue !== previousValueRef.current) {
      playTickSound()
      previousValueRef.current = newValue
    }
    
    onChange(newValue)
  }, [value, min, max, step, onChange])

  const width = 120
  const height = 40
  const radius = height / 2
  const centerY = height / 2

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <div
        ref={dialRef}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        className="relative w-full h-full cursor-grab active:cursor-grabbing select-none"
        role="slider"
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
      >
        {/* Horizontal Dial - SVG */}
        <svg width={width} height={height} className="absolute inset-0">
          {/* Background arc (semi-circle) */}
          <path
            d={`M ${radius} ${centerY} A ${radius - 4} ${radius - 4} 0 0 1 ${width - radius} ${centerY}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            className="text-border opacity-30"
          />
          
          {/* Active arc showing current value */}
          <path
            d={`M ${radius} ${centerY} A ${radius - 4} ${radius - 4} 0 ${rotation > 0 ? '1' : '0'} ${rotation > 0 ? '1' : '0'} ${width / 2 + (radius - 4) * Math.sin(rotation * Math.PI / 180)} ${centerY - (radius - 4) * (1 - Math.cos(rotation * Math.PI / 180))}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            className="text-foreground"
          />
          
          {/* Tick marks */}
          {[-90, -60, -30, 0, 30, 60, 90].map((tickAngle, index) => {
            const tickX = width / 2 + (radius - 4) * Math.sin(tickAngle * Math.PI / 180)
            const tickY = centerY - (radius - 4) * (1 - Math.cos(tickAngle * Math.PI / 180))
            const innerRadius = radius - 12
            const innerX = width / 2 + innerRadius * Math.sin(tickAngle * Math.PI / 180)
            const innerY = centerY - innerRadius * (1 - Math.cos(tickAngle * Math.PI / 180))
            
            return (
              <line
                key={index}
                x1={innerX}
                y1={innerY}
                x2={tickX}
                y2={tickY}
                stroke="currentColor"
                strokeWidth={1.5}
                className="text-foreground opacity-40"
              />
            )
          })}
          
          {/* Indicator line (pointer) */}
          <line
            x1={width / 2}
            y1={centerY}
            x2={width / 2 + (radius - 4) * Math.sin(rotation * Math.PI / 180)}
            y2={centerY - (radius - 4) * (1 - Math.cos(rotation * Math.PI / 180))}
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            className="text-foreground"
          />
          
          {/* Center dot */}
          <circle
            cx={width / 2}
            cy={centerY}
            r={3}
            fill="currentColor"
            className="text-foreground"
          />
        </svg>
        
        {/* Value display */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-xs text-muted-foreground text-center whitespace-nowrap">
          {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
        </div>
      </div>
    </div>
  )
}

