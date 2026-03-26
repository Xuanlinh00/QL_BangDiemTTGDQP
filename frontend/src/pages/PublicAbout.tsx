import { useState, useEffect, useCallback } from 'react'
import { activitiesApi } from '../services/api'

// Add scrollbar-hide style
const scrollbarHideStyle = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`

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

  // Banner slides - load từ API
  const [bannerSlides, setBannerSlides] = useState<Array<{ id: string; image: string | null }>>([
    { id: '1', image: null },
    { id: '2', image: null },
    { id: '3', image: null },
  ])
  const [currentBannerSlide, setCurrentBannerSlide] = useState(0)

  // Lightbox state
  const [mediaModal, setMediaModal] = useState<{
    type: 'image' | 'video' | 'detail'
    url: string
    allMedia: Array<{ type: 'image' | 'video'; url: string }>
    currentIndex: number
    activity?: Activity
  } | null>(null)

  const loadActivities = useCallback(async () => {
    try {
      const res = await activitiesApi.list()
      setActivities(res.data.data || [])
      
      // Load banner slides
      const banner = res.data.data?.find((a: Activity) => a.category === 'banner')
      if (banner && banner.media.length > 0) {
        const slides = banner.media.map((_m: MediaItem, idx: number) => ({
          id: String(idx + 1),
          image: activitiesApi.getMediaUrl(banner._id, idx)
        }))
        setBannerSlides(slides)
      }
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

  const activeActivities = activities.filter(a => a.isActive && a.category !== 'banner' && a.category !== 'introduction')
  const filtered =
    filterCategory === 'all'
      ? activeActivities
      : activeActivities.filter(a => a.category === filterCategory)

  const usedCategories = [...new Set(activeActivities.map(a => a.category))]

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <style>{scrollbarHideStyle}</style>
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Trung tâm Giáo dục Quốc phòng và An ninh Đại học Trà Vinh
        </h1>
      </div>

      {/* Banner Carousel - sạch sẽ, không nút chỉnh sửa */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-purple-600 to-teal-600 shadow-2xl">
        {/* Subtle overlay */}
       

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
                  className="w-full h-full object-cover brightness-95"
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
          

          <h5 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight drop-shadow-2xl">
            Trung tâm Giáo dục Quốc phòng và An ninh <br /> Đại học Trà Vinh
          </h5>
        </div>
      </div>

      {/* Mục giới thiệu trung tâm */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-8 md:p-12 border border-blue-200 dark:border-slate-600">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-6">
           
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Giới thiệu về Trung tâm Giáo dục Quốc phòng và An ninh
              </h2>
              <p className="text-lg text-gray-700 dark:text-slate-300 mb-4 leading-relaxed">
                Trung tâm Giáo dục Quốc phòng và An ninh (GDQP-AN) Đại học Trà Vinh là đơn vị chuyên trách trong công tác giáo dục quốc phòng, an ninh cho sinh viên các trường đại học, cao đẳng trên địa bàn tỉnh Trà Vinh.
              </p>
              <p className="text-lg text-gray-700 dark:text-slate-300 mb-4 leading-relaxed">
              Thành lập vào năm 2008 với tên gọi Trung tâm Giáo dục Quốc phòng – An ninh sinh viên. Tại Quyết định số 1830/QĐ-UBND, ngày 03/10/2017 của UBND tỉnh Trà Vinh, trung tâm đổi tên thành Trung tâm Giáo dục Quốc phòng và An ninh (GDQP – AN), trực thuộc Trường Đại học Trà Vinh (Trung tâm). Từ ngày thành lập đến nay Trung tâm luôn hoàn thành nhiệm vụ được giao.
              </p>

              {/* Display introduction media */}
              {(() => {
                const introActivity = activities.find(a => a.category === 'introduction')
                if (!introActivity || !introActivity.media?.length) return null
                return (
                  <div className="mt-6 space-y-4">
                    <div className="space-y-4">
                      {introActivity.media.map((m, idx) => {
                        const url = activitiesApi.getMediaUrl(introActivity._id, idx)
                        const isVideo = m.mimeType.startsWith('video/')
                        const allMedia = introActivity.media.map((media, i) => ({
                          type: media.mimeType.startsWith('video/') ? 'video' : 'image',
                          url: activitiesApi.getMediaUrl(introActivity._id, i),
                        })) as Array<{ type: 'image' | 'video'; url: string }>

                        return (
                          <div
                            key={idx}
                            className="relative rounded-lg overflow-hidden border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-900 group hover:shadow-lg transition-shadow w-full"
                          >
                            {isVideo ? (
                              <video 
                                src={url} 
                                className="w-full h-auto max-h-96 object-contain" 
                                controls
                                controlsList="nodownload"
                              />
                            ) : (
                              <img 
                                src={url} 
                                alt={m.fileName} 
                                className="w-full h-auto max-h-96 object-contain cursor-pointer"
                                onClick={() => setMediaModal({ type: 'image', url, allMedia, currentIndex: idx })}
                              />
                            )}
                            {isVideo && (
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center pointer-events-none">
                                <svg className="w-16 h-16 text-white opacity-70 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            )}
                            {!isVideo && (
                              <div 
                                className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center cursor-pointer"
                                onClick={() => setMediaModal({ type: 'image', url, allMedia, currentIndex: idx })}
                              >
                                <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-80 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
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

        {/* Danh sách bài - Horizontal scroll */}
        {filtered.length > 0 ? (
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-6 pb-4 min-w-min">
                {filtered.map((activity, i) => {
                  const hasMedia = activity.media?.length > 0

                  return (
                    <div
                      key={activity._id}
                      className="flex-shrink-0 w-80 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                      onClick={() => setMediaModal({ type: 'detail', url: '', allMedia: [], currentIndex: 0, activity })}
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                          {activity.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(activity.category)}`}>
                            {getCategoryLabel(activity.category)}
                          </span>
                          {activity.createdAt && (
                            <span className="text-xs text-gray-500 dark:text-slate-400">
                              {new Date(activity.createdAt).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-3">
                          {activity.description}
                        </p>
                      </div>

                      {hasMedia && (
                        <div className="px-6 pb-6">
                          <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 aspect-video bg-gray-100 dark:bg-slate-900">
                            {(() => {
                              const m = activity.media[0]
                              const url = activitiesApi.getMediaUrl(activity._id, 0)
                              const isVideo = m.mimeType.startsWith('video/')

                              return (
                                <>
                                  {isVideo ? (
                                    <video src={url} className="w-full h-full object-cover" muted loop playsInline />
                                  ) : (
                                    <img src={url} alt={m.fileName} className="w-full h-full object-cover" />
                                  )}
                                </>
                              )
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Navigation arrows */}
            {filtered.length > 3 && (
              <>
                <button
                  onClick={() => {
                    const container = document.querySelector('.overflow-x-auto')
                    if (container) container.scrollLeft -= 400
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-10 p-3 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg transition hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const container = document.querySelector('.overflow-x-auto')
                    if (container) container.scrollLeft += 400
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-10 p-3 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg transition hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
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
          <div className="relative max-w-6xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button
              className="sticky top-0 right-0 float-right p-2 text-white text-4xl hover:text-gray-300 transition bg-black/50 rounded-lg"
              onClick={() => setMediaModal(null)}
            >
              ×
            </button>

            {mediaModal.type === 'detail' && mediaModal.activity ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 md:p-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {mediaModal.activity.title}
                </h2>
                
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${getCategoryColor(mediaModal.activity.category)}`}>
                    {getCategoryLabel(mediaModal.activity.category)}
                  </span>
                  {mediaModal.activity.createdAt && (
                    <span className="text-gray-500 dark:text-slate-400">
                      {new Date(mediaModal.activity.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>

                <p className="text-lg text-gray-700 dark:text-slate-300 mb-6 leading-relaxed">
                  {mediaModal.activity.description}
                </p>

                {mediaModal.activity.content && (
                  <div className="text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mb-8 border-t border-gray-200 dark:border-slate-700 pt-6">
                    {mediaModal.activity.content}
                  </div>
                )}

                {mediaModal.activity.media?.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Hình ảnh & Video</h3>
                    <div className={`grid gap-4 ${mediaModal.activity.media.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                      {mediaModal.activity.media.map((m, idx) => {
                        const url = activitiesApi.getMediaUrl(mediaModal.activity!._id, idx)
                        const isVideo = m.mimeType.startsWith('video/')
                        const allMedia = mediaModal.activity!.media.map((media, i) => ({
                          type: media.mimeType.startsWith('video/') ? 'video' : 'image',
                          url: activitiesApi.getMediaUrl(mediaModal.activity!._id, i),
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
                  </div>
                )}
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      )}

    {/* Footer */}
    <footer className="bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-900 dark:to-black text-white py-12 md:py-16 rounded-t-3xl mt-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4">Trung tâm GDQP-AN</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Đơn vị chuyên trách giáo dục quốc phòng và an ninh cho sinh viên các trường đại học, cao đẳng trên địa bàn tỉnh Trà Vinh.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="text-slate-300 hover:text-white transition-colors">Trang chủ</a></li>
              <li><a href="/about" className="text-slate-300 hover:text-white transition-colors">Về chúng tôi</a></li>
              <li><a href="/about" className="text-slate-300 hover:text-white transition-colors">Hoạt động</a></li>
              <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Liên hệ</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-bold mb-4">Danh mục</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Giáo dục</a></li>
              <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Huấn luyện</a></li>
              <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Thể thao</a></li>
              <li><a href="#" className="text-slate-300 hover:text-white transition-colors">Tin tức</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">Liên hệ</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>info@tvu.edu.vn</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>(0292) 3.848.888</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Trà Vinh, Việt Nam</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-600 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-300 text-sm">
              © 2024 Trung tâm Giáo dục Quốc phòng và An ninh. Tất cả quyền được bảo lưu.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-300 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx={12} cy={12} r={12} />
                </svg>
              </a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx={12} cy={12} r={12} />
                </svg>
              </a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx={12} cy={12} r={12} />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
  )
}