import { useAuth } from '../../hooks/useAuth'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [headerSearch, setHeaderSearch] = useState('')
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'OCR processing completed for 5 documents', time: '5 min ago', read: false },
    { id: 2, message: 'Data extraction finished', time: '1 hour ago', read: false },
  ])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-lg">
          T
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">TVU GDQP-AN</h2>
          <p className="text-xs text-gray-500">Admin Portal</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-4 py-2 w-64">
          <span className="text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && headerSearch.trim()) {
                navigate(`/documents?q=${encodeURIComponent(headerSearch.trim())}`)
                setHeaderSearch('')
              }
            }}
            className="bg-transparent ml-2 outline-none text-sm w-full text-gray-700 placeholder-gray-500"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            🔔
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 pl-4 border-l border-gray-200 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
          >
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
              {user?.name?.charAt(0) || 'A'}
            </div>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                👤 Hồ sơ
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                ⚙️ Cài đặt
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                ❓ Trợ giúp
              </button>
              <div className="border-t border-gray-200 mt-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                >
                  🚪 Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
