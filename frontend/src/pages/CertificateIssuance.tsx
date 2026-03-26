import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'

interface StudentRecord {
  mssv: string
  hoTen: string
  diaChi: string
  [key: string]: string | undefined
}

interface StudentWithDate extends StudentRecord {
  ngayPhat?: string
}

interface FileData {
  id: string
  name: string
  students: StudentWithDate[]
  uploadedAt: string
}

export default function CertificateIssuance() {
  const [fileList, setFileList] = useState<FileData[]>([])
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [searchMSSV, setSearchMSSV] = useState('')
  const [searchResult, setSearchResult] = useState<StudentWithDate | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = event.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as StudentWithDate[]
        
        const newFileId = Date.now().toString()
        const newFile: FileData = {
          id: newFileId,
          name: file.name,
          students: jsonData,
          uploadedAt: new Date().toLocaleString('vi-VN')
        }

        setFileList(prev => [...prev, newFile])
        setActiveFileId(newFileId)
        setSearchResult(null)
        setSearchMSSV('')
      } catch (error) {
        alert('Lỗi khi đọc file Excel: ' + (error as Error).message)
      }
    }
    reader.readAsBinaryString(file)
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const activeFile = fileList.find(f => f.id === activeFileId)
  const students = activeFile?.students || []

  const handleSearch = () => {
    if (!searchMSSV.trim()) {
      alert('Vui lòng nhập MSSV')
      return
    }

    const found = students.find(s => s.mssv?.toString().trim() === searchMSSV.trim())
    if (found) {
      setSearchResult(found)
    } else {
      alert('Không tìm thấy sinh viên với MSSV: ' + searchMSSV)
      setSearchResult(null)
    }
  }

  const handleIssue = () => {
    if (!searchResult || !activeFileId) return

    const today = new Date()
    const dateStr = today.toLocaleDateString('vi-VN')

    setFileList(prev => prev.map(file => {
      if (file.id === activeFileId) {
        return {
          ...file,
          students: file.students.map(s =>
            s.mssv === searchResult.mssv
              ? { ...s, ngayPhat: dateStr }
              : s
          )
        }
      }
      return file
    }))

    setSearchResult({ ...searchResult, ngayPhat: dateStr })
  }

  const handleExport = () => {
    if (!activeFile || activeFile.students.length === 0) {
      alert('Không có dữ liệu để xuất')
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(activeFile.students)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sinh viên')

    const exportFileName = `${activeFile.name.replace('.xlsx', '')}_updated_${new Date().getTime()}.xlsx`
    XLSX.writeFile(workbook, exportFileName)
  }

  const handleDeleteFile = (fileId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa file này?')) return
    
    const newFileList = fileList.filter(f => f.id !== fileId)
    setFileList(newFileList)
    
    if (activeFileId === fileId) {
      setActiveFileId(newFileList.length > 0 ? newFileList[0].id : null)
      setSearchResult(null)
      setSearchMSSV('')
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
          Phát Chứng Nhận
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400">
          Quản lý phát chứng nhận cho sinh viên
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Bước 1: Tải File Excel</h2>
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors cursor-pointer shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Chọn File Excel
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <span className="text-gray-700 dark:text-slate-300">
            {fileList.length > 0 ? `✓ Đã tải ${fileList.length} file` : 'Chưa tải file nào'}
          </span>
        </div>
      </div>

      {/* File List Section */}
      {fileList.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Danh Sách File</h2>
          <div className="space-y-2">
            {fileList.map(file => (
              <div
                key={file.id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  activeFileId === file.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                }`}
                onClick={() => {
                  setActiveFileId(file.id)
                  setSearchResult(null)
                  setSearchMSSV('')
                }}
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    {file.students.length} sinh viên • Tải lên: {file.uploadedAt}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteFile(file.id)
                  }}
                  className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="Xóa file"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Section */}
      {activeFile && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Bước 2: Tra Cứu Sinh Viên</h2>
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
            Đang làm việc với file: <strong>{activeFile.name}</strong>
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Nhập MSSV..."
              value={searchMSSV}
              onChange={(e) => setSearchMSSV(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              Tìm Kiếm
            </button>
          </div>
        </div>
      )}

      {/* Result Section */}
      {searchResult && activeFile && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Bước 3: Thông Tin Sinh Viên</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {Object.entries(searchResult).map(([key, value]) => (
              <div key={key} className="border-b border-gray-200 dark:border-slate-700 pb-3">
                <label className="text-sm font-semibold text-gray-600 dark:text-slate-400 uppercase">
                  {key === 'mssv' ? 'MSSV' : key === 'hoTen' ? 'Họ Tên' : key === 'diaChi' ? 'Địa Chỉ' : key === 'ngayPhat' ? 'Ngày Phát' : key}
                </label>
                <p className="text-lg text-gray-900 dark:text-white font-medium mt-1">
                  {value || '—'}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleIssue}
              disabled={!!searchResult.ngayPhat}
              className={`px-6 py-3 font-medium rounded-lg transition-colors shadow-sm ${
                searchResult.ngayPhat
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {searchResult.ngayPhat ? '✓ Đã Phát' : 'Phát Chứng Nhận'}
            </button>
            {searchResult.ngayPhat && (
              <span className="px-4 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-medium">
                Phát vào: {searchResult.ngayPhat}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Export Section */}
      {activeFile && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Bước 4: Xuất File</h2>
          <button
            onClick={handleExport}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Xuất File Excel
          </button>
        </div>
      )}

      {/* Data Table */}
      {activeFile && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 shadow-sm overflow-x-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Danh Sách Sinh Viên</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">MSSV</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Họ Tên</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Địa Chỉ</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Ngày Phát</th>
              </tr>
            </thead>
            <tbody>
              {activeFile.students.map((student, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 ${
                    student.ngayPhat ? 'bg-green-50 dark:bg-green-900/10' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-gray-900 dark:text-white">{student.mssv}</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">{student.hoTen}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-slate-400">{student.diaChi}</td>
                  <td className="py-3 px-4">
                    {student.ngayPhat ? (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                        {student.ngayPhat}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
