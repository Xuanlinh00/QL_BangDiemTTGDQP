/**
 * pdfExtract.ts
 * ─────────────
 * Đọc nội dung văn bản từ file PDF trực tiếp trong trình duyệt,
 * sử dụng PDF.js (đã có sẵn qua react-pdf / pdfjs-dist).
 *
 * Hỗ trợ:
 *   - PDF có text layer (PDF gốc / digital) → trích xuất ngay, không cần OCR
 *   - PDF quét (scanned) → text layer trống → trả về warning + cần OCR backend
 *
 * Cách dùng:
 *   const result = await extractPdfText(blob)
 *   if (result.isScanned) {
 *     // gửi lên backend OCR (Tesseract / Vision)
 *   } else {
 *     // dùng result.text trực tiếp
 *   }
 */

export interface PdfExtractResult {
  /** Toàn bộ văn bản đã trích xuất */
  text: string
  /** Số trang */
  pageCount: number
  /** Văn bản từng trang */
  pages: string[]
  /** true nếu PDF là bản quét (không có text layer) */
  isScanned: boolean
  /** Cảnh báo từ quá trình đọc */
  warnings: string[]
}

/** Kí tự tối thiểu/trang để coi là PDF có text (không phải bản quét) */
const MIN_CHARS_PER_PAGE = 30

async function loadPdfjsDist() {
  // react-pdf exports pdfjsLib; ta import động để tránh bundle bloat khi không cần
  const pdfjsLib = await import('pdfjs-dist')

  // Worker setup — bắt buộc để PDF.js chạy được
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    // Dùng CDN worker cho đơn giản; production nên copy file local
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
  }

  return pdfjsLib
}

/**
 * Trích xuất toàn bộ văn bản từ một PDF Blob / ArrayBuffer / URL.
 */
export async function extractPdfText(
  source: Blob | ArrayBuffer | string,
): Promise<PdfExtractResult> {
  const warnings: string[] = []
  const pages: string[] = []

  try {
    const pdfjsLib = await loadPdfjsDist()

    // Chuẩn hoá source
    let data: ArrayBuffer | string
    if (source instanceof Blob) {
      data = await source.arrayBuffer()
    } else {
      data = source
    }

    const loadingTask = pdfjsLib.getDocument(
      typeof data === 'string' ? data : { data },
    )
    const pdfDoc = await loadingTask.promise
    const numPages = pdfDoc.numPages

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDoc.getPage(i)
      const textContent = await page.getTextContent()

      const pageText = textContent.items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s{2,}/g, ' ')
        .trim()

      pages.push(pageText)
    }

    const allText = pages.join('\n\n--- TRANG ' + pages.map((_, i) => i + 1).join(' ---\n\n--- TRANG ') + ' ---\n\n')
      // Simpler join
    const joinedText = pages.map((p, i) => `--- Trang ${i + 1} ---\n${p}`).join('\n\n')

    const avgChars = pages.reduce((s, p) => s + p.length, 0) / Math.max(numPages, 1)
    const isScanned = avgChars < MIN_CHARS_PER_PAGE

    if (isScanned) {
      warnings.push(
        `PDF này là bản quét (trung bình ${Math.round(avgChars)} ký tự/trang). ` +
        `Hệ thống sẽ chuyển sang chế độ OCR (Tesseract/Vision).`,
      )
    }

    return {
      text: joinedText,
      pageCount: numPages,
      pages,
      isScanned,
      warnings,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    warnings.push(`Không thể đọc PDF: ${msg}`)
    return { text: '', pageCount: 0, pages: [], isScanned: true, warnings }
  }
}

/**
 * Kiểm tra nhanh xem một PDF có text layer không (chỉ đọc trang đầu).
 */
export async function checkPdfHasText(source: Blob): Promise<boolean> {
  const result = await extractPdfText(source)
  return !result.isScanned
}

/**
 * Trích xuất văn bản từ IndexedDB blob (dùng trong Documents page).
 */
export async function extractFromBlob(blob: Blob): Promise<PdfExtractResult> {
  if (!blob.type.includes('pdf')) {
    return {
      text: '(File không phải PDF — không thể trích xuất văn bản)',
      pageCount: 0,
      pages: [],
      isScanned: false,
      warnings: ['Chỉ hỗ trợ file PDF'],
    }
  }
  return extractPdfText(blob)
}
