import React from 'react'

interface TableColumn {
  key: string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: any, row: any) => React.ReactNode
}

interface TableProps {
  columns: TableColumn[]
  data: any[]
  loading?: boolean
  emptyMessage?: string
  rowKey?: string
  onRowClick?: (row: any) => void
  actions?: (row: any) => React.ReactNode
}

export default function Table({
  columns,
  data,
  loading = false,
  emptyMessage = 'Không có dữ liệu',
  rowKey = '_id',
  onRowClick,
  actions,
}: TableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-400">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500 dark:text-slate-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-sm font-semibold text-gray-700 dark:text-slate-300 text-${column.align || 'left'}`}
                style={{ width: column.width }}
              >
                {column.label}
              </th>
            ))}
            {actions && (
              <th className="px-6 py-3 text-sm font-semibold text-gray-700 dark:text-slate-300 text-right">
                Hành động
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={row[rowKey] || index}
              className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td
                  key={`${row[rowKey] || index}-${column.key}`}
                  className={`px-6 py-4 text-sm text-gray-900 dark:text-slate-100 text-${column.align || 'left'}`}
                >
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
              {actions && (
                <td className="px-6 py-4 text-sm text-right">
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
