import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 12000,
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Set Content-Type to JSON if not already set (for non-FormData requests)
  if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json'
  }
  return config
})

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status

    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }

    // Avoid noisy console errors for expected backend downtime/timeouts.
    if (status === 503 || status === 504 || error.code === 'ECONNABORTED') {
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

// ═══════════════════════════════════════════
// Decisions API
// ═══════════════════════════════════════════
export const decisionsApi = {
  list: (year?: string) => api.get('/decisions', { params: year ? { year } : {} }),
  upload: (files: File[], year: string) => {
    const form = new FormData()
    form.append('year', year)
    files.forEach(f => form.append('files', f))
    return api.post('/decisions/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  getFileUrl: (id: string) => `${API_URL}/decisions/${id}/file`,
  update: (id: string, data: Record<string, unknown>) => api.put(`/decisions/${id}`, data),
  delete: (id: string) => api.delete(`/decisions/${id}`),
  listFolders: () => api.get('/decisions/folders'),
  createFolder: (name: string) => api.post('/decisions/folders', { name, type: 'year' }),
  deleteFolder: (id: string) => api.delete(`/decisions/folders/${id}`),
  renameFolder: (id: string, name: string) => api.put(`/decisions/folders/${id}`, { name }),
}

// ═══════════════════════════════════════════
// Data API (Students + Scores)
// ═══════════════════════════════════════════
export const studentsApi = {
  list: () => api.get('/data/students'),
  create: (data: Record<string, unknown>) => api.post('/data/students', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/data/students/${id}`, data),
  delete: (id: string) => api.delete(`/data/students/${id}`),
}

export const scoresApi = {
  list: () => api.get('/data/scores'),
  create: (data: Record<string, unknown>) => api.post('/data/scores', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/data/scores/${id}`, data),
  delete: (id: string) => api.delete(`/data/scores/${id}`),
}

// ═══════════════════════════════════════════
// Reports API
// ═══════════════════════════════════════════
export const reportsApi = {
  list: () => api.get('/reports'),
  create: (data: Record<string, unknown>) => api.post('/reports', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/reports/${id}`, data),
  delete: (id: string) => api.delete(`/reports/${id}`),
}

// ═══════════════════════════════════════════
// Settings API
// ═══════════════════════════════════════════
export const settingsApi = {
  list: () => api.get('/settings'),
  create: (data: Record<string, unknown>) => api.post('/settings', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/settings/${id}`, data),
  delete: (id: string) => api.delete(`/settings/${id}`),
  reset: () => api.post('/settings/reset'),
}

// ═══════════════════════════════════════
// Document Store API (Documents page)
// ═══════════════════════════════════════
export const docstoreApi = {
  list: () => api.get('/docstore'),
  upload: (files: File[], meta: Record<string, string>) => {
    const form = new FormData()
    Object.entries(meta).forEach(([k, v]) => form.append(k, v))
    files.forEach(f => form.append('files', f))
    return api.post('/docstore/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  saveGDrive: (data: Record<string, unknown>) => api.post('/docstore/gdrive', data),
  getFileUrl: (id: string) => `${API_URL}/docstore/${id}/file`,
  update: (id: string, data: Record<string, unknown>) => api.put(`/docstore/${id}`, data),
  delete: (id: string) => api.delete(`/docstore/${id}`),
  // Student records
  listStudentRecords: (docId?: string) => api.get('/docstore/student-records', { params: docId ? { docId } : {} }),
  bulkSaveStudentRecords: (docId: string, docName: string, records: Record<string, unknown>[]) =>
    api.post('/docstore/student-records/bulk', { docId, docName, records }),
  deleteStudentRecords: (docId: string) => api.delete(`/docstore/student-records/${docId}`),
}

// ═══════════════════════════════════════════
// Activities API (Center activities - About page)
// ═══════════════════════════════════════════
export const activitiesApi = {
  list: () => api.get('/activities'),
  create: (data: Record<string, unknown>, files?: File[]) => {
    const form = new FormData()
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) form.append(k, String(v))
    })
    if (files) files.forEach(f => form.append('files', f))
    return api.post('/activities', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  update: (id: string, data: Record<string, unknown>, files?: File[], removeMedia?: number[]) => {
    const form = new FormData()
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) form.append(k, String(v))
    })
    if (files && files.length > 0) files.forEach(f => form.append('files', f))
    if (removeMedia && removeMedia.length > 0) form.append('removeMedia', removeMedia.join(','))
    return api.put(`/activities/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  delete: (id: string) => api.delete(`/activities/${id}`),
  seed: () => api.post('/activities/seed'),
  getMediaUrl: (activityId: string, mediaIndex: number) => {
    // Add timestamp for cache busting - generate fresh each time
    const timestamp = new Date().getTime()
    return `${API_URL}/activities/${activityId}/media/${mediaIndex}?t=${timestamp}`
  },
}

export default api
