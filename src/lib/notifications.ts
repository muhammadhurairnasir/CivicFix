/**
 * src/lib/notifications.ts
 *
 * Central notification dispatcher that combines:
 *   - MongoDB Notification document creation
 *   - Socket.io real-time emit
 *   - Firebase push notification (if user has FCM token)
 *   - Email (optional, per call)
 */

import { connectDB } from '@/lib/db';
import { Notification } from '@/models';
import User from '@/models/User';
import { NotificationType, UserRole } from '@/types';
import { emitNewNotification } from '@/lib/socket/emitters';
import { sendPushNotification, sendPushToMultiple } from '@/lib/firebase/admin';
import {
  sendStatusUpdateEmail,
  sendSlaBreachEmail,
  sendSlaWarningEmail,
  sendTicketAssignedEmail,
  sendNewCommentEmail,
} from '@/lib/email';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  reportId?: string;
  ticketId?: string;
  sendEmail?: boolean;
  emailFn?: () => Promise<void>;
}

interface UserWithContact {
  _id: string;
  email: string;
  name: string;
  fcmToken?: string;
}

// ─── Core Dispatcher ──────────────────────────────────────────────────────────

export async function sendNotification(data: NotificationData): Promise<void> {
  await connectDB();

  const { userId, type, title, body, reportId, ticketId, sendEmail, emailFn } = data;

  // 1. Persist to MongoDB
  const notification = await Notification.create({
    userId,
    type,
    title,
    body,
    ...(reportId && { reportId }),
    ...(ticketId && { ticketId }),
  });

  // 2. Real-time Socket.io emit
  emitNewNotification(userId, notification);

  // 3. Firebase push (fire-and-forget, no await needed to block response)
  const user = await User.findById(userId).select('+fcmToken').lean() as UserWithContact | null;
  if (user?.fcmToken) {
    sendPushNotification(user.fcmToken, title, body, {
      type,
      ...(reportId && { reportId }),
      ...(ticketId && { ticketId: String(ticketId) }),
    }).catch((err) => console.error('[notifications] push error:', err));
  }

  // 4. Email (optional)
  if (sendEmail && emailFn) {
    emailFn().catch((err) => console.error('[notifications] email error:', err));
  }
}

// ─── Specialized Dispatchers ──────────────────────────────────────────────────

/**
 * Notify a citizen that their report's status changed
 */
export async function notifyStatusChange(
  report: { _id: string; title: string; ticketNumber: string; reporterId: { _id: string; name: string; email: string } },
  newStatus: string,
  oldStatus: string
): Promise<void> {
  const statusLabel = newStatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const reporter = report.reporterId;

  await sendNotification({
    userId: String(reporter._id),
    type: NotificationType.REPORT_UPDATED,
    title: `Report Status Changed: ${report.ticketNumber}`,
    body: `Your report "${report.title}" status changed from ${oldStatus.replace(/_/g, ' ')} to ${statusLabel}.`,
    reportId: String(report._id),
    sendEmail: true,
    emailFn: () => sendStatusUpdateEmail(reporter.email, reporter.name, report.ticketNumber, newStatus),
  });
}

/**
 * Notify a crew member they have been assigned a ticket
 * Notify the citizen that crew has been assigned
 */
export async function notifyTicketAssigned(
  ticket: { _id: any; priority?: string; slaDeadline?: Date },
  crewUser: { _id: any; name: string; email: string },
  report: { _id: any; title: string; ticketNumber: string; address: string; type?: string; severity?: string; ward?: string; description?: string; reporterId: { _id: any; name: string; email: string } }
): Promise<void> {
  const reporter = report.reporterId;

  await Promise.all([
    // Notify crew
    sendNotification({
      userId: String(crewUser._id),
      type: NotificationType.TICKET_ASSIGNED,
      title: `New Ticket Assigned: ${report.ticketNumber}`,
      body: `You have been assigned to repair: "${report.title}" at ${report.address}.`,
      reportId: String(report._id),
      ticketId: String(ticket._id),
      sendEmail: true,
      emailFn: () => sendTicketAssignedEmail(
        crewUser.email,
        crewUser.name,
        report.ticketNumber,
        report.title,
        report.address,
        ticket.priority || 'P3_NORMAL',
        ticket.slaDeadline || new Date()
      ),
    }),
    // Notify citizen
    sendNotification({
      userId: String(reporter._id),
      type: NotificationType.REPORT_UPDATED,
      title: `Your report is being actioned: ${report.ticketNumber}`,
      body: `A crew has been assigned to your report "${report.title}". Work will begin soon.`,
      reportId: String(report._id),
      sendEmail: true,
      emailFn: () => sendStatusUpdateEmail(reporter.email, reporter.name, report.ticketNumber, 'in_progress'),
    }),
  ]);
}

/**
 * Notify the citizen and/or crew of a ticket status change
 */
