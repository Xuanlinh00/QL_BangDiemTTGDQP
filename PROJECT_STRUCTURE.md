# Cấu trúc Project - TVU GDQP-AN Admin Portal

## 📁 Cấu trúc tổng quan

```
QL_BangDiemTTGDQP/
├── 📂 backend-node/          # Backend Node.js + TypeScript + Express
├── 📂 backend-python/         # Backend Python + FastAPI (OCR, PDF processing)
├── 📂 frontend/               # Frontend React + TypeScript + Vite
├── 📂 scripts/                # Build và deployment scripts
├── 📄 docker-compose.yml      # Docker local development
├── 📄 docker-compose.prod.yml # Docker production
├── 📄 render.yaml             # Render deployment config
└── 📄 *.md                    # Documentation files
```

## 📂 Backend Node.js (`backend-node/`)

```
backend-node/
├── src/
│   ├── app.ts                 # Main Express app
│   ├── config/
│   │   ├── database.ts        # PostgreSQL config (không dùng)
│   │   ├── mongodb.ts         # MongoDB connection
│   │   └── logger.ts          # Winston logger
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── rate-limiter.middleware.ts
│   │   └── validation.middleware.ts
│   ├── models/
│   │   └── index.ts           # MongoDB models
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── activities.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── decisions.routes.ts
│   │   ├── documents.routes.ts
│   │   ├── docstore.routes.ts
│   │   ├── data.routes.ts
│   │   ├── reports.routes.ts
│   │   └── settings.routes.ts
│   └── database/
│       └── init.sql           # PostgreSQL init (không dùng)
├── dist/                      # Compiled JavaScript
├── uploads/                   # File uploads storage
├── node_modules/
├── package.json
├── tsconfig.json
├── Dockerfile
├── .env                       # Environment variables (local)
├── .env.example
└── render-start.sh            # Render start script

Dependencies:
- express, cors, dotenv
- mongoose (MongoDB)
- typeorm, pg (PostgreSQL - không dùng)
- redis (không dùng)
- bcryptjs, jsonwebtoken
- winston (logging)
- multer (file upload)
```

## 📂 Backend Python (`backend-python/`)

```
backend-python/
├── app/
│   ├── main.py                # FastAPI main app
│   ├── config.py              # Settings & env vars
│   ├── database/
│   │   └── mongodb.py         # MongoDB async client
│   ├── routes/
│   │   ├── ocr.py             # OCR endpoints
│   │   ├── tvu_extract.py     # TVU PDF extraction
│   │   └── health.py
│   ├── utils/
│   │   ├── ocr_processor.py
│   │   ├── ocr_tesseract.py
│   │   ├── tvu_pdf_extractor.py
│   │   ├── table_extractor.py
│   │   └── excel_exporter_pro.py
│   └── parsers/
│       └── dsgd_parser.py
├── requirements.txt
├── Dockerfile
├── .env
├── .env.example
├── google-credentials.json    # Google Cloud credentials
├── example_usage.py
├── example_ocr_usage.py
├── test_tvu_extractor.py
├── test_table_extraction.py
├── start_server.sh
├── start_server.bat
├── TEST_API.md
└── TVU_EXTRACTOR_README.md

Dependencies:
- fastapi, uvicorn
- motor (MongoDB async)
- pytesseract (OCR)
- pdf2image, Pillow
- pandas, openpyxl
- google-generativeai (Gemini)
```

## 📂 Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── App.tsx                # Main app component
│   ├── main.tsx               # Entry point
│   ├── components/
│   │   ├── Common/            # Reusable components
│   │   │   ├── Alert.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Select.tsx
│   │   │   └── Table.tsx
│   │   ├── Layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Layout.tsx
│   │   └── DocumentUpload/
│   │       ├── PDFViewer.tsx
│   │       ├── OCRReviewModal.tsx
│   │       ├── GoogleDriveModal.tsx
│   │       └── DocumentMetadataBadges.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Documents.tsx
│   │   ├── Certificates.tsx
│   │   ├── Activities.tsx
│   │   ├── TVUExtract.tsx
│   │   ├── About.tsx
│   │   ├── PublicAbout.tsx
│   │   └── PublicActivityDetail.tsx
│   ├── services/
│   │   └── api.ts             # Axios API client
│   ├── utils/
│   │   ├── pdfExtract.ts
│   │   └── excelExport.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── index.css          # Tailwind CSS
├── public/
│   ├── _redirects             # Render SPA routing
│   ├── pdf.worker.js
│   └── tesseract-worker.min.js
├── dist/                      # Build output
├── node_modules/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── Dockerfile
├── nginx.conf                 # Nginx config for Docker
├── .env
├── .env.example
├── index.html
├── COMPONENT_GUIDE.md
└── TVU_EXTRACT_GUIDE.md

