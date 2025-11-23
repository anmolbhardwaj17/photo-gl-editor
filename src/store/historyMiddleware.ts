import { Middleware, AnyAction } from '@reduxjs/toolkit'
import { EditorParams } from './editorSlice'

// Define RootState type locally to avoid circular dependency
type RootState = {
  editor: {
    params: EditorParams
  }
}

interface HistoryState {
  past: EditorParams[]
  present: EditorParams
  future: EditorParams[]
}

const MAX_HISTORY = 50

export const createHistoryMiddleware = (): Middleware<object, RootState, any> => {
  const history: HistoryState = {
    past: [],
    present: {
      exposure: 0,
      wbTemp: 5500,
      wbTint: 0,
      contrast: 0,
      highlights: 0,
      shadows: 0,
      hsl: { hue: 0, saturation: 0, luminance: 0 },
      grain: { amount: 0, size: 1 },
      vignette: { amount: 0, size: 0.5, roundness: 0.5 },
      sharpen: { amount: 0, radius: 1 },
    },
    future: [],
  }

  return (store) => (next) => (action: unknown) => {
    const result = next(action)
    const typedAction = action as AnyAction

    // Only track parameter changes
    if (typedAction.type === 'editor/updateParams' || typedAction.type === 'editor/setSimulation') {
      const state = store.getState() as RootState
      const currentParams = state.editor.params

      // Deep clone params to create immutable snapshot
      const snapshot: EditorParams = {
        ...currentParams,
        hsl: { ...currentParams.hsl },
        grain: { ...currentParams.grain },
        vignette: { ...currentParams.vignette },
        sharpen: { ...currentParams.sharpen },
      }

      // Add to history
      history.past.push(history.present)
      history.present = snapshot

      // Limit history size
      if (history.past.length > MAX_HISTORY) {
        history.past.shift()
      }

      // Clear future when new action is performed
      history.future = []
    }

    // Handle undo/redo actions
    if (typedAction.type === 'history/undo') {
      if (history.past.length > 0) {
        history.future.unshift(history.present)
        history.present = history.past.pop()!
        store.dispatch({ type: 'editor/updateParams', payload: history.present })
        store.dispatch({ type: 'editor/setHistoryIndex', payload: history.past.length })
      }
    }

    if (typedAction.type === 'history/redo') {
      if (history.future.length > 0) {
        history.past.push(history.present)
        history.present = history.future.shift()!
        store.dispatch({ type: 'editor/updateParams', payload: history.present })
        store.dispatch({ type: 'editor/setHistoryIndex', payload: history.past.length })
      }
    }

    if (typedAction.type === 'editor/setImage' || typedAction.type === 'editor/resetParams') {
      // Reset history on new image or reset
      history.past = []
      history.future = []
      const state = store.getState() as RootState
      history.present = { ...state.editor.params }
    }

    return result
  }
}

