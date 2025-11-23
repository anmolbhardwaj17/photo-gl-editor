import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setSimulations } from '../store/simulationsSlice'
import { setSimulationId, clearSimulation } from '../store/editorSlice'
import { loadSimulations } from '../simulations'
import { RootState } from '../store'
import { Simulation } from '../store/simulationsSlice'
import { useTheme } from './ThemeProvider'

export function SimulationGallery() {
  const dispatch = useDispatch()
  const simulations = useSelector((state: RootState) => state.simulations.simulations)
  const activeSimulationId = useSelector((state: RootState) => state.editor.activeSimulationId)
  const loading = useSelector((state: RootState) => state.simulations.loading)
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

  useEffect(() => {
    const load = async () => {
      try {
        const loadedSimulations = await loadSimulations()
        dispatch(setSimulations(loadedSimulations))
      } catch (error) {
        console.error('Failed to load simulations:', error)
      }
    }
    
    if (simulations.length === 0) {
      load()
    }
  }, [dispatch, simulations.length])

  const handleSimulationClick = (simulationId: string) => {
    // Toggle: if clicking the same simulation, deselect it
    if (activeSimulationId === simulationId) {
      dispatch(clearSimulation())
      return
    }

    // Otherwise, just change the simulation ID and keep all existing adjustments
    dispatch(setSimulationId(simulationId))
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading simulations...
      </div>
    )
  }

  return (
    <div>
      <div className='text-2xl font-semibold tracking-tight mb-2'>Simulations</div>
      <div className='mb-4 text-sm text-gray-500'>
      Fujifilm Film Simulations recreate iconic analog film looks using in-camera color science.
      Each simulation gives your photos a unique mood, tone, and character.
      </div>
      <div className="flex flex-col gap-2">
        {simulations.map((simulation: Simulation, index: number) => {
          const isActive = activeSimulationId === simulation.id
          const isEven = index % 2 === 0
          
          return (
            <div key={simulation.id}>
              <button
                onClick={() => handleSimulationClick(simulation.id)}
                className={`w-full p-3 text-left transition-colors rounded-lg flex items-center gap-3 ${
                  isActive
                    ? isDark
                      ? 'bg-card text-white font-semibold'
                      : 'bg-card text-black font-semibold'
                    : isEven
                      ? 'text-foreground '
                      : 'text-foreground'
                }`}
                aria-label={`Apply ${simulation.name} simulation`}
              >
                {/* Image placeholder on left */}
                <div className="flex-shrink-0 w-16 h-16 rounded bg-muted flex items-center justify-center">
                  {simulation.thumbnailUrl ? (
                    <img 
                      src={simulation.thumbnailUrl} 
                      alt={simulation.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground">IMG</div>
                  )}
                </div>
                
                {/* Text content on right */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{simulation.name}</div>
                  {simulation.desc && (
                    <div className="text-xs text-muted-foreground mt-0.5">{simulation.desc}</div>
                  )}
                </div>
              </button>
            </div>
          )
        })}
      </div>

    </div>
  )
}

