import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
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
  }
  return map[cat] || 'bg-gray-100 text-gray-600'
}

export default function PublicAbout() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const loadActivities = useCallback(async () => {
    try {
      const res = await activitiesApi.list()
      setActivities(res.data.data || [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadActivities() }, [loadActivities])

  const activeActivities = activities.filter(a => a.isActive)
  const filtered = filterCategory === 'all'
    ? activeActivities
    : activeActivities.filter(a => a.category === filterCategory)
  const usedCategories = [...new Set(activeActivities.map(a => a.category))]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top bar */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow">TVU</div>
              <div className="w-9 h-9 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow">QP</div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-gray-800 leading-tight">HỆ THỐNG GDQP-AN</h1>
              <p className="text-[10px] text-gray-500">Trường Đại học Trà Vinh</p>
            </div>
          </div>
          <Link
            to="/login"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white text-sm font-medium rounded-xl transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
            Đăng nhập
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* ═══ INTRO CARD ═══ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-500 p-6 lg:p-8 text-white">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                <span className="text-3xl">🏛️</span>
              </div>
              <div>
                <h2 className="text-lg lg:text-xl font-extrabold tracking-tight">
                  TRUNG TÂM GIÁO DỤC QUỐC PHÒNG VÀ AN NINH
                </h2>
                <p className="text-white/80 text-sm mt-1">Trường Đại học Trà Vinh &bull; TVU</p>
                <p className="text-white/70 text-xs mt-0.5">...</p>
              </div>
            </div>
          </div>
          <div className="p-6 lg:p-8 space-y-4 text-sm text-gray-700 leading-relaxed">
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
                  <p className="text-xs font-semibold text-gray-500 uppercase">Điện thoại liên lạc</p>
                  <p className="font-medium text-gray-800">...</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">📍</span>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Cơ sở đào tạo</p>
                  <p className="font-medium text-gray-800">Số 126, Nguyễn Thiện Thành, Khóm 4, Phường 5, TP. Trà Vinh, Trà Vinh</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ ACTIVITIES / POSTS (read-only) ═══ */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1.5 h-8 bg-gradient-to-b from-green-500 to-teal-500 rounded-full" />
            <h2 className="text-xl font-bold text-gray-900">Hoạt động & Tin tức</h2>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
              {activeActivities.length} bài đăng
            </span>
          </div>

          {/* Category filter chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterCategory === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>

          {/* Posts list (no edit/delete buttons) */}
          <div className="space-y-5">
            {filtered.map((activity, i) => {
              const isExpanded = expandedPost === activity._id
              const hasMedia = activity.media && activity.media.length > 0
              return (
                <div
                  key={activity._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="p-5 pb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-3xl flex-shrink-0">{activity.icon}</span>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-gray-900 leading-tight">{activity.title}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${getCategoryColor(activity.category)}`}>
                            {getCategoryLabel(activity.category)}
                          </span>
                          {activity.createdAt && (
                            <span className="text-xs text-gray-400">
                              {new Date(activity.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">{activity.description}</p>

                    {activity.content && (
                      <>
                        {isExpanded && (
                          <div className="mt-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border-t border-gray-100 pt-3">
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
                            className="w-full rounded-xl border border-gray-200 max-h-80 object-cover"
                          />
                        ) : (
                          <img
                            key={m._id || idx}
                            src={mediaUrl}
                            alt={m.fileName}
                            className="w-full rounded-xl border border-gray-200 max-h-80 object-cover"
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <span className="text-4xl block mb-2">📭</span>
                <p className="text-sm">Chưa có bài đăng nào{filterCategory !== 'all' ? ' trong danh mục này' : ''}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-xs text-gray-400">
          Copyright © 2026 Bản quyền thuộc về Trung tâm Giáo dục Quốc phòng - An ninh Đại học Trà Vinh
        </div>
      </footer>
    </div>
  )
}
