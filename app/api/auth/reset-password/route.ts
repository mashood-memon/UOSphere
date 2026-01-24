import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 },
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 },
      );
    }

    console.log(
      "[Reset Password] Looking up token:",
      token.substring(0, 8) + "...",
    );

    // Find the password reset record FIRST before any cleanup
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    console.log("[Reset Password] Token found:", !!resetRecord);
    if (resetRecord) {
      console.log("[Reset Password] Token expiry:", resetRecord.expiresAt);
      console.log("[Reset Password] Current time:", new Date());
      console.log("[Reset Password] Token used:", resetRecord.used);
      console.log(
        "[Reset Password] Time until expiry (minutes):",
        (resetRecord.expiresAt.getTime() - Date.now()) / 1000 / 60,
      );
    }

    if (!resetRecord) {
      console.error("[Reset Password] Token not found in database");
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    // Check if token has been used
    if (resetRecord.used) {
      console.log("[Reset Password] Token already used");
      return NextResponse.json(
        { error: "This reset link has already been used" },
        { status: 400 },
      );
    }

    // Check if token has expired
    if (new Date() > resetRecord.expiresAt) {
      console.log("[Reset Password] Token expired");
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user's password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true },
      }),
    ]);

    // Clean up expired tokens AFTER successful reset (run async, don't block)
    prisma.passwordReset
      .deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      })
      .catch((err) => console.error("Failed to cleanup expired tokens:", err));

    console.log(
      "[Reset Password] Password reset successful for user:",
      resetRecord.userId,
    );

    return NextResponse.json({
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 },
    );
  }
}
