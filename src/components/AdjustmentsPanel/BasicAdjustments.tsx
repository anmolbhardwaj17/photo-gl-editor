import { useDispatch, useSelector } from 'react-redux'
import { updateParams } from '../../store/editorSlice'
import { RootState } from '../../store'
import { Slider } from './Slider'

export function BasicAdjustments() {
  const dispatch = useDispatch()
  const params = useSelector((state: RootState) => state.editor.params)

  const handleExposureChange = (value: number) => {
    dispatch(updateParams({ exposure: value }))
  }

  const handleContrastChange = (value: number) => {
    dispatch(updateParams({ contrast: value }))
  }

  const handleWBTempChange = (value: number) => {
    dispatch(updateParams({ wbTemp: value }))
  }

  const handleWBTintChange = (value: number) => {
    dispatch(updateParams({ wbTint: value }))
  }

  const handleHighlightsChange = (value: number) => {
    dispatch(updateParams({ highlights: value }))
  }

  const handleShadowsChange = (value: number) => {
    dispatch(updateParams({ shadows: value }))
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Exposure
        </label>
        <div className="flex items-center gap-2 w-full">
          <Slider
            min={-1}
            max={1}
            step={0.1}
            value={params.exposure}
            onChange={handleExposureChange}
            className="flex-1"
            aria-label="Exposure"
          />
          <input
            type="number"
            min="-1"
            max="1"
            step="0.1"
            value={params.exposure.toFixed(1)}
            onChange={(e) => handleExposureChange(parseFloat(e.target.value) || 0)}
            className="w-16 px-2 py-1 bg-card border border-border rounded text-foreground text-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Exposure value"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Contrast
        </label>
        <div className="flex items-center gap-2 w-full">
          <Slider
            min={-100}
            max={100}
            step={1}
            value={params.contrast}
            onChange={handleContrastChange}
            className="flex-1"
            aria-label="Contrast"
          />
          <input
            type="number"
            min="-100"
            max="100"
            step="1"
            value={params.contrast}
            onChange={(e) => handleContrastChange(parseInt(e.target.value, 10) || 0)}
            className="w-16 px-2 py-1 bg-card border border-border rounded text-foreground text-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Contrast value"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          White Balance - Temperature
        </label>
        <div className="flex items-center gap-2 w-full">
          <Slider
            min={2000}
            max={10000}
            step={100}
            value={params.wbTemp}
            onChange={handleWBTempChange}
            className="flex-1"
            aria-label="White balance temperature"
          />
          <input
            type="number"
            min="2000"
            max="10000"
            step="100"
            value={params.wbTemp}
            onChange={(e) => handleWBTempChange(parseInt(e.target.value, 10) || 5500)}
            className="w-16 px-2 py-1 bg-card border border-border rounded text-foreground text-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="White balance temperature value"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          White Balance - Tint
        </label>
        <div className="flex items-center gap-2 w-full">
          <Slider
            min={-100}
            max={100}
            step={1}
            value={params.wbTint}
            onChange={handleWBTintChange}
            className="flex-1"
            aria-label="White balance tint"
          />
          <input
            type="number"
            min="-100"
            max="100"
            step="1"
            value={params.wbTint}
            onChange={(e) => handleWBTintChange(parseInt(e.target.value, 10) || 0)}
            className="w-16 px-2 py-1 bg-card border border-border rounded text-foreground text-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="White balance tint value"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Highlights
        </label>
        <div className="flex items-center gap-2 w-full">
          <Slider
            min={-100}
            max={100}
            step={1}
            value={params.highlights}
            onChange={handleHighlightsChange}
            className="flex-1"
            aria-label="Highlights"
          />
          <input
            type="number"
            min="-100"
            max="100"
            step="1"
            value={params.highlights}
            onChange={(e) => handleHighlightsChange(parseInt(e.target.value, 10) || 0)}
            className="w-16 px-2 py-1 bg-card border border-border rounded text-foreground text-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Highlights value"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Shadows
        </label>
        <div className="flex items-center gap-2 w-full">
          <Slider
            min={-100}
            max={100}
            step={1}
            value={params.shadows}
            onChange={handleShadowsChange}
            className="flex-1"
            aria-label="Shadows"
          />
          <input
            type="number"
            min="-100"
            max="100"
            step="1"
            value={params.shadows}
            onChange={(e) => handleShadowsChange(parseInt(e.target.value, 10) || 0)}
            className="w-16 px-2 py-1 bg-card border border-border rounded text-foreground text-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Shadows value"
          />
        </div>
      </div>
    </div>
  )
}

