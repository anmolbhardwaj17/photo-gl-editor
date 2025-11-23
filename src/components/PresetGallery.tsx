import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setPresets } from '../store/presetsSlice'
import { setPresetId, clearPreset } from '../store/editorSlice'
import { loadPresets } from '../presets'
import { RootState } from '../store'
import { Preset } from '../store/presetsSlice'

export function PresetGallery() {
  const dispatch = useDispatch()
  const presets = useSelector((state: RootState) => state.presets.presets)
  const activePresetId = useSelector((state: RootState) => state.editor.activePresetId)
  const loading = useSelector((state: RootState) => state.presets.loading)

  useEffect(() => {
    const load = async () => {
      try {
        const loadedPresets = await loadPresets()
        dispatch(setPresets(loadedPresets))
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
      dispatch(clearPreset())
      return
    }

    // Otherwise, just change the preset ID and keep all existing adjustments
    dispatch(setPresetId(presetId))
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
        {presets.map((preset: Preset, index: number) => (
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

