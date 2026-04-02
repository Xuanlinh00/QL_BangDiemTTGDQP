import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { activitiesApi } from '../services/api'
import PublicLayout from '../components/Layout/PublicLayout'
import { useSettings } from '../hooks/useSettings'

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

export default function PublicActivityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [mediaModal, setMediaModal] = useState<{
    type: 'image' | 'video'
    url: string
    allMedia: Array<{ type: 'image' | 'video'; url: string }>
    currentIndex: number
  } | null>(null)
  const { getSetting } = useSettings()

  // Get settings
  const primaryColor = getSetting('color_header', '#2B3A9F')
  const linkColor = getSetting('color_link', '#2563eb')

  useEffect(() => {
    const loadActivity = async () => {
      try {
        // Check local storage first for local activities
        if (id?.startsWith('local_')) {
          const localActivities = getLocalActivities()
          const found = localActivities.find(a => a._id === id)
          if (found) {
            setActivity(found)
            setLoading(false)
            return
          }
        }
        
        const res = await activitiesApi.list()
        const found = res.data.data?.find((a: Activity) => a._id === id)
        if (found) {
          setActivity(found)
        } else {
          // Try local storage as fallback
          const localActivities = getLocalActivities()
          const localFound = localActivities.find(a => a._id === id)
          if (localFound) {
            setActivity(localFound)
          } else {
            navigate('/gioi-thieu')
          }
        }
      } catch (error) {
        console.error('Error loading activity:', error)
        // Try local storage as fallback
        const localActivities = getLocalActivities()
        const localFound = localActivities.find(a => a._id === id)
        if (localFound) {
          setActivity(localFound)
        } else {
          navigate('/gioi-thieu')
        }
      } finally {
        setLoading(false)
      }
    }

    loadActivity()
  }, [id, navigate])

  if (loading) {
    return (
      <PublicLayout title="CHI TIẾT HOẠT ĐỘNG">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: primaryColor }}></div>
            <p className="text-gray-600 dark:text-slate-400">Đang tải...</p>
          </div>
        </div>
      </PublicLayout>
    )
  }

  if (!activity) {
    return (
      <PublicLayout title="CHI TIẾT HOẠT ĐỘNG">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-gray-600 dark:text-slate-400 mb-4">Không tìm thấy bài đăng</p>
            <button
              onClick={() => navigate('/hoat-dong')}
              className="px-6 py-2 text-white rounded-lg transition-colors"
              style={{ backgroundColor: primaryColor }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Quay lại
            </button>
          </div>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout title={activity.title}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
        {/* Back button */}
        <button
          onClick={() => navigate('/hoat-dong')}
          className="flex items-center gap-2 font-medium transition-colors mb-8"
          style={{ color: linkColor }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại danh sách
        </button>
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {activity.title}
          </h1>
          
          {activity.description && (
            <p className="text-lg text-gray-600 dark:text-slate-400 mb-4 leading-relaxed">
              {activity.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getCategoryColor(activity.category)}`}>
              {getCategoryLabel(activity.category)}
            </span>
            {activity.createdAt && (
              <span className="text-gray-600 dark:text-slate-400 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(activity.createdAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        {activity.content && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 shadow-sm mb-8">
            <div 
              className="text-gray-700 dark:text-slate-300 leading-relaxed prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: activity.content }}
            />
          </div>
        )}

        {/* Preview Image for local activities */}
        {activity.previewImage && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 shadow-sm mb-8">
            <img 
              src={activity.previewImage} 
              alt={activity.title}
              className="w-full h-auto rounded-xl"
            />
          </div>
        )}

        {/* Media Gallery */}
        {activity.media && activity.media.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 shadow-sm">
            <div className="space-y-6">
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
                    className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-900 group cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setMediaModal({ type: isVideo ? 'video' : 'image', url, allMedia, currentIndex: idx })}
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
                        className="w-full h-auto max-h-96 object-contain"
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
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center"
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
    </PublicLayout>
  )
}
