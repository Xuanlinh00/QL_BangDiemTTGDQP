import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import UploadModal from '../components/DocumentUpload/UploadModal'
import GoogleDriveModal from '../components/DocumentUpload/GoogleDriveModal'
import OCRReviewModal, { StudentRecord, ExtractMeta } from '../components/DocumentUpload/OCRReviewModal'
import { exportToExcel, exportPdfFormatToExcel } from '../utils/excelExport'
import { GoogleDriveFile } from '../hooks/useGoogleDrive'

// ══════════════════════════════════════
// IndexedDB helpers — persist local file blobs
// ══════════════════════════════════════
const IDB_NAME = 'tvu_file_store'
const IDB_STORE = 'files'

function openFileDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function saveFileBlob(docId: number, blob: Blob): Promise<void> {
  const db = await openFileDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(blob, docId)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

async function loadFileBlob(docId: number): Promise<Blob | undefined> {
  const db = await openFileDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly')
    const req = tx.objectStore(IDB_STORE).get(docId)
    req.onsuccess = () => { db.close(); resolve(req.result) }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

async function deleteFileBlob(docId: number): Promise<void> {
  const db = await openFileDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).delete(docId)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

// ══════════════════════════════════════
// Google Drive download helper (standalone, no hook needed)
// ══════════════════════════════════════
async function downloadDriveFile(
  fileId: string,
  fileName: string,
  mimeType?: string
) {
  const token = sessionStorage.getItem('gdrive_access_token')
  if (!token) {
    toast.error('Chưa đăng nhập Google Drive. Hãy mở Google Drive modal và đăng nhập trước.')
    return
  }

  const toastId = toast.loading(`Đang tải: ${fileName}...`)
  try {
    let url: string
    let finalName = fileName

    // Google Workspace files cần export, không dùng alt=media
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

    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
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

// ══════════════════════════════════════
// Document types & persistence
// ══════════════════════════════════════
interface StoredDocument {
  id: number
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
}

const STORAGE_KEY = 'tvu_documents'
const STUDENT_STORAGE_KEY = 'tvu_student_records'

// ══════════════════════════════════════
// Student record persistence
// ══════════════════════════════════════
interface StoredStudentRecord {
  docId: number
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

function loadStudentRecords(): StoredStudentRecord[] {
  try {
    const raw = localStorage.getItem(STUDENT_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveStudentRecords(records: StoredStudentRecord[]) {
  localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(records))
}

function loadDocuments(): StoredDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return [
    { id: 1, name: 'DA21TYC.pdf', folder: 'DA21', type: 'DSGD', pages: 12, ocr_status: 'Completed', extract_status: 'Completed', uploaded_at: '2024-03-01', source: 'mock' },
    { id: 2, name: 'QD_275_2015.pdf', folder: 'QD', type: 'QD', pages: 3, ocr_status: 'Completed', extract_status: 'Completed', uploaded_at: '2024-02-28', source: 'mock' },
    { id: 3, name: 'DA20LD.pdf', folder: 'DA20', type: 'DSGD', pages: 15, ocr_status: 'Processing', extract_status: 'Pending', uploaded_at: '2024-02-27', source: 'mock' },
    { id: 4, name: 'danh_muc_2025.xlsx', folder: 'KeHoach', type: 'KeHoach', pages: 0, ocr_status: 'N/A', extract_status: 'Completed', uploaded_at: '2024-02-26', source: 'mock' },
  ]
}

function saveDocuments(docs: StoredDocument[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
}

// Runtime blob URL cache (for current session)
const blobUrlCache = new Map<number, string>()

export default function Documents() {
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') ?? '')
  const [filterType, setFilterType] = useState('all')
  const [studentRecords, setStudentRecords] = useState<StoredStudentRecord[]>(loadStudentRecords)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showGoogleDriveModal, setShowGoogleDriveModal] = useState(false)
  const [documents, setDocuments] = useState<StoredDocument[]>(loadDocuments)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<StoredDocument | null>(null)
  const [previewLoading] = useState(false) // reserved for future async Drive preview loading

  // ── OCR Review state ──
  const [showOCRReview, setShowOCRReview] = useState(false)
  const [ocrReviewDoc, setOcrReviewDoc] = useState<StoredDocument | null>(null)
  const [ocrPdfUrl, setOcrPdfUrl] = useState<string | null>(null)
  const [ocrFileBlob, setOcrFileBlob] = useState<Blob | null>(null)

  // Sync URL param ?q= into search input whenever URL changes (e.g. from header search)
  useEffect(() => {
    const qParam = searchParams.get('q')
    if (qParam !== null) setSearchTerm(qParam)
  }, [searchParams])

  // Persist documents whenever they change
  useEffect(() => {
    saveDocuments(documents)
  }, [documents])

  const q = searchTerm.trim().toLowerCase()

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = q === '' || doc.name.toLowerCase().includes(q)
    const matchesType = filterType === 'all' || doc.type === filterType
    return matchesSearch && matchesType
  })

  const matchedStudents = q === '' ? [] : studentRecords.filter(
    r => r.ho_ten.toLowerCase().includes(q)
      || r.mssv.toLowerCase().includes(q)
      || r.lop.toLowerCase().includes(q)
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Processing': return 'bg-yellow-100 text-yellow-800'
      case 'Error': return 'bg-red-100 text-red-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'google_drive': return { label: 'Drive', color: 'bg-green-100 text-green-800' }
      case 'local': return { label: 'Local', color: 'bg-blue-100 text-blue-800' }
      default: return { label: 'Mẫu', color: 'bg-gray-100 text-gray-600' }
    }
  }

  // ── Upload local files → IndexedDB ──
  const handleUploadFiles = useCallback(async (files: File[]) => {
    const nextId = documents.length > 0 ? Math.max(...documents.map(d => d.id)) + 1 : 1
    const newDocs: StoredDocument[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const docId = nextId + i

      // Store actual file blob in IndexedDB
      try {
        await saveFileBlob(docId, file)
      } catch (e) {
        console.warn('[Upload] IndexedDB save failed for', file.name, e)
      }

      // Also cache a blob URL for immediate viewing
      const blobUrl = URL.createObjectURL(file)
      blobUrlCache.set(docId, blobUrl)

      newDocs.push({
        id: docId,
        name: file.name,
        folder: 'Upload',
        type: file.name.endsWith('.pdf') ? 'DSGD' : 'KeHoach',
        pages: 0,
        ocr_status: 'Pending',
        extract_status: 'Pending',
        uploaded_at: new Date().toISOString().split('T')[0],
        mimeType: file.type,
        source: 'local',
      })
    }

    setDocuments(prev => [...prev, ...newDocs])
    toast.success(`Đã tải lên ${files.length} file`)
  }, [documents])

  // ── Import from Google Drive ──
  const handleGoogleDriveSelect = useCallback((files: GoogleDriveFile[]) => {
    const nextId = documents.length > 0 ? Math.max(...documents.map(d => d.id)) + 1 : 1
    const newDocs: StoredDocument[] = files.map((file, index) => ({
      id: nextId + index,
      name: file.name,
      folder: 'GoogleDrive',
      type: file.mimeType?.includes('pdf') ? 'DSGD'
        : (file.mimeType?.includes('spreadsheet') || file.mimeType?.includes('excel')) ? 'KeHoach'
        : 'DSGD',
      pages: 0,
      ocr_status: 'Pending',
      extract_status: 'Pending',
      uploaded_at: file.createdTime
        ? new Date(file.createdTime).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      driveFileId: file.id,
      webViewLink: file.webViewLink,
      mimeType: file.mimeType,
      source: 'google_drive' as const,
    }))
    setDocuments(prev => [...prev, ...newDocs])
    toast.success(`Đã nhập ${files.length} file từ Google Drive`)
  }, [documents])

  // ── Helper: get or restore blob URL from IndexedDB ──
  const getBlobUrl = useCallback(async (docId: number): Promise<string | null> => {
    // 1. Check in-memory cache
    if (blobUrlCache.has(docId)) return blobUrlCache.get(docId)!
    // 2. Load from IndexedDB
    try {
      const blob = await loadFileBlob(docId)
      if (blob) {
        const url = URL.createObjectURL(blob)
        blobUrlCache.set(docId, url)
        return url
      }
    } catch (e) {
      console.error('[BlobUrl] IndexedDB load failed:', e)
    }
    return null
  }, [])

  // ── View file ──
  const handleViewFile = useCallback(async (doc: StoredDocument) => {
    // Local file → open blob URL directly in new tab (most reliable cross-browser)
    if (doc.source === 'local') {
      const toastId = toast.loading('Đang mở file...')
      const url = await getBlobUrl(doc.id)
      if (url) {
        toast.dismiss(toastId)
        window.open(url, '_blank', 'noopener')
      } else {
        toast.error('File không còn trong bộ nhớ. Vui lòng upload lại.', { id: toastId })
      }
      return
    }

    // Google Drive file → iframe embed preview in modal
    if (doc.source === 'google_drive' && doc.driveFileId) {
      let url: string
      if (doc.mimeType?.startsWith('application/vnd.google-apps.')) {
        if (doc.mimeType.includes('spreadsheet'))
          url = `https://docs.google.com/spreadsheets/d/${doc.driveFileId}/preview`
        else if (doc.mimeType.includes('document'))
          url = `https://docs.google.com/document/d/${doc.driveFileId}/preview`
        else if (doc.mimeType.includes('presentation'))
          url = `https://docs.google.com/presentation/d/${doc.driveFileId}/preview`
        else
          url = `https://drive.google.com/file/d/${doc.driveFileId}/preview`
      } else {
        url = `https://drive.google.com/file/d/${doc.driveFileId}/preview`
      }
      setPreviewDoc(doc)
      setPreviewUrl(url)
      return
    }

    // Mock data
    toast('File mẫu không có nội dung để xem', { icon: 'ℹ️' })
  }, [getBlobUrl])

  // ── Close preview ──
  const closePreview = useCallback(() => {
    setPreviewDoc(null)
    setPreviewUrl(null)
  }, [])

  // ── Download file ──
  const handleDownloadFile = useCallback(async (doc: StoredDocument) => {
    if (doc.source === 'google_drive' && doc.driveFileId) {
      await downloadDriveFile(doc.driveFileId, doc.name, doc.mimeType)
      return
    }

    if (doc.source === 'local') {
      // Try cache first, then IndexedDB
      let blobUrl = blobUrlCache.get(doc.id)
      if (!blobUrl) {
        try {
          const blob = await loadFileBlob(doc.id)
          if (blob) {
            blobUrl = URL.createObjectURL(blob)
            blobUrlCache.set(doc.id, blobUrl)
          }
        } catch {}
      }
      if (blobUrl) {
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = doc.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success(`Đã tải: ${doc.name}`)
      } else {
        toast.error('File không còn trong bộ nhớ')
      }
      return
    }

    toast('File mẫu không có nội dung để tải', { icon: 'ℹ️' })
  }, [])

  // ── Delete document ──
  const handleDeleteDoc = useCallback(async (docId: number) => {
    // Revoke blob URL from cache
    if (blobUrlCache.has(docId)) {
      URL.revokeObjectURL(blobUrlCache.get(docId)!)
      blobUrlCache.delete(docId)
    }
    // Remove from IndexedDB
    try { await deleteFileBlob(docId) } catch {}
    setDocuments(prev => prev.filter(d => d.id !== docId))
    toast.success('Đã xóa tài liệu')
  }, [])

  // ── Open OCR Review Modal ──
  const handleOpenOCRReview = useCallback(async (doc: StoredDocument) => {
    let pdfUrl: string | null = null
    let fileBlob: Blob | null = null

    if (doc.source === 'local') {
      // Lấy blob từ IndexedDB — dùng để đọc nội dung PDF và hiển thị xem trước
      try {
        fileBlob = await loadFileBlob(doc.id) ?? null
        if (fileBlob) {
          const url = URL.createObjectURL(fileBlob)
          blobUrlCache.set(doc.id, url)
          pdfUrl = url
        }
      } catch (e) {
        console.warn('[OCR] Could not load blob:', e)
      }
    } else if (doc.source === 'google_drive' && doc.driveFileId) {
      pdfUrl = `https://drive.google.com/file/d/${doc.driveFileId}/preview`
    }

    setOcrFileBlob(fileBlob)
    setOcrReviewDoc(doc)
    setOcrPdfUrl(pdfUrl)
    setShowOCRReview(true)
  }, [])

  const handleOCRSave = useCallback((records: StudentRecord[], _meta: ExtractMeta) => {
    if (!ocrReviewDoc) return
    setDocuments(prev => prev.map(d =>
      d.id === ocrReviewDoc.id
        ? { ...d, ocr_status: 'Completed', extract_status: 'Completed' }
        : d
    ))
    // Persist student records for search
    setStudentRecords(prev => {
      const filtered = prev.filter(r => r.docId !== ocrReviewDoc.id)
      const newRecords: StoredStudentRecord[] = records.map(r => ({
        docId: ocrReviewDoc.id,
        docName: ocrReviewDoc.name,
        ...r,
      }))
      const updated = [...filtered, ...newRecords]
      saveStudentRecords(updated)
      return updated
    })
    toast.success(`Đã xác nhận ${records.length} bản ghi`)
    // Tự động xuất Excel ngay sau khi xác nhận
    if (records.length > 0) {
      setTimeout(() => {
        exportPdfFormatToExcel(records, _meta, ocrReviewDoc.name, ocrReviewDoc.type as 'DSGD' | 'QD' | 'KeHoach')
        toast.success(`Đã xuất Excel: ${ocrReviewDoc.name.replace(/\.pdf$/i, '')}.xlsx`)
      }, 300)
    }
  }, [ocrReviewDoc])

  // ── Export Excel from Node backend (structured DB records) ──
  const handleExportExcelDB = useCallback(() => {
    const url = '/api/documents/export/excel'
    const a = document.createElement('a')
    a.href = url
    a.download = `export_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('Đang tải file Excel từ database...')
  }, [])

  // ── Export Excel (local metadata only) ──
  const handleExportToExcel = () => {
    const exportData = filteredDocuments.map(doc => ({
      'Tên file': doc.name,
      'Thư mục': doc.folder,
      'Loại': doc.type,
      'Nguồn': doc.source === 'google_drive' ? 'Google Drive' : doc.source === 'local' ? 'Tải lên' : 'Mẫu',
      'Trang': doc.pages || 'N/A',
      'Trạng thái OCR': doc.ocr_status,
      'Trạng thái Extract': doc.extract_status,
      'Ngày upload': doc.uploaded_at,
    }))
    exportToExcel(exportData, {
      fileName: `documents_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Tài liệu',
    })
    toast.success('Đã xuất file Excel')
  }

  // ── Stats ──
  const stats = {
    total: documents.length,
    completed: documents.filter(d => d.ocr_status === 'Completed').length,
    processing: documents.filter(d => d.ocr_status === 'Processing').length,
    error: documents.filter(d => d.ocr_status === 'Error').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản lý Tài liệu</h1>
          <p className="text-gray-600 mt-1">Tổng: {documents.length} tài liệu</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            📤 Tải lên
          </button>
          <button
            onClick={() => setShowGoogleDriveModal(true)}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            🔗 Google Drive
          </button>
          <button
            onClick={handleExportToExcel}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
          >
            📊 Xuất Excel
          </button>
          <button
            onClick={handleExportExcelDB}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            title="Xuất Excel từ dữ liệu đã OCR và xác nhận"
          >
            🏦 Xuất Excel (DB)
          </button>
        </div>
      </div>

      {/* Search / Filter */}
      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Unified search input */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
            <input
              type="text"
              placeholder="Tìm tên file, tên sinh viên, MSSV hoặc lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
              >×</button>
            )}
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">Tất cả loại</option>
            <option value="DSGD">Danh sách điểm</option>
            <option value="QD">Quyết định</option>
            <option value="KeHoach">Kế hoạch</option>
          </select>
          <button
            onClick={() => { setDocuments(loadDocuments()); setStudentRecords(loadStudentRecords()); toast.success('Đã làm mới') }}
            className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors text-sm whitespace-nowrap"
          >
            🔄 Làm mới
          </button>
        </div>

        {/* Search summary chips */}
        {q && (
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
              📄 {filteredDocuments.length} tài liệu phù hợp
            </span>
            {matchedStudents.length > 0 && (
              <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-200">
                👤 {matchedStudents.length} sinh viên phù hợp
              </span>
            )}
          </div>
        )}

        {/* Student search results — shown whenever there are matches */}
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
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            r.ket_qua === 'Đạt' ? 'bg-green-100 text-green-800' :
                            r.ket_qua === 'Không đạt' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>{r.ket_qua || '—'}</span>
                        </td>
                        <td className="px-3 py-2 text-gray-500 text-xs truncate max-w-[180px]" title={r.docName}>
                          📄 {r.docName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tên file</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Nguồn</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Loại</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">OCR</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Extract</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ngày</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Không có tài liệu nào</td></tr>
            ) : (
              filteredDocuments.map((doc) => {
                const sourceBadge = getSourceBadge(doc.source)
                return (
                  <tr key={doc.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{doc.mimeType?.includes('pdf') ? '📄' : doc.mimeType?.includes('spreadsheet') || doc.mimeType?.includes('excel') ? '📊' : '📎'}</span>
                        <span className="font-medium text-gray-800 truncate max-w-[200px]" title={doc.name}>
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
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sourceBadge.color}`}>
                        {sourceBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.ocr_status)}`}>
                        {doc.ocr_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.extract_status)}`}>
                        {doc.extract_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{doc.uploaded_at}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenOCRReview(doc)}
                          className="px-2 py-1 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded font-medium transition-colors"
                          title="OCR & Xem xét dữ liệu"
                        >
                          🔬 OCR
                        </button>
                        {(() => {
                          const docRecs = studentRecords.filter(r => r.docId === doc.id)
                          if (docRecs.length === 0) return null
                          return (
                            <button
                              onClick={() => {
                                exportPdfFormatToExcel(docRecs, {
                                  lop: docRecs[0]?.lop,
                                  total_records: docRecs.length,
                                  so_dat: docRecs.filter(r => r.ket_qua === 'Đạt').length,
                                  so_khong_dat: docRecs.filter(r => r.ket_qua === 'Không đạt').length,
                                }, doc.name, doc.type as 'DSGD' | 'QD' | 'KeHoach')
                                toast.success(`Đã xuất Excel: ${doc.name.replace(/\.pdf$/i, '')}.xlsx`)
                              }}
                              className="px-2 py-1 text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded font-medium transition-colors"
                              title={`Xuất Excel (${docRecs.length} bản ghi)`}
                            >
                              📥 Excel
                            </button>
                          )
                        })()}
                        <button
                          onClick={() => handleViewFile(doc)}
                          className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded font-medium transition-colors"
                          title="Xem file"
                        >
                          👁️ Xem
                        </button>
                        <button
                          onClick={() => handleDownloadFile(doc)}
                          className="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded font-medium transition-colors"
                          title="Tải file"
                        >
                          ⬇️ Tải
                        </button>
                        {doc.source === 'google_drive' && doc.webViewLink && (
                          <a
                            href={doc.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-medium transition-colors"
                            title="Mở trong Drive"
                          >
                            🔗
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded font-medium transition-colors"
                          title="Xóa"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-gray-600 text-sm">Tổng file</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-gray-600 text-sm">Hoàn tất</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.processing}</p>
          <p className="text-gray-600 text-sm">Đang xử lý</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.error}</p>
          <p className="text-gray-600 text-sm">Lỗi</p>
        </div>
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUploadFiles}
      />
      <GoogleDriveModal
        isOpen={showGoogleDriveModal}
        onClose={() => setShowGoogleDriveModal(false)}
        onSelect={handleGoogleDriveSelect}
      />

      {/* ── OCR Review Modal ── */}
      {ocrReviewDoc && (
        <OCRReviewModal
          isOpen={showOCRReview}
          onClose={() => { setShowOCRReview(false); setOcrReviewDoc(null); setOcrFileBlob(null) }}
          pdfUrl={ocrPdfUrl}
          fileBlob={ocrFileBlob}
          docName={ocrReviewDoc.name}
          docId={String(ocrReviewDoc.id)}
          docType={(ocrReviewDoc.type as 'DSGD' | 'QD' | 'KeHoach') || 'DSGD'}
          workerUrl="http://localhost:8000"
          onSave={handleOCRSave}
        />
      )}

      {/* ── File Preview Modal ── */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full mx-4 max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-gray-800 truncate pr-4">
                {previewDoc.mimeType?.includes('pdf') ? '📄' : '📊'} {previewDoc.name}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownloadFile(previewDoc)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded transition-colors"
                >
                  ⬇️ Tải xuống
                </button>
                {previewDoc.source === 'google_drive' && previewDoc.webViewLink && (
                  <a
                    href={previewDoc.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                  >
                    🔗 Mở trong Drive
                  </a>
                )}
                <button
                  onClick={closePreview}
                  className="text-gray-500 hover:text-gray-700 text-2xl px-2"
                >
                  ✕
                </button>
              </div>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-hidden bg-gray-100">
              {previewLoading ? (
                <div className="flex items-center justify-center h-full min-h-[50vh]">
                  <div className="text-center text-gray-500">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
                    Đang tải file...
                  </div>
                </div>
              ) : previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full min-h-[75vh] border-0"
                  title={previewDoc.name}
                  allow="autoplay"
                />
              ) : (
                <div className="flex items-center justify-center h-full min-h-[40vh] text-gray-500">
                  <div className="text-center">
                    <p className="text-lg mb-2">Không thể xem trước file này</p>
                    {previewDoc.webViewLink && (
                      <a href={previewDoc.webViewLink} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:underline">
                        Mở trong Google Drive →
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
