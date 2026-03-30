# 🚀 Render Deployment - Final Checklist

## ✅ Code Changes Completed

### Backend Node.js
- ✅ Removed `pg` and `typeorm` from dependencies
- ✅ Fixed logger to use console only (no file storage)
- ✅ Fixed CORS to properly trim origins
- ✅ Server listening on `0.0.0.0` (Render requirement)
- ✅ Updated .env with Render placeholders

### Backend Python
- ✅ Config supports PORT env variable
- ✅ MONGODB_DB_NAME = "tvu_documents"
- ✅ API_HOST = "0.0.0.0"
- ✅ Dockerfile uses `python -m app.main`

### Frontend
- ✅ Dockerfile supports dynamic PORT via envsubst
- ✅ nginx.conf listens on `${PORT}`
- ✅ Updated .env.example with Render URLs

### Configuration Files
- ✅ render.yaml: MongoDB only (no PostgreSQL)
- ✅ docker-compose files: Updated with no PostgreSQL
- ✅ package.json: Cleaned dependencies

## 🔧 Environment Variables Setup on Render

### Step 1: Create Services in Render Dashboard

For each service, set these exact environment variables:

#### Backend Node.js Service
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/qlbangdiem?retryWrites=true&w=majority
REDIS_HOST=your-redis-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
JWT_SECRET=<generate-random-32-char-key>
CORS_ORIGINS=https://tvu-frontend.onrender.com,https://tvu-backend-node.onrender.com,http://localhost:5173
PYTHON_WORKER_URL=https://tvu-backend-python.onrender.com
LOG_LEVEL=info
```

#### Backend Python Service
```
MONGODB_URL=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net
MONGODB_DB_NAME=tvu_documents
GOOGLE_APPLICATION_CREDENTIALS=/app/google-credentials.json
TESSERACT_PATH=/usr/bin/tesseract
OCR_LANGUAGE=vie
API_HOST=0.0.0.0
```

#### Frontend Service
```
VITE_API_URL=https://tvu-backend-node.onrender.com/api
VITE_PYTHON_API_URL=https://tvu-backend-python.onrender.com
VITE_APP_NAME=TVU GDQP-AN Admin Portal
```

### Step 2: External Services Setup

#### MongoDB Atlas
1. Create account: https://www.mongodb.com/cloud/atlas
2. Create FREE cluster (M0)
3. Create database user with strong password
4. Whitelist IP: `0.0.0.0/0`
5. Get connection string

#### Redis (Optional for Free Tier)
If using: https://upstash.com
1. Create free database
2. Get credentials
3. Add to Environment Variables

## 📋 Pre-Deployment Checklist

- [ ] MongoDB Atlas cluster created and accessible
- [ ] Redis credentials ready (if using)
- [ ] GitHub repo updated with latest code
- [ ] All `npm install` dependencies correct (no pg, typeorm)
- [ ] render.yaml exists with correct services
- [ ] Dockerfiles verified:
  - [ ] backend-node/Dockerfile
  - [ ] backend-python/Dockerfile
  - [ ] frontend/Dockerfile (with dynamic PORT)
- [ ] Health check endpoints working:
  - [ ] `GET /health` returns `{"status":"ok"}`

## 🚀 Deployment Steps

### 1. Commit & Push to GitHub
```bash
# From project root
git add .
git commit -m "Fix code for Render deployment - MongoDB only"
git push origin <your-branch>
```

### 2. Connect to Render

Visit: https://dashboard.render.com

**Option A: Using render.yaml**
- New → Blueprint
- Connect GitHub repo
- Select `render.yaml`
- Deploy all services at once

**Option B: Manual**
1. New → Web Service
2. Connect GitHub repo
3. For each service:
   - Set Dockerfile path
   - Configure environment variables
   - Deploy

### 3. Set Environment Variables

In Render Dashboard, for each service:
1. Click service
2. Environment tab
3. Add variables from checklist above
4. Save → Auto-redeploy

### 4. Wait for Deploy & Health Checks

Each service will:
1. Build Docker image
2. Start container
3. Run health checks
4. Enable traffic if healthy

Typical deploy time: 5-10 minutes per service

## 🔗 Testing After Deploy

### Backend Node Health
```bash
curl https://tvu-backend-node.onrender.com/health
# Expected: {"status":"ok"}
```

### Backend Python Health
```bash
curl https://tvu-backend-python.onrender.com/health
# Expected: {"status":"ok"}
```

### Frontend
Visit: https://tvu-frontend.onrender.com
- Should load React app
- Network tab should show API calls to correct backends

## 🆘 Troubleshooting

### 502 Bad Gateway
- Check health check endpoint responds
- Check environment variables set correctly
- Check MongoDB Atlas connection string

### MongoDB Connection Failed
- Verify connection string format
- Check IP whitelist includes 0.0.0.0/0
- Test connection from MongoDB Compass

### API CORS Errors
- Verify CORS_ORIGINS includes frontend URL
- Frontend URL should be `https://tvu-frontend.onrender.com` (exact match)

### Logs Not Visible
- Backend logs go to stdout (Render logs)
- Check Render service logs: Logs tab in service dashboard

## 📊 Monitoring

After deploy:
1. Check service status: Dashboard → Services
2. View logs: Service → Logs
3. Monitor performance: Service → Metrics

## 🔐 Security Notes

- Never commit `.env` file with real credentials
- Use Render's built-in environment variable encryption
- Rotate JWT_SECRET regularly
- Keep dependencies updated: `npm audit fix`

## 📞 Support Links

- Render Docs: https://render.com/docs
- MongoDB Atlas Docs: https://docs.mongodb.com
- Express.js Docs: https://expressjs.com
- FastAPI Docs: https://fastapi.tiangolo.com

---

**Status**: ✅ Code ready for Render deployment
**Last Updated**: 2024
**Next Step**: Follow "Deployment Steps" above
