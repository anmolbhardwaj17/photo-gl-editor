import { useSelector, useDispatch } from 'react-redux'
import { UploadDropzone } from './components/UploadDropzone'
import { EditorCanvas } from './components/EditorCanvas'
import { LeftmostSidebar } from './components/LeftmostSidebar'
import { LeftSidebar } from './components/LeftSidebar'
import { RootState } from './store'
import { useTheme } from './components/ThemeProvider'
import { useState, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { setMobileBottomSheetOpen } from './store/uiSlice'
import { Settings2 } from 'lucide-react'

function App() {
  const imageMeta = useSelector((state: RootState) => state.editor.imageMeta)
  const mobileBottomSheetHeight = useSelector((state: RootState) => state.ui.mobileBottomSheetHeight)
  const mobileBottomSheetOpen = useSelector((state: RootState) => state.ui.mobileBottomSheetOpen)
  const dispatch = useDispatch()
  const { theme } = useTheme()
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark')
  
  useEffect(() => {
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setResolvedTheme(systemTheme)
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light')
      }
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      setResolvedTheme(theme)
    }
  }, [theme])

  return (
    <div className="h-screen bg-background text-foreground relative flex flex-col overflow-hidden">
      {/* Mobile: top bar */}
      <div className="md:hidden flex-shrink-0">
        <LeftmostSidebar variant="mobile" />
      </div>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop: left rail */}
          <div className="hidden md:flex flex-shrink-0">
            <LeftmostSidebar variant="desktop" />
          </div>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {!imageMeta ? (
            /* Right side - Dropzone when no image */
            <div className="flex-1 flex flex-col items-center justify-center bg-background gap-8 overflow-auto">
              {/* Logo above dropzone */}
              <div className="flex flex-col items-center">
                <img
                  src={resolvedTheme === 'dark'
                    ? '/images/clarity-dark.svg'
                    : '/images/clarity-light.svg'}
                  alt="Clarity"
                  className="h-48"
                />
                <p className="text-muted-foreground text-lg">Where digital meets Fujifilm color.</p>
              </div>
              <div className="w-full max-w-2xl px-4">
                <UploadDropzone />
              </div>
            </div>
          ) : (
            <>
              {/* Desktop: Left sidebar with tabs */}
              <LeftSidebar />

              {/* Canvas area */}
              <div 
                className="flex-1 bg-background overflow-hidden relative transition-all duration-300 ease-out flex flex-col"
                style={{
                  paddingBottom: mobileBottomSheetHeight > 0 ? `${mobileBottomSheetHeight}px` : '0px',
                }}
              >
                <EditorCanvas />
                
                {/* Mobile: Floating button to open adjustments - hidden when sheet is open */}
                {!mobileBottomSheetOpen && (
                  <button
                    onClick={() => dispatch(setMobileBottomSheetOpen(true))}
                    className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-30 hover:bg-primary/90 transition-colors"
                    aria-label="Open adjustments"
                  >
                    <Settings2 className="w-6 h-6" />
                  </button>
                )}
              </div>
            </>
          )}
          </div>
        </div>
      </main>
      {!imageMeta && (
        <footer className="hidden md:flex justify-center w-full py-3 px-4">
          <p className="text-xs text-muted-foreground text-center">
            All processing happens locally on your device. We do not collect, store, or transmit any of your data.
          </p>
        </footer>
      )}
      <Analytics />
    </div>
  )
}

export default App

