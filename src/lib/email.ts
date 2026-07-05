import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// ─── Email Provider Setup ─────────────────────────────────────────────────────

const useResend = !!process.env.RESEND_API_KEY;
const resend = useResend ? new Resend(process.env.RESEND_API_KEY) : null;

const transporter = !useResend
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

const FROM_EMAIL = 'CivicFix <noreply@civicfix.app>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ─── HTML Templates ───────────────────────────────────────────────────────────

const baseEmailTemplate = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; color: #0F172A; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; overflow: hidden; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(15,23,42,0.08); margin-top: 40px; margin-bottom: 40px; }
    .header { background-color: #0F172A; padding: 24px 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-family: 'Sora', sans-serif; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
    .content { padding: 40px 32px; line-height: 1.6; }
    .footer { background-color: #F1F5F9; padding: 24px 32px; text-align: center; font-size: 14px; color: #64748B; }
    .btn { display: inline-block; background-color: #2563EB; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 24px; margin-bottom: 8px; text-align: center; }
    p { margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CivicFix</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} CivicFix. All rights reserved.</p>
      <p>Building better communities, together.</p>
    </div>
  </div>
</body>
</html>
`;

// ─── Core Send Function ───────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string) {
  if (useResend && resend) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
  } else if (transporter) {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
  } else {
    console.warn('⚠️ No email provider configured. Logging email content instead:');
    console.log(`To: ${to}\nSubject: ${subject}\nHTML: ${html}`);
  }
}

// ─── Email Types ──────────────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verifyLink = `${APP_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  
  const content = `
    <h2 style="font-family: 'Sora', sans-serif; color: #1E3A8A; font-size: 20px; margin-top: 0;">Welcome, ${name}!</h2>
    <p>Thank you for joining CivicFix. To start reporting issues and making a difference in your community, please verify your email address.</p>
    <div style="text-align: center;">
      <a href="${verifyLink}" class="btn">Verify Email Address</a>
    </div>
    <p style="font-size: 14px; color: #475569; margin-top: 32px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="font-size: 14px; color: #2563EB; word-break: break-all;">${verifyLink}</p>
    <p style="font-size: 14px; color: #94A3B8;">This link will expire in 24 hours.</p>
  `;

  await sendEmail(email, 'Verify your CivicFix account', baseEmailTemplate('Verify Email', content));
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const resetLink = `${APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  
  const content = `
    <h2 style="font-family: 'Sora', sans-serif; color: #1E3A8A; font-size: 20px; margin-top: 0;">Password Reset Request</h2>
    <p>Hi ${name},</p>
    <p>We received a request to reset the password for your CivicFix account. If you didn't make this request, you can safely ignore this email.</p>
    <div style="text-align: center;">
      <a href="${resetLink}" class="btn">Reset Password</a>
    </div>
    <p style="font-size: 14px; color: #475569; margin-top: 32px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="font-size: 14px; color: #2563EB; word-break: break-all;">${resetLink}</p>
    <p style="font-size: 14px; color: #94A3B8;">This link will expire in 1 hour.</p>
  `;

  await sendEmail(email, 'Reset your CivicFix password', baseEmailTemplate('Reset Password', content));
}

export async function sendStatusUpdateEmail(email: string, name: string, ticketNumber: string, newStatus: string) {
  const content = `
    <h2 style="font-family: 'Sora', sans-serif; color: #1E3A8A; font-size: 20px; margin-top: 0;">Report Update: ${ticketNumber}</h2>
    <p>Hi ${name},</p>
    <p>There is an update on your recent report (<strong>${ticketNumber}</strong>).</p>
    <p>The status is now: <strong style="color: #2563EB; text-transform: uppercase;">${newStatus.replace('_', ' ')}</strong></p>
    <div style="text-align: center;">
      <a href="${APP_URL}/track/${ticketNumber}" class="btn">View Report Details</a>
    </div>
  `;

  await sendEmail(email, `Update on your report ${ticketNumber}`, baseEmailTemplate('Report Update', content));
}

export async function sendWelcomeEmail(email: string, name: string) {
  const content = `
    <h2 style="font-family: 'Sora', sans-serif; color: #1E3A8A; font-size: 20px; margin-top: 0;">You're ready to go!</h2>
    <p>Hi ${name},</p>
    <p>Your email has been successfully verified. You are now a full member of the CivicFix community.</p>
    <p>You can now report potholes, track local repairs, and engage with your local government.</p>
    <div style="text-align: center;">
      <a href="${APP_URL}/dashboard" class="btn">Go to Dashboard</a>
    </div>
  `;

  await sendEmail(email, 'Welcome to CivicFix!', baseEmailTemplate('Welcome', content));
}

export async function sendSlaBreachEmail(email: string, name: string, ticketNumber: string) {
  const content = `
    <h2 style="font-family: 'Sora', sans-serif; color: #DC2626; font-size: 20px; margin-top: 0;">SLA Breach Alert</h2>
    <p>Hi ${name},</p>
    <p>Ticket <strong>${ticketNumber}</strong> has breached its SLA deadline.</p>
    <p>Please review the ticket and take immediate action.</p>
    <div style="text-align: center;">
      <a href="${APP_URL}/dashboard" class="btn" style="background-color: #DC2626;">View Ticket</a>
    </div>
  `;

  await sendEmail(email, `SLA Breach: Ticket ${ticketNumber}`, baseEmailTemplate('SLA Breach Alert', content));
}

export async function sendSlaWarningEmail(email: string, name: string, ticketNumber: string, hoursRemaining: number) {
  const content = `
    <h2 style="font-family: 'Sora', sans-serif; color: #EA580C; font-size: 20px; margin-top: 0;">SLA Warning Alert</h2>
    <p>Hi ${name},</p>
    <p>Ticket <strong>${ticketNumber}</strong> is at risk of breaching its SLA.</p>
    <p>It has less than ${hoursRemaining} hours remaining. Please review the ticket.</p>
    <div style="text-align: center;">
      <a href="${APP_URL}/dashboard" class="btn" style="background-color: #EA580C;">View Ticket</a>
    </div>
  `;

  await sendEmail(email, `SLA Warning: Ticket ${ticketNumber} at risk`, baseEmailTemplate('SLA Warning Alert', content));
}
