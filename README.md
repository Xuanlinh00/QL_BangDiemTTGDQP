# TVU GDQP-AN Admin Portal

**Hệ thống Quản trị Hồ sơ GDQP-AN TVU** - An admin-only system for managing 550+ PDF documents, running OCR, extracting student data, and generating reports.

## 🎯 Overview

This is a comprehensive admin portal designed specifically for the Trung tâm GDQP-AN (Trường Đại học Tây Đô) to:

- **Manage Documents**: Upload, organize, and track 550+ PDF scan files (~43,000 pages)
- **Process OCR**: Automatically extract text from PDFs using Tesseract
- **Extract Data**: Parse student information and scores from scanned documents
- **Validate Data**: Check, correct, and validate extracted data
- **Reconcile**: Compare extracted data with official decisions (Quyết định công nhận)
- **Generate Reports**: Create detailed statistics and reports for internal use
- **Audit**: Track all admin actions with comprehensive logging

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React 18)                         │
│  Dashboard | Documents | Data | Decisions | Reports | Settings  │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS / JWT
┌────────────────────────▼────────────────────────────────────────┐
│                  API Gateway / Load Balancer                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼────────┐ ┌────▼──────────┐ ┌──▼──────────────┐
│  Node.js API   │ │ Python Worker │ │  Python OCR    │
│  (Express)     │ │  (FastAPI)    │ │  Service       │
└────────┬───────┘ └────┬──────────┘ └──┬──────────────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼────────┐ ┌────▼──────────┐ ┌──▼──────────────┐
│  PostgreSQL    │ │  AWS S3 /     │ │  Redis Cache   │
│  (RDS)         │ │  Azure Blob   │ │  (Optional)    │
└────────────────┘ └───────────────┘ └────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- AWS account (for S3, RDS, ECS)

### Local Development (5 minutes)

```bash
# 1. Clone repository
git clone <repo-url>
cd tvu-gdqp-admin-portal

# 2. Setup database
createdb tvu_gdqp_admin
psql tvu_gdqp_admin < database/schema.sql

# 3. Frontend (Terminal 1)
cd frontend
npm install
cp .env.example .env.local
npm run dev

# 4. Backend Node.js (Terminal 2)
cd backend-node
npm install
cp .env.example .env
npm run dev

# 5. Backend Python (Terminal 3)
cd backend-python
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload
```

### Access
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Python Worker**: http://localhost:8000

## 📚 Documentation

### Specification Documents
- **[spec-requirements.md](.claude/agents/kfc/spec-requirements.md)** - Functional & non-functional requirements
- **[spec-design.md](.claude/agents/kfc/spec-design.md)** - Architecture & design
- **[spec-impl.md](.claude/agents/kfc/spec-impl.md)** - Implementation details & setup
- **[spec-tasks.md](.claude/agents/kfc/spec-tasks.md)** - Task breakdown & estimation
- **[SPEC_SUMMARY.md](.claude/agents/kfc/SPEC_SUMMARY.md)** - Specification summary

### Project Documentation
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Directory structure & organization
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick reference guide
- **[docs/API.md](docs/API.md)** - API documentation (Swagger)
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment guide
- **[docs/SETUP.md](docs/SETUP.md)** - Setup guide
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Architecture details
- **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Troubleshooting guide

## 🛠️ Technology Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- React Query
- Recharts
- Vite

### Backend
- **Node.js**: Express + TypeScript
- **Python**: FastAPI
- **Database**: PostgreSQL 14+
- **Storage**: AWS S3 / Azure Blob Storage
- **Authentication**: JWT + 2FA (Phase 2)

### Cloud
- **AWS**: S3, RDS, ECS Fargate, ALB, CloudFront, Route 53
- **Azure**: Blob Storage, Database for PostgreSQL, App Service, Static Web Apps

## 📋 Features (MVP)

| Feature | Status | Week |
|---------|--------|------|
| Authentication (login) | ✅ | 1-2 |
| Document upload & list | ✅ | 3 |
| OCR batch processing | ✅ | 4 |
| Data extraction (DSGD) | ✅ | 5 |
| Student & score management | ✅ | 5 |
| Decision management | ✅ | 6 |
| Reconciliation | ✅ | 6 |
| Dashboard & basic reports | ✅ | 7 |
| Settings & logging | ✅ | 8 |
| Deployment | ✅ | 8 |

