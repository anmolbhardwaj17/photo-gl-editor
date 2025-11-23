import { configureStore } from '@reduxjs/toolkit'
import editorReducer from './editorSlice'
import simulationsReducer from './simulationsSlice'
import exportReducer from './exportSlice'
import uiReducer from './uiSlice'
import { createHistoryMiddleware } from './historyMiddleware'

export const store = configureStore({
  reducer: {
    editor: editorReducer,
    simulations: simulationsReducer,
    export: exportReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['editor/setImage'],
        ignoredPaths: ['editor.imageMeta', 'simulations.simulations'],
      },
    }).concat(createHistoryMiddleware()),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

