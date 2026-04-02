import { Link, useLocation } from 'react-router-dom'
import { useSettings } from '../../hooks/useSettings'

interface PublicLayoutProps {
  children: React.ReactNode
  title: string
}

export default function PublicLayout({ children, title }: PublicLayoutProps) {
  const location = useLocation()
  const { getSetting, loading } = useSettings()

  const isActive = (path: string) => location.pathname === path

  // Get settings from API
  const centerNameVi = getSetting('center_name_vi', 'TRUNG TÂM GIÁO DỤC QUỐC PHÒNG VÀ AN NINH')
  const schoolNameVi = getSetting('school_name_vi', 'TRƯỜNG ĐẠI HỌC TRÀ VINH')
  const address = getSetting('contact_address', 'Số 126, Nguyễn Thiện Thành, Khóm 4, Phường 5, TP. Trà Vinh')
  const phone = getSetting('contact_phone', '(0294) 3855246')
  const email = getSetting('contact_email', 'gdqp@tvu.edu.vn')
  const facebookUrl = getSetting('social_facebook', 'https://facebook.com/tvuniversity')
  const youtubeUrl = getSetting('social_youtube', 'https://youtube.com/@tvuniversity')
  const headerColor = getSetting('color_header', '#2B3A9F')
  const highlightColor = getSetting('color_highlight', '#fbbf24')
  const logoUrl = getSetting('logo_url', '')
  const bannerUrl = getSetting('banner_url', '')
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Logo and Banner */}
      <div style={{ backgroundColor: headerColor }} className="text-white">
        {/* Top Bar with School Name */}
        <div className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
            {/* TVU Logo - fixed from public folder */}
            <img 
              src="/tvu-logo.png" 
              alt="TVU Logo" 
              className="h-8 w-8 object-contain"
            />
            <a 
              href="https://tvu.edu.vn" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs hover:opacity-80 transition-opacity"
            >
              {schoolNameVi}
            </a>
          </div>
        </div>

        {/* Main Header with Logo, Center Name, and Banner */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-6">
            {/* Logo - Left aligned */}
            {logoUrl && (
              <div className="flex-shrink-0">
                <img 
                  src={`${API_URL}${logoUrl}`} 
                  alt="Logo" 
                  className="h-24 w-24 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}

            {/* Center Name - Takes remaining space */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">{centerNameVi}</h1>
              <p className="text-sm md:text-base mt-1" style={{ color: highlightColor }}>Center for National Defense and Security Education</p>
            </div>

            {/* Banner - Right side */}
            {bannerUrl && (
              <div className="flex-shrink-0 hidden lg:block">
                <img 
                  src={`${API_URL}${bannerUrl}`} 
                  alt="Banner" 
                  className="h-24 w-auto max-w-xs object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center justify-center gap-8 py-3 text-sm font-medium">
              <Link 
                to="/trang-chu" 
                className={`transition-opacity ${isActive('/trang-chu') ? 'font-bold' : 'hover:opacity-80'}`}
                style={isActive('/trang-chu') ? { color: highlightColor } : {}}
              >
                TRANG CHỦ
              </Link>
              <Link 
                to="/gioi-thieu" 
                className={`transition-opacity ${isActive('/gioi-thieu') ? 'font-bold' : 'hover:opacity-80'}`}
                style={isActive('/gioi-thieu') ? { color: highlightColor } : {}}
              >
                GIỚI THIỆU
              </Link>
              <Link 
                to="/hoat-dong" 
                className={`transition-opacity ${isActive('/hoat-dong') || location.pathname.startsWith('/hoat-dong/') ? 'font-bold' : 'hover:opacity-80'}`}
                style={isActive('/hoat-dong') || location.pathname.startsWith('/hoat-dong/') ? { color: highlightColor } : {}}
              >
                HOẠT ĐỘNG
              </Link>
              <a 
                href="#contact" 
                className="hover:opacity-80 transition-opacity"
              >
                LIÊN HỆ
              </a>
              <a 
                href="https://tvu.edu.vn/tin-tuc" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:opacity-80 transition-opacity"
              >
                TIN TỨC
              </a>
            </nav>
          </div>
        </div>
      </div>

      {/* Title Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10" style={{ backgroundColor: highlightColor }}></div>
            <h1 className="text-3xl font-bold text-white tracking-wide">{title}</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            <div>
              <h4 className="font-bold text-lg mb-4 text-gray-900">{centerNameVi}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {schoolNameVi}
              </p>
            </div>
            <div id="contact">
              <h4 className="font-bold text-lg mb-4 text-gray-900">LIÊN HỆ</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span>📍</span>
                  <span>{address}</span>
                </li>
                <li>📞 {phone}</li>
                <li>
                  ✉️ <a href={`mailto:${email}`} className="hover:text-blue-600 hover:underline">{email}</a>
                </li>
                <li>
                  🌐 <a href="https://tvu.edu.vn" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline">www.tvu.edu.vn</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-gray-900">THEO DÕI CHÚNG TÔI</h4>
              <div className="flex gap-3">
                <a 
                  href={facebookUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors text-white" 
                  title="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a 
                  href={youtubeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors text-white" 
                  title="YouTube"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                <a 
                  href={`mailto:${email}`} 
                  className="w-10 h-10 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors text-white" 
                  title="Email"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-300 pt-6 text-center text-sm text-gray-600">
            <p>© {new Date().getFullYear()} Trung tâm Giáo dục Quốc phòng và An ninh - Trường Đại học Trà Vinh</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
