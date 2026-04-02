import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { decisionsApi } from '../services/api'

// ══════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════

interface DecisionFile {
  _id: string
  id: string // alias for _id
  fileName: string
  number: string
  date: string
  cohort: number
  year: string
  system: string
  total_students: number
  matched: number
  reconciled: boolean
  pages: number
  fileSize: number
  uploadedAt: string
  source: string
  mimeType?: string
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface FolderNode {
  _id: string
  name: string
  type: 'year'
}

// Helper to normalize API response items
function norm(f: any): DecisionFile {
  return { ...f, id: f._id }
}

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════
export default function Decisions() {
  const [files, setFiles] = useState<DecisionFile[]>([])
  const [customFolders, setCustomFolders] = useState<FolderNode[]>([])
  const [loading, setLoading] = useState(true)

  // Navigation state: path = ['year'] - just 1 level
  const [path, setPath] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<DecisionFile | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fullPreviewFile, setFullPreviewFile] = useState<DecisionFile | null>(null)
  const [fullPreviewUrl, setFullPreviewUrl] = useState<string | null>(null)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Modals
  const [showAddFolderModal, setShowAddFolderModal] = useState(false)
  const [showAddFileModal, setShowAddFileModal] = useState(false)
  const [showEditFileModal, setShowEditFileModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Resizable preview panel
  const [previewWidth, setPreviewWidth] = useState(400)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  // Load data from API on mount
  useEffect(() => {
    async function load() {
      try {
        const [filesRes, foldersRes] = await Promise.all([
          decisionsApi.list(),
          decisionsApi.listFolders(),
        ])
        setFiles((filesRes.data.data || []).map(norm))
        setCustomFolders(foldersRes.data.data || [])
      } catch (e) {
        console.error('Failed to load decisions:', e)
toast.error('Không thể tải dữ liệu quyết định')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Build folder tree from data ──
  const folderTree = useMemo(() => {
    const years = new Set<string>()
    files.forEach(f => years.add(f.year))
    customFolders.forEach(cf => {
      if (cf.type === 'year') years.add(cf.name)
    })
    return { years: Array.from(years).sort().reverse() }
  }, [files, customFolders])

  // ── Current level items ──
  const currentItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()

    if (path.length === 0) {
      // Show year folders
      return folderTree.years
        .filter(y => !q || y.toLowerCase().includes(q))
        .map(year => ({
          type: 'folder' as const,
          name: year,
          label: `Năm ${year}`,
          count: files.filter(f => f.year === year).length,
          icon: 'year',
        }))
    }

    if (path.length === 1) {
      // Show all files for this year
      const year = path[0]
      return files
        .filter(f => f.year === year)
        .filter(f => !q || f.fileName.toLowerCase().includes(q) || f.number.toLowerCase().includes(q))
        .sort((a, b) => a.fileName.localeCompare(b.fileName))
        .map(f => ({
          type: 'file' as const,
          name: f.fileName,
          label: f.fileName,
          file: f,
          icon: 'file',
        }))
    }

    return []
  }, [path, folderTree, files, searchTerm])

  // Pagination for file list
  const totalPages = useMemo(() => {
    if (path.length !== 1) return 1 // Only paginate file list
    return Math.max(1, Math.ceil(currentItems.length / pageSize))
  }, [currentItems.length, path.length, pageSize])

  const paginatedItems = useMemo(() => {
    if (path.length !== 1) return currentItems // Only paginate file list
    const start = (currentPage - 1) * pageSize
    return currentItems.slice(start, start + pageSize)
  }, [currentItems, currentPage, pageSize, path.length])

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (currentPage <= 3) return [1, 2, 3, 4, 5]
    if (currentPage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2]
  }, [currentPage, totalPages])

  // Reset to page 1 when path or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [path, searchTerm])

  // Adjust current page if it exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  // ── Navigation ──
  const navigateTo = (name: string) => setPath(prev => [...prev, name])
  const navigateBack = () => {
    setPath(prev => prev.slice(0, -1))
    setSelectedFile(null)
setPreviewUrl(null)
  }
  const navigateToBreadcrumb = (index: number) => {
    setPath(prev => prev.slice(0, index))
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  // ── Resize handlers ──
  const handleMouseDown = useCallback(() => {
    setIsDragging(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return
      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const newWidth = rect.right - e.clientX - 12 // 12px for gap
      if (newWidth > 250 && newWidth < rect.width - 300) {
        setPreviewWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging])

  // ── File selection & preview ──
  // ── Single click → quick preview in side panel ──
  const handleFileClick = useCallback((file: DecisionFile) => {
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null
      setSelectedFile(file)
      setPreviewUrl(decisionsApi.getFileUrl(file._id))
    }, 250)
  }, [])

  // ── Double click → full modal preview ──
  const handleFileDoubleClick = useCallback((file: DecisionFile) => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
    }
    setFullPreviewFile(file)
    setFullPreviewUrl(decisionsApi.getFileUrl(file._id))
  }, [])

