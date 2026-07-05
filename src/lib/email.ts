import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { render } from '@react-email/render';

import WelcomeEmail from '@/emails/WelcomeEmail';
import VerifyEmailTemplate from '@/emails/VerifyEmailTemplate';
import PasswordResetEmail from '@/emails/PasswordResetEmail';
import ReportStatusEmail from '@/emails/ReportStatusEmail';
import TicketAssignedEmail from '@/emails/TicketAssignedEmail';
import SlaBreachEmail from '@/emails/SlaBreachEmail';
import NewCommentEmail from '@/emails/NewCommentEmail';

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

const FROM_EMAIL = 'CivicFix <noreply@civicfix.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ─── Core Send Function ───────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string, text: string) {
  try {
    if (useResend && resend) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html,
        text,
      });
    } else if (transporter) {
      await transporter.sendMail({
        from: FROM_EMAIL,
        to,
        subject,
        html,
        text,
      });
    } else {
      console.warn('⚠️ No email provider configured. Logging email instead:');
      console.log(`[EMAIL] To: ${to}\n[EMAIL] Subject: ${subject}\n[EMAIL] HTML length: ${html.length}`);
    }
  } catch (err) {
    console.error('[Email] Failed to send email:', err);
    // Never throw — email failures should not break the API
  }
}

// ─── Email Types ──────────────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verifyLink = `${APP_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  
  const html = await render(VerifyEmailTemplate({ name, verifyUrl: verifyLink }));
  const text = `Hi ${name}, welcome to CivicFix! Please verify your email by opening this link: ${verifyLink}`;

  await sendEmail(email, 'Verify your CivicFix account', html, text);
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const resetLink = `${APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  
  const html = await render(PasswordResetEmail({ name, resetUrl: resetLink }));
  const text = `Hi ${name}, reset your password using this link: ${resetLink}. If you didn't request this, ignore this email.`;

  await sendEmail(email, 'Reset your CivicFix password', html, text);
}

export async function sendWelcomeEmail(email: string, name: string) {
  const loginUrl = `${APP_URL}/login`;
  
  const html = await render(WelcomeEmail({ name, loginUrl }));
  const text = `Welcome to CivicFix, ${name}! You are now ready to report and track issues. Login here: ${loginUrl}`;

  await sendEmail(email, 'Welcome to CivicFix!', html, text);
}

export async function sendStatusUpdateEmail(email: string, name: string, ticketNumber: string, newStatus: string) {
  const reportUrl = `${APP_URL}/track/${ticketNumber}`;
  
  const html = await render(ReportStatusEmail({
    name,
    ticketNumber,
    newStatus,
    reportTitle: 'Your Report', // Ideally we'd pass this, but fallback is fine
    address: 'View online for details',
    reportUrl,
  }));
  const text = `Hi ${name}, there is an update on your report ${ticketNumber}. The new status is ${newStatus}. Track it here: ${reportUrl}`;

  await sendEmail(email, `Update on your report ${ticketNumber}`, html, text);
}

export async function sendTicketAssignedEmail(
  email: string, 
  crewName: string, 
  ticketNumber: string, 
  reportTitle: string,
  address: string,
  priority: string,
  slaDeadline: Date
) {
  const dashboardUrl = `${APP_URL}/crew`;
  
  const html = await render(TicketAssignedEmail({
    crewName,
    ticketNumber,
    reportTitle,
    address,
    priority,
    slaDeadline: slaDeadline.toLocaleString(),
    dashboardUrl,
  }));
  const text = `Hi ${crewName}, you have been assigned ticket ${ticketNumber} (${reportTitle}) at ${address}. Please check your dashboard.`;

  await sendEmail(email, `New Ticket Assigned: ${ticketNumber}`, html, text);
}

export async function sendSlaBreachEmail(email: string, name: string, ticketNumber: string, reportTitle: string = 'Unknown') {
  const dashboardUrl = `${APP_URL}/admin/tickets`;
  
  const html = await render(SlaBreachEmail({
    adminName: name,
    dashboardUrl,
    breachedTickets: [{
      ticketNumber,
      reportTitle,
      assignedTo: 'N/A',
      hoursOverdue: 'SLA Breached',
    }]
  }));
  const text = `⚠️ SLA Breach Alert: Ticket ${ticketNumber} has breached its deadline. Please check the admin dashboard.`;

  await sendEmail(email, `⚠️ SLA Breach: Ticket ${ticketNumber}`, html, text);
}

export async function sendSlaWarningEmail(email: string, name: string, ticketNumber: string, hoursRemaining: number) {
  // We reuse the SLA Breach template for warnings for now, or just send a text version
  const dashboardUrl = `${APP_URL}/admin/tickets`;
  
  const html = await render(SlaBreachEmail({
    adminName: name,
    dashboardUrl,
    breachedTickets: [{
      ticketNumber,
      reportTitle: 'Approaching SLA Deadline',
      assignedTo: 'N/A',
      hoursOverdue: `Due in ${hoursRemaining}h`,
    }]
  }));
  const text = `SLA Warning: Ticket ${ticketNumber} has ${hoursRemaining} hours remaining. Please check the admin dashboard.`;

  await sendEmail(email, `SLA Warning: Ticket ${ticketNumber} at risk`, html, text);
}

export async function sendNewCommentEmail(
  email: string,
  name: string,
  commenterName: string,
  isOfficial: boolean,
  commentText: string,
  ticketNumber: string,
  reportTitle: string
) {
  const reportUrl = `${APP_URL}/track/${ticketNumber}`;
  
  const html = await render(NewCommentEmail({
    name,
    commenterName,
    isOfficial,
    commentText,
    ticketNumber,
    reportTitle,
    reportUrl,
  }));
  const text = `Hi ${name}, ${commenterName} commented on your report: "${commentText}". View it here: ${reportUrl}`;

  await sendEmail(email, `New comment on your report ${ticketNumber}`, html, text);
}
