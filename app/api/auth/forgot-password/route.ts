import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();

    if (!identifier) {
      return NextResponse.json(
        { error: "Email or roll number is required" },
        { status: 400 },
      );
    }

    // Normalize identifier (uppercase for roll number, lowercase for email)
    const normalizedIdentifier = identifier.toUpperCase();
    const emailIdentifier = identifier.toLowerCase();

    // Find user by email or roll number
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailIdentifier }, { rollNo: normalizedIdentifier }],
      },
    });

    // For security, always return success even if user not found
    // This prevents attackers from knowing if an email/roll number exists
    if (!user || !user.email) {
      return NextResponse.json({
        message:
          "If an account with a registered email exists, a password reset link has been sent.",
      });
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Delete any existing unused tokens for this user
    await prisma.passwordReset.deleteMany({
      where: {
        userId: user.id,
        used: false,
      },
    });

    // Create new password reset token
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // Generate reset link - supports both NEXTAUTH_URL and AUTH_URL
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.AUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000";

    // In production, throw error if neither URL is set
    if (
      process.env.NODE_ENV === "production" &&
      !process.env.NEXTAUTH_URL &&
      !process.env.AUTH_URL
    ) {
      console.error(
        "CRITICAL: NEXTAUTH_URL or AUTH_URL not set in production environment!",
      );
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 },
      );
    }

    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    // Send email with reset link
    try {
      await sendPasswordResetEmail(user.email, user.name, resetLink);
      console.log("Password reset email sent to:", user.email);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);

      // In development, still return the link if email fails
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({
          message: "Email service error. Reset link generated (dev mode):",
          resetLink,
          token: resetToken,
          error: "Email sending failed - check RESEND_API_KEY in .env",
        });
      }

      // In production, return generic error
      return NextResponse.json(
        {
          error: "Failed to send password reset email. Please try again later.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message:
        "If an account with a registered email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 },
    );
  }
}
