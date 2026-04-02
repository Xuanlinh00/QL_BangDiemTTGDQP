import { Outlet } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import Sidebar from './Sidebar'
import Header from './Header'

export default function MainLayout() {
  // Initialize theme (applies 'dark' class to html)
  useTheme()

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      <Sidebar />
      <Header />
      <main className="ml-[240px] mt-16 h-[calc(100vh-64px)] overflow-hidden">
          <div className="h-full overflow-y-auto p-6">
            <Outlet />
          </div>
        </main>
    </div>
  )
}
