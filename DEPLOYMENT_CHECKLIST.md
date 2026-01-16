# ✅ Pre-Deployment Checklist

Use this before deploying to Vercel:

## Code Changes (All Done ✓)

- [x] Next.js config merged (webpack + images)
- [x] OCR moved to client-side (lib/ocr-client.ts)
- [x] Upload-id API updated to accept pre-extracted data
- [x] File upload limit: 4MB (Vercel compatible)
- [x] Transaction wrapper in registration
- [x] Improved batch year validation (6-year window)
- [x] Better error logging added

## Before Deploying

### 1. Database Setup

- [ ] Create production PostgreSQL database (Neon/Supabase)
- [ ] Copy connection string
- [ ] Test connection: `npx prisma studio`

### 2. Generate Secrets

```bash
# Run this command:
openssl rand -base64 32
```

- [ ] Copy the generated secret

### 3. GitHub

```bash
git add .
git commit -m "Ready for production"
git push origin main
```

- [ ] Code pushed to GitHub

### 4. Vercel Environment Variables

Set these in Vercel dashboard:

Required:

- [ ] `DATABASE_URL` (from Step 1)
- [ ] `AUTH_SECRET` (from Step 2)
- [ ] `AUTH_URL` (will set after first deploy)
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`

### 5. Deploy

- [ ] Connect GitHub repo to Vercel
- [ ] Configure framework preset: Next.js
- [ ] Add environment variables
- [ ] Click "Deploy"
- [ ] Wait for build to complete
- [ ] Copy deployment URL

### 6. Update AUTH_URL

- [ ] Go to Vercel → Settings → Environment Variables
- [ ] Edit `AUTH_URL` → Set to your deployment URL
- [ ] Redeploy

### 7. Database Migration

```bash
# Option 1: From local
DATABASE_URL="your-prod-url" npx prisma migrate deploy

# Option 2: Using Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy
```

- [ ] Migrations applied to production DB

## Testing After Deployment

### Must Test:

- [ ] Visit homepage (should load)
- [ ] Upload ID card on /signup (OCR should work)
- [ ] Check browser console (should see OCR progress)
- [ ] Complete registration
- [ ] Login with email
- [ ] Login with roll number
- [ ] Access /home (should show user data)
- [ ] Try /home in incognito (should redirect to login)

### Check Logs:

- [ ] Vercel Dashboard → Logs (no errors)
- [ ] Database has new user entry
- [ ] Cloudinary has uploaded ID card

## If Something Breaks

### OCR Not Working?

1. Check browser console for errors
2. Look for "eng.traineddata.gz" in Network tab
3. Try different browser
4. Clear cache and retry

### Database Errors?

1. Check DATABASE_URL is correct
2. Verify migrations ran: `npx prisma studio`
3. Check Vercel logs for connection errors

### Image Upload Fails?

1. Verify Cloudinary env vars are set
2. Check file size < 4MB
3. Look at Vercel function logs

## Post-Launch

- [ ] Share app URL with beta testers
- [ ] Monitor Vercel logs for 24 hours
- [ ] Check database for new registrations
- [ ] Monitor Cloudinary usage
- [ ] Set up alerts in Vercel

---

## Quick Deploy Command

```bash
# All-in-one deploy
git add . && git commit -m "Deploy v1.0" && git push origin main
```

Then just push the "Deploy" button in Vercel!
