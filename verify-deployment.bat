@echo off
REM Pre-Deployment Verification Script for Windows
REM Run this before deploying to catch issues early

echo.
echo 🔍 UOSphere Pre-Deployment Verification
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Run this from the project root.
    exit /b 1
)

echo ✅ Running from project root
echo.

REM Check for duplicate config files
echo 📝 Checking configuration files...
if exist "next.config.mjs" (
    echo ⚠️  WARNING: next.config.mjs still exists. Should only have next.config.ts
    echo    Run: del next.config.mjs
) else (
    echo ✅ No duplicate next.config.mjs
)

if exist "next.config.ts" (
    echo ✅ next.config.ts exists
) else (
    echo ❌ Error: next.config.ts not found
    exit /b 1
)
echo.

REM Check for required files
echo 📁 Checking required files...

if exist "lib\ocr-client.ts" (echo ✅ lib\ocr-client.ts) else (echo ❌ Missing: lib\ocr-client.ts)
if exist "lib\auth.ts" (echo ✅ lib\auth.ts) else (echo ❌ Missing: lib\auth.ts)
if exist "lib\cloudinary.ts" (echo ✅ lib\cloudinary.ts) else (echo ❌ Missing: lib\cloudinary.ts)
if exist "lib\prisma.ts" (echo ✅ lib\prisma.ts) else (echo ❌ Missing: lib\prisma.ts)
if exist "app\api\auth\upload-id\route.ts" (echo ✅ app\api\auth\upload-id\route.ts) else (echo ❌ Missing: app\api\auth\upload-id\route.ts)
if exist "app\api\auth\register\route.ts" (echo ✅ app\api\auth\register\route.ts) else (echo ❌ Missing: app\api\auth\register\route.ts)
if exist "app\signup\page.tsx" (echo ✅ app\signup\page.tsx) else (echo ❌ Missing: app\signup\page.tsx)
if exist "middleware.ts" (echo ✅ middleware.ts) else (echo ❌ Missing: middleware.ts)
if exist "prisma\schema.prisma" (echo ✅ prisma\schema.prisma) else (echo ❌ Missing: prisma\schema.prisma)
echo.

REM Check for .env file
echo 🔐 Checking environment setup...
if exist ".env" (
    echo ✅ .env file exists
    findstr /C:"DATABASE_URL=" .env >nul && echo ✅ DATABASE_URL is set || echo ⚠️  DATABASE_URL not found
    findstr /C:"AUTH_SECRET=" .env >nul && echo ✅ AUTH_SECRET is set || echo ⚠️  AUTH_SECRET not found
    findstr /C:"CLOUDINARY_CLOUD_NAME=" .env >nul && echo ✅ CLOUDINARY_CLOUD_NAME is set || echo ⚠️  CLOUDINARY_CLOUD_NAME not found
    findstr /C:"CLOUDINARY_API_KEY=" .env >nul && echo ✅ CLOUDINARY_API_KEY is set || echo ⚠️  CLOUDINARY_API_KEY not found
    findstr /C:"CLOUDINARY_API_SECRET=" .env >nul && echo ✅ CLOUDINARY_API_SECRET is set || echo ⚠️  CLOUDINARY_API_SECRET not found
) else (
    echo ⚠️  .env file not found
    if exist ".env.example" (
        echo    Run: copy .env.example .env
        echo    Then fill in your values
    )
)
echo.

REM Check if .env is in .gitignore
echo 🔒 Checking security...
if exist ".gitignore" (
    findstr /C:".env" .gitignore >nul && echo ✅ .env is in .gitignore || echo ⚠️  .env should be in .gitignore
)
echo.

REM Check dependencies
echo 📦 Checking dependencies...
where npm >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ npm is installed
    
    if exist "node_modules" (
        echo ✅ node_modules exists
    ) else (
        echo ⚠️  node_modules not found. Run: npm install
    )
) else (
    echo ❌ npm is not installed
    exit /b 1
)
echo.

REM Check Prisma
echo 🗄️  Checking database setup...
if exist "node_modules\.prisma" (
    echo ✅ Prisma client generated
) else (
    echo ⚠️  Prisma client not generated. Run: npx prisma generate
)

if exist "prisma\migrations" (
    echo ✅ Migrations directory exists
) else (
    echo ⚠️  No migrations found. Run: npx prisma migrate dev
)
echo.

REM Try to build
echo 🏗️  Testing build...
echo Running: npm run build
echo.

npm run build > build.log 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Build successful!
    del build.log
) else (
    echo ❌ Build failed. Check build.log for details
    echo.
    echo Last lines of build log:
    type build.log
    exit /b 1
)
echo.

REM Check for TypeScript errors
echo 🔍 Checking TypeScript...
npx tsc --noEmit > tsc.log 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ No TypeScript errors
    del tsc.log
) else (
    echo ⚠️  TypeScript errors found:
    type tsc.log
    del tsc.log
)
echo.

REM Summary
echo ========================================
echo 📊 Verification Summary
echo ========================================
echo.
echo ✅ Ready to deploy if all checks passed!
echo.
echo Next steps:
echo 1. Review DEPLOYMENT_CHECKLIST.md
echo 2. Set up production database
echo 3. Push to GitHub: git push origin main
echo 4. Deploy on Vercel
echo 5. Follow DEPLOYMENT_GUIDE.md
echo.
echo Happy deploying! 🚀
echo.

pause
