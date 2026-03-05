import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

const menuItems = [
  { label: 'Dashboard', path: '/', icon: '📊', badge: null },
  { label: 'Tài liệu Scan', path: '/documents', icon: '📄', badge: '12' },
  { label: 'Dữ liệu Extract', path: '/data', icon: '📋', badge: null },
  { label: 'Quyết định', path: '/decisions', icon: '✅', badge: '5' },
  { label: 'Đối chiếu', path: '/reconcile', icon: '🔍', badge: null },
  { label: 'Báo cáo', path: '/reports', icon: '📈', badge: null },
  { label: 'Cài đặt', path: '/settings', icon: '⚙️', badge: null },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 flex flex-col shadow-xl`}>
      {/* Logo */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                T
              </div>
              <div>
                <h1 className="text-sm font-bold">TVU</h1>
                <p className="text-xs text-slate-400">GDQP-AN</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
            title={collapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              title={collapsed ? item.label : ''}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && item.badge && (
                <span className="absolute -right-2 -top-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700 space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm">
          <span className="text-lg">❓</span>
          {!collapsed && <span>Trợ giúp</span>}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-colors text-sm font-medium"
        >
          <span className="text-lg">🚪</span>
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  )
}
