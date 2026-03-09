import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useGoogleDrive, GoogleDriveFile, GoogleDriveFolder } from '../../hooks/useGoogleDrive'

interface GoogleDriveModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (files: GoogleDriveFile[]) => void
}

// Helper to get file icon
function fileIcon(mimeType: string) {
  if (mimeType === 'application/vnd.google-apps.folder') return '📁'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊'
  if (mimeType.includes('document') || mimeType.includes('word')) return '📝'
  if (mimeType.includes('image')) return '🖼️'
  return '📎'
}

export default function GoogleDriveModal({ isOpen, onClose, onSelect }: GoogleDriveModalProps) {
  const {
    isLoading, error, files, folders, folderPath, currentFolder,
    isAuthenticated, userEmail,
    signInGoogle, signOutGoogle,
    browseFolder, searchFilesRecursive,
    getFileViewUrl, downloadFile,
  } = useGoogleDrive()

  const [searchTerm, setSearchTerm] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [previewFile, setPreviewFile] = useState<GoogleDriveFile | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

  // Browse root folder on open
  useEffect(() => {
    if (isOpen && isAuthenticated && !currentFolder) {
      browseFolder()
    }
  }, [isOpen, isAuthenticated, currentFolder, browseFolder])

  const handleFolderClick = useCallback((folder: GoogleDriveFolder) => {
    setIsSearchMode(false)
    setSearchTerm('')
    browseFolder(folder.id, folder.name)
  }, [browseFolder])

  const handleBreadcrumb = useCallback((folder: GoogleDriveFolder) => {
    setIsSearchMode(false)
    setSearchTerm('')
    browseFolder(folder.id, folder.name)
  }, [browseFolder])

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setIsSearchMode(false)
      if (currentFolder) browseFolder(currentFolder.id, currentFolder.name)
      return
    }
    setIsSearchMode(true)
    await searchFilesRecursive(searchTerm.trim())
  }, [searchTerm, searchFilesRecursive, browseFolder, currentFolder])

  const handleClearSearch = useCallback(() => {
    setSearchTerm('')
    setIsSearchMode(false)
    if (currentFolder) browseFolder(currentFolder.id, currentFolder.name)
  }, [browseFolder, currentFolder])

  const handlePreview = useCallback((file: GoogleDriveFile) => {
    setPreviewFile(file)
  }, [])

  const handleDownload = useCallback((file: GoogleDriveFile) => {
    downloadFile(file.id, file.name, file.mimeType)
  }, [downloadFile])

  const handleSelectFile = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    )
  }

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length && files.length > 0) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(files.map(f => f.id))
    }
  }

  const handleImportSelected = () => {
    const selected = files.filter(f => selectedFiles.includes(f.id))
    if (selected.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 file')
      return
    }
    onSelect(selected)
    setSelectedFiles([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between shrink-0">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">📁 Duyệt Google Drive</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl">✕</button>
          </div>

          <div className="p-6 space-y-4 overflow-auto flex-1">
            {/* Auth */}
            {!isAuthenticated ? (
              <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700 rounded-xl p-6 text-center">
                <p className="text-primary-800 dark:text-primary-200 mb-3">Vui lòng đăng nhập Google Drive để tiếp tục</p>
                <button
                  onClick={signInGoogle}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
                >
                  🔐 Đăng nhập Google
                </button>
              </div>
            ) : (
              <>
                {/* User Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                  <p className="text-sm text-green-800">
                    ✓ Đã đăng nhập: <span className="font-medium">{userEmail}</span>
                  </p>
                  <button
                    onClick={signOutGoogle}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                  >
                    Đăng xuất
                  </button>
                </div>

                {/* Search bar */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tìm kiếm file trong toàn bộ thư mục..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? '⏳' : '🔍'} Tìm
                  </button>
                  {isSearchMode && (
                    <button
                      onClick={handleClearSearch}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
                    >
                      ✕ Xóa tìm
                    </button>
                  )}
                </div>

                {/* Breadcrumb navigation */}
                {!isSearchMode && folderPath.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 px-3 py-2 rounded-lg overflow-x-auto">
                    {folderPath.map((folder, idx) => (
                      <span key={folder.id} className="flex items-center gap-1 shrink-0">
                        {idx > 0 && <span className="text-gray-400 mx-1">›</span>}
                        <button
                          onClick={() => handleBreadcrumb(folder)}
                          className={`hover:text-primary-600 dark:hover:text-primary-400 hover:underline ${
                            idx === folderPath.length - 1 ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {idx === 0 ? '🏠 ' : '📁 '}{folder.name}
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {isSearchMode && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-sm text-yellow-800">
                    🔍 Kết quả tìm kiếm "{searchTerm}": <strong>{files.length}</strong> file
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                    ⚠️ {error}
                  </div>
                )}

                {/* Content area */}
                <div className="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
                  {/* Toolbar */}
                  <div className="bg-gray-50 dark:bg-slate-700/50 px-4 py-2 border-b border-gray-200 dark:border-slate-600 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedFiles.length === files.length && files.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {selectedFiles.length > 0 ? `Đã chọn ${selectedFiles.length}` : `${folders.length} thư mục, ${files.length} file`}
                      </span>
                    </div>
                    {selectedFiles.length > 0 && (
                      <button
                        onClick={handleImportSelected}
                        className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded transition-colors"
                      >
                        Nhập {selectedFiles.length} file
                      </button>
                    )}
                  </div>

                  <div className="max-h-[50vh] overflow-y-auto">
                    {isLoading ? (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2" />
                        Đang tải...
                      </div>
                    ) : (folders.length === 0 && files.length === 0) ? (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        Thư mục trống hoặc không tìm thấy file
                      </div>
                    ) : (
                      <>
                        {/* Folders */}
                        {folders.map(folder => (
                          <div
                            key={folder.id}
                            className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 flex items-center gap-3 cursor-pointer group"
                            onClick={() => handleFolderClick(folder)}
                          >
                            <span className="text-xl">📁</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-primary-700 dark:text-primary-400 truncate group-hover:underline">
                                {folder.name}
                              </p>
                            </div>
                            <span className="text-gray-400 text-sm">›</span>
                          </div>
                        ))}

                        {/* Files */}
                        {files.map(file => (
                          <div
                            key={file.id}
                            className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3"
                          >
                            <input
                              type="checkbox"
                              checked={selectedFiles.includes(file.id)}
                              onChange={() => handleSelectFile(file.id)}
                              className="w-4 h-4 cursor-pointer shrink-0"
                            />
                            <span className="text-lg shrink-0">{fileIcon(file.mimeType)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {file.size ? `${(parseInt(file.size) / 1024 / 1024).toFixed(2)} MB` : ''} 
                                {file.createdTime ? ` • ${new Date(file.createdTime).toLocaleDateString('vi-VN')}` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handlePreview(file)}
                                className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                                title="Xem file"
                              >
                                👁️ Xem
                              </button>
                              <button
                                onClick={() => handleDownload(file)}
                                className="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors"
                                title="Tải file"
                              >
                                ⬇️ Tải
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={handleImportSelected}
                    disabled={selectedFiles.length === 0 || isLoading}
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    Nhập {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full mx-4 max-h-[95vh] flex flex-col">
            <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-gray-800 truncate pr-4">
                {fileIcon(previewFile.mimeType)} {previewFile.name}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownload(previewFile)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded transition-colors"
                >
                  ⬇️ Tải xuống
                </button>
                <a
                  href={previewFile.webViewLink || `https://drive.google.com/file/d/${previewFile.id}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded transition-colors"
                >
                  🔗 Mở trong Drive
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl px-2"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-100">
              <iframe
                src={getFileViewUrl(previewFile)}
                className="w-full h-full min-h-[75vh]"
                title={previewFile.name}
                allow="autoplay"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
