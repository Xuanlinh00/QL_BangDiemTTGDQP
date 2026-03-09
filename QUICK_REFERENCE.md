# TVU GDQP-AN Admin Portal - Quick Reference Guide

## System Overview

**Name**: TVU GDQP-AN Admin Portal (Hệ thống Quản trị Hồ sơ GDQP-AN TVU)

**Purpose**: Admin-only system for managing 550+ PDF documents, running OCR, extracting student data, and generating reports

**Stack**: React 18 + Node.js (Express) + Python (FastAPI) + PostgreSQL + AWS/Azure

**Timeline**: 8 weeks MVP + 4 weeks Phase 2

---

## Key Features (MVP)

| Feature | Description | Week |
|---------|-------------|------|
| **Authentication** | Login with email/password, JWT tokens | 1-2 |
| **Document Management** | Upload, list, view PDF, OCR status tracking | 3-4 |
| **OCR Processing** | Batch OCR with Tesseract, text extraction | 4 |
| **Data Extraction** | Parse DSGD files, extract students & scores | 5 |
| **Data Management** | View, edit, bulk update, export students & scores | 5 |
| **Decision Management** | Manage QĐ (Quyết định công nhận) | 6 |
| **Reconciliation** | Compare students with decisions, identify mismatches | 6 |
| **Dashboard** | Real-time metrics, charts, alerts | 7 |
| **Reports** | Generate PDF/Excel reports | 7 |
| **Settings** | OCR config, storage management, audit logs | 8 |

---

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Data Fetching**: React Query (@tanstack/react-query)
- **Charts**: Recharts
- **PDF Viewer**: react-pdf
- **HTTP Client**: Axios
- **State Management**: Zustand
- **Build Tool**: Vite

### Backend (Node.js)
- **Framework**: Express.js with TypeScript
- **Database ORM**: TypeORM
- **Authentication**: JWT + bcryptjs
- **File Storage**: AWS S3 SDK
- **Logging**: Winston
- **Validation**: Joi
- **File Upload**: Multer

### Backend (Python)
- **Framework**: FastAPI
- **Database ORM**: SQLAlchemy
- **OCR**: Pytesseract (Tesseract)
- **Image Processing**: OpenCV, Pillow
- **Cloud Storage**: Boto3 (AWS S3)
- **Validation**: Pydantic

### Database
- **Primary**: PostgreSQL 14+
- **Cache** (optional): Redis
- **File Storage**: AWS S3 / Azure Blob Storage

### Cloud
- **AWS**: S3, RDS, ECS Fargate, ALB, CloudFront, Route 53
- **Azure**: Blob Storage, Database for PostgreSQL, App Service, Static Web Apps

---

## API Endpoints (Quick Reference)

### Authentication
```
POST   /api/auth/login              # Login
POST   /api/auth/logout             # Logout
GET    /api/auth/me                 # Get current user
```

### Documents
```
GET    /api/documents               # List documents
POST   /api/documents/upload        # Upload file
GET    /api/documents/:id           # Get document details
PUT    /api/documents/:id           # Update document
DELETE /api/documents/:id           # Delete document
POST   /api/documents/batch-ocr     # Batch OCR
GET    /api/documents/:id/ocr-text  # Get OCR text
```

### Students
```
GET    /api/students                # List students
POST   /api/students/bulk-edit      # Bulk edit
GET    /api/students/:id            # Get student
PUT    /api/students/:id            # Update student
DELETE /api/students/:id            # Delete student
GET    /api/students/export         # Export to Excel
```

### Scores
```
GET    /api/scores                  # List scores
POST   /api/scores/bulk-edit        # Bulk edit
GET    /api/scores/:id              # Get score
PUT    /api/scores/:id              # Update score
DELETE /api/scores/:id              # Delete score
GET    /api/scores/export           # Export to Excel
```

### Decisions
```
GET    /api/decisions               # List decisions
POST   /api/decisions               # Create decision
GET    /api/decisions/:id           # Get decision
POST   /api/decisions/:id/reconcile # Run reconciliation
GET    /api/decisions/:id/reconcile-report  # Get reconciliation report
```

### Reports
```
GET    /api/reports                 # List reports
POST   /api/reports/generate        # Generate report
GET    /api/reports/:id             # Get report
GET    /api/reports/:id/export      # Export report
```

### Settings
```
GET    /api/settings                # Get settings
PUT    /api/settings                # Update settings
GET    /api/audit-logs              # Get audit logs
```

---

## Database Schema (Quick Reference)

### Main Tables

**documents**
- id, name, folder, type, pages, ocr_status, extract_status, file_path_s3, ocr_text, uploaded_by, uploaded_at

**students**
- id, code, name, class, cohort, dob, extracted_from_doc_id

**scores**
- id, student_id, subject_code, subject_name, score, grade, status, extracted_from_doc_id

**decisions**
- id, number, date, cohort, system, total_students, file_path_s3, reconciled_at, reconciled_by

**decision_students**
- id, decision_id, student_code, student_name, status, matched_student_id

**ocr_tasks**
- id, document_id, status, progress, error_message, started_at, completed_at

