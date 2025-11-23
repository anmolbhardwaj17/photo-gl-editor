import { Disclosure } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { useDispatch, useSelector } from 'react-redux'
import { updateParams } from '../../store/editorSlice'
import { RootState } from '../../store'
import { Slider } from './Slider'

export function EffectsPanel() {
  const dispatch = useDispatch()
  const grain = useSelector((state: RootState) => state.editor.params.grain)
  const vignette = useSelector((state: RootState) => state.editor.params.vignette)
  const sharpen = useSelector((state: RootState) => state.editor.params.sharpen)

  return (
    <div className="space-y-2">
      <div className='text-2xl font-semibold tracking-tight mb-2'>Effects</div>
      <Disclosure defaultOpen>
        {({ open }) => (
          <>
            <Disclosure.Button className={`flex w-full justify-between rounded-lg px-4 py-3 text-left text-sm font-medium focus:outline-none focus-visible:ring focus-visible:ring-ring transition-colors ${
              open ? 'bg-card' : 'bg-transparent hover:bg-accent'
            }`}>
              <span>Grain</span>
              <ChevronDownIcon
                className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-muted-foreground`}
              />
            </Disclosure.Button>
            <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-muted-foreground bg-card rounded-lg">
              <div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              Amount
            </label>
            <div className="flex items-center gap-2 w-full">
              <Slider
                min={0}
                max={100}
                step={1}
                value={grain.amount}
                onChange={(value) => dispatch(updateParams({ grain: { ...grain, amount: value } }))}
                className="flex-1"
                aria-label="Grain amount"
              />
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={grain.amount}
                onChange={(e) =>
                  dispatch(updateParams({ grain: { ...grain, amount: parseInt(e.target.value, 10) || 0 } }))
                }
                className="w-16 px-2 py-1 bg-card border border-border rounded text-foreground text-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Grain amount value"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              Size
            </label>
            <div className="flex items-center gap-2 w-full">
              <Slider
                min={0.1}
                max={5}
                step={0.1}
                value={grain.size}
                onChange={(value) => dispatch(updateParams({ grain: { ...grain, size: value } }))}
                className="flex-1"
                aria-label="Grain size"
              />
              <input
                type="number"
                min="0.1"
                max="5"
                step="0.1"
                value={grain.size.toFixed(1)}
                onChange={(e) =>
                  dispatch(updateParams({ grain: { ...grain, size: parseFloat(e.target.value) || 1 } }))
                }
                className="w-16 px-2 py-1 bg-card border border-border rounded text-foreground text-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Grain size value"
              />
            </div>
          </div>
        </div>
            </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button className={`flex w-full justify-between rounded-lg px-4 py-3 text-left text-sm font-medium focus:outline-none focus-visible:ring focus-visible:ring-ring transition-colors ${
              open ? 'bg-card' : 'bg-transparent hover:bg-accent'
            }`}>
              <span>Vignette</span>
              <ChevronDownIcon
                className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-muted-foreground`}
              />
            </Disclosure.Button>
            <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-muted-foreground bg-card rounded-lg">
              <div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              Amount
            </label>
            <div className="flex items-center gap-2 w-full">
              <Slider
                min={0}
                max={100}
                step={1}
                value={vignette.amount}
                onChange={(value) => dispatch(updateParams({ vignette: { ...vignette, amount: value } }))}
                className="flex-1"
                aria-label="Vignette amount"
              />
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={vignette.amount}
                onChange={(e) =>
                  dispatch(updateParams({ vignette: { ...vignette, amount: parseInt(e.target.value, 10) || 0 } }))
                }
                className="w-16 px-2 py-1 bg-card border border-border rounded text-foreground text-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Vignette amount value"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              Size
            </label>
            <div className="flex items-center gap-2 w-full">
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={vignette.size}
                onChange={(value) => dispatch(updateParams({ vignette: { ...vignette, size: value } }))}
                className="flex-1"
                aria-label="Vignette size"
              />
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={vignette.size.toFixed(2)}
                onChange={(e) =>
                  dispatch(updateParams({ vignette: { ...vignette, size: parseFloat(e.target.value) || 0.5 } }))
                }
                className="w-16 px-2 py-1 bg-card border border-border rounded text-foreground text-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Vignette size value"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              Roundness
            </label>
            <div className="flex items-center gap-2 w-full">
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={vignette.roundness}
                onChange={(value) => dispatch(updateParams({ vignette: { ...vignette, roundness: value } }))}
                className="flex-1"
                aria-label="Vignette roundness"
              />
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={vignette.roundness.toFixed(2)}
                onChange={(e) =>
                  dispatch(updateParams({ vignette: { ...vignette, roundness: parseFloat(e.target.value) || 0.5 } }))
                }
                className="w-16 px-2 py-1 bg-card border border-border rounded text-foreground text-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Vignette roundness value"
              />
            </div>
          </div>
        </div>
            </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button className={`flex w-full justify-between rounded-lg px-4 py-3 text-left text-sm font-medium focus:outline-none focus-visible:ring focus-visible:ring-ring transition-colors ${
              open ? 'bg-card' : 'bg-transparent hover:bg-accent'
            }`}>
              <span>Sharpen</span>
              <ChevronDownIcon
                className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-muted-foreground`}
              />
            </Disclosure.Button>
            <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-muted-foreground bg-card rounded-lg">
              <div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              Amount
            </label>
            <div className="flex items-center gap-2 w-full">
              <Slider
                min={0}
                max={100}
                step={1}
                value={sharpen.amount}
                onChange={(value) => dispatch(updateParams({ sharpen: { ...sharpen, amount: value } }))}
                className="flex-1"
                aria-label="Sharpen amount"
              />
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={sharpen.amount}
                onChange={(e) =>
                  dispatch(updateParams({ sharpen: { ...sharpen, amount: parseInt(e.target.value, 10) || 0 } }))
                }
                className="w-16 px-2 py-1 bg-card border border-border rounded text-foreground text-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Sharpen amount value"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              Radius
            </label>
            <div className="flex items-center gap-2 w-full">
              <Slider
                min={0.1}
                max={5}
                step={0.1}
                value={sharpen.radius}
                onChange={(value) => dispatch(updateParams({ sharpen: { ...sharpen, radius: value } }))}
                className="flex-1"
                aria-label="Sharpen radius"
              />
              <input
                type="number"
                min="0.1"
                max="5"
                step="0.1"
                value={sharpen.radius.toFixed(1)}
                onChange={(e) =>
                  dispatch(updateParams({ sharpen: { ...sharpen, radius: parseFloat(e.target.value) || 1 } }))
                }
                className="w-16 px-2 py-1 bg-card border border-border rounded text-foreground text-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Sharpen radius value"
              />
            </div>
          </div>
        </div>
            </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </div>
  )
}

