import { useState } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { Download } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { ExportModal } from './ExportModal'

export function ControlsSidebar() {
  const imageMeta = useSelector((state: RootState) => state.editor.imageMeta)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  return (
    <>
      <aside className="w-16 bg-card flex flex-col items-center py-4 gap-4">
        <div className="p-2 rounded-md hover:bg-accent transition-colors">
          <ThemeToggle />
        </div>
        {imageMeta && (
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Export image"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
      </aside>
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
    </>
  )
}

