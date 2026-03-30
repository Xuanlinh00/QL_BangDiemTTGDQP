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
  const [bannerSlides, setBannerSlides] = useState<Array<{ id: string; image: string | null }>>([
    { id: '1', image: null },
    { id: '2', image: null },
    { id: '3', image: null },
  ])
  const [currentBannerSlide, setCurrentBannerSlide] = useState(0)
  const [bannerActivity, setBannerActivity] = useState<Activity | null>(null)

  // State quản lý việc xem ảnh/video toàn màn hình
  const [mediaModal, setMediaModal] = useState<{
    type: 'image' | 'video'
    url: string
    allMedia: Array<{ type: 'image' | 'video'; url: string }>
    currentIndex: number
  } | null>(null)

  // State quản lý chỉnh sửa phần giới thiệu
  const [editingIntroduction, setEditingIntroduction] = useState(false)
  const [introductionData, setIntroductionData] = useState({
    title: 'Giới thiệu về Trung tâm Giáo dục Quốc phòng và An ninh',
    description: 'Trung tâm Giáo dục Quốc phòng và An ninh (GDQP-AN) Đại học Trà Vinh là đơn vị chuyên trách trong công tác giáo dục quốc phòng, an ninh cho sinh viên các trường đại học, cao đẳng trên địa bàn tỉnh Trà Vinh.',
    content: 'Thành lập vào năm 2008 với tên gọi Trung tâm Giáo dục Quốc phòng – An ninh sinh viên. Tại Quyết định số 1830/QĐ-UBND, ngày 03/10/2017 của UBND tỉnh Trà Vinh, trung tâm đổi tên thành Trung tâm Giáo dục Quốc phòng và An ninh (GDQP – AN), trực thuộc Trường Đại học Trà Vinh (Trung tâm). Từ ngày thành lập đến nay Trung tâm luôn hoàn thành nhiệm vụ được giao.',
    stats: [
      { label: 'Sinh viên được đào tạo', value: '100%' },
      { label: 'Năm kinh nghiệm', value: '15+' },
      { label: 'Sinh viên đã tốt nghiệp', value: '10K+' }
    ]
  })

  const loadActivities = useCallback(async () => {
    try {
      const res = await activitiesApi.list()
      setActivities(res.data.data || [])
      
      // Load banner activity
      const banner = res.data.data?.find((a: Activity) => a.category === 'banner')
      if (banner) {
        setBannerActivity(banner)
        const slides = banner.media.map((_m: MediaItem, idx: number) => ({
          id: String(idx + 1),
          image: activitiesApi.getMediaUrl(banner._id, idx)
        }))
        setBannerSlides(slides.length > 0 ? slides : [
          { id: '1', image: null },
          { id: '2', image: null },
          { id: '3', image: null },
        ])
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

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
    } catch {
      // ignore
    }
  }, [])

  const handleSave = useCallback(
    async (data: Partial<Activity>, files?: File[], removeMedia?: number[]) => {
      try {
        if (editingActivity) {
          const res = await activitiesApi.update(
            editingActivity._id,
            data as Record<string, unknown>,
            files,
            removeMedia
          )
          setActivities(prev =>
            prev.map(a => (a._id === editingActivity._id ? res.data.data : a))
          )
        } else {
          const res = await activitiesApi.create(data as Record<string, unknown>, files)
          setActivities(prev => [...prev, res.data.data])
        }
        setShowModal(false)
        setEditingActivity(null)
      } catch {
        // ignore
      }
    },
    [editingActivity]
  )

  const activeActivities = activities.filter(a => a.isActive && a.category !== 'banner' && a.category !== 'introduction')
  const inactiveActivities = activities.filter(a => !a.isActive && a.category !== 'banner' && a.category !== 'introduction')
  const filtered =
    filterCategory === 'all'
      ? activeActivities
      : activeActivities.filter(a => a.category === filterCategory)

  const usedCategories = [...new Set(activeActivities.map(a => a.category))]

  return (
    <div className="space-y-8 max-w-7xl mx-auto -mt-2">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
          Quản Lý Về Chúng Tôi
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400">
          Chỉnh sửa banner, giới thiệu và hoạt động của trung tâm
        </p>
      </div>

     {/* State kiểm tra quyền admin - bạn thay bằng logic thật của app */}

{/* ═══ BANNER CAROUSEL (CẢI TIẾN: AUTO-ROTATE + SMOOTH TRANSITION + ĐẸP HƠN) ═══ */}
<div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-purple-600 to-teal-600 shadow-2xl">
  {/* Background subtle overlay */}
  <div className="absolute inset-0 opacity-5 pointer-events-none">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.1),transparent_50%)]" />
  </div>

  {/* Slides container - absolute để transition mượt */}
  <div className="relative h-72 md:h-96 overflow-hidden">
    {bannerSlides.map((slide, idx) => (
      <div
        key={slide.id}
        className={`absolute inset-0 transition-all duration-800 ease-in-out transform ${
          idx === currentBannerSlide
            ? 'opacity-100 translate-x-0 scale-100'
            : idx === (currentBannerSlide + 1) % bannerSlides.length ||
              (currentBannerSlide === bannerSlides.length - 1 && idx === 0)
            ? 'opacity-0 translate-x-full scale-105'
            : 'opacity-0 -translate-x-full scale-95'
        }`}
      >
        {slide.image ? (
          <img
            src={slide.image}
            alt={`Banner slide ${idx + 1}`}
            className="w-full h-full object-cover brightness-95"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="text-center text-white/60">
              <svg className="w-20 h-20 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg">Slide {idx + 1} - Chưa có hình</p>
            </div>
          </div>
        )}
      </div>
    ))}
  </div>

  {/* Navigation arrows */}
  {bannerSlides.length > 1 && (
    <>
      <button
        onClick={() => setCurrentBannerSlide(prev => (prev - 1 + bannerSlides.length) % bannerSlides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-110"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <button
        onClick={() => setCurrentBannerSlide(prev => (prev + 1) % bannerSlides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-110"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>
    </>
  )}

  {/* Indicators */}
  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
    {bannerSlides.map((_, idx) => (
      <button
        key={idx}
        onClick={() => setCurrentBannerSlide(idx)}
        className={`w-3 h-3 rounded-full transition-all duration-300 ${
          idx === currentBannerSlide
            ? 'bg-white scale-125 shadow-lg'
            : 'bg-white/50 hover:bg-white/80'
        }`}
      />
    ))}
  </div>

  {/* Banner content overlay */}
  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 md:px-12 bg-gradient-to-t from-black/60 via-black/30 to-transparent">
    
    {/* Edit buttons - chỉ hiển thị khi có hình */}
    {bannerSlides[currentBannerSlide]?.image && (
      <div className="absolute top-4 right-4 flex gap-2 z-30">
        <button
          onClick={async () => {
            if (!bannerActivity) return
            if (!window.confirm('Bạn có chắc muốn xóa hình ảnh này?')) return
            try {
              console.log('Deleting media at index:', currentBannerSlide);
              const res = await activitiesApi.update(bannerActivity._id, {}, [], [currentBannerSlide])
              console.log('Delete response:', res.data.data);
              setBannerActivity(res.data.data)
              
              // Rebuild slides from updated media
              if (res.data.data.media.length === 0) {
                // If no media left, reset to empty slides
                setBannerSlides([
                  { id: '1', image: null },
                  { id: '2', image: null },
                  { id: '3', image: null },
                ])
                setCurrentBannerSlide(0)
              } else {
                const newSlides = res.data.data.media.map((m: any, idx: number) => ({
                  id: String(idx + 1),
                  image: activitiesApi.getMediaUrl(res.data.data._id, idx)
                }))
                console.log('New slides after delete:', newSlides);
                setBannerSlides(newSlides)
                // Reset current slide if index is out of bounds
                if (currentBannerSlide >= newSlides.length) {
                  console.log('Resetting slide from', currentBannerSlide, 'to', newSlides.length - 1);
                  setCurrentBannerSlide(Math.max(0, newSlides.length - 1))
                }
              }
            } catch (err: any) {
              console.error('Delete failed:', err);
              alert('Xóa hình ảnh thất bại: ' + (err.response?.data?.error?.message || err.message))
            }
          }}
          className="p-2 rounded-lg bg-red-500/80 hover:bg-red-600 text-white transition-all"
          title="Xóa hình ảnh này"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <label className="p-2 rounded-lg bg-blue-500/80 hover:bg-blue-600 text-white transition-all cursor-pointer" title="Thay thế hình ảnh">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file && bannerActivity) {
                try {
                  console.log('Replacing media at index:', currentBannerSlide);
                  const removeIndices = [currentBannerSlide];
                  const res = await activitiesApi.update(bannerActivity._id, {}, [file], removeIndices)
                  console.log('Replace response:', res.data.data);
                  setBannerActivity(res.data.data)
                  const newSlides = res.data.data.media.map((m: any, idx: number) => ({
                    id: String(idx + 1),
                    image: activitiesApi.getMediaUrl(res.data.data._id, idx)
                  }))
                  console.log('New slides after replace:', newSlides);
                  setBannerSlides(newSlides)
                  // Keep current slide index or adjust if needed
                  if (currentBannerSlide >= newSlides.length) {
                    setCurrentBannerSlide(Math.max(0, newSlides.length - 1))
                  }
                } catch (err: any) {
                  console.error('Replace failed:', err)
                  alert('Thay thế hình ảnh thất bại: ' + (err.response?.data?.error?.message || err.message))
                }
              }
              e.target.value = '';
            }}
            className="hidden"
          />
        </label>
      </div>
    )}
    
    <h5 className="text-2xl md:text-4xl lg:text-4xl font-extrabold text-white mb-4 md:mb-6 leading-tight drop-shadow-2xl">
      Trung tâm Giáo dục Quốc phòng và An ninh<br /> Đại học Trà Vinh
    </h5>

    {/* Upload button */}
    <div className="mt-10">
      <label className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl transition-all backdrop-blur-md border border-white/30 cursor-pointer shadow-lg hover:shadow-xl hover:scale-105">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        Thêm hình cho slide {currentBannerSlide + 1}
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              try {
                console.log('Uploading file:', file.name, file.size, file.type);
                const token = localStorage.getItem('token');
                console.log('Token in localStorage:', token ? 'present' : 'missing');
                
                // Create or update banner activity
                if (!bannerActivity) {
                  console.log('Creating new banner activity');
                  const res = await activitiesApi.create({
                    title: 'Banner Slides',
                    description: 'Banner slides for homepage',
                    category: 'banner',
                    icon: '🖼️',
                    isActive: true,
                    order: 0,
                  }, [file])
                  console.log('Banner created:', res.data.data);
                  setBannerActivity(res.data.data)
                  const newSlides = res.data.data.media.map((m: any, idx: number) => ({
                    id: String(idx + 1),
                    image: activitiesApi.getMediaUrl(res.data.data._id, idx)
                  }))
                  setBannerSlides(newSlides)
                  setCurrentBannerSlide(0)
                } else {
                  console.log('Updating existing banner activity:', bannerActivity._id);
                  // Add to existing banner activity
                  const res = await activitiesApi.update(bannerActivity._id, {}, [file])
                  console.log('Banner updated:', res.data.data);
                  setBannerActivity(res.data.data)
                  const newSlides = res.data.data.media.map((m: any, idx: number) => ({
                    id: String(idx + 1),
                    image: activitiesApi.getMediaUrl(res.data.data._id, idx)
                  }))
                  setBannerSlides(newSlides)
                  // Set to the newly added slide (last one)
                  setCurrentBannerSlide(newSlides.length - 1)
                }
              } catch (err: any) {
                console.error('Upload failed:', err);
                alert('Upload failed: ' + (err.response?.data?.error?.message || err.message));
              }
            }
            e.target.value = '';
          }}
          className="hidden"
        />
      </label>
    </div>
  </div>
