/**
 * PDFViewer.tsx
 * Hiển thị PDF dùng react-pdf (Document + Page).
 * react-pdf tự quản lý worker nên không bị lỗi GlobalWorkerOptions.
 */

import { useState, useCallback, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.js?url'

// Vite ?url => URL chính xác tới worker; pdfjs từ react-pdf => GlobalWorkerOptions tồn tại
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

interface Props {
  /** Local file Blob */
  blob?: Blob | null
  /** Fallback embed URL (Google Drive, etc.) */
  embedUrl?: string | null
  className?: string
  /** Called when all pages have text extracted */
  onTextExtracted?: (pages: string[], fullText: string) => void
}

export default function PDFViewer({ blob, embedUrl, className = '', onTextExtracted }: Props) {
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1.2)
  const [loadError, setLoadError] = useState('')
  const pageTextsRef = useRef<Record<number, string>>({})
  const extractedCountRef = useRef(0)

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoadError('')
    pageTextsRef.current = {}
    extractedCountRef.current = 0
  }, [])

  const onLoadError = useCallback((err: Error) => {
    setLoadError(err.message)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePageText = useCallback((pageNum: number, numTotal: number, textContent: any) => {
    let pageText = ''
    let lastY: number | null = null
    for (const item of (textContent.items ?? [])) {
      if (!('str' in item)) continue
      const y = item.transform?.[5] ?? 0
      if (lastY !== null && Math.abs(y - lastY) > 5) pageText += '\n'
      pageText += item.str + ' '
      lastY = y
    }
    pageTextsRef.current[pageNum] = pageText.trim()
    extractedCountRef.current += 1
    if (extractedCountRef.current >= numTotal && onTextExtracted) {
      const pages = Array.from({ length: numTotal }, (_, i) => pageTextsRef.current[i + 1] ?? '')
      const fullText = pages.map((p, i) => `=== Trang ${i + 1} ===\n${p}`).join('\n\n')
      onTextExtracted(pages, fullText)
    }
  }, [onTextExtracted])

  if (!blob && embedUrl) {
    return (
      <iframe
        src={embedUrl}
        className={`w-full h-full border-0 ${className}`}
        title="PDF Preview"
        allow="autoplay"
      />
    )
  }

  if (!blob && !embedUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 text-gray-400 flex-col gap-2 ${className}`}>
        <span className="text-4xl"></span>
        <p className="text-sm">Không có file để xem</p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full bg-gray-200 overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-white text-xs shrink-0">
        <span className="font-medium"> PDF Viewer</span>
        {numPages > 0 && <span className="text-gray-300">{numPages} trang</span>}
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setScale(s => Math.max(0.5, +(s - 0.2).toFixed(1)))} className="px-2 py-0.5 bg-gray-600 hover:bg-gray-500 rounded"></button>
          <span className="w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(3, +(s + 0.2).toFixed(1)))} className="px-2 py-0.5 bg-gray-600 hover:bg-gray-500 rounded">+</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {loadError && (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-red-500">
            <span className="text-3xl">⚠️</span>
            <p className="text-sm font-semibold">Không thể hiển thị PDF</p>
            <p className="text-xs text-gray-500 max-w-xs text-center">{loadError}</p>
          </div>
        )}
        <Document
          file={blob}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
          loading={
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-500">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
              <p className="text-sm">Đang tải PDF...</p>
            </div>
          }
          error={null}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <Page
              key={i + 1}
              pageNumber={i + 1}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="mb-2 shadow"
              onGetTextSuccess={(tc) => handlePageText(i + 1, numPages, tc)}
            />
          ))}
        </Document>
      </div>
    </div>
  )
}
