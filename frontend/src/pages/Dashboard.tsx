import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useState, useEffect } from 'react'
import api from '../services/api'

interface Metrics {
  total_documents: number
  total_decisions: number
  total_activities: number
  total_certificates: number
  recent_documents: Array<{ _id: string; name: string; uploaded_at: string; type: string }>
  recent_activities: Array<{ _id: string; title: string; date: string; category: string }>
}

const DocumentsIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
const DecisionsIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const ActivitiesIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
const CertificatesIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
const ClockIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const TrendUpIcon = ({ className }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>

function StatCard({ label, value, icon, color, gradient, onClick }: {
  label: string
  value: number
  icon: React.ReactNode
  color: string
  gradient: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden text-left w-full"
    >
      <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`${color} p-3 rounded-xl shadow-lg`}>
            {icon}
          </div>
          <TrendUpIcon className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            {value.toLocaleString()}
          </p>
        </div>
      </div>
    </button>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    async function loadMetrics() {
      try {
        const [docsRes, decisionsRes, activitiesRes] = await Promise.all([
          api.get('/docstore'),
          api.get('/decisions'),
          api.get('/activities'),
        ])
        
        const docs = docsRes.data.data || []
        const decisions = decisionsRes.data.data || []
        const activities = activitiesRes.data.data || []
        
        setMetrics({
          total_documents: docs.length,
          total_decisions: decisions.length,
          total_activities: activities.length,
          total_certificates: 0,
          recent_documents: docs.slice(0, 5),
          recent_activities: activities.slice(0, 5),
        })
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
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  const timeString = currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const dateString = currentTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-6" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Header with gradient */}
      <div className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
        
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
                TVU GDQP-AN
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Xin chào, {user?.name || 'Quản lý'} 👋
            </h1>
            <p className="text-white/80 text-sm">{dateString}</p>
          </div>
          
          <div className="hidden md:flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl">
              <ClockIcon className="w-5 h-5 text-white" />
              <span className="text-2xl font-bold text-white tabular-nums">{timeString}</span>
            </div>
            <p className="text-white/70 text-xs">Hệ thống hoạt động bình thường</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Bảng điểm"
          value={metrics?.total_documents || 0}
          icon={<DocumentsIcon className="w-6 h-6 text-white" />}
          color="bg-gradient-to-br from-indigo-500 to-indigo-600"
          gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
          onClick={() => navigate('/documents')}
        />
        <StatCard
          label="Quyết định"
          value={metrics?.total_decisions || 0}
          icon={<DecisionsIcon className="w-6 h-6 text-white" />}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          gradient="bg-gradient-to-br from-purple-500 to-purple-600"
          onClick={() => navigate('/decisions')}
        />
        <StatCard
          label="Hoạt động"
          value={metrics?.total_activities || 0}
          icon={<ActivitiesIcon className="w-6 h-6 text-white" />}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          onClick={() => navigate('/activities')}
        />
        <StatCard
          label="Chứng chỉ"
value={metrics?.total_certificates || 0}
          icon={<CertificatesIcon className="w-6 h-6 text-white" />}
          color="bg-gradient-to-br from-amber-500 to-amber-600"
          gradient="bg-gradient-to-br from-amber-500 to-amber-600"
          onClick={() => navigate('/certificates')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Thao tác nhanh</h2>
            <span className="text-xs text-gray-400 dark:text-slate-500">Truy cập nhanh các chức năng</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/documents')}
              className="group relative flex flex-col gap-3 p-5 rounded-xl border-2 border-gray-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all duration-300 text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <DocumentsIcon className="w-6 h-6 text-white" />
                </div>
                <svg className="w-5 h-5 text-gray-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
              <div className="relative">
                <p className="text-base font-bold text-gray-900 dark:text-white mb-1">Bảng điểm</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Quản lý tài liệu điểm</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/decisions')}
              className="group relative flex flex-col gap-3 p-5 rounded-xl border-2 border-gray-100 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-800 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all duration-300 text-left overflow-hidden"
            >
<div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <DecisionsIcon className="w-6 h-6 text-white" />
                </div>
                <svg className="w-5 h-5 text-gray-300 dark:text-slate-600 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
              <div className="relative">
                <p className="text-base font-bold text-gray-900 dark:text-white mb-1">Quyết định</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Quản lý quyết định</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/activities')}
              className="group relative flex flex-col gap-3 p-5 rounded-xl border-2 border-gray-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all duration-300 text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <ActivitiesIcon className="w-6 h-6 text-white" />
                </div>
                <svg className="w-5 h-5 text-gray-300 dark:text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
              <div className="relative">
                <p className="text-base font-bold text-gray-900 dark:text-white mb-1">Hoạt động</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Hoạt động trung tâm</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/certificates')}
className="group relative flex flex-col gap-3 p-5 rounded-xl border-2 border-gray-100 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-800 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all duration-300 text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <CertificatesIcon className="w-6 h-6 text-white" />
                </div>
                <svg className="w-5 h-5 text-gray-300 dark:text-slate-600 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
              <div className="relative">
                <p className="text-base font-bold text-gray-900 dark:text-white mb-1">Chứng chỉ</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Cấp chứng chỉ</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hoạt động gần đây</h2>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
          
          <div className="space-y-3">
            {metrics?.recent_activities && metrics.recent_activities.length > 0 ? (
              metrics.recent_activities.map((activity, idx) => (
                <div key={activity._id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{activity.title}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{activity.date}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
<p className="text-sm text-gray-400 dark:text-slate-500">Chưa có hoạt động nào</p>
              </div>
            )}
          </div>

          {metrics?.recent_activities && metrics.recent_activities.length > 0 && (
            <button
              onClick={() => navigate('/activities')}
              className="w-full mt-4 px-4 py-2 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors"
            >
              Xem tất cả
            </button>
          )}
        </div>
      </div>

      {/* Recent Documents */}
      {metrics?.recent_documents && metrics.recent_documents.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tài liệu mới nhất</h2>
            <button
              onClick={() => navigate('/documents')}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              Xem tất cả →
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {metrics.recent_documents.map((doc) => (
              <div
                key={doc._id}
                onClick={() => navigate('/documents')}
                className="group p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <DocumentsIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">{doc.name}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{doc.uploaded_at}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}