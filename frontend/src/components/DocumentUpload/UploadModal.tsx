import { useState } from 'react'
import toast from 'react-hot-toast'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (files: File[], documentType: string, metadata?: DocumentMetadata) => void
}

interface DocumentMetadata {
  academicYear?: string
  cohort?: string
  className?: string
  trainingProgram?: string
}

// ─── Auto-parse filename to extract metadata ──────────────────────────────────
interface ParsedMetadata {
  trainingProgram?: string
  cohort?: string
  academicYear?: string
  className?: string
}

function parseFilenameMetadata(filename: string): ParsedMetadata {
  const result: ParsedMetadata = {}
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')

  // Pattern: DA22, CA22, DF22, DE22, VB22, etc.
  const prefixMatch = nameWithoutExt.match(/^([A-Z]{2})(\d{2})/i)

  if (prefixMatch) {
    const prefix = prefixMatch[1].toUpperCase()
    const yearNum = parseInt(prefixMatch[2], 10)

    if (prefix === 'DA') result.trainingProgram = 'Đại học'
    else if (prefix === 'CA') result.trainingProgram = 'Cao đẳng'
    else if (['DF', 'DE', 'VB'].includes(prefix)) result.trainingProgram = 'Liên thông'

    result.cohort = `${prefix}${yearNum}`
    const fullYear = yearNum <= 30 ? 2000 + yearNum : 1900 + yearNum
    result.academicYear = String(fullYear)

    const classMatch = nameWithoutExt.match(/^[A-Z]{2}\d{2}([A-Z0-9]+)/i)
    result.className = classMatch?.[1]
      ? `${prefix}${yearNum}${classMatch[1]}`
      : `${prefix}${yearNum}`
  }

  return result
}

function FileTypeIcon({ type }: { type: string }) {
  const isPdf = type === 'application/pdf'
  return (
    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${isPdf ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
      {isPdf ? 'PDF' : 'XLS'}
    </span>
  )
}

export default function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files))
  }

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ]
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} không phải PDF hoặc Excel`)
        return false
      }
      return true
    })
    setUploadedFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = () => {
    if (uploadedFiles.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 file')
      return
    }
    // Each file gets its own auto-parsed metadata from its filename
    uploadedFiles.forEach(file => {
      const parsed = parseFilenameMetadata(file.name)
      onUpload([file], 'DSGD', {
        academicYear: parsed.academicYear,
        cohort: parsed.cohort,
        className: parsed.className,
        trainingProgram: parsed.trainingProgram,
      })
    })
    setUploadedFiles([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Tải bảng điểm lên</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Thông tin tự động phân loại từ tên file</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.01]'
                : 'border-gray-200 dark:border-slate-600 bg-gray-50/60 dark:bg-slate-700/30 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${dragActive ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'bg-gray-100 dark:bg-slate-700'}`}>
                <svg className={`w-7 h-7 transition-colors ${dragActive ? 'text-indigo-500' : 'text-gray-400 dark:text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                  {dragActive ? 'Thả file vào đây' : 'Kéo thả file vào đây'}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">PDF, Excel (.xlsx, .xls)</p>
              </div>
              <label className="mt-1 cursor-pointer">
                <span className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors inline-block">
                  Chọn file
                </span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* File list */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                Đã chọn — {uploadedFiles.length} file
              </p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {uploadedFiles.map((file, index) => {
                  const parsed = parseFilenameMetadata(file.name)
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-slate-700/60 rounded-xl border border-gray-100 dark:border-slate-700 group"
                    >
                      <FileTypeIcon type={file.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{file.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {parsed.trainingProgram && (
                            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">{parsed.trainingProgram}</span>
                          )}
                          {parsed.cohort && (
                            <span className="text-[11px] text-gray-400 dark:text-slate-500">Khóa {parsed.cohort}</span>
                          )}
                          {parsed.className && parsed.className !== parsed.cohort && (
                            <span className="text-[11px] text-gray-400 dark:text-slate-500">· {parsed.className}</span>
                          )}
                          {parsed.academicYear && (
                            <span className="text-[11px] text-amber-600 dark:text-amber-500">Năm {parsed.academicYear}</span>
                          )}
                          <span className="text-[11px] text-gray-300 dark:text-slate-600 ml-auto">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1.5 text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Xóa"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          
          
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex-shrink-0 bg-gray-50/50 dark:bg-slate-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 font-semibold rounded-xl border border-gray-200 dark:border-slate-600 transition-colors text-sm"
          >
            Hủy
          </button>
          <button
            onClick={handleUpload}
            disabled={uploadedFiles.length === 0}
            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-sm text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
            </svg>
            Tải lên {uploadedFiles.length > 0 ? `(${uploadedFiles.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}