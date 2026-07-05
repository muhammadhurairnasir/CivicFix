export const SOCKET_EVENTS = {
  NOTIFICATION_NEW: 'notification:new',
  REPORT_STATUS_CHANGED: 'report:status_changed',
  REPORT_UPVOTE_UPDATED: 'report:upvote_updated',
  TICKET_ASSIGNED: 'ticket:assigned',
  TICKET_STATUS_CHANGED: 'ticket:status_changed',
  COMMENT_NEW: 'comment:new',
  SLA_BREACH: 'sla:breach',
  SLA_WARNING: 'sla:warning',
  STATS_UPDATED: 'stats:updated',
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
