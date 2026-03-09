import { Outlet } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import Sidebar from './Sidebar'
import Header from './Header'

export default function MainLayout() {
  // Initialize theme (applies 'dark' class to html)
  useTheme()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
