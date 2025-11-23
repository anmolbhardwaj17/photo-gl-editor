import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { resetParams } from '../store/editorSlice'
import { RootState } from '../store'

export function HistoryControls() {
  const dispatch = useDispatch()
  const imageMeta = useSelector((state: RootState) => state.editor.imageMeta)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        dispatch({ type: 'history/undo' })
      }
      // Ctrl/Cmd + Shift + Z for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        dispatch({ type: 'history/redo' })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dispatch])

  const handleUndo = () => {
    dispatch({ type: 'history/undo' })
  }

  const handleRedo = () => {
    dispatch({ type: 'history/redo' })
  }

  const handleReset = () => {
    dispatch(resetParams())
  }

  if (!imageMeta) {
    return null
  }

  return (
    <div className="flex items-center gap-2 p-4 border-b border-dark-border">
      <button
        onClick={handleUndo}
        className="px-4 py-2 bg-dark-surface border border-dark-border rounded text-dark-text hover:bg-dark-border"
        aria-label="Undo"
      >
        Undo
      </button>
      <button
        onClick={handleRedo}
        className="px-4 py-2 bg-dark-surface border border-dark-border rounded text-dark-text hover:bg-dark-border"
        aria-label="Redo"
      >
        Redo
      </button>
      <button
        onClick={handleReset}
        className="px-4 py-2 bg-dark-surface border border-dark-border rounded text-dark-text hover:bg-dark-border ml-auto"
        aria-label="Reset to original"
      >
        Reset
      </button>
    </div>
  )
}

