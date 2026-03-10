import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useState, useEffect, useRef } from 'react'
import api from '../services/api'

interface Metrics {
  total_documents: number
  total_pages: number
  ocr_completed_percent: number
  documents_pending: number
  documents_error: number
  decisions_count: number
  alerts: string[]
}

/* ── Animated Counter Hook ── */
function useAnimatedCount(target: number, duration = 1200) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (!ref.current || started.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const animate = (now: number) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(eased * target))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return { count, ref }
}

/* ── Animated Stat Card ── */
function StatCard({ label, value, suffix, icon, color, delay }: {
  label: string; value: number; suffix?: string; icon: React.ReactNode; color: string; delay: number
}) {
  const { count, ref } = useAnimatedCount(value)
  return (
    <div
      ref={ref}
      className={`group relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[4rem] ${color} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${color} text-white mb-3 shadow-lg`}>
        {icon}
      </div>
      <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{label}</p>
    </div>
  )
}

/* ── Hero Slide Data ── */
const heroSlides = [
  {
    title: 'HỆ THỐNG QUẢN LÝ HỒ SƠ GDQP-AN',
    subtitle: 'Trung tâm Giáo dục Quốc phòng - An ninh',
    desc: 'Số hóa toàn diện quy trình quản lý bảng điểm, quyết định và hồ sơ giáo dục quốc phòng với công nghệ OCR tiên tiến',
    gradient: 'from-primary-700 via-primary-600 to-blue-500',
  },
  {
    title: 'CÔNG NGHỆ OCR THÔNG MINH',
    subtitle: 'Nhận dạng & Trích xuất tự động',
    desc: 'Tự động nhận dạng văn bản từ bảng điểm scan, hỗ trợ xử lý hàng loạt với độ chính xác cao',
    gradient: 'from-blue-700 via-indigo-600 to-purple-500',
  },
  {
    title: 'ĐẠI HỌC TRÀ VINH',
    subtitle: '20 Năm Đồng Hành Kiến Tạo Tương Lai',
    desc: 'Mang đến cơ hội học tập chất lượng cho cộng đồng - Devotion, Transparency, Friendliness, Innovation',
    gradient: 'from-accent-700 via-emerald-600 to-teal-500',
  },
]

/* ── Quick Service Links (inspired by TVU grid) ── */
const serviceLinks = [
  { label: 'Tải lên tài liệu', desc: 'Upload PDF / ảnh scan bảng điểm', icon: UploadIcon, path: '/documents', color: 'bg-primary-500', hoverColor: 'hover:bg-primary-600' },
  { label: 'Bảng điểm GDQP', desc: 'Tra cứu & quản lý điểm sinh viên', icon: ScoreIcon, path: '/documents?type=DSGD', color: 'bg-accent-500', hoverColor: 'hover:bg-accent-600' },
  { label: 'Quyết định', desc: 'Quản lý quyết định GDQP-AN', icon: DecisionIcon, path: '/decisions', color: 'bg-blue-500', hoverColor: 'hover:bg-blue-600' },
  { label: 'OCR Xử lý', desc: 'Nhận dạng chữ từ tài liệu scan', icon: OcrIcon, path: '/documents', color: 'bg-indigo-500', hoverColor: 'hover:bg-indigo-600' },
  { label: 'Đại học', desc: 'Hồ sơ hệ Đại học chính quy', icon: UniversityIcon, path: '/documents?system=DH', color: 'bg-purple-500', hoverColor: 'hover:bg-purple-600' },
  { label: 'Cao đẳng', desc: 'Hồ sơ hệ Cao đẳng', icon: CollegeIcon, path: '/documents?system=CD', color: 'bg-pink-500', hoverColor: 'hover:bg-pink-600' },
  { label: 'Liên thông', desc: 'Hồ sơ hệ Liên thông', icon: BridgeIcon, path: '/documents?system=LT', color: 'bg-orange-500', hoverColor: 'hover:bg-orange-600' },
  { label: 'Xuất Excel', desc: 'Xuất dữ liệu & báo cáo tổng hợp', icon: ExcelIcon, path: '/documents', color: 'bg-emerald-500', hoverColor: 'hover:bg-emerald-600' },
  { label: 'Google Drive', desc: 'Kết nối & nhập từ Drive', icon: DriveIcon, path: '/documents', color: 'bg-yellow-500', hoverColor: 'hover:bg-yellow-600' },
  { label: 'Biểu mẫu', desc: 'Các biểu mẫu GDQP-AN', icon: FormIcon, path: '/documents?type=BieuMau', color: 'bg-teal-500', hoverColor: 'hover:bg-teal-600' },
  { label: 'Thống kê', desc: 'Báo cáo & phân tích dữ liệu', icon: ChartIcon, path: '/', color: 'bg-cyan-500', hoverColor: 'hover:bg-cyan-600' },
  { label: 'Hỗ trợ', desc: 'Hướng dẫn sử dụng hệ thống', icon: HelpIcon, path: '/', color: 'bg-rose-500', hoverColor: 'hover:bg-rose-600' },
]

