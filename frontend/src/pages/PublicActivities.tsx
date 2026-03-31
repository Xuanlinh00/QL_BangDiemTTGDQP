import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { activitiesApi } from '../services/api'

interface MediaItem {
  _id: string
  fileName: string
  mimeType: string
}

interface Activity {
  _id: string
  title: string
  description: string
  content: string
  icon: string
  category: string
  order: number
  isActive: boolean
  media: MediaItem[]
  previewImage?: string // For localStorage preview
  createdAt?: string
}

// LocalStorage helpers
const LOCAL_STORAGE_KEY = 'local_activities'

function getLocalActivities(): Activity[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export default function PublicActivities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true)
      const res = await activitiesApi.list()
      // Only show active activities
      const activeActivities = (res.data.data || []).filter((a: Activity) => a.isActive)
      // Merge with local activities
      const localActivities = getLocalActivities().filter(a => a.isActive)
      setActivities([...activeActivities, ...localActivities])
    } catch (err) {
      console.error('Error loading activities:', err)
      // Fallback to localStorage
      const localActivities = getLocalActivities().filter(a => a.isActive)
      setActivities(localActivities)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-[#1e3a8a] text-white">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <nav className="flex items-center gap-8 text-sm font-medium">
              <Link to="/gioi-thieu" className="hover:text-yellow-300 transition-colors">TRANG CHỦ</Link>
              <span className="hover:text-yellow-300 transition-colors cursor-pointer">GIỚI THIỆU</span>
              <span className="hover:text-yellow-300 transition-colors cursor-pointer">TIN TỨC - SỰ KIỆN</span>
              <Link to="/hoat-dong" className="text-yellow-300 font-bold">HOẠT ĐỘNG</Link>
              <span className="hover:text-yellow-300 transition-colors cursor-pointer">LIÊN KẾT</span>
              <span className="hover:text-yellow-300 transition-colors cursor-pointer">THÔNG BÁO</span>
            </nav>
          </div>
        </div>

        {/* Title Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-10 bg-yellow-400"></div>
              <h1 className="text-3xl font-bold text-white tracking-wide">HOẠT ĐỘNG</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <div className="bg-[#1e3a8a] text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-8 text-sm font-medium">
            <Link to="/gioi-thieu" className="hover:text-yellow-300 transition-colors">TRANG CHỦ</Link>
            <span className="hover:text-yellow-300 transition-colors cursor-pointer">GIỚI THIỆU</span>
            <span className="hover:text-yellow-300 transition-colors cursor-pointer">TIN TỨC - SỰ KIỆN</span>
            <Link to="/hoat-dong" className="text-yellow-300 font-bold">HOẠT ĐỘNG</Link>
            <span className="hover:text-yellow-300 transition-colors cursor-pointer">LIÊN KẾT</span>
            <span className="hover:text-yellow-300 transition-colors cursor-pointer">THÔNG BÁO</span>
          </nav>
        </div>
      </div>

      {/* Title Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-yellow-400"></div>
            <h1 className="text-3xl font-bold text-white tracking-wide">HOẠT ĐỘNG</h1>
          </div>
        </div>
      </div>

      {/* Activities Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {activities.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Chưa có hoạt động nào được đăng tải.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activities.map((activity) => (
              <Link
                key={activity._id}
                to={`/hoat-dong/${activity._id}`}
                className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
              >
                {/* Image */}
                <div className="relative h-56 overflow-hidden">
                  {activity.previewImage ? (
                    <img
                      src={activity.previewImage}
                      alt={activity.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : activity.media && activity.media.length > 0 ? (
                    <img
                      src={activitiesApi.getMediaUrl(activity._id, 0)}
                      alt={activity.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <span className="text-6xl">{activity.icon || '📋'}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {activity.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                    {activity.description || (activity.content ? activity.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : '')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-100 border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p>© {new Date().getFullYear()} Trung tâm Giáo dục Quốc phòng và An ninh - Đại học Trà Vinh</p>
        </div>
      </div>
    </div>
  )
}