**audit_logs**
- id, admin_id, action, entity_type, entity_id, old_value, new_value, timestamp, ip_address

---

## Local Development Setup (5 minutes)

### Prerequisites
```bash
# Check versions
node --version        # Should be 18+
python --version      # Should be 3.10+
psql --version        # Should be 14+
```

### Setup
```bash
# 1. Clone repository
git clone <repo-url>
cd tvu-gdqp-admin-portal

# 2. Setup database
createdb tvu_gdqp_admin
psql tvu_gdqp_admin < database/schema.sql

# 3. Frontend
cd frontend
npm install
cp .env.example .env.local
npm run dev

# 4. Backend (Node.js) - new terminal
cd backend-node
npm install
cp .env.example .env
npm run dev

# 5. Backend (Python) - new terminal
cd backend-python
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload
```

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- Python Worker: http://localhost:8000

---

## Environment Variables

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=TVU GDQP-AN Admin Portal
```

### Backend Node.js (.env)
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/tvu_gdqp_admin
JWT_SECRET=your-secret-key-here
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
S3_BUCKET_NAME=tvu-gdqp-admin-bucket
PYTHON_WORKER_URL=http://localhost:8000
```

### Backend Python (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/tvu_gdqp_admin
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
S3_BUCKET_NAME=tvu-gdqp-admin-bucket
TESSERACT_PATH=/usr/bin/tesseract
```

---

## Common Commands

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run linter
npm run format       # Format code
```

### Backend (Node.js)
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run test         # Run tests
npm run typeorm migration:run  # Run migrations
npm run lint         # Run linter
```

### Backend (Python)
```bash
python -m uvicorn app.main:app --reload  # Start dev server
pytest               # Run tests
black .              # Format code
flake8 .             # Lint code
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] S3 bucket created
- [ ] SSL certificate ready
- [ ] Backup strategy in place

### AWS Deployment
```bash
# Frontend
npm run build
aws s3 sync dist/ s3://tvu-gdqp-admin-frontend/
aws cloudfront create-invalidation --distribution-id XXXXX --paths "/*"

# Backend (Node.js)
docker build -t tvu-gdqp-api:latest .
aws ecr get-login-password | docker login --username AWS --password-stdin XXXXX.dkr.ecr.ap-southeast-1.amazonaws.com
docker tag tvu-gdqp-api:latest XXXXX.dkr.ecr.ap-southeast-1.amazonaws.com/tvu-gdqp-api:latest
docker push XXXXX.dkr.ecr.ap-southeast-1.amazonaws.com/tvu-gdqp-api:latest
aws ecs update-service --cluster tvu-gdqp --service tvu-gdqp-api --force-new-deployment
```

### Azure Deployment
```bash
# Frontend
npm run build
az staticwebapp upload-files --name tvu-gdqp-admin --source-path dist/

# Backend
zip -r deploy.zip .
az webapp deployment source config-zip --resource-group tvu-gdqp --name tvu-gdqp-api --src deploy.zip
```

---

## Troubleshooting

### Frontend won't start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend connection error
```bash
# Check database
psql tvu_gdqp_admin -c "SELECT 1"

# Check environment variables
cat .env

# Restart backend
npm run dev
```

### OCR not working
```bash
# Check Tesseract installation
tesseract --version

# On macOS
brew install tesseract

# On Ubuntu
sudo apt-get install tesseract-ocr

# On Windows
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
```

### S3 upload failing
```bash
# Check AWS credentials
aws s3 ls

# Check bucket exists
aws s3 ls s3://tvu-gdqp-admin-bucket/

# Check IAM permissions
# User should have s3:GetObject, s3:PutObject, s3:DeleteObject
```

---

## Performance Tips

- Use pagination for large datasets (limit 20-50 items per page)
- Index frequently queried columns in database
- Cache dashboard metrics (5-minute TTL)
- Lazy load PDF viewer
- Compress images before upload
- Use CDN for static assets
- Enable gzip compression on API responses

---

## Security Best Practices

- Never commit `.env` files
- Use HTTPS in production
- Rotate JWT secrets regularly
- Implement rate limiting (100 requests/minute per IP)
- Validate all user inputs
- Use parameterized queries (ORM handles this)
- Enable CORS only for trusted domains
- Log all admin actions
- Use 2FA in Phase 2

---

## Useful Links

- **React Docs**: https://react.dev
- **Express Docs**: https://expressjs.com
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **PostgreSQL Docs**: https://www.postgresql.org/docs
- **AWS Docs**: https://docs.aws.amazon.com
- **Azure Docs**: https://docs.microsoft.com/azure
- **Tesseract Docs**: https://github.com/UB-Mannheim/tesseract/wiki

---

## Contact & Support

For questions or issues:
1. Check TROUBLESHOOTING section above
2. Review specification documents in `.claude/agents/kfc/`
3. Check project documentation in `docs/`
4. Contact project lead or architecture team

---

## Version Info

- **Specification Version**: 1.0
- **Created**: 2026-03-03
- **Last Updated**: 2026-03-03
- **Status**: Ready for Development

