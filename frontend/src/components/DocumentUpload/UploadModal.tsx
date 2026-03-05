import { useState } from 'react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (files: File[]) => void
}

export default function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)

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
    onUpload(uploadedFiles)
    setUploadedFiles([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Tải tài liệu lên</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Drag and drop area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
            }`}
          >
            <div className="text-4xl mb-2">📁</div>
            <p className="text-gray-700 font-medium">Kéo thả file vào đây</p>
            <p className="text-gray-500 text-sm mt-1">hoặc</p>
            <label className="inline-block mt-3">
              <span className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg cursor-pointer transition-colors">
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
            <p className="text-gray-500 text-xs mt-3">Hỗ trợ: PDF, Excel (.xlsx, .xls)</p>
          </div>

          {/* File list */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">File đã chọn ({uploadedFiles.length}):</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-lg">
                        {file.type === 'application/pdf' ? '📄' : '📊'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
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
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleUpload}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Tải lên ({uploadedFiles.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
