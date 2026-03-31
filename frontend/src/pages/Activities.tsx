import { useState, useEffect, useCallback, useRef } from 'react'
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
  previewImage?: string // For localStorage preview
  createdAt?: string
  updatedAt?: string
}

// LocalStorage helpers
const LOCAL_STORAGE_KEY = 'local_activities'

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

  // Form state
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true)
      const res = await activitiesApi.list()
      const serverActivities = res.data.data || []
      // Merge with local activities
      const localActivities = getLocalActivities()
      setActivities([...serverActivities, ...localActivities])
    } catch (err) {
      console.error('Error loading activities:', err)
      // Fallback to localStorage when server unavailable
      const localActivities = getLocalActivities()
      setActivities(localActivities)
      if (localActivities.length === 0) {
        toast.error('Không thể kết nối server. Đang sử dụng chế độ offline.')
      } else {
        toast('Đang sử dụng dữ liệu offline', { icon: '📱' })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  // Filter activities
  const filteredActivities = activities.filter(a => {
    if (filterCategory !== 'all' && a.category !== filterCategory) return false
    if (filterStatus === 'active' && !a.isActive) return false
    if (filterStatus === 'draft' && a.isActive) return false
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const openCreateEditor = () => {
    setEditingActivity(null)
    setFormData({
      title: '',
      description: '',
      content: '',
      category: '',
      isActive: true,
      publishDate: new Date().toISOString().split('T')[0],
    })
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
      // Local activity with base64 preview
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
      // Preview first image
      const reader = new FileReader()
      reader.onload = (ev) => {
        setPreviewImage(ev.target?.result as string)
      }
      reader.readAsDataURL(files[0])
      // Mark old media for removal if editing
      if (editingActivity && editingActivity.media.length > 0) {
        setRemoveMediaIndices([0])
      }
    }
  }

  const handleSave = async (isDraft: boolean = false) => {
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề hoạt động')
      return
    }

    // Allow saving without image for local storage
    const hasImage = editingActivity || selectedFiles.length > 0 || previewImage

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

      // Try server first
      try {
        if (editingActivity && !editingActivity._id.startsWith('local_')) {
          await activitiesApi.update(
            editingActivity._id,
            data,
            selectedFiles.length > 0 ? selectedFiles : undefined,
            removeMediaIndices.length > 0 ? removeMediaIndices : undefined
          )
          toast.success('Cập nhật hoạt động thành công')
        } else if (editingActivity && editingActivity._id.startsWith('local_')) {
          // Update local activity
          const localActivities = getLocalActivities()
          const idx = localActivities.findIndex(a => a._id === editingActivity._id)
          if (idx >= 0) {
            localActivities[idx] = {
              ...localActivities[idx],
              ...data,
              previewImage: previewImage || localActivities[idx].previewImage,
              updatedAt: new Date().toISOString(),
            }
            saveLocalActivities(localActivities)
          }
          toast.success('Cập nhật hoạt động offline thành công')
        } else {
          await activitiesApi.create(data, selectedFiles)
          toast.success('Thêm hoạt động thành công')
        }
      } catch (serverErr) {
        console.warn('Server unavailable, saving locally:', serverErr)
        // Save to localStorage as fallback
        const localActivities = getLocalActivities()
        
        if (editingActivity && editingActivity._id.startsWith('local_')) {
          // Update existing local activity
          const idx = localActivities.findIndex(a => a._id === editingActivity._id)
          if (idx >= 0) {
            localActivities[idx] = {
              ...localActivities[idx],
              ...data,
              previewImage: previewImage || localActivities[idx].previewImage,
              updatedAt: new Date().toISOString(),
            }
          }
        } else {
          // Create new local activity
          const newActivity: Activity = {
            _id: generateLocalId(),
            ...data,
            order: localActivities.length,
            media: [],
            previewImage: previewImage || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
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
        // Delete from localStorage
        const localActivities = getLocalActivities()
        const filtered = localActivities.filter(a => a._id !== activity._id)
        saveLocalActivities(filtered)
        toast.success('Đã xóa hoạt động offline')
        loadActivities()
      } else {
        await activitiesApi.delete(activity._id)
        toast.success('Đã xóa hoạt động')
        loadActivities()
      }
    } catch (err) {
      console.error('Error deleting activity:', err)
      toast.error('Có lỗi xảy ra khi xóa hoạt động')
    }
  }

  // Rich text editor commands
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    contentRef.current?.focus()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả danh mục</option>
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Công khai</option>
            <option value="draft">Bản nháp</option>
          </select>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm hoạt động..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Add button */}
          <button
            onClick={openCreateEditor}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm hoạt động
          </button>
        </div>
      </div>

      {/* Activities Table */}
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
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  Không có hoạt động nào
                </td>
              </tr>
            ) : (
              filteredActivities.map((activity) => (
                <tr key={activity._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  {/* Thumbnail */}
                  <td className="px-6 py-4">
                    <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700">
                      {activity.previewImage ? (
                        <img
                          src={activity.previewImage}
                          alt={activity.title}
                          className="w-full h-full object-cover"
                        />
                      ) : activity.media && activity.media.length > 0 ? (
                        <img
                          src={activitiesApi.getMediaUrl(activity._id, 0)}
                          alt={activity.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          {activity.icon || '📋'}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Title & Category */}
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{activity.title}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(activity.category)}`}>
                        {getCategoryLabel(activity.category)}
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {formatDate(activity.createdAt)}
                  </td>

                  {/* Author */}
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {user?.username || 'Quản trị viên'}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                      activity.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${activity.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      {activity.isActive ? 'Công khai' : 'Bản nháp'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {/* View */}
                      <button
                        onClick={() => openEditEditor(activity)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Xem chi tiết"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => openEditEditor(activity)}
                        className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(activity)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inline Editor */}
      {showEditor && (
        <div className="fixed inset-0 bg-white dark:bg-slate-900 z-50 overflow-y-auto">
          <div className="flex h-full">
            {/* Left: Editor */}
            <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-slate-700">
              {/* Editor Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <h2 className="text-xl font-bold italic text-gray-800 dark:text-white">
                  {editingActivity ? 'Chỉnh sửa hoạt động' : 'Thêm hoạt động mới'}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={closeEditor}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    Lưu nháp
                  </button>
                  <button
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    {saving ? 'Đang lưu...' : 'Đăng bài'}
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-1 px-6 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex-wrap">
                <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" onChange={(e) => execCommand('formatBlock', e.target.value)}>
                  <option value="p">Văn bản</option>
                  <option value="h1">Heading 1</option>
                  <option value="h2">Heading 2</option>
                  <option value="h3">Heading 3</option>
                </select>
                <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" onChange={(e) => execCommand('fontSize', e.target.value)}>
                  <option value="3">Thường</option>
                  <option value="1">Nhỏ</option>
                  <option value="4">Lớn</option>
                  <option value="5">Rất lớn</option>
                </select>
                <div className="w-px h-8 bg-gray-300 mx-2"></div>
                <button onClick={() => execCommand('bold')} className="p-2 hover:bg-gray-200 rounded-lg font-bold text-gray-700" title="Đậm">B</button>
                <button onClick={() => execCommand('italic')} className="p-2 hover:bg-gray-200 rounded-lg italic text-gray-700" title="Nghiêng">I</button>
                <button onClick={() => execCommand('underline')} className="p-2 hover:bg-gray-200 rounded-lg underline text-gray-700" title="Gạch chân">U</button>
                <button onClick={() => execCommand('strikeThrough')} className="p-2 hover:bg-gray-200 rounded-lg line-through text-gray-700" title="Gạch ngang">S</button>
                <div className="w-px h-8 bg-gray-300 mx-2"></div>
                <input type="color" onChange={(e) => execCommand('foreColor', e.target.value)} className="w-8 h-8 cursor-pointer rounded border" title="Màu chữ" />
                <input type="color" onChange={(e) => execCommand('hiliteColor', e.target.value)} className="w-8 h-8 cursor-pointer rounded border" title="Màu nền" defaultValue="#ffff00" />
                <div className="w-px h-8 bg-gray-300 mx-2"></div>
                <button onClick={() => execCommand('insertOrderedList')} className="p-2 hover:bg-gray-200 rounded-lg" title="Danh sách số">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20h14M7 12h14M7 4h14M3 20h.01M3 12h.01M3 4h.01" /></svg>
                </button>
                <button onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-gray-200 rounded-lg" title="Danh sách gạch">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <button onClick={() => execCommand('indent')} className="p-2 hover:bg-gray-200 rounded-lg" title="Thụt lề">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                </button>
                <button onClick={() => execCommand('outdent')} className="p-2 hover:bg-gray-200 rounded-lg" title="Giảm thụt lề">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                </button>
                <div className="w-px h-8 bg-gray-300 mx-2"></div>
                <button onClick={() => execCommand('justifyLeft')} className="p-2 hover:bg-gray-200 rounded-lg" title="Căn trái">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" /></svg>
                </button>
                <button onClick={() => execCommand('justifyCenter')} className="p-2 hover:bg-gray-200 rounded-lg" title="Căn giữa">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" /></svg>
                </button>
                <button onClick={() => execCommand('justifyRight')} className="p-2 hover:bg-gray-200 rounded-lg" title="Căn phải">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" /></svg>
                </button>
                <div className="w-px h-8 bg-gray-300 mx-2"></div>
                <button onClick={() => {
                  const url = prompt('Nhập URL:')
                  if (url) execCommand('createLink', url)
                }} className="p-2 hover:bg-gray-200 rounded-lg" title="Chèn link">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                </button>
                <button onClick={() => {
                  const url = prompt('Nhập URL ảnh:')
                  if (url) execCommand('insertImage', url)
                }} className="p-2 hover:bg-gray-200 rounded-lg" title="Chèn ảnh">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>
                <button onClick={() => execCommand('insertHorizontalRule')} className="p-2 hover:bg-gray-200 rounded-lg" title="Đường kẻ ngang">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>
                </button>
                <button onClick={() => execCommand('formatBlock', 'blockquote')} className="p-2 hover:bg-gray-200 rounded-lg text-xl" title="Trích dẫn">❝</button>
                <button onClick={() => execCommand('formatBlock', 'pre')} className="p-2 hover:bg-gray-200 rounded-lg font-mono text-sm" title="Code">&lt;/&gt;</button>
                <button onClick={() => execCommand('removeFormat')} className="p-2 hover:bg-gray-200 rounded-lg" title="Xóa định dạng">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Content Editor */}
              <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-slate-900">
                <div
                  ref={contentRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="min-h-[500px] p-4 text-gray-800 dark:text-gray-200 focus:outline-none prose max-w-none"
                  style={{ minHeight: 'calc(100vh - 200px)' }}
                  dangerouslySetInnerHTML={{ __html: formData.content || '<p style="color: #9ca3af; font-style: italic;">Nhập nội dung hoạt động tại đây...</p>' }}
                  onFocus={(e) => {
                    if (e.currentTarget.innerHTML.includes('Nhập nội dung hoạt động tại đây...')) {
                      e.currentTarget.innerHTML = '<p></p>'
                    }
                  }}
                />
              </div>
            </div>

            {/* Right: Settings Panel */}
            <div className="w-80 bg-gray-50 dark:bg-slate-800 flex flex-col overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <div className="w-1 h-6 bg-blue-600 rounded"></div>
                  <h3 className="font-semibold text-lg">Cài đặt bài viết</h3>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tiêu đề hoạt động
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Nhập tiêu đề hoạt động..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Danh mục
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {CATEGORY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Featured Image */}
                <div>
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-3">
                    <div className="w-1 h-6 bg-blue-600 rounded"></div>
                    <h4 className="font-semibold">Ảnh đại diện</h4>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-slate-700">
                    {previewImage ? (
                      <div className="relative">
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => {
                            setPreviewImage(null)
                            setSelectedFiles([])
                            if (editingActivity) {
                              setRemoveMediaIndices([0])
                            }
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <svg className="w-16 h-16 mx-auto text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-2 text-sm text-blue-400">Chưa có ảnh đại diện</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full mt-3 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-slate-500 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload hình ảnh
                    </button>
                  </div>
                </div>

                {/* Publish Date */}
                <div>
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-3">
                    <div className="w-1 h-6 bg-blue-600 rounded"></div>
                    <h4 className="font-semibold">Ngày đăng</h4>
                  </div>
                  <input
                    type="date"
                    value={formData.publishDate}
                    onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Status */}
                <div>
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-3">
                    <div className="w-1 h-6 bg-blue-600 rounded"></div>
                    <h4 className="font-semibold">Trạng thái</h4>
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className={`relative w-12 h-6 rounded-full transition-colors ${formData.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}>
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Công khai</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className={`relative w-12 h-6 rounded-full transition-colors ${!formData.isActive ? 'bg-gray-500' : 'bg-gray-300'}`}>
                        <input
                          type="checkbox"
                          checked={!formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: !e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${!formData.isActive ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Bản nháp</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
