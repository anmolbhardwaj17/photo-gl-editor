import { useState, useEffect } from 'react'
import { Film, Settings2, Component, ChartScatter } from 'lucide-react'
import { SimulationGallery } from './SimulationGallery'
import { AdjustmentsPanel } from './AdjustmentsPanel'
import { EffectsPanel } from './AdjustmentsPanel/EffectsPanel'
import { ImageVisualizations } from './ImageVisualizations'
import { useTheme } from './ThemeProvider'

type Tab = 'simulations' | 'adjustments' | 'effects' | 'histogram'

export function LeftSidebar() {
  const [activeTab, setActiveTab] = useState<Tab>('simulations')
  const { theme } = useTheme()
  const [isDark, setIsDark] = useState(theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
  
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        setIsDark(e.matches)
      }
      setIsDark(mediaQuery.matches)
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      setIsDark(theme === 'dark')
    }
  }, [theme])

  const tabs = [
    { id: 'simulations' as Tab, icon: Film, label: 'Simulations' },
    { id: 'adjustments' as Tab, icon: Settings2, label: 'Adjustments' },
    { id: 'effects' as Tab, icon: Component, label: 'Effects' },
    { id: 'histogram' as Tab, icon: ChartScatter, label: 'Histogram' },
  ]

  return (
    <aside className="w-96  flex flex-col p-2">
      {/* Top navigation tabs */}
      <div className="flex justify-center my-4 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <div key={tab.id} className="relative">
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`w-20 h-14 border rounded-full flex items-center justify-center gap-2 py-3 transition-colors relative ${
                  isActive
                    ? isDark
                      ? 'bg-white text-black border-transparent'
                      : 'bg-black text-white border-transparent'
                    : 'text-muted-foreground border-[#404040] hover:text-foreground hover:bg-accent'
                }`}
                aria-label={tab.label}
              >
                <Icon className="w-4 h-4" />
                {/* <span className="text-sm">{tab.label}</span> */}
              </button>
            </div>
          )
        })}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'simulations' && (
          <div className="p-2">
            <SimulationGallery />
          </div>
        )}
        {activeTab === 'adjustments' && (
          <div className="p-2">
            <AdjustmentsPanel />
          </div>
        )}
        {activeTab === 'effects' && (
          <div className="p-2">
            <EffectsPanel />
          </div>
        )}
        {activeTab === 'histogram' && (
          <div className="p-2">
            <ImageVisualizations />
          </div>
        )}
      </div>
    </aside>
  )
}

