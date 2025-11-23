import { useDispatch, useSelector } from 'react-redux'
import { updateParams } from '../../store/editorSlice'
import { RootState } from '../../store'
import { Slider } from './Slider'

export function HSLAdjustments() {
  const dispatch = useDispatch()
  const hsl = useSelector((state: RootState) => state.editor.params.hsl)

  const updateHSL = (updates: Partial<typeof hsl>) => {
    dispatch(updateParams({ hsl: { ...hsl, ...updates } }))
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Global Hue
        </label>
        <div className="flex items-center gap-2 w-full">
          <Slider
            min={-180}
            max={180}
            step={1}
            value={hsl.hue}
            onChange={(value) => updateHSL({ hue: value })}
            className="flex-1"
            aria-label="Global hue"
          />
          <input
            type="number"
            min="-180"
            max="180"
            step="1"
            value={hsl.hue}
            onChange={(e) => updateHSL({ hue: parseInt(e.target.value, 10) || 0 })}
            className="w-16 px-2 py-1 bg-card border border-border rounded text-foreground text-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Global hue value"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Global Saturation
        </label>
        <div className="flex items-center gap-2 w-full">
          <Slider
            min={-100}
            max={100}
            step={1}
            value={hsl.saturation}
            onChange={(value) => updateHSL({ saturation: value })}
            className="flex-1"
            aria-label="Global saturation"
          />
          <input
            type="number"
            min="-100"
            max="100"
            step="1"
            value={hsl.saturation}
            onChange={(e) => updateHSL({ saturation: parseInt(e.target.value, 10) || 0 })}
            className="w-16 px-2 py-1 bg-card border border-border rounded text-foreground text-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Global saturation value"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Global Luminance
        </label>
        <div className="flex items-center gap-2 w-full">
          <Slider
            min={-100}
            max={100}
            step={1}
            value={hsl.luminance}
            onChange={(value) => updateHSL({ luminance: value })}
            className="flex-1"
            aria-label="Global luminance"
          />
          <input
            type="number"
            min="-100"
            max="100"
            step="1"
            value={hsl.luminance}
            onChange={(e) => updateHSL({ luminance: parseInt(e.target.value, 10) || 0 })}
            className="w-16 px-2 py-1 bg-card border border-border rounded text-foreground text-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Global luminance value"
          />
        </div>
      </div>
    </div>
  )
}

