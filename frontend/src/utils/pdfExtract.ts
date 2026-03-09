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

const MIN_CHARS_PER_PAGE = 30

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

      // ── Collect items with computed font size ──────────────────────────────
      interface RItem { str: string; x: number; y: number; fs: number; endX: number }
      const richItems: RItem[] = []
      for (const item of textContent.items) {
        if (!('str' in item)) continue
        const ti = item as { str: string; transform: number[]; width: number }
        if (!ti.str.trim()) continue
        const x  = ti.transform[4]
        const y  = ti.transform[5]
        // Font size = magnitude of the transform's scaling vector (handles rotation/skew).
        // Clamped to ≥ 4 to avoid division-by-zero on degenerate items.
        const fs = Math.max(4, Math.sqrt(ti.transform[0] ** 2 + ti.transform[1] ** 2))
        // End-X: prefer item.width (already in user-space units) over character estimate.
        // Use 0.5 per char (conservative) so we never over-extend into the adjacent cell.
        const endX = x + (ti.width > 0 ? ti.width : fs * ti.str.length * 0.50)
        richItems.push({ str: ti.str, x, y, fs, endX })
      }

      // ── Also extract AcroForm / Widget annotation values ──────────────────
      // pdfjs getTextContent() skips form-field values; annotations() has them.
      try {
        const annotations = await page.getAnnotations()
        for (const annot of annotations) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const a = annot as any
          if (a.subtype !== 'Widget' || a.fieldValue == null) continue
          const raw: string = Array.isArray(a.fieldValue)
            ? a.fieldValue.join('')
            : String(a.fieldValue)
          const val = raw.trim()
          if (!val || !a.rect) continue
          // rect = [x1, y1_bottom, x2, y2_top] in PDF user space
          const x   = a.rect[0] as number
          const y   = a.rect[1] as number   // bottom of field; close enough for bucketing
          const fs  = 11                     // assume 11pt — can't easily detect form font size
          const endX = a.rect[2] as number  // right edge of annotation rect
          richItems.push({ str: val, x, y, fs, endX })
        }
      } catch { /* annotations unavailable for this page — skip */ }

      if (richItems.length === 0) { pages.push(''); continue }

      // ── Adaptive Y-bucket: 60% of median font size ────────────────────────
      // Vietnamese diacritics can shift baseline by ≈0.4× font size.
      // 60% bucket absorbs that drift while typically separating table rows
      // (line-height ≈ 1.2–1.3× font → ≥0.6× gap between row centres).
      const sortedFs = richItems.map(i => i.fs).sort((a, b) => a - b)
      const medianFs = sortedFs[Math.floor(sortedFs.length / 2)]
      const bucketSize = Math.max(2, medianFs * 0.60)

      // Integer bucket keys (avoids floating-point Map key collisions)
      const rowMap = new Map<number, RItem[]>()
      for (const item of richItems) {
        const key = Math.round(item.y / bucketSize)
        if (!rowMap.has(key)) rowMap.set(key, [])
        rowMap.get(key)!.push(item)
      }

      // Sort rows top→bottom (PDF Y: larger = higher on page)
      const sortedKeys = Array.from(rowMap.keys()).sort((a, b) => b - a)
      const lines: string[] = []

      for (const key of sortedKeys) {
        const row = rowMap.get(key)!.sort((a, b) => a.x - b.x)
        let line = ''
        let prevEndX = -Infinity
        for (const item of row) {
          if (!line) {
            line = item.str
          } else {
            const gap = item.x - prevEndX
            // gap < 0: overlapping items (ligatures, decorative chars) → join directly
            if (gap < 0) {
              line += item.str
              // don't update prevEndX if new item ends before current prevEndX
              if (item.endX > prevEndX) prevEndX = item.endX
              continue
            }
            // Normalize to em units so threshold is font-size-independent.
            //   < 0.08 em : directly adjacent chars (char-level font encoding)
            //   0.08–0.45 em : word space (typical Vietnamese: 0.25–0.35 em)
            //   > 0.45 em : column / table-cell gap → triple-space separator
            const emGap = gap / item.fs
            if (emGap < 0.08) {
              line += item.str
            } else if (emGap < 0.45) {
              line += ' ' + item.str
            } else {
              line += '   ' + item.str
            }
          }
          prevEndX = item.endX
        }
        const trimmed = line.trim()
        if (trimmed) lines.push(trimmed)
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
