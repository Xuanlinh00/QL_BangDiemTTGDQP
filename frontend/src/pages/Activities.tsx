import { useState, useEffect, useCallback, useRef } from 'react'
import type { AxiosError } from 'axios'
import { activitiesApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface MediaItem {
  _id: string
  fileName: string
  mimeType: string
}

interface Activity {
  _id: string
  title: string
  description: string
  content: string
  icon: string
  category: string
  order: number
  isActive: boolean
  media: MediaItem[]
  previewImage?: string
  createdAt?: string
  updatedAt?: string
}

const LOCAL_STORAGE_KEY = 'local_activities'
const ACTIVITIES_BACKOFF_KEY = 'activities_api_backoff_until'
const ACTIVITIES_BACKOFF_MS = 2 * 60 * 1000

function getLocalActivities(): Activity[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveLocalActivities(activities: Activity[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(activities))
}

function generateLocalId() {
  return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

const CATEGORY_OPTIONS = [
  { value: 'education', label: 'Giáo dục' },
  { value: 'training', label: 'Huấn luyện' },
  { value: 'sports', label: 'Thể thao' },
  { value: 'research', label: 'Nghiên cứu' },
  { value: 'extracurricular', label: 'Ngoại khóa' },
  { value: 'management', label: 'Quản lý' },
  { value: 'cooperation', label: 'Hợp tác' },
  { value: 'development', label: 'Phát triển' },
  { value: 'news', label: 'Tin tức' },
  { value: 'cultural', label: 'Hoạt động văn hóa' },
  { value: 'general', label: 'Chung' },
]

function getCategoryLabel(val: string) {
  return CATEGORY_OPTIONS.find(c => c.value === val)?.label || val
}

function getCategoryColor(cat: string) {
  const map: Record<string, string> = {
    education: 'bg-blue-100 text-blue-600',
    training: 'bg-orange-100 text-orange-600',
    sports: 'bg-green-100 text-green-600',
    research: 'bg-purple-100 text-purple-600',
    extracurricular: 'bg-teal-100 text-teal-600',
    management: 'bg-indigo-100 text-indigo-600',
    cooperation: 'bg-cyan-100 text-cyan-600',
    development: 'bg-amber-100 text-amber-600',
    news: 'bg-pink-100 text-pink-600',
    cultural: 'bg-rose-100 text-rose-600',
  }
  return map[cat] || 'bg-gray-100 text-gray-600'
}

function formatDate(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN')
}

export default function Activities() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: '',
    isActive: true,
    publishDate: new Date().toISOString().split('T')[0],
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [removeMediaIndices, setRemoveMediaIndices] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  // Image insert dialog
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [imageDialogMode, setImageDialogMode] = useState<'url' | 'upload'>('url')
  const imageFileInputRef = useRef<HTMLInputElement>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  // We save the Range object directly for reliable restoration
  const savedRangeRef = useRef<Range | null>(null)
  const offlineToastShownRef = useRef(false)
  // Track active states for toolbar buttons
  const [activeFormats, setActiveFormats] = useState({
    bold: false, italic: false, underline: false, strikeThrough: false,
    justifyLeft: false, justifyCenter: false, justifyRight: false, justifyFull: false,
    insertOrderedList: false, insertUnorderedList: false,
  })

  const isServerUnavailable = (error: unknown) => {
    const axiosError = error as AxiosError | undefined
    const status = axiosError?.response?.status
    return status === 503 || status === 504 || status === 502 || status === 500
  }

  const loadActivities = useCallback(async () => {
    const backoffUntil = Number(localStorage.getItem(ACTIVITIES_BACKOFF_KEY) || 0)
    if (backoffUntil > Date.now()) {
      setActivities(getLocalActivities())
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const res = await activitiesApi.list()
      const serverActivities = res.data.data || []
      const localActivities = getLocalActivities()
      setActivities([...serverActivities, ...localActivities])
      localStorage.removeItem(ACTIVITIES_BACKOFF_KEY)
      offlineToastShownRef.current = false
    } catch (err) {
      if (isServerUnavailable(err)) {
        localStorage.setItem(ACTIVITIES_BACKOFF_KEY, String(Date.now() + ACTIVITIES_BACKOFF_MS))
      }
      const localActivities = getLocalActivities()
      setActivities(localActivities)
      if (!offlineToastShownRef.current) {
        if (isServerUnavailable(err)) {
          toast.error('Máy chủ đang bận (503/504). Hệ thống chuyển sang chế độ offline.')
        } else if (localActivities.length === 0) {
          toast.error('Không thể kết nối server. Đang sử dụng chế độ offline.')
        } else {
          toast('Đang sử dụng dữ liệu offline', { icon: '📱' })
        }
        offlineToastShownRef.current = true
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  // Initialize editor content via ref (NOT dangerouslySetInnerHTML to avoid cursor jump)
  useEffect(() => {
    if (showEditor && contentRef.current) {
      contentRef.current.innerHTML = formData.content || ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEditor])

  // ── Selection helpers ──────────────────────────────────────────────────────
  const saveSelection = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    if (contentRef.current?.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange()
    }
  }, [])

  const restoreSelection = useCallback(() => {
    if (!savedRangeRef.current) return
    const sel = window.getSelection()
    if (!sel) return
    sel.removeAllRanges()
    sel.addRange(savedRangeRef.current)
  }, [])

  // Update active format indicators
  const updateActiveFormats = useCallback(() => {
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        justifyFull: document.queryCommandState('justifyFull'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      })
    } catch { /* ignore */ }
  }, [])

  // ── Core exec: buttons use onMouseDown=preventDefault so focus stays ───────
  const execCmd = useCallback((command: string, value?: string) => {
    // Focus is already in editor because mousedown was prevented
    document.execCommand(command, false, value)
    updateActiveFormats()
  }, [updateActiveFormats])

  // For toolbar selects (heading, fontSize) — they steal focus so we restore
  const execCmdAfterFocus = useCallback((command: string, value: string) => {
    contentRef.current?.focus()
    restoreSelection()
    document.execCommand(command, false, value)
    updateActiveFormats()
  }, [restoreSelection, updateActiveFormats])

  // Prevent blur when clicking toolbar buttons
  const preventBlur = (e: React.MouseEvent) => e.preventDefault()

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filteredActivities = activities.filter(a => {
    if (filterCategory !== 'all' && a.category !== filterCategory) return false
    if (filterStatus === 'active' && !a.isActive) return false
    if (filterStatus === 'draft' && a.isActive) return false
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const openCreateEditor = () => {
    setEditingActivity(null)
    setFormData({ title: '', description: '', content: '', category: '', isActive: true, publishDate: new Date().toISOString().split('T')[0] })
    setSelectedFiles([])
    setPreviewImage(null)
    setRemoveMediaIndices([])
    setShowEditor(true)
  }

  const openEditEditor = (activity: Activity) => {
    setEditingActivity(activity)
    setFormData({
      title: activity.title,
      description: activity.description,
      content: activity.content,
      category: activity.category,
      isActive: activity.isActive,
      publishDate: activity.createdAt ? new Date(activity.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    })
    setSelectedFiles([])
    if (activity.previewImage) {
      setPreviewImage(activity.previewImage)
    } else if (activity.media && activity.media.length > 0) {
      setPreviewImage(activitiesApi.getMediaUrl(activity._id, 0))
    } else {
      setPreviewImage(null)
    }
    setRemoveMediaIndices([])
    setShowEditor(true)
  }

  const closeEditor = () => {
    setShowEditor(false)
    setEditingActivity(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setSelectedFiles(files)
      const reader = new FileReader()
      reader.onload = (ev) => setPreviewImage(ev.target?.result as string)
      reader.readAsDataURL(files[0])
      if (editingActivity && editingActivity.media.length > 0) {
        setRemoveMediaIndices([0])
      }
    }
  }

  // ── Insert image into editor ───────────────────────────────────────────────
  const handleInsertImageFromUrl = () => {
    if (!imageUrlInput.trim()) return
    contentRef.current?.focus()
    restoreSelection()
    document.execCommand('insertImage', false, imageUrlInput.trim())
    setShowImageDialog(false)
    setImageUrlInput('')
  }

  const handleInsertImageFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      contentRef.current?.focus()
      restoreSelection()
      document.execCommand('insertImage', false, dataUrl)
      setShowImageDialog(false)
      setImageUrlInput('')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleInsertVideo = () => {
    const url = prompt('Nhập URL video (YouTube/Vimeo/MP4):')
    if (!url) return
    contentRef.current?.focus()
    restoreSelection()

    // Convert YouTube watch URL to embed
    let embedUrl = url
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`

    const html = `<div contenteditable="false" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:12px 0;"><iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen loading="lazy"></iframe></div><p><br></p>`
    document.execCommand('insertHTML', false, html)
  }

  const handleInsertLink = () => {
    saveSelection()
    const url = prompt('Nhập URL:')
    if (url) {
      contentRef.current?.focus()
      restoreSelection()
      document.execCommand('createLink', false, url)
    }
  }

  const handleSave = async (isDraft: boolean = false) => {
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề hoạt động')
      return
    }
    try {
      setSaving(true)
      const data = {
        title: formData.title,
        description: formData.description,
        content: contentRef.current?.innerHTML || formData.content,
        category: formData.category,
        isActive: !isDraft && formData.isActive,
        icon: '📋',
      }
      try {
        if (editingActivity && !editingActivity._id.startsWith('local_')) {
          await activitiesApi.update(editingActivity._id, data, selectedFiles.length > 0 ? selectedFiles : undefined, removeMediaIndices.length > 0 ? removeMediaIndices : undefined)
          toast.success('Cập nhật hoạt động thành công')
        } else if (editingActivity && editingActivity._id.startsWith('local_')) {
          const localActivities = getLocalActivities()
          const idx = localActivities.findIndex(a => a._id === editingActivity._id)
          if (idx >= 0) {
            localActivities[idx] = { ...localActivities[idx], ...data, previewImage: previewImage || localActivities[idx].previewImage, updatedAt: new Date().toISOString() }
            saveLocalActivities(localActivities)
          }
          toast.success('Cập nhật hoạt động offline thành công')
        } else {
          await activitiesApi.create(data, selectedFiles)
          toast.success('Thêm hoạt động thành công')
        }
      } catch (serverErr) {
        const localActivities = getLocalActivities()
        if (editingActivity && editingActivity._id.startsWith('local_')) {
          const idx = localActivities.findIndex(a => a._id === editingActivity._id)
          if (idx >= 0) {
            localActivities[idx] = { ...localActivities[idx], ...data, previewImage: previewImage || localActivities[idx].previewImage, updatedAt: new Date().toISOString() }
          }
        } else {
          const newActivity: Activity = { _id: generateLocalId(), ...data, order: localActivities.length, media: [], previewImage: previewImage || undefined, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          localActivities.unshift(newActivity)
        }
        saveLocalActivities(localActivities)
        toast.success('Đã lưu hoạt động offline (sẽ đồng bộ khi có mạng)')
      }
      setShowEditor(false)
      setEditingActivity(null)
      loadActivities()
    } catch (err) {
      console.error('Error saving activity:', err)
      toast.error('Có lỗi xảy ra khi lưu hoạt động')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (activity: Activity) => {
    if (!confirm(`Bạn có chắc muốn xóa hoạt động "${activity.title}"?`)) return
    try {
      if (activity._id.startsWith('local_')) {
        const filtered = getLocalActivities().filter(a => a._id !== activity._id)
        saveLocalActivities(filtered)
        toast.success('Đã xóa hoạt động offline')
      } else {
        await activitiesApi.delete(activity._id)
        toast.success('Đã xóa hoạt động')
      }
      loadActivities()
    } catch (err) {
      console.error(err)
      toast.error('Có lỗi xảy ra khi xóa hoạt động')
    }
  }

  // ── Toolbar button helper ─────────────────────────────────────────────────
  const ToolbarBtn = ({
    onClick, title, active = false, children,
  }: {
    onClick: () => void
    title: string
    active?: boolean
    children: React.ReactNode
  }) => (
    <button
      onMouseDown={preventBlur}
      onClick={onClick}
      title={title}
      className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors select-none ${
        active
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  )

  const Divider = () => <div className="w-px h-6 bg-gray-200 dark:bg-slate-600 mx-0.5 self-center" />

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className={`${showEditor ? 'pt-6 pb-6 pl-6 pr-0' : 'p-6'} bg-gray-50 dark:bg-slate-900 min-h-screen`}>

      {/* ── LIST VIEW ─────────────────────────────────────────────────────── */}
      {!showEditor && (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="all">Tất cả danh mục</option>
                {CATEGORY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Công khai</option>
                <option value="draft">Bản nháp</option>
              </select>
              <div className="flex-1 min-w-[200px] relative">
                <input type="text" placeholder="Tìm kiếm hoạt động..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <button onClick={openCreateEditor} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Thêm hoạt động
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ảnh đại diện</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tên hoạt động</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ngày thực hiện</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tác giả</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {filteredActivities.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Không có hoạt động nào</td></tr>
                ) : filteredActivities.map((activity) => (
                  <tr key={activity._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4">
                      <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700">
                        {activity.previewImage ? (
                          <img src={activity.previewImage} alt={activity.title} className="w-full h-full object-cover" />
                        ) : activity.media && activity.media.length > 0 ? (
                          <img src={activitiesApi.getMediaUrl(activity._id, 0)} alt={activity.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">{activity.icon || '📋'}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{activity.title}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(activity.category)}`}>{getCategoryLabel(activity.category)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{formatDate(activity.createdAt)}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{user?.name || 'Quản trị viên'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${activity.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${activity.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {activity.isActive ? 'Công khai' : 'Bản nháp'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditEditor(activity)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Xem chi tiết">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button onClick={() => openEditEditor(activity)} className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" title="Chỉnh sửa">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(activity)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── EDITOR VIEW ───────────────────────────────────────────────────── */}
      {showEditor && (
        <div className="mt-2 -mr-6 flex gap-4 min-h-[calc(100vh-120px)] items-start">

          {/* ── Left: Editor ────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 min-h-[calc(100vh-120px)] flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h1 className="text-xl font-bold italic text-gray-800 dark:text-white">
                {editingActivity ? 'Chỉnh sửa hoạt động' : 'Thêm hoạt động mới'}
              </h1>
              <div className="flex items-center gap-3">
                <button onClick={closeEditor} className="px-6 py-2.5 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-slate-600 rounded-lg font-medium transition-colors">Hủy</button>
                <button onClick={() => handleSave(true)} disabled={saving} className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors">Lưu nháp</button>
                <button onClick={() => handleSave(false)} disabled={saving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors">
                  {saving ? 'Đang lưu...' : 'Đăng bài'}
                </button>
              </div>
            </div>

            {/* ── Toolbar ──────────────────────────────────────────────── */}
            <div className="px-3 py-2 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 space-y-1.5">

              {/* Row 1 */}
              <div className="flex flex-wrap items-center gap-0.5">
                {/* Heading select */}
                <select
                  onMouseDown={saveSelection}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v) execCmdAfterFocus('formatBlock', v)
                    // Reset select visual
                    e.target.value = ''
                  }}
                  defaultValue=""
                  className="h-9 px-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-gray-200 cursor-pointer mr-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="" disabled>Định dạng</option>
                  <option value="P">Văn bản</option>
                  <option value="H1">Tiêu đề 1</option>
                  <option value="H2">Tiêu đề 2</option>
                  <option value="H3">Tiêu đề 3</option>
                  <option value="H4">Tiêu đề 4</option>
                  <option value="BLOCKQUOTE">Trích dẫn</option>
                  <option value="PRE">Code</option>
                </select>

                {/* Font size */}
                <select
                  onMouseDown={saveSelection}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v) execCmdAfterFocus('fontSize', v)
                    e.target.value = ''
                  }}
                  defaultValue=""
                  className="h-9 px-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-gray-200 cursor-pointer mr-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="" disabled>Cỡ chữ</option>
                  <option value="1">Rất nhỏ (8px)</option>
                  <option value="2">Nhỏ (10px)</option>
                  <option value="3">Thường (12px)</option>
                  <option value="4">Vừa (14px)</option>
                  <option value="5">Lớn (18px)</option>
                  <option value="6">Rất lớn (24px)</option>
                  <option value="7">Cực lớn (36px)</option>
                </select>

                <Divider />

                <ToolbarBtn onClick={() => execCmd('bold')} title="Đậm (Ctrl+B)" active={activeFormats.bold}>
                  <span className="font-bold text-base">B</span>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd('italic')} title="Nghiêng (Ctrl+I)" active={activeFormats.italic}>
                  <span className="italic font-serif text-base">I</span>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd('underline')} title="Gạch chân (Ctrl+U)" active={activeFormats.underline}>
                  <span className="underline text-base">U</span>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd('strikeThrough')} title="Gạch ngang" active={activeFormats.strikeThrough}>
                  <span className="line-through text-base">S</span>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd('superscript')} title="Chỉ số trên">
                  <span className="text-xs font-medium">X<sup>2</sup></span>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd('subscript')} title="Chỉ số dưới">
                  <span className="text-xs font-medium">X<sub>2</sub></span>
                </ToolbarBtn>

                <Divider />

                {/* Text color */}
                <label onMouseDown={preventBlur} title="Màu chữ" className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer border border-gray-300 dark:border-slate-600 relative overflow-hidden" tabIndex={-1}>
                  <span className="text-sm font-bold pointer-events-none select-none" style={{ textDecoration: 'underline 2px solid #e53e3e' }}>A</span>
                  <input type="color" defaultValue="#e53e3e" onChange={(e) => execCmd('foreColor', e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" tabIndex={-1} />
                </label>

                {/* Highlight color */}
                <label onMouseDown={preventBlur} title="Màu nền chữ" className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer border border-gray-300 dark:border-slate-600 relative overflow-hidden" tabIndex={-1}>
                  <svg className="w-5 h-5 pointer-events-none" viewBox="0 0 24 24" fill="currentColor"><path d="M19.228 18.732l1.768-1.768 1.768 1.768a2.5 2.5 0 1 1-3.536 0zM8.878 1.172l12.02 12.02-6.01 6.01-12.02-12.02 1.767-1.768 1.061 1.06L9.94 4.242 8.878 3.18l1.768-1.768 2.121 2.121z" style={{ fill: '#f6c90e' }} /></svg>
                  <input type="color" defaultValue="#fef08a" onChange={(e) => execCmd('hiliteColor', e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" tabIndex={-1} />
                </label>

                <Divider />

                <ToolbarBtn onClick={() => execCmd('removeFormat')} title="Xóa định dạng">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </ToolbarBtn>
              </div>

              {/* Row 2 */}
              <div className="flex flex-wrap items-center gap-0.5">
                {/* Lists */}
                <ToolbarBtn onClick={() => execCmd('insertOrderedList')} title="Danh sách số" active={activeFormats.insertOrderedList}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" /></svg>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd('insertUnorderedList')} title="Danh sách gạch đầu dòng" active={activeFormats.insertUnorderedList}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" /></svg>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd('indent')} title="Thụt lề vào">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21h18v-2H3v2zm0-16v2h18V5H3zm0 8h18v-2H3v2zM3 9l4 3-4 3V9z" /></svg>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd('outdent')} title="Thụt lề ra">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21h18v-2H3v2zm0-16v2h18V5H3zm0 8h18v-2H3v2zm14-9l-4 3 4 3V8z" /></svg>
                </ToolbarBtn>

                <Divider />

                {/* Alignment */}
                <ToolbarBtn onClick={() => execCmd('justifyLeft')} title="Căn trái" active={activeFormats.justifyLeft}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3V3zm0 4h12v2H3V7zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z" /></svg>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd('justifyCenter')} title="Căn giữa" active={activeFormats.justifyCenter}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3V3zm3 4h12v2H6V7zm-3 4h18v2H3v-2zm3 4h12v2H6v-2zm-3 4h18v2H3v-2z" /></svg>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd('justifyRight')} title="Căn phải" active={activeFormats.justifyRight}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3V3zm6 4h12v2H9V7zm-6 4h18v2H3v-2zm6 4h12v2H9v-2zm-6 4h18v2H3v-2z" /></svg>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd('justifyFull')} title="Căn đều" active={activeFormats.justifyFull}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2zm0 4h18v2H3v-2z" /></svg>
                </ToolbarBtn>

                <Divider />

                {/* Insert */}
                <ToolbarBtn onClick={handleInsertLink} title="Chèn liên kết">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd('unlink')} title="Bỏ liên kết">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-10 10M8.5 8.5l-2 2a3 3 0 104.243 4.243l2-2m3.257-3.257l2-2a3 3 0 10-4.243-4.243l-2 2" /></svg>
                </ToolbarBtn>
                {/* Image insert button — opens dialog */}
                <ToolbarBtn
                  onClick={() => {
                    saveSelection()
                    setImageDialogMode('url')
                    setImageUrlInput('')
                    setShowImageDialog(true)
                  }}
                  title="Chèn hình ảnh"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </ToolbarBtn>
                <ToolbarBtn onClick={handleInsertVideo} title="Chèn video">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14m-9 4h8a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd('insertHorizontalRule')} title="Đường kẻ ngang">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>
                </ToolbarBtn>

                <Divider />

                <ToolbarBtn onClick={() => execCmd('undo')} title="Hoàn tác (Ctrl+Z)">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 010 16H3m0-16L7 6m-4 4l4 4" /></svg>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => execCmd('redo')} title="Làm lại (Ctrl+Y)">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 000 16h10m0-16l-4-4m4 4l-4 4" /></svg>
                </ToolbarBtn>
              </div>
            </div>

            {/* ── Content Area ─────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 p-6">
              <style>{`
                [data-editor]:empty:before {
                  content: attr(data-placeholder);
                  color: #9ca3af;
                  pointer-events: none;
                }
                [data-editor] h1 { font-size: 2em; font-weight: 700; margin: .5em 0; }
                [data-editor] h2 { font-size: 1.5em; font-weight: 700; margin: .5em 0; }
                [data-editor] h3 { font-size: 1.25em; font-weight: 600; margin: .5em 0; }
                [data-editor] h4 { font-size: 1.1em; font-weight: 600; margin: .5em 0; }
                [data-editor] blockquote { border-left: 4px solid #3b82f6; padding: 8px 16px; margin: 8px 0; background: #eff6ff; border-radius: 0 8px 8px 0; font-style: italic; color: #1d4ed8; }
                [data-editor] pre { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; font-family: monospace; font-size: .9em; overflow-x: auto; margin: 8px 0; }
                [data-editor] ul { list-style: disc; margin-left: 1.5em; }
                [data-editor] ol { list-style: decimal; margin-left: 1.5em; }
                [data-editor] a { color: #2563eb; text-decoration: underline; }
                [data-editor] img { max-width: 100%; border-radius: 8px; margin: 8px 0; display: inline-block; }
                [data-editor] hr { border: none; border-top: 2px solid #e5e7eb; margin: 16px 0; }
                [data-editor] p { margin: 4px 0; min-height: 1.5em; }
              `}</style>
              <div className="flex">
                <div className="w-1 bg-blue-500 rounded-full mr-4 self-stretch min-h-[2rem] shrink-0"></div>
                <div
                  ref={contentRef}
                  contentEditable
                  suppressContentEditableWarning
                  data-editor
                  data-placeholder="Nhập nội dung hoạt động tại đây..."
                  className="flex-1 min-h-[600px] text-gray-800 dark:text-gray-200 focus:outline-none text-base leading-relaxed"
                  onInput={(e) => {
                    // Update formData content silently — do NOT set innerHTML again
                    const html = e.currentTarget.innerHTML
                    setFormData(prev => ({ ...prev, content: html }))
                  }}
                  onKeyUp={() => { saveSelection(); updateActiveFormats() }}
                  onMouseUp={() => { saveSelection(); updateActiveFormats() }}
                  onFocus={saveSelection}
                />
              </div>
            </div>
          </div>

          {/* ── Right Sidebar ──────────────────────────────────────────── */}
          <div className="w-[300px] shrink-0 self-start flex flex-col gap-4">

            {/* Settings card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2 text-base">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Cài đặt bài viết
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Tiêu đề hoạt động</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Nhập tiêu đề hoạt động..." className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Danh mục</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                    <option value="">-- Chọn danh mục --</option>
                    {CATEGORY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Ngày đăng</label>
                  <input type="date" value={formData.publishDate} onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })} className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Trạng thái</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setFormData({ ...formData, isActive: true })} className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${formData.isActive ? 'bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700' : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`}>Công khai</button>
                    <button type="button" onClick={() => setFormData({ ...formData, isActive: false })} className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${!formData.isActive ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700' : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`}>Bản nháp</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Thumbnail card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2 text-base">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Ảnh đại diện
              </h3>
              <div className="border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl overflow-hidden bg-white dark:bg-slate-700">
                {previewImage ? (
                  <div className="relative">
                    <img src={previewImage} alt="Preview" className="w-full h-40 object-cover" />
                    <button onClick={() => { setPreviewImage(null); setSelectedFiles([]); if (editingActivity) setRemoveMediaIndices([0]) }} className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-full hover:bg-red-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-10 px-4">
                    <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="mt-3 text-sm text-blue-400">Chưa có ảnh đại diện</p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-full mt-3 px-4 py-3 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-xl text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-center gap-2 text-sm font-medium transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Upload hình ảnh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Insert Dialog ──────────────────────────────────────────── */}
      {showImageDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowImageDialog(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h3 className="font-semibold text-gray-800 dark:text-white text-lg">Chèn hình ảnh</h3>
              <button onClick={() => setShowImageDialog(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Tab switch */}
            <div className="flex border-b border-gray-200 dark:border-slate-700">
              <button onClick={() => setImageDialogMode('url')} className={`flex-1 py-3 text-sm font-medium transition-colors ${imageDialogMode === 'url' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                🔗 Từ đường dẫn URL
              </button>
              <button onClick={() => setImageDialogMode('upload')} className={`flex-1 py-3 text-sm font-medium transition-colors ${imageDialogMode === 'upload' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                📁 Tải lên từ máy
              </button>
            </div>

            <div className="p-6">
              {imageDialogMode === 'url' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL hình ảnh</label>
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleInsertImageFromUrl() }}
                      placeholder="https://example.com/image.jpg"
                      autoFocus
                      className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  {imageUrlInput && (
                    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 h-32">
                      <img src={imageUrlInput} alt="preview" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </div>
                  )}
                  <button onClick={handleInsertImageFromUrl} disabled={!imageUrlInput.trim()} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-medium transition-colors">
                    Chèn hình ảnh
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block w-full cursor-pointer">
                    <div className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-xl p-10 text-center hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <svg className="w-12 h-12 mx-auto text-blue-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Nhấp để chọn ảnh</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG, GIF, WebP tối đa 10MB</p>
                    </div>
                    <input ref={imageFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleInsertImageFromFile} />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}