-- Tạo các bảng cho hệ thống TVU GDQP-AN Admin Portal

-- Bảng Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Documents (Tài liệu Scan)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  folder VARCHAR(100),
  type VARCHAR(50), -- DSGD, QD, BieuMau
  file_path_s3 VARCHAR(500),
  pages INTEGER,
  status VARCHAR(50) DEFAULT 'Pending', -- Pending, Processing, Completed, Error
  extract_status VARCHAR(50) DEFAULT 'Pending',
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  error_message TEXT
);

-- Bảng Students (Sinh viên - trích xuất từ bảng điểm)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  class VARCHAR(50),
  cohort INTEGER,
  dob DATE,
  extracted_from_doc_id UUID REFERENCES documents(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Scores (Điểm số)
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  subject_code VARCHAR(50),
  subject_name VARCHAR(255),
  score DECIMAL(5, 2),
  grade VARCHAR(2), -- A, B, C, D, F
  status VARCHAR(20), -- Dat, Hong, HocLai
  extracted_from_doc_id UUID REFERENCES documents(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Decisions (Quyết định công nhận)
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number VARCHAR(50) UNIQUE NOT NULL,
  date DATE NOT NULL,
  cohort INTEGER,
  system VARCHAR(20), -- DH, CD, LT
  total_students INTEGER,
  file_path_s3 VARCHAR(500),
  reconciled_at TIMESTAMP,
  reconciled_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Audit Logs (Lịch sử hoạt động)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id VARCHAR(100),
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Settings đã được loại bỏ - cấu hình qua biến môi trường

-- Tạo indexes để cải thiện hiệu suất
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status, extract_status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_students_code ON students(code);
CREATE INDEX IF NOT EXISTS idx_students_cohort ON students(cohort);
CREATE INDEX IF NOT EXISTS idx_scores_student_id ON scores(student_id);
CREATE INDEX IF NOT EXISTS idx_decisions_number ON decisions(number);
CREATE INDEX IF NOT EXISTS idx_decisions_cohort ON decisions(cohort);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Tạo admin user mặc định
INSERT INTO users (email, password_hash, name, role)
VALUES (
  'admin@tvu.edu.vn',
  '$2a$10$Tp83TVHh1qB7fPZRqDNoReywn/psqMbw0dclY7OW.eMll/7qP4OXm', -- password (bcrypt hash)
  'Admin TVU',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- Tạo view cho thống kê
CREATE OR REPLACE VIEW v_document_stats AS
SELECT
  COUNT(*) as total_documents,
  SUM(pages) as total_pages,
  COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_documents,
  COUNT(CASE WHEN extract_status = 'Completed' THEN 1 END) as completed_extract,
  COUNT(CASE WHEN status = 'Error' THEN 1 END) as error_count
FROM documents;

CREATE OR REPLACE VIEW v_student_stats AS
SELECT
  COUNT(DISTINCT id) as total_students,
  COUNT(DISTINCT cohort) as total_cohorts,
  MIN(cohort) as min_cohort,
  MAX(cohort) as max_cohort
FROM students;

CREATE OR REPLACE VIEW v_score_stats AS
SELECT
  COUNT(*) as total_scores,
  COUNT(CASE WHEN status = 'Dat' THEN 1 END) as passed_count,
  COUNT(CASE WHEN status = 'Hong' THEN 1 END) as failed_count,
  COUNT(CASE WHEN status = 'HocLai' THEN 1 END) as retake_count,
  ROUND(AVG(score)::numeric, 2) as avg_score
FROM scores;

-- Tạo function để cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scores_updated_at BEFORE UPDATE ON scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decisions_updated_at BEFORE UPDATE ON decisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- settings table removed — trigger no longer needed

-- Roles should be created with secure passwords via environment variables\n-- Example: CREATE ROLE app_user WITH LOGIN PASSWORD :'APP_DB_PASSWORD';