## 🔄 Phase 2 Enhancements

- 2FA (OTP via email)
- Advanced reporting (custom filters, scheduled reports)
- Duplicate detection & merging
- EasyOCR integration
- Full-text search
- Batch operations (move, delete, re-OCR)
- Email notifications
- API documentation (Swagger)

## 📊 Key Metrics

- **Documents**: 550+ PDF files
- **Pages**: ~43,000 scanned pages
- **Students**: 50,000+ records
- **Scores**: 100,000+ records
- **Performance**: Dashboard < 2s, List < 3s
- **Scalability**: Supports 50,000+ students

## 🔐 Security

- HTTPS only (SSL/TLS)
- JWT authentication
- 2FA in Phase 2
- Audit logging (all changes tracked)
- Input validation (Joi, Pydantic)
- SQL injection prevention (ORM)
- XSS prevention (React escaping)
- Rate limiting on API
- IP whitelist option
- Secrets management (AWS Secrets Manager)

## 📈 Development Timeline

- **Sprint 1-2** (2 weeks): Project setup & authentication
- **Sprint 3** (1 week): Document management
- **Sprint 4** (1 week): OCR integration
- **Sprint 5** (1 week): Data extraction & management
- **Sprint 6** (1 week): Decision management & reconciliation
- **Sprint 7** (1 week): Dashboard & reports
- **Sprint 8** (1 week): Settings, logging & deployment

**Total MVP**: 8 weeks
**Phase 2**: 4 weeks

## 👥 Team Requirements

- **Frontend Developer**: 1 (React, TypeScript, Tailwind)
- **Backend Developer**: 1 (Node.js, Express, TypeScript)
- **Python Developer**: 1 (FastAPI, OCR, Data extraction)
- **DevOps Engineer**: 0.5 (AWS/Azure setup, deployment)
- **QA Engineer**: 0.5 (Testing, bug reporting)

**Total**: 3.5 FTE

## 🚢 Deployment

### AWS
```bash
# Frontend
npm run build
aws s3 sync dist/ s3://tvu-gdqp-admin-frontend/

# Backend
docker build -t tvu-gdqp-api:latest .
aws ecr get-login-password | docker login --username AWS --password-stdin XXXXX.dkr.ecr.ap-southeast-1.amazonaws.com
docker push XXXXX.dkr.ecr.ap-southeast-1.amazonaws.com/tvu-gdqp-api:latest
aws ecs update-service --cluster tvu-gdqp --service tvu-gdqp-api --force-new-deployment
```

### Azure
```bash
# Frontend
npm run build
az staticwebapp upload-files --name tvu-gdqp-admin --source-path dist/

# Backend
zip -r deploy.zip .
az webapp deployment source config-zip --resource-group tvu-gdqp --name tvu-gdqp-api --src deploy.zip
```

## 🧪 Testing

```bash
# Frontend
cd frontend && npm run test

# Backend (Node.js)
cd backend-node && npm run test

# Backend (Python)
cd backend-python && pytest
```

## 📝 Environment Variables

See `.env.example` files in each directory:
- `frontend/.env.example`
- `backend-node/.env.example`
- `backend-python/.env.example`

## 🐛 Troubleshooting

### Frontend won't start
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend connection error
```bash
psql tvu_gdqp_admin -c "SELECT 1"
cat .env
npm run dev
```

### OCR not working
```bash
tesseract --version
# Install: brew install tesseract (macOS) or apt-get install tesseract-ocr (Ubuntu)
```

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for more help.

## 📞 Support

For questions or issues:
1. Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
2. Review specification documents in `.claude/agents/kfc/`
3. Check project documentation in `docs/`
4. Contact project lead or architecture team

## 📄 License

[Your License Here]

## 👨‍💼 Project Lead

[Your Name/Contact]

## 🎉 Getting Started

1. **Read**: Start with [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
2. **Setup**: Follow [docs/SETUP.md](docs/SETUP.md)
3. **Develop**: Begin with Week 1-2 tasks (authentication)
4. **Deploy**: Follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

**Last Updated**: 2026-03-03  
**Version**: 1.0  
**Status**: Ready for Development


# QL_BangDiemTTGDQP
