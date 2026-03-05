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
  type: 'DSGD' | 'QD' | 'KeHoach'
  pages: number
  ocr_status: 'Pending' | 'Processing' | 'Completed' | 'Error'
  extract_status: 'Pending' | 'Processing' | 'Completed' | 'Error'
  file_path_s3: string
  uploaded_by: string
  uploaded_at: string
  updated_at: string
}

export interface Student {
  id: string
  code: string
  name: string
  class: string
  cohort: number
  dob?: string
  extracted_from_doc_id: string
}

export interface Score {
  id: string
  student_id: string
  subject_code: string
  subject_name: string
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  status: 'Dat' | 'Hong' | 'HocLai'
  extracted_from_doc_id: string
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
  ocr_completed_percent: number
  total_students: number
  total_scores: number
  documents_pending: number
  documents_error: number
  decisions_linked: number
  alerts: string[]
}
