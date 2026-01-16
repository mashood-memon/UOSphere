# 🚀 Deployment Guide - UOSphere to Vercel

## ✅ Pre-Deployment Checklist

All critical issues have been fixed:

- ✅ Next.js config merged (Cloudinary + Tesseract webpack fix)
- ✅ Database migrations completed
- ✅ File upload size reduced to 4MB (Vercel limit)
- ✅ **OCR moved to client-side** (avoiding serverless issues)
- ✅ Transaction wrapper added to registration
- ✅ Improved batch year validation (6-year window)
- ✅ Better error logging added

---

## 📋 Step-by-Step Deployment Process

### **Step 1: Set Up Production Database**

You need a PostgreSQL database. Choose one:

#### Option A: Neon (Recommended - Generous Free Tier)

1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Create new project: "uosphere-prod"
4. Copy the connection string (looks like: `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`)
5. Save it - you'll need it for Vercel

#### Option B: Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database → Connection String
4. Copy the "Connection Pooling" string
5. Replace `[YOUR-PASSWORD]` with your actual password

---

### **Step 2: Generate Production Secrets**

Open your terminal and generate a secure auth secret:

```bash
# Generate AUTH_SECRET
openssl rand -base64 32
```

Copy the output - you'll need it for Vercel.

---

### **Step 3: Set Up Cloudinary (Already Done)**

You should already have:

- Cloud Name
- API Key
- API Secret

