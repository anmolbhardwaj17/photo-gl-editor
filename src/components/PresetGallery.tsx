import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setSimulations } from '../store/simulationsSlice'
import { setSimulationId, clearSimulation } from '../store/editorSlice'
import { loadSimulations } from '../simulations'
import { RootState } from '../store'
import { Simulation } from '../store/simulationsSlice'

export function PresetGallery() {
  const dispatch = useDispatch()
  const presets = useSelector((state: RootState) => state.simulations.simulations)
  const activePresetId = useSelector((state: RootState) => state.editor.activeSimulationId)
  const loading = useSelector((state: RootState) => state.simulations.loading)

  useEffect(() => {
    const load = async () => {
      try {
        const loadedPresets = await loadSimulations()
        dispatch(setSimulations(loadedPresets))
      } catch (error) {
        console.error('Failed to load presets:', error)
      }
    }
    
    if (presets.length === 0) {
      load()
    }
  }, [dispatch, presets.length])

  const handlePresetClick = (presetId: string) => {
    // Toggle: if clicking the same preset, deselect it
    if (activePresetId === presetId) {
      dispatch(clearSimulation())
      return
    }

    // Otherwise, just change the preset ID and keep all existing adjustments
    dispatch(setSimulationId(presetId))
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading presets...
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col">
        {presets.map((preset: Simulation, index: number) => (
          <div key={preset.id}>
            <button
              onClick={() => handlePresetClick(preset.id)}
              className={`w-full p-3 text-left transition-colors rounded-xl ${
                activePresetId === preset.id
                  ? 'bg-[#1F1F1F] text-white font-semibold'
                  : 'text-foreground hover:bg-accent'
              }`}
              aria-label={`Apply ${preset.name} preset`}
            >
              <div className="text-sm">{preset.name}</div>
            </button>
            {index < presets.length - 1 && (
              <div className="border-b border-[#1F1F1F]" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

