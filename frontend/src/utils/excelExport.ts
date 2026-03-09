import * as XLSX from 'xlsx'

interface ExportOptions {
  fileName: string
  sheetName?: string
  autoFilter?: boolean
  freezePane?: boolean
}

/**
 * Xuất dữ liệu thành file Excel
 */
export function exportToExcel(
  data: any[],
  options: ExportOptions
) {
  const {
    fileName,
    sheetName = 'Sheet1',
    autoFilter = true,
    freezePane = true,
  } = options

  // Tạo workbook
  const workbook = XLSX.utils.book_new()

  // Chuyển đổi dữ liệu thành worksheet
  const worksheet = XLSX.utils.json_to_sheet(data)

  // Thiết lập độ rộng cột tự động
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(
      key.length,
      Math.max(...data.map(row => String(row[key] || '').length))
    ) + 2,
  }))
  worksheet['!cols'] = colWidths

  // Thiết lập freeze pane (dòng tiêu đề)
  if (freezePane) {
    worksheet['!freeze'] = { xSplit: 0, ySplit: 1 }
  }

  // Thêm auto filter
  if (autoFilter && data.length > 0) {
    worksheet['!autofilter'] = {
      ref: `A1:${String.fromCharCode(65 + Object.keys(data[0]).length - 1)}${data.length + 1}`,
    }
  }

  // Thêm worksheet vào workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Tải file
  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}

/**
 * Xuất dữ liệu từ bảng HTML thành Excel
 */
export function exportTableToExcel(
  tableId: string,
  fileName: string,
  sheetName: string = 'Sheet1'
) {
  const table = document.getElementById(tableId)
  if (!table) {
    console.error(`Table with id "${tableId}" not found`)
    return
  }

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.table_to_sheet(table)

  // Thiết lập độ rộng cột
  const colWidths = Array.from(table.querySelectorAll('th')).map(th => ({
    wch: Math.max(th.textContent?.length || 10, 15),
  }))
  worksheet['!cols'] = colWidths

  // Freeze pane
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 }

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}

/**
 * Xuất dữ liệu sinh viên và điểm số
 */
