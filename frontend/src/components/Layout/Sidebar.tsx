import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

const menuSections = [
  {
    title: '',
    items: [
      { label: 'Trang chủ', path: '/about', icon: 'home' },
    ]
  },
  {
    title: 'QUẢN LÝ',
    items: [
      { label: 'Bảng điểm', path: '/documents', icon: 'documents' },
      { label: 'Quyết định', path: '/decisions', icon: 'decisions' },
      { label: 'Cấp chứng chỉ', path: '/certificates', icon: 'certificates' },
    ]
  },
  {
    title: 'CÔNG CỤ',
    items: [
      { label: 'Trích xuất PDF TVU', path: '/tvu-extract', icon: 'extract' },
    ]
  },
 
  {
    title: '',
    items: [
      { label: 'Cài đặt', path: '/settings', icon: 'settings' },
    ]
  }
]

function NavIcon({ name, className }: { name: string; className?: string }) {
  const cls = className || 'w-5 h-5'
  const icons: Record<string, JSX.Element> = {
    home: <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    documents: <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    decisions: <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    data: <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    certificates: <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
    extract: <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6" /></svg>,
    settings: <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  }
  return icons[name] || null
}

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
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-primary-900 dark:bg-primary-950 text-white transition-all duration-300 flex flex-col shadow-lg flex-shrink-0 border-r border-primary-800`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-primary-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-400 to-accent-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              QP
            </div>
            <span className="text-sm font-bold text-white">GDQP-AN</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-primary-800 rounded-lg transition-colors"
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          <svg className={`w-4 h-4 text-primary-300 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-6">
        {menuSections.map((section, idx) => (
          <div key={section.title || `section-${idx}`}>
            {!collapsed && section.title && (
              <div className="px-4 py-2">
                <p className="text-xs font-bold text-primary-300 uppercase tracking-wider">{section.title}</p>
              </div>
            )}
            <div className={`space-y-1 ${!collapsed ? 'px-2' : 'px-1'}`}>
              {section.items.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-accent-500 text-white shadow-md'
                        : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                    }`}
                    title={collapsed ? item.label : ''}
                  >
                    <NavIcon name={item.icon} className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={`border-t border-primary-800 ${!collapsed ? 'p-3 space-y-2' : 'p-2 space-y-1'}`}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-danger-300 hover:bg-danger-900/30 hover:text-danger-200 transition-colors text-sm font-medium"
          title={collapsed ? 'Đăng xuất' : ''}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  )
}