</div>

      {/* Mục giới thiệu trung tâm */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-8 md:p-12 border border-blue-200 dark:border-slate-600">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-blue-600 text-white">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5.581m0 0H9m5.581 0a2 2 0 100-4 2 2 0 000 4m0-7a2 2 0 100-4 2 2 0 000 4m-6 0a2 2 0 100-4 2 2 0 000 4m0 7h.581" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {introductionData.title}
              </h2>
              <p className="text-lg text-gray-700 dark:text-slate-300 mb-4 leading-relaxed">
                {introductionData.description}
              </p>
              <p className="text-lg text-gray-700 dark:text-slate-300 mb-4 leading-relaxed">
                {introductionData.content}
              </p>
              
              {/* Media upload section */}
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hình ảnh & Video</h3>
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors cursor-pointer shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upload Hình ảnh
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || [])
                        if (files.length === 0) return
                        try {
                          // Create introduction activity if not exists
                          let introActivity = activities.find(a => a.category === 'introduction')
                          if (!introActivity) {
                            const res = await activitiesApi.create({
                              title: 'Giới thiệu',
                              description: 'Hình ảnh và video giới thiệu',
                              category: 'introduction',
                              icon: '📸',
                              isActive: true,
                              order: 0,
                            }, files)
                            setActivities(prev => [...prev, res.data.data])
                          } else {
                            const res = await activitiesApi.update(introActivity._id, {}, files)
                            setActivities(prev => prev.map(a => a._id === introActivity._id ? res.data.data : a))
                          }
                        } catch (err: any) {
                          alert('Upload thất bại: ' + (err.response?.data?.error?.message || err.message))
                        }
                        e.target.value = ''
                      }}
                      className="hidden"
                    />
                  </label>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors cursor-pointer shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Upload Video
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || [])
                        if (files.length === 0) return
                        try {
                          let introActivity = activities.find(a => a.category === 'introduction')
                          if (!introActivity) {
                            const res = await activitiesApi.create({
                              title: 'Giới thiệu',
                              description: 'Hình ảnh và video giới thiệu',
                              category: 'introduction',
                              icon: '📸',
                              isActive: true,
                              order: 0,
                            }, files)
                            setActivities(prev => [...prev, res.data.data])
                          } else {
                            const res = await activitiesApi.update(introActivity._id, {}, files)
                            setActivities(prev => prev.map(a => a._id === introActivity._id ? res.data.data : a))
                          }
                        } catch (err: any) {
                          alert('Upload thất bại: ' + (err.response?.data?.error?.message || err.message))
                        }
                        e.target.value = ''
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                
                {/* Display uploaded media */}
                {(() => {
                  const introActivity = activities.find(a => a.category === 'introduction')
                  if (!introActivity || !introActivity.media?.length) return null
                  return (
                    <div className="mt-4 space-y-4">
                      {introActivity.media.map((m, idx) => {
                        const url = activitiesApi.getMediaUrl(introActivity._id, idx)
                        const isVideo = m.mimeType.startsWith('video/')
                        return (
                          <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-900 group w-full hover:shadow-lg transition-shadow">
                            {isVideo ? (
                              <video src={url} className="w-full h-auto max-h-96 object-contain" />
                            ) : (
                              <img src={url} alt={m.fileName} className="w-full h-auto max-h-96 object-contain" />
                            )}
                            {isVideo && (
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center pointer-events-none">
                                <svg className="w-16 h-16 text-white opacity-70 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            )}
                            <button
                              onClick={async () => {
                                if (!window.confirm('Xóa media này?')) return
                                try {
                                  const res = await activitiesApi.update(introActivity._id, {}, [], [idx])
                                  setActivities(prev => prev.map(a => a._id === introActivity._id ? res.data.data : a))
                                } catch (err: any) {
                                  alert('Xóa thất bại: ' + (err.response?.data?.error?.message || err.message))
                                }
                              }}
                              className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </div>
            <button
              onClick={() => setEditingIntroduction(true)}
              className="flex-shrink-0 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 transition-colors"
              title="Chỉnh sửa phần giới thiệu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
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
            onClick={() => {
              setEditingActivity(null)
              setShowModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
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
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                          {activity.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${getCategoryColor(
                              activity.category
                            )}`}
                          >
                            {getCategoryLabel(activity.category)}
                          </span>
                          {activity.createdAt && (
                            <span className="text-xs text-gray-400 dark:text-slate-500">
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

                    {/* Admin actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingActivity(activity)
                          setShowModal(true)
                        }}
                        className="p-1.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(activity._id)}
                        className="p-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-slate-400 mt-3 leading-relaxed">
                    {activity.description}
                  </p>

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
                  <div
                    className={`px-5 pb-5 ${
                      activity.media.length === 1 ? 'flex justify-center' : 'grid gap-3'
                    } ${
                      activity.media.length === 1
                        ? ''
                        : activity.media.length === 2
                        ? 'grid-cols-1 sm:grid-cols-2'
                        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    }`}
                  >
                    {activity.media.map((m: MediaItem, idx: number) => {
                      const mediaUrl = activitiesApi.getMediaUrl(activity._id, idx)
                      const isVideo = m.mimeType.startsWith('video/')
                      const allMedia = activity.media.map((media: MediaItem, i: number) => ({
                        type: (media.mimeType.startsWith('video/') ? 'video' : 'image') as 'image' | 'video',
                        url: activitiesApi.getMediaUrl(activity._id, i),
                      }))

                      return isVideo ? (
                        <div
                          key={m._id || idx}
                          className={`relative group overflow-hidden rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 aspect-video ${
                            activity.media.length === 1 ? 'max-w-2xl w-full' : ''
                          }`}
                        >
                          <video
                            src={mediaUrl}
                            controls
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                            onClick={() => setMediaModal({ type: 'video', url: mediaUrl, allMedia, currentIndex: idx })}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                            <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={m._id || idx}
                          className={`relative group overflow-hidden rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 aspect-video ${
                            activity.media.length === 1 ? 'max-w-2xl w-full' : ''
                          }`}
                        >
                          <img
                            src={mediaUrl}
                            alt={m.fileName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                            onClick={() => setMediaModal({ type: 'image', url: mediaUrl, allMedia, currentIndex: idx })}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                            <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
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

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 dark:text-slate-500">
              <span className="text-4xl block mb-2">📭</span>
              <p className="text-sm">
                Chưa có bài đăng nào{filterCategory !== 'all' ? ' trong danh mục này' : ''}
              </p>
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
                <div
                  key={activity._id}
                  className="relative bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-200 dark:border-slate-700 opacity-60"
                >
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button
                      onClick={() => {
                        setEditingActivity(activity)
                        setShowModal(true)
                      }}
                      className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"
                      title="Sửa"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(activity._id)}
                      className="p-1.5 bg-red-100 text-red-600 rounded-lg"
                      title="Xóa"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-start gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 dark:text-slate-400">
                        {activity.title}
                      </h4>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 line-clamp-2">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Lightbox xem media */}
      {mediaModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 transition-opacity"
          onClick={() => setMediaModal(null)}
        >
          <div
            className="relative max-w-5xl w-full flex flex-col items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute -top-12 right-0 md:-right-12 text-white/70 hover:text-white text-4xl font-light hover:scale-110 transition-all"
              onClick={() => setMediaModal(null)}
            >
              ×
            </button>

            <div className="w-full">
              {mediaModal.type === 'image' ? (
                <img
                  src={mediaModal.url}
                  alt="Preview"
                  className="max-w-full max-h-[75vh] rounded-xl shadow-2xl object-contain mx-auto"
                />
              ) : (
                <video
                  src={mediaModal.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[75vh] rounded-xl shadow-2xl bg-black mx-auto"
                />
              )}
            </div>

            {mediaModal.allMedia.length > 1 && (
              <>
                <div className="mt-6 flex items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      const newIndex =
                        mediaModal.currentIndex === 0
                          ? mediaModal.allMedia.length - 1
                          : mediaModal.currentIndex - 1
                      const newMedia = mediaModal.allMedia[newIndex]
                      setMediaModal({
                        ...mediaModal,
                        currentIndex: newIndex,
                        type: newMedia.type,
                        url: newMedia.url,
                      })
                    }}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm border border-white/20"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                    <span className="text-white text-sm font-medium">{mediaModal.currentIndex + 1}</span>
                    <span className="text-white/50">/</span>
                    <span className="text-white/70 text-sm">{mediaModal.allMedia.length}</span>
                  </div>

                  <button
                    onClick={() => {
                      const newIndex = (mediaModal.currentIndex + 1) % mediaModal.allMedia.length
                      const newMedia = mediaModal.allMedia[newIndex]
                      setMediaModal({
                        ...mediaModal,
                        currentIndex: newIndex,
                        type: newMedia.type,
                        url: newMedia.url,
                      })
                    }}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm border border-white/20"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="mt-6 flex gap-2 justify-center flex-wrap max-w-2xl">
                  {mediaModal.allMedia.map((media, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        setMediaModal({
                          ...mediaModal,
                          currentIndex: idx,
                          type: media.type,
                          url: media.url,
                        })
                      }
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === mediaModal.currentIndex
                          ? 'border-white scale-110'
                          : 'border-white/30 hover:border-white/60 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {media.type === 'video' ? (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white text-xl">
                          🎬
                        </div>
                      ) : (
                        <img
                          src={media.url}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12 md:py-16 rounded-t-3xl mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* About */}
            <div>
              <h3 className="text-lg font-bold mb-4">Trung tâm GDQP-AN</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Đơn vị chuyên trách giáo dục quốc phòng và an ninh cho sinh viên các trường đại học, cao đẳng trên địa bàn tỉnh Trà Vinh.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-bold mb-4">Liên kết nhanh</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Trang chủ</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Về chúng tôi</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Hoạt động</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Liên hệ</a></li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-lg font-bold mb-4">Danh mục</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Giáo dục</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Huấn luyện</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Thể thao</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Tin tức</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-bold mb-4">Liên hệ</h3>
              <ul className="space-y-2 text-sm text-gray-400">
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

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-gray-400 text-sm">
                © 2025 Trung tâm Giáo dục Quốc phòng và An ninh. Tất cả quyền được bảo lưu.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7s1.1 5.2-5.2 8.3A15.7 15.7 0 010 22"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal chỉnh sửa giới thiệu */}
      {editingIntroduction && (
        <IntroductionModal
          data={introductionData}
          onClose={() => setEditingIntroduction(false)}
          onSave={(newData) => {
            setIntroductionData(newData)
            setEditingIntroduction(false)
          }}
        />
      )}

      {/* Modal thêm/sửa activity */}
      {showModal && (
        <ActivityModal
          activity={editingActivity}
          onClose={() => {
            setShowModal(false)
            setEditingActivity(null)
          }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

/* ──────────────────────────────────────────
   Introduction Edit Modal
────────────────────────────────────────── */

function IntroductionModal({
  data,
  onClose,
  onSave,
}: {
  data: {
    title: string
    description: string
    content: string
    stats: Array<{ label: string; value: string }>
  }
  onClose: () => void
  onSave: (data: any) => void
}) {
  const [title, setTitle] = useState(data.title)
  const [description, setDescription] = useState(data.description)
  const [content, setContent] = useState(data.content)
  const [stats, setStats] = useState(data.stats)

  const handleStatChange = (idx: number, field: 'label' | 'value', value: string) => {
    const newStats = [...stats]
    newStats[idx] = { ...newStats[idx], [field]: value }
    setStats(newStats)
  }

  const handleSubmit = () => {
    onSave({ title, description, content, stats })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 border border-gray-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            Chỉnh sửa phần giới thiệu
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Tiêu đề
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Mô tả ngắn
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Nội dung chi tiết
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
          </div>

          {/* Stats */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-2">
              Thống kê
            </label>
            <div className="space-y-3">
              {stats.map((stat, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    value={stat.value}
                    onChange={e => handleStatChange(idx, 'value', e.target.value)}
                    placeholder="Giá trị (VD: 100%)"
                    className="w-24 px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                  <input
                    value={stat.label}
                    onChange={e => handleStatChange(idx, 'label', e.target.value)}
                    placeholder="Nhãn"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────
   Activity Add/Edit Modal
────────────────────────────────────────── */

function ActivityModal({
  activity,
  onClose,
  onSave,
}: {
  activity: Activity | null
  onClose: () => void
  onSave: (data: Partial<Activity>, files?: File[], removeMedia?: number[]) => void
}) {
  const [title, setTitle] = useState(activity?.title || '')
  const [content, setContent] = useState(activity?.content || '')
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
      { title: title.trim(), content: content.trim(), category, order, isActive },
      newFiles.length > 0 ? newFiles : undefined,
      removeIndices.length > 0 ? removeIndices : undefined
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 border border-gray-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            {activity ? 'Sửa bài đăng' : 'Đăng bài mới'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Tiêu đề *
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="VD: Đào tạo GDQP-AN"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Nội dung chi tiết
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
              placeholder="Nội dung bài viết đầy đủ..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
          </div>

          {/* Category + Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Danh mục
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 outline-none"
              >
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Thứ tự
              </label>
              <input
                type="number"
                value={order}
                onChange={e => setOrder(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 outline-none"
              />
            </div>
          </div>

          {/* Media */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              Hình ảnh / Video
            </label>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-4 cursor-pointer hover:border-primary-400 transition-colors">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm text-gray-500 dark:text-slate-400">Chọn hình ảnh hoặc video</span>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Existing media */}
            {existingMedia.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
                  Media hiện có:
                </p>
                <div className="flex flex-wrap gap-2">
                  {existingMedia.map((m: MediaItem, idx: number) => (
                    <div
                      key={m._id || idx}
                      className={`relative w-20 h-20 rounded-lg border-2 overflow-hidden group transition-all ${
                        removeIndices.includes(idx)
                          ? 'border-red-500 opacity-40'
                          : 'border-gray-200 dark:border-slate-600'
                      }`}
                    >
                      {m.mimeType.startsWith('video/') ? (
                        <div className="w-full h-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-xl">
                          🎬
                        </div>
                      ) : (
                        <img
                          src={activitiesApi.getMediaUrl(activity!._id, idx)}
                          alt={m.fileName}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleRemoveExisting(idx)
                        }}
                        className="absolute top-0.5 right-0.5 z-10 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        title={removeIndices.includes(idx) ? 'Hủy xóa' : 'Xóa'}
                      >
                        ×
                      </button>
                      {removeIndices.includes(idx) && (
                        <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center pointer-events-none">
                          <svg
                            className="w-6 h-6 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New previews */}
            {newFiles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {newFiles.map((f, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 h-20 rounded-lg border-2 border-primary-300 overflow-hidden group"
                  >
                    {f.type.startsWith('video/') ? (
                      <div className="w-full h-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-xl">
                        🎬
                      </div>
                    ) : (
                      <img
                        src={previewUrls[idx]}
                        alt={f.name}
                        className="w-full h-full object-cover"
                      />
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

          {/* Active */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-primary-600"
            />
            <span className="text-sm text-gray-700 dark:text-slate-300">Hiển thị bài đăng</span>
          </label>
        </div>

        <div className="border-t border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
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