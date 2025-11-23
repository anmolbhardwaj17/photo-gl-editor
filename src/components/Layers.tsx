import { useSelector } from 'react-redux'
import { RootState } from '../store'

export function Layers() {
  const activeSimulationId = useSelector((state: RootState) => state.editor.activeSimulationId)
  const simulations = useSelector((state: RootState) => state.simulations.simulations)
  const params = useSelector((state: RootState) => state.editor.params)

  // Find active simulation name
  const activeSimulation = simulations.find((p) => p.id === activeSimulationId)

  // Check which adjustments are active
  const hasBasicAdjustments =
    params.exposure !== 0 ||
    params.contrast !== 0 ||
    params.wbTemp !== 5500 ||
    params.wbTint !== 0

  // Check if highlights/shadows are active
  const hasHighlightsShadows = params.highlights !== 0 || params.shadows !== 0

  const hasHSL =
    params.hsl.hue !== 0 ||
    params.hsl.saturation !== 0 ||
    params.hsl.luminance !== 0 ||
    params.hsl.redHue !== undefined ||
    params.hsl.redSat !== undefined ||
    params.hsl.redLum !== undefined ||
    params.hsl.greenHue !== undefined ||
    params.hsl.greenSat !== undefined ||
    params.hsl.greenLum !== undefined ||
    params.hsl.blueHue !== undefined ||
    params.hsl.blueSat !== undefined ||
    params.hsl.blueLum !== undefined

  const hasEffects =
    params.grain.amount !== 0 ||
    params.vignette.amount !== 0 ||
    params.sharpen.amount !== 0

  const layers: Array<{ name: string; type: string }> = []

  // Add simulation layer if active
  if (activeSimulation) {
    layers.push({
      name: activeSimulation.name,
      type: 'simulation',
    })
  }

  // Add basic adjustments layer if active
  if (hasBasicAdjustments) {
    layers.push({
      name: 'Basic Adjustments',
      type: 'basic',
    })
  }

  // Add highlights/shadows layer if active
  if (hasHighlightsShadows) {
    layers.push({
      name: 'Highlights & Shadows',
      type: 'highlights-shadows',
    })
  }

  // Add HSL layer if active
  if (hasHSL) {
    layers.push({
      name: 'HSL',
      type: 'hsl',
    })
  }

  // Add effects layer if active
  if (hasEffects) {
    layers.push({
      name: 'Effects',
      type: 'effects',
    })
  }

  if (layers.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Layers</h2>
        <div className="text-sm text-muted-foreground text-center py-4">
          No layers active
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 border-b border-border">
      <h2 className="text-lg font-semibold mb-4">Layers</h2>
      <div className="space-y-2">
        {layers.map((layer, index) => (
          <div
            key={`${layer.type}-${index}`}
            className="flex items-center justify-between p-2 bg-card rounded border border-border"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-sm">{layer.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {index + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

