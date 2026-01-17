import { Resend } from "resend";

// Initialize Resend with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send a password reset email with a secure token link
 * @param to - Recipient email address
 * @param userName - User's name for personalization
 * @param resetLink - Complete reset link with token
 */
export async function sendPasswordResetEmail(
  to: string,
  userName: string,
  resetLink: string,
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "UOSphere <onboarding@resend.dev>", // Default Resend domain - works immediately
      to: [to],
      subject: "Reset Your UOSphere Password",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Password Reset Request</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Hi ${userName || "there"},
              </p>
              
              <p style="margin: 0 0 30px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your UOSphere account. Click the button below to create a new password:
              </p>
              
              <!-- Reset Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetLink}" 
                       style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 20px; color: #71717a; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="margin: 0 0 30px; padding: 15px; background-color: #f4f4f5; border-radius: 4px; word-break: break-all; color: #52525b; font-size: 13px;">
                ${resetLink}
              </p>
              
              <!-- Security Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px; color: #92400e; font-weight: 600; font-size: 14px;">⚠️ Security Notice</p>
                    <p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.5;">
                      This link will expire in <strong>1 hour</strong>. If you didn't request this password reset, please ignore this email or contact support if you're concerned about your account security.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                Best regards,<br>
                <strong style="color: #667eea;">The UOSphere Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                This is an automated message, please do not reply to this email.<br>
                © 2026 UOSphere - University of Sargodha
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
      text: `Hi ${userName || "there"},

We received a request to reset your password for your UOSphere account.

Reset your password by clicking this link:
${resetLink}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email or contact support if you're concerned about your account security.

Best regards,
The UOSphere Team

---
This is an automated message, please do not reply to this email.
© 2026 UOSphere - University of Sargodha`,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log("Password reset email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw error;
  }
}

/**
 * Send a welcome email to new users
 * @param to - Recipient email address
 * @param userName - User's name
 */
export async function sendWelcomeEmail(to: string, userName: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "UOSphere <onboarding@resend.dev>",
      to: [to],
      subject: "Welcome to UOSphere! 🎉",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Welcome to UOSphere! 🎉</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Hi ${userName},
              </p>
              
              <p style="margin: 0 0 20px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Welcome to <strong style="color: #667eea;">UOSphere</strong> - the social platform for University of Sargodha students!
              </p>
              
              <p style="margin: 0 0 30px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                Your account has been successfully created. You can now connect with fellow students, share experiences, and be part of our vibrant community.
              </p>
              
              <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                Best regards,<br>
                <strong style="color: #667eea;">The UOSphere Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                © 2026 UOSphere - University of Sargodha
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
      text: `Hi ${userName},

Welcome to UOSphere - the social platform for University of Sargodha students!

Your account has been successfully created. You can now connect with fellow students, share experiences, and be part of our vibrant community.

Best regards,
The UOSphere Team

---
© 2026 UOSphere - University of Sargodha`,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log("Welcome email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    throw error;
  }
}
