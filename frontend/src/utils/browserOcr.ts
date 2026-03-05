/**
 * browserOcr.ts
 * Placeholder — Tesseract.js removed (caused un-suppressable WASM warnings).
 * Scanned PDFs are handled by showing a manual-entry prompt instead.
 */

export type OcrProgressCb = (msg: string, pct: number) => void

export async function ocrPdfInBrowser(
  _blob: Blob,
  _onProgress?: OcrProgressCb,
): Promise<string> {
  throw new Error('SCANNED_PDF')
}
