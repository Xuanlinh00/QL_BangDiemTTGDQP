import { useState, useEffect } from 'react'
import { settingsApi, aboutSectionsApi } from '../services/api'

type TabType = 'general' | 'content' | 'contact' | 'logo'

interface Setting {
  _id: string
  key: string
  label: string
  value: string
  category: string
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

export default function Settings() {
  // Load active tab from localStorage or URL
  const getInitialTab = (): TabType => {
    const urlParams = new URLSearchParams(window.location.search)
    const tabFromUrl = urlParams.get('tab') as TabType
    if (tabFromUrl && ['general', 'content', 'contact', 'logo'].includes(tabFromUrl)) {
      return tabFromUrl
    }
    const savedTab = localStorage.getItem('settings_active_tab') as TabType
    if (savedTab && ['general', 'content', 'contact', 'logo'].includes(savedTab)) {
      return savedTab
    }
    return 'general'
  }

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab())
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [settingsMap, setSettingsMap] = useState<Map<string, Setting>>(new Map())
  
  // About sections state
  const [sections, setSections] = useState<AboutSection[]>([])
  const [sectionsLoading, setSectionsLoading] = useState(false)
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  
  // Section form state
  const [sectionTitle, setSectionTitle] = useState('')
  const [sectionContent, setSectionContent] = useState('')
  const [sectionType, setSectionType] = useState<'paragraph' | 'list' | 'quote'>('paragraph')
  const [sectionIsActive, setSectionIsActive] = useState(true)
  const [sectionFiles, setSectionFiles] = useState<File[]>([])
  const [sectionExistingMedia, setSectionExistingMedia] = useState<Array<{type: string; url: string; fileName: string}>>([])

  // General Info - TRUNG TÂM GDQP-AN
  const [centerNameVi, setCenterNameVi] = useState('TRUNG TÂM GIÁO DỤC QUỐC PHÒNG VÀ AN NINH')
  const [centerNameEn, setCenterNameEn] = useState('Center for National Defense and Security Education')

  // School Info - TRƯỜNG ĐẠI HỌC TRÀ VINH
  const [schoolNameVi, setSchoolNameVi] = useState('TRƯỜNG ĐẠI HỌC TRÀ VINH')
  const [schoolNameEn, setSchoolNameEn] = useState('Tra Vinh University')

  // Contact Info
  const [address, setAddress] = useState('Số 126, Nguyễn Thiện Thành, Khóm 4, Phường 5, TP. Trà Vinh, Tỉnh Trà Vinh')
  const [phone, setPhone] = useState('(0294) 3855246')
  const [fax, setFax] = useState('(0294) 3855247')
  const [email, setEmail] = useState('gdqp@tvu.edu.vn')

  // Social Media
  const [facebookUrl, setFacebookUrl] = useState('https://facebook.com/tvuniversity')
  const [youtubeUrl, setYoutubeUrl] = useState('https://youtube.com/@tvuniversity')
  const [zaloPhone, setZaloPhone] = useState('VĐ: 0901234567')

