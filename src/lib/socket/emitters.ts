import { emitToUser, emitToRole, emitToReport } from './server';
import { SOCKET_EVENTS } from './events';
import { UserRole } from '@/types';

// Depending on your mongoose models, you might want to import INotification and ITicket types
// import { INotification } from '@/models/Notification';
// import { ITicket } from '@/models/Ticket';

export function emitNewNotification(userId: string, notification: any): void {
  emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_NEW, notification);
}

export function emitReportStatusChange(reportId: string, status: string, ticketNumber?: string): void {
  emitToReport(reportId, SOCKET_EVENTS.REPORT_STATUS_CHANGED, { status, ticketNumber });
}

export function emitTicketAssigned(crewUserId: string, ticket: any): void {
  emitToUser(crewUserId, SOCKET_EVENTS.TICKET_ASSIGNED, ticket);
}

export function emitTicketStatusChange(reportId: string, crewUserId: string, status: string): void {
  emitToReport(reportId, SOCKET_EVENTS.TICKET_STATUS_CHANGED, { crewUserId, status });
}

export function emitNewComment(reportId: string, comment: any): void {
  emitToReport(reportId, SOCKET_EVENTS.COMMENT_NEW, comment);
}

export function emitUpvoteUpdate(reportId: string, upvoteCount: number, upvoted?: boolean): void {
  emitToReport(reportId, SOCKET_EVENTS.REPORT_UPVOTE_UPDATED, { upvoteCount, upvoted });
}

export function emitSlaBreachAlert(ticket: any): void {
  emitToRole(UserRole.ADMIN, SOCKET_EVENTS.SLA_BREACH, ticket);
}

export function emitStatsUpdate(summaryData: any): void {
  emitToRole(UserRole.ADMIN, SOCKET_EVENTS.STATS_UPDATED, summaryData);
}
