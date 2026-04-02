import { useState, useEffect } from 'react'
import { aboutSectionsApi } from '../services/api'

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

export default function AboutSections() {
  const [sections, setSections] = useState<AboutSection[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  // Form state - Load from localStorage only when modal opens
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formType, setFormType] = useState<'paragraph' | 'list' | 'quote'>('paragraph')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formFiles, setFormFiles] = useState<File[]>([])
  const [existingMedia, setExistingMedia] = useState<Array<{type: string; url: string; fileName: string}>>([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)

  // Template sections
  const templates = [
    {
      id: 'history',
      name: 'Lịch sử hình thành',
      icon: '📜',
      data: {
        title: 'Lịch sử hình thành',
        content: 'Trung tâm Giáo dục Quốc phòng và An ninh được thành lập theo Quyết định số [Số QĐ]/QĐ-ĐHTV ngày [Ngày/Tháng/Năm] của Hiệu trưởng Trường Đại học Trà Vinh. Trung tâm là đơn vị trực thuộc Trường Đại học Trà Vinh, có chức năng tổ chức giảng dạy môn Giáo dục Quốc phòng và An ninh cho sinh viên toàn trường.',
        type: 'paragraph' as const
      }
    },
    {
      id: 'mission',
      name: 'Chức năng nhiệm vụ',
      icon: '🎯',
      data: {
        title: 'Chức năng nhiệm vụ',
        content: 'Tổ chức giảng dạy môn Giáo dục Quốc phòng và An ninh cho sinh viên toàn trường\nPhối hợp với các đơn vị liên quan tổ chức các hoạt động giáo dục quốc phòng, an ninh\nTham mưu cho Ban Giám hiệu về công tác giáo dục quốc phòng và an ninh trong nhà trường\nTổ chức các hoạt động ngoại khóa, tuyên truyền về quốc phòng và an ninh\nQuản lý cơ sở vật chất, trang thiết bị phục vụ giảng dạy',
        type: 'list' as const
      }
    },
    {
      id: 'staff',
      name: 'Đội ngũ cán bộ',
      icon: '👥',
      data: {
        title: 'Đội ngũ cán bộ, giảng viên',
        content: 'Trung tâm có đội ngũ cán bộ, giảng viên giàu kinh nghiệm, được đào tạo chuyên sâu về quốc phòng và an ninh. Đội ngũ giảng viên luôn tận tâm, nhiệt huyết trong công tác giảng dạy và giáo dục sinh viên, góp phần nâng cao chất lượng đào tạo và giáo dục quốc phòng trong nhà trường.',
        type: 'paragraph' as const
      }
    },
    {
      id: 'facilities',
      name: 'Cơ sở vật chất',
      icon: '🏢',
      data: {
        title: 'Cơ sở vật chất',
        content: 'Trung tâm được trang bị đầy đủ cơ sở vật chất, trang thiết bị hiện đại phục vụ công tác giảng dạy và học tập. Bao gồm các phòng học lý thuyết, khu vực thực hành, sân tập, và các trang thiết bị giảng dạy chuyên dụng đáp ứng yêu cầu đào tạo.',
        type: 'paragraph' as const
      }
    },
    {
      id: 'achievements',
      name: 'Thành tích',
      icon: '🏆',
      data: {
        title: 'Thành tích đạt được',
        content: 'Qua nhiều năm hoạt động, Trung tâm đã đạt được nhiều thành tích xuất sắc trong công tác giảng dạy và giáo dục quốc phòng, an ninh. Được Bộ Giáo dục và Đào tạo, Bộ Quốc phòng tặng nhiều bằng khen, giấy khen về thành tích xuất sắc trong công tác.',
        type: 'paragraph' as const
      }
    },
    {
      id: 'quote',
      name: 'Trích dẫn',
      icon: '💬',
      data: {
        title: 'Phương châm hoạt động',
        content: 'Giáo dục quốc phòng và an ninh là nhiệm vụ quan trọng, góp phần nâng cao nhận thức, trách nhiệm của sinh viên đối với sự nghiệp bảo vệ Tổ quốc.',
        type: 'quote' as const
      }
    },
    {
      id: 'vision',
      name: 'Tầm nhìn - Sứ mệnh',
      icon: '🎓',
      data: {
        title: 'Tầm nhìn và Sứ mệnh',
        content: 'Tầm nhìn: Trở thành đơn vị đào tạo giáo dục quốc phòng và an ninh hàng đầu trong khu vực, đáp ứng yêu cầu đổi mới giáo dục đại học.\n\nSứ mệnh: Đào tạo và giáo dục ý thức quốc phòng, an ninh cho sinh viên, góp phần xây dựng thế hệ trẻ có bản lĩnh chính trị vững vàng, sẵn sàng bảo vệ Tổ quốc.',
        type: 'paragraph' as const
      }
    },
    {
      id: 'contact',
      name: 'Thông tin liên hệ',
      icon: '📞',
      data: {
        title: 'Thông tin liên hệ',
        content: 'Địa chỉ: Số 126, Nguyễn Thiện Thành, Khóm 4, Phường 5, TP. Trà Vinh\nĐiện thoại: (0294) 3855246\nEmail: gdqp@tvu.edu.vn\nWebsite: www.tvu.edu.vn',
        type: 'list' as const
      }
    }
  ]

  // Save to localStorage only when modal is open
  useEffect(() => {
    if (showModal) {
      const saveData = {
        title: formTitle,
        content: formContent,
        type: formType,
        isActive: formIsActive,
        editingId: editingId
      }
      localStorage.setItem('aboutForm_draft', JSON.stringify(saveData))
    }
  }, [formTitle, formContent, formType, formIsActive, showModal, editingId])

  useEffect(() => {
    loadSections()
  }, [])

  async function loadSections() {
    try {
      const res = await aboutSectionsApi.list()
      setSections(res.data.data || [])
    } catch (error) {
      console.error('Failed to load sections:', error)
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    // Try to restore draft from localStorage
    const draft = localStorage.getItem('aboutForm_draft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        if (!parsed.editingId) { // Only restore if it was a create draft
          setFormTitle(parsed.title || '')
          setFormContent(parsed.content || '')
          setFormType(parsed.type || 'paragraph')
          setFormIsActive(parsed.isActive !== false)
        } else {
          // Clear if it was an edit draft
          setFormTitle('')
          setFormContent('')
          setFormType('paragraph')
          setFormIsActive(true)
        }
      } catch (e) {
        console.error('Failed to parse draft:', e)
        setFormTitle('')
        setFormContent('')
        setFormType('paragraph')
        setFormIsActive(true)
      }
    } else {
      setFormTitle('')
      setFormContent('')
      setFormType('paragraph')
      setFormIsActive(true)
    }
    
    setEditingId(null)
    setFormFiles([])
    setExistingMedia([])
    setShowModal(true)
  }

  function openEditModal(section: AboutSection) {
    setEditingId(section._id)
    setFormTitle(section.title)
    setFormContent(section.content)
    setFormType(section.type)
    setFormIsActive(section.isActive)
    setFormFiles([])
    setExistingMedia(section.media || [])
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    // Don't clear form immediately - let user decide
  }

  function clearDraft() {
    localStorage.removeItem('aboutForm_draft')
    setFormTitle('')
    setFormContent('')
    setFormType('paragraph')
    setFormIsActive(true)
    setFormFiles([])
    setExistingMedia([])
  }

  function useTemplate(template: typeof templates[0]) {
    setFormTitle(template.data.title)
    setFormContent(template.data.content)
    setFormType(template.data.type)
    setFormIsActive(true)
    setEditingId(null)
    setFormFiles([])
    setExistingMedia([])
    setShowTemplateModal(false)
    setShowModal(true)
  }

  async function handleSave() {
    if (!formTitle.trim() || !formContent.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung')
      return
    }

    try {
      const formData = new FormData()
      formData.append('title', formTitle)
      formData.append('content', formContent)
      formData.append('type', formType)
      formData.append('isActive', String(formIsActive))
      
      if (!editingId) {
        formData.append('order', String(sections.length))
      }

      // Add new files
      formFiles.forEach(file => {
        formData.append('media', file)
      })

      // Keep existing media if editing
      if (editingId && existingMedia.length > 0) {
        formData.append('keepExistingMedia', 'true')
      }

      if (editingId) {
        await aboutSectionsApi.update(editingId, formData as any)
      } else {
        await aboutSectionsApi.create(formData as any)
      }

      // Clear draft and close modal
      clearDraft()
      setShowModal(false)
      loadSections()
    } catch (error) {
      console.error('Failed to save section:', error)
      alert('Lỗi khi lưu. Vui lòng thử lại.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bạn có chắc muốn xóa phần này?')) return
    
    try {
      await aboutSectionsApi.delete(id)
      loadSections()
    } catch (error) {
      console.error('Failed to delete section:', error)
      alert('Lỗi khi xóa. Vui lòng thử lại.')
    }
  }

  async function handleToggleActive(section: AboutSection) {
    try {
      await aboutSectionsApi.update(section._id, { isActive: !section.isActive })
      loadSections()
    } catch (error) {
      console.error('Failed to toggle active:', error)
    }
  }

  async function moveSection(index: number, direction: 'up' | 'down') {
    const newSections = [...sections]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newSections.length) return
    
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]]
    
    const reorderData = newSections.map((s, i) => ({ id: s._id, order: i }))
    
    try {
      await aboutSectionsApi.reorder(reorderData)
      loadSections()
    } catch (error) {
      console.error('Failed to reorder:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nội dung trang Giới thiệu</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Quản lý các phần nội dung hiển thị trên trang Giới thiệu</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm phần mới
        </button>
        <button
          onClick={() => setShowTemplateModal(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          Chọn mẫu
        </button>
      </div>

      {/* Sections Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        {sections.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 dark:text-slate-400 mb-4">Chưa có phần nội dung nào</p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Thêm phần đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider w-16">
                    STT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Tiêu đề
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider w-32">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider w-24">
                    Media
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider w-32">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider w-48">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {sections.map((section, index) => (
                  <tr key={section._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveSection(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Di chuyển lên"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <span className="text-sm font-medium text-gray-900 dark:text-white text-center">{index + 1}</span>
                        <button
                          onClick={() => moveSection(index, 'down')}
                          disabled={index === sections.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Di chuyển xuống"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {section.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {section.content}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        section.type === 'paragraph' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        section.type === 'list' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>
                        {section.type === 'paragraph' ? 'Đoạn văn' : section.type === 'list' ? 'Danh sách' : 'Trích dẫn'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900 dark:text-white font-medium">
                        {section.media?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(section)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          section.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                        }`}
                      >
                        {section.isActive ? (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Hiển thị
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                            Đã ẩn
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(section)}
                          className="px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(section._id)}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chọn mẫu giới thiệu</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Chọn một mẫu có sẵn để bắt đầu nhanh</p>
                </div>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => useTemplate(template)}
                    className="text-left p-4 border-2 border-gray-200 dark:border-slate-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{template.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 mb-1">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-2">
                          {template.data.content}
                        </p>
                        <div className="mt-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            template.data.type === 'paragraph' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            template.data.type === 'list' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          }`}>
                            {template.data.type === 'paragraph' ? 'Đoạn văn' : template.data.type === 'list' ? 'Danh sách' : 'Trích dẫn'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  💡 <strong>Mẹo:</strong> Sau khi chọn mẫu, bạn có thể chỉnh sửa nội dung theo ý muốn trước khi lưu.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId ? 'Chỉnh sửa phần' : 'Thêm phần mới'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {!editingId && formTitle && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    💾 Đã khôi phục nháp đang soạn. Bạn có thể tiếp tục chỉnh sửa hoặc xóa nháp.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="VD: Lịch sử hình thành"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Loại hiển thị <span className="text-red-500">*</span>
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
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
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder={formType === 'list' ? 'Mỗi dòng sẽ là một mục trong danh sách...' : 'Nhập nội dung...'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Hình ảnh / Video
                </label>
                
                {/* Existing Media */}
                {existingMedia.length > 0 && (
                  <div className="mb-3 grid grid-cols-3 gap-2">
                    {existingMedia.map((media, idx) => (
                      <div key={idx} className="relative group">
                        {media.type === 'image' ? (
                          <img src={media.url} alt={media.fileName} className="w-full h-24 object-cover rounded border" />
                        ) : (
                          <video src={media.url} className="w-full h-24 object-cover rounded border" />
                        )}
                        <button
                          type="button"
                          onClick={() => setExistingMedia(existingMedia.filter((_, i) => i !== idx))}
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

                {/* New Files Preview */}
                {formFiles.length > 0 && (
                  <div className="mb-3 grid grid-cols-3 gap-2">
                    {formFiles.map((file, idx) => (
                      <div key={idx} className="relative group">
                        {file.type.startsWith('image/') ? (
                          <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-24 object-cover rounded border" />
                        ) : (
                          <video src={URL.createObjectURL(file)} className="w-full h-24 object-cover rounded border" />
                        )}
                        <button
                          type="button"
                          onClick={() => setFormFiles(formFiles.filter((_, i) => i !== idx))}
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
                    setFormFiles([...formFiles, ...files])
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Hỗ trợ: JPG, PNG, GIF, MP4, WebM (tối đa 50MB/file)</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-slate-300">
                  Hiển thị trên trang công khai
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center gap-3">
              <div>
                {!editingId && formTitle && (
                  <button
                    onClick={clearDraft}
                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    Xóa nháp
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formTitle || !formContent}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  {editingId ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
