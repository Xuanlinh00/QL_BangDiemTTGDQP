import { useMemo } from 'react'
import { DashboardMetrics } from '../types'

// Compute metrics entirely from localStorage — no backend required
function useLocalMetrics(): DashboardMetrics {
  return useMemo(() => {
    let docs: any[] = []
    let students: any[] = []
    try { docs = JSON.parse(localStorage.getItem('tvu_documents') || '[]') } catch {}
    try { students = JSON.parse(localStorage.getItem('tvu_student_records') || '[]') } catch {}

    const total = docs.length
    const completed = docs.filter((d: any) => d.ocr_status === 'Completed').length
    const pending = docs.filter((d: any) => d.ocr_status === 'Pending' || d.ocr_status === 'Processing').length
    const errors = docs.filter((d: any) => d.ocr_status === 'Error').length
    const totalPages = docs.reduce((s: number, d: any) => s + (d.pages || 0), 0)
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0

    const alerts: string[] = []
    if (errors > 0) alerts.push(`${errors} file bị lỗi OCR`)
    if (pending > 0) alerts.push(`${pending} file đang chờ xử lý`)

    return {
      total_documents: total,
      total_pages: totalPages,
      ocr_completed_percent: pct,
      total_students: students.length,
      total_scores: students.filter((s: any) => s.diem_qp && s.diem_qp !== '').length,
      documents_pending: pending,
      documents_error: errors,
      decisions_linked: docs.filter((d: any) => d.type === 'QD' && d.ocr_status === 'Completed').length,
      alerts,
    }
  }, [])
}

export default function Dashboard() {
  const metrics = useLocalMetrics()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Tổng quan</h1>
        <p className="text-gray-600 mt-1">Xem tổng quan hệ thống quản lý hồ sơ GDQP-AN</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tổng file"
          value={metrics?.total_documents || 0}
          subtitle="PDF files"
          icon="📄"
          color="blue"
        />
        <MetricCard
          title="Tổng trang"
          value={metrics?.total_pages || 0}
          subtitle="scanned pages"
          icon="📑"
          color="green"
        />
        <MetricCard
          title="OCR hoàn tất"
          value={`${metrics?.ocr_completed_percent || 0}%`}
          subtitle="completion rate"
          icon="✅"
          color="purple"
        />
        <MetricCard
          title="Sinh viên"
          value={metrics?.total_students || 0}
          subtitle="extracted records"
          icon="👥"
          color="orange"
        />
      </div>

      {/* Status & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Trạng thái xử lý</h2>
          <div className="space-y-4">
            <StatusItem
              label="Đang chờ xử lý"
              value={metrics?.documents_pending || 0}
              color="yellow"
            />
            <StatusItem
              label="Lỗi OCR"
              value={metrics?.documents_error || 0}
              color="red"
            />
            <StatusItem
              label="Quyết định liên kết"
              value={metrics?.decisions_linked || 0}
              color="green"
            />
            <StatusItem
              label="Tổng điểm số"
              value={metrics?.total_scores || 0}
              color="blue"
            />
          </div>
        </div>

        {/* Alerts Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Cảnh báo & Thông báo</h2>
          <div className="space-y-3">
            {metrics?.alerts && metrics.alerts.length > 0 ? (
              metrics.alerts.map((alert, idx) => (
                <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>{alert}</span>
                </div>
              ))
            ) : (
              <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700 flex gap-2">
                <span className="text-lg">✅</span>
                <span>Không có cảnh báo</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Tiến độ xử lý</h2>
        <div className="space-y-4">
          <ProgressBar
            label="OCR Processing"
            value={metrics?.ocr_completed_percent || 0}
            color="blue"
          />
          <ProgressBar
            label="Data Extraction"
            value={75}
            color="green"
          />
          <ProgressBar
            label="Reconciliation"
            value={60}
            color="purple"
          />
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, subtitle, icon, color }: any) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
  }

  return (
    <div className={`${colorClasses[color as string] || colorClasses.blue} border rounded-lg p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
          <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
        </div>
        <div className="text-4xl opacity-50">{icon}</div>
      </div>
    </div>
  )
}

function StatusItem({ label, value, color }: any) {
  const colorClasses: Record<string, string> = {
    yellow: 'text-yellow-600 bg-yellow-50',
    red: 'text-red-600 bg-red-50',
    green: 'text-green-600 bg-green-50',
    blue: 'text-blue-600 bg-blue-50',
  }

  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
      <span className="text-gray-700">{label}</span>
      <span className={`font-semibold px-3 py-1 rounded ${colorClasses[color as string] || colorClasses.blue}`}>
        {value}
      </span>
    </div>
  )
}

function ProgressBar({ label, value, color }: any) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-600">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${colorClasses[color as string] || colorClasses.blue} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  )
}
