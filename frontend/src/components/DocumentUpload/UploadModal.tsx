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

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: currentYear - 2014 + 2 }, (_, i) => currentYear + 1 - i)

const DEFAULT_PROGRAMS = ['Đại học', 'Cao đẳng', 'Liên thông', 'Nghề']

// ═══════════════════════════════════════════════════════
// Auto-parse filename to extract metadata
// ═══════════════════════════════════════════════════════
interface ParsedMetadata {
  trainingProgram?: string
  cohort?: string
  academicYear?: string
  className?: string
}

function parseFilenameMetadata(filename: string): ParsedMetadata {
  const result: ParsedMetadata = {}
  
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')
  
  // Pattern: DA22, CA22, DF22, DE22, VB22, etc.
  // DA/CA/DF/DE/VB = prefix (2 letters)
  // 22 = cohort/year (2 digits)
  const prefixMatch = nameWithoutExt.match(/^([A-Z]{2})(\d{2})/i)
  
  if (prefixMatch) {
    const prefix = prefixMatch[1].toUpperCase()
    const yearNum = parseInt(prefixMatch[2], 10)
    
    // Determine training program based on prefix
    if (prefix === 'DA') {
      result.trainingProgram = 'Đại học'
    } else if (prefix === 'CA') {
      result.trainingProgram = 'Cao đẳng'
    } else if (['DF', 'DE', 'VB'].includes(prefix)) {
      result.trainingProgram = 'Liên thông'
    }
    
    // Set cohort (e.g., DA22 → cohort = "DA22")
    result.cohort = `${prefix}${yearNum}`
    
    // Calculate academic year (e.g., 22 → 2022)
    // Assume 00-30 = 2000-2030, 31-99 = 1931-1999
    const fullYear = yearNum <= 30 ? 2000 + yearNum : 1900 + yearNum
    result.academicYear = String(fullYear)
    
    // Try to extract class name from remaining text
    // Pattern: DA22TYC, CA22CNTT, etc.
    const classMatch = nameWithoutExt.match(/^[A-Z]{2}\d{2}([A-Z0-9]+)/i)
    if (classMatch && classMatch[1]) {
      result.className = `${prefix}${yearNum}${classMatch[1]}`
    } else {
      // Fallback: use prefix + year as class name
      result.className = `${prefix}${yearNum}`
    }
  }
  
  return result
}

