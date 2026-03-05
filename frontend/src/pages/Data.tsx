import { useState } from 'react'

const mockStudents = [
  { id: 1, code: 'SV001', name: 'Nguyễn Văn A', class: 'DA21A1', cohort: 2021, dob: '2003-01-15' },
  { id: 2, code: 'SV002', name: 'Trần Thị B', class: 'DA21A1', cohort: 2021, dob: '2003-05-20' },
  { id: 3, code: 'SV003', name: 'Lê Văn C', class: 'DA21A2', cohort: 2021, dob: '2003-08-10' },
]

export default function Data() {
  const [activeTab, setActiveTab] = useState('students')
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản lý Dữ liệu Extract</h1>
          <p className="text-gray-600 mt-1">Quản lý sinh viên và điểm số đã trích xuất</p>
        </div>
        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
          📥 Export Excel
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="flex gap-4 border-b border-gray-200 p-6">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'students'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            👥 Sinh viên ({mockStudents.length})
          </button>
          <button
            onClick={() => setActiveTab('scores')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'scores'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            📊 Điểm số (1,250)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder={activeTab === 'students' ? 'Tìm kiếm sinh viên...' : 'Tìm kiếm điểm...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Tất cả khóa</option>
            <option>2021</option>
            <option>2022</option>
            <option>2023</option>
          </select>
          <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors">
            Sửa hàng loạt
          </button>
        </div>
      </div>

      {activeTab === 'students' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Mã SV</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Họ tên</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Lớp</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Khóa</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ngày sinh</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {mockStudents.map((student) => (
                <tr key={student.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{student.code}</td>
                  <td className="px-6 py-4">{student.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {student.class}
                    </span>
                  </td>
                  <td className="px-6 py-4">{student.cohort}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.dob}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">Xem</button>
                      <button className="text-gray-600 hover:text-gray-800 font-medium text-sm">Sửa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'scores' && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <p className="text-lg">📊 Danh sách điểm sẽ được hiển thị tại đây</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-3xl font-bold text-blue-600">45,000</p>
          <p className="text-gray-600 text-sm mt-1">Tổng sinh viên</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-3xl font-bold text-green-600">95,000</p>
          <p className="text-gray-600 text-sm mt-1">Bản ghi điểm</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-3xl font-bold text-purple-600">42</p>
          <p className="text-gray-600 text-sm mt-1">Mã học phần</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-3xl font-bold text-orange-600">7</p>
          <p className="text-gray-600 text-sm mt-1">Xếp loại</p>
        </div>
      </div>
    </div>
  )
}
