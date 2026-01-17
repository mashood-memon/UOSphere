import { NextResponse } from "next/server";

/**
 * Health check endpoint to verify critical environment variables
 * Access: /api/health
 */
export async function GET() {
  const checks = {
    database: !!process.env.DATABASE_URL,
    auth: !!process.env.AUTH_SECRET,
    nextauthUrl: !!(process.env.NEXTAUTH_URL || process.env.AUTH_URL),
    resend: !!process.env.RESEND_API_KEY,
    cloudinary: !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ),
    pusher: !!(
      process.env.NEXT_PUBLIC_PUSHER_KEY &&
      process.env.PUSHER_SECRET &&
      process.env.PUSHER_APP_ID
    ),
  };

  const allConfigured = Object.values(checks).every((check) => check === true);

  // Critical errors that will break core functionality
  const criticalErrors: string[] = [];
  if (!checks.nextauthUrl && process.env.NODE_ENV === "production") {
    criticalErrors.push(
      "NEXTAUTH_URL or AUTH_URL not set - password reset links will break!",
    );
  }
  if (!checks.auth)
    criticalErrors.push("AUTH_SECRET not set - auth will fail!");
  if (!checks.database)
    criticalErrors.push("DATABASE_URL not set - app cannot start!");
  if (!checks.resend)
    criticalErrors.push("RESEND_API_KEY not set - emails will fail!");

  // Warnings for optional features
  const warnings: string[] = [];
  if (!checks.cloudinary)
    warnings.push("Cloudinary not configured - image uploads will fail");
  if (!checks.pusher)
    warnings.push("Pusher not configured - real-time features will fail");

  return NextResponse.json({
    status: allConfigured ? "healthy" : "degraded",
    environment: process.env.NODE_ENV || "development",
    nextauthUrl:
      process.env.NEXTAUTH_URL ||
      process.env.AUTH_URL ||
      "NOT SET (will use VERCEL_URL)",
    vercelUrl: process.env.VERCEL_URL || "not in Vercel",
    checks,
    criticalErrors: criticalErrors.length > 0 ? criticalErrors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  });
}
