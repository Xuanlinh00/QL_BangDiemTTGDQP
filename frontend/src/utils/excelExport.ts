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
