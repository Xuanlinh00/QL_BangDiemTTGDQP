import { useState, useEffect, useMemo, useCallback } from 'react'
import toast from 'react-hot-toast'
import { reportsApi } from '../services/api'

interface Report {
  _id: string
  title: string
  type: string
  period: string
  year: string
  status: string
  createdAt: string
  note: string
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editReport, setEditReport] = useState<Report | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await reportsApi.list()
        setReports(res.data.data || [])
      } catch (e) {
        console.error('Failed to load reports:', e)
        toast.error('Không thể tải báo cáo')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const types = useMemo(() => Array.from(new Set(reports.map(r => r.type))).sort(), [reports])

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return reports.filter(r => {
      if (filterType !== 'all' && r.type !== filterType) return false
      if (q && !r.title.toLowerCase().includes(q) && !r.year.includes(q)) return false
      return true
    })
  }, [reports, searchTerm, filterType])

  const handleSave = useCallback(async (data: Omit<Report, '_id'>, id?: string) => {
    try {
      if (id) {
        const res = await reportsApi.update(id, data as Record<string, unknown>)
        setReports(prev => prev.map(r => r._id === id ? res.data.data : r))
        toast.success('Đã cập nhật báo cáo')
      } else {
        const res = await reportsApi.create(data as Record<string, unknown>)
        setReports(prev => [...prev, res.data.data])
        toast.success('Đã thêm báo cáo')
      }
      setShowModal(false); setEditReport(null)
    } catch (e) {
      console.error('Save report failed:', e)
      toast.error('Lưu thất bại')
    }
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) return
    try {
      await reportsApi.delete(id)
      setReports(prev => prev.filter(r => r._id !== id))
      toast.success('Đã xóa báo cáo')
    } catch (e) {
      console.error('Delete report failed:', e)
      toast.error('Xóa thất bại')
    }
  }, [])

  const stats = useMemo(() => ({
    total: reports.length,
    completed: reports.filter(r => r.status === 'Hoàn thành').length,
    processing: reports.filter(r => r.status === 'Đang xử lý').length,
    types: new Set(reports.map(r => r.type)).size,
  }), [reports])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">Thống kê & Báo cáo</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">Quản lý các báo cáo GDQP-AN</p>
        </div>
        <button onClick={() => { setEditReport(null); setShowModal(true) }}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Tạo báo cáo
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng báo cáo', value: stats.total, icon: '📋' },
          { label: 'Hoàn thành', value: stats.completed, icon: '✅' },
          { label: 'Đang xử lý', value: stats.processing, icon: '⏳' },
          { label: 'Loại báo cáo', value: stats.types, icon: '📂' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 text-center transition-colors">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{s.value}</p>
            <p className="text-gray-500 dark:text-slate-400 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
        <div className="p-4 flex gap-3 flex-wrap border-b border-gray-200 dark:border-slate-700">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Tìm báo cáo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none">
            <option value="all">Tất cả loại</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">Tiêu đề</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">Loại</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">Kỳ</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">Năm</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">Trạng thái</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">Ngày tạo</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400 dark:text-slate-500">Không tìm thấy báo cáo</td></tr>
            ) : filtered.map(r => (
              <tr key={r._id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-slate-200">{r.title}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">{r.type}</span></td>
                <td className="px-4 py-3 text-center text-xs text-gray-500 dark:text-slate-400">{r.period}</td>
                <td className="px-4 py-3 text-center text-xs text-gray-500 dark:text-slate-400">{r.year}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'Hoàn thành' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-center text-xs text-gray-500 dark:text-slate-400">{r.createdAt}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1.5">
                    <button onClick={() => { setEditReport(r); setShowModal(true) }} className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded font-medium transition-colors">Sửa</button>
                    <button onClick={() => handleDelete(r._id)} className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded font-medium transition-colors">Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <ReportModal report={editReport} onClose={() => { setShowModal(false); setEditReport(null) }} onSave={handleSave} />}
    </div>
  )
}

function ReportModal({ report, onClose, onSave }: { report: Report | null; onClose: () => void; onSave: (data: Omit<Report, '_id'>, id?: string) => void }) {
  const [title, setTitle] = useState(report?.title || '')
  const [type, setType] = useState(report?.type || 'Tổng kết')
  const [period, setPeriod] = useState(report?.period || 'HK1')
  const [year, setYear] = useState(report?.year || '')
  const [status, setStatus] = useState(report?.status || 'Đang xử lý')
  const [note, setNote] = useState(report?.note || '')
  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"

  const handleSubmit = () => {
    if (!title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return }
    const now = new Date().toISOString().slice(0, 10)
    onSave({ title: title.trim(), type, period, year, status, createdAt: report?.createdAt || now, note }, report?._id)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-200 dark:border-slate-700">
        <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">{report ? 'Sửa báo cáo' : 'Tạo báo cáo'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-white text-2xl">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Tiêu đề *</label><input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="Báo cáo tổng kết..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Loại</label>
              <select value={type} onChange={e => setType(e.target.value)} className={inputCls}><option>Tổng kết</option><option>Đối chiếu</option><option>Thống kê</option><option>Khác</option></select></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Kỳ</label>
              <select value={period} onChange={e => setPeriod(e.target.value)} className={inputCls}><option>HK1</option><option>HK2</option><option>Cả năm</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Năm</label><input value={year} onChange={e => setYear(e.target.value)} className={inputCls} placeholder="2025" /></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Trạng thái</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}><option>Đang xử lý</option><option>Hoàn thành</option></select></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ghi chú</label><textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className={inputCls} placeholder="Ghi chú thêm..." /></div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 font-medium rounded-xl transition-colors">Hủy</button>
            <button onClick={handleSubmit} className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors">{report ? 'Lưu thay đổi' : 'Tạo'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
