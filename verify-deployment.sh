#!/bin/bash

# 🧪 Pre-Deployment Verification Script
# Run this before deploying to catch issues early

echo "🔍 UOSphere Pre-Deployment Verification"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this from the project root."
    exit 1
fi

echo "✅ Running from project root"
echo ""

# Check for duplicate config files
echo "📝 Checking configuration files..."
if [ -f "next.config.mjs" ]; then
    echo "⚠️  WARNING: next.config.mjs still exists. Should only have next.config.ts"
    echo "   Run: rm next.config.mjs"
else
    echo "✅ No duplicate next.config.mjs"
fi

if [ -f "next.config.ts" ]; then
    echo "✅ next.config.ts exists"
else
    echo "❌ Error: next.config.ts not found"
    exit 1
fi
echo ""

# Check for required files
echo "📁 Checking required files..."
required_files=(
    "lib/ocr-client.ts"
    "lib/auth.ts"
    "lib/cloudinary.ts"
    "lib/prisma.ts"
    "app/api/auth/upload-id/route.ts"
    "app/api/auth/register/route.ts"
    "app/signup/page.tsx"
    "middleware.ts"
    "prisma/schema.prisma"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
    fi
done
echo ""

# Check for .env file
echo "🔐 Checking environment setup..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    
    # Check for required variables (without printing values)
    required_vars=(
        "DATABASE_URL"
        "AUTH_SECRET"
        "CLOUDINARY_CLOUD_NAME"
        "CLOUDINARY_API_KEY"
        "CLOUDINARY_API_SECRET"
    )
    
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" .env; then
            echo "✅ $var is set"
        else
            echo "⚠️  $var not found in .env"
        fi
    done
else
    echo "⚠️  .env file not found"
    if [ -f ".env.example" ]; then
        echo "   Run: cp .env.example .env"
        echo "   Then fill in your values"
    fi
fi
echo ""

# Check if .env is in .gitignore
echo "🔒 Checking security..."
if [ -f ".gitignore" ]; then
    if grep -q "^\.env$" .gitignore; then
        echo "✅ .env is in .gitignore"
    else
        echo "⚠️  .env should be in .gitignore"
    fi
fi
echo ""

# Check dependencies
echo "📦 Checking dependencies..."
if command -v npm &> /dev/null; then
    echo "✅ npm is installed"
    
    if [ -d "node_modules" ]; then
        echo "✅ node_modules exists"
    else
        echo "⚠️  node_modules not found. Run: npm install"
    fi
else
    echo "❌ npm is not installed"
    exit 1
fi
echo ""

# Check Prisma
echo "🗄️  Checking database setup..."
if [ -d "node_modules/.prisma" ]; then
    echo "✅ Prisma client generated"
else
    echo "⚠️  Prisma client not generated. Run: npx prisma generate"
fi

if [ -d "prisma/migrations" ]; then
    migration_count=$(ls -1 prisma/migrations | grep -v migration_lock.toml | wc -l)
    echo "✅ Found $migration_count migration(s)"
else
    echo "⚠️  No migrations found. Run: npx prisma migrate dev"
fi
echo ""

# Try to build
echo "🏗️  Testing build..."
echo "Running: npm run build"
echo ""

if npm run build > /tmp/build.log 2>&1; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Check /tmp/build.log for details"
    echo ""
    echo "Last 20 lines of build log:"
    tail -20 /tmp/build.log
    exit 1
fi
echo ""

# Check for TypeScript errors
echo "🔍 Checking TypeScript..."
if npx tsc --noEmit > /tmp/tsc.log 2>&1; then
    echo "✅ No TypeScript errors"
else
    echo "⚠️  TypeScript errors found:"
    cat /tmp/tsc.log
fi
echo ""

# Summary
echo "========================================"
echo "📊 Verification Summary"
echo "========================================"
echo ""
echo "✅ Ready to deploy if all checks passed!"
echo ""
echo "Next steps:"
echo "1. Review DEPLOYMENT_CHECKLIST.md"
echo "2. Set up production database"
echo "3. Push to GitHub: git push origin main"
echo "4. Deploy on Vercel"
echo "5. Follow DEPLOYMENT_GUIDE.md"
echo ""
echo "Happy deploying! 🚀"