export async function notifyTicketStatusChange(
  ticket: { _id: any; assignedTo?: any },
  report: { _id: any; title: string; ticketNumber: string; reporterId: { _id: any; name: string; email: string } },
  newStatus: string
): Promise<void> {
  const reporter = report.reporterId;
  const isCompleted = newStatus === 'completed';
  const statusLabel = newStatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  await sendNotification({
    userId: String(reporter._id),
    type: isCompleted ? NotificationType.REPORT_RESOLVED : NotificationType.REPORT_UPDATED,
    title: isCompleted
      ? `Report Resolved: ${report.ticketNumber}`
      : `Report Update: ${report.ticketNumber}`,
    body: `Your report "${report.title}" is now: ${statusLabel}.`,
    reportId: String(report._id),
    ticketId: String(ticket._id),
  });
}

/**
 * Notify a single crew member they were reassigned or removed
 */
export async function notifyTicketReassigned(
  crewUserId: string,
  crewEmail: string,
  crewName: string,
  ticket: { _id: any; priority?: string; slaDeadline?: Date },
  report: { _id: any; title: string; ticketNumber: string; address: string },
  isNewCrew: boolean
): Promise<void> {
  if (isNewCrew) {
    await sendNotification({
      userId: crewUserId,
      type: NotificationType.TICKET_ASSIGNED,
      title: `Ticket Assigned: ${report.ticketNumber}`,
      body: `You have been assigned to "${report.title}" at ${report.address}.`,
      reportId: String(report._id),
      ticketId: String(ticket._id),
      sendEmail: true,
      emailFn: () => sendTicketAssignedEmail(
        crewEmail,
        crewName,
        report.ticketNumber,
        report.title,
        report.address,
        ticket.priority || 'P3_NORMAL',
        ticket.slaDeadline || new Date()
      ),
    });
  } else {
    await sendNotification({
      userId: crewUserId,
      type: NotificationType.SYSTEM,
      title: `Ticket Reassigned: ${report.ticketNumber}`,
      body: `You have been removed from ticket "${report.title}". It has been reassigned.`,
      reportId: String(report._id),
      ticketId: String(ticket._id),
    });
  }
}

/**
 * Notify all admins of an SLA breach
 */
export async function notifySlaBreached(
  ticket: any,
  report: { ticketNumber: string; title: string; _id: string },
  adminUsers: UserWithContact[]
): Promise<void> {
  // Build push tokens list
  const tokens = adminUsers.filter((a) => !!a.fcmToken).map((a) => a.fcmToken!);

  // Create DB notifications + socket emits for each admin
  await Promise.all(
    adminUsers.map((admin) =>
      sendNotification({
        userId: String(admin._id),
        type: NotificationType.SLA_BREACHED,
        title: `SLA Breach: ${report.ticketNumber}`,
        body: `Ticket for "${report.title}" has breached its SLA deadline.`,
        reportId: String(report._id),
        ticketId: String(ticket._id),
        sendEmail: true,
        emailFn: () => sendSlaBreachEmail(admin.email, admin.name, report.ticketNumber),
      })
    )
  );

  // Batch push for all admins (more efficient than individual sends)
  if (tokens.length > 0) {
    sendPushToMultiple(tokens, `SLA Breach: ${report.ticketNumber}`, `Ticket for "${report.title}" has breached its SLA.`, {
      type: NotificationType.SLA_BREACHED,
      reportId: String(report._id),
    }).catch(console.error);
  }
}

/**
 * Notify all admins of an upcoming SLA warning
 */
export async function notifySlaWarning(
  ticket: any,
  report: { ticketNumber: string; title: string; _id: string },
  adminUsers: UserWithContact[],
  hoursRemaining: number
): Promise<void> {
  await Promise.all(
    adminUsers.map((admin) =>
      sendNotification({
        userId: String(admin._id),
        type: NotificationType.SLA_WARNING,
        title: `SLA Warning: ${report.ticketNumber}`,
        body: `Ticket for "${report.title}" is at risk. Less than ${hoursRemaining}h remaining.`,
        reportId: String(report._id),
        ticketId: String(ticket._id),
        sendEmail: true,
        emailFn: () => sendSlaWarningEmail(admin.email, admin.name, report.ticketNumber, hoursRemaining),
      })
    )
  );
}

/**
 * Notify the reporter when a new comment is posted (if it's not their own comment)
 */
export async function notifyNewComment(
  comment: { _id: any; text: string; isOfficial: boolean },
  commenterUser: { _id: any; name: string },
  report: { _id: any; title: string; ticketNumber: string; reporterId: { _id: any; name: string; email: string } }
): Promise<void> {
  const reporter = report.reporterId;

  // Don't notify the reporter if they are the ones who commented
  if (String(reporter._id) === String(commenterUser._id)) {
    return;
  }

  await sendNotification({
    userId: String(reporter._id),
    type: NotificationType.REPORT_UPDATED,
    title: comment.isOfficial ? `Official Update: ${report.ticketNumber}` : `New Comment: ${report.ticketNumber}`,
    body: `${commenterUser.name} commented: "${comment.text.substring(0, 50)}${comment.text.length > 50 ? '...' : ''}"`,
    reportId: String(report._id),
    sendEmail: true,
    emailFn: () => sendNewCommentEmail(
      reporter.email,
      reporter.name,
      commenterUser.name,
      comment.isOfficial,
      comment.text,
      report.ticketNumber,
      report.title
    ),
  });
}
