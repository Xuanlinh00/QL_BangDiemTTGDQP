import { useState, useEffect, useMemo, useCallback } from 'react'
import toast from 'react-hot-toast'
import { studentsApi, scoresApi } from '../services/api'

// ══════════════════════════════════════
// TYPES
// ══════════════════════════════════════
interface Student {
  _id: string
  code: string
  name: string
  className: string
  cohort: number
  dob: string
  system: string
}

interface Score {
  _id: string
  studentId: string
  studentCode: string
  studentName: string
  subject: string
  score: number
  semester: string
  year: string
}

// ══════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════
export default function Data() {
  const [students, setStudents] = useState<Student[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'students' | 'scores'>('students')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCohort, setFilterCohort] = useState('all')

  const [showStudentModal, setShowStudentModal] = useState(false)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [editScore, setEditScore] = useState<Score | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [sRes, scRes] = await Promise.all([studentsApi.list(), scoresApi.list()])
        setStudents(sRes.data.data || [])
        setScores(scRes.data.data || [])
      } catch (e) {
        console.error('Failed to load data:', e)
        toast.error('Không thể tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const cohorts = useMemo(() => Array.from(new Set(students.map(s => s.cohort))).sort((a, b) => b - a), [students])

  const filteredStudents = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return students.filter(s => {
      if (filterCohort !== 'all' && s.cohort !== parseInt(filterCohort)) return false
      if (q && !s.name.toLowerCase().includes(q) && !s.code.toLowerCase().includes(q) && !s.className.toLowerCase().includes(q)) return false
      return true
    })
  }, [students, searchTerm, filterCohort])

  const filteredScores = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return scores.filter(s => {
      if (q && !s.studentName.toLowerCase().includes(q) && !s.studentCode.toLowerCase().includes(q) && !s.subject.toLowerCase().includes(q)) return false
      return true
    })
  }, [scores, searchTerm])

  const handleSaveStudent = useCallback(async (data: Omit<Student, '_id'>, id?: string) => {
    try {
      if (id) {
        const res = await studentsApi.update(id, data as Record<string, unknown>)
        setStudents(prev => prev.map(s => s._id === id ? res.data.data : s))
        toast.success('Đã cập nhật sinh viên')
      } else {
        const res = await studentsApi.create(data as Record<string, unknown>)
        setStudents(prev => [...prev, res.data.data])
        toast.success('Đã thêm sinh viên')
      }
      setShowStudentModal(false); setEditStudent(null)
    } catch (e) {
      console.error('Save student failed:', e)
      toast.error('Lưu thất bại')
    }
  }, [])

  const handleDeleteStudent = useCallback(async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sinh viên này?')) return
    try {
      await studentsApi.delete(id)
      setStudents(prev => prev.filter(s => s._id !== id))
      // Also delete related scores
      const relatedScores = scores.filter(s => s.studentId === id)
      for (const sc of relatedScores) {
        try { await scoresApi.delete(sc._id) } catch {}
      }
      setScores(prev => prev.filter(s => s.studentId !== id))
      toast.success('Đã xóa sinh viên')
    } catch (e) {
      console.error('Delete student failed:', e)
      toast.error('Xóa thất bại')
    }
  }, [scores])

  const handleSaveScore = useCallback(async (data: Omit<Score, '_id'>, id?: string) => {
    try {
      if (id) {
        const res = await scoresApi.update(id, data as Record<string, unknown>)
        setScores(prev => prev.map(s => s._id === id ? res.data.data : s))
        toast.success('Đã cập nhật điểm')
      } else {
        const res = await scoresApi.create(data as Record<string, unknown>)
        setScores(prev => [...prev, res.data.data])
        toast.success('Đã thêm điểm')
      }
      setShowScoreModal(false); setEditScore(null)
    } catch (e) {
      console.error('Save score failed:', e)
      toast.error('Lưu thất bại')
    }
  }, [])

  const handleDeleteScore = useCallback(async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa điểm này?')) return
    try {
      await scoresApi.delete(id)
      setScores(prev => prev.filter(s => s._id !== id))
      toast.success('Đã xóa điểm')
    } catch (e) {
      console.error('Delete score failed:', e)
      toast.error('Xóa thất bại')
    }
  }, [])

  const stats = useMemo(() => ({
    totalStudents: students.length,
    totalScores: scores.length,
    avgScore: scores.length ? (scores.reduce((s, r) => s + r.score, 0) / scores.length).toFixed(1) : '0',
    subjects: new Set(scores.map(s => s.subject)).size,
  }), [students, scores])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">Quản lý Dữ liệu</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">Quản lý sinh viên và điểm GDQP-AN</p>
        </div>
        <button
          onClick={() => { if (activeTab === 'students') { setEditStudent(null); setShowStudentModal(true) } else { setEditScore(null); setShowScoreModal(true) } }}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {activeTab === 'students' ? 'Thêm sinh viên' : 'Thêm điểm'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng sinh viên', value: stats.totalStudents, color: 'primary', icon: '👥' },
          { label: 'Bản ghi điểm', value: stats.totalScores, color: 'accent', icon: '📊' },
          { label: 'Điểm TB', value: stats.avgScore, color: 'purple', icon: '📈' },
          { label: 'Môn học', value: stats.subjects, color: 'amber', icon: '📚' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 text-center transition-colors">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
            <p className="text-gray-500 dark:text-slate-400 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
        <div className="flex border-b border-gray-200 dark:border-slate-700 px-6">
          {(['students', 'scores'] as const).map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setSearchTerm('') }}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === tab ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white'}`}
            >
              {tab === 'students' ? `👥 Sinh viên (${students.length})` : `📊 Điểm số (${scores.length})`}
            </button>
          ))}
        </div>
        <div className="p-4 flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder={activeTab === 'students' ? 'Tìm sinh viên...' : 'Tìm điểm...'} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          {activeTab === 'students' && (
            <select value={filterCohort} onChange={e => setFilterCohort(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="all">Tất cả khóa</option>
              {cohorts.map(c => <option key={c} value={c}>Khóa {c}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
        {activeTab === 'students' ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">Mã SV</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">Họ tên</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">Lớp</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">Khóa</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">Hệ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">Ngày sinh</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400 dark:text-slate-500">Không tìm thấy sinh viên</td></tr>
              ) : filteredStudents.map(student => (
                <tr key={student._id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-gray-800 dark:text-slate-200">{student.code}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-slate-200">{student.name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">{student.className}</span></td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-400">{student.cohort}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-400">{student.system}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{student.dob}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1.5">
                      <button onClick={() => { setEditStudent(student); setShowStudentModal(true) }} className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded font-medium transition-colors">Sửa</button>
                      <button onClick={() => handleDeleteStudent(student._id)} className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded font-medium transition-colors">Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">Mã SV</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">Họ tên</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">Môn học</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">Điểm</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">Học kỳ</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">Năm</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredScores.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400 dark:text-slate-500">Không tìm thấy điểm</td></tr>
              ) : filteredScores.map(score => (
                <tr key={score._id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-gray-800 dark:text-slate-200">{score.studentCode}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-slate-200">{score.studentName}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-400">{score.subject}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${score.score >= 8 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : score.score >= 5 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                      {score.score.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500 dark:text-slate-400">{score.semester}</td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500 dark:text-slate-400">{score.year}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1.5">
                      <button onClick={() => { setEditScore(score); setShowScoreModal(true) }} className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded font-medium transition-colors">Sửa</button>
                      <button onClick={() => handleDeleteScore(score._id)} className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded font-medium transition-colors">Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showStudentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <StudentForm student={editStudent} onClose={() => { setShowStudentModal(false); setEditStudent(null) }} onSave={handleSaveStudent} />
        </div>
      )}
      {showScoreModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <ScoreForm score={editScore} students={students} onClose={() => { setShowScoreModal(false); setEditScore(null) }} onSave={handleSaveScore} />
        </div>
      )}
    </div>
  )
}

function StudentForm({ student, onClose, onSave }: { student: Student | null; onClose: () => void; onSave: (data: Omit<Student, '_id'>, id?: string) => void }) {
  const [code, setCode] = useState(student?.code || '')
  const [name, setName] = useState(student?.name || '')
  const [className, setClassName] = useState(student?.className || '')
  const [cohort, setCohort] = useState(student?.cohort ? String(student.cohort) : '')
  const [dob, setDob] = useState(student?.dob || '')
  const [system, setSystem] = useState(student?.system || 'ĐH')
  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"

  const handleSubmit = () => {
    if (!code.trim() || !name.trim()) { toast.error('Vui lòng nhập mã SV và họ tên'); return }
    onSave({ code: code.trim(), name: name.trim(), className, cohort: parseInt(cohort) || 0, dob, system }, student?._id)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-200 dark:border-slate-700">
      <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">{student ? 'Sửa sinh viên' : 'Thêm sinh viên'}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-white text-2xl">&times;</button>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Mã SV *</label><input value={code} onChange={e => setCode(e.target.value)} className={inputCls} placeholder="114711021" /></div>
          <div><label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Ngày sinh</label><input type="date" value={dob} onChange={e => setDob(e.target.value)} className={inputCls} /></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Họ và tên *</label><input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Nguyễn Văn A" /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Lớp</label><input value={className} onChange={e => setClassName(e.target.value)} className={inputCls} placeholder="DA11DT" /></div>
          <div><label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Khóa</label><input type="number" value={cohort} onChange={e => setCohort(e.target.value)} className={inputCls} placeholder="2024" /></div>
          <div><label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Hệ</label>
            <select value={system} onChange={e => setSystem(e.target.value)} className={inputCls}><option value="ĐH">Đại học</option><option value="CĐ">Cao đẳng</option><option value="LT">Liên thông</option><option value="Nghề">Nghề</option></select>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 font-medium rounded-xl transition-colors">Hủy</button>
          <button onClick={handleSubmit} className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors">{student ? 'Lưu thay đổi' : 'Thêm'}</button>
        </div>
      </div>
    </div>
  )
}

function ScoreForm({ score, students, onClose, onSave }: { score: Score | null; students: Student[]; onClose: () => void; onSave: (data: Omit<Score, '_id'>, id?: string) => void }) {
  const [studentId, setStudentId] = useState(score?.studentId ? String(score.studentId) : '')
  const [subject, setSubject] = useState(score?.subject || 'Giáo dục QP-AN 1')
  const [scoreVal, setScoreVal] = useState(score?.score ? String(score.score) : '')
  const [semester, setSemester] = useState(score?.semester || 'HK1')
  const [year, setYear] = useState(score?.year || '')
  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"

  const handleSubmit = () => {
    if (!studentId || !scoreVal) { toast.error('Vui lòng chọn sinh viên và nhập điểm'); return }
    const st = students.find(s => s._id === studentId)
    if (!st) return
    onSave({ studentId: st._id, studentCode: st.code, studentName: st.name, subject, score: parseFloat(scoreVal) || 0, semester, year }, score?._id)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-200 dark:border-slate-700">
      <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">{score ? 'Sửa điểm' : 'Thêm điểm'}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-white text-2xl">&times;</button>
      </div>
      <div className="p-6 space-y-4">
        <div><label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Sinh viên *</label>
          <select value={studentId} onChange={e => setStudentId(e.target.value)} className={inputCls}><option value="">-- Chọn sinh viên --</option>{students.map(s => <option key={s._id} value={s._id}>{s.code} - {s.name}</option>)}</select>
        </div>
        <div><label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Môn học</label>
          <select value={subject} onChange={e => setSubject(e.target.value)} className={inputCls}><option>Giáo dục QP-AN 1</option><option>Giáo dục QP-AN 2</option><option>Giáo dục QP-AN 3</option><option>Giáo dục QP-AN 4</option></select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Điểm *</label><input type="number" step="0.1" min="0" max="10" value={scoreVal} onChange={e => setScoreVal(e.target.value)} className={inputCls} placeholder="8.0" /></div>
          <div><label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Học kỳ</label><select value={semester} onChange={e => setSemester(e.target.value)} className={inputCls}><option value="HK1">HK1</option><option value="HK2">HK2</option></select></div>
          <div><label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Năm</label><input value={year} onChange={e => setYear(e.target.value)} className={inputCls} placeholder="2025" /></div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 font-medium rounded-xl transition-colors">Hủy</button>
          <button onClick={handleSubmit} className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors">{score ? 'Lưu thay đổi' : 'Thêm'}</button>
        </div>
      </div>
    </div>
  )
}
