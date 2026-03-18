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

export default function PublicAbout() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Banner slides (có thể hardcode hoặc lấy từ API sau)
  const [bannerSlides] = useState<Array<{ id: string; image: string | null }>>([
    { id: '1', image: null }, // thay bằng URL thật nếu có
    { id: '2', image: null },
    { id: '3', image: null },
  ])
  const [currentBannerSlide, setCurrentBannerSlide] = useState(0)

  // Lightbox state
  const [mediaModal, setMediaModal] = useState<{
    type: 'image' | 'video'
    url: string
    allMedia: Array<{ type: 'image' | 'video'; url: string }>
    currentIndex: number
  } | null>(null)

  const loadActivities = useCallback(async () => {
    try {
      const res = await activitiesApi.list()
      setActivities(res.data.data || [])
    } catch {
      // silent fail
    }
  }, [])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  // Auto-rotate banner
  useEffect(() => {
    if (bannerSlides.length <= 1) return

    const interval = setInterval(() => {
      setCurrentBannerSlide(prev => (prev + 1) % bannerSlides.length)
    }, 5500) // 5.5 giây

    return () => clearInterval(interval)
  }, [bannerSlides.length])

  const activeActivities = activities.filter(a => a.isActive)
  const filtered =
    filterCategory === 'all'
      ? activeActivities
      : activeActivities.filter(a => a.category === filterCategory)

  const usedCategories = [...new Set(activeActivities.map(a => a.category))]

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner Carousel - sạch sẽ, không nút chỉnh sửa */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-purple-600 to-teal-600 shadow-2xl">
        {/* Subtle overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.12),transparent_60%)]" />
        </div>

        {/* Slides */}
        <div className="relative h-72 sm:h-80 md:h-[28rem] overflow-hidden">
          {bannerSlides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                idx === currentBannerSlide
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-105'
              }`}
            >
              {slide.image ? (
                <img
                  src={slide.image}
                  alt={`Banner ${idx + 1}`}
                  className="w-full h-full object-cover brightness-90"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                  <div className="text-center text-white/40">
                    <svg className="w-24 h-24 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xl">Slide {idx + 1}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Arrows */}
        {bannerSlides.length > 1 && (
          <>
            <button
              onClick={() => setCurrentBannerSlide(prev => (prev - 1 + bannerSlides.length) % bannerSlides.length)}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur transition hover:scale-110"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentBannerSlide(prev => (prev + 1) % bannerSlides.length)}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur transition hover:scale-110"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Indicators */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {bannerSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentBannerSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all ${
                idx === currentBannerSlide ? 'bg-white scale-125 shadow-md' : 'bg-white/60 hover:bg-white'
              }`}
            />
          ))}
        </div>

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 md:px-16 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
          <div className="inline-block mb-6 px-6 py-2 bg-white/10 backdrop-blur-lg rounded-full border border-white/20 shadow-lg">
            <span className="text-sm md:text-base font-semibold text-white uppercase tracking-widest">
              Hoạt động & Tin tức
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight drop-shadow-2xl">
            Khám phá các hoạt động nổi bật
          </h1>

          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
            Cập nhật những tin tức mới nhất, các hoạt động đào tạo, sự kiện và những thành tựu đáng tự hào của tổ chức
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-6 text-white/90 text-base">
            <div className="flex items-center gap-3 bg-black/30 px-5 py-2.5 rounded-full backdrop-blur-sm">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.5 1.5H5.75A2.25 2.25 0 003.5 3.75v10.5a2.25 2.25 0 002.25 2.25h8.5a2.25 2.25 0 002.25-2.25V6.5m-11-3v3m6-3v3m-6 6h6" />
              </svg>
              <span>{activeActivities.length} bài đăng</span>
            </div>
            <div className="flex items-center gap-3 bg-black/30 px-5 py-2.5 rounded-full backdrop-blur-sm">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" clipRule="evenodd" />
              </svg>
              <span>{usedCategories.length} danh mục</span>
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách hoạt động */}
      <div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-1.5 h-9 bg-gradient-to-b from-teal-500 to-emerald-500 rounded-full" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hoạt động & Tin tức</h2>
          <span className="text-sm bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-3 py-1 rounded-full">
            {activeActivities.length} bài đăng
          </span>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2.5 mb-8">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filterCategory === 'all'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
            }`}
          >
            Tất cả
          </button>
          {usedCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filterCategory === cat
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Danh sách bài */}
        {filtered.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((activity, i) => {
              const isExpanded = expandedPost === activity._id
              const hasMedia = activity.media?.length > 0

              return (
                <div
                  key={activity._id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <span className="text-4xl flex-shrink-0">{activity.icon}</span>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {activity.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(activity.category)}`}>
                            {getCategoryLabel(activity.category)}
                          </span>
                          {activity.createdAt && (
                            <span className="text-sm text-gray-500 dark:text-slate-400">
                              {new Date(activity.createdAt).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
                      {activity.description}
                    </p>

                    {activity.content && (
                      <div>
                        {isExpanded && (
                          <div className="mt-4 text-gray-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap border-t border-gray-200 dark:border-slate-700 pt-4">
                            {activity.content}
                          </div>
                        )}
                        <button
                          onClick={() => setExpandedPost(isExpanded ? null : activity._id)}
                          className="mt-3 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium text-sm transition"
                        >
                          {isExpanded ? 'Thu gọn ↑' : 'Xem thêm ↓'}
                        </button>
                      </div>
                    )}
                  </div>

                  {hasMedia && (
                    <div className={`px-6 pb-6 grid gap-4 ${activity.media.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                      {activity.media.map((m, idx) => {
                        const url = activitiesApi.getMediaUrl(activity._id, idx)
                        const isVideo = m.mimeType.startsWith('video/')
                        const allMedia = activity.media.map((media, i) => ({
                          type: media.mimeType.startsWith('video/') ? 'video' : 'image',
                          url: activitiesApi.getMediaUrl(activity._id, i),
                        })) as Array<{ type: 'image' | 'video'; url: string }>

                        return (
                          <div
                            key={idx}
                            className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 cursor-pointer group aspect-video bg-gray-100 dark:bg-slate-900"
                            onClick={() => setMediaModal({ type: isVideo ? 'video' : 'image', url, allMedia, currentIndex: idx })}
                          >
                            {isVideo ? (
                              <video src={url} className="w-full h-full object-cover" muted loop playsInline />
                            ) : (
                              <img src={url} alt={m.fileName} className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                              <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-80 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                              </svg>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500 dark:text-slate-400">
            <span className="text-6xl block mb-4">📭</span>
            <p className="text-lg">
              Chưa có bài đăng nào{filterCategory !== 'all' ? ` trong danh mục "${getCategoryLabel(filterCategory)}"` : ''}
            </p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {mediaModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
          onClick={() => setMediaModal(null)}
        >
          <div className="relative max-w-6xl w-full" onClick={e => e.stopPropagation()}>
            <button
              className="absolute -top-12 right-4 text-white text-5xl hover:text-gray-300 transition"
              onClick={() => setMediaModal(null)}
            >
              ×
            </button>

            {mediaModal.type === 'image' ? (
              <img
                src={mediaModal.url}
                alt="Preview"
                className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain mx-auto"
              />
            ) : (
              <video
                src={mediaModal.url}
                controls
                autoPlay
                className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl bg-black mx-auto"
              />
            )}

            {mediaModal.allMedia.length > 1 && (
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() => {
                    const newIdx = mediaModal.currentIndex === 0 ? mediaModal.allMedia.length - 1 : mediaModal.currentIndex - 1
                    const newMedia = mediaModal.allMedia[newIdx]
                    setMediaModal({ ...mediaModal, currentIndex: newIdx, type: newMedia.type as 'image' | 'video', url: newMedia.url })
                  }}
                  className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="px-6 py-3 bg-white/10 rounded-full text-white">
                  {mediaModal.currentIndex + 1} / {mediaModal.allMedia.length}
                </div>

                <button
                  onClick={() => {
                    const newIdx = (mediaModal.currentIndex + 1) % mediaModal.allMedia.length
                    const newMedia = mediaModal.allMedia[newIdx]
                    setMediaModal({ ...mediaModal, currentIndex: newIdx, type: newMedia.type as 'image' | 'video', url: newMedia.url })
                  }}
                  className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}