/* ── Recent Activities (sample) ── */
const recentActivities = [
  { action: 'Tải lên bảng điểm', detail: 'GDQP K47 - Đại học - HK1 2025-2026', time: '5 phút trước', type: 'upload' },
  { action: 'OCR hoàn tất', detail: 'Bảng điểm lớp DH47A - 45 sinh viên', time: '12 phút trước', type: 'ocr' },
  { action: 'Tạo quyết định', detail: 'QĐ số 1234/QĐ-TTGDQP', time: '1 giờ trước', type: 'decision' },
  { action: 'Xuất báo cáo', detail: 'Thống kê GDQP HK2 2024-2025', time: '2 giờ trước', type: 'export' },
  { action: 'Đối soát dữ liệu', detail: 'K46 - Cao đẳng - 128 sinh viên', time: '3 giờ trước', type: 'reconcile' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left')

  useEffect(() => {
    api.get('/dashboard/metrics')
      .then(res => { if (res.data?.data) setMetrics(res.data.data) })
      .catch(() => {})
  }, [])

  // Auto-rotate hero slides
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideDirection('left')
      setCurrentSlide(prev => (prev + 1) % heroSlides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const goToSlide = (index: number) => {
    setSlideDirection(index > currentSlide ? 'left' : 'right')
    setCurrentSlide(index)
  }

  const slide = heroSlides[currentSlide]

  return (
    <div className="space-y-8 max-w-7xl mx-auto -mt-2">

      {/* ═══════════ 1. HERO BANNER / SLIDER ═══════════ */}
      <div className={`relative bg-gradient-to-r ${slide.gradient} rounded-3xl overflow-hidden shadow-2xl min-h-[280px] lg:min-h-[340px] transition-all duration-700`}>
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-72 h-72 bg-white/5 rounded-full animate-float-slow" />
          <div className="absolute bottom-0 left-10 w-48 h-48 bg-white/5 rounded-full animate-float-delayed" />
          <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full animate-pulse-slow" />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }} />
          {/* Diagonal stripe accent */}
          <div className="absolute -right-20 top-0 w-80 h-full bg-white/5 transform skew-x-[-12deg]" />
        </div>

        {/* Slide content */}
        <div className="relative z-10 p-8 lg:p-12 flex flex-col justify-center min-h-[280px] lg:min-h-[340px]">
          <div key={currentSlide} className={`animate-slide-in-${slideDirection}`}>
            {/* Top badges */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/20">
                <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-primary-700 font-extrabold text-[10px] shadow">TVU</div>
                <span className="text-white/90 text-xs font-medium">Đại học Trà Vinh</span>
              </div>
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/20">
                <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-accent-700 font-extrabold text-[10px] shadow">QP</div>
                <span className="text-white/90 text-xs font-medium">GDQP-AN</span>
              </div>
            </div>

            <h1 className="text-2xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight max-w-2xl">
              {slide.title}
            </h1>
            <p className="text-lg lg:text-xl text-white/80 font-medium mt-2">
              {slide.subtitle}
            </p>
            <p className="text-sm lg:text-base text-white/60 mt-3 max-w-xl leading-relaxed">
              {slide.desc}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={() => navigate('/documents')}
                className="flex items-center gap-2 bg-white text-primary-700 font-bold rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
              >
                <UploadIcon className="w-4 h-4" />
                Bắt đầu sử dụng
              </button>
              <button
                onClick={() => navigate('/documents?type=DSGD')}
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white rounded-xl px-6 py-3 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm font-medium"
              >
                <ScoreIcon className="w-4 h-4" />
                Tra cứu bảng điểm
              </button>
            </div>
          </div>

          {/* Slide indicators */}
          <div className="flex items-center gap-2 mt-8">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`h-2 rounded-full transition-all duration-500 ${
                  i === currentSlide ? 'w-10 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Slide nav arrows */}
        <button
          onClick={() => { setSlideDirection('right'); setCurrentSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length) }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all border border-white/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button
          onClick={() => { setSlideDirection('left'); setCurrentSlide(prev => (prev + 1) % heroSlides.length) }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all border border-white/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* ═══════════ 2. WELCOME RIBBON ═══════════ */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl px-6 py-4 border border-gray-100 dark:border-slate-700 shadow-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg">
            {user?.name?.charAt(0) || 'C'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Xin chào, {user?.name || 'Cán bộ'}!
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Chúc đồng chí một ngày làm việc hiệu quả
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-400 dark:text-slate-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* ═══════════ 3. QUICK SERVICES GRID (TVU-style) ═══════════ */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1.5 h-8 bg-gradient-to-b from-primary-500 to-accent-500 rounded-full" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dịch vụ nhanh</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {serviceLinks.map((item, i) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`group relative flex items-start gap-4 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 text-left animate-fade-in-up overflow-hidden`}
              style={{ animationDelay: `${150 + i * 50}ms` }}
            >
              {/* Hover gradient overlay */}
              <div className={`absolute inset-0 ${item.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 rounded-2xl`} />
              <div className={`flex-shrink-0 w-11 h-11 ${item.color} rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                  {item.label}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 line-clamp-2">
                  {item.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════ 4. STATS SECTION ═══════════ */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Thống kê tổng quan</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            label="Tổng tài liệu"
            value={metrics?.total_documents ?? 0}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            color="bg-gradient-to-br from-primary-500 to-primary-700"
            delay={200}
          />
          <StatCard
            label="OCR hoàn tất"
            value={metrics?.ocr_completed_percent ?? 0}
            suffix="%"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            color="bg-gradient-to-br from-accent-500 to-accent-700"
            delay={300}
          />
          <StatCard
            label="Đang chờ xử lý"
            value={metrics?.documents_pending ?? 0}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            color="bg-gradient-to-br from-yellow-500 to-orange-600"
            delay={400}
          />
          <StatCard
            label="Quyết định"
            value={metrics?.decisions_count ?? 0}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            color="bg-gradient-to-br from-blue-500 to-indigo-700"
            delay={500}
          />
        </div>
      </div>

      {/* ═══════════ 5. BOTTOM SECTION: Activity + Alerts + Quick Info ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Hoạt động gần đây
            </h3>
            <button className="text-xs text-primary-500 hover:text-primary-600 font-medium">Xem tất cả</button>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {recentActivities.map((activity, i) => (
              <div key={i} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50/50 dark:hover:bg-slate-750 transition-colors">
                <div className={`flex-shrink-0 mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center text-white shadow ${
                  activity.type === 'upload' ? 'bg-primary-500' :
                  activity.type === 'ocr' ? 'bg-accent-500' :
                  activity.type === 'decision' ? 'bg-blue-500' :
                  activity.type === 'export' ? 'bg-emerald-500' :
                  'bg-purple-500'
                }`}>
                  {activity.type === 'upload' && <UploadIcon className="w-4 h-4" />}
                  {activity.type === 'ocr' && <OcrIcon className="w-4 h-4" />}
                  {activity.type === 'decision' && <DecisionIcon className="w-4 h-4" />}
                  {activity.type === 'export' && <ExcelIcon className="w-4 h-4" />}
                  {activity.type === 'reconcile' && <ChartIcon className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{activity.action}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">{activity.detail}</p>
                </div>
                <span className="text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Alerts + System Info */}
        <div className="space-y-6">
          {/* Alerts */}
          {metrics && metrics.alerts.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: '700ms' }}>
              <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                Cảnh báo hệ thống
              </h3>
              <ul className="space-y-2">
                {metrics.alerts.map((alert, i) => (
                  <li key={i} className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                    {alert}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* System Info Card */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-lg animate-fade-in-up" style={{ animationDelay: '800ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="font-bold">Thông tin hệ thống</h3>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-primary-200">Phiên bản</span>
                <span className="font-semibold bg-white/15 rounded-lg px-2.5 py-0.5 text-xs">v2.0.0</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-primary-200">OCR Engine</span>
                <span className="font-semibold">Tesseract 7</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-primary-200">Trạng thái</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="font-semibold text-green-300">Hoạt động</span>
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-primary-200">Tổng trang</span>
                <span className="font-semibold">{(metrics?.total_pages ?? 0).toLocaleString()}</span>
              </li>
            </ul>
          </div>

          {/* Quick Help */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm animate-fade-in-up" style={{ animationDelay: '900ms' }}>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Bắt đầu nhanh
            </h3>
            <ul className="space-y-2">
              {[
                'Upload file bảng điểm PDF hoặc ảnh scan',
                'Hệ thống tự động OCR nhận dạng dữ liệu',
                'Kiểm tra và chỉnh sửa kết quả trích xuất',
                'Xuất dữ liệu ra file Excel hoàn chỉnh',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-slate-400">
                  <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ═══════════ 6. FOOTER RIBBON ═══════════ */}
      <div className="text-center py-6 border-t border-gray-100 dark:border-slate-800">
        <p className="text-xs text-gray-400 dark:text-slate-500">
          Copyright © 2026 Bản quyền thuộc về Trung tâm Giáo dục Quốc phòng - An ninh Đại học Trà Vinh
        </p>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   SVG ICONS
   ══════════════════════════════════════════════════════════════ */

function UploadIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
}
function ScoreIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
}
function DecisionIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}
function OcrIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
}
function UniversityIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
}
function CollegeIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
}
function BridgeIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
}
function ExcelIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
}
function DriveIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
}
function FormIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
}
function ChartIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
}
function HelpIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
}
