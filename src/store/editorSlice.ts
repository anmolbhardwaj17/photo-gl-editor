import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ImageMeta {
  width: number
  height: number
  url: string
  originalUrl: string
}

export interface CurvePoint {
  x: number
  y: number
}

export interface HSLParams {
  hue: number
  saturation: number
  luminance: number
  redHue?: number
  redSat?: number
  redLum?: number
  greenHue?: number
  greenSat?: number
  greenLum?: number
  blueHue?: number
  blueSat?: number
  blueLum?: number
}

export interface GrainParams {
  amount: number
  size: number
}

export interface VignetteParams {
  amount: number
  size: number
  roundness: number
}

export interface SharpenParams {
  amount: number
  radius: number
}

export interface EditorParams {
  exposure: number
  wbTemp: number
  wbTint: number
  contrast: number
  curvePoints: CurvePoint[]
  hsl: HSLParams
  grain: GrainParams
  vignette: VignetteParams
  sharpen: SharpenParams
}

export interface EditorState {
  imageMeta: ImageMeta | null
  params: EditorParams
  activePresetId: string | null
  historyIndex: number
}

const defaultParams: EditorParams = {
  exposure: 0,
  wbTemp: 5500,
  wbTint: 0,
  contrast: 0,
  curvePoints: [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
  ],
  hsl: {
    hue: 0,
    saturation: 0,
    luminance: 0,
  },
  grain: {
    amount: 0,
    size: 1,
  },
  vignette: {
    amount: 0,
    size: 0.5,
    roundness: 0.5,
  },
  sharpen: {
    amount: 0,
    radius: 1,
  },
}

const initialState: EditorState = {
  imageMeta: null,
  params: defaultParams,
  activeSimulationId: null,
  historyIndex: 0,
}

export const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setImage: (state, action: PayloadAction<ImageMeta | null>) => {
      state.imageMeta = action.payload
      state.params = { ...defaultParams }
      state.activeSimulationId = null
      state.historyIndex = 0
    },
    updateParams: (state, action: PayloadAction<Partial<EditorParams>>) => {
      state.params = { ...state.params, ...action.payload }
    },
    setSimulation: (state, action: PayloadAction<{ simulationId: string; params: EditorParams }>) => {
      state.activeSimulationId = action.payload.simulationId
      state.params = action.payload.params
    },
    setSimulationId: (state, action: PayloadAction<string>) => {
      // Only change the simulation ID, keep all existing adjustments
      state.activeSimulationId = action.payload
    },
    clearSimulation: (state) => {
      state.activeSimulationId = null
    },
    resetParams: (state) => {
      state.params = { ...defaultParams }
      state.activeSimulationId = null
    },
    setHistoryIndex: (state, action: PayloadAction<number>) => {
      state.historyIndex = action.payload
    },
  },
})

export const { setImage, updateParams, setSimulation, setSimulationId, clearSimulation, resetParams, setHistoryIndex } = editorSlice.actions
export default editorSlice.reducer

