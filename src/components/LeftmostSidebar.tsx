import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { ExportModal } from './ExportModal'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { useTheme } from './ThemeProvider'

type LeftmostSidebarProps = {
  variant?: 'mobile' | 'desktop'
}

export function LeftmostSidebar({ variant = 'desktop' }: LeftmostSidebarProps) {
  const imageMeta = useSelector((state: RootState) => state.editor.imageMeta)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
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
  
  // Determine which logo to use based on resolved theme
  const logoSrc = resolvedTheme === 'dark' 
    ? '/images/clarity-small-dark.svg' 
    : '/images/clarity-small-light.svg'

  const content =
    variant === 'mobile' ? (
      <div className="w-full flex flex-row items-center justify-between px-4 py-3 border-b border-border bg-background">
        <div>
          <img src={logoSrc} alt="Clarity" className="h-8 w-auto" />
        </div>
        <div className="flex flex-row gap-4">
          {imageMeta && (
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="p-2 rounded-md hover:bg-accent transition-colors"
              aria-label="Export image"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
          <ThemeToggle />
        </div>
      </div>
    ) : (
      <aside className="w-16 flex flex-col items-center py-4 gap-4 border-r border-border">
        <div className="mb-4">
          <img src={logoSrc} alt="Clarity" className="h-8 w-auto" />
        </div>
        <div className="flex flex-col gap-4 flex-1">
          {imageMeta && (
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="p-2 rounded-md hover:bg-accent transition-colors"
              aria-label="Export image"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
          <ThemeToggle />
        </div>
      </aside>
    )

  return (
    <>
      {content}
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
    </>
  )
}

