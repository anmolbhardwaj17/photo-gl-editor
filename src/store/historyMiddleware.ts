import { Middleware } from '@reduxjs/toolkit'
import { RootState } from './index'
import { EditorParams } from './editorSlice'

interface HistoryState {
  past: EditorParams[]
  present: EditorParams
  future: EditorParams[]
}

const MAX_HISTORY = 50

export const createHistoryMiddleware = (): Middleware<{}, RootState> => {
  const history: HistoryState = {
    past: [],
    present: {
      exposure: 0,
      wbTemp: 5500,
      wbTint: 0,
      contrast: 0,
      curvePoints: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
      hsl: { hue: 0, saturation: 0, luminance: 0 },
      grain: { amount: 0, size: 1 },
      vignette: { amount: 0, size: 0.5, roundness: 0.5 },
      sharpen: { amount: 0, radius: 1 },
    },
    future: [],
  }

  return (store) => (next) => (action) => {
    const result = next(action)

    // Only track parameter changes
    if (action.type === 'editor/updateParams' || action.type === 'editor/setSimulation') {
      const state = store.getState() as RootState
      const currentParams = state.editor.params

      // Deep clone params to create immutable snapshot
      const snapshot: EditorParams = {
        ...currentParams,
        curvePoints: currentParams.curvePoints.map((p) => ({ ...p })),
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
    if (action.type === 'history/undo') {
      if (history.past.length > 0) {
        history.future.unshift(history.present)
        history.present = history.past.pop()!
        store.dispatch({ type: 'editor/updateParams', payload: history.present })
        store.dispatch({ type: 'editor/setHistoryIndex', payload: history.past.length })
      }
    }

    if (action.type === 'history/redo') {
      if (history.future.length > 0) {
        history.past.push(history.present)
        history.present = history.future.shift()!
        store.dispatch({ type: 'editor/updateParams', payload: history.present })
        store.dispatch({ type: 'editor/setHistoryIndex', payload: history.past.length })
      }
    }

    if (action.type === 'editor/setImage' || action.type === 'editor/resetParams') {
      // Reset history on new image or reset
      history.past = []
      history.future = []
      const state = store.getState() as RootState
      history.present = { ...state.editor.params }
    }

    return result
  }
}