If not, go to [cloudinary.com](https://cloudinary.com) and get free account.

---

### **Step 4: Push to GitHub**

```bash
# Make sure all changes are committed
git status

# Add all files
git add .

# Commit
git commit -m "Ready for production deployment"

# Push to GitHub
git push origin main
```

If you haven't initialized Git yet:

```bash
git init
git add .
git commit -m "Initial commit - UOSphere ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

### **Step 5: Deploy to Vercel**

#### A. Connect Your Repository

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Select **"social_app"** repository

#### B. Configure Project Settings

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (leave as default)
- **Build Command**: `next build` (auto-filled)
- **Output Directory**: `.next` (auto-filled)

#### C. Add Environment Variables

Click **"Environment Variables"** and add these:

| Key                     | Value                        | Notes                         |
| ----------------------- | ---------------------------- | ----------------------------- |
| `DATABASE_URL`          | `postgresql://user:pass@...` | From Neon/Supabase (Step 1)   |
| `AUTH_SECRET`           | `your-generated-secret`      | From openssl command (Step 2) |
| `AUTH_URL`              | Leave empty for now          | Will set after deployment     |
| `CLOUDINARY_CLOUD_NAME` | Your cloud name              | From Cloudinary               |
| `CLOUDINARY_API_KEY`    | Your API key                 | From Cloudinary               |
| `CLOUDINARY_API_SECRET` | Your API secret              | From Cloudinary               |

**Important:** Do NOT add Pusher variables yet (you're not using them for auth).

#### D. Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. Copy your deployment URL (e.g., `https://uosphere.vercel.app`)

---

### **Step 6: Update AUTH_URL**

1. In Vercel dashboard, go to **Settings** → **Environment Variables**
2. Click **Edit** on `AUTH_URL`
3. Set value to your deployment URL: `https://your-app-name.vercel.app`
4. Click **Save**
5. Go to **Deployments** tab
6. Click **"..." menu** on latest deployment → **"Redeploy"**
7. Check **"Use existing Build Cache"** → **Redeploy**

---

### **Step 7: Run Database Migrations on Production**

You need to apply your Prisma schema to the production database:

```bash
# Make sure DATABASE_URL in your .env points to production
# OR set it temporarily:
DATABASE_URL="your-production-database-url" npx prisma migrate deploy

# If you get errors, you can also use db push:
DATABASE_URL="your-production-database-url" npx prisma db push
```

**Alternative:** Use Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Pull environment variables
vercel env pull .env.production

# Run migration
npx prisma migrate deploy
```

---

## 🧪 Post-Deployment Testing

### Test 1: Homepage

Visit `https://your-app.vercel.app/` - should load

### Test 2: Signup Flow (CRITICAL)

1. Go to `https://your-app.vercel.app/signup`
2. Upload a clear UOS ID card photo
3. **Watch browser console** - OCR should process (you'll see progress)
4. Verify extracted data is correct
5. Complete registration
6. Check if user is created in database

### Test 3: Login

1. Try logging in with email
2. Try logging in with roll number
3. Verify redirect to `/home`

### Test 4: Protected Routes

1. Open incognito window
2. Try to access `https://your-app.vercel.app/home`
3. Should redirect to `/login`

---

## 🐛 Troubleshooting

### Issue: "OCR not working / stuck"

**Check:**

1. Open browser DevTools → Console
2. Look for Tesseract.js errors
3. Check Network tab - should download `eng.traineddata.gz` (~2MB)

**Fix:**

- Clear browser cache
- Try different browser
- Check if firewall is blocking Tesseract CDN

---

### Issue: "Database connection error"

**Check:**

1. Vercel logs: Dashboard → Deployments → Click deployment → View Function Logs
2. Look for `DATABASE_URL` errors

**Fix:**

```bash
# Test connection locally
npx prisma studio
# If it works, DATABASE_URL is correct
```

---

### Issue: "Image upload fails"

**Check:**

1. Vercel logs for Cloudinary errors
2. Verify all 3 Cloudinary env vars are set

**Fix:**

- Check Cloudinary credentials are correct
- Ensure no extra spaces in env vars
- Verify Cloudinary account is active

---

### Issue: "Build fails"

**Common causes:**

1. Missing dependencies in package.json
2. TypeScript errors
3. Missing env vars during build

**Fix:**

```bash
# Test build locally first
npm run build

# If it works locally but fails on Vercel:
# - Check Vercel build logs
# - Ensure all dependencies are in package.json (not just devDependencies)
```

---

## 📊 Monitoring After Launch

### Check Vercel Logs

- Go to Dashboard → Your Project → Logs
- Monitor for errors in real-time
- Set up email alerts for errors

### Database Monitoring

- **Neon**: Dashboard → Monitoring tab
- **Supabase**: Dashboard → Database → Logs

### Cloudinary Usage

- Check Dashboard → Analytics
- Free tier: 25GB storage, 25GB bandwidth/month
- Monitor if you're approaching limits

---

## 🔒 Security Checklist

- ✅ `AUTH_SECRET` is strong and unique
- ✅ Database credentials are secure (not in Git)
- ✅ `.env` file is in `.gitignore`
- ✅ API routes validate all inputs
- ✅ Passwords hashed with bcrypt (12 rounds)
- ✅ File uploads limited to 4MB
- ✅ Roll numbers validated against duplicates

---

## 📈 Performance Tips

### Enable Vercel Analytics (Free)

```bash
npm install @vercel/analytics
```

Then in `app/layout.tsx`:

```tsx
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Enable Vercel Speed Insights

```bash
npm install @vercel/speed-insights
```

---

## 🎉 You're Live!

Once all tests pass, share your app:

**Landing Page:**
`https://your-app.vercel.app/`

**Direct Signup:**
`https://your-app.vercel.app/signup`

---

## 🔄 Future Deployments

Every time you push to GitHub main branch, Vercel auto-deploys:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Vercel will:

1. Build your app
2. Run checks
3. Deploy automatically
4. Give you a preview URL

---

## ⚠️ Important Notes

### Client-Side OCR

- OCR now runs in the browser (Tesseract.js)
- Users download ~2MB traineddata file on first use
- This avoids Vercel serverless limitations
- Works reliably across all browsers

### File Upload Limits

- Max 4MB per image (Vercel limit)
- Cloudinary will optimize images automatically
- Users should be instructed to take clear photos

### Database Connections

- Vercel serverless functions have connection pooling
- Neon/Supabase handle this automatically
- No need for additional configuration

---

## 🆘 Need Help?

**Vercel Issues:**

- Check [Vercel Docs](https://vercel.com/docs)
- Vercel Discord: [discord.gg/vercel](https://discord.gg/vercel)

**Next.js Issues:**

- [Next.js Docs](https://nextjs.org/docs)
- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)

**Database Issues:**

- Neon Docs: [neon.tech/docs](https://neon.tech/docs)
- Supabase Docs: [supabase.com/docs](https://supabase.com/docs)

---

## 📝 Post-Launch TODO

After successful deployment:

1. **Set up custom domain** (optional)

   - Go to Vercel → Settings → Domains
   - Add your domain (e.g., `uosphere.com`)
   - Update DNS records

2. **Add rate limiting** (recommended)

   - Prevent spam registrations
   - Use `@upstash/ratelimit` or similar

3. **Set up error tracking**

   - Sentry.io (recommended)
   - Catches runtime errors automatically

4. **Database backups**

   - Neon: Automatic backups included
   - Supabase: Point-in-time recovery available

5. **Analytics**
   - Vercel Analytics (page views, performance)
   - Custom events for tracking signups, logins

---

Good luck with your launch! 🚀
