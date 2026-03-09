import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

interface TreeNode {
  id: string
  label: string
  icon: string
  children?: TreeNode[]
  path?: string
}

// Generate year nodes from 2014 to current year
const currentYear = new Date().getFullYear()

const documentTree: TreeNode[] = [
  {
    id: 'qd', label: 'Quyết định', icon: '📑',
    path: '/decisions',
  },
  {
    id: 'bm', label: 'Biểu mẫu', icon: '📝',
    path: '/documents?type=BieuMau',
  },
  {
    id: 'bd', label: 'Bảng điểm', icon: '📊',
    path: '/documents',
  },
]

const quickMenuItems = [
  { label: 'Trang chủ', path: '/', icon: 'home' },
  { label: 'Giới thiệu', path: '/about', icon: 'info' },
  { label: 'Quyết định', path: '/decisions', icon: 'check' },
  { label: 'Báo cáo', path: '/reports', icon: 'chart' },
  { label: 'Cài đặt', path: '/settings', icon: 'settings' },
]

function NavIcon({ name, className }: { name: string; className?: string }) {
  const cls = className || 'w-5 h-5'
  const icons: Record<string, JSX.Element> = {
    home: <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    folder: <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
    check: <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    database: <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>,
    chart: <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    info: <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    settings: <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  }
  return icons[name] || null
}

function TreeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const hasChildren = node.children && node.children.length > 0

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) {
            setExpanded(!expanded)
          } else if (node.path) {
            navigate(node.path)
          }
        }}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors group"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          <svg
            className={`w-3.5 h-3.5 flex-shrink-0 text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <span className="w-3.5 h-3.5 flex-shrink-0" />
        )}
        <span className="flex-shrink-0">{node.icon}</span>
        <span className="truncate">{node.label}</span>
      </button>
      {expanded && hasChildren && (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-700" style={{ marginLeft: `${depth * 16}px` }} />
          {node.children!.map(child => (
            <TreeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [docTreeOpen, setDocTreeOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-72'} bg-gradient-to-b from-primary-900 to-slate-900 dark:from-slate-950 dark:to-slate-900 text-white transition-all duration-300 flex flex-col shadow-xl flex-shrink-0`}>
      {/* Collapse Toggle */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        {!collapsed && (
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Quick Navigation */}
      <nav className="p-2 space-y-0.5">
        {quickMenuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-500/20 text-white shadow-inner border border-primary-400/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
              title={collapsed ? item.label : ''}
            >
              <NavIcon name={item.icon} className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Document Tree Section */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          <button
            onClick={() => setDocTreeOpen(!docTreeOpen)}
            className="flex items-center gap-2 w-full px-3 py-2 mt-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="flex-1 text-left">Tài liệu Scan</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${docTreeOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {docTreeOpen && (
            <div className="mt-1 space-y-0.5">
              {documentTree.map(node => (
                <TreeItem key={node.id} node={node} />
              ))}
            </div>
          )}
        </div>
      )}

      {collapsed && <div className="flex-1" />}

      {/* Footer */}
      <div className="p-2 border-t border-white/10 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {!collapsed && <span>Trợ giúp</span>}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-400 hover:bg-red-600/10 hover:text-red-300 transition-colors text-sm font-medium"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  )
}
