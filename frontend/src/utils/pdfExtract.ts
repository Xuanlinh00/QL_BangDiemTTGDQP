/**
 * pdfExtract.ts  Đọc nội dung văn bản từ PDF trực tiếp trong trình duyệt.
 * Dùng `pdfjs` từ react-pdf (đã xử lý AMD/ESM interop đúng cách).
 */

import { pdfjs } from 'react-pdf'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.js?url'

// Vite ?url => URL chính xác tới file worker; pdfjs từ react-pdf => GlobalWorkerOptions tồn tại
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

export interface PdfExtractResult {
  text: string
  pageCount: number
  pages: string[]
  isScanned: boolean
  warnings: string[]
}

const MIN_CHARS_PER_PAGE = 20

/**
 * Trích xuất văn bản từ PDF Blob.
 */
export async function extractFromBlob(blob: Blob): Promise<PdfExtractResult> {
  const warnings: string[] = []

  try {
    const arrayBuffer = await blob.arrayBuffer()

    if (arrayBuffer.byteLength === 0) {
      return { text: '', pageCount: 0, pages: [], isScanned: true, warnings: ['File rỗng'] }
    }

    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) })
    const pdfDoc = await loadingTask.promise
    const numPages = pdfDoc.numPages
    const pages: string[] = []

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum)
      const textContent = await page.getTextContent()

      // Group items by row (Y coordinate, snapped to 3-pt grid)
      // Then sort each row's items by X so columns come out left-to-right.
      const rowMap = new Map<number, { str: string; x: number }[]>()
      for (const item of textContent.items) {
        if (!('str' in item)) continue
        const ti = item as { str: string; transform: number[] }
        if (!ti.str.trim()) continue
        const rawY = ti.transform[5]
        const rawX = ti.transform[4]
        // Snap Y to nearest 3-point bucket so nearby items land in the same row
        const yKey = Math.round(rawY / 3) * 3
        if (!rowMap.has(yKey)) rowMap.set(yKey, [])
        rowMap.get(yKey)!.push({ str: ti.str, x: rawX })
      }

      // Sort rows top-to-bottom (PDF Y axis: larger = higher on page)
      const sortedYKeys = Array.from(rowMap.keys()).sort((a, b) => b - a)
      const lines: string[] = []
      for (const yKey of sortedYKeys) {
        const items = rowMap.get(yKey)!.sort((a, b) => a.x - b.x)
        // Join with appropriate spacing
        let line = ''
        let prevX = -Infinity
        for (const { str, x } of items) {
          const gap = line.length === 0 ? 0 : x - prevX
          // Add extra space when there's a visible column gap (>10pt)
          if (line.length > 0) line += gap > 10 ? '   ' : ' '
          line += str
          prevX = x + str.length * 6 // rough char advance
        }
        lines.push(line.trim())
      }

      pages.push(lines.join('\n'))
    }

    const totalChars = pages.reduce((s, p) => s + p.length, 0)
    const avgChars = totalChars / Math.max(numPages, 1)
    const isScanned = avgChars < MIN_CHARS_PER_PAGE

    if (isScanned) {
      warnings.push(`PDF bản quét  ${Math.round(avgChars)} ký tự/trang trung bình. Cần OCR backend.`)
    }

    const text = pages.map((p, i) => `=== Trang ${i + 1} ===\n${p}`).join('\n\n')
    return { text, pageCount: numPages, pages, isScanned, warnings }

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[pdfExtract] Error:', err)
    return { text: '', pageCount: 0, pages: [], isScanned: true, warnings: [`Lỗi đọc PDF: ${msg}`] }
  }
}

export async function extractPdfText(source: Blob | ArrayBuffer | string): Promise<PdfExtractResult> {
  if (source instanceof Blob) return extractFromBlob(source)
  if (source instanceof ArrayBuffer) return extractFromBlob(new Blob([source], { type: 'application/pdf' }))
  try {
    const resp = await fetch(source)
    return extractFromBlob(await resp.blob())
  } catch (err) {
    return { text: '', pageCount: 0, pages: [], isScanned: true, warnings: [`Không tải được URL: ${err}`] }
  }
}
