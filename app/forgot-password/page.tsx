"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetLink, setResetLink] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const identifier = formData.get("identifier") as string;

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);

        // In development, show the reset link
        if (data.resetLink) {
          setResetLink(data.resetLink);
        }

        toast({
          title: "Reset link generated",
          description: data.message,
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to process request",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold text-blue-600 cursor-pointer">
              UOSphere
            </h1>
          </Link>
          <p className="text-gray-600 mt-2">Reset your password</p>
        </div>

        {/* Forgot Password Card */}
        <Card>
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
              {submitted
                ? "Check your instructions below"
                : "Enter your email or roll number to reset your password"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Identifier Field */}
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email or Roll Number</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="identifier"
                      name="identifier"
                      type="text"
                      placeholder="2K25/CSE/87 or email@example.com"
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Processing..." : "Send Reset Link"}
                </Button>

                {/* Back to Login */}
                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                  </Link>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Success Message */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    If an account with a registered email exists, a password
                    reset link has been sent to your email address.
                  </p>
                </div>

                {/* Development Only - Show Reset Link if email fails */}
                {resetLink && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-800" />
                      <p className="text-xs font-semibold text-yellow-800">
                        Email Service Not Configured - Reset Link:
                      </p>
                    </div>
                    <Link
                      href={resetLink}
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {resetLink}
                    </Link>
                    <p className="text-xs text-yellow-700 mt-2">
                      This link is shown because email sending failed. Please
                      configure RESEND_API_KEY in your .env file.
                    </p>
                  </div>
                )}

                {/* Instructions */}
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="font-semibold">Next steps:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Check your email inbox (and spam folder)</li>
                    <li>Click the reset link in the email</li>
                    <li>Enter your new password</li>
                    <li>Log in with your new password</li>
                  </ol>
                  <p className="text-xs mt-3 text-gray-500">
                    The reset link will expire in 1 hour for security reasons.
                  </p>
                </div>

                {/* Back to Login */}
                <div className="text-center pt-4">
                  <Link
                    href="/login"
                    className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                  </Link>
                </div>

                {/* Try Again */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSubmitted(false);
                    setResetLink("");
                  }}
                >
                  Try Different Email/Roll Number
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Note */}
        {!submitted && (
          <p className="text-center text-sm text-gray-600 mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
