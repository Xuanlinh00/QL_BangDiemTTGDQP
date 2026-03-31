import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useState, useEffect, useRef } from 'react'
import api from '../services/api'

interface Metrics {
  total_documents: number
  total_pages: number
  documents_completed_percent: number
  documents_pending: number
  documents_error: number
  decisions_count: number
  alerts: string[]
}

const DocumentsIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
const DecisionsIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const PagesIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
const ProgressIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
const AlertIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M7.08 6.47a9 9 0 1 1 9.84 0" /></svg>

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
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return { count, ref }
}

function StatCard({ label, value, suffix, icon, color, delay }: {
  label: string; value: number; suffix?: string; icon: React.ReactNode; color: string; delay: number
}) {
  const { count, ref } = useAnimatedCount(value)
  return (
    <div
      ref={ref}
      className={`bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {count.toLocaleString()}{suffix}
          </p>
        </div>
        <div className={`${color} p-3 rounded-lg text-white`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await api.get('/dashboard/metrics')
        setMetrics(res.data.data)
      } catch (e) {
        console.error('Failed to load metrics:', e)
      } finally {
        setLoading(false)
      }
    }
    loadMetrics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bảng điều khiển</h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Xin chào, {user?.name || 'Quản lý'}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng tài liệu"
          value={metrics?.total_documents || 0}
          icon={<DocumentsIcon className="w-6 h-6" />}
          color="bg-primary-500"
          delay={0}
        />
        <StatCard
          label="Tổng trang"
          value={metrics?.total_pages || 0}
          icon={<PagesIcon className="w-6 h-6" />}
          color="bg-accent-500"
          delay={100}
        />
        <StatCard
          label="Hoàn thành"
          value={metrics?.documents_completed_percent || 0}
          suffix="%"
          icon={<ProgressIcon className="w-6 h-6" />}
          color="bg-success-500"
          delay={200}
        />
        <StatCard
          label="Quyết định"
          value={metrics?.decisions_count || 0}
          icon={<DecisionsIcon className="w-6 h-6" />}
          color="bg-warning-500"
          delay={300}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Thao tác nhanh</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/documents')}
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
                <DocumentsIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Tài liệu</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Quản lý tài liệu</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/decisions')}
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900/30 rounded-lg flex items-center justify-center text-accent-600 dark:text-accent-400">
                <DecisionsIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Quyết định</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Quản lý quyết định</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/data')}
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center text-success-600 dark:text-success-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Dữ liệu</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Sinh viên & Điểm</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center text-warning-600 dark:text-warning-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Cài đặt</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Cấu hình hệ thống</p>
              </div>
            </button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Trạng thái</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-slate-400">Đang xử lý</span>
              <span className="text-lg font-bold text-warning-600 dark:text-warning-400">{metrics?.documents_pending || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-slate-400">Lỗi</span>
              <span className="text-lg font-bold text-danger-600 dark:text-danger-400">{metrics?.documents_error || 0}</span>
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Tiến độ xử lý</p>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-success-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${metrics?.documents_completed_percent || 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">{metrics?.documents_completed_percent || 0}% hoàn tất</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {metrics?.alerts && metrics.alerts.length > 0 && (
        <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertIcon className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-warning-900 dark:text-warning-200">Cảnh báo</h3>
              <ul className="mt-2 space-y-1">
                {metrics.alerts.map((alert, i) => (
                  <li key={i} className="text-sm text-warning-800 dark:text-warning-300">{alert}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
