import { Disclosure } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { BasicAdjustments } from './AdjustmentsPanel/BasicAdjustments'
import { ToneCurve } from './AdjustmentsPanel/ToneCurve'
import { HSLAdjustments } from './AdjustmentsPanel/HSLAdjustments'

export function AdjustmentsPanel() {
  return (
    <div className="space-y-2">
      <div className='text-2xl font-semibold tracking-tight mb-2'>Adjustments</div>
      <Disclosure defaultOpen>
        {({ open }) => (
          <>
            <Disclosure.Button className={`flex w-full justify-between rounded-lg px-4 py-3 text-left text-sm font-medium focus:outline-none focus-visible:ring focus-visible:ring-ring transition-colors ${
              open ? 'bg-card' : 'bg-transparent hover:bg-accent'
            }`}>
              <span>Basic</span>
              <ChevronDownIcon
                className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-muted-foreground`}
              />
            </Disclosure.Button>
            <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-muted-foreground bg-card rounded-lg">
              <BasicAdjustments />
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
              <span>Tone Curve</span>
              <ChevronDownIcon
                className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-muted-foreground`}
              />
            </Disclosure.Button>
            <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-muted-foreground bg-card rounded-lg">
              <ToneCurve />
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
              <span>HSL</span>
              <ChevronDownIcon
                className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-muted-foreground`}
              />
            </Disclosure.Button>
            <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-muted-foreground bg-card rounded-lg">
              <HSLAdjustments />
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

    </div>
  )
}

