import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type PreviewMode = 'original' | 'edited' | 'split' | 'side-by-side'

interface UIState {
  previewMode: PreviewMode
  isComparing: boolean
  zoom: number
  panX: number
  panY: number
  panelsVisible: {
    adjustments: boolean
    presets: boolean
    histogram: boolean
  }
}

const initialState: UIState = {
  previewMode: 'edited',
  isComparing: false,
  zoom: 1,
  panX: 0,
  panY: 0,
  panelsVisible: {
    adjustments: true,
    presets: true,
    histogram: true,
  },
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setPreviewMode: (state, action: PayloadAction<PreviewMode>) => {
      state.previewMode = action.payload
    },
    setIsComparing: (state, action: PayloadAction<boolean>) => {
      state.isComparing = action.payload
    },
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = action.payload
    },
    setPan: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.panX = action.payload.x
      state.panY = action.payload.y
    },
    togglePanel: (state, action: PayloadAction<keyof UIState['panelsVisible']>) => {
      state.panelsVisible[action.payload] = !state.panelsVisible[action.payload]
    },
  },
})

export const { setPreviewMode, setIsComparing, setZoom, setPan, togglePanel } = uiSlice.actions
export default uiSlice.reducer