  // Logo & Banner
  const [bannerImage, setBannerImage] = useState<string | null>(null)
  const [logoImage, setLogoImage] = useState<string | null>(null)
  const [homeBannerImage, setHomeBannerImage] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingHomeBanner, setUploadingHomeBanner] = useState(false)

  // Load settings from API on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await settingsApi.list()
        const settings: Setting[] = res.data.data || []
        
        // Create map for easy lookup
        const map = new Map<string, Setting>()
        settings.forEach(s => map.set(s.key, s))
        setSettingsMap(map)

        // Update state with loaded values
        setCenterNameVi(map.get('center_name_vi')?.value || centerNameVi)
        setCenterNameEn(map.get('center_name_en')?.value || centerNameEn)
        setSchoolNameVi(map.get('school_name_vi')?.value || schoolNameVi)
        setSchoolNameEn(map.get('school_name_en')?.value || schoolNameEn)
        setAddress(map.get('contact_address')?.value || address)
        setPhone(map.get('contact_phone')?.value || phone)
        setFax(map.get('contact_fax')?.value || fax)
        setEmail(map.get('contact_email')?.value || email)
        setFacebookUrl(map.get('social_facebook')?.value || facebookUrl)
        setYoutubeUrl(map.get('social_youtube')?.value || youtubeUrl)
        setZaloPhone(map.get('social_zalo')?.value || zaloPhone)
        
        // Load logo and banner - check if they exist in database
        const logoSetting = map.get('logo_url')
        const bannerSetting = map.get('banner_url')
        const homeBannerSetting = map.get('home_banner_url')
        
        if (logoSetting?.value === 'database') {
          setLogoImage('/api/settings/logo/image')
        }
        if (bannerSetting?.value === 'database') {
          setBannerImage('/api/settings/banner/image')
        }
        if (homeBannerSetting?.value === 'database') {
          setHomeBannerImage('/api/settings/home-banner/image')
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  async function loadSections() {
    setSectionsLoading(true)
    try {
      const res = await aboutSectionsApi.list()
      setSections(res.data.data || [])
    } catch (error) {
      console.error('Failed to load sections:', error)
    } finally {
      setSectionsLoading(false)
    }
  }

  function openSectionModal(section?: AboutSection) {
    if (section) {
      setEditingSectionId(section._id)
      setSectionTitle(section.title)
      setSectionContent(section.content)
      setSectionType(section.type)
      setSectionIsActive(section.isActive)
      setSectionExistingMedia(section.media || [])
    } else {
      setEditingSectionId(null)
      setSectionTitle('')
      setSectionContent('')
      setSectionType('paragraph')
      setSectionIsActive(true)
      setSectionExistingMedia([])
    }
    setSectionFiles([])
    setShowSectionModal(true)
  }

  async function handleSaveSection() {
    if (!sectionTitle.trim() || !sectionContent.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung')
      return
    }

    try {
      const formData = new FormData()
      formData.append('title', sectionTitle)
      formData.append('content', sectionContent)
      formData.append('type', sectionType)
      formData.append('isActive', String(sectionIsActive))
      
      if (!editingSectionId) {
        formData.append('order', String(sections.length))
      }

      sectionFiles.forEach(file => {
        formData.append('media', file)
      })

      if (editingSectionId && sectionExistingMedia.length > 0) {
        formData.append('keepExistingMedia', 'true')
      }

      if (editingSectionId) {
        await aboutSectionsApi.update(editingSectionId, formData as any)
      } else {
        await aboutSectionsApi.create(formData as any)
      }

      setShowSectionModal(false)
      loadSections()
      alert('Đã lưu thành công!')
    } catch (error) {
      console.error('Failed to save section:', error)
      alert('Lỗi khi lưu. Vui lòng thử lại.')
    }
  }

  async function handleDeleteSection(id: string) {
    if (!confirm('Bạn có chắc muốn xóa phần này?')) return
    
    try {
      await aboutSectionsApi.delete(id)
      loadSections()
    } catch (error) {
      console.error('Failed to delete section:', error)
      alert('Lỗi khi xóa. Vui lòng thử lại.')
    }
  }

  async function handleToggleSectionActive(section: AboutSection) {
    try {
      await aboutSectionsApi.update(section._id, { isActive: !section.isActive })
      loadSections()
    } catch (error) {
      console.error('Failed to toggle active:', error)
    }
  }

  // Load sections when switching to content tab
  useEffect(() => {
    if (activeTab === 'content' && sections.length === 0) {
      loadSections()
    }
  }, [activeTab])

  // Save active tab to localStorage and URL when it changes
  useEffect(() => {
    localStorage.setItem('settings_active_tab', activeTab)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', activeTab)
    window.history.replaceState({}, '', url.toString())
  }, [activeTab])

  async function handleUploadLogo(file: File) {
    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)
      
      const res = await settingsApi.uploadLogo(formData)
      const uploadedUrl = res.data.data.url
      setLogoImage(uploadedUrl)
      
      // Reload settings to ensure sync
      const settingsRes = await settingsApi.list()
      const settingsArray = settingsRes.data.data || []
      const map = new Map()
      settingsArray.forEach((s: any) => map.set(s.key, s))
      setSettingsMap(map)
      
      alert('Đã tải logo lên thành công!')
    } catch (error) {
      console.error('Failed to upload logo:', error)
      alert('Lỗi khi tải logo lên. Vui lòng thử lại.')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleUploadBanner(file: File) {
    setUploadingBanner(true)
    try {
      const formData = new FormData()
      formData.append('banner', file)
      
      const res = await settingsApi.uploadBanner(formData)
      const uploadedUrl = res.data.data.url
      setBannerImage(uploadedUrl)
      
      // Reload settings to ensure sync
      const settingsRes = await settingsApi.list()
      const settingsArray = settingsRes.data.data || []
      const map = new Map()
      settingsArray.forEach((s: any) => map.set(s.key, s))
      setSettingsMap(map)
      
      alert('Đã tải banner lên thành công!')
    } catch (error) {
      console.error('Failed to upload banner:', error)
      alert('Lỗi khi tải banner lên. Vui lòng thử lại.')
    } finally {
      setUploadingBanner(false)
    }
  }

  async function handleDeleteLogo() {
    if (!confirm('Bạn có chắc muốn xóa logo?')) return
    
    try {
      await settingsApi.deleteLogo()
      setLogoImage(null)
      
      // Reload settings
      const settingsRes = await settingsApi.list()
      const settingsArray = settingsRes.data.data || []
      const map = new Map()
      settingsArray.forEach((s: any) => map.set(s.key, s))
      setSettingsMap(map)
      
      alert('Đã xóa logo thành công!')
    } catch (error: any) {
      console.error('Failed to delete logo:', error)
      console.error('Error details:', error.response?.data)
      alert(`Lỗi khi xóa logo: ${error.response?.data?.error || error.message}`)
    }
  }

  async function handleDeleteBanner() {
    if (!confirm('Bạn có chắc muốn xóa banner?')) return
    
    try {
      await settingsApi.deleteBanner()
      setBannerImage(null)
      
      // Reload settings
      const settingsRes = await settingsApi.list()
      const settingsArray = settingsRes.data.data || []
      const map = new Map()
      settingsArray.forEach((s: any) => map.set(s.key, s))
      setSettingsMap(map)
      
      alert('Đã xóa banner thành công!')
    } catch (error: any) {
      console.error('Failed to delete banner:', error)
      console.error('Error details:', error.response?.data)
      alert(`Lỗi khi xóa banner: ${error.response?.data?.error || error.message}`)
    }
  }

  async function handleUploadHomeBanner(file: File) {
    setUploadingHomeBanner(true)
    try {
      const formData = new FormData()
      formData.append('homeBanner', file)
      
      const res = await settingsApi.uploadHomeBanner(formData)
      setHomeBannerImage(res.data.data.url)
      
      // Reload settings
      const settingsRes = await settingsApi.list()
      const settingsArray = settingsRes.data.data || []
      const map = new Map()
      settingsArray.forEach((s: any) => map.set(s.key, s))
      setSettingsMap(map)
      
      alert('Đã tải banner trang chủ lên thành công!')
    } catch (error) {
      console.error('Failed to upload home banner:', error)
      alert('Lỗi khi tải banner trang chủ lên. Vui lòng thử lại.')
    } finally {
      setUploadingHomeBanner(false)
    }
  }

  async function handleDeleteHomeBanner() {
    if (!confirm('Bạn có chắc muốn xóa banner trang chủ?')) return
    
    try {
      await settingsApi.deleteHomeBanner()
      setHomeBannerImage(null)
      
      // Reload settings
      const settingsRes = await settingsApi.list()
      const settingsArray = settingsRes.data.data || []
      const map = new Map()
      settingsArray.forEach((s: any) => map.set(s.key, s))
      setSettingsMap(map)
      
      alert('Đã xóa banner trang chủ thành công!')
    } catch (error: any) {
      console.error('Failed to delete home banner:', error)
      console.error('Error details:', error.response?.data)
      alert(`Lỗi khi xóa banner trang chủ: ${error.response?.data?.error || error.message}`)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Prepare updates
      const updates = [
        { key: 'center_name_vi', value: centerNameVi },
        { key: 'center_name_en', value: centerNameEn },
        { key: 'school_name_vi', value: schoolNameVi },
        { key: 'school_name_en', value: schoolNameEn },
        { key: 'contact_address', value: address },
        { key: 'contact_phone', value: phone },
        { key: 'contact_fax', value: fax },
        { key: 'contact_email', value: email },
        { key: 'social_facebook', value: facebookUrl },
        { key: 'social_youtube', value: youtubeUrl },
        { key: 'social_zalo', value: zaloPhone },
      ]

      // Update each setting
      await Promise.all(
        updates.map(async ({ key, value }) => {
          const setting = settingsMap.get(key)
          if (setting) {
            await settingsApi.update(setting._id, { value })
          }
        })
      )

      alert('Đã lưu cài đặt thành công!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Lỗi khi lưu cài đặt. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'general' as TabType, label: 'Thông tin chung', icon: '📋' },
    { id: 'content' as TabType, label: 'Nội dung giới thiệu', icon: '📝' },
    { id: 'contact' as TabType, label: 'Liên hệ & MXH', icon: '📞' },
    { id: 'logo' as TabType, label: 'Logo & Banner', icon: '🖼️' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cài đặt hệ thống</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Quản lý thông tin Trung tâm GDQP-AN hiển thị trên website công khai</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/gioi-thieu"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Xem trang công khai
          </a>
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-slate-700">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Thông tin Trung tâm GDQP-AN */}
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-6 border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Thông tin Trung tâm</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Hiển thị dưới logo giữa header</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      <span className="text-red-500">*</span> Tên Tiếng Việt
                    </label>
                    <input
                      type="text"
                      value={centerNameVi}
                      onChange={(e) => setCenterNameVi(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Tên Tiếng Anh
                    </label>
                    <input
                      type="text"
                      value={centerNameEn}
                      onChange={(e) => setCenterNameEn(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Thông tin Trường */}
              <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-6 border border-green-100 dark:border-green-900/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Thông tin Trường</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Hiển thị nhỏ trên cùng header</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      <span className="text-red-500">*</span> Tên Tiếng Việt
                    </label>
                    <input
                      type="text"
                      value={schoolNameVi}
                      onChange={(e) => setSchoolNameVi(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Tên Tiếng Anh
                    </label>
                    <input
                      type="text"
                      value={schoolNameEn}
                      onChange={(e) => setSchoolNameEn(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-6 border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nội dung trang Giới thiệu</h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Quản lý các phần nội dung hiển thị trên trang công khai</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openSectionModal()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm thông tin giới thiệu
                  </button>
                </div>

                {sectionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : sections.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-slate-400 mb-4">Chưa có phần nội dung nào</p>
                    <button
                      onClick={() => openSectionModal()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Thêm phần đầu tiên
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sections.map((section, index) => (
                      <div
                        key={section._id}
                        className="flex items-center gap-4 p-4 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {section.title}
                            </h4>
                            <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
                              section.type === 'paragraph' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              section.type === 'list' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            }`}>
                              {section.type === 'paragraph' ? 'Đoạn văn' : section.type === 'list' ? 'Danh sách' : 'Trích dẫn'}
                            </span>
                            {!section.isActive && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-slate-600 dark:text-slate-400 flex-shrink-0">
                                Đã ẩn
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-1">
                            {section.content}
                          </p>
                        </div>
                        {section.media && section.media.length > 0 && (
                          <div className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {section.media.length}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleSectionActive(section)}
                            className={`p-1.5 rounded transition-colors ${
                              section.isActive
                                ? 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'
                                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                            }`}
                            title={section.isActive ? 'Ẩn' : 'Hiện'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {section.isActive ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              )}
                            </svg>
                          </button>
                          <button
                            onClick={() => openSectionModal(section)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteSection(section._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Thông tin Liên hệ */}
              <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-6 border border-purple-100 dark:border-purple-900/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Thông tin Liên hệ</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Hiển thị ở footer và trang liên hệ</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      <span className="text-red-500">*</span> Địa chỉ
                    </label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      <span className="text-red-500">*</span> Số điện thoại
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      <span className="text-red-500">*</span> Số fax
                    </label>
                    <input
                      type="text"
                      value={fax}
                      onChange={(e) => setFax(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      <span className="text-red-500">*</span> Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Mạng xã hội */}
              <div className="bg-cyan-50 dark:bg-cyan-900/10 rounded-xl p-6 border border-cyan-100 dark:border-cyan-900/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mạng xã hội</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Liên kết mạng xã hội hiển thị trên website</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      <span className="text-blue-600">📘</span> Facebook URL
                    </label>
                    <input
                      type="url"
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                      placeholder="https://facebook.com/..."
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      <span className="text-red-600">📺</span> YouTube URL
                    </label>
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://youtube.com/@..."
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      <span className="text-blue-500">💬</span> Zalo (Số điện thoại)
                    </label>
                    <input
                      type="text"
                      value={zaloPhone}
                      onChange={(e) => setZaloPhone(e.target.value)}
                      placeholder="VĐ: 0901234567"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logo' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Ảnh Banner Header */}
              <div className="bg-pink-50 dark:bg-pink-900/10 rounded-xl p-6 border border-pink-100 dark:border-pink-900/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Banner Header</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Góc phải header • 400×200px</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {bannerImage ? (
                    <div className="relative">
                      <img 
                        src={bannerImage.startsWith('data:') ? bannerImage : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${bannerImage}`} 
                        alt="Banner" 
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-slate-600" 
                      />
                      <button
                        onClick={handleDeleteBanner}
                        className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center">
                      <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-gray-600 dark:text-slate-400 mb-2">Chưa có banner</p>
                      <label className={`inline-flex items-center gap-1 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs rounded-lg cursor-pointer transition-colors ${uploadingBanner ? 'opacity-50' : ''}`}>
                        {uploadingBanner ? 'Đang tải...' : 'Chọn ảnh'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          disabled={uploadingBanner}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleUploadBanner(file)
                          }} 
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Logo */}
              <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-6 border border-yellow-100 dark:border-yellow-900/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Logo</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Header & trang chủ • 100×100px</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {logoImage ? (
                    <div className="relative">
                      <div className="flex justify-center p-4 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                        <img 
                          src={logoImage.startsWith('data:') ? logoImage : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${logoImage}`} 
                          alt="Logo" 
                          className="w-24 h-24 object-contain" 
                        />
                      </div>
                      <button
                        onClick={handleDeleteLogo}
                        className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center">
                      <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      <p className="text-xs text-gray-600 dark:text-slate-400 mb-2">Chưa có logo</p>
                      <label className={`inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded-lg cursor-pointer transition-colors ${uploadingLogo ? 'opacity-50' : ''}`}>
                        {uploadingLogo ? 'Đang tải...' : 'Chọn logo'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          disabled={uploadingLogo}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleUploadLogo(file)
                          }} 
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Banner Trang Chủ */}
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-6 border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Banner Trang Chủ</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Toàn màn hình • 1920×600px</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {homeBannerImage ? (
                    <div className="relative">
                      <img 
                        src={homeBannerImage.startsWith('data:') ? homeBannerImage : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${homeBannerImage}`} 
                        alt="Home Banner" 
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-slate-600" 
                      />
                      <button
                        onClick={handleDeleteHomeBanner}
                        className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center">
                      <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-gray-600 dark:text-slate-400 mb-2">Chưa có banner</p>
                      <label className={`inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg cursor-pointer transition-colors ${uploadingHomeBanner ? 'opacity-50' : ''}`}>
                        {uploadingHomeBanner ? 'Đang tải...' : 'Chọn ảnh'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          disabled={uploadingHomeBanner}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleUploadHomeBanner(file)
                          }} 
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


        </div>

        {/* Save Button */}
        <div className="border-t border-gray-200 dark:border-slate-700 px-8 py-4 bg-gray-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang lưu...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>

      {/* Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingSectionId ? 'Chỉnh sửa phần' : 'Thêm thông tin giới thiệu'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="VD: Lịch sử hình thành"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Loại hiển thị <span className="text-red-500">*</span>
                </label>
                <select
                  value={sectionType}
                  onChange={(e) => setSectionType(e.target.value as any)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="paragraph">Đoạn văn</option>
                  <option value="list">Danh sách (mỗi dòng là một mục)</option>
                  <option value="quote">Trích dẫn (khung highlight)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={sectionContent}
                  onChange={(e) => setSectionContent(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder={sectionType === 'list' ? 'Mỗi dòng sẽ là một mục trong danh sách...' : 'Nhập nội dung...'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Hình ảnh / Video
                </label>
                
                {sectionExistingMedia.length > 0 && (
                  <div className="mb-3 grid grid-cols-3 gap-2">
                    {sectionExistingMedia.map((media, idx) => (
                      <div key={idx} className="relative group">
                        {media.type === 'image' ? (
                          <img src={media.url} alt={media.fileName} className="w-full h-24 object-cover rounded border" />
                        ) : (
                          <video src={media.url} className="w-full h-24 object-cover rounded border" />
                        )}
                        <button
                          type="button"
                          onClick={() => setSectionExistingMedia(sectionExistingMedia.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {sectionFiles.length > 0 && (
                  <div className="mb-3 grid grid-cols-3 gap-2">
                    {sectionFiles.map((file, idx) => (
                      <div key={idx} className="relative group">
                        {file.type.startsWith('image/') ? (
                          <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-24 object-cover rounded border" />
                        ) : (
                          <video src={URL.createObjectURL(file)} className="w-full h-24 object-cover rounded border" />
                        )}
                        <button
                          type="button"
                          onClick={() => setSectionFiles(sectionFiles.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    setSectionFiles([...sectionFiles, ...files])
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Hỗ trợ: JPG, PNG, GIF, MP4, WebM (tối đa 50MB/file)</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sectionIsActive"
                  checked={sectionIsActive}
                  onChange={(e) => setSectionIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="sectionIsActive" className="text-sm text-gray-700 dark:text-slate-300">
                  Hiển thị trên trang công khai
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowSectionModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveSection}
                disabled={!sectionTitle || !sectionContent}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
              >
                {editingSectionId ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