export default function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  
  // Metadata fields
  const [academicYear, setAcademicYear] = useState<string>('')
  const [cohort, setCohort] = useState<string>('')
  const [className, setClassName] = useState<string>('')
  const [trainingProgram, setTrainingProgram] = useState<string>('')
  const [customProgram, setCustomProgram] = useState<string>('')
  const [showCustomProgram, setShowCustomProgram] = useState(false)
  const [programOptions, setProgramOptions] = useState<string[]>(DEFAULT_PROGRAMS)
  const [customYear, setCustomYear] = useState<string>('')
  const [showCustomYear, setShowCustomYear] = useState(false)
  const [extraYears, setExtraYears] = useState<number[]>([])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    addFiles(files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      addFiles(files)
    }
  }

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} không phải PDF hoặc Excel`)
        return false
      }
      return true
    })
    
    // Auto-parse metadata from first file if fields are empty
    if (validFiles.length > 0 && !academicYear && !trainingProgram) {
      const parsed = parseFilenameMetadata(validFiles[0].name)
      
      if (parsed.trainingProgram) {
        setTrainingProgram(parsed.trainingProgram)
      }
      if (parsed.cohort) {
        setCohort(parsed.cohort)
      }
      if (parsed.academicYear) {
        setAcademicYear(parsed.academicYear)
      }
      if (parsed.className) {
        setClassName(parsed.className)
      }
    }
    
    setUploadedFiles([...uploadedFiles, ...validFiles])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
  }

  const handleUpload = () => {
    if (uploadedFiles.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 file')
      return
    }
    
    // Process each file individually based on its filename
    const filesWithMetadata = uploadedFiles.map(file => {
      const parsed = parseFilenameMetadata(file.name)
      return {
        file,
        metadata: {
          academicYear: parsed.academicYear || academicYear || undefined,
          cohort: parsed.cohort || cohort || undefined,
          className: parsed.className || className || undefined,
          trainingProgram: parsed.trainingProgram || trainingProgram || undefined,
        }
      }
    })
    
    // Call onUpload for each file with its own metadata
    filesWithMetadata.forEach(({ file, metadata }) => {
      onUpload([file], 'DSGD', metadata)
    })
    
    // Reset form
    setUploadedFiles([])
    setAcademicYear('')
    setCohort('')
    setClassName('')
    setTrainingProgram('')
    setCustomProgram('')
    setShowCustomProgram(false)
    setShowCustomYear(false)
    setCustomYear('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 border border-gray-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">📊 Tải bảng điểm lên</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Metadata fields for Bảng điểm */}
          <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
              📝 Thông tin bảng điểm
            </p>
            
            {/* Academic Year */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Năm học
              </label>
              <div className="flex gap-2">
                <select
                  value={showCustomYear ? '__custom__' : academicYear}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setShowCustomYear(true)
                      setAcademicYear('')
                      setCustomYear('')
                    } else {
                      setShowCustomYear(false)
                      setAcademicYear(e.target.value)
                      setCustomYear('')
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">-- Chọn năm --</option>
                  {[...new Set([...yearOptions, ...extraYears])].sort((a, b) => b - a).map(y => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                  <option value="__custom__">＋ Thêm năm...</option>
                </select>
              </div>
              {showCustomYear && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="number"
                    value={customYear}
                    onChange={(e) => setCustomYear(e.target.value)}
                    placeholder="VD: 2013"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = parseInt(customYear, 10)
                      if (!isNaN(val) && val >= 1900 && val <= 2100) {
                        if (!yearOptions.includes(val) && !extraYears.includes(val)) {
                          setExtraYears(prev => [...prev, val])
                        }
                        setAcademicYear(String(val))
                        setShowCustomYear(false)
                        setCustomYear('')
                      } else {
                        toast.error('Năm không hợp lệ')
                      }
                    }}
                    className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Thêm
                  </button>
                </div>
              )}
            </div>

            {/* Training Program */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Chương trình đào tạo
              </label>
              <div className="flex gap-2">
                <select
                  value={showCustomProgram ? '__custom__' : trainingProgram}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setShowCustomProgram(true)
                      setTrainingProgram('')
                      setCustomProgram('')
                    } else {
                      setShowCustomProgram(false)
                      setTrainingProgram(e.target.value)
                      setCustomProgram('')
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">-- Chọn CTĐT --</option>
                  {programOptions.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                  <option value="__custom__">＋ Thêm mới...</option>
                </select>
              </div>
              {showCustomProgram && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={customProgram}
                    onChange={(e) => setCustomProgram(e.target.value)}
                    placeholder="Nhập tên CTĐT mới"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = customProgram.trim()
                      if (val && !programOptions.includes(val)) {
                        setProgramOptions(prev => [...prev, val])
                      }
                      if (val) {
                        setTrainingProgram(val)
                        setShowCustomProgram(false)
                        setCustomProgram('')
                      }
                    }}
                    className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Thêm
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Cohort */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Khóa
                </label>
                <input
                  type="text"
                  value={cohort}
                  onChange={(e) => setCohort(e.target.value)}
                  placeholder="VD: DA21, K47"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Class Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Lớp
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="VD: DA21TYC, K47CNTT"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
              Thông tin sẽ được tự động phân loại từ tên file (VD: DA22TYC.pdf). Bạn có thể chỉnh sửa nếu cần.
            </p>
          </div>

          {/* Drag and drop area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50'
            }`}
          >
            <div className="text-4xl mb-2">📁</div>
            <p className="text-gray-700 dark:text-slate-300 font-medium">Kéo thả file vào đây</p>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">hoặc</p>
            <label className="inline-block mt-3">
              <span className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl cursor-pointer transition-colors">
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
            <p className="text-gray-500 dark:text-slate-400 text-xs mt-3">Hỗ trợ: PDF, Excel (.xlsx, .xls)</p>
          </div>

          {/* File list */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">File đã chọn ({uploadedFiles.length}):</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-lg">
                        {file.type === 'application/pdf' ? '📄' : '📊'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800 font-medium text-sm ml-2"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-700 sticky bottom-0 bg-white dark:bg-slate-800 -mx-6 px-6 -mb-6 pb-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 font-medium rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleUpload}
              className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
            >
              Tải lên ({uploadedFiles.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
