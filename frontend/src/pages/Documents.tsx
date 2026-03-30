import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import UploadModal from '../components/DocumentUpload/UploadModal'
import GoogleDriveModal from '../components/DocumentUpload/GoogleDriveModal'
import OCRReviewModal, { StudentRecord, ExtractMeta } from '../components/DocumentUpload/OCRReviewModal'
import { exportToExcel, exportPdfFormatToExcel } from '../utils/excelExport'
import { GoogleDriveFile } from '../hooks/useGoogleDrive'
import { docstoreApi } from '../services/api'

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

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'google_drive': return { label: 'Drive', color: 'bg-green-100 text-green-800' }
      case 'local': return { label: 'Local', color: 'bg-primary-100 text-primary-800' }
      default: return { label: 'Mẫu', color: 'bg-gray-100 text-gray-600' }
    }
  }

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
      if (metadata?.trainingProgram) message += ` - ${metadata.trainingProgram}`
      if (metadata?.academicYear) message += ` - Năm ${metadata.academicYear}`
      if (metadata?.cohort) message += ` - Khóa ${metadata.cohort}`
      if (metadata?.className) message += ` - Lớp ${metadata.className}`
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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">Quản lý Bảng điểm</h1>
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 mt-1">
            <span>📊 Bảng điểm</span>
            {selectedProgram && (<><span className="mx-1">›</span><span className="text-gray-700 dark:text-slate-300">{selectedProgram}</span></>)}
            {selectedYear && (<><span className="mx-1">›</span><span className="text-gray-700 dark:text-slate-300">Năm {selectedYear}</span></>)}
            <span className="text-gray-400 dark:text-slate-500 ml-2">({filteredDocuments.length} tài liệu)</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowUploadModal(true)} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors shadow-sm">
            📤 Tải lên
          </button>
          <button onClick={() => setShowGoogleDriveModal(true)} className="px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-medium rounded-xl transition-colors shadow-sm">
            🔗 Google Drive
          </button>
        </div>
      </div>

      {/* CTĐT filter */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">🎓 Chương trình đào tạo</h2>
          {selectedProgram && (
            <button onClick={() => { setSelectedProgram(null); setSelectedYear(null) }} className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              Xem tất cả
            </button>
          )}
        </div>
        <div className="p-3 flex flex-wrap gap-2">
          <button
            onClick={() => { setSelectedProgram(null); setSelectedYear(null) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!selectedProgram ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
          >
            Tất cả ({documents.length})
          </button>
          {programFolders.map(prog => (
            <button
              key={prog}
              onClick={() => { setSelectedProgram(prog); setSelectedYear(null) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedProgram === prog ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
            >
              {prog} ({countDocsForProgram(prog)})
            </button>
          ))}
        </div>

        {selectedProgram && yearFolders.length > 0 && (
          <div className="px-3 pb-3 flex flex-wrap gap-2 border-t border-gray-100 dark:border-slate-700 pt-2">
            <span className="text-xs text-gray-500 dark:text-slate-400 self-center mr-1">📅 Năm:</span>
            <button
              onClick={() => setSelectedYear(null)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${!selectedYear ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
            >
              Tất cả
            </button>
            {yearFolders.map(year => (
              <div key={year} className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedYear(year)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${selectedYear === year ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
                >
                  {year} ({countDocsForYear(year)})
                </button>
                <button
                  onClick={async () => {
                    const count = documents.filter(doc => {
                      const docProg = doc.trainingProgram || ''
                      const docYear = doc.academicYear || doc.uploaded_at?.substring(0, 4) || ''
                      return docProg === selectedProgram && docYear === year
                    }).length
                    if (!window.confirm(`Bạn có chắc chắn muốn xóa tất cả ${count} tài liệu của năm ${year}?`)) return
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
                    } catch (e) { console.error('Delete year failed:', e); toast.error('Xóa thất bại') }
                  }}
                  className="px-2 py-1 rounded-md text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                  title={`Xóa tất cả tài liệu của năm ${year}`}
                >
                  🗑️
                </button>
              </div>
            ))}
            <button
              onClick={async () => {
                const count = documents.filter(doc => (doc.trainingProgram || '') === selectedProgram).length
                if (!window.confirm(`Bạn có chắc chắn muốn xóa tất cả ${count} tài liệu của chương trình "${selectedProgram}"?`)) return
                try {
                  const docsToDelete = documents.filter(doc => (doc.trainingProgram || '') === selectedProgram)
                  for (const doc of docsToDelete) await docstoreApi.delete(doc._id)
                  setDocuments(prev => prev.filter(d => (d.trainingProgram || '') !== selectedProgram))
                  setStudentRecords(prev => prev.filter(r => !docsToDelete.some(d => d._id === r.docId)))
                  setSelectedProgram(null); setSelectedYear(null)
                  toast.success(`Đã xóa ${count} tài liệu`)
                } catch (e) { console.error('Delete all failed:', e); toast.error('Xóa thất bại') }
              }}
              className="ml-auto px-3 py-1 rounded-md text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
            >
              🗑️ Xóa tất cả
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 space-y-3 transition-colors">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
            <input
              type="text"
              placeholder="Tìm tên file, tên sinh viên, MSSV hoặc lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            )}
          </div>
          <button
            onClick={async () => {
              try {
                const [docsRes, recsRes] = await Promise.all([docstoreApi.list(), docstoreApi.listStudentRecords()])
                setDocuments(docsRes.data.data || []); setStudentRecords(recsRes.data.data || [])
                toast.success('Đã làm mới')
              } catch { toast.error('Làm mới thất bại') }
            }}
            className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 font-medium rounded-xl transition-colors text-sm whitespace-nowrap"
          >
            🔄 Làm mới
          </button>
        </div>

        {q && (
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            <span className="bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full border border-primary-200">
              📄 {filteredDocuments.length} tài liệu phù hợp
            </span>
            {matchedStudents.length > 0 && (
              <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-200">
                👤 {matchedStudents.length} sinh viên phù hợp
              </span>
            )}
          </div>
        )}

        {matchedStudents.length > 0 && (() => {
          const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const highlight = (text: string) =>
            text.split(new RegExp(`(${esc})`, 'gi')).map((part, i) =>
              part.toLowerCase() === q
                ? <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">{part}</mark>
                : part
            )
          return (
            <div className="border border-purple-200 rounded-lg bg-white overflow-hidden">
              <div className="px-4 py-2 bg-purple-50 text-purple-800 text-sm font-semibold flex items-center gap-2">
                👤 Sinh viên — {matchedStudents.length} kết quả
                <span className="text-purple-500 font-normal text-xs">(tìm theo tên · MSSV · lớp)</span>
              </div>
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-purple-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-purple-700 uppercase tracking-wide">STT</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-purple-700 uppercase tracking-wide">Họ và Tên</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-purple-700 uppercase tracking-wide">MSSV</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-purple-700 uppercase tracking-wide">Lớp</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-purple-700 uppercase tracking-wide">Điểm QP</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-purple-700 uppercase tracking-wide">Kết quả</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-purple-700 uppercase tracking-wide">Tài liệu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {matchedStudents.map((r, idx) => (
                      <tr key={idx} className="hover:bg-purple-50 transition-colors">
                        <td className="px-3 py-2 text-gray-400 text-xs">{r.stt}</td>
                        <td className="px-3 py-2 font-medium text-gray-800">{highlight(r.ho_ten)}</td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-700">{highlight(r.mssv)}</td>
                        <td className="px-3 py-2 text-gray-700">{highlight(r.lop)}</td>
                        <td className="px-3 py-2 text-center font-semibold text-gray-800">{r.diem_qp}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.ket_qua === 'Đạt' ? 'bg-green-100 text-green-800' : r.ket_qua === 'Không đạt' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
                            {r.ket_qua || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500 text-xs truncate max-w-[180px]" title={r.docName}>📄 {r.docName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Table + Side Preview */}
      <div className="flex gap-4 h-[calc(100vh-18rem)]">
        {/* Table */}
        <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col transition-colors ${quickPreviewDoc ? 'w-1/3 xl:w-[45%]' : 'w-full'}`}>
          <div className="flex flex-col h-full overflow-hidden">
            {/* ── Fixed header ── */}
            <table className="w-full text-sm flex-shrink-0">
              <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">Tên file</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide w-24">Nguồn</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide w-32">Ngày</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">Hành động</th>
                </tr>
              </thead>
            </table>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <tbody>
                  {filteredDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">
                        Không có tài liệu nào
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments.map((doc) => {
                      const sourceBadge = getSourceBadge(doc.source)
                      return (
                        <tr
                          key={doc._id}
                          onClick={() => handleRowClick(doc)}
                          onDoubleClick={() => handleRowDoubleClick(doc)}
                          className={`border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${quickPreviewDoc?._id === doc._id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                        >
                          {/* Tên file */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-base flex-shrink-0">
                                {doc.mimeType?.includes('pdf') ? '📄' : doc.mimeType?.includes('spreadsheet') || doc.mimeType?.includes('excel') ? '📊' : '📎'}
                              </span>
                              <span className="font-medium text-gray-800 dark:text-slate-200 truncate max-w-[220px]" title={doc.name}>
                                {q
                                  ? doc.name.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')).map((part, i) =>
                                      part.toLowerCase() === q
                                        ? <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">{part}</mark>
                                        : part
                                    )
                                  : doc.name
                                }
                              </span>
                            </div>
                          </td>

                          {/* Nguồn */}
                          <td className="px-4 py-3 w-24">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sourceBadge.color}`}>
                              {sourceBadge.label}
                            </span>
                          </td>

                          {/* Ngày */}
                          <td className="px-4 py-3 w-32 text-sm text-gray-500 dark:text-slate-400 whitespace-nowrap">
                            {doc.uploaded_at}
                          </td>

                          {/* Hành động */}
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-2">
                              {/* Nút chính: Xem */}
                              <button
                                onClick={() => handleViewFile(doc)}
                                className="px-3 py-1.5 text-xs bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                                title="Xem file"
                              >
                                👁️ Xem
                              </button>
                              
                              {/* Nút Excel nếu đã có dữ liệu */}
                              {(() => {
                                const docRecs = studentRecords.filter(r => r.docId === doc._id)
                                if (docRecs.length === 0) return null
                                return (
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
                                    className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                                    title={`Xuất Excel (${docRecs.length} bản ghi)`}
                                  >
                                    📥 Excel
                                  </button>
                                )
                              })()}
                              
                              {/* Menu dropdown cho các hành động phụ */}
                              <div className="relative group">
                                <button
                                  className="px-2 py-1.5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                  title="Thêm hành động"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                                    <circle cx="8" cy="3" r="1.5"/>
                                    <circle cx="8" cy="8" r="1.5"/>
                                    <circle cx="8" cy="13" r="1.5"/>
                                  </svg>
                                </button>
                                
                                {/* Dropdown menu */}
                                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                  <div className="py-1">
                                    <button
                                      onClick={() => handleDownloadFile(doc)}
                                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                    >
                                      <span>⬇️</span>
                                      <span>Tải xuống</span>
                                    </button>
                                    
                                    {doc.source === 'google_drive' && doc.webViewLink && (
                                      <a
                                        href={doc.webViewLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                      >
                                        <span>🔗</span>
                                        <span>Mở trong Drive</span>
                                      </a>
                                    )}
                                    
                                    <button
                                      onClick={() => setEditDoc(doc)}
                                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                    >
                                      <span>✏️</span>
                                      <span>Chỉnh sửa</span>
                                    </button>
                                    
                                    <div className="border-t border-gray-200 dark:border-slate-700 my-1"></div>
                                    
                                    <button
                                      onClick={() => handleDeleteDoc(doc._id)}
                                      className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                    >
                                      <span>🗑️</span>
                                      <span>Xóa</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Side Preview Panel */}
        {quickPreviewDoc && (
          <div className="w-2/3 xl:w-[55%] flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary-200 dark:border-primary-700 overflow-hidden transition-all">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-slate-700 bg-primary-50 dark:bg-primary-900/20 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span>{quickPreviewDoc.mimeType?.includes('pdf') ? '📄' : '📊'}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{quickPreviewDoc.name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500">{quickPreviewDoc.uploaded_at}{quickPreviewDoc.type ? ` • ${quickPreviewDoc.type}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => { handleViewFile(quickPreviewDoc); setQuickPreviewDoc(null); setQuickPreviewUrl(null) }}
                  className="px-2.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Xem đầy đủ
                </button>
                <button
                  onClick={() => handleDownloadFile(quickPreviewDoc)}
                  className="px-2.5 py-1.5 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-800/30 text-purple-700 dark:text-purple-400 text-xs font-medium rounded-lg transition-colors"
                >
                  ⬇️ Tải
                </button>
                <button
                  onClick={() => { setQuickPreviewDoc(null); setQuickPreviewUrl(null) }}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-slate-900 relative">
              {quickPreviewUrl ? (
                <iframe src={quickPreviewUrl} className="w-full h-full border-0" title={quickPreviewDoc.name} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-slate-500">
                  <svg className="w-16 h-16 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">Không thể xem trước file này</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
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

      {previewDoc && (
        <div className="fixed inset-0 bg-white dark:bg-slate-900 z-50 flex flex-col">
          <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between shrink-0 bg-gray-50 dark:bg-slate-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white truncate pr-4">
              {previewDoc.mimeType?.includes('pdf') ? '📄' : '📊'} {previewDoc.name}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => handleDownloadFile(previewDoc)} className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
                ⬇️ Tải xuống
              </button>
              {previewDoc.source === 'google_drive' && previewDoc.webViewLink && (
                <a href={previewDoc.webViewLink} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
                  🔗 Mở trong Drive
                </a>
              )}
              <button onClick={closePreview} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white text-2xl px-2">✕</button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-slate-950">
            {previewUrl ? (
              <iframe src={previewUrl} className="w-full h-full border-0" title={previewDoc.name} allow="autoplay" />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <p className="text-lg mb-2">Không thể xem trước file này</p>
                  {previewDoc.webViewLink && (
                    <a href={previewDoc.webViewLink} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
                      Mở trong Google Drive →
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {editDoc && (
        <EditDocModal doc={editDoc} onClose={() => setEditDoc(null)} onSave={(updates) => handleEditDoc(editDoc._id, updates)} />
      )}
    </div>
  )
}

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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 border border-gray-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Sửa bảng điểm</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-white text-2xl">&times;</button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Tên tài liệu</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Chương trình đào tạo</label>
            <select
              value={showCustomProgram ? '__custom__' : trainingProgram}
              onChange={e => {
                if (e.target.value === '__custom__') { setShowCustomProgram(true); setTrainingProgram(''); setCustomProgram('') }
                else { setShowCustomProgram(false); setTrainingProgram(e.target.value); setCustomProgram('') }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">-- Chọn CTĐT --</option>
              {programOptions.map(p => <option key={p} value={p}>{p}</option>)}
              <option value="__custom__">＋ Thêm mới...</option>
            </select>
            {showCustomProgram && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text" value={customProgram} onChange={e => setCustomProgram(e.target.value)}
                  placeholder="Nhập tên CTĐT mới" autoFocus
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = customProgram.trim()
                    if (val && !programOptions.includes(val)) setProgramOptions(prev => [...prev, val])
                    if (val) { setTrainingProgram(val); setShowCustomProgram(false); setCustomProgram('') }
                  }}
                  className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Thêm
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Năm học</label>
            <select value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">-- Chọn năm --</option>
              {yearOptions.map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Khóa</label>
              <input value={cohort} onChange={e => setCohort(e.target.value)} placeholder="VD: DA21, K47" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Lớp</label>
              <input value={className} onChange={e => setClassName(e.target.value)} placeholder="VD: DA21TYC" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-700 sticky bottom-0 bg-white dark:bg-slate-800 -mx-6 px-6 -mb-6 pb-6">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 font-medium rounded-xl transition-colors">Hủy</button>
            <button onClick={() => onSave({ name, academicYear, cohort, className, trainingProgram })} className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors">Lưu thay đổi</button>
          </div>
        </div>
      </div>
    </div>
  )
}