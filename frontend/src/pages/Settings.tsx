import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { settingsApi } from '../services/api'

interface SystemSetting {
  _id: string
  key: string
  label: string
  value: string
  category: string
}

export default function Settings() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await settingsApi.list()
        setSettings(res.data.data || [])
      } catch (e) {
        console.error('Failed to load settings:', e)
        toast.error('Không thể tải cài đặt')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const categories = Array.from(new Set(settings.map(s => s.category)))

  const handleStartEdit = (s: SystemSetting) => { setEditId(s._id); setEditValue(s.value) }

  const handleSaveEdit = useCallback(async () => {
    if (editId) {
      try {
        const res = await settingsApi.update(editId, { value: editValue })
        setSettings(prev => prev.map(s => s._id === editId ? res.data.data : s))
        toast.success('Đã cập nhật cài đặt')
        setEditId(null)
      } catch (e) {
        console.error('Update setting failed:', e)
        toast.error('Cập nhật thất bại')
      }
    }
  }, [editId, editValue])

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa cài đặt này?')) return
    try {
      await settingsApi.delete(id)
      setSettings(prev => prev.filter(s => s._id !== id))
      toast.success('Đã xóa cài đặt')
    } catch (e) {
      console.error('Delete setting failed:', e)
      toast.error('Xóa thất bại')
    }
  }, [])

  const handleAdd = useCallback(async (data: { key: string; label: string; value: string; category: string }) => {
    try {
      const res = await settingsApi.create(data as Record<string, unknown>)
      setSettings(prev => [...prev, res.data.data])
      toast.success('Đã thêm cài đặt')
      setShowAddModal(false)
    } catch (e: any) {
      if (e.response?.status === 409) toast.error('Key đã tồn tại')
      else toast.error('Thêm thất bại')
    }
  }, [])

  const handleReset = useCallback(async () => {
    if (!window.confirm('Bạn có chắc chắn muốn khôi phục cài đặt mặc định?')) return
    try {
      await settingsApi.reset()
      const res = await settingsApi.list()
      setSettings(res.data.data || [])
      toast.success('Đã khôi phục mặc định')
    } catch (e) {
      console.error('Reset settings failed:', e)
      toast.error('Khôi phục thất bại')
    }
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">Cài đặt Hệ thống</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">Quản lý cấu hình hệ thống GDQP-AN</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset}
            className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 font-medium rounded-xl transition-colors text-sm">
            Khôi phục mặc định
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Thêm cài đặt
          </button>
        </div>
      </div>

      {categories.map(cat => (
        <div key={cat} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
            <h2 className="font-semibold text-gray-800 dark:text-white text-sm uppercase tracking-wide">{cat}</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {settings.filter(s => s.category === cat).map(s => (
              <div key={s._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{s.label}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Key: {s.key}</p>
                </div>
                <div className="flex items-center gap-3">
                  {editId === s._id ? (
                    <>
                      <input value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus
                        className="px-3 py-1.5 border border-primary-400 dark:border-primary-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none w-48"
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditId(null) }} />
                      <button onClick={handleSaveEdit} className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded font-medium transition-colors">Lưu</button>
                      <button onClick={() => setEditId(null)} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-400 rounded font-medium transition-colors">Hủy</button>
                    </>
                  ) : (
                    <>
                      <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-medium min-w-[120px] text-center">{s.value}</span>
                      <button onClick={() => handleStartEdit(s)} className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded font-medium transition-colors">Sửa</button>
                      <button onClick={() => handleDelete(s._id)} className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded font-medium transition-colors">Xóa</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showAddModal && <AddSettingModal categories={categories} onClose={() => setShowAddModal(false)} onSave={handleAdd} />}
    </div>
  )
}

function AddSettingModal({ categories, onClose, onSave }: { categories: string[]; onClose: () => void; onSave: (data: { key: string; label: string; value: string; category: string }) => void }) {
  const [key, setKey] = useState('')
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')
  const [category, setCategory] = useState(categories[0] || 'Chung')
  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"

  const handleSubmit = () => {
    if (!key.trim() || !label.trim()) { toast.error('Vui lòng nhập Key và tên cài đặt'); return }
    onSave({ key: key.trim(), label: label.trim(), value, category })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-200 dark:border-slate-700">
        <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Thêm cài đặt</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-white text-2xl">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Key *</label><input value={key} onChange={e => setKey(e.target.value)} className={inputCls} placeholder="setting_key" /></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Danh mục</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>{categories.map(c => <option key={c}>{c}</option>)}<option>Khác</option></select></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Tên cài đặt *</label><input value={label} onChange={e => setLabel(e.target.value)} className={inputCls} placeholder="Tên hiển thị" /></div>
          <div><label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Giá trị</label><input value={value} onChange={e => setValue(e.target.value)} className={inputCls} placeholder="Giá trị mặc định" /></div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 font-medium rounded-xl transition-colors">Hủy</button>
            <button onClick={handleSubmit} className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors">Thêm</button>
          </div>
        </div>
      </div>
    </div>
  )
}
