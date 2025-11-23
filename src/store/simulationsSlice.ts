import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { EditorParams } from './editorSlice'

export interface Simulation {
  id: string
  name: string
  desc?: string
  year?: number
  thumbnailUrl?: string
  lutData: Float32Array | null
  lutSize: number
  defaultParams: Partial<EditorParams>
}

interface SimulationsState {
  simulations: Simulation[]
  loading: boolean
  error: string | null
}

const initialState: SimulationsState = {
  simulations: [],
  loading: false,
  error: null,
}

export const simulationsSlice = createSlice({
  name: 'simulations',
  initialState,
  reducers: {
    setSimulations: (state, action: PayloadAction<Simulation[]>) => {
      state.simulations = action.payload
      state.loading = false
      state.error = null
    },
    addSimulation: (state, action: PayloadAction<Simulation>) => {
      state.simulations.push(action.payload)
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      state.loading = false
    },
  },
})

export const { setSimulations, addSimulation, setLoading, setError } = simulationsSlice.actions
export default simulationsSlice.reducer

