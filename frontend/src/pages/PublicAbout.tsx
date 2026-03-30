import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { activitiesApi } from '../services/api'

/* ─── Scrollbar hide ─── */
const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Source+Sans+3:wght@400;500;600;700&display=swap');

  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .anim-fade-up  { animation: fadeUp  0.6s ease both; }
  .anim-slide-in { animation: slideIn 0.5s ease both; }

  .card-hover {
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .card-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0,0,0,.12);
  }

  .page-font-body   { font-family: 'Source Sans 3', sans-serif; }
  .page-font-heading{ font-family: 'Merriweather', serif; }
`

/* ─── Types ─── */
interface MediaItem { _id: string; fileName: string; mimeType: string }
interface Activity {
  _id: string; title: string; description: string; content: string
  icon: string; category: string; order: number; isActive: boolean
  media: MediaItem[]; createdAt?: string
}

/* ─── Data ─── */
const CATEGORY_OPTIONS = [
  { value: 'education',      label: 'Giáo dục' },
  { value: 'training',       label: 'Huấn luyện' },
  { value: 'sports',         label: 'Thể thao' },
  { value: 'research',       label: 'Nghiên cứu' },
  { value: 'extracurricular',label: 'Ngoại khóa' },
  { value: 'management',     label: 'Quản lý' },
  { value: 'cooperation',    label: 'Hợp tác' },
  { value: 'development',    label: 'Phát triển' },
  { value: 'news',           label: 'Tin tức' },
  { value: 'general',        label: 'Chung' },
]

const STATS = [
  { value: '2008', label: 'Năm thành lập', icon: '🏛️' },
  { value: '15+',  label: 'Năm hoạt động', icon: '📅' },
  { value: '5000+',label: 'Sinh viên đào tạo', icon: '🎓' },
  { value: '100%', label: 'Hoàn thành nhiệm vụ', icon: '✅' },
]

function getCategoryLabel(val: string) {
  return CATEGORY_OPTIONS.find(c => c.value === val)?.label || val
}

function getCategoryColor(cat: string) {
  const map: Record<string, string> = {
    education:       'bg-blue-100 text-blue-700 border border-blue-200',
    training:        'bg-orange-100 text-orange-700 border border-orange-200',
    sports:          'bg-green-100 text-green-700 border border-green-200',
    research:        'bg-purple-100 text-purple-700 border border-purple-200',
    extracurricular: 'bg-teal-100 text-teal-700 border border-teal-200',
    management:      'bg-indigo-100 text-indigo-700 border border-indigo-200',
    cooperation:     'bg-cyan-100 text-cyan-700 border border-cyan-200',
    development:     'bg-amber-100 text-amber-700 border border-amber-200',
    news:            'bg-rose-100 text-rose-700 border border-rose-200',
  }
  return map[cat] || 'bg-gray-100 text-gray-700 border border-gray-200'
}

/* ══════════════════════════════════════════════ */
export default function PublicAbout() {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [activities,       setActivities]       = useState<Activity[]>([])
  const [filterCategory,   setFilterCategory]   = useState('all')
  const [bannerSlides,     setBannerSlides]     = useState<Array<{ id: string; image: string | null }>>([
    { id: '1', image: null }, { id: '2', image: null }, { id: '3', image: null },
  ])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [mediaModal,   setMediaModal]   = useState<{
    type: 'image' | 'video'
    url: string
    allMedia: Array<{ type: 'image' | 'video'; url: string }>
    currentIndex: number
  } | null>(null)

  /* ── Load ── */
  const load = useCallback(async () => {
    try {
      const res = await activitiesApi.list()
      const data: Activity[] = res.data.data || []
      setActivities(data)
      const banner = data.find(a => a.category === 'banner')
      if (banner?.media.length) {
        setBannerSlides(banner.media.map((_m, i) => ({
          id: String(i + 1),
          image: activitiesApi.getMediaUrl(banner._id, i),
        })))
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => { load() }, [load])

  /* ── Auto-rotate banner ── */
  useEffect(() => {
    if (bannerSlides.length <= 1) return
    const t = setInterval(() => setCurrentSlide(p => (p + 1) % bannerSlides.length), 5500)
    return () => clearInterval(t)
  }, [bannerSlides.length])

  /* ── Derived ── */
  const activeActivities = activities.filter(a => a.isActive && a.category !== 'banner' && a.category !== 'introduction')
  const introActivity    = activities.find(a => a.category === 'introduction')
  const usedCategories   = [...new Set(activeActivities.map(a => a.category))]
  const filtered = filterCategory === 'all' ? activeActivities : activeActivities.filter(a => a.category === filterCategory)

  /* ── Scroll helpers ── */
  const scrollCards = (dir: -1 | 1) => {
    if (scrollRef.current) scrollRef.current.scrollLeft += dir * 380
  }

  /* ══ RENDER ══ */
  return (
    <div className="page-font-body bg-gray-50 dark:bg-slate-900 min-h-screen">
      <style>{globalStyle}</style>

      {/* ━━━ 1. HERO BANNER ━━━ */}
      <section className="relative">
        <div className="relative h-[60vh] min-h-[420px] max-h-[640px] overflow-hidden">
          {bannerSlides.map((slide, idx) => (
            <div key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            >
              {slide.image
                ? <img src={slide.image} alt={`Banner ${idx + 1}`} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950" />
              }
            </div>
          ))}

          {/* Dark overlay with gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-slate-900/20" />

          {/* Text content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 md:px-12">
            {/* Badge */}
            <div className="mb-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white/90 text-sm font-medium tracking-wide anim-fade-up">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Đại học Trà Vinh — Trực thuộc UBND tỉnh Trà Vinh
            </div>

            <h1 className="page-font-heading text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-4 anim-fade-up"
              style={{ animationDelay: '80ms', textShadow: '0 2px 16px rgba(0,0,0,.5)' }}>
              Trung tâm Giáo dục<br />
              <span className="text-amber-300">Quốc phòng & An ninh</span>
            </h1>

            <p className="text-white/80 text-base md:text-lg max-w-2xl anim-fade-up" style={{ animationDelay: '160ms' }}>
              Đào tạo, bồi dưỡng kiến thức quốc phòng – an ninh cho sinh viên các trường trên địa bàn tỉnh Trà Vinh
            </p>
          </div>

          {/* Arrows */}
          {bannerSlides.length > 1 && (<>
            <button onClick={() => setCurrentSlide(p => (p - 1 + bannerSlides.length) % bannerSlides.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button onClick={() => setCurrentSlide(p => (p + 1) % bannerSlides.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>)}

          {/* Dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {bannerSlides.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)}
                className={`rounded-full transition-all ${i === currentSlide ? 'w-6 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80'}`} />
            ))}
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="relative z-10 -mt-10 mx-4 md:mx-auto md:max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-200 dark:bg-slate-700 rounded-2xl overflow-hidden shadow-2xl">
            {STATS.map((s, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 px-6 py-5 flex flex-col items-center text-center">
                <span className="text-2xl mb-1">{s.icon}</span>
                <span className="page-font-heading text-2xl font-black text-slate-800 dark:text-white">{s.value}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main content wrapper */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16 pb-0">

        {/* ━━━ 2. GIỚI THIỆU ━━━ */}
        <section className="grid md:grid-cols-2 gap-10 items-start">
          {/* Text */}
          <div>
            {/* Section label */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-1 bg-amber-500 rounded-full" />
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                Giới thiệu
              </span>
            </div>

            <h2 className="page-font-heading text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-6 leading-snug">
              Về Trung tâm Giáo dục<br />Quốc phòng và An ninh
            </h2>

            <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                Trung tâm Giáo dục Quốc phòng và An ninh (<strong className="text-slate-800 dark:text-white">GDQP-AN</strong>) Đại học Trà Vinh là đơn vị chuyên trách trong công tác giáo dục quốc phòng, an ninh cho sinh viên các trường đại học, cao đẳng trên địa bàn tỉnh Trà Vinh.
              </p>
              <p>
                Thành lập năm <strong className="text-slate-800 dark:text-white">2008</strong>, trung tâm đổi tên theo Quyết định số 1830/QĐ-UBND ngày 03/10/2017 của UBND tỉnh Trà Vinh. Từ khi thành lập đến nay, Trung tâm luôn hoàn thành xuất sắc nhiệm vụ được giao.
              </p>
            </div>

            {/* Key features */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: '🎯', title: 'Sứ mệnh', desc: 'Đào tạo kiến thức quốc phòng toàn diện' },
                { icon: '🏆', title: 'Chất lượng', desc: 'Đạt chuẩn Bộ Giáo dục và Đào tạo' },
                { icon: '🤝', title: 'Hợp tác', desc: 'Liên kết nhiều trường trong tỉnh' },
                { icon: '📚', title: 'Chương trình', desc: 'Nội dung phong phú, thực tiễn' },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                  <span className="text-xl flex-shrink-0 mt-0.5">{f.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{f.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Media / Image side */}
          <div className="space-y-4">
            {introActivity?.media?.length ? (
              introActivity.media.slice(0, 3).map((m, idx) => {
                const url = activitiesApi.getMediaUrl(introActivity._id, idx)
                const isVideo = m.mimeType.startsWith('video/')
                const allMedia = introActivity.media.map((med, i) => ({
                  type: med.mimeType.startsWith('video/') ? 'video' : 'image' as 'image' | 'video',
                  url: activitiesApi.getMediaUrl(introActivity._id, i),
                }))
                return (
                  <div key={idx}
                    className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-md group cursor-pointer card-hover"
                    onClick={() => !isVideo && setMediaModal({ type: 'image', url, allMedia, currentIndex: idx })}
                  >
                    {isVideo
                      ? <video src={url} className="w-full h-64 object-cover" controls controlsList="nodownload" />
                      : <img src={url} alt={m.fileName} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
                    }
                    {!isVideo && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition scale-75 group-hover:scale-100">
                          <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              /* Placeholder card when no media */
              <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-red-700 to-red-900 shadow-xl aspect-[4/3] flex flex-col items-center justify-center text-white gap-4 p-8">
                <div className="text-7xl">🏫</div>
                <p className="page-font-heading text-xl font-bold text-center leading-snug">
                  Trung tâm GDQP-AN<br />Đại học Trà Vinh
                </p>
                <p className="text-white/70 text-sm text-center">Thành lập 2008 · Trà Vinh, Việt Nam</p>
              </div>
            )}
          </div>
        </section>

        {/* ━━━ 3. HOẠT ĐỘNG & TIN TỨC ━━━ */}
        <section>
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-1 bg-teal-500 rounded-full" />
                <span className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">Bản tin</span>
              </div>
              <h2 className="page-font-heading text-2xl md:text-3xl font-black text-slate-800 dark:text-white">
                Hoạt động & Tin tức
              </h2>
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-4 py-1.5 rounded-full self-start sm:self-auto">
              {activeActivities.length} bài đăng
            </span>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {['all', ...usedCategories].map(cat => (
              <button key={cat} onClick={() => setFilterCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  filterCategory === cat
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-200 dark:shadow-teal-900'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:border-teal-400 hover:text-teal-600'
                }`}>
                {cat === 'all' ? 'Tất cả' : getCategoryLabel(cat)}
              </button>
            ))}
          </div>

          {/* Cards */}
          {filtered.length > 0 ? (
            <div className="relative">
              {/* Scroll container */}
              <div ref={scrollRef} className="overflow-x-auto scrollbar-hide pb-4 -mx-1 px-1">
                <div className="flex gap-5 min-w-min">
                  {filtered.map((activity, i) => {
                    const hasMedia = activity.media?.length > 0
                    const firstMedia = activity.media?.[0]
                    const mediaUrl = hasMedia ? activitiesApi.getMediaUrl(activity._id, 0) : null
                    const isVideo = firstMedia?.mimeType.startsWith('video/')

                    return (
                      <article key={activity._id}
                        className="flex-shrink-0 w-72 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden card-hover cursor-pointer flex flex-col anim-fade-up"
                        style={{ animationDelay: `${i * 60}ms` }}
                        onClick={() => navigate(`/gioi-thieu/hoat-dong/${activity._id}`)}
                      >
                        {/* Thumbnail */}
                        <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 overflow-hidden flex-shrink-0">
                          {mediaUrl ? (
                            isVideo
                              ? <video src={mediaUrl} className="w-full h-full object-cover" muted loop playsInline />
                              : <img src={mediaUrl} alt={firstMedia?.fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl opacity-40">📄</div>
                          )}

                          {/* Category chip on image */}
                          <div className="absolute top-3 left-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${getCategoryColor(activity.category)}`}>
                              {getCategoryLabel(activity.category)}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-snug line-clamp-2 mb-2 flex-1">
                            {activity.title}
                          </h3>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                            {activity.createdAt && (
                              <span className="text-xs text-slate-400">
                                {new Date(activity.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </span>
                            )}
                            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                              Xem thêm
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>

              {/* Scroll arrows */}
              {filtered.length > 3 && (<>
                <button onClick={() => scrollCards(-1)}
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10 w-10 h-10 rounded-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 shadow-md items-center justify-center text-slate-600 dark:text-white hover:bg-teal-600 hover:text-white hover:border-teal-600 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button onClick={() => scrollCards(1)}
                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10 w-10 h-10 rounded-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 shadow-md items-center justify-center text-slate-600 dark:text-white hover:bg-teal-600 hover:text-white hover:border-teal-600 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>)}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-base">
                Chưa có bài đăng{filterCategory !== 'all' ? ` trong danh mục "${getCategoryLabel(filterCategory)}"` : ''}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ━━━ 4. FOOTER ━━━ */}
      <footer className="mt-20 bg-slate-800 dark:bg-slate-950 text-white">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-red-600 via-amber-500 to-teal-500" />

        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-sm">TT</div>
                <div>
                  <p className="font-bold leading-tight">Trung tâm GDQP-AN</p>
                  <p className="text-slate-400 text-xs">Đại học Trà Vinh</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Đơn vị chuyên trách giáo dục quốc phòng và an ninh cho sinh viên các trường trên địa bàn tỉnh Trà Vinh, trực thuộc Đại học Trà Vinh.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Điều hướng</h4>
              <ul className="space-y-2.5 text-sm">
                {[['/', 'Trang chủ'], ['/about', 'Giới thiệu'], ['/about', 'Hoạt động'], ['#', 'Liên hệ']].map(([href, label]) => (
                  <li key={label}><a href={href} className="text-slate-300 hover:text-white transition-colors">{label}</a></li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Liên hệ</h4>
              <ul className="space-y-3 text-sm text-slate-300">
                {[
                  { icon: '✉️', text: 'info@tvu.edu.vn' },
                  { icon: '📞', text: '(0292) 3.848.888' },
                  { icon: '📍', text: 'Trà Vinh, Việt Nam' },
                ].map((c, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <span>{c.icon}</span>
                    <span>{c.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>© 2025 Trung tâm Giáo dục Quốc phòng và An ninh. Tất cả quyền được bảo lưu.</p>
            <p>Đại học Trà Vinh · Trà Vinh, Việt Nam</p>
          </div>
        </div>
      </footer>

      {/* ━━━ Lightbox ━━━ */}
      {mediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
          onClick={() => setMediaModal(null)}>
          <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <button className="absolute -top-10 right-0 p-2 text-white/70 hover:text-white text-2xl transition"
              onClick={() => setMediaModal(null)}>✕</button>

            {mediaModal.type === 'image'
              ? <img src={mediaModal.url} alt="Preview" className="max-h-[85vh] w-full object-contain rounded-xl shadow-2xl" />
              : <video src={mediaModal.url} controls autoPlay className="max-h-[85vh] w-full rounded-xl shadow-2xl bg-black" />
            }

            {mediaModal.allMedia.length > 1 && (
              <div className="mt-5 flex items-center justify-center gap-4">
                <button onClick={() => {
                  const i = (mediaModal.currentIndex - 1 + mediaModal.allMedia.length) % mediaModal.allMedia.length
                  const m = mediaModal.allMedia[i]
                  setMediaModal({ ...mediaModal, currentIndex: i, type: m.type, url: m.url })
                }} className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="px-5 py-2 bg-white/10 rounded-full text-white text-sm">
                  {mediaModal.currentIndex + 1} / {mediaModal.allMedia.length}
                </span>
                <button onClick={() => {
                  const i = (mediaModal.currentIndex + 1) % mediaModal.allMedia.length
                  const m = mediaModal.allMedia[i]
                  setMediaModal({ ...mediaModal, currentIndex: i, type: m.type, url: m.url })
                }} className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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