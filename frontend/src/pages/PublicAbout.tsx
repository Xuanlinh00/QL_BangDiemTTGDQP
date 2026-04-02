import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { activitiesApi, aboutSectionsApi } from '../services/api'
import PublicLayout from '../components/Layout/PublicLayout'
import { useSettings } from '../hooks/useSettings'

interface Activity {
  _id: string
  title: string
  description: string
  date: string
  category: string
  media: Array<{ type: string; url: string }>
}

interface AboutSection {
  _id: string
  title: string
  content: string
  order: number
  type: 'paragraph' | 'list' | 'quote'
  isActive: boolean
  media?: Array<{
    type: 'image' | 'video'
    url: string
    fileName: string
  }>
}

export default function PublicAbout() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [sections, setSections] = useState<AboutSection[]>([])
  const [loading, setLoading] = useState(true)
  const { getSetting } = useSettings()

  // Get settings for colors
  const primaryColor = getSetting('color_header', '#2B3A9F')
  const address = getSetting('contact_address', 'Số 126 Nguyễn Thiện Thành, Khóm 4, Phường 5, TP. Trà Vinh, Tỉnh Trà Vinh')
  const phone = getSetting('contact_phone', '(0294) 3855246')
  const fax = getSetting('contact_fax', '(0294) 3855247')
  const email = getSetting('contact_email', 'gdqp@tvu.edu.vn')

  // Get content settings
  const introTitle = getSetting('intro_title', 'Trung tâm Giáo dục Quốc phòng và An ninh - Trường Đại học Trà Vinh')

  useEffect(() => {
    async function loadData() {
      try {
        const [activitiesRes, sectionsRes] = await Promise.all([
          activitiesApi.list(),
          aboutSectionsApi.list()
        ])
        setActivities((activitiesRes.data.data || []).slice(0, 6))
        setSections((sectionsRes.data.data || []).filter((s: AboutSection) => s.isActive))
      } catch (e) {
        console.error('Failed to load data:', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <PublicLayout title="GIỚI THIỆU TRUNG TÂM">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: primaryColor }}></div>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout title="GIỚI THIỆU TRUNG TÂM">
      <div className="max-w-7xl mx-auto px-4 py-12 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {/* Page Title */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 pb-2 inline-block" style={{ borderBottom: `4px solid ${primaryColor}` }}>
                GIỚI THIỆU
              </h2>
            </div>

            {/* Introduction Content */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="prose max-w-none">
                <h3 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
                  {introTitle}
                </h3>
                
                <div className="mb-6">
                  <img
                    src="/tt.jpg"
                    alt="Tổng quan trung tâm"
                    className="w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src =
                        `https://via.placeholder.com/800x256/${primaryColor.replace('#', '')}/FFFFFF?text=Trung+tam+GDQP-AN`;
                    }}
                  />
                </div>

                {sections.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Chưa có nội dung giới thiệu</p>
                ) : (
                  sections.map((section, index) => (
                    <div key={section._id} className="mb-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        {index + 1}. {section.title}
                      </h4>
                      
                      {/* Media Gallery */}
                      {section.media && section.media.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                          {section.media.map((media, idx) => (
                            <div key={idx} className="rounded-lg overflow-hidden border border-gray-200">
                              {media.type === 'image' ? (
                                <img 
                                  src={media.url} 
                                  alt={media.fileName} 
                                  className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <video 
                                  src={media.url} 
                                  controls 
                                  className="w-full h-48 object-cover"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {section.type === 'paragraph' && (
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {section.content}
                        </p>
                      )}
                      
                      {section.type === 'list' && (
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                          {section.content.split('\n').filter(line => line.trim()).map((line, idx) => (
                            <li key={idx}>{line}</li>
                          ))}
                        </ul>
                      )}
                      
                      {section.type === 'quote' && (
                        <div className="border-l-4 p-4" style={{ backgroundColor: `${primaryColor}10`, borderColor: primaryColor }}>
                          <p className="text-gray-700 italic whitespace-pre-line">
                            "{section.content}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>Thông tin liên hệ</h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Địa chỉ:</p>
                    <p>{address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Điện thoại:</p>
                    <p>{phone} - Fax: {fax}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Email:</p>
                    <p>{email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <div>
                    <p className="font-semibold">Website:</p>
                    <a href="https://tvu.edu.vn" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline">
                      www.tvu.edu.vn
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Activities Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 pb-2 mb-4 inline-block" style={{ borderBottom: `4px solid ${primaryColor}` }}>
                HOẠT ĐỘNG
              </h3>
              <Link to="/hoat-dong" className="text-sm text-blue-600 hover:text-blue-800 float-right">
                Xem tất cả »
              </Link>
              <div className="clear-both"></div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-4 mt-4">
                  {activities.map((activity) => (
                    <Link
                      key={activity._id}
                      to={`/hoat-dong/${activity._id}`}
                      className="block group"
                    >
                      <div className="flex gap-3">
                        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          {activity.media && activity.media.length > 0 ? (
                            <img
                              src={activity.media[0].url}
                              alt={activity.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.src = `https://via.placeholder.com/80x80/${primaryColor.replace('#', '')}/FFFFFF?text=TVU`
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: primaryColor }}>
                              TVU
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:transition-colors" style={{ color: 'inherit' }} onMouseEnter={(e) => e.currentTarget.style.color = primaryColor} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                            {activity.title}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.date).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">Chưa có hoạt động nào</p>
              )}
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 pb-2 mb-4 inline-block" style={{ borderBottom: `4px solid ${primaryColor}` }}>
                LIÊN KẾT NHANH
              </h3>
              <ul className="space-y-2 mt-4">
                <li>
                  <a href="https://tvu.edu.vn" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 flex items-center gap-2 hover:transition-colors" onMouseEnter={(e) => e.currentTarget.style.color = primaryColor} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                    <span style={{ color: primaryColor }}>▸</span>
                    Trường Đại học Trà Vinh
                  </a>
                </li>
                <li>
                  <a href="https://moet.gov.vn" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 flex items-center gap-2 hover:transition-colors" onMouseEnter={(e) => e.currentTarget.style.color = primaryColor} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                    <span style={{ color: primaryColor }}>▸</span>
                    Bộ Giáo dục và Đào tạo
                  </a>
                </li>
                <li>
                  <a href="https://mod.gov.vn" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 flex items-center gap-2 hover:transition-colors" onMouseEnter={(e) => e.currentTarget.style.color = primaryColor} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                    <span style={{ color: primaryColor }}>▸</span>
                    Bộ Quốc phòng
                  </a>
                </li>
                <li>
                  <a href="https://mps.gov.vn" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 flex items-center gap-2 hover:transition-colors" onMouseEnter={(e) => e.currentTarget.style.color = primaryColor} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                    <span style={{ color: primaryColor }}>▸</span>
                    Bộ Công an
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
