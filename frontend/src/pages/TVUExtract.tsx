import { useState, useEffect } from 'react'
import { Button } from '../components/Common'

interface ExtractionResult {
  success: boolean
  data?: any[]
  summary?: {
    total_students: number
    total_tables: number
    method: string
    page_count: number
    table_types?: Record<string, number>
  }
  error?: string
}

export default function TVUExtract() {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [forceOCR, setForceOCR] = useState(false)
  const [outputFormat, setOutputFormat] = useState<'json' | 'excel'>('json')
  const [results, setResults] = useState<ExtractionResult[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  // Check API status on mount
  useEffect(() => {
    const checkAPI = async () => {
      try {
        const PYTHON_API = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8001'
        const response = await fetch(`${PYTHON_API}/api/tvu/health`)
        if (response.ok) {
          setApiStatus('online')
        } else {
          setApiStatus('offline')
        }
      } catch {
        setApiStatus('offline')
      }
    }
    checkAPI()
  }, [])

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

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf'
    )
    setFiles(prev => [...prev, ...droppedFiles])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...selectedFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleExtract = async () => {
    if (files.length === 0) return

    setLoading(true)
    setResults([])

    try {
      const PYTHON_API = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8001'

      if (files.length === 1) {
        // Single file extraction
        const formData = new FormData()
        formData.append('file', files[0])

        const url = `${PYTHON_API}/api/tvu/extract?force_ocr=${forceOCR}&output_format=${outputFormat}`
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
        })

        if (outputFormat === 'excel') {
          // Download Excel file
          const blob = await response.blob()
          const downloadUrl = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = downloadUrl
          a.download = `${files[0].name.replace('.pdf', '')}_extracted.xlsx`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(downloadUrl)
          document.body.removeChild(a)

          setResults([{
            success: true,
            summary: {
              total_students: 0,
              total_tables: 0,
              method: 'excel',
              page_count: 0
            }
          }])
        } else {
          // JSON response
          const result = await response.json()
          setResults([result])
        }
      } else {
        // Batch extraction
        const formData = new FormData()
        files.forEach(file => {
          formData.append('files', file)
        })

        const url = `${PYTHON_API}/api/tvu/extract-batch?force_ocr=${forceOCR}`
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
        })

        const batchResult = await response.json()
        setResults(batchResult.results || [])
      }
    } catch (error) {
      console.error('Extraction error:', error)
      
      let errorMessage = 'Lỗi không xác định'
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Không thể kết nối đến Python API. Vui lòng kiểm tra:\n' +
                        '1. Python server đang chạy tại http://localhost:8001\n' +
                        '2. Chạy: cd backend-python && python -m uvicorn app.main:app --reload --port 8001'
        } else {
          errorMessage = error.message
        }
      }
      
      setResults([{
        success: false,
        error: errorMessage
      }])
    } finally {
      setLoading(false)
    }
  }

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-6">
      {/* API Status Banner */}
      {apiStatus === 'offline' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Python API không hoạt động
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>Vui lòng khởi động Python server:</p>
                <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded text-xs overflow-x-auto">
cd backend-python{'\n'}
python -m uvicorn app.main:app --reload --port 8001
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {apiStatus === 'online' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Python API đang hoạt động
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Trích xuất bảng điểm PDF - Trường ĐH Trà Vinh
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Tự động trích xuất dữ liệu sinh viên từ bảng điểm PDF
        </p>
      </div>

      {/* Upload Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tải lên file PDF
        </h2>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-primary-600 dark:text-primary-400 hover:text-primary-500">
                Chọn file
              </span>
              <input
                id="file-upload"
                type="file"
                className="sr-only"
                accept=".pdf"
                multiple
                onChange={handleFileSelect}
              />
            </label>
            <span className="text-gray-600 dark:text-gray-400"> hoặc kéo thả vào đây</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Chỉ hỗ trợ file PDF
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Đã chọn {files.length} file:
            </h3>
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Options */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tùy chọn
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="force-ocr"
              checked={forceOCR}
              onChange={(e) => setForceOCR(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="force-ocr" className="text-sm text-gray-700 dark:text-gray-300">
              Bắt buộc dùng OCR (chậm hơn nhưng chính xác hơn cho PDF scan)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Định dạng đầu ra
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="json"
                  checked={outputFormat === 'json'}
                  onChange={(e) => setOutputFormat(e.target.value as 'json')}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">JSON (xem trực tiếp)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="excel"
                  checked={outputFormat === 'excel'}
                  onChange={(e) => setOutputFormat(e.target.value as 'excel')}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Excel (tải về)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={handleExtract}
            disabled={files.length === 0 || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang xử lý...
              </>
            ) : (
              'Trích xuất dữ liệu'
            )}
          </Button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Kết quả
          </h2>

          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                    : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                }`}
              >
                {result.success ? (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                          ✅ Trích xuất thành công
                        </h3>
                        {result.summary && (
                          <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                            <p>Tổng số sinh viên: {result.summary.total_students}</p>
                            <p>Số bảng: {result.summary.total_tables}</p>
                            <p>Phương pháp: {result.summary.method}</p>
                            <p>Số trang: {result.summary.page_count}</p>
                            {result.summary.table_types && (
                              <p>
                                Loại bảng: {Object.entries(result.summary.table_types).map(([k, v]) => `${k} (${v})`).join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      {result.data && outputFormat === 'json' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => downloadJSON(result, `result_${index + 1}.json`)}
                        >
                          Tải JSON
                        </Button>
                      )}
                    </div>

                    {/* Preview data */}
                    {result.data && result.data.length > 0 && outputFormat === 'json' && (
                      <div className="mt-4">
                        <details className="cursor-pointer">
                          <summary className="text-sm font-medium text-green-900 dark:text-green-100">
                            Xem dữ liệu ({result.data.length} bản ghi)
                          </summary>
                          <div className="mt-2 max-h-96 overflow-auto">
                            <table className="min-w-full text-xs">
                              <thead className="bg-green-100 dark:bg-green-900/40">
                                <tr>
                                  {Object.keys(result.data[0]).map(key => (
                                    <th key={key} className="px-2 py-1 text-left text-green-900 dark:text-green-100">
                                      {key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {result.data.slice(0, 10).map((row, i) => (
                                  <tr key={i} className="border-t border-green-200 dark:border-green-800">
                                    {Object.values(row).map((val: any, j) => (
                                      <td key={j} className="px-2 py-1 text-green-800 dark:text-green-200">
                                        {String(val)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {result.data.length > 10 && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-2 text-center">
                                ... và {result.data.length - 10} bản ghi khác
                              </p>
                            )}
                          </div>
                        </details>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">
                      ❌ Trích xuất thất bại
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {result.error || 'Unknown error'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
