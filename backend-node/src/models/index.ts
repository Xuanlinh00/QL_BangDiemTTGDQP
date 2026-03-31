import mongoose, { Schema, Document as MongoDocument } from 'mongoose'

// ── Decision File ──
export interface IDecisionFile extends MongoDocument {
  fileName: string
  number: string
  date: string
  cohort: number
  year: string
  system: string
  total_students: number
  matched: number
  reconciled: boolean
  pages: number
  fileSize: number
  uploadedAt: string
  source: string
  mimeType?: string
  fileData?: Buffer
  gridfsFileId?: mongoose.Types.ObjectId
}

const DecisionFileSchema = new Schema<IDecisionFile>({
  fileName: { type: String, required: true },
  number: { type: String, default: '' },
  date: { type: String, default: '' },
  cohort: { type: Number, default: 0 },
  year: { type: String, required: true, index: true },
  system: { type: String, default: '' },
  total_students: { type: Number, default: 0 },
  matched: { type: Number, default: 0 },
  reconciled: { type: Boolean, default: false },
  pages: { type: Number, default: 0 },
  fileSize: { type: Number, default: 0 },
  uploadedAt: { type: String, default: '' },
  source: { type: String, default: 'local' },
  mimeType: { type: String },
  fileData: { type: Buffer },
  gridfsFileId: { type: Schema.Types.ObjectId },
}, { timestamps: true })

export const DecisionFile = mongoose.model<IDecisionFile>('DecisionFile', DecisionFileSchema)

// ── Decision Folder ──
export interface IDecisionFolder extends MongoDocument {
  name: string
  type: string
}

const DecisionFolderSchema = new Schema<IDecisionFolder>({
  name: { type: String, required: true, unique: true },
  type: { type: String, default: 'year' },
}, { timestamps: true })

export const DecisionFolder = mongoose.model<IDecisionFolder>('DecisionFolder', DecisionFolderSchema)

// ── Student ──
export interface IStudent extends MongoDocument {
  code: string
  name: string
  className: string
  cohort: number
  dob: string
  system: string
}

const StudentSchema = new Schema<IStudent>({
  code: { type: String, required: true, index: true },
  name: { type: String, required: true },
  className: { type: String, default: '' },
  cohort: { type: Number, default: 0 },
  dob: { type: String, default: '' },
  system: { type: String, default: '' },
}, { timestamps: true })

export const Student = mongoose.model<IStudent>('Student', StudentSchema)

// ── Score ──
export interface IScore extends MongoDocument {
  studentId: string
  studentCode: string
  studentName: string
  subject: string
  score: number
  semester: string
  year: string
}

const ScoreSchema = new Schema<IScore>({
  studentId: { type: String, required: true, index: true },
  studentCode: { type: String, default: '' },
  studentName: { type: String, default: '' },
  subject: { type: String, default: '' },
  score: { type: Number, default: 0 },
  semester: { type: String, default: '' },
  year: { type: String, default: '' },
}, { timestamps: true })

export const Score = mongoose.model<IScore>('Score', ScoreSchema)

// ── Report ──
export interface IReport extends MongoDocument {
  title: string
  type: string
  period: string
  year: string
  status: string
  createdAt: string
  note: string
}

const ReportSchema = new Schema<IReport>({
  title: { type: String, required: true },
  type: { type: String, default: '' },
  period: { type: String, default: '' },
  year: { type: String, default: '' },
  status: { type: String, default: 'Đang xử lý' },
  note: { type: String, default: '' },
}, { timestamps: true })

export const Report = mongoose.model<IReport>('Report', ReportSchema)

// ── System Setting ──
export interface ISetting extends MongoDocument {
  key: string
  label: string
  value: string
  category: string
}

const SettingSchema = new Schema<ISetting>({
  key: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  value: { type: String, default: '' },
  category: { type: String, default: 'Chung' },
}, { timestamps: true })

export const Setting = mongoose.model<ISetting>('Setting', SettingSchema)

// ── Document (uploaded files in Documents page) ──
export interface IDocument extends MongoDocument {
  name: string
  folder: string
  type: string
  pages: number
  status: string
  extract_status: string
  uploaded_at: string
  driveFileId?: string
  webViewLink?: string
  mimeType?: string
  source: string
  academicYear?: string
  cohort?: string
  className?: string
  trainingProgram?: string
  fileData?: Buffer
  gridfsFileId?: mongoose.Types.ObjectId
}

const DocumentSchema = new Schema<IDocument>({
  name: { type: String, required: true },
  folder: { type: String, default: '' },
  type: { type: String, default: '' },
  pages: { type: Number, default: 0 },
  status: { type: String, default: 'Pending' },
  extract_status: { type: String, default: 'Pending' },
  uploaded_at: { type: String, default: '' },
  driveFileId: { type: String },
  webViewLink: { type: String },
  mimeType: { type: String },
  source: { type: String, default: 'local' },
  academicYear: { type: String },
  cohort: { type: String },
  className: { type: String },
  trainingProgram: { type: String },
  fileData: { type: Buffer },
  gridfsFileId: { type: Schema.Types.ObjectId },
}, { timestamps: true })

export const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema)

// ── Student Record (extracted from Documents page) ──
export interface IStudentRecord extends MongoDocument {
  docId: string
  docName: string
  stt: string
  ho_ten: string
  mssv: string
  lop: string
  diem_qp: string
  diem_lan2: string
  ket_qua: string
  ghi_chu: string
}

const StudentRecordSchema = new Schema<IStudentRecord>({
  docId: { type: String, required: true, index: true },
  docName: { type: String, default: '' },
  stt: { type: String, default: '' },
  ho_ten: { type: String, default: '' },
  mssv: { type: String, default: '' },
  lop: { type: String, default: '' },
  diem_qp: { type: String, default: '' },
  diem_lan2: { type: String, default: '' },
  ket_qua: { type: String, default: '' },
  ghi_chu: { type: String, default: '' },
}, { timestamps: true })

export const StudentRecord = mongoose.model<IStudentRecord>('StudentRecord', StudentRecordSchema)

// ── Center Activity (for About page - blog post style) ──
export interface IMediaItem {
  fileName: string
  mimeType: string
  data?: Buffer
}

export interface ICenterActivity extends MongoDocument {
  title: string
  description: string
  content: string
  icon: string
  category: string
  order: number
  isActive: boolean
  media: IMediaItem[]
}

const MediaItemSchema = new Schema({
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  data: { type: Buffer },
}, { _id: true })

const CenterActivitySchema = new Schema<ICenterActivity>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  content: { type: String, default: '' },
  icon: { type: String, default: '📋' },
  category: { type: String, default: 'general' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  media: { type: [MediaItemSchema], default: [] },
}, { timestamps: true })

export const CenterActivity = mongoose.model<ICenterActivity>('CenterActivity', CenterActivitySchema)
