@echo off
REM Script to test build locally before deploying to Render (Windows)

echo Testing Render build process locally...
echo.

cd backend-node
if %errorlevel% neq 0 exit /b %errorlevel%

echo Installing dependencies (including devDependencies)...
call npm install --include=dev

if %errorlevel% neq 0 (
  echo npm install failed
  exit /b %errorlevel%
)

echo.
echo Building TypeScript...
call npm run build

if %errorlevel% neq 0 (
  echo Build failed
  exit /b %errorlevel%
)

echo.
echo Build successful!
echo.
echo Build output:
dir dist

echo.
echo Ready to deploy to Render!
echo.
echo Next steps:
echo 1. Commit and push to GitHub
echo 2. Setup MongoDB Atlas (see HUONG_DAN_MONGODB_ATLAS.md)
echo 3. Configure Render environment variables
echo 4. Deploy on Render

cd ..
