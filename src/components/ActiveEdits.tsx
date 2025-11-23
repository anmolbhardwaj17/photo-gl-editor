import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { updateParams, clearSimulation } from '../store/editorSlice'
import { X } from 'lucide-react'

export function ActiveEdits() {
  const dispatch = useDispatch()
  const params = useSelector((state: RootState) => state.editor.params)
  const activeSimulationId = useSelector((state: RootState) => state.editor.activeSimulationId)
  const simulations = useSelector((state: RootState) => state.simulations.simulations)
  
  const activeSimulation = simulations.find((s: { id: string }) => s.id === activeSimulationId)
  
  const defaultParams = {
    exposure: 0,
    wbTemp: 5500,
    wbTint: 0,
    contrast: 0,
    hsl: { hue: 0, saturation: 0, luminance: 0 },
    grain: { amount: 0, size: 1 },
    vignette: { amount: 0, size: 0.5, roundness: 0.5 },
    sharpen: { amount: 0, radius: 1 },
  }
  
  const defaultCurvePoints = [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
  ]
  
  const isToneCurveActive = params.curvePoints.length > 2 || 
    (params.curvePoints.length === 2 && 
     (Math.abs(params.curvePoints[0].x - params.curvePoints[0].y) > 0.001 || 
      Math.abs(params.curvePoints[1].x - params.curvePoints[1].y) > 0.001))
  
  const activeEdits = []
  
  // Simulation
  if (activeSimulationId && activeSimulation) {
    activeEdits.push({
      id: 'simulation',
      label: activeSimulation.name,
      onRemove: () => dispatch(clearSimulation()),
    })
  }
  
  // Exposure
  if (Math.abs(params.exposure - defaultParams.exposure) > 0.01) {
    activeEdits.push({
      id: 'exposure',
      label: `Exposure ${params.exposure > 0 ? '+' : ''}${params.exposure.toFixed(1)}`,
      onRemove: () => dispatch(updateParams({ exposure: defaultParams.exposure })),
    })
  }
  
  // Contrast
  if (Math.abs(params.contrast - defaultParams.contrast) > 0.01) {
    activeEdits.push({
      id: 'contrast',
      label: `Contrast ${params.contrast > 0 ? '+' : ''}${params.contrast}`,
      onRemove: () => dispatch(updateParams({ contrast: defaultParams.contrast })),
    })
  }
  
  // White Balance Temperature
  if (Math.abs(params.wbTemp - defaultParams.wbTemp) > 1) {
    activeEdits.push({
      id: 'wbTemp',
      label: `Temp ${params.wbTemp}K`,
      onRemove: () => dispatch(updateParams({ wbTemp: defaultParams.wbTemp })),
    })
  }
  
  // White Balance Tint
  if (Math.abs(params.wbTint - defaultParams.wbTint) > 0.01) {
    activeEdits.push({
      id: 'wbTint',
      label: `Tint ${params.wbTint > 0 ? '+' : ''}${params.wbTint}`,
      onRemove: () => dispatch(updateParams({ wbTint: defaultParams.wbTint })),
    })
  }
  
  // Tone Curve
  if (isToneCurveActive) {
    activeEdits.push({
      id: 'toneCurve',
      label: 'Tone Curve',
      onRemove: () => dispatch(updateParams({ curvePoints: defaultCurvePoints })),
    })
  }
  
  // HSL - Hue
  if (Math.abs(params.hsl.hue) > 0.01) {
    activeEdits.push({
      id: 'hue',
      label: `Hue ${params.hsl.hue > 0 ? '+' : ''}${params.hsl.hue.toFixed(0)}`,
      onRemove: () => dispatch(updateParams({ hsl: { ...params.hsl, hue: defaultParams.hsl.hue } })),
    })
  }
  
  // HSL - Saturation
  if (Math.abs(params.hsl.saturation) > 0.01) {
    activeEdits.push({
      id: 'saturation',
      label: `Saturation ${params.hsl.saturation > 0 ? '+' : ''}${params.hsl.saturation.toFixed(0)}`,
      onRemove: () => dispatch(updateParams({ hsl: { ...params.hsl, saturation: defaultParams.hsl.saturation } })),
    })
  }
  
  // HSL - Luminance
  if (Math.abs(params.hsl.luminance) > 0.01) {
    activeEdits.push({
      id: 'luminance',
      label: `Luminance ${params.hsl.luminance > 0 ? '+' : ''}${params.hsl.luminance.toFixed(0)}`,
      onRemove: () => dispatch(updateParams({ hsl: { ...params.hsl, luminance: defaultParams.hsl.luminance } })),
    })
  }
  
  // Grain
  if (Math.abs(params.grain.amount - defaultParams.grain.amount) > 0.01) {
    activeEdits.push({
      id: 'grain',
      label: `Grain ${params.grain.amount}%`,
      onRemove: () => dispatch(updateParams({ grain: defaultParams.grain })),
    })
  }
  
  // Vignette
  if (Math.abs(params.vignette.amount - defaultParams.vignette.amount) > 0.01) {
    activeEdits.push({
      id: 'vignette',
      label: `Vignette ${params.vignette.amount}%`,
      onRemove: () => dispatch(updateParams({ vignette: defaultParams.vignette })),
    })
  }
  
  // Sharpen
  if (Math.abs(params.sharpen.amount - defaultParams.sharpen.amount) > 0.01) {
    activeEdits.push({
      id: 'sharpen',
      label: `Sharpen ${params.sharpen.amount}%`,
      onRemove: () => dispatch(updateParams({ sharpen: defaultParams.sharpen })),
    })
  }
  
  return (
    <div className="overflow-x-auto overflow-y-hidden">
      <div className="flex gap-2 px-4 py-2 min-h-[3rem] items-center">
        {activeEdits.length === 0 ? (
          <div className="text-sm text-muted-foreground">No edits applied</div>
        ) : (
          activeEdits.map((edit) => (
            <div
              key={edit.id}
              className="group relative inline-flex items-center gap-2 px-3 py-1.5 bg-card rounded-full text-sm dark:text-gray-500 text-gray-400 hover:bg-accent transition-colors flex-shrink-0"
            >
              <span>{edit.label}</span>
              <button
                onClick={edit.onRemove}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-destructive/20 rounded"
                aria-label={`Remove ${edit.label}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

