import { useSelector } from 'react-redux'
import { UploadDropzone } from './components/UploadDropzone'
import { EditorCanvas } from './components/EditorCanvas'
import { LeftmostSidebar } from './components/LeftmostSidebar'
import { LeftSidebar } from './components/LeftSidebar'
import { RootState } from './store'
import { useTheme } from './components/ThemeProvider'
import { useState, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'

function App() {
  const imageMeta = useSelector((state: RootState) => state.editor.imageMeta)
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
      <main className="flex-1 flex overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          {/* Leftmost sidebar with logo and controls - always visible */}
          <LeftmostSidebar />
          
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
              {/* Left sidebar with tabs */}
              <LeftSidebar />

              {/* Right side - Canvas */}
              <div className="flex-1 bg-background overflow-auto">
                <EditorCanvas />
                {/* <HistoryControls /> */}
              </div>
            </>
          )}
        </div>
      </main>
      <footer className="flex-shrink-0 w-full py-3 px-4">
        <p className="text-xs text-muted-foreground text-center">
          All processing happens locally on your device. We do not collect, store, or transmit any of your data.
        </p>
      </footer>
      <Analytics />
    </div>
  )
}

export default App

