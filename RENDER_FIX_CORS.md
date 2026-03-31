# Fix CORS Error on Render

## Problem
Frontend at `https://tvu-frontend.onrender.com` cannot connect to backend due to CORS policy.

## Solution

### Step 1: Update Backend Environment Variables

1. Go to https://dashboard.render.com
2. Click on `tvu-backend-node1` service
3. Click "Environment" in the left sidebar
4. Find or add `CORS_ORIGINS` variable
5. Set value to:
   ```
   https://tvu-frontend.onrender.com,http://localhost:5173
   ```
6. Click "Save Changes"
7. Wait for automatic redeploy (about 2-3 minutes)

### Step 2: Update Frontend Environment Variables

1. Go to https://dashboard.render.com
2. Click on `tvu-frontend` service
3. Click "Environment" in the left sidebar
4. Find or add these variables:
   - `VITE_API_URL` = `https://tvu-backend-node1.onrender.com/api`
   - `VITE_PYTHON_API_URL` = `https://tvu-backend-python.onrender.com`
5. Click "Save Changes"
6. Manually redeploy: Click "Manual Deploy" → "Deploy latest commit"

### Step 3: Verify

1. Wait for both services to finish deploying (green "Live" status)
2. Open `https://tvu-frontend.onrender.com`
3. Try to login
4. Check browser console - CORS error should be gone

## Common Issues

### Backend URL is wrong
- Make sure you're using `tvu-backend-node1.onrender.com` (with the `1`)
- Check the actual URL in your Render dashboard

### CORS still failing
- Make sure CORS_ORIGINS includes the exact frontend URL
- No trailing slashes
- Use https:// for production URLs

### 404 errors for assets
- The `vite.svg` 404 is normal if you don't have that file
- It won't affect functionality
- You can ignore it or add a favicon to `frontend/public/`

## Test Backend Directly

Open in browser: `https://tvu-backend-node1.onrender.com/health`

Should return: `{"status":"ok"}`

If this doesn't work, backend isn't running properly.
