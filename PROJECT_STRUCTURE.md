# TVU GDQP-AN Admin Portal - Project Structure

## Repository Layout

```
tvu-gdqp-admin-portal/
│
├── frontend/                          # React 18 + TypeScript
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── MainLayout.tsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── MetricsCard.tsx
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   └── Charts.tsx
│   │   │   ├── Documents/
│   │   │   │   ├── DocumentList.tsx
│   │   │   │   ├── DocumentUpload.tsx
│   │   │   │   ├── DocumentViewer.tsx
│   │   │   │   └── DocumentValidate.tsx
│   │   │   ├── Data/
│   │   │   │   ├── StudentList.tsx
│   │   │   │   ├── ScoreList.tsx
│   │   │   │   └── BulkEdit.tsx
│   │   │   ├── Decisions/
│   │   │   │   ├── DecisionList.tsx
│   │   │   │   └── ReconciliationView.tsx
│   │   │   ├── Reports/
│   │   │   │   ├── ReportBuilder.tsx
│   │   │   │   └── ReportViewer.tsx
│   │   │   └── Common/
│   │   │       ├── Table.tsx
│   │   │       ├── Modal.tsx
│   │   │       ├── Button.tsx
│   │   │       └── Notification.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Documents.tsx
│   │   │   ├── Data.tsx
│   │   │   ├── Decisions.tsx
│   │   │   ├── Reports.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── Login.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useDocuments.ts
│   │   │   ├── useStudents.ts
│   │   │   ├── useScores.ts
│   │   │   └── useApi.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   └── storage.ts
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── api.ts
│   │   │   └── domain.ts
│   │   ├── utils/
│   │   │   ├── format.ts
│   │   │   ├── validation.ts
│   │   │   └── constants.ts
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend-node/                      # Express + TypeScript
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── documents.controller.ts
│   │   │   ├── students.controller.ts
│   │   │   ├── scores.controller.ts
│   │   │   ├── decisions.controller.ts
│   │   │   ├── reports.controller.ts
│   │   │   └── settings.controller.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── document.service.ts
│   │   │   ├── student.service.ts
│   │   │   ├── score.service.ts
│   │   │   ├── decision.service.ts
│   │   │   ├── s3.service.ts
│   │   │   └── report.service.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── documents.routes.ts
│   │   │   ├── data.routes.ts
│   │   │   ├── decisions.routes.ts
│   │   │   ├── reports.routes.ts
│   │   │   └── settings.routes.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── logger.ts
│   │   ├── models/
│   │   │   ├── Document.ts
│   │   │   ├── Student.ts
│   │   │   ├── Score.ts
│   │   │   ├── Decision.ts
│   │   │   ├── OCRTask.ts
│   │   │   └── AuditLog.ts
│   │   ├── utils/
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   └── constants.ts
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── s3.ts
│   │   │   └── env.ts
│   │   └── app.ts
│   ├── migrations/
│   │   ├── 001_create_documents.ts
│   │   ├── 002_create_students.ts
│   │   ├── 003_create_scores.ts
│   │   ├── 004_create_decisions.ts
│   │   ├── 005_create_ocr_tasks.ts
│   │   └── 006_create_audit_logs.ts
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── backend-python/                    # FastAPI + Python
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── models/
│   │   │   ├── document.py
│   │   │   ├── student.py
│   │   │   └── score.py
│   │   ├── services/
│   │   │   ├── ocr_service.py
│   │   │   ├── extract_service.py
│   │   │   ├── validate_service.py
│   │   │   └── reconcile_service.py
│   │   ├── parsers/
│   │   │   ├── dsgd_parser.py
│   │   │   ├── decision_parser.py
│   │   │   └── base_parser.py
│   │   ├── utils/
│   │   │   ├── ocr_utils.py
│   │   │   ├── text_utils.py
│   │   │   └── db_utils.py
│   │   └── routes/
│   │       ├── ocr.py
│   │       ├── extract.py
│   │       └── reconcile.py
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── .env.example
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── database/                          # Database scripts
│   ├── schema.sql
│   ├── seed.sql
│   └── migrations/
│
├── scripts/                           # Utility scripts
│   ├── setup-local.sh
│   ├── setup-aws.sh
│   ├── setup-azure.sh
│   └── deploy.sh
│
├── docs/                              # Documentation
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── SETUP.md
│   ├── ARCHITECTURE.md
│   └── TROUBLESHOOTING.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
│
├── .claude/
│   └── agents/
│       └── kfc/
│           ├── spec-requirements.md
│           ├── spec-design.md
│           ├── spec-impl.md
│           ├── spec-tasks.md
│           └── SPEC_SUMMARY.md
│
├── docker-compose.yml                 # Local development
├── .gitignore
├── .env.example
├── README.md
└── CONTRIBUTING.md
```

---

## Key Directories Explained

### `/frontend`
React application with TypeScript. Contains all UI components, pages, hooks, and services.

### `/backend-node`
Express.js API server. Handles authentication, CRUD operations, file uploads, and orchestration.

### `/backend-python`
FastAPI worker service. Handles OCR processing, data extraction, and validation.

### `/database`
Database schema and migration scripts for PostgreSQL.

### `/scripts`
Deployment and setup automation scripts for different environments.

### `/docs`
Comprehensive documentation for developers and operators.

### `/.claude/agents/kfc`
Specification documents for the project (requirements, design, implementation, tasks).

---

## Development Workflow

### Local Development
```bash
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Backend (Node.js)
cd backend-node && npm run dev

# Terminal 3: Backend (Python)
cd backend-python && python -m uvicorn app.main:app --reload

# Terminal 4: Database (if using Docker)
docker-compose up postgres redis
```

### Testing
```bash
# Frontend tests
cd frontend && npm run test

# Backend (Node.js) tests
cd backend-node && npm run test

# Backend (Python) tests
cd backend-python && pytest
```

### Building for Production
```bash
# Frontend
cd frontend && npm run build

# Backend (Node.js)
cd backend-node && npm run build

# Backend (Python)
# Already containerized in Dockerfile
```

---

## Environment Configuration

Each service has a `.env.example` file that should be copied to `.env` and configured:

- **Frontend**: API URL, app name
- **Backend (Node.js)**: Database URL, JWT secret, AWS credentials, Python worker URL
- **Backend (Python)**: Database URL, AWS credentials, Tesseract path

---

## Deployment Targets

### AWS
- Frontend: S3 + CloudFront
- Backend (Node.js): ECS Fargate + ALB
- Backend (Python): ECS Fargate
- Database: RDS Aurora PostgreSQL
- Storage: S3

### Azure
- Frontend: Azure Static Web Apps
- Backend (Node.js): App Service
- Backend (Python): App Service
- Database: Azure Database for PostgreSQL
- Storage: Azure Blob Storage

---

## CI/CD Pipeline

GitHub Actions workflows for:
- **CI**: Run tests on every push
- **Staging**: Deploy to staging on PR merge
- **Production**: Deploy to production on release tag

---

## File Size Estimates

| Component | Size | Notes |
|-----------|------|-------|
| Frontend | ~500 KB | Minified + gzipped |
| Backend (Node.js) | ~200 KB | Minified |
| Backend (Python) | ~300 KB | Minified |
| Database | ~1-5 GB | Depends on data volume |
| S3 Storage | ~50-100 GB | 550 PDF files + OCR text |

---

## Next Steps

1. Clone the repository
2. Copy `.env.example` files to `.env` and configure
3. Run `scripts/setup-local.sh` to initialize local environment
4. Start development servers (see Development Workflow)
5. Begin with Week 1-2 tasks (authentication)

