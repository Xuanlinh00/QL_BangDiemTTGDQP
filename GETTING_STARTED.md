# TVU GDQP-AN Admin Portal - Getting Started

## 🚀 Quick Start (10 minutes)

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+ (or Docker)
- Git

### Step 1: Clone & Setup Database

```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
sleep 5

# Create database
createdb -U admin -h localhost tvu_gdqp_admin
```

### Step 2: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start dev server
npm run dev
```

Frontend will be available at: **http://localhost:5173**

### Step 3: Backend (Node.js) Setup

```bash
cd backend-node

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start dev server
npm run dev
```

Backend API will be available at: **http://localhost:3000/api**

### Step 4: Backend (Python) Setup

```bash
cd backend-python

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Start dev server
python -m uvicorn app.main:app --reload
```

Python worker will be available at: **http://localhost:8000**

---

## 🔐 Login Credentials

**Email**: admin@tvu.edu.vn  
**Password**: password

---

## 📝 Project Structure

```
tvu-gdqp-admin-portal/
├── frontend/              # React 18 + TypeScript
├── backend-node/          # Express.js API
├── backend-python/        # FastAPI worker
├── database/              # Database scripts
├── docker-compose.yml     # Local development
└── README.md              # Project overview
```

---

## 🛠️ Common Commands

### Frontend
```bash
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run linter
```

### Backend (Node.js)
```bash
cd backend-node
npm run dev          # Start dev server
npm run build        # Build for production
npm run test         # Run tests
```

### Backend (Python)
```bash
cd backend-python
python -m uvicorn app.main:app --reload  # Start dev server
pytest               # Run tests
```

---

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Dashboard
- `GET /api/dashboard/metrics` - Get dashboard metrics

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents/upload` - Upload document

---

## 🐛 Troubleshooting

### Port already in use
```bash
# Find process using port
lsof -i :3000  # or :5173, :8000

# Kill process
kill -9 <PID>
```

### PostgreSQL connection error
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres
```

### Python dependencies error
```bash
# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 📚 Next Steps

1. ✅ Frontend is running at http://localhost:5173
2. ✅ Backend API is running at http://localhost:3000/api
3. ✅ Python worker is running at http://localhost:8000
4. 📖 Read [README.md](README.md) for project overview
5. 📖 Read [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for quick reference
6. 📖 Read [spec-tasks.md](.claude/agents/kfc/spec-tasks.md) for development tasks

---

## 🎯 Development Workflow

1. **Week 1-2**: Authentication & base layout (✅ Done)
2. **Week 3**: Document management
3. **Week 4**: OCR processing
4. **Week 5**: Data extraction
5. **Week 6**: Decision management & reconciliation
6. **Week 7**: Dashboard & reports
7. **Week 8**: Settings & deployment

---

## 📞 Support

- Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for troubleshooting
- Review [spec-impl.md](.claude/agents/kfc/spec-impl.md) for implementation details
- Check [spec-tasks.md](.claude/agents/kfc/spec-tasks.md) for task details

---

**Status**: ✅ Ready for development!