  // ── File upload ──
  const handleUploadFiles = useCallback(async (
    uploadedFiles: File[],
    data: { year: string }
  ) => {
    try {
      const res = await decisionsApi.upload(uploadedFiles, data.year)
      const newFiles = (res.data.data || []).map(norm)
      const skipped: string[] = res.data.skipped || []
      setFiles(prev => [...prev, ...newFiles])
      if (newFiles.length > 0 && skipped.length > 0) {
        toast.success(`Đã thêm ${newFiles.length} file, bỏ qua ${skipped.length} file trùng tên`)
      } else if (newFiles.length > 0) {
        toast.success(`Đã thêm ${newFiles.length} file quyết định`)
      }
      setShowAddFileModal(false)
    } catch (e: any) {
      console.error('Upload failed:', e)
      const status = e?.response?.status
      const msg = e?.response?.data?.error || 'Tải lên thất bại'
      const skipped: string[] = e?.response?.data?.skipped || []
      if (status === 409) {
toast(`${skipped.length} file đã tồn tại, bỏ qua`, { icon: '⚠️' })
        setShowAddFileModal(false)
      } else {
        toast.error(msg)
      }
    }
  }, [])

  // ── Delete file ──
  const handleDeleteFile = useCallback(async (file: DecisionFile) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa file "${file.fileName}"?`)) return
    try {
      await decisionsApi.delete(file._id)
      setFiles(prev => prev.filter(f => f._id !== file._id))
      if (selectedFile?._id === file._id) {
        setSelectedFile(null)
        setPreviewUrl(null)
      }
      toast.success(`Đã xóa ${file.fileName}`)
    } catch (e) {
      console.error('Delete failed:', e)
      toast.error('Xóa thất bại')
    }
  }, [selectedFile])

  // ── Edit file ──
  const handleEditFile = useCallback(async (updated: Partial<DecisionFile>) => {
    if (!selectedFile) return
    try {
      const res = await decisionsApi.update(selectedFile._id, updated as Record<string, unknown>)
      const updatedFile = norm(res.data.data)
      setFiles(prev => prev.map(f => f._id === selectedFile._id ? updatedFile : f))
      setSelectedFile(updatedFile)
      setShowEditFileModal(false)
      toast.success(`Đã cập nhật ${selectedFile.fileName}`)
    } catch (e) {
      console.error('Update failed:', e)
      toast.error('Cập nhật thất bại')
    }
  }, [selectedFile])

  // ── Delete year folder ──
  const handleDeleteFolder = useCallback(async (year: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa năm ${year}?`)) return
    const folder = customFolders.find(cf => cf.name === year)
    const yearFiles = files.filter(f => f.year === year)
    
    try {
      // Delete all files in this year first
      for (const file of yearFiles) {
        try {
          await decisionsApi.delete(file._id)
        } catch (e) {
          console.error(`Failed to delete file ${file._id}:`, e)
        }
      }
      
      // Then delete the folder
      if (folder) {
        try {
          await decisionsApi.deleteFolder(folder._id)
          console.log(`Folder ${folder._id} deleted successfully`)
        } catch (e) {
          console.error(`Failed to delete folder ${folder._id}:`, e)
          // Even if folder deletion fails, we've deleted the files, so update state
        }
      }
      
      // Update state - remove the year and all its files
      setCustomFolders(prev => prev.filter(cf => cf.name !== year))
      setFiles(prev => prev.filter(f => f.year !== year))
      setPath([])
      setSelectedFile(null)
      setPreviewUrl(null)
      toast.success(`Đã xóa năm ${year}`)
    } catch (e) {
      console.error('Delete folder failed:', e)
      toast.error('Xóa năm thất bại')
    }
  }, [customFolders, files])

  // ── Rename year folder ──
  const handleRenameFolder = useCallback(async (oldYear: string, newYear: string) => {
    if (folderTree.years.includes(newYear)) {
      toast.error(`Năm ${newYear} đã tồn tại`)
      return
    }
    try {
      // Update all files with the old year
      const updatePromises = files.filter(f => f.year === oldYear).map(f =>
        decisionsApi.update(f._id, { year: newYear })
      )
      await Promise.all(updatePromises)
      setFiles(prev => prev.map(f => f.year === oldYear ? { ...f, year: newYear } : f))

      // Update the custom folder if it exists
      const folder = customFolders.find(cf => cf.name === oldYear)
      if (folder) {
        await decisionsApi.renameFolder(folder._id, newYear)
setCustomFolders(prev => prev.map(cf => cf.name === oldYear ? { ...cf, name: newYear } : cf))
      }

      if (path[0] === oldYear) setPath([newYear])
      toast.success(`Đã đổi năm ${oldYear} → ${newYear}`)
    } catch (e) {
      console.error('Rename folder failed:', e)
      toast.error('Đổi tên năm thất bại')
    }
  }, [folderTree.years, path, files, customFolders])

  // ── Add folder ──
  const handleAddFolder = useCallback(async (year: string) => {
    if (path.length === 0 && year) {
      if (folderTree.years.includes(year)) {
        toast.error(`Năm ${year} đã tồn tại`)
        return
      }
      try {
        const res = await decisionsApi.createFolder(year)
        setCustomFolders(prev => [...prev, res.data.data])
        toast.success(`Đã thêm năm ${year}`)
      } catch (e: any) {
        if (e.response?.status === 409) toast.error(`Năm ${year} đã tồn tại`)
        else toast.error('Thêm năm thất bại')
      }
    }
    setShowAddFolderModal(false)
  }, [path, folderTree.years])

  // ── Stats ──
  const stats = useMemo(() => {
    const relevant = path.length === 0 ? files : files.filter(f => f.year === path[0])
    const totalSize = relevant.reduce((s, f) => s + (f.fileSize || 0), 0)
    return {
      totalFiles: relevant.length,
      totalSize: formatFileSize(totalSize),
    }
  }, [files, path])

  // Determine what "add" means at the current level
  const addButtonLabel = path.length === 0 ? 'Thêm năm' : 'Thêm file quyết định'

  return (
    <div className="flex flex-col h-full gap-4">
      {/* ═══════════════════ TOP BAR: Search and Add Button ═══════════════════ */}
      <div className="flex items-center gap-3 px-1">
        {/* Search Input */}
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500"
          />
        </div>

        {/* Add Button */}
        <button
          onClick={() => path.length === 1 ? setShowAddFileModal(true) : setShowAddFolderModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {addButtonLabel}
        </button>
      </div>

      {/* ═══════════════════ MAIN CONTENT ═══════════════════ */}
      <div ref={containerRef} className="flex h-full gap-3 max-w-full overflow-hidden min-h-0">
      {/* ═══════════════════ LEFT PANEL: File Explorer ═══════════════════ */}
      <div className={`flex flex-col bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm transition-all duration-300 ${selectedFile ? 'flex-1' : 'w-full'}`}>

        {/* Column header (file list mode) */}
        {path.length === 1 && (
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 px-4 py-3 text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide border-b border-gray-100 dark:border-slate-700 shrink-0 items-center">
            <button
              onClick={navigateBack}
              className="w-8 h-8 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors shrink-0"
              title="Quay lại"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
            </button>
            <span>Tên file</span>
            <span className="w-20 text-center">Ngày</span>
            <span className="w-16 text-center">Kích thước</span>
            <span className="w-10 text-center">Xóa</span>
          </div>
        )}

        {/* Items list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-slate-500 py-12">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Đang tải...</p>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-slate-500 py-12">
              <svg className="w-16 h-16 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
              <p className="text-sm font-medium">Thư mục trống</p>
              <p className="text-xs mt-1">Nhấn "{addButtonLabel}" để bắt đầu</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-slate-700/30">
              {paginatedItems.map((item, idx) => (
                item.type === 'folder' ? (
                  <div
                    key={`folder-${item.name}`}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50/50 dark:hover:bg-slate-750 transition-all text-left group animate-fade-in-up cursor-pointer"
                    style={{ animationDelay: `${idx * 30}ms` }}
onClick={() => navigateTo(item.name)}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-sm ${
                      'bg-gradient-to-br from-amber-400 to-amber-600'
                    }`}>
                      <FolderIcon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500">{item.count} file</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); const newYear = prompt('Đổi tên năm:', item.name); if (newYear && newYear !== item.name) handleRenameFolder(item.name, newYear) }}
                        className="p-1 text-gray-400 hover:text-blue-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Đổi tên"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteFolder(item.name) }}
                        className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                        title="Xóa năm"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                ) : (
                  <div
                    role="button"
                    key={item.type === 'file' && item.file?._id ? item.file._id : `file-${idx}`}
                    onClick={() => item.type === 'file' && item.file && handleFileClick(item.file)}
onDoubleClick={() => item.type === 'file' && item.file && handleFileDoubleClick(item.file)}
                    className={`w-full px-4 py-2.5 hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-all text-left group animate-fade-in-up cursor-pointer ${
                      selectedFile?._id === (item as any).file?._id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-3 border-indigo-500' : ''
                    }`}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    {path.length === 1 && item.type === 'file' && item.file ? (
                  <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 items-center">
                        <div className="w-8 h-8" />
                        <div className="flex items-center gap-3 min-w-0">
                          <PdfIcon className="w-8 h-8 shrink-0" />
                          <p className={`text-sm font-medium truncate ${
                            selectedFile?._id === item.file._id ? 'text-primary-700 dark:text-primary-300' : 'text-gray-800 dark:text-slate-200'
                          }`}>
                            {item.file.fileName}
                          </p>
                        </div>
                        <span className="w-20 text-center text-[11px] text-gray-500 dark:text-slate-400">
                          {item.file.uploadedAt}
                        </span>
                        <span className="w-16 text-center text-[11px] text-gray-500 dark:text-slate-400">
                          {formatFileSize(item.file.fileSize)}
                        </span>
                        <span className="w-10 flex justify-center">
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteFile(item.file!) }}
                            className="p-1 text-gray-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Xóa file"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <PdfIcon className="w-8 h-8 shrink-0" />
                        <span className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{item.label}</span>
                      </div>
                    )}
                  </div>
                )
              ))}
            </div>
          )}
</div>

      </div>

      {/* ═══════════════════ RESIZE DIVIDER ═══════════════════ */}
      {selectedFile && (
        <div
          onMouseDown={handleMouseDown}
className={`w-1 bg-gray-200 dark:bg-slate-700 hover:bg-indigo-400 dark:hover:bg-indigo-500 cursor-col-resize transition-colors shrink-0 ${
            isDragging ? 'bg-indigo-500' : ''
          }`}
          style={{ touchAction: 'none' }}
        />
      )}

      {/* ═══════════════════ RIGHT PANEL: File Preview ═══════════════════ */}
      {selectedFile && (
        <div 
          className="flex flex-col bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden animate-slide-in-left"
          style={{ width: `${previewWidth}px` }}
        >
          {/* Preview header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700 shrink-0 bg-gray-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-4 min-w-0">
              <PdfIcon className="w-10 h-10 shrink-0" />
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{selectedFile.fileName}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  {selectedFile.number ? `QĐ ${selectedFile.number}` : ''}{selectedFile.number && selectedFile.uploadedAt ? ' • ' : ''}{selectedFile.uploadedAt ? `${selectedFile.uploadedAt}` : ''}{selectedFile.fileSize ? ` • ${formatFileSize(selectedFile.fileSize)}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Download */}
              <a
                href={decisionsApi.getFileUrl(selectedFile._id)}
                download={selectedFile.fileName}
                className="p-2 text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                title="Tải xuống"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </a>
              {/* Print */}
              <button
                onClick={() => window.print()}
                className="p-2 text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                title="In"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              </button>
              {/* More options */}
              <div className="relative group">
                <button
                  className="p-2 text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                  title="Thêm tùy chọn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                </button>
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => { setFullPreviewFile(selectedFile); setFullPreviewUrl(decisionsApi.getFileUrl(selectedFile._id)) }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-600 first:rounded-t-lg"
                  >
                    Xem đầy đủ
                  </button>
                  <button
                    onClick={() => setShowEditFileModal(true)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-600"
                  >
                    Sửa thông tin
                  </button>
                  <button
                    onClick={() => handleDeleteFile(selectedFile)}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 last:rounded-b-lg"
                  >
                    Xóa file
                  </button>
                </div>
              </div>
              {/* Close */}
              <button
                onClick={() => { setSelectedFile(null); setPreviewUrl(null) }}
                className="p-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>



          {/* PDF Preview area */}
          <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-slate-900 relative">
            {previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title={selectedFile.fileName}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-slate-500">
                <svg className="w-16 h-16 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="text-sm">File không còn trong bộ nhớ</p>
                <p className="text-xs mt-1">Hãy upload lại file PDF</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════ MODALS ═══════════════════ */}

      {/* Add Folder Modal */}
      {showAddFolderModal && (
        <AddFolderModal
          level={path.length}
          currentPath={path}
          files={files}
          onClose={() => setShowAddFolderModal(false)}
          onAdd={(year) => {
            if (path.length === 0 && year) {
              handleAddFolder(year)
            }
          }}
        />
      )}

      {/* Add File Modal */}
      {showAddFileModal && path.length === 1 && (
        <AddFileModal
          year={path[0]}
          onClose={() => setShowAddFileModal(false)}
          onUpload={handleUploadFiles}
        />
      )}

      {/* Edit File Modal */}
      {showEditFileModal && selectedFile && (
        <EditFileModal
          file={selectedFile}
          onClose={() => setShowEditFileModal(false)}
          onSave={handleEditFile}
        />
      )}

      {/* Full Preview Modal (double click) */}
      {fullPreviewFile && (
<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-[98vw] h-[98vh] flex flex-col border border-gray-200 dark:border-slate-700">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-slate-700 px-8 py-5 flex items-center justify-between shrink-0 bg-gray-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-4 min-w-0">
                <PdfIcon className="w-10 h-10 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white truncate">{fullPreviewFile.fileName}</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                    {fullPreviewFile.number ? `QĐ ${fullPreviewFile.number}` : ''}{fullPreviewFile.number && fullPreviewFile.uploadedAt ? ' • ' : ''}{fullPreviewFile.uploadedAt ? `${fullPreviewFile.uploadedAt}` : ''}{fullPreviewFile.fileSize ? ` • ${formatFileSize(fullPreviewFile.fileSize)}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={decisionsApi.getFileUrl(fullPreviewFile._id)}
                  download={fullPreviewFile.fileName}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium rounded-lg transition-colors"
                >
                  ⬇️ Tải xuống
                </a>
                <button
                  onClick={() => { setFullPreviewFile(null); setFullPreviewUrl(null) }}
                  className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white text-3xl px-3"
                >
                  ✕
                </button>
              </div>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-slate-900">
              {fullPreviewUrl ? (
                <iframe
                  src={fullPreviewUrl}
                  className="w-full h-full min-h-[75vh] border-0"
                  title={fullPreviewFile.fileName}
                  allow="autoplay"
                />
              ) : (
                <div className="flex items-center justify-center h-full min-h-[40vh] text-gray-500 dark:text-slate-400">
                  <p className="text-lg">Không thể xem file này</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════

// ── Add Folder Modal ──
function AddFolderModal({ level, currentPath, files, onClose, onAdd }: {
  level: number
  currentPath: string[]
  files: DecisionFile[]
  onClose: () => void
  onAdd: (year?: string) => void
}) {
  const [year, setYear] = useState('')

  const handleSubmit = () => {
    if (!year.match(/^\d{4}$/)) {
      toast.error('Vui lòng nhập năm hợp lệ (VD: 2025)')
      return
    }
    onAdd(year)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-200 dark:border-slate-700">
        <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Thêm năm</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-white text-2xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Năm</label>
            <input
              value={year}
              onChange={e => setYear(e.target.value)}
              placeholder="VD: 2025"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">Định dạng: YYYY</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 font-medium rounded-xl transition-colors">Hủy</button>
            <button onClick={handleSubmit} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors">Thêm</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Add File Modal (with file upload) ──
function AddFileModal({ year, onClose, onUpload }: {
  year: string
  onClose: () => void
  onUpload: (files: File[], data: { year: string }) => void
}) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) {
setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf')])
    }
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (selectedFiles.length === 0) {
      toast.error('Vui lòng chọn file PDF')
      return
    }
    onUpload(selectedFiles, { year })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 border border-gray-200 dark:border-slate-700">
        <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Thêm file quyết định</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Năm {year}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-white text-2xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {/* Drag & Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-slate-600 hover:border-indigo-300'
            }`}
          >
            <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={handleFileChange} className="hidden" />
            <svg className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            <p className="text-sm text-gray-500 dark:text-slate-400">Kéo & thả file PDF hoặc <span className="text-primary-600 font-medium">nhấn để chọn</span></p>
          </div>
          {selectedFiles.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {selectedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 rounded-lg px-3 py-2 text-sm">
                  <span className="text-red-500">📄</span>
                  <span className="text-gray-700 dark:text-slate-300 truncate flex-1">{f.name}</span>
<span className="text-xs text-gray-400">{formatFileSize(f.size)}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleRemoveFile(i) }} className="text-gray-400 hover:text-red-500 text-xs ml-1">✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 font-medium rounded-xl transition-colors">Hủy</button>
            <button onClick={handleSubmit} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors">
              Tải lên {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Edit File Modal ──
function EditFileModal({ file, onClose, onSave }: {
  file: DecisionFile
  onClose: () => void
  onSave: (updated: Partial<DecisionFile>) => void
}) {
  const [number, setNumber] = useState(file.number)
  const [date, setDate] = useState(file.date)
  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-200 dark:border-slate-700">
        <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Sửa thông tin QĐ</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-white text-2xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-slate-400">
            📄 {file.fileName}{file.fileSize ? ` • ${formatFileSize(file.fileSize)}` : ''}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Số QĐ</label>
              <input value={number} onChange={e => setNumber(e.target.value)} placeholder="275/2024" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ngày ban hành</label>
<input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 font-medium rounded-xl transition-colors">Hủy</button>
            <button
              onClick={() => onSave({ number, date })}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// SVG ICONS
// ══════════════════════════════════════════════════════════

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
  )
}

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      <rect x="4" y="2" width="24" height="32" rx="2" fill="#e53e3e" opacity="0.9" />
      <rect x="12" y="6" width="20" height="32" rx="2" fill="#fc8181" />
      <rect x="12" y="6" width="20" height="32" rx="2" fill="white" stroke="#e53e3e" strokeWidth="1" />
      <text x="22" y="26" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#e53e3e">PDF</text>
      <path d="M24 6V12H30" stroke="#e53e3e" strokeWidth="1" fill="#fee2e2" />
    </svg>
  )
}