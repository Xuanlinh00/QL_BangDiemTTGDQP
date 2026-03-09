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
      setFiles(prev => [...prev, ...newFiles])
      toast.success(`Đã thêm ${uploadedFiles.length} file quyết định`)
      setShowAddFileModal(false)
    } catch (e) {
      console.error('Upload failed:', e)
      toast.error('Tải lên thất bại')
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
    const yearFiles = files.filter(f => f.year === year)
    if (yearFiles.length > 0) {
      toast.error(`Không thể xóa năm ${year} vì còn ${yearFiles.length} file`)
      return
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa năm ${year}?`)) return
    const folder = customFolders.find(cf => cf.name === year)
    if (folder) {
      try {
        await decisionsApi.deleteFolder(folder._id)
        setCustomFolders(prev => prev.filter(cf => cf.name !== year))
        toast.success(`Đã xóa năm ${year}`)
      } catch (e) {
        console.error('Delete folder failed:', e)
        toast.error('Xóa năm thất bại')
      }
    }
  }, [files, customFolders])

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
    <div className="flex h-[calc(100vh-7rem)] gap-0 max-w-full overflow-hidden -mt-2">
      {/* ═══════════════════ LEFT PANEL: File Explorer ═══════════════════ */}
      <div className={`flex flex-col bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm transition-all duration-300 ${selectedFile ? 'w-1/2 xl:w-[55%]' : 'w-full'}`}>
        {/* Explorer Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow">
              QĐ
            </div>
            <div className="min-w-0">
              <h1 className="text-sm lg:text-base font-bold text-gray-900 dark:text-white truncate">Quản lý Quyết định</h1>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">{stats.totalFiles} file &bull; {stats.totalSize}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => path.length === 1 ? setShowAddFileModal(true) : setShowAddFolderModal(true)}
              className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              {addButtonLabel}
            </button>
          </div>
        </div>

        {/* Breadcrumb + Search */}
        <div className="px-4 py-2 border-b border-gray-50 dark:border-slate-700/50 shrink-0 space-y-2">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm overflow-x-auto">
            <button
              onClick={() => { setPath([]); setSelectedFile(null); setPreviewUrl(null) }}
              className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium whitespace-nowrap shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Quyết định
            </button>
            {path.map((segment, i) => (
              <span key={i} className="flex items-center gap-1 shrink-0">
                <svg className="w-3.5 h-3.5 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                <button
                  onClick={() => navigateToBreadcrumb(i + 1)}
                  className={`font-medium whitespace-nowrap ${i === path.length - 1 ? 'text-gray-800 dark:text-white' : 'text-primary-600 dark:text-primary-400 hover:text-primary-800'}`}
                >
                  {`Năm ${segment}`}
                </button>
              </span>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary-400 text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500"
            />
          </div>
        </div>

        {/* Column header (file list mode) */}
        {path.length === 1 && (
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2 text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700 shrink-0">
            <span>Tên file</span>
            <span className="w-16 text-center">Kích thước</span>
            <span className="w-10 text-center">Xóa</span>
          </div>
        )}

        {/* Items list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-slate-500 py-12">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" />
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
              {/* Back button */}
              {path.length > 0 && (
                <button
                  onClick={navigateBack}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors text-left group"
                >
                  <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-slate-600 transition-colors">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">..</span>
                </button>
              )}

              {currentItems.map((item, idx) => (
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
                      <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500">{item.count} file</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); const newYear = prompt('Đổi tên năm:', item.name); if (newYear && newYear !== item.name) handleRenameFolder(item.name, newYear) }}
                        className="p-1 text-gray-400 hover:text-blue-500 rounded"
                        title="Đổi tên"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteFolder(item.name) }}
                        className="p-1 text-gray-400 hover:text-red-500 rounded"
                        title="Xóa năm"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 dark:text-slate-600 group-hover:text-primary-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                ) : (
                  <div
                    role="button"
                    key={item.type === 'file' && item.file?._id ? item.file._id : `file-${idx}`}
                    onClick={() => item.type === 'file' && item.file && handleFileClick(item.file)}
                    onDoubleClick={() => item.type === 'file' && item.file && handleFileDoubleClick(item.file)}
                    className={`w-full px-4 py-2.5 hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-all text-left group animate-fade-in-up cursor-pointer ${
                      selectedFile?._id === (item as any).file?._id ? 'bg-primary-50 dark:bg-primary-900/20 border-l-3 border-primary-500' : ''
                    }`}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    {path.length === 1 && item.type === 'file' && item.file ? (
                      <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                        <div className="flex items-center gap-3 min-w-0">
                          <PdfIcon className="w-8 h-8 shrink-0" />
                          <div className="min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              selectedFile?._id === item.file._id ? 'text-primary-700 dark:text-primary-300' : 'text-gray-800 dark:text-slate-200'
                            }`}>
                              {item.file.fileName}
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-slate-500">Tải lên: {item.file.uploadedAt}</p>
                          </div>
                        </div>
                        <span className="w-16 text-center text-[10px] text-gray-500 dark:text-slate-400">
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

        {/* Bottom bar: Stats */}
        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-slate-700 shrink-0 flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-500 bg-gray-50/50 dark:bg-slate-800/50">
          <span>{currentItems.length} mục &bull; {stats.totalFiles} file tổng</span>
          <span>{stats.totalSize}</span>
        </div>
      </div>

      {/* ═══════════════════ RIGHT PANEL: File Preview ═══════════════════ */}
      {selectedFile && (
        <div className="w-1/2 xl:w-[45%] flex flex-col bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm ml-4 overflow-hidden animate-slide-in-left">
          {/* Preview header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <PdfIcon className="w-8 h-8 shrink-0" />
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{selectedFile.fileName}</h3>
                <p className="text-[10px] text-gray-400 dark:text-slate-500">
                  {selectedFile.number ? `QĐ ${selectedFile.number}` : ''}{selectedFile.number && selectedFile.uploadedAt ? ' • ' : ''}{selectedFile.uploadedAt ? `Tải lên: ${selectedFile.uploadedAt}` : ''}{selectedFile.fileSize ? ` • ${formatFileSize(selectedFile.fileSize)}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Full view */}
              <button
                onClick={() => { setFullPreviewFile(selectedFile); setFullPreviewUrl(decisionsApi.getFileUrl(selectedFile._id)) }}
                className="px-2.5 py-1.5 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-lg transition-colors"
              >
                Xem đầy đủ
              </button>
              {/* Edit */}
              <button
                onClick={() => setShowEditFileModal(true)}
                className="px-2.5 py-1.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-lg transition-colors"
              >
                Sửa
              </button>
              {/* Delete */}
              <button
                onClick={() => handleDeleteFile(selectedFile)}
                className="p-1.5 text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Xóa file"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
              {/* Close */}
              <button
                onClick={() => { setSelectedFile(null); setPreviewUrl(null) }}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full mx-4 max-h-[95vh] flex flex-col border border-gray-200 dark:border-slate-700">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <PdfIcon className="w-8 h-8 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white truncate">{fullPreviewFile.fileName}</h3>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    {fullPreviewFile.number ? `QĐ ${fullPreviewFile.number}` : ''}{fullPreviewFile.number && fullPreviewFile.uploadedAt ? ' • ' : ''}{fullPreviewFile.uploadedAt ? `Tải lên: ${fullPreviewFile.uploadedAt}` : ''}{fullPreviewFile.fileSize ? ` • ${formatFileSize(fullPreviewFile.fileSize)}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={decisionsApi.getFileUrl(fullPreviewFile._id)}
                  download={fullPreviewFile.fileName}
                  className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  ⬇️ Tải xuống
                </a>
                <button
                  onClick={() => { setFullPreviewFile(null); setFullPreviewUrl(null) }}
                  className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white text-2xl px-2"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">Định dạng: YYYY</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 font-medium rounded-xl transition-colors">Hủy</button>
            <button onClick={handleSubmit} className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors">Thêm</button>
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
              dragOver ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-slate-600 hover:border-primary-300'
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
            <button onClick={handleSubmit} className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors">
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
  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"

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
              className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
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
