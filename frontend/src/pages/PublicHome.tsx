import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { activitiesApi } from '../services/api'
import PublicLayout from '../components/Layout/PublicLayout'
import { useSettings } from '../hooks/useSettings'

interface Activity {
  _id: string
  title: string
  description: string
  content: string
  icon: string
  category: string
  isActive: boolean
  media: Array<{ _id: string; fileName: string; mimeType: string }>
  createdAt?: string
}

export default function PublicHome() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [featuredActivities, setFeaturedActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const { getSetting } = useSettings()

  // Get settings
  const primaryColor = getSetting('color_header', '#2B3A9F')
  const highlightColor = getSetting('color_highlight', '#fbbf24')
  const logoUrl = getSetting('logo_url', '')
  const homeBannerUrl = getSetting('home_banner_url', '')
  const centerNameVi = getSetting('center_name_vi', 'TRUNG TÂM GIÁO DỤC QUỐC PHÒNG VÀ AN NINH')
  const centerNameEn = getSetting('center_name_en', 'Center for National Defense and Security Education')
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  useEffect(() => {
    async function loadActivities() {
      try {
        const res = await activitiesApi.list()
        const allActivities = (res.data.data || []).filter((a: Activity) => a.isActive)
        setActivities(allActivities.slice(0, 6))
        setFeaturedActivities(allActivities.slice(0, 3))
      } catch (err) {
        console.error('Error loading activities:', err)
      } finally {
        setLoading(false)
      }
    }
    loadActivities()
  }, [])

  // Auto-advance slider
  useEffect(() => {
    if (featuredActivities.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % featuredActivities.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [featuredActivities.length])

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  if (loading) {
    return (
      <PublicLayout title="TRANG CHỦ">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: primaryColor }}></div>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout title="TRANG CHỦ">
      <div className="w-full bg-gray-50 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Featured Slider */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {loading ? (
                <div className="h-96 flex items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: primaryColor }}></div>
                </div>
              ) : featuredActivities.length > 0 ? (
                <div className="relative h-96">
                  {featuredActivities.map((activity, idx) => (
                    <Link
                      key={activity._id}
                      to={`/hoat-dong/${activity._id}`}
                      className={`absolute inset-0 transition-opacity duration-500 ${
                        idx === currentSlide ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {activity.media && activity.media.length > 0 ? (
                        <img
                          src={activitiesApi.getMediaUrl(activity._id, 0)}
                          alt={activity.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                          <span className="text-8xl">{activity.icon || '📋'}</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                        <h3 className="text-white text-xl font-bold">{activity.title}</h3>
                        <p className="text-white/90 text-sm mt-2 line-clamp-2">{activity.description}</p>
                      </div>
                    </Link>
                  ))}
                  
                  {/* Slider Dots */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                    {featuredActivities.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`w-3 h-3 rounded-full transition-all ${
                          idx === currentSlide ? 'w-8' : 'bg-white/50'
                        }`}
                        style={idx === currentSlide ? { backgroundColor: highlightColor } : {}}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center bg-gray-100">
                  <p className="text-gray-500">Chưa có hoạt động nổi bật</p>
                </div>
              )}
            </div>

            {/* News Section */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold uppercase pb-2 inline-block" style={{ color: primaryColor, borderBottom: `3px solid ${highlightColor}` }}>
                  TIN TỨC - SỰ KIỆN
                </h2>
                <Link to="/hoat-dong" className="text-sm hover:underline" style={{ color: primaryColor }}>
                  Xem tất cả »
                </Link>
              </div>
              <div className="space-y-4">
                {activities.slice(0, 5).map((activity) => (
                  <Link
                    key={activity._id}
                    to={`/hoat-dong/${activity._id}`}
                    className="flex gap-3 group"
                  >
                    <div className="text-gray-400 text-sm">📌</div>
                    <div className="flex-1">
                      <h4 className="text-gray-900 group-hover:underline font-medium">
                        {activity.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString('vi-VN') : ''}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Media Section */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold uppercase pb-2 inline-block" style={{ color: primaryColor, borderBottom: `3px solid ${highlightColor}` }}>
                  HÌNH ẢNH - VIDEO
                </h2>
                <Link to="/hoat-dong" className="text-sm hover:underline" style={{ color: primaryColor }}>
                  Xem tất cả »
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {activities.slice(0, 4).map((activity) => (
                  <Link
                    key={activity._id}
                    to={`/hoat-dong/${activity._id}`}
                    className="group"
                  >
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                      {activity.media && activity.media.length > 0 ? (
                        <img
                          src={activitiesApi.getMediaUrl(activity._id, 0)}
                          alt={activity.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                          <span className="text-4xl">{activity.icon || '📋'}</span>
                        </div>
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 mt-2 line-clamp-2 group-hover:underline">
                      {activity.title}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Recent Activities & Calendar */}
          <div className="space-y-6">
            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold uppercase mb-4 pb-2 inline-block" style={{ color: primaryColor, borderBottom: `3px solid ${highlightColor}` }}>
                Hoạt động gần nhất
              </h3>
              <div className="space-y-4 mt-4">
                {activities.slice(0, 4).map((activity) => (
                  <Link
                    key={activity._id}
                    to={`/hoat-dong/${activity._id}`}
                    className="block group"
                  >
                    <div className="flex gap-3">
                      <div className="w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                        {activity.media && activity.media.length > 0 ? (
                          <img
                            src={activitiesApi.getMediaUrl(activity._id, 0)}
                            alt={activity.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-2xl" style={{ backgroundColor: primaryColor }}>
                            {activity.icon || '📋'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 group-hover:underline line-clamp-2">
                          {activity.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString('vi-VN') : ''}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold uppercase mb-4 text-center" style={{ color: primaryColor }}>
                LỊCH
              </h3>
              <div className="text-center mb-3">
                <div className="font-bold text-lg" style={{ color: highlightColor }}>
                  Tháng {currentMonth + 1}/{currentYear}
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs text-center">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                  <div key={day} className="font-semibold py-2" style={{ color: primaryColor }}>
                    {day}
                  </div>
                ))}
                {Array.from({ length: 35 }, (_, i) => {
                  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
                  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
                  const dayNumber = i - (firstDay === 0 ? 6 : firstDay - 1) + 1
                  const isCurrentDay = dayNumber === currentDate.getDate()
                  const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth

                  return (
                    <div
                      key={i}
                      className={`py-2 rounded ${
                        isCurrentDay
                          ? 'font-bold text-white'
                          : isValidDay
                          ? 'text-gray-700 hover:bg-gray-100'
                          : 'text-gray-300'
                      }`}
                      style={isCurrentDay ? { backgroundColor: highlightColor } : {}}
                    >
                      {isValidDay ? dayNumber : ''}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </PublicLayout>
  )
}