Dependencies:
- react, react-dom, react-router-dom
- axios
- tailwindcss
- react-pdf, pdf-lib
- tesseract.js (OCR)
- lucide-react (icons)
- date-fns
```

## 📂 Scripts (`scripts/`)

```
scripts/
├── deploy.sh                  # Deployment script
└── fix-docker.bat             # Docker fix script
```

## 📄 Root Files

### Docker
- `docker-compose.yml` - Local development (MongoDB only)
- `docker-compose.prod.yml` - Production (3 databases)
- `.dockerignore`

### Render Deployment
- `render.yaml` - Render Blueprint config
- `render-build.sh` - Build script for Render

### Documentation
- `README.md` - Project overview
- `START_HERE.md` - Getting started guide
- `RENDER_SETUP_CHECKLIST.md` - Render deployment checklist
- `RENDER_MONGODB_SETUP.md` - MongoDB Atlas setup
- `RENDER_ENV_VALUES.md` - Environment variables
- `CREATE_BACKEND_SERVICE.md` - Backend service creation
- `DEBUG_RENDER.md` - Debugging guide
- `FIX_RENDER_MONGODB.md` - MongoDB fix guide
- `RENDER_STATUS.md` - Deployment status
- Và nhiều file hướng dẫn khác...

### Scripts
- `start-all.ps1` - Start all services (PowerShell)
- `start-backend.ps1` - Start backend only
- `restart-frontend.bat` - Restart frontend
- `test-build.bat` / `test-build.sh` - Test build

## 🗄️ Database Structure

### MongoDB (Duy nhất database đang dùng)
```
Database: tvu_documents
Collections:
├── users                      # User accounts
├── activities                 # Student activities
├── certificates               # Certificates
├── decisions                  # Administrative decisions
├── documents                  # OCR results
└── extractions                # Extracted data
```

### PostgreSQL (Không dùng nữa)
- Đã xóa khỏi docker-compose.yml
- Code vẫn còn nhưng không active

### Redis (Không dùng nữa)
- Đã xóa khỏi docker-compose.yml
- Code vẫn còn nhưng không active

## 🚀 Deployment

### Local (Docker)
```bash
docker-compose up -d
```
Services:
- Frontend: http://localhost
- Backend Node: http://localhost:3000
- Backend Python: http://localhost:8000
- MongoDB: localhost:27017
- Mongo Express: http://localhost:8081

### Render (Cloud)
Services cần deploy:
1. Frontend (Static Site)
2. Backend Node.js (Web Service)
3. Backend Python (Web Service) - Optional
4. MongoDB Atlas (External)

## 📝 Environment Variables

### Backend Node.js
```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
CORS_ORIGINS=...
PYTHON_WORKER_URL=...
```

### Backend Python
```
MONGODB_URL=mongodb+srv://...
MONGODB_DB_NAME=tvu_documents
TESSERACT_PATH=/usr/bin/tesseract
OCR_LANGUAGE=vie
```

### Frontend
```
VITE_API_URL=https://backend-url/api
VITE_PYTHON_API_URL=https://python-backend-url
VITE_APP_NAME=TVU GDQP-AN Admin Portal
```

## 📊 Tech Stack Summary

### Backend Node.js
- Runtime: Node.js 22
- Framework: Express.js
- Language: TypeScript
- Database: MongoDB (Mongoose)
- Auth: JWT + bcrypt
- Logging: Winston

### Backend Python
- Runtime: Python 3.11+
- Framework: FastAPI
- Database: MongoDB (Motor - async)
- OCR: Tesseract, Google Gemini
- PDF: pdf2image, PyPDF2

### Frontend
- Framework: React 18
- Language: TypeScript
- Build: Vite
- Styling: Tailwind CSS
- Routing: React Router v6
- HTTP: Axios

### DevOps
- Containerization: Docker
- Orchestration: Docker Compose
- Cloud: Render.com
- Database: MongoDB Atlas
- Version Control: Git + GitHub
