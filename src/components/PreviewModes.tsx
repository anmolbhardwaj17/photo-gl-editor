import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setPreviewMode, setIsComparing } from '../store/uiSlice'
import { RootState } from '../store'
import { PreviewMode } from '../store/uiSlice'

export function PreviewModes() {
  const dispatch = useDispatch()
  const previewMode = useSelector((state: RootState) => state.ui.previewMode)
  const isComparing = useSelector((state: RootState) => state.ui.isComparing)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault()
        dispatch(setIsComparing(true))
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        dispatch(setIsComparing(false))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [dispatch])

  const modes: { id: PreviewMode; label: string }[] = [
    { id: 'original', label: 'Original' },
    { id: 'edited', label: 'Edited' },
    { id: 'split', label: 'Split' },
    { id: 'side-by-side', label: 'Side by Side' },
  ]

  return (
    <div className="flex gap-2 p-4 border-b border-dark-border">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => dispatch(setPreviewMode(mode.id))}
          className={`px-4 py-2 rounded text-sm ${
            previewMode === mode.id
              ? 'bg-blue-600 text-white'
              : 'bg-dark-surface text-dark-text hover:bg-dark-border'
          }`}
          aria-label={`Switch to ${mode.label} view`}
        >
          {mode.label}
        </button>
      ))}
      <div className="ml-auto text-xs text-dark-text-muted flex items-center">
        Hold Space to compare
      </div>
    </div>
  )
}

