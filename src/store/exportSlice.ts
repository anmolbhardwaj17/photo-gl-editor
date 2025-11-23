import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type ExportFormat = 'png' | 'jpeg'
export type ExportStatus = 'idle' | 'processing' | 'success' | 'error'

interface ExportState {
  status: ExportStatus
  progress: number
  lastExportUrl: string | null
  error: string | null
  format: ExportFormat
  quality: number
  includeMetadata: boolean
}

const initialState: ExportState = {
  status: 'idle',
  progress: 0,
  lastExportUrl: null,
  error: null,
  format: 'png',
  quality: 0.92,
  includeMetadata: true,
}

export const exportSlice = createSlice({
  name: 'export',
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<ExportStatus>) => {
      state.status = action.payload
      if (action.payload === 'idle') {
        state.progress = 0
        state.error = null
      }
    },
    setProgress: (state, action: PayloadAction<number>) => {
      state.progress = action.payload
    },
    setExportUrl: (state, action: PayloadAction<string>) => {
      state.lastExportUrl = action.payload
      state.status = 'success'
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.status = 'error'
    },
    setFormat: (state, action: PayloadAction<ExportFormat>) => {
      state.format = action.payload
    },
    setQuality: (state, action: PayloadAction<number>) => {
      state.quality = action.payload
    },
    setIncludeMetadata: (state, action: PayloadAction<boolean>) => {
      state.includeMetadata = action.payload
    },
  },
})

export const { setStatus, setProgress, setExportUrl, setError, setFormat, setQuality, setIncludeMetadata } = exportSlice.actions
export default exportSlice.reducer