export function exportStudentData(
  students: any[],
  scores: any[],
  fileName: string = 'student_data'
) {
  const workbook = XLSX.utils.book_new()

  // Sheet 1: Sinh viên
  const studentSheet = XLSX.utils.json_to_sheet(students)
  studentSheet['!cols'] = [
    { wch: 12 },
    { wch: 25 },
    { wch: 12 },
    { wch: 10 },
    { wch: 15 },
  ]
  studentSheet['!freeze'] = { xSplit: 0, ySplit: 1 }
  XLSX.utils.book_append_sheet(workbook, studentSheet, 'Sinh viên')

  // Sheet 2: Điểm số
  const scoreSheet = XLSX.utils.json_to_sheet(scores)
  scoreSheet['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
    { wch: 10 },
    { wch: 8 },
    { wch: 12 },
  ]
  scoreSheet['!freeze'] = { xSplit: 0, ySplit: 1 }
  XLSX.utils.book_append_sheet(workbook, scoreSheet, 'Điểm số')

  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const COL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const NUM_COLS = COL_LETTERS.length

function cellAddr(col: number, row: number) {
  return `${COL_LETTERS[col]}${row}`
}

function makeDataBorder() {
  const thin = { style: 'thin', color: { rgb: 'DDDDDD' } }
  return { top: thin, bottom: thin, left: thin, right: thin }
}

function makeHeaderBorder() {
  const thin = { style: 'thin', color: { rgb: '000000' } }
  return { top: thin, bottom: thin, left: thin, right: thin }
}

/**
 * Xuất dữ liệu đã trích xuất từ PDF ra Excel, giữ bố cục giống PDF gốc.
 *  - DSGD : bảng điểm sinh viên (STT / Họ tên / MSSV / Lớp / Điểm / Kết quả …)
 *  - QD   : quyết định (thông tin quyết định + danh sách đối tượng)
 *  - BieuMau: biểu mẫu hành chính
 */
export function exportPdfFormatToExcel(
  records: {
    stt?: string; ho_ten?: string; mssv?: string; lop?: string
    diem_qp?: string | number; diem_lan2?: string | number
    ket_qua?: string; ghi_chu?: string
    // QD fields
    so_quyet_dinh?: string; ngay_ky?: string; nguoi_ky?: string
    noi_dung?: string; don_vi?: string; doi_tuong?: string[]
    // BieuMau fields
    ngay?: string; tiet?: string; mon_hoc?: string
    giang_vien?: string; phong?: string
    [key: string]: unknown
  }[],
  meta: {
    lop?: string; mon_hoc?: string; total_records?: number
    diem_trung_binh?: number; so_dat?: number; so_khong_dat?: number
    ty_le_dat?: number; [key: string]: unknown
  },
  docName: string,
  docType: string = 'DSGD',
) {
  const wb = XLSX.utils.book_new()
  const today = new Date()
  const dateStr = `ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`

  // ── Build AOA ────────────────────────────────────────────────────────────
  type Cell = string | number | null
  const aoa: Cell[][] = []
  const empty = () => Array(NUM_COLS).fill(null) as Cell[]

  // Rows 0-1: org header
  aoa.push(['TRƯỜNG ĐẠI HỌC TRÀ VINH', ...Array(NUM_COLS - 1).fill(null)])
  aoa.push(['BỘ MÔN GIÁO DỤC QUỐC PHÒNG - AN NINH', ...Array(NUM_COLS - 1).fill(null)])
  aoa.push(empty()) // row 2

  // Row 3: document title
  const TITLES: Record<string, string> = {
    DSGD: 'BẢNG ĐIỂM THI KẾT THÚC HỌC PHẦN',
    QD: 'QUYẾT ĐỊNH',
    BieuMau: 'BIỂU MẪU',
  }
  aoa.push([TITLES[docType] ?? docType, ...Array(NUM_COLS - 1).fill(null)])

  // Rows 4-5: subject / class
  aoa.push([`Học phần: ${meta.mon_hoc ?? 'Giáo dục Quốc phòng - An ninh'}`, ...Array(NUM_COLS - 1).fill(null)])
  if (docType === 'DSGD') {
    aoa.push([`Lớp: ${meta.lop ?? ''}`, ...Array(NUM_COLS - 1).fill(null)])
  } else {
    aoa.push(empty())
  }
  aoa.push(empty()) // row 6 — spacer

  // ── Column-header row (row 7 = Excel row 8) ──────────────────────────────
  const HEADERS: Record<string, string[]> = {
    DSGD:    ['STT', 'HỌ VÀ TÊN', 'MSSV', 'LỚP', 'ĐIỂM QP', 'LẦN 2', 'KẾT QUẢ', 'GHI CHÚ'],
    QD:      ['STT', 'HỌ VÀ TÊN', 'ĐƠN VỊ', 'SỐ QĐ', 'NGÀY KÝ', 'NGƯỜI KÝ', 'NỘI DUNG', 'GHI CHÚ'],
    BieuMau: ['STT', 'NGÀY', 'TIẾT', 'MÔN HỌC', 'GIẢNG VIÊN', 'PHÒNG', 'LỚP', 'GHI CHÚ'],
  }
  aoa.push(HEADERS[docType] ?? HEADERS['DSGD'])

  // ── Data rows ─────────────────────────────────────────────────────────────
  const DATA_START_AOA = aoa.length // 0-indexed aoa row of first data row

  if (docType === 'DSGD') {
    records.forEach((r, i) => {
      const dq = r.diem_qp !== '' && r.diem_qp != null ? (parseFloat(String(r.diem_qp).replace(',', '.')) || r.diem_qp) : null
      const dl = r.diem_lan2 !== '' && r.diem_lan2 != null ? (parseFloat(String(r.diem_lan2).replace(',', '.')) || r.diem_lan2) : null
      aoa.push([r.stt ?? String(i + 1), r.ho_ten ?? '', r.mssv ?? '', r.lop ?? '', dq as Cell, dl as Cell, r.ket_qua ?? '', r.ghi_chu ?? ''])
    })
  } else if (docType === 'QD') {
    records.forEach((r, i) => {
      aoa.push([String(i + 1), r.ho_ten ?? '', r.don_vi ?? '', r.so_quyet_dinh ?? '', r.ngay_ky ?? '', r.nguoi_ky ?? '', r.noi_dung ?? '', ''])
    })
  } else {
    records.forEach((r, i) => {
      aoa.push([String(i + 1), r.ngay ?? '', r.tiet ?? '', r.mon_hoc ?? '', r.giang_vien ?? '', r.phong ?? '', r.lop ?? '', ''])
    })
  }

  const DATA_END_AOA = aoa.length - 1 // 0-indexed aoa row of last data row
  aoa.push(empty()) // spacer

  // ── Stats row ─────────────────────────────────────────────────────────────
  const STATS_AOA = aoa.length
  if (docType === 'DSGD') {
    const tb = meta.diem_trung_binh != null ? meta.diem_trung_binh.toFixed(2) : '—'
    aoa.push([
      `Tổng: ${meta.total_records ?? records.length}   |   Đạt: ${meta.so_dat ?? '—'}   |   Không đạt: ${meta.so_khong_dat ?? '—'}   |   Tỉ lệ đạt: ${meta.ty_le_dat != null ? meta.ty_le_dat + '%' : '—'}   |   Điểm TB: ${tb}`,
      ...Array(NUM_COLS - 1).fill(null),
    ])
  } else {
    aoa.push([`Tổng số bản ghi: ${records.length}`, ...Array(NUM_COLS - 1).fill(null)])
  }

  aoa.push(empty())
  aoa.push(empty())
  // Signature
  const SIG_AOA = aoa.length
  aoa.push([...Array(NUM_COLS - 2).fill(null), `Trà Vinh, ${dateStr}`, null])
  aoa.push([...Array(NUM_COLS - 2).fill(null), 'Giảng viên / Cán bộ phụ trách', null])
  aoa.push(empty())
  aoa.push(empty())

  // ── Create worksheet ─────────────────────────────────────────────────────
  const ws = XLSX.utils.aoa_to_sheet(aoa)

  // Column widths
  ws['!cols'] = [
    { wch: 5 },   // A STT
    { wch: 30 },  // B Họ tên
    { wch: 14 },  // C MSSV / ĐV
    { wch: 12 },  // D Lớp / SốQĐ
    { wch: 10 },  // E Điểm / Ngày
    { wch: 8 },   // F Lần2 / Phòng
    { wch: 16 },  // G Kết quả
    { wch: 22 },  // H Ghi chú
  ]

  // Row heights
  ws['!rows'] = aoa.map((_, i) => {
    if (i === 3) return { hpt: 26 }   // title
    if (i === 7) return { hpt: 22 }   // col-header
    if (i >= DATA_START_AOA && i <= DATA_END_AOA) return { hpt: 20 }
    return { hpt: 16 }
  })

  // Freeze below col-header row
  ws['!freeze'] = { xSplit: 0, ySplit: DATA_START_AOA + 1 }

  // ── Merges ───────────────────────────────────────────────────────────────
  const mergeWide = (aoaRow: number) => ({ s: { r: aoaRow, c: 0 }, e: { r: aoaRow, c: NUM_COLS - 1 } })
  ws['!merges'] = [
    mergeWide(0),
    mergeWide(1),
    mergeWide(3),
    mergeWide(4),
    mergeWide(5),
    mergeWide(STATS_AOA),
    { s: { r: SIG_AOA, c: NUM_COLS - 2 }, e: { r: SIG_AOA, c: NUM_COLS - 1 } },
    { s: { r: SIG_AOA + 1, c: NUM_COLS - 2 }, e: { r: SIG_AOA + 1, c: NUM_COLS - 1 } },
  ]

  // ── Styles ───────────────────────────────────────────────────────────────
  const applyStyle = (addr: string, s: object) => {
    if (!ws[addr]) return
    ws[addr].s = s
  }

  const tnr = (sz: number, bold = false, italic = false, rgb = '000000') => ({
    name: 'Times New Roman', sz, bold, italic, color: { rgb },
  })

  // Org header rows
  ;[0, 1].forEach(r => {
    applyStyle(cellAddr(0, r + 1), {
      font: tnr(11, true),
      alignment: { horizontal: 'center', vertical: 'center' },
    })
  })
  // Title
  applyStyle(cellAddr(0, 4), {
    font: tnr(14, true),
    alignment: { horizontal: 'center', vertical: 'center' },
  })
  // Sub-headers (subject / class)
  ;[4, 5].forEach(r => {
    applyStyle(cellAddr(0, r + 1), {
      font: tnr(11, false, true),
      alignment: { horizontal: 'center', vertical: 'center' },
    })
  })

  // Col header row: Excel row = DATA_START_AOA (0-indexed = 7 → Excel row 8)
  const hdrExcel = DATA_START_AOA   // 0-indexed → +1 for Excel row
  COL_LETTERS.forEach((_col, ci) => {
    const addr = cellAddr(ci, hdrExcel + 1)
    applyStyle(addr, {
      font: { ...tnr(11, true), color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      fill: { fgColor: { rgb: '1F4E79' }, patternType: 'solid' },
      border: makeHeaderBorder(),
    })
  })

  // Data rows
  for (let ai = DATA_START_AOA; ai <= DATA_END_AOA; ai++) {
    const excelRow = ai + 1
    const recIdx = ai - DATA_START_AOA
    const rec = records[recIdx] ?? {}
    const isKhongDat = (rec.ket_qua as string) === 'Không đạt'
    const isAlt = recIdx % 2 !== 0

    COL_LETTERS.forEach((_col, ci) => {
      const addr = cellAddr(ci, excelRow)
      if (!ws[addr]) return
      const centerCols = new Set(docType === 'DSGD' ? [0, 2, 3, 4, 5, 6] : [0, 4, 5])
      applyStyle(addr, {
        font: {
          ...tnr(11),
          ...(ci === 6 && isKhongDat ? { bold: true, color: { rgb: 'CC0000' } } : {}),
          ...(ci === 6 && !isKhongDat && rec.ket_qua === 'Đạt' ? { color: { rgb: '006600' } } : {}),
        },
        alignment: { horizontal: centerCols.has(ci) ? 'center' : 'left', vertical: 'center' },
        fill: isAlt
          ? { fgColor: { rgb: 'EBF3FB' }, patternType: 'solid' }
          : { fgColor: { rgb: 'FFFFFF' }, patternType: 'solid' },
        border: makeDataBorder(),
      })
    })
  }

  // Stats row
  applyStyle(cellAddr(0, STATS_AOA + 1), {
    font: tnr(11, false, true),
    alignment: { horizontal: 'center', vertical: 'center' },
    fill: { fgColor: { rgb: 'DEEAF1' }, patternType: 'solid' },
  })

  // Signature
  ;[SIG_AOA, SIG_AOA + 1].forEach((ai, i) => {
    applyStyle(cellAddr(NUM_COLS - 2, ai + 1), {
      font: tnr(11, i === 1, i === 0),
      alignment: { horizontal: 'center', vertical: 'center' },
    })
  })

  // ── Write ─────────────────────────────────────────────────────────────────
  const sheetName = docType === 'DSGD' ? 'Bảng Điểm' : docType === 'QD' ? 'Quyết Định' : 'Kế Hoạch'
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  const safeName = docName.replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|]/g, '_')
  XLSX.writeFile(wb, `${safeName}.xlsx`, { cellStyles: true })
}

/**
 * Xuất báo cáo đối chiếu
 */
export function exportReconciliationReport(
  matched: any[],
  missing: any[],
  extra: any[],
  fileName: string = 'reconciliation_report'
) {
  const workbook = XLSX.utils.book_new()

  // Sheet 1: Khớp
  const matchedSheet = XLSX.utils.json_to_sheet(matched)
  matchedSheet['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(workbook, matchedSheet, 'Khớp')

  // Sheet 2: Thiếu
  const missingSheet = XLSX.utils.json_to_sheet(missing)
  missingSheet['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(workbook, missingSheet, 'Thiếu')

  // Sheet 3: Thừa
  const extraSheet = XLSX.utils.json_to_sheet(extra)
  extraSheet['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(workbook, extraSheet, 'Thừa')

  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}
