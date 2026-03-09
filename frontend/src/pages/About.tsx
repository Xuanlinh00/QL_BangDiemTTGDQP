import { useState, useEffect, useCallback } from 'react'
import { activitiesApi } from '../services/api'

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
  createdAt?: string
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
  { value: 'general', label: 'Chung' },
]

const ICON_OPTIONS = ['🎓', '🎖️', '📜', '⚖️', '💪', '🔬', '🏕️', '🛡️', '📊', '🌐', '👨‍🏫', '📰', '📋', '🏛️', '🏆', '📚', '⭐', '🔔', '🎯', '🤝']

function getCategoryLabel(val: string) {
  return CATEGORY_OPTIONS.find(c => c.value === val)?.label || val
}

function getCategoryColor(cat: string) {
  const map: Record<string, string> = {
    education: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    training: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    sports: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    research: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    extracurricular: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
    management: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    cooperation: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
    development: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    news: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
  }
  return map[cat] || 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
}

export default function About() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const loadActivities = useCallback(async () => {
    try {
      const res = await activitiesApi.list()
      setActivities(res.data.data || [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadActivities() }, [loadActivities])

  useEffect(() => {
    if (activities.length === 0) {
      activitiesApi.seed().then(() => loadActivities()).catch(() => {})
    }
  }, [activities.length, loadActivities])

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài đăng này?')) return
    try {
      await activitiesApi.delete(id)
      setActivities(prev => prev.filter(a => a._id !== id))
    } catch { /* ignore */ }
  }, [])

  const handleSave = useCallback(async (data: Partial<Activity>, files?: File[], removeMedia?: number[]) => {
    try {
      if (editingActivity) {
        const res = await activitiesApi.update(editingActivity._id, data as Record<string, unknown>, files, removeMedia)
        setActivities(prev => prev.map(a => a._id === editingActivity._id ? res.data.data : a))
      } else {
        const res = await activitiesApi.create(data as Record<string, unknown>, files)
        setActivities(prev => [...prev, res.data.data])
      }
      setShowModal(false)
      setEditingActivity(null)
    } catch { /* ignore */ }
  }, [editingActivity])

  const activeActivities = activities.filter(a => a.isActive)
  const inactiveActivities = activities.filter(a => !a.isActive)
  const filtered = filterCategory === 'all'
    ? activeActivities
    : activeActivities.filter(a => a.category === filterCategory)

  const usedCategories = [...new Set(activeActivities.map(a => a.category))]

  return (
    <div className="space-y-8 max-w-7xl mx-auto -mt-2">
      {/* ═══ INTRO CARD ═══ */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden animate-fade-in-up">
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-500 p-6 lg:p-8 text-white">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <span className="text-3xl">🏛️</span>
            </div>
            <div>
              <h3 className="text-lg lg:text-xl font-extrabold tracking-tight">
                TRUNG TÂM GIÁO DỤC QUỐC PHÒNG VÀ AN NINH
              </h3>
              <p className="text-white/80 text-sm mt-1">Trường Đại học Trà Vinh &bull; TVU</p>
              <p className="text-white/70 text-xs mt-0.5">Center of National Defense and Security Education, Tra Vinh University</p>
            </div>
          </div>
        </div>
        <div className="p-6 lg:p-8 space-y-4 text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
          <p>
            Trung tâm Giáo dục Quốc phòng và An ninh thuộc Trường Đại học Trà Vinh thực hiện nhiệm vụ đào tạo, bồi dưỡng chương trình Giáo dục Quốc phòng và An ninh cho sinh viên Trường Đại học Trà Vinh; tổ chức các hoạt động giáo dục quốc phòng cho các đơn vị có nhu cầu, các cơ sở đào tạo khác theo đúng quy định của nhà nước; cấp chứng chỉ Giáo dục Quốc phòng và An ninh cho sinh viên sau khi hoàn thành chương trình học tập.
          </p>
          <p>
            Giáo dục quốc phòng và an ninh là bộ phận của nền giáo dục quốc dân, một nội dung cơ bản trong xây dựng nền quốc phòng toàn dân, an ninh nhân dân; là môn học chính khóa trong chương trình giáo dục và đào tạo trong trung học phổ thông đến đại học và các trường chính trị, hành chính, đoàn thể.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="flex items-start gap-3">
              <span className="text-lg">📞</span>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Điện thoại liên lạc</p>
                <p className="font-medium text-gray-800 dark:text-slate-200">(84).294.3855246</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg">📍</span>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Cơ sở đào tạo</p>
                <p className="font-medium text-gray-800 dark:text-slate-200">Số 126, Nguyễn Thiện Thành, Khóm 4, Phường 5, TP. Trà Vinh, Trà Vinh</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ACTIVITIES / POSTS SECTION ═══ */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-gradient-to-b from-green-500 to-teal-500 rounded-full" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hoạt động & Tin tức</h2>
            <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium">
              {activeActivities.length} bài đăng
            </span>
          </div>
          <button
            onClick={() => { setEditingActivity(null); setShowModal(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Đăng bài mới
          </button>
        </div>

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterCategory === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            Tất cả
          </button>
          {usedCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterCategory === cat
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Posts list */}
        <div className="space-y-5">
          {filtered.map((activity, i) => {
            const isExpanded = expandedPost === activity._id
            const hasMedia = activity.media && activity.media.length > 0
            return (
              <div
                key={activity._id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden animate-fade-in-up hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Post header */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-3xl flex-shrink-0">{activity.icon}</span>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                          {activity.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${getCategoryColor(activity.category)}`}>
                            {getCategoryLabel(activity.category)}
                          </span>
                          {activity.createdAt && (
                            <span className="text-xs text-gray-400 dark:text-slate-500">
                              {new Date(activity.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Admin actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setEditingActivity(activity); setShowModal(true) }}
                        className="p-1.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button
                        onClick={() => handleDelete(activity._id)}
                        className="p-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-slate-400 mt-3 leading-relaxed">
                    {activity.description}
                  </p>

                  {/* Extended content (collapsible) */}
                  {activity.content && (
                    <>
                      {isExpanded && (
                        <div className="mt-3 text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap border-t border-gray-100 dark:border-slate-700 pt-3">
                          {activity.content}
                        </div>
                      )}
                      <button
                        onClick={() => setExpandedPost(isExpanded ? null : activity._id)}
                        className="mt-2 text-xs text-primary-500 hover:text-primary-600 font-medium"
                      >
                        {isExpanded ? '← Thu gọn' : 'Xem thêm →'}
                      </button>
                    </>
                  )}
                </div>

                {/* Media gallery */}
                {hasMedia && (
                  <div className={`px-5 pb-5 grid gap-2 ${
                    activity.media.length === 1 ? 'grid-cols-1' :
                    activity.media.length === 2 ? 'grid-cols-2' :
                    'grid-cols-2 md:grid-cols-3'
                  }`}>
                    {activity.media.map((m, idx) => {
                      const mediaUrl = activitiesApi.getMediaUrl(activity._id, idx)
                      const isVideo = m.mimeType.startsWith('video/')
                      return isVideo ? (
                        <video
                          key={m._id || idx}
                          src={mediaUrl}
                          controls
                          className="w-full rounded-xl border border-gray-200 dark:border-slate-600 max-h-80 object-cover"
                        />
                      ) : (
                        <img
                          key={m._id || idx}
                          src={mediaUrl}
                          alt={m.fileName}
                          className="w-full rounded-xl border border-gray-200 dark:border-slate-600 max-h-80 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 dark:text-slate-500">
              <span className="text-4xl block mb-2">📭</span>
              <p className="text-sm">Chưa có bài đăng nào{filterCategory !== 'all' ? ' trong danh mục này' : ''}</p>
            </div>
          )}
        </div>

        {/* Inactive activities */}
        {inactiveActivities.length > 0 && (
          <details className="mt-5">
            <summary className="text-sm text-gray-400 dark:text-slate-500 cursor-pointer hover:text-gray-600 dark:hover:text-slate-300">
              {inactiveActivities.length} bài đăng đã ẩn
            </summary>
            <div className="space-y-3 mt-3">
              {inactiveActivities.map(activity => (
                <div key={activity._id} className="relative bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-200 dark:border-slate-700 opacity-60">
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button onClick={() => { setEditingActivity(activity); setShowModal(true) }} className="p-1.5 bg-blue-100 text-blue-600 rounded-lg" title="Sửa">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(activity._id)} className="p-1.5 bg-red-100 text-red-600 rounded-lg" title="Xóa">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl grayscale">{activity.icon}</span>
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 dark:text-slate-400">{activity.title}</h4>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 line-clamp-2">{activity.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Activity Add/Edit Modal */}
      {showModal && (
        <ActivityModal
          activity={editingActivity}
          onClose={() => { setShowModal(false); setEditingActivity(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   Activity Add/Edit Modal (with media upload)
   ══════════════════════════════════════════ */

function ActivityModal({ activity, onClose, onSave }: {
  activity: Activity | null
  onClose: () => void
  onSave: (data: Partial<Activity>, files?: File[], removeMedia?: number[]) => void
}) {
  const [title, setTitle] = useState(activity?.title || '')
  const [description, setDescription] = useState(activity?.description || '')
  const [content, setContent] = useState(activity?.content || '')
  const [icon, setIcon] = useState(activity?.icon || '📋')
  const [category, setCategory] = useState(activity?.category || 'general')
  const [order, setOrder] = useState(activity?.order ?? 0)
  const [isActive, setIsActive] = useState(activity?.isActive ?? true)
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [removeIndices, setRemoveIndices] = useState<number[]>([])

  const existingMedia = activity?.media || []

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setNewFiles(prev => [...prev, ...files])
    // Generate previews
    files.forEach(f => {
      const url = URL.createObjectURL(f)
      setPreviewUrls(prev => [...prev, url])
    })
  }

  const removeNewFile = (idx: number) => {
    URL.revokeObjectURL(previewUrls[idx])
    setNewFiles(prev => prev.filter((_, i) => i !== idx))
    setPreviewUrls(prev => prev.filter((_, i) => i !== idx))
  }

  const toggleRemoveExisting = (idx: number) => {
    setRemoveIndices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
  }

  const handleSubmit = () => {
    if (!title.trim()) return
    onSave(
      { title: title.trim(), description: description.trim(), content: content.trim(), icon, category, order, isActive },
      newFiles.length > 0 ? newFiles : undefined,
      removeIndices.length > 0 ? removeIndices : undefined,
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 border border-gray-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            {activity ? 'Sửa bài đăng' : 'Đăng bài mới'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-white text-2xl">&times;</button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Icon picker */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Biểu tượng</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-10 h-10 text-xl flex items-center justify-center rounded-xl border-2 transition-all ${icon === ic ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 scale-110' : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'}`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Tiêu đề *</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="VD: Đào tạo GDQP-AN"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Mô tả ngắn</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Tóm tắt nội dung..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
          </div>
          {/* Content (full article) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Nội dung chi tiết</label>
            <textarea
              value={content} onChange={e => setContent(e.target.value)}
              rows={5}
              placeholder="Nội dung bài viết đầy đủ..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
          </div>
          {/* Category & Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Danh mục</label>
              <select
                value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 outline-none"
              >
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Thứ tự</label>
              <input
                type="number" value={order} onChange={e => setOrder(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 outline-none"
              />
            </div>
          </div>
          {/* Media upload */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Hình ảnh / Video</label>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-4 cursor-pointer hover:border-primary-400 transition-colors">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-sm text-gray-500 dark:text-slate-400">Chọn hình ảnh hoặc video</span>
              <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
            </label>
            {/* Existing media (edit mode) */}
            {existingMedia.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Media hiện có (nhấn để đánh dấu xóa):</p>
                <div className="flex flex-wrap gap-2">
                  {existingMedia.map((m, idx) => (
                    <div
                      key={m._id || idx}
                      onClick={() => toggleRemoveExisting(idx)}
                      className={`relative w-20 h-20 rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
                        removeIndices.includes(idx) ? 'border-red-500 opacity-40' : 'border-gray-200 dark:border-slate-600'
                      }`}
                    >
                      {m.mimeType.startsWith('video/') ? (
                        <div className="w-full h-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-xl">🎬</div>
                      ) : (
                        <img
                          src={activitiesApi.getMediaUrl(activity!._id, idx)}
                          alt={m.fileName}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {removeIndices.includes(idx) && (
                        <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* New file previews */}
            {newFiles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {newFiles.map((f, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg border-2 border-primary-300 overflow-hidden group">
                    {f.type.startsWith('video/') ? (
                      <div className="w-full h-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-xl">🎬</div>
                    ) : (
                      <img src={previewUrls[idx]} alt={f.name} className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => removeNewFile(idx)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Active toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-primary-600"
            />
            <span className="text-sm text-gray-700 dark:text-slate-300">Hiển thị bài đăng</span>
          </label>
        </div>
        <div className="border-t border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            {activity ? 'Cập nhật' : 'Đăng bài'}
          </button>
        </div>
      </div>
    </div>
  )
}
