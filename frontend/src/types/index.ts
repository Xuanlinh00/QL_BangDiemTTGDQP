export interface User {
  id: string
  email: string
  name: string
}

export interface AuthResponse {
  success: boolean
  data?: {
    token: string
    user: User
  }
  error?: {
    code: string
    message: string
  }
}

export interface Document {
  id: string
  name: string
  folder: string
  type: 'DSGD' | 'QD' | 'BieuMau'
  pages: number
  status: 'Pending' | 'Processing' | 'Completed' | 'Error'
  extract_status: 'Pending' | 'Processing' | 'Completed' | 'Error'
  file_path_s3: string
  uploaded_by: string
  uploaded_at: string
  updated_at: string
}

export interface Decision {
  id: string
  number: string
  date: string
  cohort: number
  system: 'DH' | 'CD' | 'LT'
  total_students: number
  file_path_s3: string
  reconciled_at?: string
  reconciled_by?: string
}

export interface DashboardMetrics {
  total_documents: number
  total_pages: number
  documents_completed_percent: number
  documents_pending: number
  documents_error: number
  decisions_count: number
  alerts: string[]
}
