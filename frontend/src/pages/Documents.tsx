import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import UploadModal from '../components/DocumentUpload/UploadModal'
import GoogleDriveModal from '../components/DocumentUpload/GoogleDriveModal'
import OCRReviewModal, { StudentRecord, ExtractMeta } from '../components/DocumentUpload/OCRReviewModal'
import { exportToExcel, exportPdfFormatToExcel } from '../utils/excelExport'
import { GoogleDriveFile } from '../hooks/useGoogleDrive'
import { docstoreApi } from '../services/api'

// ─── Google Drive download helper ────────────────────────────────────────────
async function downloadDriveFile(fileId: string, fileName: string, mimeType?: string) {
  const token = localStorage.getItem('gdrive_access_token')
  if (!token) {
    toast.error('Chưa đăng nhập Google Drive. Hãy mở Google Drive modal và đăng nhập trước.')
    return
  }
  const toastId = toast.loading(`Đang tải: ${fileName}...`)
  try {
    let url: string
    let finalName = fileName
    if (mimeType?.startsWith('application/vnd.google-apps.')) {
      let exportMime = 'application/pdf'
      if (mimeType.includes('spreadsheet')) {
        exportMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        if (!finalName.match(/\.xlsx?$/i)) finalName += '.xlsx'
      } else if (mimeType.includes('document')) {
        exportMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        if (!finalName.match(/\.docx?$/i)) finalName += '.docx'
      } else if (mimeType.includes('presentation')) {
        exportMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        if (!finalName.match(/\.pptx?$/i)) finalName += '.pptx'
      } else {
        if (!finalName.match(/\.pdf$/i)) finalName += '.pdf'
      }
      url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMime)}`
    } else {
      url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
    }
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      const errText = await resp.text()
      throw new Error(`HTTP ${resp.status}: ${errText.slice(0, 200)}`)
    }
    const blob = await resp.blob()
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = finalName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
    toast.success(`Đã tải: ${finalName}`, { id: toastId })
  } catch (err: any) {
    console.error('[Download] Error:', err)
    toast.error(`Lỗi tải file: ${err.message}`, { id: toastId })
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface StoredDocument {
  _id: string
  name: string
  folder: string
  type: string
  pages: number
  ocr_status: string
  extract_status: string
  uploaded_at: string
  driveFileId?: string
  webViewLink?: string
  mimeType?: string
  source: 'local' | 'google_drive' | 'mock'
  academicYear?: string
  cohort?: string
  className?: string
  trainingProgram?: string
}

interface StoredStudentRecord {
  _id?: string
  docId: string
  docName: string
  stt: string
  ho_ten: string
  mssv: string
  lop: string
  diem_qp: string
  diem_lan2: string
  ket_qua: string
  ghi_chu: string
}

// ─── Helper components ────────────────────────────────────────────────────────
function FileIcon({ mimeType, size = 'md' }: { mimeType?: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-12 h-12 text-xl' : 'w-9 h-9 text-sm'
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) {
    return (
      <span className={`${s} rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold flex-shrink-0`}>
        XLS
      </span>
    )
  }
  if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) {
    return (
      <span className={`${s} rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold flex-shrink-0`}>
        PPT
      </span>
    )
  }
  return (
    <span className={`${s} rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold flex-shrink-0`}>
      PDF
    </span>
  )
}

function SourceBadge({ source }: { source: string }) {
  if (source === 'google_drive') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6.28 3l5.72 9.9L6.28 3zm11.44 0l-5.72 9.9 5.72-9.9zm-5.72 9.9L6.28 21h11.44L12 12.9z"/></svg>
      Drive
    </span>
  )
  if (source === 'local') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
      Local
    </span>
  )
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-600">
      Mẫu
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Documents() {
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') ?? '')
  const [filterType, setFilterType] = useState(() => searchParams.get('type') ?? 'all')
  const [studentRecords, setStudentRecords] = useState<StoredStudentRecord[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showGoogleDriveModal, setShowGoogleDriveModal] = useState(false)
  const [documents, setDocuments] = useState<StoredDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<StoredDocument | null>(null)
  const [editDoc, setEditDoc] = useState<StoredDocument | null>(null)

  const [quickPreviewDoc, setQuickPreviewDoc] = useState<StoredDocument | null>(null)
  const [quickPreviewUrl, setQuickPreviewUrl] = useState<string | null>(null)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [selectedProgram, setSelectedProgram] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string | null>(null)

  const [showOCRReview, setShowOCRReview] = useState(false)
  const [ocrReviewDoc, setOcrReviewDoc] = useState<StoredDocument | null>(null)
  const [ocrPdfUrl, setOcrPdfUrl] = useState<string | null>(null)
  const [ocrFileBlob, setOcrFileBlob] = useState<Blob | null>(null)

  const [activeRowMenu, setActiveRowMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const qParam = searchParams.get('q')
    const typeParam = searchParams.get('type')
    if (qParam !== null) setSearchTerm(qParam)
    if (typeParam) setFilterType(typeParam)
  }, [searchParams])

  useEffect(() => {
    async function load() {
      try {
        const [docsRes, recsRes] = await Promise.all([
          docstoreApi.list(),
          docstoreApi.listStudentRecords(),
        ])
        setDocuments(docsRes.data.data || [])
        setStudentRecords(recsRes.data.data || [])
      } catch (e) {
        console.error('Failed to load documents:', e)
        toast.error('Không thể tải tài liệu')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveRowMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const q = searchTerm.trim().toLowerCase()

  const programFolders = useMemo(() => {
    const progs = new Set<string>()
    documents.forEach(doc => { const p = doc.trainingProgram || ''; if (p) progs.add(p) })
    return Array.from(progs).sort()
  }, [documents])

  const yearFolders = useMemo(() => {
    const years = new Set<string>()
    documents.forEach(doc => {
      const docProg = doc.trainingProgram || ''
      if (selectedProgram && docProg !== selectedProgram) return
      const yr = doc.academicYear || doc.uploaded_at?.substring(0, 4) || ''
      if (yr) years.add(yr)
    })
    return Array.from(years).sort().reverse()
  }, [documents, selectedProgram])

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const docProg = doc.trainingProgram || ''
      const matchesProg = !selectedProgram || docProg === selectedProgram
      const docYear = doc.academicYear || doc.uploaded_at?.substring(0, 4) || ''
      const matchesYear = !selectedYear || docYear === selectedYear
      const searchFields = [doc.name, doc.className, doc.cohort, doc.trainingProgram]
      const matchesSearch = q === '' || searchFields.some(f => typeof f === 'string' && f.toLowerCase().includes(q))
      const matchesType = filterType === 'all' || doc.type === filterType
      return matchesProg && matchesYear && matchesSearch && matchesType
    })
  }, [documents, selectedProgram, selectedYear, q, filterType])

  const matchedStudents = q === '' ? [] : studentRecords.filter(
    r => r.ho_ten.toLowerCase().includes(q) || r.mssv.toLowerCase().includes(q) || r.lop.toLowerCase().includes(q)
  )

  // ── Handlers (unchanged logic) ──────────────────────────────────────────────
  const handleUploadFiles = useCallback(async (
    files: File[],
    documentType: string,
    metadata?: { academicYear?: string; cohort?: string; className?: string; trainingProgram?: string }
  ) => {
    let folderName = 'Upload'
    if (metadata?.cohort && metadata?.className) folderName = `${metadata.cohort}/${metadata.className}`
    else if (metadata?.cohort) folderName = metadata.cohort
    try {
      const res = await docstoreApi.upload(files, {
        folder: folderName, type: documentType,
        academicYear: metadata?.academicYear || '', cohort: metadata?.cohort || '',
        className: metadata?.className || '', trainingProgram: metadata?.trainingProgram || '',
      })
      const newDocs = res.data.data || []
      setDocuments(prev => [...prev, ...newDocs])
      if (metadata?.trainingProgram) setSelectedProgram(metadata.trainingProgram)
      if (metadata?.academicYear) setSelectedYear(metadata.academicYear)
      let message = `Đã tải lên ${files.length} file`
      if (metadata?.trainingProgram) message += ` — ${metadata.trainingProgram}`
      if (metadata?.academicYear) message += ` — Năm ${metadata.academicYear}`
      if (metadata?.cohort) message += ` — Khóa ${metadata.cohort}`
      if (metadata?.className) message += ` — Lớp ${metadata.className}`
      toast.success(message)
    } catch (e) {
      console.error('Upload failed:', e)
      toast.error('Tải lên thất bại')
    }
  }, [])

  const handleGoogleDriveSelect = useCallback(async (files: GoogleDriveFile[]) => {
    try {
      const newDocs: StoredDocument[] = []
      for (const file of files) {
        const res = await docstoreApi.saveGDrive({
          name: file.name, folder: 'GoogleDrive',
          type: file.mimeType?.includes('pdf') ? 'DSGD'
            : (file.mimeType?.includes('spreadsheet') || file.mimeType?.includes('excel')) ? 'BieuMau' : 'DSGD',
          pages: 0, ocr_status: 'Pending', extract_status: 'Pending',
          driveFileId: file.id, webViewLink: file.webViewLink, mimeType: file.mimeType,
        })
        newDocs.push(res.data.data)
      }
      setDocuments(prev => [...prev, ...newDocs])
      toast.success(`Đã nhập ${files.length} file từ Google Drive`)
    } catch (e) {
      console.error('Google Drive import failed:', e)
      toast.error('Nhập từ Google Drive thất bại')
    }
  }, [])

  const handleViewFile = useCallback(async (doc: StoredDocument) => {
    if (doc.source === 'local') {
      setPreviewDoc(doc); setPreviewUrl(docstoreApi.getFileUrl(doc._id)); return
    }
    if (doc.source === 'google_drive' && doc.driveFileId) {
      let url: string
      if (doc.mimeType?.startsWith('application/vnd.google-apps.')) {
        if (doc.mimeType.includes('spreadsheet')) url = `https://docs.google.com/spreadsheets/d/${doc.driveFileId}/preview`
        else if (doc.mimeType.includes('document')) url = `https://docs.google.com/document/d/${doc.driveFileId}/preview`
        else if (doc.mimeType.includes('presentation')) url = `https://docs.google.com/presentation/d/${doc.driveFileId}/preview`
        else url = `https://drive.google.com/file/d/${doc.driveFileId}/preview`
      } else {
        url = `https://drive.google.com/file/d/${doc.driveFileId}/preview`
      }
      setPreviewDoc(doc); setPreviewUrl(url); return
    }
    toast('File mẫu không có nội dung để xem', { icon: 'ℹ️' })
  }, [])

  const closePreview = useCallback(() => { setPreviewDoc(null); setPreviewUrl(null) }, [])

  const handleRowClick = useCallback((doc: StoredDocument) => {
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null
      if (doc.source === 'local') {
        setQuickPreviewDoc(doc); setQuickPreviewUrl(docstoreApi.getFileUrl(doc._id))
      } else if (doc.source === 'google_drive' && doc.driveFileId) {
        const url = doc.mimeType?.includes('spreadsheet')
          ? `https://docs.google.com/spreadsheets/d/${doc.driveFileId}/preview`
          : doc.mimeType?.includes('document')
          ? `https://docs.google.com/document/d/${doc.driveFileId}/preview`
          : `https://drive.google.com/file/d/${doc.driveFileId}/preview`
        setQuickPreviewDoc(doc); setQuickPreviewUrl(url)
      }
    }, 250)
  }, [])

  const handleRowDoubleClick = useCallback((doc: StoredDocument) => {
    if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null }
    setQuickPreviewDoc(null); setQuickPreviewUrl(null)
    handleViewFile(doc)
  }, [handleViewFile])

  const handleDownloadFile = useCallback(async (doc: StoredDocument) => {
    if (doc.source === 'google_drive' && doc.driveFileId) {
      await downloadDriveFile(doc.driveFileId, doc.name, doc.mimeType); return
    }
    if (doc.source === 'local') {
      const url = docstoreApi.getFileUrl(doc._id)
      const link = document.createElement('a')
      link.href = url; link.download = doc.name
      document.body.appendChild(link); link.click(); document.body.removeChild(link)
      toast.success(`Đã tải: ${doc.name}`); return
    }
    toast('File mẫu không có nội dung để tải', { icon: 'ℹ️' })
  }, [])

  const handleDeleteDoc = useCallback(async (docId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return
    try {
      await docstoreApi.delete(docId)
      setDocuments(prev => prev.filter(d => d._id !== docId))
      setStudentRecords(prev => prev.filter(r => r.docId !== docId))
      toast.success('Đã xóa tài liệu')
    } catch (e) { console.error('Delete document failed:', e); toast.error('Xóa thất bại') }
  }, [])

  const handleEditDoc = useCallback(async (docId: string, updates: Partial<StoredDocument>) => {
    try {
      const res = await docstoreApi.update(docId, updates as Record<string, unknown>)
      setDocuments(prev => prev.map(d => d._id === docId ? res.data.data : d))
      setEditDoc(null); toast.success('Đã cập nhật tài liệu')
    } catch (e) { console.error('Edit document failed:', e); toast.error('Cập nhật thất bại') }
  }, [])

  const handleOpenOCRReview = useCallback(async (doc: StoredDocument) => {
    let pdfUrl: string | null = null
    let fileBlob: Blob | null = null
    if (doc.source === 'local') {
      try {
        const response = await fetch(docstoreApi.getFileUrl(doc._id))
        if (response.ok) { fileBlob = await response.blob(); pdfUrl = URL.createObjectURL(fileBlob) }
      } catch (e) { console.warn('[OCR] Could not load blob:', e) }
    } else if (doc.source === 'google_drive' && doc.driveFileId) {
      pdfUrl = `https://drive.google.com/file/d/${doc.driveFileId}/preview`
    }
    setOcrFileBlob(fileBlob); setOcrReviewDoc(doc); setOcrPdfUrl(pdfUrl); setShowOCRReview(true)
  }, [])

  const handleOCRSave = useCallback(async (records: StudentRecord[], _meta: ExtractMeta) => {
    if (!ocrReviewDoc) return
    try {
      const docRes = await docstoreApi.update(ocrReviewDoc._id, { ocr_status: 'Completed', extract_status: 'Completed' })
      setDocuments(prev => prev.map(d => d._id === ocrReviewDoc._id ? docRes.data.data : d))
      const recsRes = await docstoreApi.bulkSaveStudentRecords(
        ocrReviewDoc._id, ocrReviewDoc.name, records as unknown as Record<string, unknown>[]
      )
      setStudentRecords(prev => {
        const filtered = prev.filter(r => r.docId !== ocrReviewDoc._id)
        return [...filtered, ...(recsRes.data.data || [])]
      })
      toast.success(`Đã xác nhận ${records.length} bản ghi`)
    } catch (e) { console.error('OCR save failed:', e); toast.error('Lưu bản ghi thất bại') }
    if (records.length > 0) {
      setTimeout(() => {
        exportPdfFormatToExcel(records as any[], _meta, ocrReviewDoc.name, ocrReviewDoc.type as 'DSGD' | 'QD' | 'BieuMau')
        toast.success(`Đã xuất Excel: ${ocrReviewDoc.name.replace(/\.pdf$/i, '')}.xlsx`)
      }, 300)
    }
  }, [ocrReviewDoc])

  const countDocsForYear = (year: string) =>
    documents.filter(doc => {
      const docProg = doc.trainingProgram || ''
      const matchesProg = !selectedProgram || docProg === selectedProgram
      const docYear = doc.academicYear || doc.uploaded_at?.substring(0, 4) || ''
      return matchesProg && docYear === year
    }).length

  const countDocsForProgram = (prog: string) =>
    documents.filter(doc => (doc.trainingProgram || '') === prog).length

  const highlight = (text: string) => {
    if (!q) return text
    const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return text.split(new RegExp(`(${esc})`, 'gi')).map((part, i) =>
      part.toLowerCase() === q
        ? <mark key={i} className="bg-amber-200 dark:bg-amber-700/60 text-gray-900 dark:text-white rounded px-0.5">{part}</mark>
        : part
    )
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-indigo-100 dark:border-slate-700" />
        <div className="absolute inset-0 rounded-full border-2 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
      </div>
      <p className="text-sm text-gray-400 dark:text-slate-500 font-medium">Đang tải tài liệu...</p>
    </div>
  )

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 h-full" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500 mb-1">
            <span>Quản lý</span>
            <span>›</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">Bảng điểm</span>
            {selectedProgram && <><span>›</span><span className="text-gray-600 dark:text-slate-300 font-medium">{selectedProgram}</span></>}
            {selectedYear && <><span>›</span><span className="text-gray-600 dark:text-slate-300 font-medium">Năm {selectedYear}</span></>}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Quản lý Bảng điểm
          </h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">
            {filteredDocuments.length} tài liệu{selectedProgram ? ` trong ${selectedProgram}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={async () => {
              try {
                const [docsRes, recsRes] = await Promise.all([docstoreApi.list(), docstoreApi.listStudentRecords()])
                setDocuments(docsRes.data.data || []); setStudentRecords(recsRes.data.data || [])
                toast.success('Đã làm mới')
              } catch { toast.error('Làm mới thất bại') }
            }}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            title="Làm mới"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => setShowGoogleDriveModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium text-sm transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.28 3l5.72 9.9L6.28 3zm11.44 0l-5.72 9.9 5.72-9.9zm-5.72 9.9L6.28 21h11.44L12 12.9z"/>
            </svg>
            Google Drive
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Tải lên
          </button>
        </div>
      </div>

      {/* ── Program & Year filter ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Program tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-0 overflow-x-auto">
          <button
            onClick={() => { setSelectedProgram(null); setSelectedYear(null) }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              !selectedProgram
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-900/20'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
            </svg>
            Tất cả
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${!selectedProgram ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
              {documents.length}
            </span>
          </button>
          {programFolders.map(prog => (
            <button
              key={prog}
              onClick={() => { setSelectedProgram(prog); setSelectedYear(null) }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                selectedProgram === prog
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-900/20'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
            >
              🎓 {prog}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${selectedProgram === prog ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                {countDocsForProgram(prog)}
              </span>
            </button>
          ))}
        </div>

        <div className="h-px bg-gray-100 dark:bg-slate-700 mx-4" />

        {/* Year pills */}
        {selectedProgram && yearFolders.length > 0 ? (
          <div className="flex items-center gap-2 px-4 py-2.5 flex-wrap">
            <span className="text-xs text-gray-400 dark:text-slate-500 font-medium mr-1">Năm học:</span>
            <button
              onClick={() => setSelectedYear(null)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${!selectedYear ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
            >
              Tất cả
            </button>
            {yearFolders.map(year => (
              <div key={year} className="flex items-center gap-0.5">
                <button
                  onClick={() => setSelectedYear(year)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${selectedYear === year ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
                >
                  {year} <span className="opacity-70">({countDocsForYear(year)})</span>
                </button>
                <button
                  onClick={async () => {
                    const count = documents.filter(doc => {
                      const docProg = doc.trainingProgram || ''
                      const docYear = doc.academicYear || doc.uploaded_at?.substring(0, 4) || ''
                      return docProg === selectedProgram && docYear === year
                    }).length
                    if (!window.confirm(`Xóa tất cả ${count} tài liệu của năm ${year}?`)) return
                    try {
                      const docsToDelete = documents.filter(doc => {
                        const docProg = doc.trainingProgram || ''
                        const docYear = doc.academicYear || doc.uploaded_at?.substring(0, 4) || ''
                        return docProg === selectedProgram && docYear === year
                      })
                      for (const doc of docsToDelete) await docstoreApi.delete(doc._id)
                      setDocuments(prev => prev.filter(d => !docsToDelete.some(del => del._id === d._id)))
                      setStudentRecords(prev => prev.filter(r => !docsToDelete.some(d => d._id === r.docId)))
                      setSelectedYear(null)
                      toast.success(`Đã xóa ${count} tài liệu của năm ${year}`)
                    } catch (e) { console.error(e); toast.error('Xóa thất bại') }
                  }}
                  className="p-1 rounded-full text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title={`Xóa năm ${year}`}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            ))}
            <div className="ml-auto">
              <button
                onClick={async () => {
                  const count = documents.filter(doc => (doc.trainingProgram || '') === selectedProgram).length
                  if (!window.confirm(`Xóa tất cả ${count} tài liệu của chương trình "${selectedProgram}"?`)) return
                  try {
                    const docsToDelete = documents.filter(doc => (doc.trainingProgram || '') === selectedProgram)
                    for (const doc of docsToDelete) await docstoreApi.delete(doc._id)
                    setDocuments(prev => prev.filter(d => (d.trainingProgram || '') !== selectedProgram))
                    setStudentRecords(prev => prev.filter(r => !docsToDelete.some(d => d._id === r.docId)))
                    setSelectedProgram(null); setSelectedYear(null)
                    toast.success(`Đã xóa ${count} tài liệu`)
                  } catch (e) { console.error(e); toast.error('Xóa thất bại') }
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800/40 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Xóa toàn bộ CTĐT
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-2.5">
            <p className="text-xs text-gray-400 dark:text-slate-500 italic">
              {selectedProgram ? 'Không có dữ liệu năm học.' : 'Chọn một chương trình để lọc theo năm học.'}
            </p>
          </div>
        )}
      </div>

      {/* ── Search bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              placeholder="Tìm tên file, sinh viên, MSSV, lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 shadow-sm transition-shadow"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Search result badges */}
        {q && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              {filteredDocuments.length} tài liệu
            </span>
            {matchedStudents.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                {matchedStudents.length} sinh viên
              </span>
            )}
            <span className="text-xs text-gray-400 dark:text-slate-500">Kết quả cho "{searchTerm}"</span>
          </div>
        )}

        {/* Student search results */}
        {matchedStudents.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-purple-200 dark:border-purple-800/50 overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800/50">
              <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                Kết quả sinh viên — {matchedStudents.length} bản ghi
              </span>
              <span className="text-xs text-purple-500 dark:text-purple-400 ml-1">tìm theo tên · MSSV · lớp</span>
            </div>
            <div className="overflow-x-auto max-h-52 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                  <tr>
                    {['STT','Họ và Tên','MSSV','Lớp','Điểm QP','Kết quả','Tài liệu'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                  {matchedStudents.map((r, idx) => (
                    <tr key={idx} className="hover:bg-purple-50/40 dark:hover:bg-purple-900/10 transition-colors">
                      <td className="px-3 py-2 text-gray-400 dark:text-slate-500 text-xs tabular-nums">{r.stt}</td>
                      <td className="px-3 py-2 font-medium text-gray-800 dark:text-slate-200">{highlight(r.ho_ten)}</td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-600 dark:text-slate-400">{highlight(r.mssv)}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-slate-400">{highlight(r.lop)}</td>
                      <td className="px-3 py-2 text-center font-bold text-gray-800 dark:text-slate-200">{r.diem_qp}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${r.ket_qua === 'Đạt' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : r.ket_qua === 'Không đạt' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                          {r.ket_qua || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-400 dark:text-slate-500 text-xs truncate max-w-[160px]" title={r.docName}>
                        <span className="flex items-center gap-1"><span className="opacity-60">📄</span> {r.docName}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Main content: table + side preview ──────────────────────────────── */}
      <div className="flex gap-3 min-h-0" style={{ height: 'calc(100vh - 20rem)', minHeight: '400px' }}>

        {/* Document table */}
        <div className={`flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden transition-all duration-200 ${quickPreviewDoc ? 'w-[300px] flex-shrink-0' : 'w-full'}`}>
          {/* Table header */}
          <div className="flex-shrink-0 bg-gray-50/80 dark:bg-slate-700/40 border-b border-gray-100 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    Tài liệu
                  </th>
                  {!quickPreviewDoc && <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide w-24">Nguồn</th>}
                  {!quickPreviewDoc && <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide w-28">Ngày</th>}
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide w-36">Thao tác</th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Scrollable rows */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {filteredDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                  <svg className="w-7 h-7 text-gray-300 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Không có tài liệu</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                    {q ? `Không tìm thấy kết quả cho "${searchTerm}"` : 'Tải lên hoặc nhập từ Google Drive để bắt đầu'}
                  </p>
                </div>
                {!q && (
                  <button onClick={() => setShowUploadModal(true)} className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors">
                    + Tải lên ngay
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {filteredDocuments.map((doc) => {
                    const docRecs = studentRecords.filter(r => r.docId === doc._id)
                    const isSelected = quickPreviewDoc?._id === doc._id
                    return (
                      <tr
                        key={doc._id}
                        onClick={() => handleRowClick(doc)}
                        onDoubleClick={() => handleRowDoubleClick(doc)}
                        className={`group border-b border-gray-50 dark:border-slate-700/50 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-l-indigo-500' : ''}`}
                      >
                        {/* File info */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileIcon mimeType={doc.mimeType} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-800 dark:text-slate-200 truncate text-sm leading-tight" title={doc.name}>
                                {q ? highlight(doc.name) : doc.name}
                              </p>
                              {docRecs.length > 0 && (
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="inline-flex items-center gap-0.5 text-[11px] text-emerald-600 dark:text-emerald-500 font-medium">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                    {docRecs.length} bản ghi
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                  {/* Source + Date (hidden when split view) */}
                  {!quickPreviewDoc && (
                    <td className="px-4 py-3 w-24">
                      <SourceBadge source={doc.source} />
                    </td>
                  )}
                  {!quickPreviewDoc && (
                    <td className="px-4 py-3 w-28">
                      <span className="text-xs text-gray-400 dark:text-slate-500 tabular-nums">{doc.uploaded_at}</span>
                    </td>
                  )}

                        {/* Actions */}
                        <td className="px-3 py-3 w-36" onClick={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View */}
                            <button
                              onClick={() => handleViewFile(doc)}
                              className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors opacity-0 group-hover:opacity-100"
                              title="Xem file"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                              </svg>
                            </button>

                            {/* Excel export if records exist */}
                            {docRecs.length > 0 && (
                              <button
                                onClick={() => {
                                  exportPdfFormatToExcel(docRecs as any[], {
                                    lop: docRecs[0]?.lop,
                                    total_records: docRecs.length,
                                    so_dat: docRecs.filter(r => r.ket_qua === 'Đạt').length,
                                    so_khong_dat: docRecs.filter(r => r.ket_qua === 'Không đạt').length,
                                  }, doc.name, doc.type as 'DSGD' | 'QD' | 'BieuMau')
                                  toast.success(`Đã xuất Excel: ${doc.name.replace(/\.pdf$/i, '')}.xlsx`)
                                }}
                                className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors opacity-0 group-hover:opacity-100"
                                title={`Xuất Excel (${docRecs.length} bản ghi)`}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                </svg>
                              </button>
                            )}

                            {/* More menu */}
                            <div className="relative" ref={activeRowMenu === doc._id ? menuRef : null}>
                              <button
                                onClick={() => setActiveRowMenu(activeRowMenu === doc._id ? null : doc._id)}
                                className={`p-1.5 rounded-lg transition-colors ${activeRowMenu === doc._id ? 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300' : 'text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100'}`}
                                title="Thêm"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                                  <circle cx="8" cy="3" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="8" cy="13" r="1.2"/>
                                </svg>
                              </button>

                              {activeRowMenu === doc._id && (
                                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-20 py-1 overflow-hidden">
                                  <button
                                    onClick={() => { handleViewFile(doc); setActiveRowMenu(null) }}
                                    className="w-full px-3.5 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors"
                                  >
                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                    Xem toàn màn hình
                                  </button>
                                  <button
                                    onClick={() => { handleDownloadFile(doc); setActiveRowMenu(null) }}
                                    className="w-full px-3.5 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors"
                                  >
                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                    Tải xuống
                                  </button>
                                  {doc.source === 'google_drive' && doc.webViewLink && (
                                    <a
                                      href={doc.webViewLink} target="_blank" rel="noopener noreferrer"
                                      onClick={() => setActiveRowMenu(null)}
                                      className="w-full px-3.5 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors"
                                    >
                                      <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor"><path d="M6.28 3l5.72 9.9L6.28 3zm11.44 0l-5.72 9.9 5.72-9.9zm-5.72 9.9L6.28 21h11.44L12 12.9z"/></svg>
                                      Mở trong Drive
                                    </a>
                                  )}
                                  <button
                                    onClick={() => { setEditDoc(doc); setActiveRowMenu(null) }}
                                    className="w-full px-3.5 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors"
                                  >
                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                    Chỉnh sửa thông tin
                                  </button>
                                  <div className="my-1 h-px bg-gray-100 dark:bg-slate-700" />
                                  <button
                                    onClick={() => { handleDeleteDoc(doc._id); setActiveRowMenu(null) }}
                                    className="w-full px-3.5 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                    Xóa tài liệu
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Table footer */}
          {filteredDocuments.length > 0 && (
            <div className="flex-shrink-0 px-4 py-2 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/20 flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-slate-500">
                Hiển thị {filteredDocuments.length} / {documents.length} tài liệu
              </span>
              <span className="text-[11px] text-gray-300 dark:text-slate-600 italic">
                Click để xem nhanh · Double-click để xem đầy đủ
              </span>
            </div>
          )}
        </div>

        {/* ── Quick preview panel ────────────────────────────────────────────── */}
        {quickPreviewDoc && (
          <div className="flex-1 min-w-0 flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-indigo-200 dark:border-indigo-700/50 shadow-sm overflow-hidden transition-all">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-indigo-50/60 dark:bg-indigo-900/20 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <FileIcon mimeType={quickPreviewDoc.mimeType} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{quickPreviewDoc.name}</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500">{quickPreviewDoc.uploaded_at}{quickPreviewDoc.type ? ` · ${quickPreviewDoc.type}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => { handleViewFile(quickPreviewDoc); setQuickPreviewDoc(null); setQuickPreviewUrl(null) }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Toàn màn hình
                </button>
                <button
                  onClick={() => handleDownloadFile(quickPreviewDoc)}
                  className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title="Tải xuống"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                </button>
                <button
                  onClick={() => { setQuickPreviewDoc(null); setQuickPreviewUrl(null) }}
                  className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            {/* iframe */}
            <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-slate-900">
              {quickPreviewUrl ? (
                <iframe src={quickPreviewUrl} className="w-full h-full border-0" title={quickPreviewDoc.name} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 dark:text-slate-500">
                  <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  <p className="text-sm">Không thể xem trước file này</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <UploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} onUpload={handleUploadFiles} />
      <GoogleDriveModal isOpen={showGoogleDriveModal} onClose={() => setShowGoogleDriveModal(false)} onSelect={handleGoogleDriveSelect} />

      {ocrReviewDoc && (
        <OCRReviewModal
          isOpen={showOCRReview}
          onClose={() => { setShowOCRReview(false); setOcrReviewDoc(null); setOcrFileBlob(null) }}
          pdfUrl={ocrPdfUrl}
          fileBlob={ocrFileBlob}
          docName={ocrReviewDoc.name}
          docId={ocrReviewDoc._id}
          docType={(ocrReviewDoc.type as 'DSGD' | 'QD' | 'BieuMau') || 'DSGD'}
          workerUrl="http://localhost:8000"
          onSave={handleOCRSave}
        />
      )}

      {/* Full-screen preview */}
      {previewDoc && (
        <div className="fixed inset-0 bg-gray-950/95 dark:bg-gray-950/98 z-50 flex flex-col backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <FileIcon mimeType={previewDoc.mimeType} size="md" />
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white truncate">{previewDoc.name}</h3>
                <p className="text-xs text-gray-400">{previewDoc.uploaded_at}{previewDoc.type ? ` · ${previewDoc.type}` : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => handleDownloadFile(previewDoc)} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Tải xuống
              </button>
              {previewDoc.source === 'google_drive' && previewDoc.webViewLink && (
                <a href={previewDoc.webViewLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-colors">
                  <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="currentColor"><path d="M6.28 3l5.72 9.9L6.28 3zm11.44 0l-5.72 9.9 5.72-9.9zm-5.72 9.9L6.28 21h11.44L12 12.9z"/></svg>
                  Mở Drive
                </a>
              )}
              <button onClick={closePreview} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            {previewUrl ? (
              <iframe src={previewUrl} className="w-full h-full border-0" title={previewDoc.name} allow="autoplay" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
                <svg className="w-16 h-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <p className="text-base text-gray-400">Không thể xem trước file này</p>
                {previewDoc.webViewLink && (
                  <a href={previewDoc.webViewLink} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm hover:underline">
                    Mở trong Google Drive →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editDoc && (
        <EditDocModal doc={editDoc} onClose={() => setEditDoc(null)} onSave={(updates) => handleEditDoc(editDoc._id, updates)} />
      )}
    </div>
  )
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditDocModal({ doc, onClose, onSave }: {
  doc: StoredDocument
  onClose: () => void
  onSave: (updates: Partial<StoredDocument>) => void
}) {
  const [name, setName] = useState(doc.name)
  const [academicYear, setAcademicYear] = useState(doc.academicYear || '')
  const [cohort, setCohort] = useState(doc.cohort || '')
  const [className, setClassName] = useState(doc.className || '')
  const [trainingProgram, setTrainingProgram] = useState(doc.trainingProgram || '')
  const [customProgram, setCustomProgram] = useState('')
  const [showCustomProgram, setShowCustomProgram] = useState(false)
  const [programOptions, setProgramOptions] = useState(['Đại học', 'Cao đẳng', 'Liên thông', 'Nghề'])

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: currentYear - 2014 + 2 }, (_, i) => currentYear + 1 - i)

  useState(() => {
    if (doc.trainingProgram && !programOptions.includes(doc.trainingProgram)) {
      setProgramOptions(prev => [...prev, doc.trainingProgram!])
    }
  })

  const inputCls = "w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow placeholder-gray-400 dark:placeholder-slate-500"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-slate-700 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Chỉnh sửa tài liệu</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate max-w-[280px]">{doc.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Form fields */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Tên tài liệu</label>
            <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Tên tài liệu" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Chương trình đào tạo</label>
            <select
              value={showCustomProgram ? '__custom__' : trainingProgram}
              onChange={e => {
                if (e.target.value === '__custom__') { setShowCustomProgram(true); setTrainingProgram(''); setCustomProgram('') }
                else { setShowCustomProgram(false); setTrainingProgram(e.target.value); setCustomProgram('') }
              }}
              className={inputCls}
            >
              <option value="">-- Chọn CTĐT --</option>
              {programOptions.map(p => <option key={p} value={p}>{p}</option>)}
              <option value="__custom__">＋ Thêm mới...</option>
            </select>
            {showCustomProgram && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text" value={customProgram} onChange={e => setCustomProgram(e.target.value)}
                  placeholder="Nhập tên CTĐT mới" autoFocus className={`${inputCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = customProgram.trim()
                    if (val && !programOptions.includes(val)) setProgramOptions(prev => [...prev, val])
                    if (val) { setTrainingProgram(val); setShowCustomProgram(false); setCustomProgram('') }
                  }}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
                >
                  Thêm
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Năm học</label>
            <select value={academicYear} onChange={e => setAcademicYear(e.target.value)} className={inputCls}>
              <option value="">-- Chọn năm --</option>
              {yearOptions.map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Khóa</label>
              <input value={cohort} onChange={e => setCohort(e.target.value)} placeholder="VD: DA21, K47" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Lớp</label>
              <input value={className} onChange={e => setClassName(e.target.value)} placeholder="VD: DA21TYC" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex-shrink-0 bg-gray-50/50 dark:bg-slate-800">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 font-semibold rounded-xl border border-gray-200 dark:border-slate-600 transition-colors text-sm">
            Hủy
          </button>
          <button onClick={() => onSave({ name, academicYear, cohort, className, trainingProgram })} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm text-sm">
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  )
}