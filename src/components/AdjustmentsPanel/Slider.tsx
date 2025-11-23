import { useEffect, useRef } from 'react'

interface SliderProps {
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
    
    // Short, subtle tick sound
    oscillator.frequency.value = 800 // Higher pitch for a more subtle tick
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime) // Low volume
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05) // Quick fade
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.05) // Very short duration
    
    // Clean up after sound finishes
    oscillator.onended = () => {
      audioContext.close()
    }
  } catch (error) {
    // Silently fail if audio context is not available
    console.debug('Audio context not available:', error)
  }
}

export function Slider({ min, max, step, value, onChange, className = '', 'aria-label': ariaLabel }: SliderProps) {
  const sliderRef = useRef<HTMLInputElement>(null)
  const previousValueRef = useRef<number>(value)

  useEffect(() => {
    if (sliderRef.current) {
      const percentage = ((value - min) / (max - min)) * 100
      sliderRef.current.style.setProperty('--slider-progress', `${percentage}%`)
    }
  }, [value, min, max])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    // Only play sound if value actually changed
    if (newValue !== previousValueRef.current) {
      playTickSound()
      previousValueRef.current = newValue
    }
    onChange(newValue)
  }

  return (
    <div className={`relative py-2 ${className}`} style={{ cursor: 'pointer' }}>
      <input
        ref={sliderRef}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="w-full"
        aria-label={ariaLabel}
        style={{ cursor: 'pointer' }}
      />
    </div>
  )
}

