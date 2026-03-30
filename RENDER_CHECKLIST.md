# ✅ Render Deployment Checklist

## 📋 Pre-Deployment

### Tài Khoản
- [ ] Tạo tài khoản Render.com
- [ ] Tạo tài khoản MongoDB Atlas
- [ ] Tạo tài khoản Upstash Redis
- [ ] Kết nối GitHub với Render

### Code Repository
- [ ] Push code lên GitHub
- [ ] Đảm bảo có `.gitignore` (không commit .env, node_modules)
- [ ] Kiểm tra Dockerfiles hoạt động local
- [ ] Test build commands local

## 🗄️ Database Setup

### MongoDB Atlas
- [ ] Tạo cluster (Free M0)
- [ ] Chọn region gần (Singapore/Tokyo)
- [ ] Tạo database user
- [ ] Whitelist IP: 0.0.0.0/0
- [ ] Copy connection string
- [ ] Test connection

### Upstash Redis
- [ ] Tạo database (Free tier)
- [ ] Chọn region gần
- [ ] Copy host, port, password
- [ ] Test connection

### PostgreSQL
- [ ] Tạo Render PostgreSQL service
- [ ] Hoặc setup ElephantSQL
- [ ] Copy connection string
- [ ] Lưu credentials an toàn

## 🚀 Service Deployment

### Backend Node.js
- [ ] Create Web Service
- [ ] Connect GitHub repo
- [ ] Set Dockerfile path: `./backend-node/Dockerfile`
- [ ] Set environment: Docker
- [ ] Add all environment variables:
  - [ ] NODE_ENV
  - [ ] PORT
  - [ ] DATABASE_URL
  - [ ] MONGODB_URI
  - [ ] REDIS_HOST
  - [ ] REDIS_PORT
  - [ ] REDIS_PASSWORD
  - [ ] JWT_SECRET
  - [ ] CORS_ORIGINS
  - [ ] PYTHON_WORKER_URL
- [ ] Set health check path: `/health`
- [ ] Deploy và đợi build
- [ ] Kiểm tra logs
- [ ] Test health endpoint

### Backend Python
- [ ] Create Web Service
- [ ] Connect GitHub repo
- [ ] Set Dockerfile path: `./backend-python/Dockerfile`
- [ ] Add environment variables:
  - [ ] MONGODB_URL
  - [ ] MONGODB_DB_NAME
  - [ ] TESSERACT_PATH
  - [ ] OCR_LANGUAGE
  - [ ] API_HOST
  - [ ] API_PORT
- [ ] Set health check path: `/health`
- [ ] Deploy và đợi build
- [ ] Kiểm tra logs
- [ ] Test health endpoint

### Frontend
- [ ] Create Static Site
- [ ] Connect GitHub repo
- [ ] Set build command: `cd frontend && npm install && npm run build`
- [ ] Set publish directory: `frontend/dist`
- [ ] Add environment variables:
  - [ ] VITE_API_URL
  - [ ] VITE_PYTHON_API_URL
  - [ ] VITE_APP_NAME
- [ ] Add rewrite rule: `/*` → `/index.html`
- [ ] Deploy và đợi build
- [ ] Kiểm tra logs
- [ ] Test frontend URL

## 🔧 Post-Deployment

### Database Initialization
- [ ] Connect to PostgreSQL
- [ ] Run init.sql script
- [ ] Verify tables created
- [ ] Create indexes if needed

### Admin User
- [ ] Create admin user via API
- [ ] Test login
- [ ] Verify permissions

### CORS Configuration
- [ ] Update CORS_ORIGINS với frontend URL
- [ ] Redeploy backend-node
- [ ] Test CORS từ frontend

### Testing
- [ ] Test frontend loads
- [ ] Test login/logout
- [ ] Test API endpoints
- [ ] Test file upload
- [ ] Test OCR functionality
- [ ] Test database operations
- [ ] Test all major features

## 🔐 Security

### Environment Variables
- [ ] Verify không có secrets trong code
- [ ] JWT_SECRET đủ mạnh (32+ chars)
- [ ] Database passwords phức tạp
- [ ] Tất cả secrets được set trong Render

### CORS
- [ ] CORS_ORIGINS chỉ bao gồm domains cần thiết
- [ ] Không dùng wildcard (*) trong production

### HTTPS
- [ ] Verify tất cả services dùng HTTPS
- [ ] Update URLs trong environment variables

## 📊 Monitoring

### Render Dashboard
- [ ] Check metrics (CPU, Memory)
- [ ] Enable persistent logs
- [ ] Setup email notifications

### External Monitoring
- [ ] Setup UptimeRobot
- [ ] Add health check URLs
- [ ] Configure alerts

### Logging
- [ ] Verify logs đang được ghi
- [ ] Check error logs
- [ ] Setup log retention

## 🔄 CI/CD

### Auto-Deploy
- [ ] Enable auto-deploy từ GitHub
- [ ] Set branch: main
- [ ] Test auto-deploy với commit mới

### Build Optimization
- [ ] Verify build time < 15 phút
- [ ] Optimize Dockerfiles nếu cần
- [ ] Use build cache hiệu quả

## 📝 Documentation

### URLs
- [ ] Document frontend URL
- [ ] Document backend URLs
- [ ] Document admin credentials
- [ ] Share với team

### Credentials
- [ ] Lưu database credentials
- [ ] Lưu API keys
- [ ] Lưu admin passwords
- [ ] Store securely (1Password, LastPass)

## 🎯 Optional Enhancements

### Custom Domain
- [ ] Mua domain
- [ ] Add domain trong Render
- [ ] Configure DNS
- [ ] Update CORS_ORIGINS
- [ ] Test với custom domain

### Performance
- [ ] Setup CDN (Cloudflare)
- [ ] Optimize images
- [ ] Enable compression
- [ ] Add caching headers

### Backup
- [ ] Setup automated database backups
- [ ] Test restore process
- [ ] Document backup procedure

### Scaling
- [ ] Monitor resource usage
- [ ] Plan for scaling nếu cần
- [ ] Consider paid plans

## ✅ Final Verification

### Functionality
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] File uploads work
- [ ] OCR processing works
- [ ] Data export works
- [ ] All APIs respond correctly

### Performance
- [ ] Page load time < 3s
- [ ] API response time < 1s
- [ ] No console errors
- [ ] No broken links

### Mobile
- [ ] Test trên mobile
- [ ] Responsive design works
- [ ] Touch interactions work

## 📞 Support

### Issues
- [ ] Document known issues
- [ ] Create issue tracker
- [ ] Setup support channel

### Maintenance
- [ ] Schedule regular updates
- [ ] Monitor for security patches
- [ ] Plan for database maintenance

---

## 🎉 Deployment Complete!

Khi tất cả checkboxes được tick:

✅ **Ứng dụng đã sẵn sàng production!**

**URLs**:
- Frontend: `https://tvu-frontend.onrender.com`
- Backend Node: `https://tvu-backend-node.onrender.com`
- Backend Python: `https://tvu-backend-python.onrender.com`

**Next Steps**:
1. Share URLs với users
2. Monitor performance
3. Collect feedback
4. Plan improvements

---

**Estimated Time**: 30-45 minutes  
**Difficulty**: ⭐⭐⭐☆☆ (Medium)  
**Cost**: $0 (Free tier)
