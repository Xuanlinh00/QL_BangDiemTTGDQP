import { useState } from 'react'

const mockDecisions = [
  { id: 1, number: '275/2015', date: '2015-12-09', cohort: 2012, system: 'CĐ', total_students: 437, matched: 429, reconciled: true },
  { id: 2, number: '180/2016', date: '2016-08-15', cohort: 2013, system: 'ĐH', total_students: 520, matched: 515, reconciled: true },
  { id: 3, number: '92/2017', date: '2017-05-20', cohort: 2014, system: 'CĐ', total_students: 380, matched: 375, reconciled: false },
]

export default function Decisions() {
  const [selectedDecision, setSelectedDecision] = useState<any>(null)
  const [showReconcileModal, setShowReconcileModal] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản lý Quyết định Công nhận</h1>
          <p className="text-gray-600 mt-1">Quản lý các quyết định công nhận GDQP-AN</p>
        </div>
        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
          ➕ Thêm Quyết định
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Số QĐ</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ngày ban hành</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Khóa/Hệ</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Số SV (QĐ)</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Số SV khớp</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tỷ lệ khớp</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {mockDecisions.map((decision) => {
              const matchRate = ((decision.matched / decision.total_students) * 100).toFixed(1)
              return (
                <tr key={decision.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{decision.number}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{decision.date}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {decision.system} {decision.cohort}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">{decision.total_students}</td>
                  <td className="px-6 py-4 font-medium text-green-600">{decision.matched}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${matchRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{matchRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${decision.reconciled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {decision.reconciled ? '✓ Xác thực' : '⏳ Chờ'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedDecision(decision)
                          setShowReconcileModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Đối chiếu
                      </button>
                      <button className="text-gray-600 hover:text-gray-800 font-medium text-sm">
                        Xem
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-3xl font-bold text-blue-600">{mockDecisions.length}</p>
          <p className="text-gray-600 text-sm mt-1">Tổng QĐ</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-3xl font-bold text-green-600">2</p>
          <p className="text-gray-600 text-sm mt-1">Đã xác thực</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-3xl font-bold text-yellow-600">1</p>
          <p className="text-gray-600 text-sm mt-1">Chờ xác thực</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-3xl font-bold text-purple-600">1,337</p>
          <p className="text-gray-600 text-sm mt-1">Tổng SV</p>
        </div>
      </div>

      {/* Reconcile Modal */}
      {showReconcileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Đối chiếu QĐ {selectedDecision?.number}</h2>
              <button
                onClick={() => setShowReconcileModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedDecision?.matched}</p>
                  <p className="text-gray-600 text-sm mt-1">Khớp</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{(selectedDecision?.total_students || 0) - (selectedDecision?.matched || 0)}</p>
                  <p className="text-gray-600 text-sm mt-1">Thiếu</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <p className="text-2xl font-bold text-red-600">0</p>
                  <p className="text-gray-600 text-sm mt-1">Thừa</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowReconcileModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
                >
                  Đóng
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                  Tạo báo cáo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
